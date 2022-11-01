import config, { ACCOUNT_TYPE, APPLICANT_STATUS, COMMON_STATUS, CRAWL_TITLE_CAPTCHA, DEFAULT_USER_CRAWLER, EMAIL_WARNING_CRAWLINGS_JOB, EXCLUDE_CRAWL, EXPIRED_JOB_CRAWL, GA_EVENT_ACTION, GA_EVENT_CATEGORY, JOB_APPLICANT_TYPE, JOB_STATUS, NOTIFICATION_TYPE, TASKSCHEDULE_STATUS, TASKSCHEDULE_TYPE } from "@src/config";
import CompanyModel from "@src/models/company";
import CrawlLogUsModel from "@src/models/crawl_log";
import JobsModel from "@src/models/jobs";
import JobsSuggestJobseekerModel from "@src/models/jobs_suggest_jobseeker";
import JobBookmarksModel from "@src/models/job_bookmarks";
import JobCrawlUrlModel from "@src/models/job_crawl_url";
import ParamsFilterCrawlModel from "@src/models/params_filter_crawler";
import TaskScheduleModel from "@src/models/task_schedule";
import UserModel from "@src/models/user";
import UserNotificationModel from "@src/models/user_notifications";
import UserPotentialsModel from "@src/models/user_potentials";
import UserPotentialsCategoryModel from "@src/models/user_potentials_category";
import UserReceiveEmailModel from "@src/models/user_receive_email";
import { TaskScheduleRepository } from "@src/repositories/taskScheduleRepository";
import { default as UserBll, default as UserService } from "@src/services/user";
import AnalyticUtils from "@src/utils/analyticUtils";
import ImageUtils from "@src/utils/image";
import { convertObjectToQuery, extractContent } from "@src/utils/jobUtils";
import MailUtils from "@src/utils/sendMail";
import axios from 'axios';
import fs from 'fs';
import { get, groupBy } from "lodash";
import moment from "moment";
import { Job as JobModel, RecurrenceRule, scheduleJob } from 'node-schedule';
import { Server } from "socket.io";
import BillingSettingsService from "./billingSettingsService";
import JobsService from "./jobsService";
import NotificationService from "./notification";

interface IQueryMessageUnread {
  user_id: number,
  email: string,
  acc_type: number,
  first_name: string,
  last_name: string,
  unread: number,
  status?: number;
  is_deleted?: number;
  is_user_deleted?: number;
}
interface IQueryJobExpire {
  job_id: number;
  job_seeker_id: number;

  id: number,
  email: string,
  acc_type: number,
  first_name: string,
  last_name: string,
  status?: number;
  is_deleted?: number;
  is_user_deleted?: number;

  title: string;
  add_urgent_hiring_badge: number;
  city_name: string;
  state_name: string;
  expired_at: string;
  employer_id: number;

  type_expired: number;
}

export default class TaskScheduleService {
  private repository: TaskScheduleRepository;
  private notification: NotificationService;
  private emailUtils: MailUtils;
  public static jobNotification: JobModel;
  constructor() {
    this.repository = new TaskScheduleRepository(TaskScheduleModel);
    this.notification = new NotificationService();
    this.emailUtils = new MailUtils();
  }

  public socketIo: Server;

  public static config(socketIo: Server) {
    let task = new TaskScheduleService();
    task.socketIo = socketIo;

    let Job: JobModel;
    [
      {
        name: 'REMOVE_AFTER',
        timer: config.TASKSCHEDULE.TIMER.REMOVE_AFTER,
        execute: task.removeAfter30Day
      },
      {
        name: 'NEW_JOB_TO_FOLLOWER',
        timer: config.TASKSCHEDULE.TIMER.NEW_JOB_TO_FOLLOWER,
        execute: task.newJobsToFollower
      },
      {
        name: 'NEW_JOB_TO_USER_POTENTIALS',
        timer: config.TASKSCHEDULE.TIMER.NEW_JOB_USER_POTENTIAL,
        execute: task.newJobsToUserPotentials
      },
      {
        name: 'NEW_JOB_SUGGEST',
        timer: config.TASKSCHEDULE.TIMER.NEW_JOB_SUGGEST,
        execute: task.newJobsSuggestJobseeker
      },
      {
        name: 'REMINDER_COMPLETE_APPLICATION',
        timer: config.TASKSCHEDULE.TIMER.REMINDER_COMPLETE_APPLICATION,
        execute: task.reminderCompleteApplication
      },
      {
        name: 'REMINDER_SAVED_JOB_EXPIRE',
        timer: config.TASKSCHEDULE.TIMER.REMINDER_SAVED_JOB_EXPIRE,
        execute: task.reminderSavedJobExpire
      },
      {
        name: 'UNREAD_MESSAGES',
        timer: config.TASKSCHEDULE.TIMER.UNREAD_MESSAGES,
        execute: task.unreadMessages
      },
      //================== Crawler job ==================
      {
        name: 'CHECK_JOB_CRAWL_EXPIRED',
        timer: config.TASKSCHEDULE.CRAWLER.CHECK_JOB_CRAWL_EXPIRED,
        execute: task.checkAllJobCrawlerExpired
      },
    ].forEach(job => {
      (function (this: any) {
        let timer: any;
        try {
          const { type = 'rule', ...rule } = JSON.parse(this.timer);
          if (type == 'rule') {
            timer = new RecurrenceRule();
            Object.keys(rule).forEach(k => {
              timer[k] = rule[k]
            })
          }
        } catch (error) {
          timer = this.timer;
        }
        this.Job = scheduleJob(timer, () => {
          console.log(`${this.name} next execute ${this.Job.nextInvocation().toLocaleString()}`)
          try {
            this.execute.bind(task)();
          } catch (error) {
            console.log(`${this.name} ERROR`, error.message || error)
          }
        }) as JobModel
        if (!this.Job)
          console.log(`${this.name} ERROR SETUP`)
        else
          console.log(`${this.name} next execute ${this.Job.nextInvocation().toLocaleString()}`)
      }).bind(job)()
    })
  }

  async updateStatus(list: Array<TaskScheduleModel>, status = TASKSCHEDULE_STATUS.Running) {
    let query = TaskScheduleModel.query().update({ 'status': status }).whereIn('id', list.map(e => e.id));
    return query;
  }
  public async deleteWhere(where: Object): Promise<any> {
    if (where == null) throw ('where not empty');
    return TaskScheduleModel.query().delete().where(where);
  }

