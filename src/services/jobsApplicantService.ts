import { ZoomService } from "@src/chatModule/service/room";
import { APPLICANT_STAGE, APPLICANT_STATUS, JOBSEEKER_RATTING_TYPE, JOB_APPLICANT_TYPE, JOB_SEEKER_ASSESSMENT_STATUS, PAGE_SIZE, SEARCH_APPLICANT_TYPE } from "@src/config";
import { logger } from "@src/middleware";
import HttpException from "@src/middleware/exceptions/httpException";
import JobsModel from "@src/models/jobs";
import JobApplicantsModel from "@src/models/job_applicants";
import JobAssessmentsModel from "@src/models/job_assessments";
import { getOrderForApplicant } from "@src/utils/jobUtils";
import moment from "moment";
import { raw, transaction } from "objection";

export default class JobsApplicantService {
  public async getApplicantsByEmployer(
    employerId: number, jobId?: number,
    jobseekerId = null, searchType = "", q = "", orderNo = 0, page = 0, pageSize = PAGE_SIZE.Jobs, assessments = []
  ): Promise<any> {
    try {
      const orderArray = getOrderForApplicant(orderNo);
      const selects = [
        "job_applicants.id",
        "job_applicants.job_id",
        "job_applicants.asking_salary",
        "job_applicants.asking_salary_type",
        "job_applicants.asking_benefits",
        "job_applicants.bookmarked",
        "job_applicants.note",
        "job_applicants.job_sekker_id",
        "job_applicants.assessments_result",
        "job_applicants.stage",
        "job_applicants.scheduleTime",
        "job_applicants.group_id",
        "job_applicants.can_view_profile",
        "job_applicants.can_rate_stars",
        "job_applicants.status",
        "job_applicants.type",
        "jobs.title",
        "jobs.expired_at",
        "jobs.city_name",
        "jobs.state_name",
        "JS.profile_picture as job_seeker_profile_picture",
        "JS.first_name as job_seeker_first_name",
        "JS.last_name as job_seeker_last_name",
        "JSR.rate as job_seeker_rate",
        "JS.user_responsive as job_seeker_user_responsive",
        "jobs.is_private as job_is_private",
        "JS.is_deleted as jobseeker_is_deleted",
        "JS.is_user_deleted as jobseeker_is_user_deleted",
        "JS.status as jobseeker_user_status"
      ];
      let query = JobApplicantsModel.query()
        .join("jobs", "job_applicants.job_id", "jobs.id")
        .join("users as JS", "job_applicants.job_sekker_id", "JS.id")
        .leftJoin("job_seeker_rating as JSR", conditions => {
          conditions.on("JSR.job_id", "jobs.id")
            .andOn("JSR.job_seeker_id", "job_applicants.job_sekker_id")
            .andOnIn("JSR.type", [JOBSEEKER_RATTING_TYPE.Applicant])
            .andOn("JSR.reporter_id", "job_applicants.employer_id")
        })
        .where("job_applicants.employer_id", employerId)
        .where("jobs.is_deleted", 0)
        .where("JS.is_deleted", 0);
      if (assessments.length > 0) {
        //	(select weight from job_seeker_assessments where assessment_id in ('1158573') and job_seeker_id = users.id and weight is not null) as weight_0,
        assessments.map(async (assessment: JobAssessmentsModel, index) => {
          const select = await raw(`(select weight from job_seeker_assessments where assessment_id = ${assessment.assessment_id}` +
            ` and job_seeker_id = JS.id and status = ${JOB_SEEKER_ASSESSMENT_STATUS.Taked}) as weight_${assessment.assessment_id}`);
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
      } else {
        selects.push("job_applicants.total_point");
      }
      if (jobseekerId != null && jobseekerId) {
        query = query.where("job_applicants.job_sekker_id", jobseekerId);
      } else {
        if (q) {
          query = query.where(builder => builder.
            where("jobs.title", "like", `%${q}%`)
            .orWhere("jobs.desciption", "like", `%${q}%`)
          );
        }
        switch (searchType) {
          case SEARCH_APPLICANT_TYPE.Bookmark:
            query = query.where("job_applicants.bookmarked", 1);
            break;
          case SEARCH_APPLICANT_TYPE.Removed:
          case SEARCH_APPLICANT_TYPE.Withdrawn:
            query = query.where("job_applicants.status", APPLICANT_STATUS.Inactive);
            break;
          default:
            break;
        }
      }
      query = jobId ? query.where("job_applicants.job_id", jobId) : query;
      // query = categoryIds && categoryIds.length > 0 ? query.whereIn("jobs.jobs_category_ids", categoryIds) : query;
      const jobApplicantModels = await query.select(selects)
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
      jobApplicantModels.results = jobApplicantModels.results.map((applicant: any) => {
        applicant.job_assessments = [];
        try {
          applicant.job_assessments = JSON.parse(applicant.assessments_result);
        } catch (err) {
          logger.error(JSON.stringify(err));
        }
        return applicant;
      });
      return jobApplicantModels;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getApplicantsByJobSeeker(
    employerId: number, jobId: number,
    jobseekerId: number, orderNo = 0, page = 0, pageSize = PAGE_SIZE.Jobs,
  ): Promise<any> {
    try {
      const orderArray = getOrderForApplicant(orderNo);

      let query = JobApplicantsModel.query()
        .select([
          "job_applicants.id",
          "job_applicants.job_id",
          "job_applicants.asking_salary",
          "job_applicants.asking_benefits",
          "job_applicants.bookmarked",
          "job_applicants.note",
          "job_applicants.job_sekker_id",
          "job_applicants.total_point",
          "job_applicants.assessments_result",
          "job_applicants.stage",
          "job_applicants.scheduleTime",
          "job_applicants.group_id",
          "job_applicants.can_view_profile",
          "job_applicants.can_rate_stars",
          "jobs.title",
          "jobs.expired_at",
          "jobs.city_name",
          "jobs.state_name",
          "JS.profile_picture as job_seeker_profile_picture",
          "JS.first_name as job_seeker_first_name",
          "JS.last_name as job_seeker_last_name",
          "JS.rate as job_seeker_rate",
          "JS.user_responsive as job_seeker_user_responsive",
          "JS.is_deleted as jobseeker_is_deleted",
          "JS.is_user_deleted as jobseeker_is_user_deleted",
          "JS.status as jobseeker_user_status",
        ])
        .join("jobs", "job_applicants.job_id", "jobs.id")
        .join("users as JS", "job_applicants.job_sekker_id", "JS.id")
        .where("job_applicants.job_sekker_id", jobseekerId)
        .where("jobs.is_deleted", 0)
        .where("JS.is_deleted", 0);
      if (employerId != null && employerId) {
        query = query.where("job_applicants.employer_id", employerId)
      }
      query = jobId ? query.where("job_id", jobId) : query;
      const jobApplicantModels = await query
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
      // jobApplicantModels.results = jobApplicantModels.results.map((applicant: any) => {
      //   applicant.job_assessments = [];
      //   try {
      //     applicant.job_assessments = JSON.parse(applicant.assessments_result);
      //   } catch (err) {
      //     logger.error(JSON.stringify(err));
      //   }
      //   return applicant;
      // });
      return jobApplicantModels;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async applyJobBySeeker(jobObject: JobApplicantsModel, isInvited = false, chatOwnerId = null): Promise<JobApplicantsModel> {
    try {
      const zoomService = new ZoomService(null, null);
      const jobApplicantExist = new JobApplicantsModel();
      jobApplicantExist.job_sekker_id = jobObject.job_sekker_id;
      jobApplicantExist.job_id = jobObject.job_id;
      const jobAppl = await JobApplicantsModel.query().findOne(jobApplicantExist);
      if (jobAppl) {
        if (!isInvited) {
          jobAppl.status = APPLICANT_STATUS.Active;
          jobAppl.asking_salary = jobObject.asking_salary;
          jobAppl.asking_salary_type = jobObject.asking_salary_type;
          jobAppl.asking_benefits = jobObject.asking_benefits;
          if (jobObject.can_view_profile) {
            jobAppl.can_view_profile = jobObject.can_view_profile;
          }
          jobAppl.type = JOB_APPLICANT_TYPE.Applicant;
          await JobApplicantsModel.query().updateAndFetchById(jobAppl.id, jobAppl);
        }
      } else {
        const scrappy = await transaction(JobApplicantsModel,
          async jobApplicantModel => {
            jobObject.type = isInvited ? JOB_APPLICANT_TYPE.InvitedCandidate : JOB_APPLICANT_TYPE.Applicant;
            await jobApplicantModel.query().delete().where("job_id", jobObject.job_id)
              .where("job_sekker_id", jobObject.job_sekker_id);
            const jobApplicant = await jobApplicantModel.query().insert(jobObject);
            // add group chat
            if (!chatOwnerId) { chatOwnerId = jobObject.employer_id; }
            const groupObj = await zoomService.getOrCreateGroup(null, chatOwnerId, jobObject.job_id, jobObject.employer_id, jobObject.job_sekker_id);
            jobObject.group_id = groupObj.groupInfo.id;
            await jobApplicantModel.query().updateAndFetchById(jobApplicant.id, jobObject);
          });
        logger.info("apply/invite job");
        logger.info(JSON.stringify(scrappy));
      }
      this.updateTotalApplicantForJob(jobObject.job_id);
      return jobObject;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async updateGroupToJobApplicant(): Promise<any> {
    try {
      const zoomService = new ZoomService(null, null);
      const applicants = await JobApplicantsModel.query().where("group_id", null);
      applicants.forEach(async app => {
        if (app.group_id) { return; }
        const groupObj = await zoomService.getOrCreateGroup(null, app.employer_id, app.job_id, app.employer_id, app.job_sekker_id);
        await JobApplicantsModel.query().updateAndFetchById(app.id, { group_id: groupObj.groupInfo.id });
      });
      return true;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async drawJobBySeeker(applicant_id: number, job_id: number): Promise<any> {
    try {
      const objectModel = { status: APPLICANT_STATUS.Inactive } as JobApplicantsModel;
      await JobApplicantsModel.query().updateAndFetchById(applicant_id, objectModel);
      this.updateTotalApplicantForJob(job_id);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getApplicantOfJobSeekerByJobId(jobId: number, jobSeekerId: number): Promise<JobApplicantsModel> {
    try {
      return JobApplicantsModel.query().select().where("job_id", jobId).where("job_sekker_id", jobSeekerId).first();
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getApplicantOfEmployerById(applicantId: number, employerId: number): Promise<JobApplicantsModel> {
    try {
      return JobApplicantsModel.query().select().where("id", applicantId).where("employer_id", employerId).first();
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateApplicant(applicantId: number, note: string, stage = APPLICANT_STAGE.Pending, scheduleTime: string): Promise<JobApplicantsModel> {
    try {
      const applicant = new JobApplicantsModel();
      if (note != undefined) {
        applicant.note = note;
      }
      if (stage != APPLICANT_STAGE.Pending) {
        applicant.stage = stage;
      }
      if (scheduleTime) {
        applicant.scheduleTime = moment(scheduleTime).utc().format("YYYY-MM-DD HH:mm:ss");
      }else applicant.scheduleTime = null;
      const result = await JobApplicantsModel.query().patchAndFetchById(applicantId, applicant);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async update(applicantId: number, objectUpdate: JobApplicantsModel): Promise<JobApplicantsModel> {
    try {
      const result = await JobApplicantsModel.query().patchAndFetchById(applicantId, objectUpdate);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async bookmarkApplicant(applicantId: number, bookmarked: number): Promise<any> {
    try {
      return JobApplicantsModel.query().update({ bookmarked }).where("id", applicantId);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateTotalApplicantForJob(jobId: number): Promise<any> {
    try {
      const response = await JobApplicantsModel.query().select(raw("count(*) as total_applicants"))
        .where("job_id", jobId)
        .where("status", APPLICANT_STATUS.Active)
        .where("type", JOB_APPLICANT_TYPE.Applicant).first();
      return JobsModel.query().update({ total_applicants: (response["total_applicants"] || 0) }).where("id", jobId);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobSeekerByJobId(jobSeekerId: number, jobId: number): Promise<JobApplicantsModel[]> {
    try {
      return JobApplicantsModel.query()
        .where("job_id", jobId)
        .where("job_sekker_id", jobSeekerId).limit(1);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getAssessmentsForJobSeekerByJobId(jobSeekerId: number, jobId: number): Promise<any[]> {
    try {
      return JobAssessmentsModel.query().select([
        "job_assessments.jobs_id",
        "job_assessments.assessment_id",
        "A.name",
        "job_assessments.point as job_assessments_point",
        "JS.current_testStatus",
        "JS.status",
        "JS.totalTake",
        "JS.weight",
        raw("((job_assessments.point * JS.weight) / 100)  as job_seeker_point")
      ])
        .leftJoin("job_seeker_assessments as JS", s => {
          s.on("job_assessments.assessment_id", "JS.assessment_id")
            // .andOn(raw("JS.status = ?", JOB_SEEKER_ASSESSMENT_STATUS.Taked))
            .andOn(raw("JS.job_seeker_id = ?", jobSeekerId));
        })
        .join("assessments as A", "job_assessments.assessment_id", "A.assessment_id")
        .where("job_assessments.jobs_id", jobId);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobDetailByGroupChatId(groupId: number): Promise<any> {
    try {
      return JobApplicantsModel.query().select([
        "jobs.title",
        "jobs.desciption",
        "job_applicants.scheduleTime",
        "job_applicants.stage"
      ])
        .leftJoin("jobs", "job_applicants.job_id", "jobs.id")
        .where("job_applicants.group_id", groupId)
        .where("jobs.is_deleted", 0)
        .first();
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getApplicantsByJob(
    jobId?: number,
    page = 0,
    pageSize = PAGE_SIZE.Jobs
  ): Promise<any> {
    try {
      return JobApplicantsModel.query()
        .select([
          "job_applicants.id",
          "job_applicants.job_id",
          "job_applicants.asking_salary",
          "job_applicants.asking_benefits",
          "job_applicants.job_sekker_id as job_seeker_id",
          "job_applicants.total_point",
          "job_applicants.assessments_result",
          "job_applicants.stage",
          "JS.chat_group_id as group_id",
          "job_applicants.status",
          "jobs.title",
          "jobs.expired_at",
          "jobs.city_name",
          "jobs.state_name",
          "JS.profile_picture as job_seeker_profile_picture",
          "JS.first_name as job_seeker_first_name",
          "JS.last_name as job_seeker_last_name"
        ])
        .join("jobs", "job_applicants.job_id", "jobs.id")
        .join("users as JS", "job_applicants.job_sekker_id", "JS.id")
        .where("jobs.id", jobId)
        .where("jobs.is_deleted", 0)
        .where("JS.is_deleted", 0);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
}

export class JobseekerFollowEmployersService {
  public async getFollowByJobseeker(
    employerId: number, jobId: number,
    jobseekerId: number, orderNo = 0, page = 0, pageSize = PAGE_SIZE.Jobs,
  ): Promise<any> {
    try {
      const orderArray = ['', ''];

      let query = JobApplicantsModel.query()
        .select([
          "job_seeker_follow_employers.*",
          "C.profile_picture",
          "CP.company_name"
        ])
        .join("users as C", "job_seeker_follow_employers.job_sekker_id", "C.id")
        .leftJoin("company as CP", "C.company_id", "CP.id")
        .where("C.is_deleted", 0);
      if (employerId != null && employerId) {
        query = query.where("job_applicants.employer_id", employerId)
      }
      query = jobId ? query.where("job_id", jobId) : query;
      const jobApplicantModels = await query
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
      return jobApplicantModels;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async update(applicantId: number, objectUpdate: JobApplicantsModel): Promise<JobApplicantsModel> {
    try {
      const result = await JobApplicantsModel.query().patchAndFetchById(applicantId, objectUpdate);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async delete(applicantId: number, objectUpdate: JobApplicantsModel): Promise<JobApplicantsModel> {
    try {
      const result = await JobApplicantsModel.query().patchAndFetchById(applicantId, objectUpdate);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
}