import { ACCOUNT_TYPE, APPLICANT_STATUS, ASSESSMENTS_TYPE, EMPLOYMENT_TYPE, JOB_PERCENT_TRAVEL, JOB_SALARY_TYPE, JOB_SEEKER_ASSESSMENT_STATUS, JOB_STATUS, PAGE_SIZE, PROPOSED_CONPENSATION, SEARCH_JOB_TYPE, SENIORITY_LEVEL, USER_STATUS } from "@src/config";
import { JOB_TYPE } from '@src/config/index';
import { logger } from "@src/middleware";
import HttpException from "@src/middleware/exceptions/httpException";
import AssmentAMModel from "@src/models/assessments";
import CategoryAssessmentsModel from "@src/models/category_assessments";
import CompanyModel from "@src/models/company";
import JobsModel, { JobReportsModel } from "@src/models/jobs";
import JobApplicantsModel from "@src/models/job_applicants";
import JobAssessmentsModel from "@src/models/job_assessments";
import JobBookmarksModel from "@src/models/job_bookmarks";
import JobCategoriesModel from "@src/models/job_categories";
import JobLevelsModel from "@src/models/job_levels";
import UserModel from "@src/models/user";
import JobSeekerAssessmentsService from "@src/services/jobSeekerAssessmentsService";
import { getOrder } from "@src/utils/jobUtils";
import Cities from "all-the-cities";
import { cloneDeep, get } from "lodash";
import moment from "moment";
import Objection, { raw, transaction } from "objection";
import UsStates from "us-state-codes";
import Zipcodes from "zipcodes";
import PaymentsService from "./paymentService";
export default class JobsService {