  // get details job info (cronjob)
  public async getAllJobInfoCrawl(): Promise<any> {
    try {
      let resultsData = [];
      const listUrl = await JobCrawlUrlModel.query();
      for await (const url of listUrl) {
        console.log('Url: ', url.id);
        const responseListJobCrawl = await this.getListJobDetailsInfoFromCrawl(url);
        if (responseListJobCrawl) {
          if (this.checkPassedEmployeesData(responseListJobCrawl, url.employee)) resultsData.push(responseListJobCrawl);
          this.sleep(1000 * 60);
        }
      }
      if (resultsData.length == 0) {
        const log = {
          log: `Get job information failed `
        }
        await CrawlLogUsModel.query().insert(log);
        return 'upload fail';
      }
      let dataFile = JSON.stringify(resultsData);
      const datetimestamp = Date.now();
      const nameOfFile = `crawl-job-data-${datetimestamp}.json`;
      await fs.writeFileSync(`uploads/${nameOfFile}`, dataFile);
      // upload file to cloud
      const imageUlti = new ImageUtils();
      const location = await imageUlti.uploadToS3(`uploads/${nameOfFile}`, nameOfFile, 'application/json');
      let log;
      if (location) {
        log = {
          log: `Get job information success`,
          url_file: location,
        }
      } else {
        log = {
          log: `Get job information failed `
        }
      }
      await CrawlLogUsModel.query().insert(log);
      return 'upload success';
    } catch (err) {
      console.log('err: ', err)
    }
  }

  public async getDetailsJobInfoByUrlCrawl(urlJob): Promise<any> {
    try {
      let resultsData = [];
      const responseListJobCrawl = await this.getListJobDetailsInfoFromCrawl({url: urlJob});
      if (responseListJobCrawl && responseListJobCrawl?.jobInfo) resultsData.push(responseListJobCrawl);
      else return null;
      let dataFile = JSON.stringify(resultsData);
      const datetimestamp = Date.now();
      const nameOfFile = `crawl-job-details-data-${datetimestamp}.json`;
      await fs.writeFileSync(`uploads/${nameOfFile}`, dataFile);
      // upload file to cloud
      const imageUlti = new ImageUtils();
      const location = await imageUlti.uploadToS3(`uploads/${nameOfFile}`, nameOfFile, 'application/json');
      return location;
    } catch (err) {
      console.log('err: ', err)
    }
  }

  private checkPassedEmployeesData(responseListJobCrawl, employee) {
    try {
      // null data
      if (!employee) return true;
      if (!responseListJobCrawl?.companyInfo) return false;
      if (!responseListJobCrawl?.companyInfo?.company_size_min && !responseListJobCrawl?.companyInfo?.company_size_max) return false;
      // convert to number
      if (employee) employee = +employee;
      if (responseListJobCrawl?.companyInfo?.company_size_min) responseListJobCrawl.companyInfo.company_size_min = +responseListJobCrawl.companyInfo.company_size_min;
      if (responseListJobCrawl?.companyInfo?.company_size_max) responseListJobCrawl.companyInfo.company_size_max = +responseListJobCrawl.companyInfo.company_size_max;
      // compare employee
      if (employee) employee = +employee;
      if (responseListJobCrawl?.companyInfo?.company_size_min && responseListJobCrawl?.companyInfo?.company_size_min > employee) return false;
      if (responseListJobCrawl?.companyInfo?.company_size_max || responseListJobCrawl?.companyInfo?.company_size_max < employee) return false;
      return true;
    } catch (error) {
      console.log('err: ', error)
    }
  }

  //read josn file and update company and job crawler
  public async readJsonFileAndUpdateDataCrawler(listJobCrawlerFromFile: any[]): Promise<any> {
    try {
      // update company
      const companiesCrawler: any[] = await this.updateCompanyCrawler(listJobCrawlerFromFile);
      if(companiesCrawler){
        // update job
        const jobOfCompaniesCrawler: any[] = await this.updateJobOfCompanyCrawler(listJobCrawlerFromFile);
        if (jobOfCompaniesCrawler) return companiesCrawler;
      }
      return null;
    } catch (err) {
      console.log('err: ', err)
    }
  }
  // cron job check all job crawler expired 45 day
  public async checkAllJobCrawlerExpired(): Promise<any> {
    try {
      const jobsService = new JobsService();
      let allJobCrawler = await JobsModel.query().where('is_crawl', 1).andWhere('is_deleted', 0);
      if (allJobCrawler) {
        if (allJobCrawler && allJobCrawler.length > 0) {
          const results = await Promise.all(
            allJobCrawler.map(jobCrawl => {
              return new Promise(async (resolve, reject) => {
                const createdJob = moment(new Date(jobCrawl.created_at));
                const currentDate = moment(new Date());
                const createdDay = currentDate.diff(createdJob, 'days') + 1;
                let paidDay = 0;
                if (jobCrawl?.paid_at) {
                  const paidJob = moment(new Date(jobCrawl.paid_at));
                  paidDay = currentDate.diff(paidJob, 'days') + 1;
                }
                if (jobCrawl.status == JOB_STATUS.Draft && createdDay >= EXPIRED_JOB_CRAWL) {
                  const updateJobCrawler: any = { ...jobCrawl, is_deleted: 1 };
                  const updateData = await jobsService.updateJob(updateJobCrawler, []);
                  resolve(updateJobCrawler);
                } else resolve({});
                //else if(jobCrawl.status == JOB_STATUS.Active && paidDay >= EXPIRED_JOB_CRAWL){
                //   const updateJobCrawler: any = { ...jobCrawl, status: JOB_STATUS.Closed };
                //   const updateData = await jobsService.updateJob(updateJobCrawler, []);
                // } 
              })
            })
          )
          return results;
        }
      };
      return null;
    } catch (err) {
      console.log('err: ', err)
    }
  }

