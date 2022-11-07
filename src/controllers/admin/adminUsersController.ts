import { ADMIN_ACCOUNT_STATUS, PAGE_SIZE } from '@src/config';
import { COMMON_ERROR, COMMON_SUCCESS, USER_MESSAGE } from '@src/config/message';
import { badRequest, created, ok } from '@src/middleware/response';
import AdminModel from '@src/models/admin/index';
import UserForgotResetModel from '@src/models/user_password_reset';
import AdminBll from '@src/services/admin';
import AdminSessionBll from '@src/services/adminSession';
import AdminUsersService from '@src/services/adminUsersService';
import UserSessionBll from '@src/services/userSession';
import MailUtils from '@src/utils/sendMail';
import MsValidate from '@src/utils/validate';
import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from "express";
import { get } from 'lodash';

export default class AdminUsersController {
  public async getListAdminUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUsersService = new AdminUsersService();
      const q = get(req, "query.q", "");
      const page = parseInt(get(req, "query.page", 0));
      const pageSize = parseInt(get(req, "query.pageSize", PAGE_SIZE.Standand));
      const listAdmin = await adminUsersService.getListAdminUsers(q, page, pageSize);
      return ok(listAdmin, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateAdminInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUsersService = new AdminUsersService();
      const adminId = get(req, "params.userId", 0);
      const admin = await adminUsersService.findById(adminId);
      if (!admin) {
        return badRequest({ message: USER_MESSAGE.userNotExist }, req, res);
      }

      const msValidate = new MsValidate();
      const body = await msValidate.validateAdminUser(req.body);
      body.permission = body.permission.join(",");
      const adminUserModel = body as AdminModel;
      const adminUpdate = await adminUsersService.updateAdminInfo(adminId, adminUserModel);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async deactiveAdminAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUsersService = new AdminUsersService();
      const adminSessionBll = new AdminSessionBll();
      const adminId = get(req, "params.userId", 0);
      const admin = await adminUsersService.findById(adminId);
      if (!admin) {
        return badRequest({ message: USER_MESSAGE.userNotExist }, req, res);
      }

      await adminUsersService.deactiveAdminUser(adminId);
      await adminSessionBll.removeSessionByDeactiveUser(adminId);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUsersService = new AdminUsersService();
      const msValidate = new MsValidate();
      const userForgot = new UserForgotResetModel();
      const adminBll = new AdminBll();
      const userSessionService = new UserSessionBll();
      console.log(req.body)
      const admin = await msValidate.validateInviteAdminUser(req.body);
      admin.permission = admin.permission.join(",");
      const adminExist = await adminBll.findByEmailSafe(admin.email);
      if (adminExist) {
        return badRequest({ message: COMMON_ERROR.emailExist }, req, res);
      }
      admin.password = "";
      const mailUtil = new MailUtils();
      const additionalData = {
        firstName: admin.first_name,
        lastName: admin.last_name,
      };

      userForgot.email = admin.email;
      const result = await userSessionService.genTokenForgot(userForgot);
      await adminUsersService.createAdminMember(admin);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async setPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const userSessionService = new UserSessionBll();
      const adminUsersService = new AdminUsersService();
      const adminBll = new AdminBll();
      const token = decodeURIComponent(body.token);
      const result = await userSessionService.findTokenForgot(token);
      if (!result || !result.length) {
        return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res);
      }
      const email = result[0].email;
      const adminExisted = await adminBll.findByEmailSafe(email);
      if (!adminExisted) {
        return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res);
      }

      const adminUserModel = new AdminModel();
      adminUserModel.status = ADMIN_ACCOUNT_STATUS.Active;
      const hash = bcrypt.hashSync(body.password, 10);
      adminUserModel.password = hash;
      const adminUpdate = await adminUsersService.updateAdminInfo(adminExisted.id, adminUserModel);
      if (adminUpdate) {
        delete adminUpdate.password;
        await userSessionService.deleteById(result[0].id);
        return created(adminUpdate, req, res);
      }
    } catch (err) {
      next(err);
    }
  }
  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const mailUtil = new MailUtils();
      const adminBll = new AdminBll();
      const adminExisted = await adminBll.findByEmailSafe(body.email);
      if (!adminExisted) { return badRequest({ message: USER_MESSAGE.emailNotExists }, req, res); }

      if (adminExisted.status === ADMIN_ACCOUNT_STATUS.Pending) {
        return badRequest({ message: USER_MESSAGE.userNotActive }, req, res);
      }
      const userSessionService = new UserSessionBll();
      const result = await userSessionService.genTokenForgot(body);
      if (!result) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      const sendMail = await mailUtil.forgotPassword(body.email, result.token, true);
      if (!sendMail) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
}
