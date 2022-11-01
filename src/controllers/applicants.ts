import { EMIT_EVENT, ZOOM_NAME } from "@src/chatModule/lib/config";
import { APPLICANT_STAGE, COMMON_STATUS, JOBSEEKER_RATTING_TYPE, JOB_SEEKER_ASSESSMENT_STATUS, JOB_STATUS, TASKSCHEDULE_TYPE } from "@src/config";
import { COMMON_SUCCESS, JOB_MESSAGE } from "@src/config/message";
import { badRequest, ok } from "@src/middleware/response";
import { PotentialCandidatesModel } from "@src/models/find_candidate_logs";
import JobApplicantsModel from "@src/models/job_applicants";
import TaskScheduleModel from "@src/models/task_schedule";
import UserModel from "@src/models/user";
import FindCandidateService from "@src/services/findCandidateService";
import JobsApplicantService from "@src/services/jobsApplicantService";
import JobsService from "@src/services/jobsService";
import UserBll from "@src/services/user";
import MailUtils from "@src/utils/sendMail";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import moment from "moment";
import { Server } from "socket.io";

export default class ApplicantsController {
  //#region Applicant Job
  public async applyJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const jobsApplicantService = new JobsApplicantService();
      // await jobsApplicantService.updateGroupToJobApplicant();
      // return ok({ message: COMMON_SUCCESS.applyJob }, req, res);
      const msValidate = new MsValidate();
      const jobId = get(req, "params.id", 0);
      const currentTime = moment().utc().format("YYYY-MM-DD HH:mm:ss");
      const currentJob = await jobService.getJobDetail(jobId, JOB_STATUS.Active);
      if (!currentJob || currentJob.expired_at < currentTime) {
        return badRequest({ message: JOB_MESSAGE.jobNotExists }, req, res);
      }
      const jobSeekerAssessments = await jobsApplicantService.getAssessmentsForJobSeekerByJobId(user.id, jobId);
      let total_point = 0;
      if (jobSeekerAssessments && jobSeekerAssessments.length > 0) {
        total_point = jobSeekerAssessments.map(c => (c.job_seeker_point || 0)).reduce((a, b) => a + b);
        const totalInprogress = jobSeekerAssessments.filter(jsa =>
          jsa.weight === null && jsa.totalTake > 0 && jsa.current_testStatus == 'In Progress'
        )
        if (totalInprogress.length) {
          return badRequest({ message: JOB_MESSAGE.scoreApplyJobInProgress }, req, res);
        }
        const totalAssessmentValid = jobSeekerAssessments.filter(s =>
          s.job_seeker_point !== null && s.status == JOB_SEEKER_ASSESSMENT_STATUS.Taked).length;
        if (jobSeekerAssessments.length > totalAssessmentValid) {
          return badRequest({ message: JOB_MESSAGE.scoreApplyJobUnavailable }, req, res);
        }
        // ignore logi score apply
        // if (total_point < WEIGHT_SCORE_APPLY) {
        //   return badRequest({ message: JOB_MESSAGE.scoreApplyJobUnavailable }, req, res);
        // }
      }
      const applicantBody = get(req, "body", {}) as JobApplicantsModel;
      applicantBody.job_sekker_id = user.id;

      applicantBody.employer_id = currentJob.employer_id;
      applicantBody.job_id = jobId;
      applicantBody.total_point = total_point;
      applicantBody.assessments_result = JSON.stringify(jobSeekerAssessments);
      let applicantParams = await msValidate.validateApplicant(applicantBody) as JobApplicantsModel;
      await jobsApplicantService.applyJobBySeeker(applicantParams);
      // socket io join to zoom
      if (applicantParams.group_id) {
        const io = global["io"] as Server;
        const zoomJobseeker = `${ZOOM_NAME.InviteJoinZoom}${user.id}`;
        const zoomJobEmployer = `${ZOOM_NAME.InviteJoinZoom}${currentJob.employer_id}`;
        const event = EMIT_EVENT.OnReceiveInviteJoinZoom;
        console.log("zoom: ", zoomJobseeker);
        console.log("zoom: ", zoomJobEmployer);
        console.log("event: ", event);
        const dataEmit = { group_id: applicantParams.group_id }
        io.to(zoomJobseeker).emit(event, dataEmit);
        io.to(zoomJobEmployer).emit(event, dataEmit);
      }

      TaskScheduleModel.query().delete().where({ 'type': TASKSCHEDULE_TYPE.ReminderCompleteApplication, 'user_id': user.id, 'subject_id': currentJob.id }).then();