  //update job crawler
  public async updateJobsCrawler(jobsDetails, isUpdateJob = false): Promise<any> {
    try {
      const jobService = new JobsService();
      const newJobBody: any = {
        title: jobsDetails?.title || '',
        salary: jobsDetails?.salary || null,
        desciption: jobsDetails?.description || '',
        nbr_open: jobsDetails?.nbr_open || null,
        salary_min: jobsDetails?.salary_from || null,
        salary_max: jobsDetails?.salary_to || null,
        proposed_conpensation: jobsDetails?.proposed_compensation || null,
        status: JOB_STATUS.Draft,
        is_deleted: 0,
        salary_type: jobsDetails?.salary_type >= 0 ? jobsDetails.salary_type : 1,
        crawl_url: jobsDetails?.crawl_url || '',
        crawl_from: jobsDetails?.crawl_from || '',
        is_crawl: 1,
        is_exclude_company: 0,
        //more filed no have in crawl job
        city_name: jobsDetails?.city_name || '',
        state_name: jobsDetails?.state_name || '',
        employment_type: jobsDetails?.employment_type,
      }

      const assessmentParams = [];
      if (isUpdateJob) {
        const updateJob = await jobService.updateJob({ ...newJobBody, id: jobsDetails.id }, assessmentParams);
        return updateJob;
      } else {
        const newJob = await jobService.createJob({ ...newJobBody, employer_id: jobsDetails.employerId, }, assessmentParams);
        return newJobBody;
      }
    } catch (err) {
      console.log('err: ', err)
    }
  }

  public async updateJobOfCompanyCrawlerItem(jobCrawl){
    const companyInfo = jobCrawl?.companyInfo ? jobCrawl.companyInfo : { company_name: jobCrawl.jobInfo.company_name };
    const jobInfo = jobCrawl?.jobInfo;
    if (!jobInfo || !jobInfo?.title) return null;
    // check company da ton tai theo name company
    const companyCrawlExsist = await CompanyModel.query().where('is_crawl', 1).andWhere('company_name', companyInfo.company_name);
    if (companyCrawlExsist.length > 0) {
      if (companyCrawlExsist[0].is_exclude == EXCLUDE_CRAWL.DEGREE || companyCrawlExsist[0].is_exclude == EXCLUDE_CRAWL.AGREE) return null;
      else {
        const jobService = new JobsService();
        const checkExsistsJobCrawl = await jobService.getJobCrawlerByName(jobInfo.title);
        let jobsCrawler;
        if (checkExsistsJobCrawl && checkExsistsJobCrawl.length > 0) {
          jobsCrawler = await this.updateJobsCrawler({ ...jobInfo, id: checkExsistsJobCrawl[0].id, employerId: companyCrawlExsist[0].employer_id }, true);
        } else {
          jobsCrawler = await this.updateJobsCrawler({ ...jobInfo, employerId: companyCrawlExsist[0].employer_id });
        }
        return { company: companyCrawlExsist[0], job: jobsCrawler };
      }
    }
    return null;
  }

  public async updateCompanyCrawlerItem(companyInfo: any){
    const gallery = [];
    if(companyInfo?.employer_company_photo &&  companyInfo?.employer_company_photo.length > 0){
      companyInfo?.employer_company_photo.map(image => {
        if(image) gallery.push(image);
      })
    }
    const updateCompanyCrawler = {
      company_name: companyInfo.company_name || '',
      company_profile_picture: companyInfo?.company_profile_picture || '',
      employer_ceo_name: companyInfo?.employer_ceo_name || '',
      employer_year_founded: companyInfo?.employer_year_founded ? companyInfo.employer_year_founded : '',
      employer_revenue_max: companyInfo?.employer_revenue_max ? +companyInfo.employer_revenue_max : null,
      employer_revenue_min: companyInfo?.employer_revenue_min ? +companyInfo.employer_revenue_min : null,
      company_size_max: companyInfo?.company_size_max ? +companyInfo.company_size_max : null,
      company_size_min: companyInfo?.company_size_min ? +companyInfo.company_size_min : null,
      employer_industry: companyInfo?.employer_industry || '',
      description: companyInfo?.description || '',
      employer_company_photo: gallery.length > 0 ? JSON.stringify(gallery) : '',
      is_crawl: 1,
      is_exclude: 0,
      // more filed no have in crawl job
      employer_company_twitter: companyInfo?.employer_company_twitter || '',
      employer_company_facebook: companyInfo?.employer_company_facebook || '',
      employer_company_url: companyInfo?.employer_company_url || '',
      employer_ceo_picture: companyInfo?.employer_ceo_picture || '',
      city_name: companyInfo?.city_name || '',
      state_name: companyInfo?.state_name || '',
      address_line: companyInfo?.address_line || '',
    } as CompanyModel;
    // check company da ton tai theo name company
    const companyCrawlExsist = await CompanyModel.query().where('is_crawl', 1).andWhere('company_name', updateCompanyCrawler.company_name);
    if(companyCrawlExsist && companyCrawlExsist.length > 0) return companyCrawlExsist[0];
    const companyUpdatedDb = await CompanyModel.query().insert(updateCompanyCrawler);
    if (companyUpdatedDb) {
      // create user - map company
      const billingSettingsService = new BillingSettingsService();
      const employerSettings = await billingSettingsService.getSystemSettingsForEmployer();
      const companyNameEmail = companyUpdatedDb?.company_name ? companyUpdatedDb.company_name.replace(/\s/g, '') : 'companyname';
      const newUserCrawler: any = {
        email: `${companyNameEmail}${companyUpdatedDb.id}${DEFAULT_USER_CRAWLER.EMAIL}`,
        password: DEFAULT_USER_CRAWLER.PASSWORD,
        acc_type: ACCOUNT_TYPE.Employer,
        sign_up_step: 2,
        status: 1,
        first_name: companyUpdatedDb.company_name,
        email_verified: 1,
        nbr_free_credits: 0,
        employer_id: 0,
        company_id: companyUpdatedDb.id
      }
      if (employerSettings.free_direct_message) newUserCrawler.nbr_free_credits = employerSettings.free_direct_message;
      const userService = new UserService();
      const userCreated = await userService.create(newUserCrawler);
      // create group chat  
      await userService.createGroupSupportChat(userCreated);
      companyUpdatedDb.employer_id = userCreated.id;
      const resultCom = await CompanyModel.query().updateAndFetchById(companyUpdatedDb.id, companyUpdatedDb);
      return resultCom;
    }
    return null;
  }

  //update company and user crawl
  public async updateJobOfCompanyCrawler(listJobCrawler): Promise<any> {
    try {
      if (!listJobCrawler || listJobCrawler.length <= 0) return null;
      let results = [];
      if(listJobCrawler){
        for await (const result of listJobCrawler.map(jobCrawl => this.updateJobOfCompanyCrawlerItem(jobCrawl)) ) {
          if(result) results.push(result);
        }
      }
      return results;
    } catch (err) {
      console.log('err: ', err)
    }
  }

