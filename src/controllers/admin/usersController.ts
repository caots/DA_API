import { ACCOUNT_TYPE, PAGE_SIZE, USER_STATUS } from "@src/config";
import { COMMON_ERROR } from "@src/config/message";
import { logger } from "@src/middleware";
import { badRequest, forbidden, ok } from '@src/middleware/response';
import AdminModel from "@src/models/admin";
import UserModel from "@src/models/user";
import JobSeekerAssessmentsService from "@src/services/jobSeekerAssessmentsService";
import UserService from "@src/services/user";
import ImageUtils from "@src/utils/image";
import { mapUserAndCompanyData } from "@src/utils/userUtils";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
export default class AdminUserController {

  public async gets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUser = req["currentUser"] as AdminModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Standand));
      const name = req.param("name");
      // const companyId = req.param("companyId");
      const location = req.param("location");
      const accType = parseInt(req.param("accType"), ACCOUNT_TYPE.Employer);
      const userService = new UserService();
      if (!userService.checkHavePermission(adminUser, accType)) {
        return forbidden({ message: COMMON_ERROR.notPermission }, req, res);
      }

      let status;
      const orderNo = parseInt(req.param("orderNo", 0));
      const searchType = req.param("searchType");

      let isHasReport = false;
      switch (searchType) {
        case "flagged":
          isHasReport = true;
          break;
        case "active":
          status = USER_STATUS.active;
          break;
        case "inactive":
          status = USER_STATUS.deactive;
          break;
      }
      const users = await userService.getUsers(
        accType,
        // companyId,
        location, name,
        isHasReport, status,
        orderNo,
        page, pageSize);
      if (accType == ACCOUNT_TYPE.Employer) {
        users.results = await Promise.all(
          users.results.map(async (employer: UserModel) => {
            const reports = await userService.getReports(employer.id);
            employer.reports = reports;
            return employer;
          })
        );
      }
      // const users = await userService.updateUserGroupChat();
      return ok(users, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getCompanys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUser = req["currentUser"] as AdminModel;
      const userService = new UserService();
      const orderNo = parseInt(req.param("orderNo", 0));
      const companies = await userService.getAllComnpanies(orderNo);
      return ok(companies, req, res);
    } catch (err) {
      next(err);
    }
  }

 
  public async put(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = req["currentUser"];
      const msValidate = new MsValidate();
      const userService = new UserService();
      const userId = get(req, "params.id", 0);
      // console.log(req.file);
      const currentUser = await userService.findById(userId);
      if (!userService.checkHavePermission(admin, currentUser.acc_type)) {
        return forbidden({ message: COMMON_ERROR.notPermission }, req, res);
      }
      let emailUpdateCompany = '';
      const crawlCompany = req.body.is_crawl;
      if (crawlCompany && currentUser.acc_type === ACCOUNT_TYPE.Employer) emailUpdateCompany = req.body.email;
      req.body.email = currentUser.email;
      let body;
      if (currentUser.acc_type === ACCOUNT_TYPE.JobSeeker) body = await msValidate.validateUpdateUser(currentUser.acc_type, req.body);
      else {
        body = await msValidate.updateInfoCompany(req.body);
        delete body.first_name;
        delete body.last_name;
        delete body.email
      }
      // const isExisted = await userService.findByEmailSafe(body.email);
      // if (isExisted && currentUser.email !== body.email) { return badRequest({ message: USER_MESSAGE.emailAlreadyExists }, req, res); }
      // check image
      if (req.file) {
        // console.log(req.file);
        const imageUltis = new ImageUtils();
        if (currentUser.acc_type === ACCOUNT_TYPE.JobSeeker) body.profile_picture = await imageUltis.resizeImage(req.file, currentUser.id);
        else body.company_profile_picture = await imageUltis.resizeImage(req.file, currentUser.id);
      }
      // update info compnay
      if (currentUser.acc_type === ACCOUNT_TYPE.Employer) {
        let updateCompany = await userService.updateInfoCompany(currentUser.company_id, body);
        if (emailUpdateCompany && currentUser.email != emailUpdateCompany) {
          currentUser.email = emailUpdateCompany;
          const updateEmail = await userService.updateEmailUserByAdmin(currentUser.id, currentUser);
          if (!updateEmail) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
        }
        if (updateCompany) return ok(updateCompany, req, res);
      } else {
        let jobseekerUpdate = await userService.update(currentUser.id, body);
        if (jobseekerUpdate) return ok(jobseekerUpdate, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = req["currentUser"];
      const msValidate = new MsValidate();
      const userService = new UserService();
      const userId = get(req, "params.id", 0);
      let currentUser: any = await userService.findById(userId);
      const companyInfo = await userService.getCompanyById(currentUser.company_id);
      currentUser = mapUserAndCompanyData(currentUser, companyInfo);

      if (!userService.checkHavePermission(admin, currentUser.acc_type)) {
        return forbidden({ message: COMMON_ERROR.notPermission }, req, res);
      }

      if (currentUser) {
        if (currentUser.acc_type == ACCOUNT_TYPE.JobSeeker) {
          // find asssessments of job seeker
          const jsaService = new JobSeekerAssessmentsService();
          currentUser.assessments = await jsaService.getJobsekkerAssessment(currentUser.id);
        }
        if (currentUser.employer_id != 0 && currentUser.acc_type == ACCOUNT_TYPE.Employer) {
          const userResponse = new UserModel();
          userResponse.id = currentUser.id;
          userResponse.first_name = currentUser.first_name;
          userResponse.last_name = currentUser.last_name;
          userResponse.acc_type = currentUser.acc_type;
          userResponse.created_at = currentUser.created_at;
          userResponse.updated_at = currentUser.updated_at;
          userResponse.email_verified = currentUser.email_verified;
          userResponse.is_deleted = currentUser.is_deleted;
          userResponse.is_user_deleted = currentUser.is_user_deleted;
          userResponse.employer_title = currentUser.employer_title;
          userResponse.employer_id = currentUser.employer_id;
          userResponse.sign_up_step = currentUser.sign_up_step;
          userResponse.chat_group_id = currentUser.chat_group_id;
          userResponse.company_name = currentUser.company_name;
          userResponse.company_profile_picture = currentUser.company_profile_picture;
          const $employerInfo = await userService.getById(currentUser.employer_id);
          const $companyInfo = await userService.getCompanyById(currentUser.company_id);
          const employerInfo = { ...$companyInfo, ...$employerInfo };
          userResponse["employer_info"] = employerInfo;
          return ok(userResponse, req, res);
        }
        delete currentUser.password;
        return ok(currentUser, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = req["currentUser"];
      const userService = new UserService();
      const userId = get(req, "params.id", 0);
      const currentUser = await userService.findById(userId);
      if (!userService.checkHavePermission(admin, currentUser.acc_type)) {
        return forbidden({ message: COMMON_ERROR.notPermission }, req, res);
      }
      const status = parseInt(req.param("status", USER_STATUS.active));
      const updateParam = {
        status
      };
      const update = await userService.update(currentUser.id, updateParam as UserModel);
      if (update) {
        delete update.password;
        return ok(update, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async deletes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = req["currentUser"];
      const userService = new UserService();
      let ids: number[];
      try {
        if (req.body.ids) {
          ids = JSON.parse(req.body.ids);
        }
      } catch (e) {
        console.log(e);
        logger.error(e);
      }
      const action = get(req, "body.action", "restore");
      const userTarget = await userService.findById(ids[0]);
      if (!userService.checkHavePermission(admin, userTarget.acc_type)) {
        return forbidden({ message: COMMON_ERROR.notPermission }, req, res);
      }
      const result = await userService.deleles(ids, action);
      if (result) {
        ids.map(async (id: number) => {
          const user = await userService.findById(id);
        })
        return ok({ message: "success" }, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
}