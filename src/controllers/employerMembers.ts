import { GROUP_TYPE } from "@src/chatModule/lib/config";
import { ChatGroupsModel } from "@src/chatModule/models";
import { ZoomService } from "@src/chatModule/service/room";
import { ACCOUNT_TYPE, COMMON_STATUS, PAGE_SIZE } from "@src/config";
import { COMMON_ERROR, COMMON_SUCCESS, USER_MESSAGE } from "@src/config/message";
import { badRequest, created, ok } from "@src/middleware/response";
import UserModel from "@src/models/user";
import UserForgotResetModel from "@src/models/user_password_reset";
import { JobseekerFollowEmployersService } from "@src/services/followsService";
import { default as UserBll, default as UserService } from "@src/services/user";
import UserSessionBll from "@src/services/userSession";
import MailUtils from "@src/utils/sendMail";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import { SIGN_UP_STEP } from '../config/index';
export default class EmployerMembersController {
  // invited
  public async invite(req: Request, res: Response, next: NextFunction) {
    try {
      // check validate
      const msValidate = new MsValidate();
      const employer = req["currentUser"] as UserModel;
      const body = await msValidate.validateEmployerMemberInvite(req.body);
      const permissions = body.permissions;
      delete body.permissions;
      body.employer_id = employer.id;
      body.company_id = employer.company_id;
      body.password = "";
      body.sign_up_step = SIGN_UP_STEP.Completed;
      // return ok({ message: COMMON_SUCCESS.default }, req, res);
      // create new user
      const userService = new UserService();
      delete body.verified_code;
      let userCheck = await userService.findByEmailSafe(body.email);
      if (userCheck != null && (userCheck.employer_id != employer.id || userCheck.is_deleted == 0))
        return badRequest({ message: USER_MESSAGE.emailAlreadyExists }, req, res);
      const user = await userService.createEmployerMember(employer.id, body, permissions, userCheck?.id || -1);
      if (user) {
        if (user.employer_id) {
          // creat group
          await userService.createGroupSupportChat(user);
        }
        // send mail
        const mailUtil = new MailUtils();
        const userSerive = new UserBll();
        const userForgot = new UserForgotResetModel();
        userForgot.email = body.email;
        const userSessionService = new UserSessionBll();
        const result = await userSessionService.genTokenForgot(userForgot);
        const companyInfo = await userSerive.getCompanyById(user.company_id);
        if(companyInfo) user['company_name'] = companyInfo.company_name;
        const sendMail = await mailUtil.activeAccount(body.email, result.token, true, user);
        if (!sendMail) {
          return badRequest({ message: COMMON_ERROR.sendMailError }, req, res);
        }
        return created({ message: COMMON_SUCCESS.default }, req, res);
      }
    } catch (err) {
      next(err);
    }
  }
  public async updateMember(req: Request, res: Response, next: NextFunction) {
    try {
      // check validate
      const msValidate = new MsValidate();
      const employer = req["currentUser"] as UserModel;
      const body = await msValidate.validateEmployerMemberUpdate(req.body);
      const permissions = body.permissions;
      delete body.permissions;
      // create new user
      const userService = new UserService();
      const userId = get(req, "params.id", 0);
      const member = await userService.findById(userId);
      if (member.employer_id != employer.id) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      // const isExisted = await userService.findByEmailSafe(body.email);
      // if (isExisted) { return badRequest({ message: USER_MESSAGE.emailAlreadyExists }, req, res); }
      const user = await userService.updateEmployerMember(employer.id, member.id, body, permissions);
      if (user) {
        return ok({ message: COMMON_SUCCESS.default }, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async resetPasswordMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = parseInt(req.param("id", 0));
      const userService = new UserService();
      const member = await userService.getById(memberId);
      if (member == null) return badRequest({ message: USER_MESSAGE.userNotExist }, req, res);

      const userSessionService = new UserSessionBll();
      const forgotResetPassModel = await userSessionService.genTokenForgot({ email: member.email } as UserForgotResetModel);
      const isOwner = false;
      if (member.status == COMMON_STATUS.Active && member.is_deleted == 0 && member.is_user_deleted == 0) await new MailUtils().forgotPassword(member.email, forgotResetPassModel.token, false, member.acc_type, isOwner, member);
      ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async deleteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = parseInt(req.param("id", 0));
      const userService = new UserService();
      const userSessionService = new UserSessionBll();

      await userService.deleles([memberId], 'delete');
      await userSessionService.deleteSessionByUserId(memberId);
      ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async gets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Standand));
      const groupId = parseInt(req.param("groupId", 0));
      const orderNo = parseInt(req.param("orderNo", 0));

      let groupInfo: { groupInfo: ChatGroupsModel, isNew: boolean };
      let groupType = null;
      if (groupId) {
        const zoomService = new ZoomService(null, null);
        groupInfo = await zoomService.getOrCreateGroup(groupId, null, null, null, null, GROUP_TYPE.Nomal);
        if (!groupInfo.groupInfo.id) {
          return ok({}, req, res);
        }
        groupType = groupInfo.groupInfo.group_nomal_type
      }

      const employerId = (user.acc_type == ACCOUNT_TYPE.Employer && user.employer_id > 0) ? user.employer_id : user.id;
      const userService = new UserService();
      const users = await userService.getEmployerMembers(
        employerId,
        groupId,
        orderNo,
        page, pageSize, groupType);
      if (groupId > 0) {
        return ok(users, req, res);
      }
      users.results = await Promise.all(
        users.results.map(async (member: any) => {
          const per = await userService.getEmployerMembersPermission(member.id);
          const listPermission = per.map(item => item.employer_permission_id);
          member.permissions = listPermission;
          return member;
        })
      );
      return ok(users, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getFollowerCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobseekerFollowEmployersService = new JobseekerFollowEmployersService();
      const result = await jobseekerFollowEmployersService.getTotalFollower(user.id);
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getFollowerHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const createDateFrom = req.param("createDateFrom");
      const searchValue = +req.param("searchValue", -7);
      const companyInfo = !user.employer_id ? user : user.companyInfo;
      const jobseekerFollowEmployersService = new JobseekerFollowEmployersService();
      const results = await jobseekerFollowEmployersService.getFollowerHistory(companyInfo, createDateFrom, searchValue);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getRecruitmentFunnel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const createDateFrom = req.param("createDateFrom");
      const jobId = parseInt(req.param("jobId", 0));
      const jobseekerFollowEmployersService = new JobseekerFollowEmployersService();
      const companyInfo = !user.employer_id ? user : user.companyInfo;
      const results = await jobseekerFollowEmployersService.getRecruitmentFunnel(companyInfo, createDateFrom, jobId);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async logRecruitmentFunnel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobseekerFollowEmployersService = new JobseekerFollowEmployersService();
      const msValidate = new MsValidate();
      const bodyParams = await msValidate.validateLogFunndel(req.body);
      const results = await jobseekerFollowEmployersService.logRecruitmentFunnel(bodyParams);
      return ok({ message: "Success." }, req, res);
    } catch (err) {
      next(err);
    }
  }

}