  //update company and user crawl
  public async updateCompanyCrawler(listJobCrawler: any[]): Promise<any> {
    try {
      if (!listJobCrawler || listJobCrawler.length <= 0) return null;
      let companyCrawls = [];
      let results = [];
      listJobCrawler.map(data => {
        const companyInfo = data?.companyInfo ? data.companyInfo : { company_name: data.jobInfo.company_name };
        if(companyCrawls.length > 0){
          const index = companyCrawls.findIndex(company => company.company_name == companyInfo.company_name);
          if(index < 0) companyCrawls.push(companyInfo);
        }else companyCrawls.push(companyInfo);
      });

      if(companyCrawls.length > 0){
        for await (const result of companyCrawls.map(company => this.updateCompanyCrawlerItem(company)) ) {
          if(result) results.push(result);
        }
      }
      return results;
    } catch (err) {
      console.log('err: ', err)
    }
  }

  sleep(ms): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  public async getListJobDetailsInfoFromCrawl(jobCrawl: any): Promise<any> {
    const paramsObj = {
      url: encodeURIComponent(jobCrawl.url),
      drivertype: "indeed_jobs_details"
    }
    try {
      const result: any = await this.getAllUrlJobCrawlApi(paramsObj);
      if (result?.jobsDetails) {
        return result.jobsDetails;
      }
    } catch (error) {
      console.log('err: ', error);
    }
  }

  // get url run local
  public async saveUrlJobLocalCrawl(configParams): Promise<any[]> {
    try {
      const jobsService = new JobsService();
      if (configParams) {
        // delete all old url
        const listUrlExsist = await JobCrawlUrlModel.query();
        if (listUrlExsist && listUrlExsist.length > 0) {
          await Promise.all(
            listUrlExsist.map(url => {
              return new Promise(async resolve => {
                const resultChild = await JobCrawlUrlModel.query().deleteById(url.id);
                resolve(resultChild);
              })
            })
          )
        }
        let results = [];
        let checksCallApi = [];
        // update new url
        let paramsObj: any = {};
        if (configParams.length > 0) {
          configParams.map((filter) => {
            if (filter.value) paramsObj = Object.assign(paramsObj, { [filter.name]: filter.value })
          })
        }
        const listLocation = paramsObj?.multi_location ? JSON.parse(paramsObj?.multi_location) : [];
        let limitItem = paramsObj?.range || 200;
        if (listLocation && listLocation.length > 0) {
          delete paramsObj.multi_location;
          const numberOfPage = Math.floor((paramsObj?.range || 200) / listLocation.length);
          paramsObj.range = numberOfPage;
          limitItem = numberOfPage;
          for await (const location of listLocation) {
            paramsObj.location = location;
            let passed = true;
            if (checksCallApi.length > 0) {
              const index = checksCallApi.findIndex(data => data.id === configParams[0].config_number && data.location === location);
              passed = index < 0;
            }
            if (passed) {
              checksCallApi.push({
                id: configParams[0].config_number,
                location: location
              })
              const data = await this.getDataFromCrawlMachine(paramsObj, limitItem);
              if (data && data.length > 0) {
                const linksUrl = data;
                const listUrlUpdated = await Promise.all(
                  linksUrl.map(async (link: any) => {
                    const newLink = {
                      url: link.url,
                      start_job: link.startJob,
                      config_file: configParams[0].config_number,
                      employee: paramsObj?.employee
                    }
                    const results = await JobCrawlUrlModel.query().insert(newLink);
                    return results;
                  })
                );
                results = [...results, ...listUrlUpdated];
              }
              this.sleep(1000 * 3);
            }
          }
        } else {
          const data = await this.getDataFromCrawlMachine(paramsObj, limitItem);
          if (data && data.length > 0) {
            const linksUrl = data;
            const listUrlUpdated = await Promise.all(
              linksUrl.map(async (link: any) => {
                const newLink = {
                  url: link.url,
                  start_job: link.startJob,
                  config_file: configParams[0].config_number,
                  employee: paramsObj?.employee
                }
                const results = await JobCrawlUrlModel.query().insert(newLink);
                return results;
              })
            );
            results = [...results, ...listUrlUpdated];
          }
        }
        return results;
      }
    } catch (err) {
      console.log('err: ', err);
    }
  }

  // get all job url (cronjob)
  public async saveUrlJobCrawl(): Promise<any[]> {
    try {
      const titleCaptchaPage = CRAWL_TITLE_CAPTCHA;
      const jobsService = new JobsService();
      const listParamsFilter = await jobsService.getConfigParamsCrawlJob();
      if (listParamsFilter.length > 0) {
        // delete all old url
        const listUrlExsist = await JobCrawlUrlModel.query();
        if (listUrlExsist && listUrlExsist.length > 0) {
          await Promise.all(
            listUrlExsist.map(url => {
              return new Promise(async resolve => {
                const resultChild = await JobCrawlUrlModel.query().deleteById(url.id);
                resolve(resultChild);
              })
            })
          )
        }
        let results = [];
        let checksCallApi = [];
        // update new url
        for await (const configParams of listParamsFilter) {
          let paramsObj: any = {};
          if (configParams.length > 0) {
            configParams.map((filter: ParamsFilterCrawlModel) => {
              if (filter.value) paramsObj = Object.assign(paramsObj, { [filter.name]: filter.value })
            })
          }
          const listLocation = paramsObj?.multi_location ? JSON.parse(paramsObj?.multi_location) : [];
          let limitItem = paramsObj?.range || 200;
          if (listLocation && listLocation.length > 0) {
            delete paramsObj.multi_location;
            const numberOfPage = Math.floor((paramsObj?.range || 200) / listLocation.length);
            paramsObj.range = numberOfPage;
            limitItem = numberOfPage;
            for await (const location of listLocation) {
              paramsObj.location = location;
              let passed = true;
              if (checksCallApi.length > 0) {
                const index = checksCallApi.findIndex(data => data.id === configParams[0].config_number && data.location === location);
                passed = index < 0;
              }
              if (passed) {
                checksCallApi.push({
                  id: configParams[0].config_number,
                  location: location
                })
                const data = await this.getDataFromCrawlMachine(paramsObj, limitItem);
                if (data && data.length > 0) {
                  const linksUrl = data;
                  const listUrlUpdated = await Promise.all(
                    linksUrl.map(async (link: any) => {
                      const newLink = {
                        url: link.url,
                        start_job: link.startJob,
                        config_file: configParams[0].config_number,
                        employee: paramsObj?.employee
                      }
                      const results = await JobCrawlUrlModel.query().insert(newLink);
                      return results;
                    })
                  );
                  results = [...results, ...listUrlUpdated];
                }
                this.sleep(1000 * 3);
              }
            }
          } else {
            const data = await this.getDataFromCrawlMachine(paramsObj, limitItem);
            if (data && data.length > 0) {
              const linksUrl = data;
              const listUrlUpdated = await Promise.all(
                linksUrl.map(async (link: any) => {
                  const newLink = {
                    url: link.url,
                    start_job: link.startJob,
                    config_file: configParams[0].config_number,
                    employee: paramsObj?.employee
                  }
                  const results = await JobCrawlUrlModel.query().insert(newLink);
                  return results;
                })
              );
              results = [...results, ...listUrlUpdated];
            }
          }
        }
        return results;
      }
    } catch (err) {
      console.log('err: ', err);
    }
  }

