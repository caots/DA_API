import { CHAT_CONTENT_TYPE } from "@src/chatModule/lib/config";
import config, {
  ACCOUNT_TYPE, ASSESSMENTS_TYPE, ASSESSMENT_STATUS, GA_EVENT_ACTION, GA_EVENT_CATEGORY, JOB_SEEKER_ASSESSMENT_LOG_STATUS,
  JOB_SEEKER_ASSESSMENT_STATUS, MESSAGE_BOT_TAKE_FIRST_ASSESSMENT, PAGE_SIZE, URL_IMOCHA
} from "@src/config";
import { ASSESSMENT_MESSAGE, COMMON_ERROR, COMMON_SUCCESS } from "@src/config/message";
import { logger } from "@src/middleware";
import { badRequest, ok } from "@src/middleware/response";
import AssessmentsModel, { AssessmentCustomQuestionsModel } from "@src/models/assessments";
import JobSeekerAssessmentsModel from "@src/models/job_seeker_assessments";
import JobSeekerAssessmentLogsModel from "@src/models/job_seeker_assessment_logs";
import UserModel from "@src/models/user";
import AssessmentsService from "@src/services/assessmentsService";
import BillingSettingsService from "@src/services/billingSettingsService";
import JobSeekerAssessmentsService from "@src/services/jobSeekerAssessmentsService";
import JobsService from "@src/services/jobsService";
import UserBll from "@src/services/user";
import AnalyticUtils from "@src/utils/analyticUtils";
import HttpRequestUtils from "@src/utils/iMochaUtils";
import { isSame } from "@src/utils/stringUtils";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import { get, pick, set } from "lodash";
import moment from "moment";
export default class AssessmentsController {

