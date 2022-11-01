import { ZoomService } from "@src/chatModule/service/room";
import {
  ACCOUNT_TYPE, ASSESSMENTS_TYPE, ASSESSMENT_STATUS, GA_EVENT_ACTION, GA_EVENT_CATEGORY, JOBSEEKER_RATTING_TYPE,
  JOB_SALARY_TYPE, JOB_SEEKER_ASSESSMENT_STATUS,
  JOB_STATUS, NOTIFICATION_TYPE, PAGE_SIZE, USER_STATUS
} from "@src/config";
import { logger } from "@src/middleware";
import HttpException from "@src/middleware/exceptions/httpException";
import FindCandidateLogsModel, { PotentialCandidatesModel } from "@src/models/find_candidate_logs";
import JobApplicantsModel from "@src/models/job_applicants";
import JobAssessmentsModel from "@src/models/job_assessments";
import { default as UserModel } from "@src/models/user";
import UserNotificationModel from "@src/models/user_notifications";
import AnalyticUtils from "@src/utils/analyticUtils";
import { cloneDeep } from "lodash";
import { raw } from "objection";
import Zipcodes from "zipcodes";
import JobsApplicantService from "./jobsApplicantService";
import JobSeekerAssessmentsService from "./jobSeekerAssessmentsService";
import JobsService from "./jobsService";
import NotificationService from "./notification";
import UserBll from "./user";
export default class FindCandidateService {
  constructor() {
  }