  public async sendMailWarningNotCrawl() {
    try {
      const mailUtil = new MailUtils();
      Promise.all(
        EMAIL_WARNING_CRAWLINGS_JOB.map(async (email: string) => {
          const sendMail = await mailUtil.warningNotCrawlJob(email);
          return sendMail;
        })
      )
      return;
    } catch (error) {
      throw error;
    }
  }

  public async getDataFromCrawlMachine(paramsObj, limitItem): Promise<any[]> {
    try {
      let results = [];
      let checkUrlEndPage = "";
      let result: any = await this.getAllUrlJobCrawlApi(paramsObj);
      if (!result || !result?.links || result?.links.length == 0) return [];
      let startJob = 0;
      while (results.length < limitItem && startJob >= 0) {
        if (result.links.length) {
          if (result.links[0].url == checkUrlEndPage) {
            startJob = -1;
          } else {
            checkUrlEndPage = result.links[0].url;
            results.push(...result.links);
            startJob = startJob + 50;
            paramsObj = { ...paramsObj, start: startJob };
            result = await this.getAllUrlJobCrawlApi(paramsObj);
          }
        } else {
          startJob = -1;
        }
      }
      return results;
    } catch (error) {
      throw error;
    }
  }

  public getAllUrlJobCrawlApi(paramsObj) {
    try {
      console.log('url: ', `${config.CRAWLER_AWS_API}?${convertObjectToQuery(paramsObj)}`);
      return new Promise((resolve, reject) => {
        axios.get(`${config.CRAWLER_AWS_API}?${convertObjectToQuery(paramsObj)}`)
          .then(response => {
            return resolve(response.data);
          })
          .catch(error => {
            resolve(error);
          });
      });
    } catch (error) {
      throw error;
    }
  }

  public getArrayPromise(listUserPotentials: any): Promise<boolean>[] {
    const now = moment().utc().format('YYYY-MM-DD HH:mm:ss');
    return Object.keys(listUserPotentials).map(key => {
      const value = listUserPotentials[key];
      return new Promise(async resolve => {
        try {
          if (!value || value.length <= 0) {
            resolve(true);
            return;
          }
          const userPotentials = await UserPotentialsModel.query().where('id', key);
          if (!userPotentials || userPotentials.length <= 0) {
            resolve(true);
            return;
          }
          const userMapPotentials = await UserModel.query().where('id', userPotentials[0].id);
          if (!userMapPotentials || userMapPotentials.length <= 0) return;
          const listCategory = value.map(obj => {
            return obj.categoryId;
          });
          const listJobs = await JobsModel.query()
            .select(["*"])
            // .where("jobs.expired_at", ">=", now)
            .where("jobs.is_private", 0)
            .where("jobs.status", JOB_STATUS.Active)
            .whereIn("jobs.jobs_category_ids", listCategory)
            .orderBy("jobs.id", 'desc')
            .limit(3);
          if (!listJobs || listJobs.length <= 0) {
            resolve(true);
            return;
          };
          const listUserReceiveJob = await UserReceiveEmailModel.query().where("user_id", userMapPotentials[0].id);
          // check job user receive job >= 3
          let listJobSuggest = [];
          if (listUserReceiveJob && listUserReceiveJob.length > 0) {
            listJobs.map(job => {
              const index = listUserReceiveJob.findIndex(item => item.job_id == job.id && item.quantity >= 3);
              if (index < 0) listJobSuggest.push(job);
            })
          } else listJobSuggest = [...listJobs];
          const listJobEmployerId = listJobSuggest.map(job => job.employer_id);
          const listCompany = await UserModel.query().whereIn("id", listJobEmployerId);

          const _jobs: Array<{ job: JobsModel, company: UserModel }> = listJobSuggest && listJobSuggest.map(job => ({
            job: job,
            company: listCompany.find(e1 => e1.id == job.employer_id)
          }));
          if (listJobSuggest && listJobSuggest.length > 0) {
            //await this.emailUtils.newJobAlertUserPotentials(userMapPotentials[0].email, _jobs);
            //update user receive email
            await listJobSuggest.map(async (job) => {
              const index = listUserReceiveJob.findIndex(item => item.job_id == job.id);
              if (index >= 0) {
                const newItem = listUserReceiveJob[index];
                newItem.quantity = newItem.quantity + 1;
                const idItem = newItem.id;
                delete newItem.id;
                await UserReceiveEmailModel.query().updateAndFetchById(idItem, newItem);
              } else {
                const newItem = new UserReceiveEmailModel();
                newItem.user_id = userMapPotentials[0].id;
                newItem.job_id = job.id;
                newItem.quantity = 1;
                await UserReceiveEmailModel.query().insert(newItem);
              }
            })
          }
          resolve(true);
        } catch (error) {
          resolve(true)
        }
      })
    });
  }

  public async removeAfter30Day(): Promise<any> {
    let setup: Array<any> = config.TASKSCHEDULE.PARAMS.REMOVE_AFTER.split(' ');
    let unit: moment.unitOfTime.DurationConstructor = setup[0]
    let amount: number = parseInt(setup[1])
    let now = moment().utc()
      .add(amount, unit)
      .format('YYYY-MM-DD HH:mm:ss')
      ;
    let query = UserNotificationModel.raw(`delete from user_notifications where created_at < '${now}'`);
    //console.log(query.toSQL().sql)
    return new Promise((resolve, reject) => {
      query.then(v => resolve(v), e => reject(e))
    })
  }