  // -------------------------------------------------------------
  // Start assessments Feature
  // get list assessment
  public async getAssessments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const assessmentsService = new AssessmentsService();
      const jobService = new JobsService();
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Standand));
      const categoryId = parseInt(req.param("categoryId", 0));
      // const ignoreValidated = parseInt(req.param("ignoreValidated", 1));
      const onlyViewMyAssessment = parseInt(req.param("onlyViewMyAssessment", 0));
      const isGetFromHomePage = parseInt(req.param("isGetFromHomePage", 0));
      const q = req.param("q") ? decodeURIComponent(req.param("q")) : "";
      const jobseekerId = user && user.acc_type == ACCOUNT_TYPE.JobSeeker ? user.id : 0;
      const employerId = user && user.acc_type == ACCOUNT_TYPE.Employer ? user.id : 0;
      const status = ASSESSMENT_STATUS.Active;
      let data = await assessmentsService.getAssessMents(categoryId, jobseekerId, status, onlyViewMyAssessment, q, page, pageSize, employerId, isGetFromHomePage);
      if(data && data.results.length > 0){
        const updateResults = await Promise.all(
          data.results.map(async (assessment: AssessmentsModel) => {
            assessment['categories'] = await jobService.getAssessmentCategory(assessment.id);
            return assessment;
          })
        )
        data.results = updateResults;
      }
      return ok(data, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getAssessmentsUserStory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessmentsService = new AssessmentsService();
      const assessmentIds = JSON.parse(req.param("ids", []));
      if(assessmentIds.length == 0) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      const results = await assessmentsService.getAssessmentsUserStory(assessmentIds);
      if(results.length > 0){
        const httpUtil = new HttpRequestUtils();
        const data = await Promise.all(
          results.map(async (assessment) => {
            const preview = await httpUtil.getTestPreview(assessment.assessment_id);
            assessment['preview_url'] = preview?.testPreviewUrl || null;
            return assessment;
          })
        )
        return ok(data, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getListMyAssessments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const assessmentsService = new AssessmentsService();
      const jobseekerId = user && user.acc_type == ACCOUNT_TYPE.JobSeeker ? user.id : 0;
      const results = await assessmentsService.getMyAssessMents(jobseekerId);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getCustoms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const assessmentsService = new AssessmentsService();
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Standand));
      const categoryId = parseInt(req.param("categoryId", 0));
      const q = req.param("q") ? decodeURIComponent(req.param("q")) : "";
      const status = ASSESSMENT_STATUS.Active;
      const results = await assessmentsService.getCustomAssessMents(categoryId, user.id, '', q, page, pageSize);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async createCustom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessmentsService = new AssessmentsService();
      const user = req["currentUser"] as UserModel;
      const msValidate = new MsValidate();
      const body = get(req, "body", {});
      const questionList = body.questionList as AssessmentCustomQuestionsModel[];
      let newAssessment;
      delete body.questionList;
      // validate asssemssment
      const questionsJsonParams = await msValidate.validateCustomAssessmentQuestion(questionList) || [];
      body.employer_id = user.id;
      body.status = ASSESSMENT_STATUS.Active;
      body.type = ASSESSMENTS_TYPE.Custom;
      const assessmentParams = await msValidate.validateCustomAssessment(body) as AssessmentsModel;
      assessmentParams.category_id = 1;
      assessmentParams.category_name = "My Custom Assessments";
      newAssessment = await assessmentsService.createCustomAssessment(assessmentParams, questionsJsonParams);
      return ok({ message: "Created Success." }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async updateCustom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessmentsService = new AssessmentsService();
      const user = req["currentUser"] as UserModel;
      const msValidate = new MsValidate();
      set(req, "body.employer_id", user.id);
      const assessmentId = get(req, "params.id", 0);
      const currentAssessment = await assessmentsService.getAssessmentDetail(assessmentId, ASSESSMENTS_TYPE.Custom, user.id);
      if (!currentAssessment || user.id != currentAssessment.employer_id) { return badRequest({ message: ASSESSMENT_MESSAGE.NotExists }, req, res); }
      const body = get(req, "body", {});
      const questionList = body.questionList as AssessmentCustomQuestionsModel[];
      let newAssessment;
      delete body.questionList;
      // validate asssemssment
      const questionsJsonParams = await msValidate.validateCustomAssessmentQuestion(questionList) || [];
      const assessmentParams = await msValidate.validateCustomAssessment(body) as AssessmentsModel;
      newAssessment = await assessmentsService.updateCustomAssessment(assessmentId, assessmentParams, questionsJsonParams);
      return ok({ message: "Success." }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async deleteCustom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessmentsService = new AssessmentsService();
      const user = req["currentUser"] as UserModel;
      const msValidate = new MsValidate();
      set(req, "body.employer_id", user.id);
      const assessmentId = get(req, "params.id", 0);
      const currentAssessment = await assessmentsService.getAssessmentDetail(assessmentId, ASSESSMENTS_TYPE.Custom, user.id);
      if (!currentAssessment || user.id != currentAssessment.employer_id) { return badRequest({ message: ASSESSMENT_MESSAGE.NotExists }, req, res); }
      const body = get(req, "body", {});
      const questionList = body.questionList as AssessmentCustomQuestionsModel[];
      delete body.questionList;
      // validate asssemssment
      await assessmentsService.deleteCustomAssessment(assessmentId);
      return ok({ message: "Success." }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async submitCustom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const testId = parseInt(get(req, "params.id", "0"));
      const testType = parseInt(get(req, "params.type", `${ASSESSMENTS_TYPE.Custom}`));
      const answerList = req.body.answerList as any[];
      if (!answerList || answerList.length == 0) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      const jsaService = new JobSeekerAssessmentsService();
      const isExisted = await jsaService.findByAssessment(user.id, testId, testType);
      if (!isExisted) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      const assessmentsService = new AssessmentsService();
      const assessmentDetail = await assessmentsService.getAssessmentDetail(testId, testType, 0);
      if (!assessmentDetail) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      assessmentDetail.questionList = await assessmentsService.getQuestionList(assessmentDetail.id, true);
      const weight = assessmentsService.calcWeightAssessmentCustom(answerList, assessmentDetail.questionList);
      const jsa = await jsaService.findByJobSeekerAssessmentId(user.id, testId, testType);
      // logger.info("jsa:");
      const jsaLog = new JobSeekerAssessmentLogsModel();
      jsaLog.job_seeker_id = user.id;
      jsaLog.Status = JOB_SEEKER_ASSESSMENT_LOG_STATUS.Complete
      jsaLog.weight = weight;
      jsaLog.AttemptedOnUtc = moment().utc().format("YYYY-MM-DD HH:mm:ss");
      if (jsa) {
        jsaLog.job_seeker_assessment_id = jsa.id;
      }
      const result = await jsaService.addJsaLog(jsaLog);
      if (!jsa) {
        return ok({ message: "not jsa" }, req, res);
      }
      const jsaUpdate = new JobSeekerAssessmentsModel();
      jsaUpdate.weight = weight;
      if (!jsa.totalTake) {
        jsa.totalTake = 1;
      } else {
        jsa.totalTake = jsa.totalTake + 1;
      }
      jsaUpdate.do_exam_at = null;
      jsaUpdate.status = JOB_SEEKER_ASSESSMENT_STATUS.Taked;
      const update = await jsaService.update(jsa.id, jsaUpdate);
      logger.info("jsa update:");
      logger.info(JSON.stringify(update));
      return ok(update, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async compare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const testId = parseInt(get(req, "params.id", "0"));
      const testType = parseInt(get(req, "params.type", `${ASSESSMENTS_TYPE.Custom}`));
      const fullAnswers = req.body.full_answers as any[];
      if (!fullAnswers || fullAnswers.length == 0) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      const answer = req.body.answer;
      // const isTrue = fullAnswers.some((y: any) => {
      //   return isSame(y.answer, answer)
      // });
      fullAnswers.forEach((y: any) => {
        return isSame(y.answer, answer)
      });
      return ok({ isTrue: 'ok' }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getAssessmentDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessmentsService = new AssessmentsService();
      const user = req["currentUser"] as UserModel;
      const asssessmentId = parseInt(get(req, "params.id", "0"));
      const asssessmentType = parseInt(get(req, "params.type", `${ASSESSMENTS_TYPE.IMocha}`));
      const assessmentDetail = await assessmentsService.getAssessmentDetail(asssessmentId, asssessmentType, 0);
      if (!assessmentDetail) {
        return badRequest({ message: "id not valid" }, req, res);
      }
      if (assessmentDetail.type == ASSESSMENTS_TYPE.Custom && user.acc_type == ACCOUNT_TYPE.Employer && assessmentDetail.employer_id != user.id) {
        return badRequest({ message: "id not valid" }, req, res);
      }
      if (assessmentDetail.type == ASSESSMENTS_TYPE.Custom) {
        assessmentDetail.questionList = await assessmentsService.getQuestionList(assessmentDetail.id, true);
      }
      return ok(assessmentDetail, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getTestPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessmentsService = new AssessmentsService();
      const user = req["currentUser"] as UserModel;
      const asssessmentId = parseInt(get(req, "params.id", "0"));
      const asssessmentType = parseInt(get(req, "params.type", `${ASSESSMENTS_TYPE.IMocha}`));
      const assessmentDetail = await assessmentsService.getAssessmentDetail(asssessmentId, asssessmentType, 0);
      if (!assessmentDetail) {
        return badRequest({ message: "id not valid" }, req, res);
      }
      if (assessmentDetail.type == ASSESSMENTS_TYPE.Custom && user.acc_type == ACCOUNT_TYPE.Employer && assessmentDetail.employer_id != user.id) {
        return badRequest({ message: "id not valid" }, req, res);
      }
      const httpUtil = new HttpRequestUtils();
      const preview = await httpUtil.getTestPreview(asssessmentId);
      return ok(preview, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async inviteTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const testId = parseInt(get(req, "params.id", "0"));
      const testType = parseInt(get(req, "params.type", `${ASSESSMENTS_TYPE.IMocha}`));
      const jobId = get(req, "body.jobId", 0);
      const redirectUrl = get(req, "body.redirect_url", "");

      if (!testId) {
        return badRequest({}, req, res);
      }

      const jsaService = new JobSeekerAssessmentsService();
      const httpUtil = new HttpRequestUtils();
      const isExisted = await jsaService.findByAssessment(user.id, testId, testType);
      let willUpdateCredit = false;
      const nbrCredits = user.nbr_credits ? user.nbr_credits : 0;
      // check free credit
      if (testType == ASSESSMENTS_TYPE.IMocha) {
        const billingSettingsService = new BillingSettingsService();
        const jobseekerSetting = await billingSettingsService.getSystemSettingsForJobSeeker();
        const nbrFreeCredits = jobseekerSetting.free_assessment_validation || 0;
        // check free remain > 0
        if (nbrFreeCredits && isExisted && nbrFreeCredits <= isExisted.totalTake) {
          // check credit > 0
          const currentCredits = nbrCredits;
          if (currentCredits < 1) {
            return badRequest({ message: ASSESSMENT_MESSAGE.CreditOptOut }, req, res);
          }
          willUpdateCredit = true;
        }
      }

      const jsaModel = new JobSeekerAssessmentsModel();
      let jobSeekerAssessment;
      if (!isExisted) {
        jsaModel.assessment_id = testId;
        jsaModel.assessment_type = testType;
        jsaModel.job_seeker_id = user.id;
        jsaModel.totalTake = 0;
      }
      // else {
      //   jsaModel.totalTake = isExisted.totalTake + 1;
      //   jsaModel.is_deleted = false;
      // }
      const userService = new UserBll();
      const userObj = {} as UserModel;

      // custom
      if (testType == ASSESSMENTS_TYPE.Custom) {
        const assessmentsService = new AssessmentsService();
        jsaModel.do_exam_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
        if (!isExisted) {
          jobSeekerAssessment = await jsaService.add(jsaModel);
        } else {
          jobSeekerAssessment = await jsaService.update(isExisted.id, jsaModel);
        }
        const assessmentDetail = await assessmentsService.getAssessmentDetail(testId, testType);
        assessmentDetail.questionList = await assessmentsService.getQuestionList(assessmentDetail.id, false);
        return ok(assessmentDetail, req, res);
      }
      // reattempt if exist.
      let invitationTest = (isExisted && isExisted.current_testInvitationId) ?
        await httpUtil.reattempt(isExisted.current_testInvitationId, user, redirectUrl) :
        await httpUtil.inviteTest(testId, user, redirectUrl);

      logger.info("invitationTest:" + JSON.stringify(invitationTest));
      if (!invitationTest) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }

      if (willUpdateCredit) {
        Object.assign(userObj, { nbr_credits: nbrCredits - 1 });
        // make payment or remove credits
        await userService.update(user.id, userObj);
      }

      if (invitationTest.isFalse && isExisted) {
        invitationTest.testUrl = isExisted.current_testUrl;
        const newUrl = invitationTest?.testUrl.replace(URL_IMOCHA.ORIGIN_URL, URL_IMOCHA.TAKE_ASSESSMENT_URL);
        invitationTest = { ...invitationTest, testUrl: newUrl };
        invitationTest.isOld = true;
        // thiếu case bài thi bị expired. => callback sẽ xóa testInvitationId ở jsa.
        invitationTest.jobSeekerAssessment = isExisted;
        return ok(invitationTest, req, res);
      }
      if (invitationTest?.testUrl) {
        const newUrl = invitationTest?.testUrl.replace(URL_IMOCHA.ORIGIN_URL, URL_IMOCHA.TAKE_ASSESSMENT_URL);
        invitationTest = { ...invitationTest, testUrl: newUrl };
      }
      jsaModel.current_testUrl = invitationTest.testUrl;
      jsaModel.current_testInvitationId = invitationTest.testInvitationId;
      if (!isExisted) {
        jobSeekerAssessment = await jsaService.add(jsaModel);
      } else {
        jobSeekerAssessment = await jsaService.update(isExisted.id, jsaModel);
      }
      invitationTest.jobSeekerAssessment = jobSeekerAssessment;
      console.log(invitationTest);
      return ok(invitationTest, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const testId = parseInt(get(req, "params.id", "0"));
      const testType = parseInt(get(req, "params.type", `${ASSESSMENTS_TYPE.IMocha}`));
      const action = get(req, "params.action", "add");
      if (!testId) {
        return ok({}, req, res);
      }
      const jsaService = new JobSeekerAssessmentsService();
      const isExisted = await jsaService.findByAssessment(user.id, testId, testType);
      const jsaModel = new JobSeekerAssessmentsModel();
      if (action == "add" && (!isExisted || isExisted.is_deleted)) {
        let jobSeekerAssessment;
        if (!isExisted) {
          jsaModel.assessment_id = testId;
          jsaModel.assessment_type = testType;
          jsaModel.job_seeker_id = user.id;
          jsaModel.totalTake = 0;
          jobSeekerAssessment = await jsaService.add(jsaModel);
        } else {
          jsaModel.is_deleted = false;
          jobSeekerAssessment = await jsaService.update(isExisted.id, jsaModel);
        }
        return ok(jobSeekerAssessment, req, res);
      }
      if (action != "add" && isExisted) {
        if (isExisted.status != JOB_SEEKER_ASSESSMENT_STATUS.Added) {
          return badRequest({ message: ASSESSMENT_MESSAGE.areadyTake }, req, res);
        }
        jsaModel.is_deleted = true;
        const jobSeekerAssessment = await jsaService.update(isExisted.id, jsaModel);
        return ok({ message: COMMON_SUCCESS.default }, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async callback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      /*
      response
        {
          "CandidateEmailId": "ngoc.nguyenvan@powergatesoftware.com",
          "AttemptedOn": "14-Nov-2020 01:57 AM",
          "TotalScore": 10.00,
          "CandidateScore": 1.00,
          "ReportPDFUrl": "https://app.interviewmocha.com/PDFReport?id=t4G6911EjWKBzQrgDhOQGA%3d%3d",
          "TestInvitationId": 3443808,
          "Status": "Complete",
          "AttemptedOnUtc": "2020-11-14T13:57:53",
          "PerformanceCategory": "Beginner"
      }
       */
      const body = get(req, "body", {});
      if (!body.CandidateEmailId) {
        return ok({ message: "not CandidateEmailId" }, req, res);
      }
      const userService = new UserBll();
      const user = await userService.findByEmail(body.CandidateEmailId);
      if (!user) {
        return ok({ message: "not user" }, req, res);
      }
      logger.info("assessments/callback-body: ");
      logger.info(JSON.stringify(body));
      const jsaService = new JobSeekerAssessmentsService();
      const jsaLog = new JobSeekerAssessmentLogsModel();
      jsaLog.job_seeker_id = user.id;
      if (body.Status == JOB_SEEKER_ASSESSMENT_LOG_STATUS.Complete) {
        body.CandidateScore = parseFloat(body.CandidateScore);
        body.TotalScore = parseFloat(body.TotalScore);
        body.weight = parseFloat((body.CandidateScore * 100 / body.TotalScore).toFixed(2));
      }
      const validAtribute = pick(body, ['Status', 'TotalScore', 'CandidateScore', 'CandidateEmailId','AttemptedOnUtc','ReportPDFUrl',
      'TestInvitationId','PerformanceCategory', 'AttemptedOn', 'weight', 'job_seeker_id', 'job_seeker_assessment_id']);
      Object.assign(jsaLog, validAtribute);
      
      logger.info("before add jsalog:");
      logger.info(JSON.stringify(jsaLog));
      const jsa = await jsaService.findByTestInvitationId(jsaLog.TestInvitationId);
      logger.info("jsa:");
      logger.info(JSON.stringify(jsa));
      if (!jsa) {
        return ok({ message: "not jsa" }, req, res);
      }
      jsaLog.job_seeker_assessment_id = jsa.id;
      let result;
      const jsaUpdate = new JobSeekerAssessmentsModel();

      // check duplicate success callback       
      if(jsaLog.Status == JOB_SEEKER_ASSESSMENT_LOG_STATUS.Complete){
        const duplicateJsaLog = await jsaService.findByLogJobseekerAssessment(jsaLog.TestInvitationId, jsaLog.Status, jsaLog.AttemptedOnUtc);
        if(duplicateJsaLog){
          result = duplicateJsaLog;
          if (!jsa.totalTake) {
            jsaUpdate.totalTake = 1;
          }else {
            jsaUpdate.totalTake = jsa.totalTake + 1;
          }
        }else {
          if (!jsa.totalTake) jsaUpdate.totalTake = 1;
          result = await jsaService.addJsaLog(jsaLog);
        }
      }else {
        result = await jsaService.addJsaLog(jsaLog);
      }
      switch (jsaLog.Status) {
        case JOB_SEEKER_ASSESSMENT_LOG_STATUS.InProgress:
          if (!jsa.totalTake) {
            jsaUpdate.totalTake = 1;
          }else {
            jsaUpdate.totalTake = jsa.totalTake + 1;
          }
          break;
        case JOB_SEEKER_ASSESSMENT_LOG_STATUS.Complete:
          // save hightest score
          const currentWeight = get(jsa, 'weight', 0);
          if (result.weight >= currentWeight) {
            jsaUpdate.weight = result.weight;
          }
          if (jsaUpdate.weight === null) {
            jsaUpdate.weight = 0;
          }
          if (!jsa.totalTake) {
            jsaUpdate.totalTake = 1;
          }
          jsaUpdate.status = JOB_SEEKER_ASSESSMENT_STATUS.Taked;
          jsaUpdate.current_testUrl = null;
          // const assessmentsService = new AssessmentsService();
          // const assessment = await assessmentsService.getAssessmentDetail(jsa.assessment_id, jsa.assessment_type);
          // await analyticUtils.logEvent(user, assessment, jsaLog.weight);
          // await analyticUtils.logEvents(user, assessment, jsaLog.weight);

          //take success fist assessment : is_take_first_assessment
          if(user.is_take_first_assessment != 1){
            user.is_take_first_assessment = 1;
            await userService.update(user.id, user);
            // send message survey
            const socketMessage = {
              group_id: user.chat_group_id,
              current_user: {
                id: 0,
                avatar: null,
                first_name: null,
                last_name: null,
                acc_type: null,
                company_name: null,
                employer_title: null,
                employer_id: null
              },
              job_id: null,
              mime_type: '',
              content_type: CHAT_CONTENT_TYPE.Complex,
              // content: `${MESSAGE_BOT_TAKE_FIRST_ASSESSMENT} ${config.WEBSITE_URL}/job-seeker-profile/profile?userInfo=pf-demographic-survey`,
              content_html: `<p class="my-message-text">
                ${MESSAGE_BOT_TAKE_FIRST_ASSESSMENT} 
                <a href="${config.WEBSITE_URL}/job-seeker-profile/profile?userInfo=pf-demographic-survey">${config.WEBSITE_URL}/job-seeker-profile/profile?userInfo=pf-demographic-survey</a>
                </p>`,
              updated_user_id: 0
            };
            // socket io send emit to user
            const assessmentsService = new AssessmentsService();
            await assessmentsService.sendMessageToJobseeker(socketMessage);
          }

          break;
        case JOB_SEEKER_ASSESSMENT_LOG_STATUS.TestLeft:
          break;
      }

      AnalyticUtils.logEvent(GA_EVENT_CATEGORY.ASSESSMENT_MOCHA,
        jsaLog.Status == JOB_SEEKER_ASSESSMENT_LOG_STATUS.InProgress ? GA_EVENT_ACTION.ASSESSMENT_MOCHA_INPROGRESS
          : jsaLog.Status == JOB_SEEKER_ASSESSMENT_LOG_STATUS.Complete ? GA_EVENT_ACTION.ASSESSMENT_MOCHA_COMPLETE
            : GA_EVENT_ACTION.ASSESSMENT_MOCHA_TESTLEFT,
        jsaLog.Status == JOB_SEEKER_ASSESSMENT_LOG_STATUS.Complete ? (jsaLog.weight + '') : null
      );

      jsaUpdate.current_testStatus = jsaLog.Status;
      const update = await jsaService.update(jsa.id, jsaUpdate);
      logger.info("jsa update:");
      logger.info(JSON.stringify(update));
      // socket io send emit to user
      // const io = global["io"] as Server;
      // const zoom = `${ZOOM_NAME.TakeAssessment}${user.id}`;
      // const event = EMIT_EVENT.OnReceiveAsmResult;
      // console.log("zoom: ", zoom);
      // console.log("event: ", event);
      // io.to(zoom).emit(event, { job_seeker_assessments: update });
      // end
      return ok({ message: "success" }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async myAssessments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jsaService = new JobSeekerAssessmentsService();
      const results = await jsaService.getJobsekkerAssessment(user.id);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async historyAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jsaService = new JobSeekerAssessmentsService();
      const testId = parseInt(get(req, "params.id", "0"));
      if (!testId) { return ok([], req, res); }
      const results = await jsaService.getHistoryAssessment(user.id, testId);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jsaService = new JobSeekerAssessmentsService();
      const jsaId = parseInt(get(req, "params.jsaId", "0"));
      const jsaLog = new JobSeekerAssessmentLogsModel();
      const status = JOB_SEEKER_ASSESSMENT_LOG_STATUS.Complete;
      const results = await jsaService.getJsaLog(jsaId, user.id, status);
      const reportUrl = get(results, "ReportPDFUrl", "");
      return ok({ reportUrl }, req, res);
    } catch (err) {
      next(err);
    }
  }
  // -------------------------------------------------------------
  // end category Feature

}