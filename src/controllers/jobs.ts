import { ACCOUNT_TYPE, JOB_STATUS, PAGE_SIZE, SEARCH_JOB_TYPE } from "@src/config";
import { COMMON_ERROR, COMMON_SUCCESS, JOB_MESSAGE, USER_MESSAGE } from "@src/config/message";
import { logger } from "@src/middleware";
import { badRequest, forbidden, ok } from "@src/middleware/response";
import AssessmentsModel from "@src/models/assessments";
import JobsModel from "@src/models/jobs";
import JobAssessmentsModel from "@src/models/job_assessments";
import JobBookmarksModel from "@src/models/job_bookmarks";
import JobCateforiesModel from "@src/models/job_categories";
import UserModel from "@src/models/user";
import JobsService from "@src/services/jobsService";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import { get, set } from "lodash";
import moment from "moment";
export default class JobsController {

  // -------------------------------------------------------------
  // Start category Feature
  public async getJobCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      let result = await jobService.getJobCategories();
      if (user && user.acc_type == ACCOUNT_TYPE.Employer) {
        result = result.filter(x => x.id != 1);
        const custom = {
          id: 1,
          name: "My Custom Assessment(s)"
        } as unknown as JobCateforiesModel
        result.unshift(custom);
      } else {
        result = result.filter(x => x.id != 1);
      }
      // res.status(200).send(user);
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getJobLevels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"];
      const jobService = new JobsService();
      const result = await jobService.getJobLevels();
      // res.status(200).send(user);
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getRequireAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobService = new JobsService();
      const params = req.params;
      const user = req["currentUser"];
      // const results = [];
      logger.info(JSON.stringify(user.id));
      const results = await jobService.getAssessMents(parseInt(params.id), user);
      if(!results || results.length <= 0) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
        //getAssessmentCategory
      const updateResults = await Promise.all(
        results.map(async (assessment: AssessmentsModel) => {
          assessment['categories'] = await jobService.getAssessmentCategory(assessment.id);
          return assessment;
        })
      )
      return ok(updateResults, req, res);
    } catch (err) {
      next(err);
    }
  }
  // -------------------------------------------------------------
  // end category Feature

  // -------------------------------------------------------------
  // Start JOB Feature
  public async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const msValidate = new MsValidate();
      const assessments = req.body.assessments as JobAssessmentsModel[];
      let newJob;
      delete req.body.assessments;
      const body = get(req, "body", {});
      // validate asssemssment
      let assessmentParams;
      if (body.type == "draft" && !assessments) assessmentParams = [];
      else assessmentParams = await msValidate.validateCreateJobAssessments(assessments) || [];

      // check title
      // dont need check title
      // if (body.title) {
      //   const isExisted = await jobService.getJobByName(user.id, body.title);
      //   if (isExisted) { return badRequest({ message: JOB_MESSAGE.titleExists }, req, res); }
      // }
      // process if draft
      if (body.type == "draft") {
        logger.info("draft");
        delete body.type;
        const nbrProp = Object.keys(body).length;
        if (nbrProp == 0) { return badRequest({ message: "Create Failed" }, req, res); }
        body.employer_id = user.id;
        body.status = JOB_STATUS.Draft;
        newJob = await jobService.createJob(body, assessmentParams);
        logger.info("newjob");
        logger.info(JSON.stringify(newJob));
        return ok({ message: "Created sucess" }, req, res);
      }
      if (!assessments || assessments.length == 0) {
        return badRequest({ message: JOB_MESSAGE.assessmentRequired }, req, res);
      }
      delete body.type;
      body.employer_id = user.id;
      const jobParams = await msValidate.validateCreateJobs(body) as JobsModel;
      // make it paid
      // should save payment job to new table cart
      jobParams.status = JOB_STATUS.UnPaid;
      // const paymentSercice = new PaymentsService();
      // paymentSercice.buyJob(jobParams);
      if (jobParams.is_private && !jobParams.private_applicants) {
        jobParams.private_applicants = 1;
      }
      // end
      newJob = await jobService.createJob(jobParams, assessmentParams);
      logger.info("newjob");
      logger.info(JSON.stringify(newJob));
      return ok({ message: "Created sucess" }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async duplicateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const msValidate = new MsValidate();
      set(req, "body.employer_id", user.id);
      delete req.body.assessments;
      const jobId = get(req, "params.id", 0);
      const currentJob = await jobService.getJobByIdEmployerId(jobId, user.id);
      if (!currentJob) { return badRequest({ message: JOB_MESSAGE.jobNotExists }, req, res); }
      const duplicateJob = new JobsModel();
      duplicateJob.title = currentJob.title;
      duplicateJob.salary = currentJob.salary;
      duplicateJob.desciption = currentJob.desciption;
      duplicateJob.benefits = currentJob.benefits;
      duplicateJob.jobs_level_id = currentJob.jobs_level_id;
      duplicateJob.jobs_category_ids = currentJob.jobs_category_ids;
      duplicateJob.nbr_open = currentJob.nbr_open;
      duplicateJob.employer_id = currentJob.employer_id;
      duplicateJob.city_name = currentJob.city_name;

      duplicateJob.state_name = currentJob.state_name;
      duplicateJob.status = JOB_STATUS.Draft;
      duplicateJob.is_private = currentJob.is_private;
      duplicateJob.salary_type = currentJob.salary_type;
      duplicateJob.bonus = currentJob.bonus;
      duplicateJob.job_fall_under = currentJob.job_fall_under;
      duplicateJob.percent_travel = currentJob.percent_travel;
      duplicateJob.specific_percent_travel_type = currentJob.specific_percent_travel_type;
      duplicateJob.schedule_job = currentJob.schedule_job;
      duplicateJob.employment_type = currentJob.employment_type;
      if (currentJob.is_private) {
        duplicateJob.private_applicants = currentJob.private_applicants;
      }
      // update expired_days
      if (!currentJob.is_private) {
        if (!currentJob.expired_days) {
          if (!currentJob.paid_at || !currentJob.expired_at) {
            const expiredDays = Math.round(moment(currentJob.expired_at).diff(moment(currentJob.paid_at), 'days', true));
            duplicateJob.expired_days = expiredDays;
          }
        } else {
          duplicateJob.expired_days = currentJob.expired_days;
        }
      }
      const assessments = await jobService.getJobAssessmentByJobId(jobId);
      const duplicateAssessments = (await assessments).map((asm: any) => {
        return {
          point: asm.point,
          assessment_id: asm.assessment_id,
          assessment_type: asm.assessment_type
        };
      });
      const assessmentParams = await msValidate.validateCreateJobAssessments(duplicateAssessments);
      // const jobParams = await msValidate.validateCreateJobs(duplicateJob);
      const newjob = await jobService.createJob(duplicateJob, assessmentParams);
      logger.info("newjob");
      logger.info(JSON.stringify(newjob));
      return ok({ message: "Created sucess" }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const msValidate = new MsValidate();
      const assessments = req.body.assessments as JobAssessmentsModel[];
      set(req, "body.employer_id", user.id);
      const jobId = get(req, "params.id", 0);
      const currentJob = await jobService.getJobByIdEmployerId(jobId, user.id);
      if (!currentJob) { return badRequest({ message: JOB_MESSAGE.jobNotExists }, req, res); }
      delete req.body.assessments;
      if (currentJob.status == JOB_STATUS.Draft) {
        // do something
      }
      let assessmentParams;
      if (req.body.type == "draft" && !assessments) assessmentParams = [];
      else assessmentParams = await msValidate.validateCreateJobAssessments(assessments);
      // if (currentJob.title.toLowerCase() != req.body.title.toLowerCase()) {
      //   const isExisted = await jobService.getJobByName(user.id, req.body.title);
      //   if (isExisted) { return badRequest({ message: JOB_MESSAGE.titleExists }, req, res); }
      // }
      // process if draft
      if (req.body.type == "draft") {
        logger.info("draft");
        delete req.body.type;
        req.body.id = jobId;
        const newJob = await jobService.updateJob(req.body, assessmentParams);
        logger.info("updateJob");
        logger.info(JSON.stringify(newJob));
        return ok({ message: "updateJob success" }, req, res);
      }

      if (!assessments || assessments.length == 0) {
        return badRequest({ message: JOB_MESSAGE.assessmentRequired }, req, res);
      }
      const jobParams = await msValidate.validateCreateJobs(req.body) as JobsModel;
      jobParams.id = jobId;
      if (currentJob.status == JOB_STATUS.Draft) {
        jobParams.status = JOB_STATUS.UnPaid;
        // make it paid in release 2
        // should save payment job to new table cart
        // const paymentService = new PaymentsService();
        // paymentService.buyJob(jobParams);
        // end
      }
      if (jobParams.is_private && !jobParams.private_applicants) {
        jobParams.private_applicants = 1;
      }
      if (currentJob.status == JOB_STATUS.Active) {
        const now = moment().utc();
        const currentExpiredDate = moment.utc(currentJob.expired_at);
        if (currentJob.is_private != 1) {
          if (currentExpiredDate > now) {
            delete jobParams.expired_days;
          } else {
            jobParams.status = JOB_STATUS.UnPaid
          }
        }
      }
      const updateJob = await jobService.updateJob(jobParams, assessmentParams);
      logger.info("updateJob");
      logger.info(JSON.stringify(updateJob));
      return ok({ message: "updated sucess" }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async updateHotJobOrPrivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const msValidate = new MsValidate();
      const jobId = get(req, "params.id", 0);
      const isPrivate = get(req, "body.is_private", 0);
      const currentJob = await jobService.getJobByIdEmployerId(jobId, user.id);
      if (!currentJob) { return badRequest({ message: JOB_MESSAGE.jobNotExists }, req, res); }
      delete req.body.is_private;
      const jobParams = await msValidate.validateUpdateHotJobOrPrivate(req.body, isPrivate) as JobsModel;
      const updateJob = await jobService.updateHotOrPrivateJob(jobId, jobParams);
      return ok(updateJob, req, res);
    } catch (err) {
      next(err);
    }
  }
  // get jobs by job
  public async getJobsByEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Jobs));
      const createDateFrom = req.param("createDateFrom");
      const createDateTo = req.param("createDateTo");
      const location = req.param("location");
      const orderNo = parseInt(req.param("orderNo", 0));
      const searchType = req.param("searchType");
      const category = req.param("category");
      const jobType = req.param("jobType", "").split(",");
      const q = req.param("q");
      const jobService = new JobsService();
      const jobsPagesModel = await jobService.getJobsByEmployer(
        user.id,
        searchType,
        createDateFrom,
        createDateTo,
        location,
        q,
        category,
        orderNo,
        page, pageSize, jobType
      );
      jobsPagesModel.results = await Promise.all(
        jobsPagesModel.results.map(async (job: JobsModel) => {
          const jobAssessments = await jobService.getJobAssessmentByJobId(job.id, true);
          job.job_assessments = jobAssessments;
          return job;
        })
      );
      return ok(jobsPagesModel, req, res);
    } catch (err) {
      next(err);
    }
  }
  // get jobs by job
  public async getJobsCompactByEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Jobs));
      const orderNo = parseInt(req.param("orderNo", 0));
      const isGetJobAssessment = parseInt(req.param("isGetJobAssessment", 1));
      const q = req.param("q");
      const jobService = new JobsService();
      const jobsPagesModel = await jobService.getJobsCompactByEmployer(
        user.id,
        q,
        orderNo,
        page, pageSize, isGetJobAssessment
      );
      return ok(jobsPagesModel, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getJobsByJobSeeker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Jobs));
      // salara per hour
      const salaryFrom = parseFloat(req.param("salaryFrom"));
      const salaryTo = parseFloat(req.param("salaryTo"));
      const city = req.param("city");
      const state = req.param("state");
      const orderNo = parseInt(req.param("orderNo", 8));
      const employerId = parseInt(req.param("employerId", 0));
      const userId = parseInt(req.param("userId", 0));
      const travel = req.param("travel");
      const percentTravelType = req.param("percentTravelType");
      const jobType = req.param("jobType");
      const expiredDate = req.param("expiredDate");
      const jobFallUnder = req.param("jobFallUnder");
      const seniorityLevel = req.param("seniorityLevel");
      const zipcode = req.param("zipcode");
      const lat = req.param("lat");
      const lon = req.param("lon");
      const within = req.param("within");
      let assessments = [];
      const jobService = new JobsService();
      const user = req["currentUser"] as UserModel;
      try {
        if (req.param("assessments")) {
          assessments = JSON.parse(req.param("assessments"));
        }
      } catch (e) {
        console.log(e);
        logger.error(e);
      }
      const q = req.param("q");
      const searchType = req.param("searchType");
      let hotJobs = [];
      let hotJobId = [];
      const jobsApplied = user.id ? await jobService.findApplyJobSeeker(user.id) : [];
      const jobIdsApplied = jobsApplied.length > 0 ? jobsApplied.map(apply => apply.job_id) : [];
      if (page == 0 && orderNo == 6 && (searchType == SEARCH_JOB_TYPE.Default || !searchType)
        && !salaryFrom && !salaryTo && !employerId && !userId && !q && !assessments.length
        && !city && !state && !travel && !percentTravelType
        && !jobType && !expiredDate && !jobFallUnder && !seniorityLevel
        && !lat && !lon && !within && !zipcode) {
        hotJobs = await jobService.getHotJobsByJobSeeker(user.id, jobIdsApplied);
        hotJobId = hotJobs.map(job => job.id);
      }
      const jobsPagesModel = await jobService.getJobsByJobSeeker(
        q,
        JOB_STATUS.Active,
        searchType,
        user.id,
        salaryFrom,
        salaryTo,
        city,
        assessments,
        orderNo,
        page,
        pageSize,
        employerId, userId, hotJobId,
        jobIdsApplied,
        travel,
        percentTravelType,
        jobType,
        expiredDate,
        jobFallUnder,
        seniorityLevel,
        lat, lon, within,
        state, zipcode
      );
      if (hotJobs && hotJobs.length > 0) {
        jobsPagesModel.results = hotJobs.concat(jobsPagesModel.results)
      }
      return ok(jobsPagesModel, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      set(req, "body.employer_id", user.id);
      const jobId = get(req, "params.id", 0);
      const currentJob = await jobService.getJobByIdEmployerId(jobId, user.id);
      if (!currentJob) { return badRequest({ message: JOB_MESSAGE.jobNotExists }, req, res); }
      const deletedJob = await jobService.deleteJob(jobId);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getJobDetailByEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const jobId = get(req, "params.id", 0);
      const currentJob = await jobService.getJobDetailByEmployer(jobId);
      if (!currentJob) {
        return badRequest({ message: "id not valid" }, req, res);
      }
      const jobAssessments = await jobService.getJobAssessmentByJobId(jobId, true);
      currentJob.job_assessments = jobAssessments;
      return ok(currentJob, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getJobDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const jobId = get(req, "params.id", 0);
      const currentJob = await jobService.getJobDetail(jobId, JOB_STATUS.Active);
      if (!currentJob) {
        return badRequest({ message: "id not valid" }, req, res);
      }
      const objectUpdate = new JobsModel();
      objectUpdate.toal_view = currentJob.toal_view + 1;
      if (user && user.acc_type == ACCOUNT_TYPE.JobSeeker) {
        const updateJob = await jobService.updateViewJob(jobId, objectUpdate);
      }
      const jobAssessments = await jobService.getJobAssessmentByJobId(jobId, true);
      currentJob.job_assessments = jobAssessments;
      if (user && user.acc_type == ACCOUNT_TYPE.JobSeeker) {
        const jobsApplied = await jobService.findApplyJobSeeker(user.id);
        const jobIdsApplied = jobsApplied.map(apply => {
          return apply.job_id;
        });
        if (jobIdsApplied) {
          currentJob.is_applied = jobIdsApplied.some(c => c === currentJob.id);
        }
      }
      return ok(currentJob, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getAllJobDraftByEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const jobModelResponse = await jobService.getAllJobDraftByEmployer(user.id);
      return ok(jobModelResponse, req, res);
    } catch (err) {
      next(err);
    }
  }
  // -------------------------------------------------------------
  // END JOB Feature

  // -------------------------------------------------------------
  // Start Bookmark Feature
  public async bookmarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const msValidate = new MsValidate();
      const jobId = get(req, "params.id", 0);
      const type = get(req, "params.type", "follow");
      const currentJob = await jobService.getJobById(jobId);
      if (!currentJob) { return badRequest({ message: JOB_MESSAGE.jobNotExists }, req, res); }
      // console.log(type);
      const currentBookmark = await jobService.findBookmarkId(jobId, user.id);
      if ((type == "follow" && !currentBookmark) || (type != "follow" && currentBookmark)) {
        const newBookmark = new JobBookmarksModel();
        newBookmark.job_id = jobId;
        newBookmark.job_seeker_id = user.id;
        const newReport = await jobService.bookmark(newBookmark, type);

        return ok({ message: "sucess" }, req, res);
      }
      const message = type == "follow" ? "You have bookmarked" : "You haven't bookmarked";
      return badRequest({ message }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async bookmarkIds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const msValidate = new MsValidate();
      const bookmarks = await jobService.findBookmarkJobSeeker(user.id);
      const jobIds = bookmarks.map(bookmark => {
        return bookmark.job_id;
      });
      return ok({ jobIds }, req, res);
    } catch (err) {
      next(err);
    }
  }
  // End Bookmark Feature
  // -------------------------------------------------------------

  public async cities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      let status = JOB_STATUS.Active;
      const searchType = req.param("searchType");
      let jobIds = [];
      let expired_at;
      switch (searchType) {
        case SEARCH_JOB_TYPE.Default:
          break;
        case SEARCH_JOB_TYPE.Expired:
          expired_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
          break;
        case SEARCH_JOB_TYPE.Draft:
          status = JOB_STATUS.Draft;
          break;
        case SEARCH_JOB_TYPE.Applied:
          break;
        case SEARCH_JOB_TYPE.Bookmark:
          if (!user || user.acc_type != ACCOUNT_TYPE.JobSeeker) { return forbidden({ message: "" }, req, res); }
          const bookmarks = await jobService.findBookmarkJobSeeker(user.id);
          jobIds = bookmarks.map(bookmark => {
            return bookmark.job_id;
          });
          break;
        case SEARCH_JOB_TYPE.Hot:
          break;
        case SEARCH_JOB_TYPE.Recommended:
          break;
        default:
          break;
      }
      const companyId = (!user || user.acc_type == ACCOUNT_TYPE.JobSeeker) ? 0 : user.id;
      const cityObjs = jobService.getCities(companyId, status, expired_at, jobIds);
      const stateObjs = jobService.getStates(companyId, status, expired_at, jobIds);
      const results = await Promise.all([cityObjs, stateObjs]);
      const cities = results[0].map(city => city.city_name);
      const states = results[1].map(city => city.state_name);
      return ok({ cities, states }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async report(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const note = req.param("note");
      const reportType = parseInt(req.param("reportType"));
      const jobId = parseInt(req.param("jobId"));
      const companyId = parseInt(req.param("companyId"));
      const result = await jobService.addReportJobs(user.id, companyId, jobId, reportType, note);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobService = new JobsService();
      const name = req.param("name");
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Jobs));
      const city = req.param("city");
      const state = req.param("state");
      const within = req.param("within");
      const lat = req.param("lat");
      const lon = req.param("lon");
      const zipcode = req.param("zipcode");
      const users = await jobService.getCompanies(name, page, pageSize, city, state, within, lat, lon, zipcode);
      return ok(users, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getIndustries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobService = new JobsService();
      const industries = await jobService.getIndustries();
      return ok(industries || [], req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getCompanyDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobService = new JobsService();
      const id = parseInt(req.param("id"));
      const company = await jobService.getCompanyDetail(id);
      if (!company) { return badRequest({ message: USER_MESSAGE.companyNotExists }, req, res); }
      return ok(company, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async updateLatLon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobService = new JobsService();
      // const company = await jobService.updateLatLon();
      // const company = await jobService.getAllCity();
      const company = await jobService.usersUpdateLatLon();
      return ok(company, req, res);
    } catch (err) {
      next(err);
    }
  }
}