  // send mail new post jobs to user potentials
  public async newJobsToUserPotentials(): Promise<any> {
    const now = moment().utc().format('YYYY-MM-DD HH:mm:ss');

    const query = await UserPotentialsCategoryModel.query()
      .select(["up.id as userId", "user_potentials_category.category_id as categoryId"])
      .innerJoin("user_potentials as up", "user_potentials_category.user_potential_id", "up.id")
      .where('up.status', 1);

    const listUserPotentials = groupBy(query, (user: any) => {
      return user?.userId;
    });
    // get list job with category    
    Promise.all(this.getArrayPromise(listUserPotentials)).then(value => {
      // console.log(value);
    });
    return true;
  }

  // notification new post jobs to follower and applied
  public async newJobsToFollower(): Promise<any> {
    let queues = await TaskScheduleModel.query().where({ 'type': TASKSCHEDULE_TYPE.NewPostsJobseekers, 'status': TASKSCHEDULE_STATUS.NotRun });
    if (queues.length <= 0)
      return;

    let start: Date = new Date();
    await this.updateStatus(queues);

    queues.forEach(async queue => {
      let metaData = JSON.parse(queue.metadata || '{}');
      try {

        let query = UserModel.query().from(
          UserModel.query()
            .distinct('users.id')
            .join('job_seeker_follow_employers', 'job_seeker_follow_employers.job_seeker_id', '=', 'users.id')
            .where({
              'job_seeker_follow_employers.employer_id': metaData.jobDetails.employer_id,
              'users.is_deleted': 0
            })
            .union(UserModel.query()
              .distinct('users.id')
              .join('job_applicants', 'job_applicants.job_sekker_id', '=', 'users.id')
              .where({
                'job_applicants.employer_id': metaData.jobDetails.employer_id,
                'job_applicants.type': JOB_APPLICANT_TYPE.Applicant,
                'job_applicants.status': APPLICANT_STATUS.Active,
                'users.is_deleted': 0
              })
            )
            .as('table')
        )
          .distinct('id')

        console.log(query.toSql());
        let userIds: Array<number> = (await query.execute()).map(e => e.id);
        Promise.all(userIds.map(async e => {
          await this.notification.insert({
            data: new UserNotificationModel({
              user_id: e,
              type: NOTIFICATION_TYPE.NewPostsJobseekers,
              user_acc_type: ACCOUNT_TYPE.JobSeeker,
              metadata: JSON.stringify({
                jobDetails: metaData.jobDetails
              })
            }),
            socketIo: this.socketIo
          });
        }));

        AnalyticUtils.logEvents(userIds.map(e => ({
          category: GA_EVENT_CATEGORY.NOTIFICATION,
          action: GA_EVENT_ACTION.NOTIFICATION_SEND_NEW_JOB,
          label: 'job_id',
          value: metaData.jobDetails.id
        })));

        queue.status = TASKSCHEDULE_STATUS.Done;
      } catch (error) {
        queue.status = TASKSCHEDULE_STATUS.Error;
        const ErrorMessage = get(error, 'message', 'Errorrrrrr');
        queue.metadata = JSON.stringify({
          ...metaData,
          ErrorMessage
        })
      }
      finally {
        if (queue.status = TASKSCHEDULE_STATUS.Done)
          await TaskScheduleModel.query().delete().where({ 'id': queue.id });
        else
          await this.repository.update(queue.id.toString(), queue);
      }

    });

    // console.log(`newJobsToFollower: ${queues.length} record executed with ${((new Date().getTime() - start.getTime()))}s.`);
  }

  public async newJobsSuggestJobseeker(): Promise<any> {
    const now = moment().utc().format('YYYY-MM-DD HH:mm:ss');

    const query = `
    select
      *
    from(
      select
        *,
        @row_number:=CASE
          WHEN @last_id = jobseeker_id
            THEN 
              @row_number + 1
            ELSE 
              1
          END AS _index,
        @last_id:=jobseeker_id
      from(
        select
          jk.id as jobseeker_id,
          jk.email as jobseeker_email,
          
          j.id as jobs_id,
          j.title as jobs_title,
          
          ep.id as employer_id,
          ep.email as employer_email,
          (
            SELECT 
              SUM((jsa.weight * ja.point) / 100)
            FROM job_assessments AS ja
            INNER JOIN job_seeker_assessments jsa on
              jsa.status = 1 
              AND jsa.is_deleted = 0
              and jsa.assessment_id = ja.assessment_id
              AND jsa.assessment_type = ja.assessment_type
            WHERE
              ja.jobs_id = j.id
              AND jsa.job_seeker_id = jk.id
          ) AS total_point
        from users jk
        inner join jobs j on
          1=1
        inner join users ep on
          ep.id = j.employer_id
        left join jobs_suggest_jobseeker jsj on
          jsj.jobs_id = j.id
          and jsj.user_id = jk.id
        where
          j.status = ${JOB_STATUS.Active}
          and j.is_private = 0
          and j.expired_at > '${now}'
          and ep.is_deleted = 0
          and ep.is_user_deleted =0
          and jk.is_deleted = 0
          and jk.is_user_deleted = 0
          and jsj.jobs_id is null
          and jsj.user_id is null
        order by
          jk.id desc,
          j.paid_at desc,
          total_point desc
      ) temp
      inner join (SELECT @last_id:=0,@row_number:=0) as t
      where total_point is not null
    ) temp
    where _index <= ${config.TASKSCHEDULE.PARAMS.NEW_JOB_SUGGEST_MAXIMUM_MAIL_OF_DAY}
    `;

    type rowType = {
      jobseeker_id,
      jobseeker_email,
      jobs_id,
      jobs_title,
      employer_id,
      employer_email
    }
    let listJobsByJobseeker = (await TaskScheduleModel.raw(query))[0] as Array<rowType>;

    if (listJobsByJobseeker.length <= 0) return;

    let listGroup: Array<{
      key: number,
      list: Array<rowType>
    }> = listJobsByJobseeker.reduce((temp, e) => {
      var index = temp.findIndex(e1 => e1.key == e.jobseeker_id);
      if (index >= 0)
        temp[index].list.push(e)
      else
        temp.push({ key: e.jobseeker_id, list: [e] })
      return temp;
    }, [])

    const jobs = await JobsModel.query().whereIn('id', listJobsByJobseeker.map(e => e.jobs_id).filter((e, index, array) => array.indexOf(e) == index))
    const users = await UserModel.query().whereIn('id', listJobsByJobseeker.map(e => e.jobseeker_id).filter((e, index, array) => array.indexOf(e) == index))
    const companies = await UserModel.query().whereIn('id', listJobsByJobseeker.map(e => e.employer_id).filter((e, index, array) => array.indexOf(e) == index))
    const userSerive = new UserBll();
    if(companies.length > 0){
      await Promise.all(companies.map(async (company, index) => {
        const companyInfo = await userSerive.getCompanyById(company.company_id);
        if(companyInfo) companies[index]['company_name'] = companyInfo.company_name;
      }))
    }
    const results = await Promise.all(listGroup.map(e => {
      return new Promise(async (resolve, reject) => {
        try {
          const user = users.find(e1 => e1.id == e.key);
          const listUserReceiveJob = await UserReceiveEmailModel.query().where("user_id", user.id);
          let listJobSuggest = [];
          if (listUserReceiveJob && listUserReceiveJob.length > 0) {
            jobs.map(job => {
              const index = listUserReceiveJob.findIndex(item => item.job_id == job.id && item.quantity >= 3);
              if(job?.desciption) job.desciption = extractContent(job.desciption);
              if (index < 0) listJobSuggest.push(job);
            })
          } else listJobSuggest = [...jobs];
          const _jobs: Array<{ job: JobsModel, company: UserModel }> = e.list.map(e => ({
            job: listJobSuggest.find(e1 => e1.id == e.jobs_id),
            company: companies.find(e1 => e1.id == e.employer_id)
          }));
          if (listJobSuggest && listJobSuggest.length > 0) {
            if (user.status == COMMON_STATUS.Active && user.is_deleted == 0 && user.is_user_deleted == 0) {
              await this.emailUtils.newJobAlert(user.email, user, _jobs);
            }
            //update user receive email
            await listJobSuggest.map(async (job) => {
              const index = listUserReceiveJob.findIndex(item => item.job_id == job.id);
              if (index >= 0) {
                const newItem = listUserReceiveJob[index];
                newItem.quantity = newItem.quantity + 1;
                const idItem = newItem.id;
                delete newItem.id;
                await UserReceiveEmailModel.query().updateAndFetchById(idItem, newItem);
              } else {
                const newItem = new UserReceiveEmailModel();
                newItem.user_id = user.id;
                newItem.job_id = job.id;
                newItem.quantity = 1;
                await UserReceiveEmailModel.query().insert(newItem);
              }
            })
          }
          resolve(_jobs.map(e => new JobsSuggestJobseekerModel({
            user_id: user.id,
            jobs_id: e.job.id,
            created_at: now,
            updated_at: now,
          })));
        } catch (error) {
          resolve([])
        }
      })
    }))

    let insertsMark: Array<JobsSuggestJobseekerModel> = [].concat.apply([], results);
    if (insertsMark.length > 0) {
      const queryInsert = JobsSuggestJobseekerModel.query().insert(insertsMark).toSql();
      await JobsSuggestJobseekerModel.raw(queryInsert);
    }
  }

