import { EXCLUDE_CRAWL, FolderPath, JOB_STATUS, PAGE_SIZE, SEARCH_JOB_TYPE, UPLOAD_TYPE } from "@src/config";
import { COMMON_ERROR, COMMON_SUCCESS, JOB_MESSAGE } from "@src/config/message";
import { logger } from "@src/middleware";
import { badRequest, ok } from "@src/middleware/response";
import JobsModel from "@src/models/jobs";
import JobAssessmentsModel from "@src/models/job_assessments";
import UserModel from "@src/models/user";
import JobsApplicantService from "@src/services/jobsApplicantService";
import JobsService from "@src/services/jobsService";
import TaskScheduleService from "@src/services/TaskScheduleService";
import ImageUtils from "@src/utils/image";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import fs from 'fs';
import { get } from "lodash";
import parser from 'xml2json';
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

  public async getListJobCrawlerTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q =  req.param("q", '')
      const employer_id =  req.param("employer_id", '')
      const job_id =  req.param("job_id", '')
      const jobsService = new JobsService();
      const jobs = await jobsService.getJobsCrawlerTemplateForAdmin(q, employer_id, job_id);
      if (!jobs) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      if(jobs.results && jobs.results?.length > 0){
        const jobService = new JobsService();
        const newResultsJobs = await Promise.all(
          jobs.results.map(async (job: JobsModel) => {
            const jobAssessments = await jobService.getJobAssessmentByJobId(job.id, true);
            job.job_assessments = jobAssessments;
            return job;
          })
        )
        jobs.results = newResultsJobs;
      }
      return ok(jobs, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateListJobCrawlerTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id =  get(req, "body.id", "");
      const jobsTo =  get(req, "body.jobsTo", []);
      const jobsService = new JobsService();
      const result = await jobsService.copyJobsTemplates(id, jobsTo);
      if(result) return ok(result, req, res);
      else return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getListJobCrawler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = get(req, "body.q", "");
      const companyIds = get(req, "body.companyIds", []);
      const page = get(req, "body.page", 0);
      const pageSize = get(req, "body.pageSize", PAGE_SIZE.Jobs);
      const orderNo = get(req, "body.orderNo", 0);
      const searchType = get(req, "body.searchType", JOB_STATUS.Active);
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
      const jobs = await jobsService.getJobsCrawlerForAdmin(
        q,
        jobStatus,
        orderNo,
        page,
        pageSize
      );
      return ok(jobs, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateJobCrawler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req["currentUser"] as UserModel;
      if (req.file) {
        const imageUltis = new ImageUtils();
        const taskScheduleService = new TaskScheduleService();
        const dataJson: any = req.file;
        const pathFile = `${FolderPath.uploadFilePath}`;
        if (!fs.existsSync(pathFile)) {
          fs.mkdirSync(pathFile, { recursive: true });
        }
        let rawdata = await fs.readFileSync(`${pathFile}/${dataJson.filename}`, { encoding: 'utf8' });
        if (!rawdata) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
        let listJobCralwer;
        if (dataJson.mimetype.indexOf('xml') > 0) {
          rawdata = parser.toJson(rawdata);
          listJobCralwer = JSON.parse(rawdata).root.element;
        } else {
          listJobCralwer = JSON.parse(rawdata);
        }
        await imageUltis.resizeUploadImage(req.file, currentUser.id, UPLOAD_TYPE.JsonFileCrawler);
        const results = await taskScheduleService.readJsonFileAndUpdateDataCrawler(listJobCralwer);
        return ok(results, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateFileConfigCrawler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req["currentUser"] as UserModel;
      if (req.file) {
        const imageUltis = new ImageUtils();
        const jobsService = new JobsService();
        const dataJson: any = req.file;
        const pathFile = `${FolderPath.uploadFilePath}`;
        if (!fs.existsSync(pathFile)) {
          fs.mkdirSync(pathFile, { recursive: true });
        }
        let rawdata = await fs.readFileSync(`${pathFile}/${dataJson.filename}`, { encoding: 'utf8' });
        if (!rawdata) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
        let listConfigCralwer = JSON.parse(rawdata);
        await imageUltis.resizeUploadImage(req.file, currentUser.id, UPLOAD_TYPE.JsonFileCrawler);
        const results = await jobsService.readJsonFileConfigCrawler(listConfigCralwer);
        return ok(results, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
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
  public async deleteJobCrawler(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      await jobsService.excludeJobCrawler(ids);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getConfigParamsJobCrawler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobsService = new JobsService();
      const results = await jobsService.getConfigParamsCrawlJob();
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async newConfigParamsJobCrawler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobsService = new JobsService();
      const index = get(req, "params.index", 0);
      const results = await jobsService.newConfigParamsCrawlJob(index);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async updateConfigParamsJobCrawler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobsService = new JobsService();
      const id = get(req, "params.id", 0);
      const data = req.body;
      const results = await jobsService.updateConfigParamsCrawlJob(id, data);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async deleteConfigParamsJobCrawler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobsService = new JobsService();
      const configNumber = get(req, "params.configNumber", 0);
      const results = await jobsService.deleteConfigParamsJobCrawler(configNumber);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async activeJobCrawler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobsService = new JobsService();
      const dataBody = req.body;
      const results = await jobsService.activeJobCrawler(dataBody);
      if (results) return ok({ message: "update success" }, req, res);
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async updateStatusShowTextCrawl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobsService = new JobsService();
      const typeStatus = parseInt(req.params.type);
      const jobId = parseInt(req.params.id);
      const results = await jobsService.updateStatusShowTextCrawl(jobId, typeStatus);
      if (results) return ok({ message: "update success" }, req, res);
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateClaimedCompanyCrawl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobsService = new JobsService();
      const claimed = req.body.claimed;
      const id = req.body.id;
      const results = await jobsService.updateClaimedCompanyCrawl(id, claimed);
      if (results) return ok({ message: "update success" }, req, res);
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async deleteCompanyCrawler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = get(req, "params.id", 0);
      const typeExclude = get(req, "params.typeExclude", EXCLUDE_CRAWL.AGREE);
      const jobsService = new JobsService();
      await jobsService.excludeCompanyCrawler(companyId, typeExclude);
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