import { JOB_STATUS, PAGE_SIZE, SEARCH_JOB_TYPE } from "@src/config";
import { COMMON_SUCCESS, JOB_MESSAGE } from "@src/config/message";
import { logger } from "@src/middleware";
import { badRequest, ok } from "@src/middleware/response";
import JobsModel from "@src/models/jobs";
import JobAssessmentsModel from "@src/models/job_assessments";
import JobsApplicantService from "@src/services/jobsApplicantService";
import JobsService from "@src/services/jobsService";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
export default class AdminJobsController {

  public async gets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = get(req, "body.q", "");
      const companyIds = get(req, "body.companyIds", []);
      const page = get(req, "body.page", 0);
      const pageSize = get(req, "body.pageSize", PAGE_SIZE.Jobs);
      const orderNo = get(req, "body.orderNo", 0);
      const searchType = get(req, "body.searchType", JOB_STATUS.Active);
      const jobType = get(req, "body.jobType", "").split(",");
      const jobsService = new JobsService();
      let jobStatus = JOB_STATUS.Active;
      switch (searchType) {
        case SEARCH_JOB_TYPE.Inactive:
          jobStatus = JOB_STATUS.Inactive;
          break;
        case SEARCH_JOB_TYPE.Expired:
          jobStatus = JOB_STATUS.Closed;
          break;
        case SEARCH_JOB_TYPE.Draft:
          jobStatus = JOB_STATUS.Draft;
          break;
        case SEARCH_JOB_TYPE.UnPaid:
          jobStatus = JOB_STATUS.UnPaid;
        default:
          break;
      }
      const jobs = await jobsService.getJobsForAdmin(
        q,
        jobStatus,
        jobType,
        companyIds,
        orderNo,
        page,
        pageSize
      );
      return ok(jobs, req, res);
    } catch (err) {
      next(err);
    }
  }
  
  public async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let ids = [0];
      try {
        if (req.body.ids) {
          ids = JSON.parse(req.body.ids);
        }
      } catch (e) {
        console.log(e);
        logger.error(e);
      }
      const jobsService = new JobsService();
      await jobsService.deleteMultiJob(ids);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  
  public async restoreJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let ids = [0];
      try {
        if (req.body.ids) {
          ids = JSON.parse(req.body.ids);
        }
      } catch (e) {
        console.log(e);
        logger.error(e);
      }
      const jobsService = new JobsService();
      await jobsService.restoreMultiJob(ids);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async deactiveJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let ids = [0];
      try {
        if (req.body.ids) {
          ids = JSON.parse(req.body.ids);
        }
      } catch (e) {
        console.log(e);
        logger.error(e);
      }
      const jobsService = new JobsService();
      await jobsService.updateStatusMultiJob(ids, JOB_STATUS.Inactive);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async activeJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let ids = [0];
      try {
        if (req.body.ids) {
          ids = JSON.parse(req.body.ids);
        }
      } catch (e) {
        console.log(e);
        logger.error(e);
      }
      const jobsService = new JobsService();
      await jobsService.updateStatusMultiJob(ids, JOB_STATUS.Active);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobService = new JobsService();
      const jobId = get(req, "params.id", 0);
      const msValidate = new MsValidate();
      const assessments = req.body.assessments as JobAssessmentsModel[];
      const currentJob = await jobService.getJobById(jobId);
      delete req.body.assessments;
      if (!currentJob) { return badRequest({ message: JOB_MESSAGE.jobNotExists }, req, res); }
      const jobParams = await msValidate.validateCreateJobs(req.body) as JobsModel;
      const assessmentParams = await msValidate.validateCreateJobAssessments(assessments);
      jobParams.id = jobId;
      if (currentJob.title.toLowerCase() !== jobParams.title.toLowerCase()) {
        const isExisted = await jobService.getJobByName(currentJob.employer_id, jobParams.title);
        if (isExisted) { return badRequest({ message: JOB_MESSAGE.titleExists }, req, res); }
      }
      const updateJob = await jobService.updateJob(jobParams, assessmentParams);
      logger.info("updateJob");
      logger.info(JSON.stringify(updateJob));
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getJobDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobService = new JobsService();
      const jobId = get(req, "params.id", 0);
      const currentJob = await jobService.getJobDetail(jobId, null, true);
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

  public async getListCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobService = new JobsService();
      return ok(await jobService.getListCompanies(), req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getListApplicant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobsApplicantService = new JobsApplicantService();
      const jobId = get(req, "params.jobId", 0);
      const page = get(req, "query.page", 0);
      const pageSize = get(req, "query.pageSize", PAGE_SIZE.Jobs);
      let listApplicants = await jobsApplicantService.getApplicantsByJob(jobId, page, pageSize);
      listApplicants = listApplicants.map((applicant: any) => {
        applicant.job_assessments = [];
        try {
          applicant.job_assessments = JSON.parse(applicant.assessments_result);
        } catch (err) {
          logger.error(JSON.stringify(err));
        }
        return applicant;
      });
      return ok(listApplicants, req, res);
    } catch (err) {
      next(err);
    }
  }
}