  public async reminderCompleteApplication() {
    let now = moment().utc()
      // .add('minute', -2)
      .add(-12, 'hour')
      .format('YYYY-MM-DD HH:mm:ss');
    let queues = await TaskScheduleModel.query().where({ 'type': TASKSCHEDULE_TYPE.ReminderCompleteApplication, 'status': TASKSCHEDULE_STATUS.NotRun }).where('updated_at', '<', now);
    if (queues.length <= 0)
      return;

    let start: Date = new Date();
    await this.updateStatus(queues);

    const jobs = await JobsModel.query().whereIn('id', queues.map(e => e.subject_id))
    const users = await UserModel.query().whereIn('id', queues.map(e => e.user_id))
    const company = await UserModel.query().whereIn('id', jobs.map(e => e.employer_id))

    Promise.all(queues.map(async queue => {
      let metaData = JSON.parse(queue.metadata || '{}');

      try {
        var user: UserModel = metaData.user;
        var jobDetails: JobsModel = metaData.jobDetails;
        if (user.status == COMMON_STATUS.Active && user.is_deleted == 0 && user.is_user_deleted == 0) {
          await this.notification.insert({
            data: new UserNotificationModel({
              user_id: queue.user_id,
              type: NOTIFICATION_TYPE.ReminderCompleteApplication,
              user_acc_type: ACCOUNT_TYPE.JobSeeker,
              metadata: JSON.stringify({
                jobDetails
              })
            }),
            socketIo: this.socketIo
          });

          const job = jobs.find(e1 => e1.id == queue.subject_id);
          if(job?.desciption) job.desciption = extractContent(job.desciption);
          await this.emailUtils.jobUncompleteApplication(user.email, users.find(e1 => e1.id == queue.user_id), job, company.find(e => e.id == job?.employer_id));
        }
        queue.status = TASKSCHEDULE_STATUS.Done;
      } catch (error) {
        queue.status = TASKSCHEDULE_STATUS.Error;
        const ErrorMessage = get(error, 'message', 'Errorrrrrr');
        queue.metadata = JSON.stringify({
          ...metaData,
          ErrorMessage
        })
      }
      finally {
        if (queue.status = TASKSCHEDULE_STATUS.Done)
          await TaskScheduleModel.query().delete().where({ 'id': queue.id });
        else
          await this.repository.update(queue.id.toString(), queue);
      }
    }))

    AnalyticUtils.logEvents(queues.map(e => ({
      category: GA_EVENT_CATEGORY.NOTIFICATION,
      action: GA_EVENT_ACTION.NOTIFICATION_SEND_REMINDER_COMPLETE_APPLICATION,
      label: 'user_id',
      value: e.user_id,
    })));
  }

