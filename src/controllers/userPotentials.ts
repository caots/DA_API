import { ACCOUNT_TYPE } from "@src/config";
import { COMMON_ERROR, COMMON_SUCCESS, USER_MESSAGE } from "@src/config/message";
import { badRequest, created, ok } from "@src/middleware/response";
import UserModel from "@src/models/user";
import UserService from "@src/services/user";
import UserPotentialsService from "@src/services/userPotentialsService";
import UserSessionBll from "@src/services/userSession";
import MailUtils from "@src/utils/sendMail";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import requestIp from 'request-ip';
export default class UserPotentialsController {

  // create user potentials
  public async createUserPotentials(req: Request, res: Response, next: NextFunction) {
    try {
      // check validate
      const msValidate = new MsValidate();
      delete req.body["g-recaptcha-response"];
      const body = await msValidate.validateSignupPotentials(req.body);
      const listCategoryId: any[] = req.body["categories"];
      delete body["categories"];
      // create new user
      const userService = new UserPotentialsService();
      const userBll = new UserService();
      // check black list user
      const ip = requestIp.getClientIp(req) || null;
      const isBackListUser = await userBll.checkBackListUser(body.email, ip);
      if (!isBackListUser) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      const isExisted = await userService.findByEmailSafe(body.email);
      if (isExisted) { return badRequest({ message: USER_MESSAGE.emailAlreadyExists }, req, res); }
      const user = await userService.createUserPotentials(body, listCategoryId);
      if (user) {
        const update = await userService.changePasswordRequest(user.id, user);
        if (update) {
          // send mail
          const mailUtil = new MailUtils();
          const sendMail = await mailUtil.completeSignupUserPotentials(update.email, update.token);
          if (!sendMail) {
            return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
          }
          return ok({ message: COMMON_SUCCESS.default }, req, res);
        }
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
    } catch (err) {
      next(err);
    }
  }

  // complete user potentials
  public async completeUserPotentials(req: Request, res: Response, next: NextFunction) {
    try {
      const userPotentialsService = new UserPotentialsService();
      const userService = new UserService();

      const password: string = req.body["password"];
      const token = decodeURIComponent(req.body.token);
      const result = await userPotentialsService.findUserByToken(token);
      if (!result || result.length == 0) {
        return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res);
      }
      //update  user potentials submited status
      const email = result[0].email;
      const isExisted = await userPotentialsService.findByEmailSafe(email);
      if (!isExisted) { return badRequest({ message: USER_MESSAGE.emailNotExists }, req, res); }
      const isExistedUser = await userService.findByEmailSafe(email);
      if (isExistedUser) { return badRequest({ message: USER_MESSAGE.emailNotExists }, req, res); }
      delete req.body.token;
      const userPotential: any = await userPotentialsService.updateUserPotentialsStatusSubmited(isExisted);
      const listUserPotentialsCategory: any = await userPotentialsService.findListCategory(isExisted.id);

      // create user 
      userPotential.password = password;
      userPotential.acc_type = ACCOUNT_TYPE.JobSeeker;
      delete userPotential.submited_password;
      delete userPotential.status;
      const ip = requestIp.getClientIp(req) || null;
      const user = await userService.create(userPotential);
      const userUpdateIP = await userService.updateUserIPAddress(user.id, ip);
      if (userUpdateIP < 0) return next({ message: COMMON_ERROR.pleaseTryAgain });
      if (user) {
        await userService.createGroupSupportChat(user);
        // verrfired email
        const userUpdate = new UserModel();
        userUpdate.email_verified = 1;
        userUpdate.verified_token = null;

        if (user.employer_id) {
          userUpdate.sign_up_step = 2;
        }
        const newUserUpdate = await userService.update(user.id, userUpdate);

        if (newUserUpdate) {
          // logic add refer
          if (userUpdate.acc_type == ACCOUNT_TYPE.JobSeeker && userUpdate.sign_up_step == 2) {
            const refUser = await userService.getUserReferLink(userUpdate.id);
            if (refUser) {
              const updateRefUser = await userService.appliedLogicReferLink(refUser);
            }
          }
          // send twilio to verified sms
          const userSessionBll = new UserSessionBll();
          const result = await userSessionBll.create(user);
          const auth_info = { access_token: result.access_token, refresh_token: result.refresh_token, expires_in: result.expires_in };
          const data = {
            auth_info,
            user_info: newUserUpdate,
            category: listUserPotentialsCategory
          };
          return created(data, req, res);
        }
      }
    } catch (err) {
      next(err);
    }
  }
}