  public async addFindCandidateLogs(object: FindCandidateLogsModel): Promise<FindCandidateLogsModel> {
    try {
      const result = await FindCandidateLogsModel.query().insert(object);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public getOrderFindCandidate(orderBy: number, jobseekerId: number, assessments = []) {
    let orders;
    if (!assessments.length) {
      return ["created_at", "desc"];
    }
    switch (orderBy) {
      case 0:
        orders = ["total_point", "desc"];
        break;
      case 1:
        orders = ["total_point", "asc"];
        break;
      default:
        orders = ["total_point", "desc"];
        break;
    }
    return orders;
  }
  public async findCandidate(
    employerId,
    assessments = [],
    maxCompensation = '',
    lat = "", lon = "", within = "", city = "", state = "", zipcode = "",
    orderNo = 0,
    page = 0,
    pageSize = PAGE_SIZE.Standand, jobseekerId = 0, onlyBookmark = 0
  )
    : Promise<any> {
    try {
      const orderArray = this.getOrderFindCandidate(orderNo, jobseekerId, assessments);
      const selects = [
        "users.id", "users.email", "users.status", "users.profile_picture",
        "users.first_name", "users.last_name", "users.address_line",
        "users.asking_salary", "users.asking_salary_type",
        "users.asking_benefits", "users.description", "users.created_at",
        "users.city_name", "users.state_name",
        "PC.chat_group_id",
        "PC.can_view_profile",
        "PC.can_rate_stars",
        "PC.bookmarked",
        "JSR.rate as job_seeker_rate",
      ];
      let query = UserModel.query()
        .where("users.acc_type", ACCOUNT_TYPE.JobSeeker)
        .where("users.status", USER_STATUS.active)
        .where("users.is_user_deleted", 0)
        .where("users.is_deleted", 0)
        .where("users.enable_show_avatar", 1)
        .leftJoin("potential_candidates as PC", s => {
          s.on("PC.job_seeker_id", "users.id")
            .andOn("PC.employer_id", employerId);
        })
        .leftJoin("job_seeker_rating as JSR", conditions => {
          conditions.on("JSR.job_seeker_id", "users.id")
            .andOnIn("JSR.type", [JOBSEEKER_RATTING_TYPE.PotentialCandidate])
            .andOn("JSR.reporter_id", employerId)
        })
      const jsaService = new JobSeekerAssessmentsService();
      // let jsas = await jsaService.getJobsekkerAssessment(jobSeekerId, JOB_SEEKER_ASSESSMENT_STATUS.Taked);
      // solution
      // 	(select weight from job_seeker_assessments where assessment_id in ('1158573') and job_seeker_id = users.id and weight is not null) as weight_1,
      // 	(select weight from job_seeker_assessments where assessment_id in ('1158596') and job_seeker_id = users.id and weight is not null) as weight_2,
      // 	(select weight from job_seeker_assessments where assessment_id in ('1158598') and job_seeker_id = users.id and weight is not null) as weight_3
      // (select if(weight_1 >= 0, weight_1, 0)*50 + if(weight_2 >= 0, weight_2, 0)*30 + if(weight_3 >= 0, weight_3, 0)*20) as total
      // ,(select if(weight_1 >= 0, 50, 0) + if(weight_2 >= 0, 30, 0)+if(weight_3 >= 0, 20, 0)) as total_percent
      // , (select total/total_percent) as total_point
      if (assessments.length > 0) {
        //	(select weight from job_seeker_assessments where assessment_id in ('1158573') and job_seeker_id = users.id and weight is not null) as weight_0,
        assessments.map(async (assessment: JobAssessmentsModel, index) => {
          const select = await raw(`(select weight from job_seeker_assessments where assessment_id = ${assessment.assessment_id}` +
            ` and job_seeker_id = users.id and status = ${JOB_SEEKER_ASSESSMENT_STATUS.Taked}) as weight_${assessment.assessment_id}`);
          selects.push(select);
        })

        let selectTotalString = `(select [IfElements] 0 ) as total`;
        let ffElements = ``;
        // 	(select if(weight_1 >= 0, weight_1, 0)*50 + if(weight_2 >= 0, weight_2, 0)*30 + if(weight_3 >= 0, weight_3, 0)*20) as total
        assessments.map(async (assessment: JobAssessmentsModel, index) => {
          const ifElement = `if(weight_${assessment.assessment_id} >= 0, weight_${assessment.assessment_id}, 0)*${assessment.point} +`;
          ffElements = `${ffElements} ${ifElement}`;
        })
        selectTotalString = selectTotalString.replace("[IfElements]", ffElements);
        selects.push(await raw(selectTotalString));

        let selectTotalPercent = `(select [IfElements] 0 ) as total_percent`;
        let ffElementsPercent = ``;
        // (select if(weight_1 >= 0, 50, 0) + if(weight_2 >= 0, 30, 0)+if(weight_3 >= 0, 20, 0)) as total_percent
        assessments.map(async (assessment: JobAssessmentsModel, index) => {
          const ifElement = `if(weight_${assessment.assessment_id} >= 0, ${assessment.point}, 0) +`;
          ffElementsPercent = `${ffElementsPercent} ${ifElement}`;
        })
        selectTotalPercent = selectTotalPercent.replace("[IfElements]", ffElementsPercent);
        selects.push(await raw(selectTotalPercent));
        // , (select total/total_percent) as total_point
        selects.push(await raw(`(select total/total_percent) as total_point`));
        query = query.whereRaw(`EXISTS(SELECT JSA.id FROM job_seeker_assessments as JSA join assessments as A on A.assessment_id = JSA.assessment_id where JSA.job_seeker_id = users.id and JSA.is_deleted = 0 && JSA.totalTake > 0 and JSA.weight >= 0 and A.status = '${ASSESSMENT_STATUS.Active}' and (A.employer_id = ${employerId} or A.type = ${ASSESSMENTS_TYPE.IMocha}))`);
      }
      if (onlyBookmark) {
        query = query.where("PC.bookmarked", 1);
      }
      if (jobseekerId) {
        query = query.where("users.id", jobseekerId);
      }
      if (+within != -1) {
        if (within && parseFloat(within) >= 0 && ((lat && lon) || zipcode)) {
          // search by zipcode
          if (zipcode && !(lat || lon)) {
            lat = '';
            lon = '';
            const loc = Zipcodes.lookup(zipcode);
            if (loc) {
              lat = `${loc.longitude}`;
              lon = `${loc.latitude}`;
            }
          }
          if (!lat || !lon) {
            return {
              results: [],
              total: 0
            };
          }
          const sql = `ST_Distance_Sphere (point (users.lat, users.lon), point (${parseFloat(lat)}, ${parseFloat(lon)})) * 0.000621371192`;
          const select = await raw(`${sql} as distance`);
          selects.push(select);
          query = query.whereRaw(`${sql} <= ${parseFloat(within)}`);
        } else {
          if (city) {
            query = query.where("users.city_name", city);
          }
          if (state) {
            query = query.where("users.state_name", state);
          }
        }
      }
      // default per year
      if (maxCompensation) {
        const templateQuerySlaryType = `(users.asking_salary_type = [JOB_SALARY_TYPE] and users.asking_salary <= [JOB_SALARY_PRICE])`;
        const perHour = cloneDeep(templateQuerySlaryType).replace("[JOB_SALARY_TYPE]", `${JOB_SALARY_TYPE.PerHour}`).replace('[JOB_SALARY_PRICE]', this.convertSalary(maxCompensation, JOB_SALARY_TYPE.PerHour));
        const perDay = cloneDeep(templateQuerySlaryType).replace("[JOB_SALARY_TYPE]", `${JOB_SALARY_TYPE.PerDay}`).replace('[JOB_SALARY_PRICE]', this.convertSalary(maxCompensation, JOB_SALARY_TYPE.PerDay));
        const perWeek = cloneDeep(templateQuerySlaryType).replace("[JOB_SALARY_TYPE]", `${JOB_SALARY_TYPE.PerWeek}`).replace('[JOB_SALARY_PRICE]', this.convertSalary(maxCompensation, JOB_SALARY_TYPE.PerWeek));
        const perMonth = cloneDeep(templateQuerySlaryType).replace("[JOB_SALARY_TYPE]", `${JOB_SALARY_TYPE.PerMonth}`).replace('[JOB_SALARY_PRICE]', this.convertSalary(maxCompensation, JOB_SALARY_TYPE.PerMonth));
        const PerYear = cloneDeep(templateQuerySlaryType).replace("[JOB_SALARY_TYPE]", `${JOB_SALARY_TYPE.PerYear}`).replace('[JOB_SALARY_PRICE]', this.convertSalary(maxCompensation, JOB_SALARY_TYPE.PerYear));
        const whereMaxCompensation = `(${perHour} or ${perDay} or ${perWeek} or ${perMonth} or ${PerYear})`;
        query = query.whereRaw(whereMaxCompensation);
      }
      return query.select(selects)
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // convert year to other type
  public convertSalary(salary, salaryType = JOB_SALARY_TYPE.PerYear) {
    switch (salaryType) {
      case JOB_SALARY_TYPE.PerHour:
        salary = salary / 2080;
        break;
      case JOB_SALARY_TYPE.PerDay:
        salary = 8 * salary / 2080;
        break;
      case JOB_SALARY_TYPE.PerYear:
        salary = parseFloat(salary);
        // salary = salary * 2080;
        break;
      case JOB_SALARY_TYPE.PerMonth:
        // salary = salary * 173.33;
        salary = 173.33 * salary / 2080;
        break;
      case JOB_SALARY_TYPE.PerWeek:
        // salary = salary * 40;
        salary = 40 * salary / 2080;
        break;
    }
    return `${Math.round((salary + Number.EPSILON) * 100) / 100}`;
  }
  public async makeInvitedJobs(chatOwnerId = null,
    jobseekerId: number,
    jobIds = [],
  ): Promise<any> {
    try {

      const jobService = new JobsService();
      const userService = new UserBll();
      const jobsApplicantService = new JobsApplicantService();
      logger.info("makeInvitedJobs:");
      const query = await Promise.all(
        jobIds.map(async (jobId: number) => {

          const currentJob = await jobService.getJobDetail(jobId, JOB_STATUS.Active);
          const jobSeekerAssessments = await jobsApplicantService.getAssessmentsForJobSeekerByJobId(jobseekerId, jobId);
          let total_point = 0;
          if (jobSeekerAssessments && jobSeekerAssessments.length > 0) {
            total_point = jobSeekerAssessments.map(c => (c.job_seeker_point || 0)).reduce((a, b) => a + b);
          }

          new NotificationService().insert({
            data: new UserNotificationModel({
              user_id: jobseekerId,
              user_acc_type: ACCOUNT_TYPE.JobSeeker,
              type: NOTIFICATION_TYPE.JobseekerIsInvited,
              metadata: JSON.stringify({
                jobDetails: [currentJob].map(e => ({
                  id: e.id,
                  title: e.title,
                  employer_id: e.employer_id,
                  add_urgent_hiring_badge: e.add_urgent_hiring_badge,
                  expired_at: e.expired_at,
                  city_name: e.city_name,
                  state_name: e.state_name,
                  country_name: e.country_name,
                }))[0],
                // jobSeekerAssessments
              }),
            })
          });

          AnalyticUtils.logEvent(GA_EVENT_CATEGORY.NOTIFICATION,GA_EVENT_ACTION.NOTIFICATION_SEND_FIND_CANDIDATES, null, 1);

          const applicantBody = new JobApplicantsModel();
          applicantBody.job_sekker_id = jobseekerId;
          applicantBody.employer_id = currentJob.employer_id;
          applicantBody.job_id = jobId;
          applicantBody.total_point = total_point;
          applicantBody.assessments_result = JSON.stringify(jobSeekerAssessments);
          const jobSeeker = await userService.getById(jobseekerId);
          // if (jobSeeker.enable_show_avatar) {
          //   applicantBody.can_view_profile = 1;
          // }
          const update = await jobsApplicantService.applyJobBySeeker(applicantBody, true, chatOwnerId);
          // socket io join to zoom
          // if (applicantBody.group_id) {
          //   const io = global["io"] as Server;
          //   const zoomJobseeker = `${ZOOM_NAME.InviteJoinZoom}${jobseekerId}`;
          //   const zoomJobEmployer = `${ZOOM_NAME.InviteJoinZoom}${currentJob.employer_id}`;
          //   const event = EMIT_EVENT.OnReceiveInviteJoinZoom;
          //   console.log("zoom: ", zoomJobseeker);
          //   console.log("zoom: ", zoomJobEmployer);
          //   console.log("event: ", event);
          //   const dataEmit = { group_id: applicantBody.group_id }
          //   io.to(zoomJobseeker).emit(event, dataEmit);
          //   io.to(zoomJobEmployer).emit(event, dataEmit);
          // }
          logger.info(`group_id: ${update.group_id}`);
          return update.group_id;
        }));
      logger.info("end map:");
      logger.info(JSON.stringify(query));
      return query;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async bookmarkCandidate(employerId: number,
    jobseekerId: number,
    bookmarked: number
  ): Promise<any> {
    try {
      let objectUpdate = new PotentialCandidatesModel();
      objectUpdate.job_seeker_id = jobseekerId;
      objectUpdate.employer_id = employerId;
      let isExitPotentialTable = await PotentialCandidatesModel.query().findOne(objectUpdate);
      if (!isExitPotentialTable) {
        objectUpdate.bookmarked = bookmarked;
        const potentialCandidate = await PotentialCandidatesModel.query().insert(objectUpdate);
        return potentialCandidate;
      }
      isExitPotentialTable = await PotentialCandidatesModel.query().updateAndFetchById(isExitPotentialTable.id, { bookmarked });
      return isExitPotentialTable;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getPotentialCandidate(employerId: number,
    jobseekerId: number,
  ): Promise<PotentialCandidatesModel> {
    try {
      let objectUpdate = new PotentialCandidatesModel();
      objectUpdate.job_seeker_id = jobseekerId;
      objectUpdate.employer_id = employerId;
      let isExitPotentialTable = await PotentialCandidatesModel.query().findOne(objectUpdate);
      return isExitPotentialTable;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findOrCreatePotentialCandidate(employerId: number,
    jobseekerId: number
  ): Promise<PotentialCandidatesModel> {
    try {
      let isExitPotentialTable = await this.getPotentialCandidate(employerId, jobseekerId);
      if (isExitPotentialTable) { return isExitPotentialTable; }
      return this.addPotentialCandidate(employerId, jobseekerId, false, null);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async addPotentialCandidate(employerId: number,
    jobseekerId: number, isCreateChatGroup = false, chatOwnerId: number
  ): Promise<PotentialCandidatesModel> {
    try {
      const potentialCandidate = new PotentialCandidatesModel();
      potentialCandidate.job_seeker_id = jobseekerId;
      potentialCandidate.employer_id = employerId;
      if (isCreateChatGroup) {
        // add group chat
        const zoomService = new ZoomService(null, null);
        const groupObj = await zoomService.getOrCreateGroup(null, chatOwnerId, 0, employerId, jobseekerId);
        potentialCandidate.chat_group_id = groupObj.groupInfo.id;
      }
      const isExit = await PotentialCandidatesModel.query().insert(potentialCandidate);
      return isExit;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async updatePotentialCandidate(id: number, objectUpdate: PotentialCandidatesModel): Promise<PotentialCandidatesModel> {
    try {
      const isExit = await PotentialCandidatesModel.query().updateAndFetchById(id, objectUpdate);
      return isExit;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async createChatGroupPotentialCandidate(id: number, employerId: number,
    jobseekerId: number, chatOwnerId: number
  ): Promise<PotentialCandidatesModel> {
    try {
      // add group chat
      const zoomService = new ZoomService(null, null);
      const groupObj = await zoomService.getOrCreateGroup(null, chatOwnerId, 0, employerId, jobseekerId);
      return this.updatePotentialCandidate(id, { chat_group_id: groupObj.groupInfo.id } as PotentialCandidatesModel);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }


}