  isTest = false;
  public async reminderSavedJobExpire() {
    let now = moment().utc().format('YYYY-MM-DD HH:mm:ss');
    let query = JobBookmarksModel.raw<Array<any>>(`
    select
      jobs.id as job_id, 
      job_bookmarks.job_seeker_id,

      users.id as id,
      users.email as email,
      users.acc_type as acc_type,
      users.first_name as first_name,
      users.last_name as last_name,
      users.status as status,
      users.is_deleted as is_deleted,
      users.is_user_deleted as is_user_deleted,

      jobs.title,
      jobs.add_urgent_hiring_badge,
      jobs.city_name,
      jobs.state_name,
      jobs.expired_at,
      jobs.employer_id,
      case 
        when DATE_SUB(jobs.expired_at, INTERVAL 6 HOUR) <= '${now}' then 1
        when DATE_SUB(jobs.expired_at, INTERVAL 12 HOUR) <= '${now}' then 2
        when DATE_SUB(jobs.expired_at, INTERVAL 24 HOUR) <= '${now}' then 3
        when DATE_SUB(jobs.expired_at, INTERVAL 48 HOUR) <= '${now}' then 4
      else 0 end as type_expired
    from job_bookmarks
    inner join users on users.id = job_bookmarks.job_seeker_id and users.is_deleted = 0 and users.is_user_deleted  = 0 and users.status  = 1
    inner join jobs on job_bookmarks.job_id = jobs.id
    -- inner join job_applicants on job_applicants.job_id = job_bookmarks.job_id and job_applicants.status = 0  and job_applicants.type = 0
    where 
      1=1
      and DATE_SUB(jobs.expired_at, INTERVAL 6 HOUR) >= '${now}'
      and DATE_SUB(jobs.expired_at, INTERVAL 48 HOUR) <= '${now}'
      and jobs.is_deleted = 0
      and jobs.status = ${JOB_STATUS.Active}
      and not exists(
      select 1
        from job_applicants
        where
        job_applicants.job_id = job_bookmarks.job_id
        and job_applicants.status = ${APPLICANT_STATUS.Active}
        -- and job_applicants.type = 0
      )
      and not exists (
        select
          1
        from cronjob_tasks 
        where 
          cronjob_tasks.type = ${TASKSCHEDULE_TYPE.ReminderSavedJobExpire}
          and cronjob_tasks.user_id = job_bookmarks.job_seeker_id
          and cronjob_tasks.subject_id = job_bookmarks.job_id
      )
    `);

    let queues = (await new Promise((resolve, reject) => {
      query.then(v => resolve(v), e => reject(e))
    }))[0] as Array<IQueryJobExpire>;
    if (queues.length <= 0)
      return;

    let _add = queues.map(e => ({
      user_id: e.job_seeker_id,
      subject_id: e.job_id,
      status: TASKSCHEDULE_STATUS.Done,
      type: TASKSCHEDULE_TYPE.ReminderSavedJobExpire,
      metadata: '',
      created_at: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment().utc().format('YYYY-MM-DD HH:mm:ss')
    }))

    let q = TaskScheduleModel.query().insert(_add);
    await TaskScheduleModel.raw(q.toSql());

    const jobs = await JobsModel.query().whereIn('id', queues.map(e => e.job_id))
    const users = await UserModel.query().whereIn('id', queues.map(e => e.job_seeker_id))
    const company = await UserModel.query().whereIn('id', queues.map(e => e.employer_id))

    let start: Date = new Date();

    queues.forEach(async (e) => {
      let saveNotified = {
        user_id: e.job_seeker_id,
        subject_id: e.job_id,
        status: TASKSCHEDULE_STATUS.Done,
        type: TASKSCHEDULE_TYPE.ReminderSavedJobExpire,
        metadata: ''
      };
      try {
        if (e.status == COMMON_STATUS.Active && e.is_deleted == 0 && e.is_user_deleted == 0) {
          await this.notification.insert({
            data: new UserNotificationModel({
              user_id: e.job_seeker_id,
              user_acc_type: ACCOUNT_TYPE.JobSeeker,
              type: NOTIFICATION_TYPE.ReminderSavedJobExpire,
              metadata: JSON.stringify({
                jobDetails: {
                  ...jobs.filter(e1 => e1.id == e.job_id).map(e => ({
                    id: e.id,
                    desciption: extractContent(e?.desciption),
                    title: e.title,
                    employer_id: e.employer_id,
                    add_urgent_hiring_badge: e.add_urgent_hiring_badge,
                    expired_at: e.expired_at,
                    city_name: e.city_name,
                    state_name: e.state_name,
                    country_name: e.country_name,
                  }))[0],
                  expired_after: e.type_expired == 1 ? 6 : e.type_expired == 2 ? 12 : e.type_expired == 3 ? 24 : e.type_expired == 4 ? 48 : 0
                }
              })
            }),
            socketIo: this.socketIo
          });
          await this.emailUtils.saveJobWillExpire(e.email, users.find(e1 => e1.id == e.job_seeker_id), jobs.find(e1 => e1.id == e.job_id), company.find(e1 => e1.id == e.employer_id))
        }
      } catch (error) {
        saveNotified.status = TASKSCHEDULE_STATUS.Error
        const ErrorMessage = get(error, 'message', 'Errorrrrrr');
        saveNotified.metadata = JSON.stringify({
          ErrorMessage
        })
      }
      finally {
        await TaskScheduleModel.query().update(saveNotified).where({
          user_id: e.job_seeker_id,
          subject_id: e.job_id,
          type: TASKSCHEDULE_TYPE.ReminderSavedJobExpire,
        });
      }
    })
    AnalyticUtils.logEvents(queues.map(e => ({
      category: GA_EVENT_CATEGORY.NOTIFICATION,
      action: GA_EVENT_ACTION.NOTIFICATION_SEND_REMINDER_JOB_EXPIRE,
      label: 'jobseeker_id-job_id',
      value: `${e.job_seeker_id}-${e.job_id}`
    })))
  }

  public async unreadMessages() {
    var listUserUnread = (await TaskScheduleModel.raw<Array<any>>(`
    select
      member_id as user_id,
      users.email,
      users.acc_type,
      users.first_name,
      users.last_name,
      users.status,
      users.is_deleted,
      users.is_user_deleted,
      count(group_id) as unread
    from(
      select
        cgm.group_id,
        cgm.member_id,
        lcm.last_message_id,
        crm.message_id as read_message_id
      from chat_group_members cgm
      inner join (
        select 
          group_id, 
          max(id) as last_message_id 
        from chat_messages 
        GROUP BY group_id
      ) lcm on lcm.group_id = cgm.group_id
      left join chat_read_messages crm on crm.user_id = cgm.member_id and crm.group_id = cgm.group_id
      where cgm.is_deleted = 0 and lcm.last_message_id <> crm.message_id
      group by cgm.group_id, cgm.member_id
    ) unread
    left join users on users.id = unread.member_id
    group by member_id
    `))[0] as Array<IQueryMessageUnread>;

    if (listUserUnread.length <= 0) return;

    const email = new MailUtils();
    await Promise.all(listUserUnread.map(e => {
      if (e.status == COMMON_STATUS.Active && e.is_deleted == 0 && e.is_user_deleted == 0) {
        this.emailUtils.unReadMessage(e.email, e.unread, new UserModel({
          acc_type: e.acc_type,
          first_name: e.first_name,
          last_name: e.last_name,
        }))
      }
    }))
  }
}