  public async getJobCategories(): Promise<JobCategoriesModel[]> {
    try {
      const result = await JobCategoriesModel.query().select("id", "name").where("status", 1).orderBy("name", "asc");
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobLevels(): Promise<JobLevelsModel[]> {
    try {
      const result = await JobLevelsModel.query().select("id", "name").where("status", 1);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async copyJobsTemplates(id: number, jobsTo: number[]): Promise<any> {
    try {
      const currentJob = await this.getJobById(id);
      const bodyCopy = {
        percent_travel: !currentJob.percent_travel ? "0" : currentJob.percent_travel,
        salary: currentJob?.salary,
        salary_type: currentJob?.salary_type,
        specific_percent_travel_type: currentJob?.specific_percent_travel_type,
        schedule_job: currentJob?.schedule_job,
        benefits: currentJob?.benefits,
        jobs_level_id: currentJob?.jobs_level_id,
        jobs_category_ids: currentJob?.jobs_category_ids,
        nbr_open: currentJob?.nbr_open,
        city_name: currentJob?.city_name,
        state_name: currentJob?.state_name,
        bonus: currentJob?.bonus,
        employment_type: currentJob?.employment_type,
        salary_min: currentJob?.salary_min,
        salary_max: currentJob?.salary_max,
        proposed_conpensation: currentJob?.proposed_conpensation,
        lat: currentJob?.lat,
        lon: currentJob?.lon,
      } as any;
      const results = await Promise.all(
        jobsTo.map(async id => {
          const jobUpdate = await JobsModel.query().updateAndFetchById(id, bodyCopy);
          return jobUpdate;
        })
      )
      return results;
    } catch (err) {
      console.log('err: ', err)
    }
  }
  public async updateClaimedCompanyCrawl(id, claimed): Promise<any> {
    try {
      return CompanyModel.query().update({ is_claimed: claimed }).where("id", id);
    } catch (err) {
      console.log('err: ', err)
    }
  }

  private onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  private groupArrayOfObjects(list, key) {
    return list.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  }

  public async getAssessMents(categoryId: number = 0, user: UserModel): Promise<AssmentAMModel[]> {
    try {
      let query = AssmentAMModel.query().where("status", "Active");
      if (user && user.acc_type == ACCOUNT_TYPE.Employer && !user["admin"]) {
        const employerId = user.employer_id ? user.employer_id : user.id;
        query = query.where(builder =>
          builder.where("assessments.employer_id", employerId));
          // builder.where("assessments.type", ASSESSMENTS_TYPE.IMocha)
            // .orWhere("assessments.employer_id", employerId));
      }
      let orderArray = ["name", "asc"];
      const result = categoryId ? 
        await query.where("category_id", categoryId).select("assessment_id", "name", "category_id", "type", "category_name", "description", "time_limit") 
        : await query.orderBy(orderArray[0], orderArray[1]);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getAssessmentCategory(assessmentId: number = 0): Promise<CategoryAssessmentsModel[]> {
    try {
      let query = await CategoryAssessmentsModel.query().select("category_id").where("assessment_id", assessmentId);
      return query;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateCategory(id: number, userUpdate: any): Promise<JobCategoriesModel> {
    try {
      // userUpdate.updated_at = moment.utc().toString();
      const update = await JobCategoriesModel.query().patchAndFetchById(id, userUpdate);
      return update;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getJobByName(employer_id: number, title: string): Promise<JobsModel> {
    try {
      const newjob = new JobsModel();
      newjob.title = title;
      newjob.employer_id = employer_id;
      const result = await JobsModel.query().findOne(newjob);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobLikeName(employer_id: number, title: string): Promise<number> {
    try {
      const result = await JobsModel.query().where("employer_id", employer_id)
        .where("title", "like", `${title}%`);
      return result.length;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async createJob(jobObject: JobsModel, assessmentObject: JobAssessmentsModel[]): Promise<any> {
    try {
      const scrappy = await transaction(JobsModel, JobAssessmentsModel, async (jobsModel, jobAssessmentsModel) => {
        // update lat, lon from city and state
        if (jobObject.city_name && jobObject.state_name) {
          const coordinates = this.getLatLong(jobObject.city_name, jobObject.state_name);
          if (coordinates && coordinates.length == 2) {
            jobObject.lat = coordinates[0];
            jobObject.lon = coordinates[1];
          }
        }
        const newJob = await jobsModel.query().insert(jobObject);
        // if unpadid => add to cart
        if (newJob.status == JOB_STATUS.UnPaid) {
          const paymentService = new PaymentsService();
          await paymentService.addToCart(newJob.id, newJob.employer_id);
        }
        if (!assessmentObject || assessmentObject.length == 0) { return; }
        const query = await Promise.all(
          assessmentObject.map(async (obj: JobAssessmentsModel) => {
            obj.jobs_id = newJob.id;
            return jobAssessmentsModel.query().insert(obj);
          }));
        return newJob;
      });

      logger.info("create JobAssessmentsModel");
      logger.info(JSON.stringify(scrappy));
      return scrappy;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async updateJob(jobObject: JobsModel, assessmentObject: JobAssessmentsModel[]): Promise<any> {
    try {
      const scrappy = await transaction(JobsModel, JobAssessmentsModel, async (jobsModel, jobAssessmentsModel) => {
        // update job
        // update last, lon from city and state
        if (jobObject.city_name && jobObject.state_name) {
          const coordinates = this.getLatLong(jobObject.city_name, jobObject.state_name);
          if (coordinates && coordinates.length == 2) {
            jobObject.lat = coordinates[0];
            jobObject.lon = coordinates[1];
          }
        }

        const updatedJob = await jobsModel.query().patchAndFetchById(jobObject.id, jobObject);

        if (updatedJob.status == JOB_STATUS.UnPaid) {
          // check add to cart if not
          const paymentService = new PaymentsService();
          await paymentService.addToCart(updatedJob.id, updatedJob.employer_id);
        }
        // delete job assessments
        const numDeleted = await jobAssessmentsModel.query().delete().where("jobs_id", jobObject.id);
        if (!assessmentObject || assessmentObject.length == 0) { return; }
        const query = await Promise.all(
          assessmentObject.map(async (obj: JobAssessmentsModel) => {
            obj.jobs_id = jobObject.id;
            return jobAssessmentsModel.query().insert(obj);
          }));
        return updatedJob;
      });
      logger.info("update JobAssessmentsModel");
      logger.info(JSON.stringify(scrappy));
      return scrappy;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async updateHotOrPrivateJob(jobId: number, objectUbdate: JobsModel): Promise<any> {
    try {
      const updatedJob = await JobsModel.query().updateAndFetchById(jobId, objectUbdate);
      return updatedJob;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async upgradeJob(jobId: number, objectUbdate: JobsModel): Promise<any> {
    try {
      const updatedJob = await JobsModel.query().updateAndFetchById(jobId, objectUbdate);
      return updatedJob;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async updateViewJob(id: number, jobObject: JobsModel): Promise<any> {
    try {
      const updatedJob = await JobsModel.query().findById(id).update(jobObject);
      return updatedJob;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async deleteJob(jobId: number): Promise<any> {
    try {
      logger.info(`delete job ${jobId}`);
      return JobsModel.query().update({ is_deleted: 1 }).where("id", jobId);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async restoreJob(jobId: number): Promise<any> {
    try {
      logger.info(`restore job ${jobId}`);
      return JobsModel.query().update({ is_deleted: 0 }).where("id", jobId);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateStatusMultiJob(jobIds: number[], status: number): Promise<any> {
    try {
      return JobsModel.query().update({ status }).whereIn("id", jobIds);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async deleteMultiJob(jobIds: number[]): Promise<any> {
    try {
      logger.info(`delete job ${jobIds.toString()}`);
      return JobsModel.query().update({ is_deleted: 1 }).whereIn("id", jobIds);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async restoreMultiJob(jobIds: number[]): Promise<any> {
    try {
      logger.info(`restore job ${jobIds.toString()}`);
      return JobsModel.query().update({ is_deleted: 0 }).whereIn("id", jobIds);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getJobAssessmentByJobId(id: number, includeName = false): Promise<JobAssessmentsModel[]> {
    try {
      const query = JobAssessmentsModel.query().where("jobs_id", id);
      if (!includeName) {
        return query;
      }
      return query
        .select("job_assessments.*", "AS.name as assessments_name", "AS.instruction as assessments_instruction")
        .leftJoin("assessments as AS", s => {
          s.on("AS.assessment_id", "job_assessments.assessment_id")
            .andOn("job_assessments.assessment_type", "AS.type");
        });
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobByIdEmployerId(id: number, employerId: number): Promise<JobsModel> {
    try {
      const jobModel = new JobsModel();
      jobModel.id = id;
      jobModel.employer_id = employerId;
      return JobsModel.query().findOne(jobModel);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobById(id: number): Promise<JobsModel> {
    try {
      return JobsModel.query().findById(id);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobCrawlerByName(title: string): Promise<JobsModel[]> {
    try {
      return JobsModel.query().where('title', title).andWhere('is_crawl', 1);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobDetailByEmployer(id: number): Promise<JobsModel> {
    try {
      let query = JobsModel.query().select([
        "jobs.*",
        "JL.name as job_levels_name",
        "JC.name as jobs_category_name",
      ])
        .leftJoin("job_levels as JL", "jobs.jobs_level_id", "JL.id")
        .leftJoin("job_categories as JC", "jobs.jobs_category_ids", "JC.id")
        .join("users as EP", "jobs.employer_id", "EP.id")
        .leftJoin("company as CP", "EP.company_id", "CP.id")
        .where("jobs.id", id)
        .where("jobs.is_deleted", 0);
      return query.first();
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobDetail(id: number, status?: number, isAllowDeleted = false,): Promise<JobsModel> {
    try {
      let query = JobsModel.query().select([
        "jobs.*",
        "JL.name as job_levels_name",
        "JC.name as jobs_category_name",
        "EP.first_name as employer_first_name",
        "EP.last_name as employer_last_name",
        "CP.company_name as employer_company_name",
        "CP.company_size_max as employer_company_size_max",
        "CP.company_size_min as employer_company_size_min",
        "CP.description as employer_description",
        "CP.company_profile_picture as employer_profile_picture",
        "CP.employer_industry as employer_industry",
        "CP.employer_revenue_min",
        "CP.employer_revenue_max",
        "CP.employer_year_founded",
        "CP.employer_company_photo",
        "CP.employer_company_video",
        "CP.employer_ceo_name",
        "CP.employer_ceo_picture",
        "CP.employer_company_url",
        "CP.employer_company_facebook",
        "CP.employer_company_twitter",
        "EP.user_responsive as employer_user_responsive",
        "CP.address_line",
        "CP.state_name as company_state_name",
        "CP.city_name as company_city_name"
      ])
        .leftJoin("job_levels as JL", "jobs.jobs_level_id", "JL.id")
        .leftJoin("job_categories as JC", "jobs.jobs_category_ids", "JC.id")
        .join("users as EP", "jobs.employer_id", "EP.id")
        .leftJoin("company as CP", "EP.company_id", "CP.id")
        .where("jobs.id", id);
      query = status ? query.where("jobs.status", status) : query;
      query = isAllowDeleted ? query : query.where("jobs.is_deleted", 0);
      return query.first();
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // role employer
  public async getInviteJobs(
    employerId: number,
    jobseekerId: number,
    q = "",
    orderNo = 0,
    page = 0, pageSize = PAGE_SIZE.Jobs
  )
    : Promise<any> {
    try {
      // if status = close => query status = active and expired < date.now
      const expired_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
      const orderArray = getOrder(orderNo);
      const selects = [
        "jobs.*",
        "JL.name as job_levels_name",
        "JC.name as jobs_category_name"
      ];
      let query = JobsModel.query()
        .where("jobs.employer_id", employerId)
        .where("jobs.is_deleted", 0)
        .leftJoin("job_levels as JL", "jobs.jobs_level_id", "JL.id")
        .leftJoin("job_categories as JC", "jobs.jobs_category_ids", "JC.id")
      query = query.where("jobs.status", JOB_STATUS.Active)
        .where(builder => builder.
          where("jobs.expired_at", ">", expired_at)
          .orWhere("jobs.is_private", 1)
        );
      if (q) {
        query = query.where(builder => builder.
          where("jobs.title", "like", `%${q}%`)
          .orWhere("jobs.desciption", "like", `%${q}%`)
        );
      }
      const select = await raw(`(select EXISTS(SELECT id FROM job_applicants WHERE ` +
        `job_id = jobs.id and type = 0 and job_sekker_id = ${jobseekerId})) as isApplied`);
      selects.push(select);
      const selectIsInvited = await raw(`(select EXISTS(SELECT id FROM job_applicants WHERE ` +
        `job_id = jobs.id and type = 1 and job_sekker_id = ${jobseekerId})) as isInvited`);
      selects.push(selectIsInvited);
      return query.select(selects)
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobsByEmployer(
    employerId: number,
    searchType = "",
    createDateFrom, createDateTo,
    location,
    q = "",
    category,
    orderNo = 0,
    page = 0, pageSize = PAGE_SIZE.Jobs, jobType = []
  )
    : Promise<any> {
    try {
      // if status = close => query status = active and expired < date.now
      const expired_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
      const orderArray = getOrder(orderNo);
      let query = JobsModel.query()
        .select([
          "jobs.*",
          "JL.name as job_levels_name",
          "JC.name as jobs_category_name"
        ])
        .where("jobs.employer_id", employerId)
        .where("jobs.is_deleted", 0)
        .leftJoin("job_levels as JL", "jobs.jobs_level_id", "JL.id")
        .leftJoin("job_categories as JC", "jobs.jobs_category_ids", "JC.id");
      switch (searchType) {
        case SEARCH_JOB_TYPE.Expired:
          query = query.where("jobs.status", JOB_STATUS.Active).where("jobs.expired_at", "<=", expired_at);
          break;
        case SEARCH_JOB_TYPE.Draft:
          query = query.where(builder =>
            builder.where("jobs.status", JOB_STATUS.Draft)
              .orWhere("jobs.status", JOB_STATUS.UnPaid));
          break;
        case SEARCH_JOB_TYPE.Setting:
          query = query.where(builder =>
            builder.where("jobs.status", JOB_STATUS.Draft)
              .orWhere("jobs.status", JOB_STATUS.UnPaid)
              .orWhere("jobs.status", JOB_STATUS.Active));
          break;
        case SEARCH_JOB_TYPE.All:
          query = query.where("jobs.status", "!=", JOB_STATUS.Inactive)
          break;
        default:
          query = query.where("jobs.status", JOB_STATUS.Active)
            .where(builder => builder.
              where("jobs.expired_at", ">", expired_at)
              .orWhere("jobs.is_private", 1)
            );
          break;
      }
      if (q) {
        query = query.where(builder => builder.
          where("jobs.title", "like", `%${q}%`)
          .orWhere("jobs.desciption", "like", `%${q}%`)
        );
      }
      if (jobType.length) {
        // const jobTypeValue = {};
        if (jobType.includes(JOB_TYPE.Private) && jobType.includes(JOB_TYPE.Public)) {
          return { results: [], total: 0 };
        }
        jobType.forEach(item => {
          switch (item) {
            case JOB_TYPE.Featured:
              // jobTypeValue["is_make_featured"] = 1;
              query = query.where("jobs.is_make_featured", 1);
              break;
            case JOB_TYPE.Private:
              // jobTypeValue["is_private"] = 1;
              query = query.where("jobs.is_private", 1);
              break;
            case JOB_TYPE.Public:
              // jobTypeValue["is_private"] = 0;
              query = query.where("jobs.is_private", 0);
              break;
            case JOB_TYPE.Urgent:
              // jobTypeValue["add_urgent_hiring_badge"] = 1;
              query = query.where("jobs.add_urgent_hiring_badge", 1);
              break;
            default:
              break;
          }
        })
      }

      if (createDateFrom) {
        query = query.where("jobs.created_at", ">=", createDateFrom);
      }
      if (createDateTo) {
        query = query.where("jobs.created_at", "<=", createDateTo);
      }
      if (location) {
        query = query.where("jobs.city_name", location);
      }
      if (category) {
        query = query.where("jobs.jobs_category_ids", category);
      }
      return query
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobsCompactByEmployer(
    employerId: number,
    q = "",
    orderNo = 0,
    page = 0, pageSize = PAGE_SIZE.Jobs, isGetJobAssessment = 1
  )
    : Promise<any> {
    try {
      const orderArray = getOrder(orderNo);
      let query = JobsModel.query()
        .select([
          "jobs.id",
          "jobs.title"
        ])
        .where("jobs.employer_id", employerId)
        .where("jobs.is_deleted", 0)
        .where("jobs.status", JOB_STATUS.Active)
      if (q) {
        query = query.where(builder => builder.
          where("jobs.title", "like", `%${q}%`)
          .orWhere("jobs.desciption", "like", `%${q}%`)
        );
      }
      const jobsPagesModel = await query
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
      jobsPagesModel.results = await Promise.all(
        jobsPagesModel.results.map(async (job: JobsModel) => {
          const jobAssessments = await this.getJobAssessmentByJobId(job.id, true);
          job.job_assessments = jobAssessments;
          return job;
        })
      );
      return jobsPagesModel
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobsByJobSeeker(
    q = "",
    status = JOB_STATUS.Active,
    searchType = "",
    jobSeekerId,
    salaryFrom, salaryTo, city = "",
    assessments = [],
    orderNo = 0,
    page = 0,
    pageSize = PAGE_SIZE.Jobs, employerId = 0, userId = 0,
    ignoreHotJobId = [],
    jobIdsApplied = [],
    travel = "",
    percentTravelType = "",
    jobType = "",
    expiredDate = "",
    jobFallUnder = "",
    seniorityLevel = "",
    lat = "", lon = "", within = "", state = "", zipcode = ""): Promise<any> {
    try {

      const expired_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
      let jobIds = [];
      let selects = [
        "jobs.*",
        "JL.name as job_levels_name",
        "JC.name as jobs_category_name",
        "EP.first_name as employer_first_name",
        "EP.last_name as employer_last_name",
        "CP.company_name as employer_company_name",
        "CP.company_size_max as employer_company_size_max",
        "CP.company_size_min as employer_company_size_min",
        "CP.description as employer_description",
        "CP.company_profile_picture as employer_profile_picture",
        "EP.email as employer_email",
        "EP.user_responsive as employer_user_responsive"
      ];
      let jsas = [];
      // logic best match
      
      const orderArray = getOrder(orderNo, jsas.length);
      let query = JobsModel.query()
        // .select(selects)
        .leftJoin("job_levels as JL", "jobs.jobs_level_id", "JL.id")
        .leftJoin("job_categories as JC", "jobs.jobs_category_ids", "JC.id")
        .join("users as EP", "jobs.employer_id", "EP.id")
        .leftJoin("company as CP", "EP.company_id", "CP.id")
        .where("jobs.status", status)
        .where("jobs.is_deleted", 0)
        .where("EP.is_deleted", 0)
        .where("EP.is_user_deleted", 0);

      if (q) {
        query = this.convertQSearch(query, q);
      }

      if (employerId) {
        query = query.where("CP.id", employerId);
      }
      if (userId) {
        query = query.where("jobs.employer_id", userId);
      }
      //
      if (+within != -1) {
        if (within && parseFloat(within) >= 0 && ((lat && lon) || zipcode)) {
          // search by zipcode
          if (zipcode && !(lat || lon)) {
            lat = '';
            lon = '';
            const loc = Zipcodes.lookup(zipcode);
            // { zip: '90210',
            // latitude: 34.088808,
            // longitude: -118.406125,
            // city: 'Beverly Hills',
            // state: 'CA',
            // country: 'US' }
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
          const sql = `ST_Distance_Sphere (point (jobs.lat, jobs.lon), point (${parseFloat(lat)}, ${parseFloat(lon)})) * 0.000621371192`;
          const select = await raw(`${sql} as distance`);
          selects.push(select);
          query = query.whereRaw(`${sql} <= ${parseFloat(within)}`);
        } else {
          if (city) {
            query = query.where("jobs.city_name", city);
          }
          if (state) {
            query = query.where("jobs.state_name", state);
          }
        }
      }
      if (travel) {
        query = query.where("jobs.percent_travel", travel);
      }
      if (percentTravelType) {
        query = query.where("jobs.specific_percent_travel_type", "=", percentTravelType);
      }
      if (jobType) {
        query = query.where("jobs.employment_type", parseInt(jobType));
      }
      if (expiredDate) {
        query = query.where("jobs.expired_at", "<=", expiredDate);
      }
      if (jobFallUnder) {
        query = query.where("jobs.job_fall_under", jobFallUnder);
      }
      if (seniorityLevel) {
        query = query.where("jobs.jobs_level_id", seniorityLevel);
      }

      if (jobSeekerId) {
        // const jobsApplied = await this.findApplyJobSeeker(jobSeekerId);
        // jobIdsApplied = jobsApplied.map(apply => {
        //   return apply.job_id;
        // });
      }
      // search Type
      switch (searchType) {
        case SEARCH_JOB_TYPE.Bookmark:
          if (!jobSeekerId) throw new HttpException(401, "");
          const bookmarks = await this.findBookmarkJobSeeker(jobSeekerId);
          jobIds = bookmarks.map(bookmark => {
            return bookmark.job_id;
          });
          if (jobIds.length == 0) {
            return { results: [], total: 0 };
          }
          break;
        case SEARCH_JOB_TYPE.Applied:
          if (!jobSeekerId) throw new HttpException(401, "");
          if (jobIdsApplied.length == 0) {
            return { results: [], total: 0 };
          }
          jobIds = jobIdsApplied;
          const select = [
            "JA.scheduleTime as applicant_scheduleTime",
            "JA.stage as applicant_stage",
            "JA.group_id as group_id",
            "JA.can_rate_stars as can_rate_stars",
          ];
          selects = selects.concat(select);
          query = query.join("job_applicants as JA", conditions => {
            conditions.on("jobs.id", "JA.job_id")
              .andOn("JA.job_sekker_id", jobSeekerId)
          })
          break;
        case SEARCH_JOB_TYPE.Hot:
          query = query.where("jobs.is_make_featured", 1)
            .where("jobs.featured_end_date", ">", expired_at)
            .where("jobs.featured_start_date", "<=", expired_at)
            .where("jobs.expired_at", ">=", expired_at)
            .where("jobs.is_private", 0);
          break;
        default:
          // query = query.where(builder => builder.
          //   where("jobs.expired_at", ">", expired_at)
          //   .orWhere("jobs.is_private", 0)
          // );
          const expiredAtAfter5 = moment().utc().add(5, 'minutes').format("YYYY-MM-DD HH:mm:ss");
          query = query.where("jobs.expired_at", ">", expiredAtAfter5)
            .where("jobs.is_private", 0);
          if (ignoreHotJobId.length > 0) {
            query = query.whereNotIn("jobs.id", ignoreHotJobId);
          }
          if (jobIdsApplied.length) {
            query = query.whereNotIn("jobs.id", jobIdsApplied);
          }
          break;
      }

      if (salaryFrom || salaryTo) {
        const queryPerHour = this.genQuerySalaryRange(salaryFrom, salaryTo, JOB_SALARY_TYPE.PerHour, PROPOSED_CONPENSATION.Range);
        const queryPerDay = this.genQuerySalaryRange(salaryFrom, salaryTo, JOB_SALARY_TYPE.PerDay, PROPOSED_CONPENSATION.Range);
        const queryPerWeek = this.genQuerySalaryRange(salaryFrom, salaryTo, JOB_SALARY_TYPE.PerWeek, PROPOSED_CONPENSATION.Range);
        const queryPerMonth = this.genQuerySalaryRange(salaryFrom, salaryTo, JOB_SALARY_TYPE.PerMonth, PROPOSED_CONPENSATION.Range);
        const queryPerYear = this.genQuerySalaryRange(salaryFrom, salaryTo, JOB_SALARY_TYPE.PerYear, PROPOSED_CONPENSATION.Range);
        const whereSalaryRangeTo = `${queryPerHour} or ${queryPerDay} or ${queryPerWeek} or ${queryPerMonth} or ${queryPerYear}`;
        // query = query.orWhereRaw(whereSalaryTo);
        if (salaryFrom) {
          // query = query.where("jobs.salary", ">=", salaryFrom);
          const queryPerHour = this.genQuerySalaryExactRate(salaryFrom, "", JOB_SALARY_TYPE.PerHour, PROPOSED_CONPENSATION.ExactRate);
          const queryPerDay = this.genQuerySalaryExactRate(salaryFrom, "", JOB_SALARY_TYPE.PerDay, PROPOSED_CONPENSATION.ExactRate);
          const queryPerWeek = this.genQuerySalaryExactRate(salaryFrom, "", JOB_SALARY_TYPE.PerWeek, PROPOSED_CONPENSATION.ExactRate);
          const queryPerMonth = this.genQuerySalaryExactRate(salaryFrom, "", JOB_SALARY_TYPE.PerMonth, PROPOSED_CONPENSATION.ExactRate);
          const queryPerYear = this.genQuerySalaryExactRate(salaryFrom, "", JOB_SALARY_TYPE.PerYear, PROPOSED_CONPENSATION.ExactRate);
          const whereSalaryFrom = `(${queryPerHour} or ${queryPerDay} or ${queryPerWeek} or ${queryPerMonth} or ${queryPerYear} or ${whereSalaryRangeTo})`;
          query = query.whereRaw(whereSalaryFrom);
        }
        if (salaryTo) {
          // query = query.where("jobs.salary", "<=", salaryTo);
          // salaryTo is per hour
          const queryPerHour = this.genQuerySalaryExactRate("", salaryTo, JOB_SALARY_TYPE.PerHour, PROPOSED_CONPENSATION.ExactRate);
          const queryPerDay = this.genQuerySalaryExactRate("", salaryTo, JOB_SALARY_TYPE.PerDay, PROPOSED_CONPENSATION.ExactRate);
          const queryPerWeek = this.genQuerySalaryExactRate("", salaryTo, JOB_SALARY_TYPE.PerWeek, PROPOSED_CONPENSATION.ExactRate);
          const queryPerMonth = this.genQuerySalaryExactRate("", salaryTo, JOB_SALARY_TYPE.PerMonth, PROPOSED_CONPENSATION.ExactRate);
          const queryPerYear = this.genQuerySalaryExactRate("", salaryTo, JOB_SALARY_TYPE.PerYear, PROPOSED_CONPENSATION.ExactRate);
          const whereSalaryTo = `(${queryPerHour} or ${queryPerDay} or ${queryPerWeek} or ${queryPerMonth} or ${queryPerYear} or ${whereSalaryRangeTo})`;
          query = query.whereRaw(whereSalaryTo);
        }
      }
      if (jobIds && jobIds.length > 0) {
        query = query.whereIn("jobs.id", jobIds);
      }
      // if (assessments.length) {
      //   // categories = categories.map(category => category.id);
      //   query = query.whereIn("jobs.jobs_category_ids", categories);
      // }
      if (assessments.length > 0) {
        query = query.whereExists(builder =>
          assessments.forEach((assemssmentId: number) => {
            const whereClaues = assemssmentId != -1 ? ["job_assessments.assessment_id", assemssmentId] :
              ["job_assessments.assessment_type", ASSESSMENTS_TYPE.Custom];
            builder = builder.orWhereExists(
              JobAssessmentsModel.query()
                .select("job_assessments.id")
                .whereColumn("job_assessments.jobs_id", "jobs.id")
                .whereColumn(`${whereClaues[0]}`, whereClaues[1])
            )
          })
        );
      }
      // if (categories.length) {
      //   categories = categories.map(category => category.id);
      //   query = query.whereIn("jobs.jobs_category_ids", categories);
      // }

      // const jobsPagesModel = await query
      //   .orderBy(orderArray[0], orderArray[1])
      //   .page(page, pageSize);
      const queryCity = cloneDeep(query);
      const cityObjs = queryCity.distinct('jobs.city_name');
      const jobQueryObjs = query.select(selects).orderBy(orderArray[0], orderArray[1]).page(page, pageSize);
      const results = await Promise.all([cityObjs, jobQueryObjs]);
      const cities = results[0].map(city => city.city_name);
      const jobsPagesModel = results[1];
      jobsPagesModel.results = await Promise.all(
        jobsPagesModel.results.map(async (job: JobsModel) => {
          const jobAssessments = await this.getJobAssessmentByJobId(job.id, true);
          job.job_assessments = jobAssessments;
          if (jobSeekerId) {
            job.is_applied = jobIdsApplied.some(c => c === job.id);
          }
          return job;
        })
      );
      jobsPagesModel['cities'] = cities;
      return jobsPagesModel;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public convertQSearch(query: Objection.QueryBuilder<JobsModel, JobsModel[], JobsModel[]>, q: string) {
    query = query.where(builder => {
      let querybuilder = builder.
        where("jobs.title", "like", `%${q}%`)
        .orWhere("CP.company_name", "like", `%${q}%`)
        .orWhere("jobs.desciption", "like", `%${q}%`);
      const convertQ = q.toLowerCase();
      // employment type
      if (convertQ.includes("fulltime") || convertQ.includes("full-time") || convertQ.includes("full time")) {
        querybuilder = querybuilder.orWhere("jobs.employment_type", EMPLOYMENT_TYPE.FullTime);
      }
      if (convertQ.includes("parttime") || convertQ.includes("part-time") || convertQ.includes("part time")) {
        querybuilder = querybuilder.orWhere("jobs.employment_type", EMPLOYMENT_TYPE.PartTime);
      }
      if (convertQ.includes("contract")) {
        querybuilder = querybuilder.orWhere("jobs.employment_type", EMPLOYMENT_TYPE.Contract);
      }
      if (convertQ.includes("temporary")) {
        querybuilder = querybuilder.orWhere("jobs.employment_type", EMPLOYMENT_TYPE.Temporary);
      }
      if (convertQ.includes("intership")) {
        querybuilder = querybuilder.orWhere("jobs.employment_type", EMPLOYMENT_TYPE.Intership);
      }
      // workplace setting
      if (convertQ.includes("onsite") || convertQ.includes("on-site")) {
        querybuilder = querybuilder.orWhere("jobs.percent_travel", "=", JOB_PERCENT_TRAVEL.OnSite);
      }
      if (convertQ.includes("remote")) {
        querybuilder = querybuilder.orWhere("jobs.percent_travel", "=", JOB_PERCENT_TRAVEL.Remote);
      }
      if (convertQ.includes("hybrid")) {
        querybuilder = querybuilder.orWhere("jobs.percent_travel", "=", JOB_PERCENT_TRAVEL.Hybrid);
      }
      // seniority Level
      if (convertQ.includes("internship") || convertQ.includes("intern")) {
        querybuilder = querybuilder.orWhere("jobs.jobs_level_id", SENIORITY_LEVEL.Internship);
      }
      if (convertQ.includes("entrylevel") || convertQ.includes("entry level")) {
        querybuilder = querybuilder.orWhere("jobs.jobs_level_id", SENIORITY_LEVEL.Entrylevel);
      }
      if (convertQ.includes("associate")) {
        querybuilder = querybuilder.orWhere("jobs.jobs_level_id", SENIORITY_LEVEL.Associate);
      }
      if (convertQ.includes("executive")) {
        querybuilder = querybuilder.orWhere("jobs.jobs_level_id", SENIORITY_LEVEL.Executive);
      }
      if (convertQ.includes("mid senior") || convertQ.includes("mid-senior")) {
        querybuilder = querybuilder.orWhere("jobs.jobs_level_id", SENIORITY_LEVEL.MidSeniorLevel);
      }
      if (convertQ.includes("director")) {
        querybuilder = querybuilder.orWhere("jobs.jobs_level_id", SENIORITY_LEVEL.Director);
      }
      if (convertQ.includes("not applicable") || convertQ.includes("not-applicable")) {
        querybuilder = querybuilder.orWhere("jobs.jobs_level_id", SENIORITY_LEVEL.NotApplicable);
      }
      return querybuilder;
    }
    );
    return query;
  }
  // convert rate/hour to day, week, month, year
  public convertSalary(salary, salaryType = 0) {
    switch (salaryType) {
      case JOB_SALARY_TYPE.PerHour:
        break;
      case JOB_SALARY_TYPE.PerDay:
        salary = salary * 8;
        break;
      case JOB_SALARY_TYPE.PerYear:
        salary = salary * 2080;
        break;
      case JOB_SALARY_TYPE.PerMonth:
        salary = salary * 173.33;
        break;
      case JOB_SALARY_TYPE.PerWeek:
        salary = salary * 40;
        break;
    }
    return `${Math.round((salary + Number.EPSILON) * 100) / 100}`;
  }
  private genQuerySalaryExactRate(salaryFrom = "", salaryTo = "", salaryType = 0, proposedConpensation = PROPOSED_CONPENSATION.ExactRate) {
    const templateQuerySlaryType = `jobs.salary_type = ${salaryType} and jobs.proposed_conpensation = ${proposedConpensation}`;
    const templateQuery = `(jobs.salary [CompareSalary] and ${templateQuerySlaryType})`;
    const salary = this.convertSalary(salaryTo ? salaryTo : salaryFrom, salaryType);
    const compareSalary = salaryTo ? `<= ${salary}` : `>= ${salary}`;
    return templateQuery.replace("[CompareSalary]", compareSalary);
  }
  private genQuerySalaryRange(salaryFrom = "", salaryTo = "", salaryType = 0, proposedConpensation = PROPOSED_CONPENSATION.Range) {
    if (!salaryFrom && !salaryTo) { return ""; }
    const templateQuerySlaryType = `jobs.salary_type = ${salaryType} and jobs.proposed_conpensation = ${proposedConpensation}`;
    if (salaryFrom) {
      salaryFrom = this.convertSalary(salaryFrom, salaryType);
    }
    if (salaryTo) {
      salaryTo = this.convertSalary(salaryTo, salaryType);
    }
    if (salaryFrom && salaryTo) {
      // case 1 from <= min => from <= min and to >= min
      const case1 = `(${salaryFrom} <= jobs.salary_min and ${salaryTo} >= jobs.salary_min)`;
      // case 2 from > min and <= max => from >= min and from <= max
      const case2 = `(${salaryFrom} >= jobs.salary_min and ${salaryFrom} <= jobs.salary_max)`;
      return `(${templateQuerySlaryType} and (${case1} or ${case2}))`;
    }
    // only from
    if (salaryFrom) {
      return `(${templateQuerySlaryType} and ${salaryFrom} <= jobs.salary_max)`;
    }
    // only to
    if (salaryTo) {
      return `(${templateQuerySlaryType} and ${salaryTo} >= jobs.salary_min)`;
    }
  }
  public async getHotJobsByJobSeeker(jobSeekerId = 0, jobIdsApplied = []): Promise<any> {
    try {
      const expired_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
      let jobIds = [];
      let selects = [
        "jobs.*",
        "JL.name as job_levels_name",
        "JC.name as jobs_category_name",
        "EP.first_name as employer_first_name",
        "EP.last_name as employer_last_name",
        "CP.company_name as employer_company_name",
        "CP.company_size_max as employer_company_size_max",
        "CP.company_size_min as employer_company_size_min",
        "CP.description as employer_description",
        "CP.company_profile_picture as employer_profile_picture",
        "EP.email as employer_email"
      ];
      let orderArray = ["featured_end_date", "asc"];
      let jsas = [];
      // logic best match
      let query = JobsModel.query()
        // .select(selects)
        .leftJoin("job_levels as JL", "jobs.jobs_level_id", "JL.id")
        .leftJoin("job_categories as JC", "jobs.jobs_category_ids", "JC.id")
        .join("users as EP", "jobs.employer_id", "EP.id")
        .leftJoin("company as CP", "EP.company_id", "CP.id")
        .where("jobs.status", JOB_STATUS.Active)
        .where("jobs.is_deleted", 0)
        .where("EP.is_deleted", 0)
        .where("EP.is_user_deleted", 0)
        .where("jobs.expired_at", ">", expired_at)
        .where("jobs.is_make_featured", 1)
        .where("jobs.featured_end_date", ">", expired_at)
        .where("jobs.featured_start_date", "<=", expired_at)
        .where("jobs.is_private", 0);
      if (jobSeekerId) {
        const jsaService = new JobSeekerAssessmentsService();
        jsas = await jsaService.getJobsekkerAssessment(jobSeekerId, JOB_SEEKER_ASSESSMENT_STATUS.Taked);
        if (jsas.length > 0) {
          orderArray = ["total_point", "desc"];

          const listWeightPointAss = await JobAssessmentsModel.raw(`
            select JSAC.weight, JA.point as total_point from job_assessments as JA 
            inner join  (select JSA.assessment_id, JSA.assessment_type, JSA.weight from job_seeker_assessments as JSA where
            JSA.status = ${JOB_SEEKER_ASSESSMENT_STATUS.Taked} and JSA.is_deleted=0 and JSA.job_seeker_id =  ${jobSeekerId}) as JSAC ON
            JSAC.assessment_id = JA.assessment_id and JSAC.assessment_type = JA.assessment_type 
            inner join jobs on jobs.id = JA.jobs_id group by (JA.assessment_id)
          `)
          let totalPercent = 100;
          if(listWeightPointAss[0].length > 0){
            let sum = 0;
            listWeightPointAss[0].map(assessment => {
              if(assessment.weight > 0) sum += assessment.total_point;
            });
            totalPercent = sum;
          }

          const select = await raw(`(select SUM((JSAC.weight * JA.point) /${totalPercent}) from job_assessments as JA inner join ` +
            `(select JSA.assessment_id, JSA.assessment_type, JSA.weight from job_seeker_assessments as JSA where` +
            ` JSA.status = ${JOB_SEEKER_ASSESSMENT_STATUS.Taked} and JSA.is_deleted=0 and JSA.job_seeker_id = ${jobSeekerId}) as JSAC ON` +
            ` JSAC.assessment_id = JA.assessment_id and JSAC.assessment_type = JA.assessment_type where JA.jobs_id = jobs.id)` +
            ` as total_point`);
          selects.push(select);
        }
      }
      query = query.select(selects);
      if (jobIdsApplied.length) {
        query = query.whereNotIn("jobs.id", jobIdsApplied);
      }

      let jobsPagesModel = await query
        .orderBy(orderArray[0], orderArray[1])
        .limit(2);
      jobsPagesModel = await Promise.all(
        jobsPagesModel.map(async (job: JobsModel) => {
          const jobAssessments = await this.getJobAssessmentByJobId(job.id, true);
          job.job_assessments = jobAssessments;
          if (jobSeekerId) {
            job.is_applied = jobIdsApplied.some(c => c === job.id);
          }
          return job;
        })
      );
      return jobsPagesModel;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getJobsForAdmin(
    q = "",
    status = JOB_STATUS.Active,
    type = [],
    companyIds = [],
    orderNo = 0, page = 0, pageSize = PAGE_SIZE.Jobs): Promise<any> {
    try {
      const orderArray = getOrder(orderNo);
      let query = JobsModel.query().select([
        "jobs.id",
        "jobs.title",
        "jobs.city_name",
        "jobs.state_name",
        "jobs.status",
        "jobs.expired_at",
        "jobs.is_deleted",
        "jobs.is_make_featured",
        "jobs.is_private",
        "jobs.add_urgent_hiring_badge",
        "EP.first_name as employer_first_name",
        "EP.last_name as employer_last_name",
        "CP.company_name as employer_company_name"
      ])
        .join("users as EP", "jobs.employer_id", "EP.id").join("company as CP", "EP.company_id", "CP.id")
        .where("jobs.is_crawl", null)

      if (status === JOB_STATUS.Closed) {
        query = query.whereRaw("expired_at < UTC_TIMESTAMP()");
      } else {
        query = query.where("jobs.status", status)
          .andWhere(buider => buider
            .whereNull("expired_at")
            .orWhereRaw("expired_at >= UTC_TIMESTAMP()")
          );
      }

      if (q) {
        query = query.where(builder => builder.
          where("jobs.title", "like", `%${q}%`)
          .orWhere("CP.company_name", "like", `%${q}%`));
      }

      if (type.length) {
        // const jobTypeValue = {};
        if (type.includes(JOB_TYPE.Private) && type.includes(JOB_TYPE.Public)) {
          return { results: [], total: 0 };
        }
        type.forEach(item => {
          switch (item) {
            case JOB_TYPE.Featured:
              // jobTypeValue["is_make_featured"] = 1;
              query = query.where("jobs.is_make_featured", 1);
              break;
            case JOB_TYPE.Private:
              // jobTypeValue["is_private"] = 1;
              query = query.where("jobs.is_private", 1);
              break;
            case JOB_TYPE.Public:
              // jobTypeValue["is_private"] = 0;
              query = query.where("jobs.is_private", 0);
              break;
            case JOB_TYPE.Urgent:
              // jobTypeValue["add_urgent_hiring_badge"] = 1;
              query = query.where("jobs.add_urgent_hiring_badge", 1);
              break;
            default:
              break;
          }
        })
      }

      query = companyIds && companyIds.length > 0 ? query.whereIn("jobs.employer_id", companyIds) : query;
      return query.orderBy(orderArray[0], orderArray[1]).page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getJobsCrawlerForAdmin(
    q = "",
    status = JOB_STATUS.Active,
    orderNo = 0, page = 0, pageSize = PAGE_SIZE.Jobs): Promise<any> {
    try {
      const orderArray = getOrder(orderNo);
      let query = JobsModel.query().select([
        "jobs.id",
        "jobs.title",
        "jobs.city_name",
        "jobs.state_name",
        "jobs.status",
        "jobs.expired_at",
        "jobs.is_deleted",
        "jobs.is_make_featured",
        "jobs.is_private",
        "jobs.add_urgent_hiring_badge",
        "EP.first_name as employer_first_name",
        "EP.last_name as employer_last_name",
        "CP.company_name as employer_company_name",
        "jobs.crawl_from",
        "jobs.crawl_url",
        "jobs.is_exclude_company",
        "jobs.is_crawl_text_status",
      ])
        .join("users as EP", "jobs.employer_id", "EP.id")
        .join("company as CP", "EP.company_id", "CP.id")

      if (q) {
        query = query.where(builder => builder.
          where("jobs.title", "like", `%${q}%`)
          .orWhere("CP.company_name", "like", `%${q}%`));
      }

      if (status === JOB_STATUS.Closed) {
        query = query.whereRaw("(jobs.expired_at < UTC_TIMESTAMP())").andWhere('jobs.is_deleted', 0);
      } else {
        query = query.where("jobs.status", status).andWhere('jobs.is_deleted', 0)
          .andWhere(buider => buider
            .whereNull("jobs.expired_at")
            .orWhereRaw("jobs.expired_at >= UTC_TIMESTAMP()")
          );
      }
      return query.where('jobs.is_crawl', 1).orderBy(orderArray[0], orderArray[1]).page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getJobsCrawlerTemplateForAdmin(q = "", employer_id: string, job_id: string): Promise<any> {
    try {
      const orderArray = getOrder(0);
      let query = JobsModel.query().select([
        "jobs.*",
        "JL.name as job_levels_name",
        "JC.name as jobs_category_name",
      ])
        .leftJoin("job_levels as JL", "jobs.jobs_level_id", "JL.id")
        .leftJoin("job_categories as JC", "jobs.jobs_category_ids", "JC.id")
        .where("jobs.is_deleted", 0)
        .andWhere("jobs.employer_id", employer_id)
        .andWhere("jobs.status", JOB_STATUS.Draft)
        .andWhere('jobs.is_crawl', 1)
        .andWhere("jobs.id", "!=", job_id)

      if (q) {
        query = query.where("jobs.title", "like", `%${q}%`);
      }
      return query.orderBy(orderArray[0], orderArray[1]);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getListCompanies(): Promise<any> {
    try {
      return UserModel.query().select([
        "users.id",
        "CP.company_name"
      ])
        .leftJoin("company as CP", "CP.id", "users.company_id")
        .where(buider => buider
          .whereNull("CP.is_crawl")
          .orWhereRaw("CP.is_crawl = 1 and CP.status_crawl = 1")
        )
        .where("users.acc_type", ACCOUNT_TYPE.Employer)
        .where("users.status", USER_STATUS.active);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getAllJobDraftByEmployer(employerId: number): Promise<any> {
    const query = JobsModel.query()
      .select([
        "jobs.*",
        "JL.name as job_levels_name",
        "JC.name as jobs_category_name"
      ])
      .where("jobs.employer_id", employerId)
      .where("jobs.is_deleted", 0)
      .whereIn("jobs.status", [JOB_STATUS.Draft, JOB_STATUS.UnPaid])
      .leftJoin("job_levels as JL", "jobs.jobs_level_id", "JL.id")
      .leftJoin("job_categories as JC", "jobs.jobs_category_ids", "JC.id");
    let jobsPagesModel = await query
      .orderBy("jobs.created_at", "desc");
    jobsPagesModel = await Promise.all(
      jobsPagesModel.map(async (job: JobsModel) => {
        const jobAssessments = await this.getJobAssessmentByJobId(job.id, true);
        job.job_assessments = jobAssessments;
        return job;
      })
    );
    return jobsPagesModel;
  }

  // -------------------------------------------------------------
  // Start Bookmark Feature
  public async bookmark(object: JobBookmarksModel, type = "follow") {
    try {
      if (type == "follow") {
        return JobBookmarksModel.query().insert(object);
      }
      return JobBookmarksModel.query().delete().findOne(object);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findBookmarkId(jobId: number, jobSeekerId: number): Promise<JobBookmarksModel> {
    try {
      const jobBookmark = new JobBookmarksModel();
      jobBookmark.job_id = jobId;
      jobBookmark.job_seeker_id = jobSeekerId;
      return JobBookmarksModel.query().findOne(jobBookmark);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findBookmarkJobSeeker(jobSeekerId: number): Promise<JobBookmarksModel[]> {
    try {
      const jobBookmark = new JobBookmarksModel();
      jobBookmark.job_seeker_id = jobSeekerId;
      return JobBookmarksModel.query().select("job_id").where("job_seeker_id", jobSeekerId);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async findApplyJobSeeker(jobSeekerId: number): Promise<JobApplicantsModel[]> {
    try {
      return JobApplicantsModel.query().select("job_id").where("job_sekker_id", jobSeekerId)
        .where("status", APPLICANT_STATUS.Active);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // -------------------------------------------------------------
  // Start Bookmark Feature

  // -------------------------------------------------------------
  // Start get locations Feature
  public async getCities(
    companyId: number,
    status = JOB_STATUS.Active,
    expired_at = "", jobIds = []): Promise<any> {
    try {
      let query = JobsModel.query().distinct("city_name")
        .where("jobs.status", status)
        .whereNotNull("jobs.city_name");
      if (companyId) {
        query = query.where("jobs.employer_id", companyId);
      }
      if (expired_at) {
        query = query.where("jobs.expired_at", "<", expired_at);
      }
      if (jobIds && jobIds.length > 0) {
        query = query.whereIn("jobs.id", jobIds);
      }
      return query;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getStates(
    companyId: number,
    status = JOB_STATUS.Active,
    expired_at = "", jobIds = []): Promise<any> {
    try {
      let query = JobsModel.query().distinct("state_name")
        .where("jobs.status", status)
        .whereNotNull("jobs.state_name");
      if (companyId) {
        query = query.where("jobs.employer_id", companyId);
      }
      if (expired_at) {
        query = query.where("jobs.expired_at", "<", expired_at);
      }
      if (jobIds && jobIds.length > 0) {
        query = query.whereIn("jobs.id", jobIds);
      }
      return query;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // -------------------------------------------------------------
  public async addReportJobs(reporterId: number, companyId: number, jobId: number, reportType: number, note: string): Promise<JobReportsModel> {
    try {
      const report = new JobReportsModel();
      report.report_type = reportType;
      report.note = note;
      report.reporter_id = reporterId;
      report.company_id = companyId;
      report.job_id = jobId;
      const result = await JobReportsModel.query().insert(report);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getIndustries(): Promise<string[]> {
    try {
      const expiredAtAfter5 = moment().utc().add(5, 'minutes').format("YYYY-MM-DD HH:mm:ss");
      const query = await JobsModel.query()
        .select(["job_fall_under"])
        .whereRaw("job_fall_under != ''")
        .andWhereRaw("job_fall_under is not null")
        .andWhere("status", JOB_STATUS.Active)
        .andWhere("expired_at", ">", expiredAtAfter5)
        .andWhere("is_private", 0)
        .groupBy("job_fall_under");
        
      if(!query || query.length <= 0) return [];
      const results = query.map(job => {
        return job.job_fall_under;
      });
      return results;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getCompanies(
    name = "",
    page = 0, pageSize = PAGE_SIZE.Standand, city = "", state = "", within = "", lat = "", lon = "", zipcode = ""
  )
    : Promise<any> {
    try {
      const selects = [
        "CP.id as company_id",
        "CP.company_name",
        "CP.company_profile_picture"
      ];
      let query = UserModel.query()
        .leftJoin("company as CP", "CP.id", "users.company_id")
        .where("users.acc_type", ACCOUNT_TYPE.Employer)
        .where("users.employer_id", 0)
        .where(buider => buider
          .whereNull("CP.is_crawl")
          .orWhereRaw("CP.is_crawl = 1 and CP.status_crawl = 1")
        )
        .where("users.status", USER_STATUS.active)
        .where("users.is_user_deleted", 0)
      let rawSelectDistinctEmployer = `users.id in (select DISTINCT employer_id from jobs where status = ${JOB_STATUS.Active} and expired_at > UTC_TIMESTAMP()`;
      if (+within != -1) {
        if (within && parseFloat(within) >= 0 && ((lat && lon) || zipcode)) {
          // search by zipcode
          if (zipcode && !(lat || lon)) {
            lat = '';
            lon = '';
            const loc = Zipcodes.lookup(zipcode);
            // { zip: '90210',
            // latitude: 34.088808,
            // longitude: -118.406125,
            // city: 'Beverly Hills',
            // state: 'CA',
            // country: 'US' }
            if (loc) {
              lat = `${loc.longitude}`;
              lon = `${loc.latitude}`;
            }
            if (!lat || !lon) {
              return {
                results: [],
                total: 0
              };
            }
          }
          const sql = `ST_Distance_Sphere (point (lat, lon), point (${parseFloat(lat)}, ${parseFloat(lon)})) * 0.000621371192`;
          // const select = await raw(`${sql} as distance`);
          // selects.push(select);
          rawSelectDistinctEmployer = `${rawSelectDistinctEmployer} and ${sql} <= ${parseFloat(within)})`;
        } else {
          if (city) {
            rawSelectDistinctEmployer = `${rawSelectDistinctEmployer} and city_name = '${city}'`;
            // query = query.where("jobs.city_name", city);
          }
          if (state) {
            rawSelectDistinctEmployer = `${rawSelectDistinctEmployer} and state_name = '${state}'`;
            // query = query.where("jobs.state_name", state);
          }
          rawSelectDistinctEmployer = `${rawSelectDistinctEmployer})`
        }
      } else {
        rawSelectDistinctEmployer = `${rawSelectDistinctEmployer})`
      }
      // .whereIn("users.id", raw(`select DISTINCT employer_id from jobs where status = ${JOB_STATUS.Active} and expired_at < ${expiredAt}`))
      query = query.select(selects).whereRaw(rawSelectDistinctEmployer)
      if (name) {
        query = query.where("CP.company_name", "like", `%${name}%`);
      }
      return query
        // .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getCompanyDetail(id: number): Promise<any> {
    try {
      let query = UserModel.query().select([
        "users.first_name as employer_first_name",
        "users.last_name as employer_last_name",
        "C.company_name as employer_company_name",
        "C.company_size_max as employer_company_size_max",
        "C.company_size_min as employer_company_size_min",
        "C.description as employer_description",
        "C.company_profile_picture as employer_profile_picture",
        "C.employer_industry as employer_industry",
        "C.employer_revenue_min",
        "C.employer_revenue_max",
        "C.employer_year_founded",
        "C.employer_company_photo",
        "C.employer_company_video",
        "C.employer_ceo_name",
        "C.employer_ceo_picture",
        "C.employer_company_url",
        "C.employer_company_facebook",
        "C.employer_company_twitter",
        "users.user_responsive as employer_user_responsive",
        "C.address_line",
        "C.state_name",
        "C.city_name",
        "C.id as employer_id",
      ])
        .leftJoin("company as C", "C.id", "users.company_id")
        .where("C.id", id)
        .where("users.is_user_deleted", 0)
        .where("users.acc_type", ACCOUNT_TYPE.Employer)
        .where("users.employer_id", 0)
        .where("users.status", USER_STATUS.active)
      return query.first();
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async updateLatLon(): Promise<any> {
    try {
      const list = await JobsModel.query().where("lat", null).where("lon", null);
      console.log(list.length);
      const updateList = await Promise.all(
        list.map(async (jobObject: JobsModel) => {
          if (jobObject.city_name && jobObject.state_name) {
            const coordinates = this.getLatLong(jobObject.city_name, jobObject.state_name);
            if (coordinates && coordinates.length == 2) {
              const update = {
                lat: coordinates[0],
                lon: coordinates[1]
              } as JobsModel;
              return JobsModel.query().updateAndFetchById(jobObject.id, update);
            }
          }
          return jobObject;
        })
      );
      return updateList

    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async usersUpdateLatLon(): Promise<any> {
    try {
      const list = await UserModel.query().where("lat", null).where("lon", null);
      console.log(list.length);
      const updateList = await Promise.all(
        list.map(async (user: UserModel) => {
          return this.upateUserLatLon(user);
        })
      );
      return updateList

    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async upateUserLatLon(user: UserModel, userUpdate = null) {
    if (!((user.city_name && user.state_name) || user.zip_code)) {
      return user;
    }
    const coordinates = this.getLatLong(user.city_name, user.state_name, user.zip_code);
    if (coordinates && coordinates.length == 2) {
      const update = {
        lat: coordinates[0],
        lon: coordinates[1]
      } as UserModel;
      return UserModel.query().updateAndFetchById(user.id, update);
    }
    return user;
  }

  public getLatLong(city_name, state_name, zipCode = null) {
    if (zipCode) {
      const loc = Zipcodes.lookup(zipCode);
      if (!loc || loc.latitude) { return []; }
      return [loc.latitude, loc.longitude];
    }
    const cityList = Cities.filter(city => city.name.match(city_name));
    const stateCode = UsStates.getStateCodeByStateName(state_name);
    // const location = [{
    //    cityId: '5454711',
    //    name: 'Albuquerque',
    //    country: 'US',
    //    altCountry: '',
    //    muni: '',
    //    muniSub: '',
    //    featureClass: 'P',
    //    featureCode: 'PPLA2',
    //    adminCode: 'NM',
    //    population: 545852,
    //    loc: {
    //      type: 'Point',
    //      coordinates: [-106.65114, 35.084] 
    //    }
    //  }]
    const location = cityList.find(city => city.adminCode == stateCode);
    const coordinates = get(location, 'loc.coordinates', []);
    return coordinates;
  }
  public getAllCity() {
    const cityList = Cities.filter(city => city.country.match("US"));
    // const location = [{
    //    cityId: '5454711',
    //    name: 'Albuquerque',
    //    country: 'US',
    //    altCountry: '',
    //    muni: '',
    //    muniSub: '',
    //    featureClass: 'P',
    //    featureCode: 'PPLA2',
    //    adminCode: 'NM',
    //    population: 545852,
    //    loc: {
    //      type: 'Point',
    //      coordinates: [-106.65114, 35.084] 
    //    }
    //  }]
    let citiesFilter = cityList.map(city => {
      return {
        name: `${city.name}, ${city.adminCode}`,
        loc: city.loc.coordinates
      }
    });
    citiesFilter = citiesFilter.sort((a, b) => a.name.localeCompare(b.name))
    return citiesFilter;
  }
  public getAllZipcodes() {
    const cityList = Zipcodes.filter(city => city.country.match("US"));

    let citiesFilter = cityList.map(city => {
      return {
        name: `${city.name}, ${city.adminCode}`,
        loc: city.loc.coordinates
      }
    });
    citiesFilter = citiesFilter.sort((a, b) => a.name.localeCompare(b.name))
    return citiesFilter;
  }
}