      // sendmail
      const mailUtil = new MailUtils();
      const userSerive = new UserBll();
      const employerInfo = await userSerive.getById(currentJob.employer_id);
      if (employerInfo && employerInfo.status == COMMON_STATUS.Active && employerInfo.is_deleted == 0 && employerInfo.is_user_deleted == 0) {
        const companyInfo = await userSerive.getCompanyById(employerInfo.company_id);
        if(companyInfo) mailUtil.appliedJob(user.email, user, currentJob, companyInfo).then();
      }
      return ok({ message: COMMON_SUCCESS.applyJob }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async drawJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const jobsApplicantService = new JobsApplicantService();
      const jobId = get(req, "params.id", 0);
      if (!jobId || !user || !user.id) {
        return badRequest({ message: "params not valid" }, req, res);
      }
      const applicant = await jobsApplicantService.getApplicantOfJobSeekerByJobId(jobId, user.id);
      if (!applicant) {
        return badRequest({ message: JOB_MESSAGE.applicantNotExists }, req, res);
      }
      await jobsApplicantService.drawJobBySeeker(applicant.id, jobId);
       // sendmail
       const mailUtil = new MailUtils();
       const jobService = new JobsService();
       const userSerive = new UserBll();
       const employerInfo = await userSerive.getById(applicant.employer_id);
       const currentJob = await jobService.getJobDetail(applicant.job_id, JOB_STATUS.Active);
       const companyInfo = await userSerive.getCompanyById(employerInfo.company_id);
       if(companyInfo) employerInfo['company_name'] = companyInfo.company_name;
       if (employerInfo && currentJob) {
        mailUtil.withdrawnJob(user.email, user, currentJob, employerInfo).then();
       }
      return ok({ message: COMMON_SUCCESS.drawJob }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getJobApplicantByEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const jobsApplicantService = new JobsApplicantService();
      let q = req.param("q");
      // containsEncodedComponents
      if (decodeURI(q) !== decodeURIComponent(q)) {
        q = decodeURIComponent(q);
      }
      const searchType = get(req, "query.searchType");
      const orderNo = parseInt(get(req, "query.orderNo", 0));
      const page = get(req, "query.page", 0);
      const pageSize = get(req, "query.pageSize");
      const jobId = get(req, "query.jobId");
      const jobseekerId = get(req, "query.jobseekerId", 0);
      let assessments = [];
      try {
        if (req.param("assessments")) {
          const q = decodeURIComponent(req.param("assessments")).replace(new RegExp("\\\\", 'g'), "");
          assessments = JSON.parse(q);
        }
      } catch (e) {
        console.log(e);
      }
      const jobsApplicantModel = await jobsApplicantService.getApplicantsByEmployer(
        user.id,
        jobId,
        jobseekerId,
        searchType,
        q,
        orderNo,
        page,
        pageSize,
        assessments
      );
      // const jobsApplicantModel = await jobsApplicantService.updateGroupToJobApplicant();
      return ok(jobsApplicantModel, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getApplicantDetailByJobseeker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const jobsApplicantService = new JobsApplicantService();
      const jobId = get(req, "query.jobId");
      const jobseekerId = user.id;
      const jobsApplicantModel = await jobsApplicantService.getApplicantsByJobSeeker(
        null,
        jobId,
        jobseekerId
      );
      return ok(jobsApplicantModel, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async noteJobApplicant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const applicantId = get(req, "params.id", 0);
      const applicantStage = get(req, "body.stage", APPLICANT_STAGE.Pending);
      const schedule = get(req, "body.schedule", undefined);
      const note = get(req, "body.note", undefined);

      const jobsApplicantService = new JobsApplicantService();
      const applicant = await jobsApplicantService.getApplicantOfEmployerById(applicantId, user.id);
      if (!applicant) {
        return badRequest({ message: JOB_MESSAGE.applicantNotExists }, req, res);
      }
      await jobsApplicantService.updateApplicant(applicantId, note, applicantStage, schedule);
      return ok({ message: COMMON_SUCCESS.noteApplicant }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async bookmarkJobApplicant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const applicantId = get(req, "params.id", 0);
      const bookmark = get(req, "body.bookmark", 0);
      const jobsApplicantService = new JobsApplicantService();
      const applicant = await jobsApplicantService.getApplicantOfEmployerById(applicantId, user.id);
      if (!applicant) {
        return badRequest({ message: JOB_MESSAGE.applicantNotExists }, req, res);
      }
      await jobsApplicantService.bookmarkApplicant(applicantId, bookmark);
      return ok({ message: `${bookmark ? "bookmarked" : "un bookmarked"} applicant success` }, req, res);
    } catch (err) {
      next(err);
    }
  }
  //#endregion

  // rating
  public async ratting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const jobSeekerId = parseInt(get(req, "params.id", 0));
      const rate = parseInt(get(req, "body.rate", 0));
      const jobId = parseInt(get(req, "body.jobId", 0));
      const type = parseInt(get(req, "body.type", JOBSEEKER_RATTING_TYPE.Applicant));
      if (rate > 5 || rate < 1) {
        return badRequest({ message: "rate invalid" }, req, res);
      }
      const userService = new UserBll();
      const result = await userService.addOrUpdateRatting(jobId, jobSeekerId, user.id, rate, type);
      // if (result) {
      //   await userService.updateAvgRattingJobseeker(applicantId);
      // }
      return ok({ message: `Success.` }, req, res);
    } catch (err) {
      next(err);
    }
  }

  // askToView
  public async makeToView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const jobId = parseInt(get(req, "params.jobId", 0));
      const canViewProfile = get(req, "body.canViewProfile", 1);
      const employerId = get(req, "body.employerId", 0);
      const jobsApplicantService = new JobsApplicantService();
      const findCandidateService = new FindCandidateService();
      if (!jobId && employerId) {
        const potential = await findCandidateService.findOrCreatePotentialCandidate(employerId, user.id);
        await findCandidateService.updatePotentialCandidate(potential.id, { can_view_profile: canViewProfile } as PotentialCandidatesModel);
        return ok({ message: `Success.` }, req, res);
      }
      const jobSeekerAssessments = await jobsApplicantService.getJobSeekerByJobId(user.id, jobId);
      if (jobSeekerAssessments.length == 0) {
        return badRequest({ message: JOB_MESSAGE.applicantNotExists }, req, res);
      }
      const objectUpdate = new JobApplicantsModel();
      objectUpdate.can_view_profile = canViewProfile;
      await jobsApplicantService.update(jobSeekerAssessments[0].id, objectUpdate);
      return ok({ message: `Success.` }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async requestUnmask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const id = parseInt(get(req, "params.id", 0));
      const jobsApplicantService = new JobsApplicantService();
      const jobSeekerAssessments = await jobsApplicantService.getApplicantOfEmployerById(id, user.id);
      if (!jobSeekerAssessments) {
        return badRequest({ message: JOB_MESSAGE.applicantNotExists }, req, res);
      }
      if (jobSeekerAssessments.can_view_profile === null) {
        const objectUpdate = new JobApplicantsModel();
        objectUpdate.can_view_profile = -1; // request
        await jobsApplicantService.update(jobSeekerAssessments.id, objectUpdate);
      }

      return ok({ message: `Success.` }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async makeToViewByEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const applicantId = parseInt(get(req, "params.applicantId", 0));
      const canViewProfile = get(req, "body.canViewProfile", 1);
      const jobsApplicantService = new JobsApplicantService();
      const applicant = await jobsApplicantService.getApplicantOfEmployerById(applicantId, user.id);
      if (!applicant) {
        return badRequest({ message: JOB_MESSAGE.applicantNotExists }, req, res);
      }
      const objectUpdate = new JobApplicantsModel();
      objectUpdate.can_view_profile = canViewProfile;
      await jobsApplicantService.update(applicant.id, objectUpdate);
      return ok({ message: `Success.` }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async makeCanRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const applicantId = parseInt(get(req, "params.id", 0));
      const employerId = get(req, "body.employerId", 0);
      const jobsApplicantService = new JobsApplicantService();
      const findCandidateService = new FindCandidateService();
      // potential
      if (!applicantId && employerId) {
        const potential = await findCandidateService.findCandidate(employerId, user.id);
        await findCandidateService.updatePotentialCandidate(potential.id, { can_rate_stars: 1 } as PotentialCandidatesModel);
        return ok({ message: `Success.` }, req, res);
      }

      // applicant
      const applicant = await jobsApplicantService.getApplicantOfEmployerById(applicantId, user.id);
      if (!applicant) {
        return badRequest({ message: JOB_MESSAGE.applicantNotExists }, req, res);
      }
      const objectUpdate = new JobApplicantsModel();
      objectUpdate.can_rate_stars = 1;
      await jobsApplicantService.update(applicant.id, objectUpdate);
      return ok({ message: `success` }, req, res);
    } catch (err) {
      next(err);
    }
  }
}