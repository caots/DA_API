import { GROUP_NOMAL_TYPE } from "@src/chatModule/lib/config";
import { ACCOUNT_TYPE, COMMON_STATUS, NOTIFICATION_TYPE } from "@src/config";
import { COMMON_ERROR, COMMON_SUCCESS, USER_MESSAGE } from "@src/config/message";
import { logger } from "@src/middleware";
import { badRequest, created, ok, unAuthorize } from "@src/middleware/response";
import UserModel, { UserSubcribesModel } from "@src/models/user";
import UserNotificationModel from "@src/models/user_notifications";
import { UserResponsivesModel } from "@src/models/user_password_reset";
import BillingSettingsService from "@src/services/billingSettingsService";
import NotificationService from "@src/services/notification";
import PaymentsService from "@src/services/paymentService";
import TaskScheduleService from "@src/services/TaskScheduleService";
import UserService from "@src/services/user";
import UserPotentialsService from "@src/services/userPotentialsService";
import UserSessionBll from "@src/services/userSession";
import ImageUtils from "@src/utils/image";
import PhoneNumberUtils from "@src/utils/phoneNumber";
import MailUtils from "@src/utils/sendMail";
import { mapUserAndCompanyData } from "@src/utils/userUtils";
import MsValidate from "@src/utils/validate";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import moment from "moment";
import passport from "passport";
import requestIp from 'request-ip';

export default class UserController {

  /** login with email and password */
  public login(req: Request, res: Response, next: NextFunction): void {
    try {
      passport.authenticate("user-login", { session: false }, async (err, user, info) => {
        try {
          if (err) return next(err);
          if (user) {
            const userService = new UserService();
            // check black list user
            // const ip = req.socket?.remoteAddress || null;
            const ip = requestIp.getClientIp(req) || null;
            const isBackListUser = await userService.checkBackListUser(user?.email, ip);
            if (!isBackListUser) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
            // update ip address user
            console.log('ip_address: ', ip);
            const isExisted = await userService.updateUserIPAddress(user.id, ip);
            if (isExisted < 0) return next({ message: COMMON_ERROR.pleaseTryAgain });

            const remember_me = req.body.remember_me ? true : false;
            const userSessionBll = new UserSessionBll();
            const result = await userSessionBll.create(user, remember_me);
            const auth_info = { access_token: result.access_token, refresh_token: result.refresh_token, expires_in: result.expires_in };
            delete user.password;
            const data = {
              auth_info,
              user_info: user
            };
            ok(data, req, res);
          }
        } catch (err) {
          next(err);
        }
      })(req, res);
    } catch (err) {
      next(err);
    }
  }
  public async checkEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const userService = new UserService();
      const msValidate = new MsValidate();
      const body = await msValidate.validateCheckMail(req.body);
      const isExisted = await userService.findByEmailSafe(body.email);
      if (isExisted) {
        return next({ message: USER_MESSAGE.emailAlreadyExists });
      }
      return ok({ message: "Email is valid" }, req, res);
    } catch (err) {
      next(err);
    }
  }
  /** refresh token */
  public async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userSessionBll = new UserSessionBll();
      const result = await userSessionBll.refreshToken(req.user as UserModel, req.body.refreshToken);
      res.status(200).send({ token: result.access_token, refresh_token: result.refresh_token, expires_in: result.expires_in });
    } catch (err) {
      next(err);
    }
  }
  // test crawl
  public async testCrawlerUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const name = get(req, "query.name", '');
      const salary = get(req, "query.salary", '');
      const multi_location = get(req, "query.multi_location", '');
      const range = get(req, "query.range", '');
      const employee = get(req, "query.employee", '');
      const fromage = get(req, "query.fromage", '');

      const configParams =  [
        { name: 'name', value: name },
        { name: 'salary', value: salary },
        { name: 'multi_location', value: multi_location},
        { name: 'range', value: range},
        { name: 'url', value: 'https://indeed.com/jobs'},
        { name: 'drivertype', value: 'indeed_jobs'},
        { name: 'employee', value: employee},
        { name: 'fromage', value: fromage}
      ]
      const taskScheduleService = new TaskScheduleService();
      const result = await taskScheduleService.saveUrlJobLocalCrawl(configParams);
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async testCrawlerJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskScheduleService = new TaskScheduleService();
      const result = await taskScheduleService.getAllJobInfoCrawl();
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async testCrawlerJobByUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const urlJob = get(req, "query.url", '');
      const taskScheduleService = new TaskScheduleService();
      const result = await taskScheduleService.getDetailsJobInfoByUrlCrawl(urlJob);
      if (!result) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      return ok({ file: result }, req, res);
    } catch (err) {
      next(err);
    }
  }
  // =========================
  public async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      delete user.password;
      const userService = new UserService();
      const companyInfo = await userService.getCompanyById(user.company_id);
      let userInfo: any = await userService.getById(user.id);
      userInfo = mapUserAndCompanyData(userInfo, companyInfo);

      if (userInfo.is_deleted) {
        return unAuthorize({}, req, res);
      }
      const paymentService = new PaymentsService();
      const userPotentialsService = new UserPotentialsService();
      const userPotentials = await userPotentialsService.findByEmailSafe(userInfo.email);
      if (userPotentials) {
        const listUserPotentialsCategory: any = await userPotentialsService.findListCategory(userPotentials.id);
        userInfo["user_potentials_categories"] = listUserPotentialsCategory;
        userInfo["is_user_potentials"] = true;
      }

      if (userInfo.acc_type == ACCOUNT_TYPE.Employer && userInfo.employer_id != 0) {
        const userResponse = new UserModel();
        userResponse.id = userInfo.id;
        userResponse.first_name = userInfo.first_name;
        userResponse.last_name = userInfo.last_name;
        userResponse.acc_type = userInfo.acc_type;
        userResponse.created_at = userInfo.created_at;
        userResponse.updated_at = userInfo.updated_at;
        userResponse.email_verified = userInfo.email_verified;
        userResponse.is_deleted = userInfo.is_deleted;
        userResponse.is_user_deleted = userInfo.is_user_deleted;
        userResponse.employer_title = userInfo.employer_title;
        userResponse.employer_id = userInfo.employer_id;
        userResponse.profile_picture = userInfo.profile_picture;
        userResponse.sign_up_step = userInfo.sign_up_step;
        userResponse.chat_group_id = userInfo.chat_group_id;
        userResponse.converge_ssl_token = userInfo.converge_ssl_token;
        userResponse.email = userInfo.email;
        userResponse.address_line = userInfo.address_line;
        userResponse.phone_number = userInfo.phone_number;
        userResponse.region_code = userInfo.region_code;
        userResponse.zip_code = userInfo.zip_code;
        userResponse.is_take_first_assessment = userInfo.is_take_first_assessment;

        const $per = userService.getEmployerMembersPermission(user.id);
        let $employer = userService.getById(userInfo.employer_id);
        const results = await Promise.all([$per, $employer]);
        const per = results[0];
        const listPermission = per.map(item => item.employer_permission_id);
        userResponse["permissions"] = listPermission;
        const $companyInfo = await userService.getCompanyById(userInfo.company_id);
        const employerInfo = {...$companyInfo, ...results[1] };
        userResponse["employer_info"] = employerInfo;
        const billing = await paymentService.getBillingInfo(userInfo.employer_id);
        userResponse["billingInfo"] = billing;
        return ok(userResponse, req, res);
      }
      const billing = await paymentService.getBillingInfo(user.id);
      userInfo["billingInfo"] = billing;
      return ok(userInfo, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async put(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req["currentUser"] as UserModel;
      const msValidate = new MsValidate();
      const userService = new UserService();
      // console.log(req.file);

      const body = await msValidate.validateUpdateUser(currentUser.acc_type, req.body);
      const isCheckUSerPotentials = body?.is_user_potentials;
      const emailUser = body?.email;
      let categoryUserPotentials = body?.category_user_potentials;

      delete body.email;
      delete body.is_user_potentials;
      if (body?.category_user_potentials) delete body.category_user_potentials;
      // const isExisted = await userService.findByEmailSafe(body.email);
      // if (isExisted && body.email && currentUser.email !== body.email) { return badRequest({ message: USER_MESSAGE.emailAlreadyExists }, req, res); }
      // check image
      if (req.file) {
        // console.log(req.file);
        const imageUltis = new ImageUtils();
        body.profile_picture = await imageUltis.resizeImage(req.file, currentUser.id);
      }
      let refUser;
      if (body.sign_up_step == 2) {
        // logic add refer
        if (currentUser.email_verified) {
          refUser = await userService.getUserReferLink(currentUser.id);
          if (refUser) {
            const updateRefUser = await userService.appliedLogicReferLink(refUser);
          }
        }
        // add free credits employer
        if (currentUser.acc_type == ACCOUNT_TYPE.Employer && currentUser.nbr_free_credits == 0) {
          const billingSettingsService = new BillingSettingsService();
          const employerSettings = await billingSettingsService.getSystemSettingsForEmployer();
          if (employerSettings.free_direct_message) {
            body.nbr_free_credits = employerSettings.free_direct_message;
          }
        };
      }

      if (isCheckUSerPotentials && isCheckUSerPotentials != '0') {
        const userPotentialsService = new UserPotentialsService();
        let listCategory = [];
        if (categoryUserPotentials) listCategory = JSON.parse("[" + categoryUserPotentials + "]");
        const firstName = body.first_name;
        const lastName = body.last_name;
        let userPotentials = await userPotentialsService.findByEmailSafe(emailUser);
        if (!userPotentials) { return badRequest({ message: USER_MESSAGE.emailNotExists }, req, res); }
        userPotentials.first_name = firstName;
        userPotentials.last_name = lastName;
        await userPotentialsService.updateUserPotentialsCompleteInfo(userPotentials);
        await userPotentialsService.updateUserPotentialsCategory(userPotentials, listCategory);
      }
      const update = await userService.update(currentUser.id, body);
      if (update) {
        if (refUser) { update['ReferralSuccess'] = true; }
        delete update.password;
        return ok(update, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req["currentUser"] as UserModel;
      const msValidate = new MsValidate();
      const userService = new UserService();
      const body = await msValidate.validateUpdateProfile(req.body);
      const bodyCopmpany = { ...body };
      delete bodyCopmpany.sign_up_step;
      const bodyUser: any = { sign_up_step: body.sign_up_step };

      // check member employer
      let updateUser = currentUser;
      if (currentUser.employer_id != 0) {
        updateUser = await userService.getById(currentUser.employer_id);
      }
      if (bodyUser.sign_up_step == 2) {
        // add free credits employer
        if (currentUser.acc_type == ACCOUNT_TYPE.Employer && currentUser.nbr_free_credits == 0) {
          const billingSettingsService = new BillingSettingsService();
          const employerSettings = await billingSettingsService.getSystemSettingsForEmployer();
          if (employerSettings.free_direct_message) {
            bodyUser.nbr_free_credits = employerSettings.free_direct_message;
          }
        };
      }
      bodyUser.sign_up_step = 2;
      const update = await userService.update(updateUser.id, bodyUser);
      if (!update) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      // update info compnay
      let updateCompany = await userService.updateInfoCompany(updateUser.company_id, bodyCopmpany);
      if (updateCompany) return ok(updateCompany, req, res);
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req["currentUser"] as UserModel;
      // const url = get(req, "body.path", "");
      // if (!url || url.indexOf(`/uploads/file/${currentUser.id}`) === -1) {
      //   return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      // }
      // const filePath = path.join(__dirname, `../../${url}`);
      // await fs.unlinkSync(filePath);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      logger.error(err);
      next({ message: COMMON_ERROR.notFoundImage });
    }
  }
  public async changeEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let currentUser = req["currentUser"] as UserModel;
      const msValidate = new MsValidate();
      const userService = new UserService();
      const email = get(req, "body.email", "");
      const obj = await msValidate.validateCheckMail({ email });

      if (currentUser.employer_id && currentUser.acc_type == ACCOUNT_TYPE.Employer) {
        currentUser = await userService.getById(currentUser.employer_id);
      }
      const isExisted = await userService.findByEmailSafe(obj.email);
      if (isExisted && isExisted.id !== currentUser.id) { return badRequest({ message: USER_MESSAGE.emailAlreadyExists }, req, res); }
      // check image
      const userModel = new UserModel();
      userModel.old_email = currentUser.email;
      userModel.email = obj.email;
      userModel.email_verified = 0;
      const update = await userService.changeEmailRequest(currentUser.id, userModel);
      if (update) {
        // send mail
        const mailUtil = new MailUtils();
        const sendMail = await mailUtil.changeEmail(update.new_email, update.token);
        if (!sendMail) {
          return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
        }
        return ok({ message: COMMON_SUCCESS.default }, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async verifiedEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const userService = new UserService();
      const body = req.body;
      const token = decodeURIComponent(body.token);
      const uec = await userService.findUserByToken(token);
      if (!uec) {
        return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res);
      }
      const tokenUser = await userService.findById(uec.user_id);
      if (!tokenUser) {
        return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res);
      }
      if (tokenUser.email != uec.new_email) {
        return badRequest({ message: USER_MESSAGE.emailNotMatch }, req, res);
      }
      const isExpired = moment.utc(uec.created_at).add(uec.expires_in, "seconds") > moment().utc();
      if (!isExpired) {
        return badRequest({ message: USER_MESSAGE.tokenExpired }, req, res);
      }
      const userUpdate = new UserModel();
      userUpdate.email_verified = 1;
      userUpdate.old_email = null;
      const user = await userService.changeEmailSuccess(uec.id, uec.user_id, userUpdate);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async completedSignup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req["currentUser"] as UserModel;
      if (currentUser.sign_up_step === 0) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      const body = new UserModel();
      body.sign_up_step = 2;
      const userService = new UserService();
      // logic add refer
      const refUser = await userService.getUserReferLink(currentUser.id);
      if (refUser) {
        const updateRefUser = await userService.appliedLogicReferLink(refUser);
      }
      // add free credits employer
      if (currentUser.acc_type == ACCOUNT_TYPE.Employer && currentUser.nbr_free_credits == 0) {
        const billingSettingsService = new BillingSettingsService();
        const employerSettings = await billingSettingsService.getSystemSettingsForEmployer();
        if (employerSettings.free_direct_message) {
          body.nbr_free_credits = employerSettings.free_direct_message;
        }
      };
      const update = await userService.update(currentUser.id, body);
      if (update) {
        delete update.password;
        return ok(update, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async sendSmsCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const msValidate = new MsValidate();
      const sendCodeObj = await msValidate.validateSendCode(req.body);
      const phoneService = new PhoneNumberUtils();
      const isvalid = phoneService.phoneNumberValidator(body.phone_number, body.region_code);
      const countryCode = phoneService.getCountryCode(body.phone_number, body.region_code);
      // send to twilio
      console.log(sendCodeObj);
      if (!isvalid) {
        return badRequest({ message: USER_MESSAGE.phoneNumberInvalid }, req, res);
      }
      return ok({ message: "Send Sms Successfully" }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const mailUtil = new MailUtils();
      const userService = new UserService();
      const isExistedUser = await userService.findByEmailSafe(body.email);
      if (!isExistedUser) { return badRequest({ message: USER_MESSAGE.emailNotExists }, req, res); }
      if (isExistedUser.status != COMMON_STATUS.Active && isExistedUser.is_deleted != 0 && isExistedUser.is_user_deleted != 0) {
        return badRequest({ message: USER_MESSAGE.userNotActive }, req, res);
      }
      const userSessionService = new UserSessionBll();
      const result = await userSessionService.genTokenForgot(body);
      if (!result) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      const sendMail = await mailUtil.forgotPassword(body.email, result.token, false, isExistedUser.acc_type, true, isExistedUser);
      if (!sendMail) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async setPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const userSessionService = new UserSessionBll();
      const token = decodeURIComponent(body.token);
      const forgotModel = (await userSessionService.findTokenForgot(token))[0];
      if (forgotModel == null) {
        return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res);
      }
      const email = forgotModel.email;
      const userService = new UserService();
      const isExisted = await userService.findByEmailSafe(email);
      if (!isExisted) { return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res); }
      delete body.token;
      const userUpdate = {
        password: body.password,
        email_verified: 1
      };
      const user = await userService.updatePassword(isExisted.id, userUpdate as UserModel);
      if (user) {
        // send twilio to verified sms
        delete user.password;
        const result = await userSessionService.create(user);
        const auth_info = { access_token: result.access_token, refresh_token: result.refresh_token, expires_in: result.expires_in };
        const data = {
          auth_info,
          user_info: user
        };
        userSessionService.deleteForgotPassById(forgotModel.id).then();
        return created(data, req, res);
      }
    } catch (err) {
      next(err);
    }
  }

  // sign up
  public async signup(req: Request, res: Response, next: NextFunction) {
    try {
      // check validate
      const msValidate = new MsValidate();
      delete req.body["g-recaptcha-response"];
      const ref = decodeURIComponent(req.body["ref"]);
      delete req.body["ref"];
      const body = await msValidate.validateSignup(req.body);
      const userService = new UserService();
      // check black list user
      // const ip = req.socket?.remoteAddress || null;
      const ip = requestIp.getClientIp(req) || null;
      const isBackListUser = await userService.checkBackListUser(body.email, ip);
      if (!isBackListUser) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      // check validate phone
      const phoneUtils = new PhoneNumberUtils();
      const isvalid = phoneUtils.phoneNumberValidator(body.phone_number, body.region_code);
      if (!isvalid) return badRequest({ message: USER_MESSAGE.phoneNumberInvalid }, req, res);
      // check verified code
      // if (parseInt(body.verified_code) !== 2612) {
      //   return badRequest({ message: "Verified Code invalid" }, req, res);
      // }
      // const countryCode = phoneUtils.getCountryCode(body.phone_number, body.region_code);

      // create new user
      delete body.verified_code;
      const isExisted = await userService.findByEmailSafe(body.email);
      if (isExisted) { return badRequest({ message: USER_MESSAGE.emailAlreadyExists }, req, res); }

      body.ip_address = ip;
      const user = await userService.create(body);
      if (user) {
        // creat group
        const groupObj = await userService.createGroupSupportChat(user);
        if (user.acc_type == ACCOUNT_TYPE.Employer) {
          const companyInfo: any = { chat_group_id: groupObj.groupInfo.id, employer_id: user.id };
          const company = await userService.createInfoCompany(companyInfo);
          user.company_id = company.id;
          userService.update(user.id, user);
        }
        delete user.password;
        const userSessionBll = new UserSessionBll();
        const result = await userSessionBll.create(user, false);
        const auth_info = { access_token: result.access_token, refresh_token: result.refresh_token, expires_in: result.expires_in };
        delete result["password"];
        const data = {
          auth_info,
          user_info: user
        };
        // check ref link
        if (ref) {
          const refUser = await userService.addUserReferLink(ref, user.id);
        }
        const companyInfo = await userService.getCompanyById(user.company_id);
        if(companyInfo) user['company_name'] = companyInfo.company_name;
        // send mail
        const mailUtil = new MailUtils();
        const sendMail = await mailUtil.activeAccount(body.email, user.verified_token, false, user);
        if (!sendMail) {
          return badRequest({ message: COMMON_ERROR.sendMailError }, req, res);
        }
        return created(data, req, res);
      }
    } catch (err) {
      next(err);
    }
  }

  // active member employer
  public async activeAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userService = new UserService();
      const body = req.body;
      const token = decodeURIComponent(body.token);
      let user = await userService.findByVerifiedToken(token);
      if (!user) {
        return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res);
      }
      delete body.token;
      const userUpdate = new UserModel();
      userUpdate.email_verified = 1;
      userUpdate.verified_token = null;
      if (user.employer_id) {
        userUpdate.sign_up_step = 2;
      }
      user = await userService.update(user.id, userUpdate);
      if (user) {
        if (user.employer_id) {
          // creat group
          await userService.createGroupSupportChat(user);
        }
        // logic add refer
        if (userUpdate.acc_type == ACCOUNT_TYPE.JobSeeker && userUpdate.sign_up_step == 2) {
          const refUser = await userService.getUserReferLink(userUpdate.id);
          if (refUser) {
            const updateRefUser = await userService.appliedLogicReferLink(refUser);
          }
        }
        // send twilio to verified sms
        delete user.password;
        const userSessionBll = new UserSessionBll();
        const result = await userSessionBll.create(user);
        const auth_info = { access_token: result.access_token, refresh_token: result.refresh_token, expires_in: result.expires_in };
        const data = {
          auth_info,
          user_info: user
        };
        return created(data, req, res);
      }
    } catch (err) {
      next(err);
    }
  }
  public async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as any;
      const oldPassword = get(req, "body.oldPassword", "");
      const newPassword = get(req, "body.newPassword", "");
      const msValidate = new MsValidate();
      const userService = new UserService();
      // console.log(req.file);
      const body = await msValidate.validateChangePass({ oldPassword, newPassword });
      const isExisted = await userService.findById(user.id);
      const userUpdate = {
        password: newPassword
      };
      const checkPassword = userService.checkPassword(isExisted, oldPassword);
      if (!checkPassword) {
        return badRequest({ message: "Current password is not correct." }, req, res);
      }
      const userResult = await userService.updatePassword(isExisted.id, userUpdate as UserModel);

      new NotificationService().insert({
        data: new UserNotificationModel({
          user_id: userResult.id,
          user_acc_type: userResult.acc_type,
          type: NOTIFICATION_TYPE.PasswordChange,
        })
      });
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async deleleAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as any;
      const userService = new UserService();
      const result = await userService.makeDeleleByUser(user.id);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  // gen refer link
  public async genReferLink(req: Request, res: Response, next: NextFunction) {
    try {
      let user = req["currentUser"] as UserModel;
      const userService = new UserService();
      if (!user.refer_link) {
        user = await userService.genReferLink(user.id);
      }
      // link = `/register?ref=${encodeURIComponent(user.refer_link)}`;
      return ok({ refer_link: user.refer_link }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async voteResponsive(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;
      const userService = new UserService();
      const body = req.body as UserResponsivesModel;
      const objecter = await userService.findById(body.user_id);
      if (!objecter || objecter.acc_type == user.acc_type) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      const reporterId = (user.acc_type == ACCOUNT_TYPE.Employer && user.employer_id > 0) ? user.employer_id : user.id;
      await userService.voteResponsive(body.user_id, reporterId, body.is_responsive, objecter, body.group_nomal_type);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getVoteResponsive(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;
      const userId = parseInt(req.param("user_id", 0));
      const groupNomalType = parseInt(req.param("group_nomal_type", GROUP_NOMAL_TYPE.Nomal));
      const userService = new UserService();
      const objecter = await userService.findById(userId);
      if (!objecter || objecter.acc_type == user.acc_type) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      const reporterId = (user.acc_type == ACCOUNT_TYPE.Employer && user.employer_id > 0) ? user.employer_id : user.id;
      const result = await userService.getVoteResponsive(userId, reporterId, groupNomalType);
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async createSurveysUserInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;
      const userService = new UserService();
      const userSurvey = req.body;
      userSurvey['user_id'] = user.id;
      const result = await userService.createSurveysUserInfo(userSurvey);
      if (!result) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateSurveysUserInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;
      const userService = new UserService();
      const userSurvey = req.body.userSurvey;
      const idUser = req.body.id;
      const result = await userService.updateSurveysUserInfo(idUser, userSurvey);
      if (!result) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateCompanyTable(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;
      const userService = new UserService();
      const results = await userService.updateCompanyTableData();
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async updateCompanyUserTableData(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;
      const userService = new UserService();
      const results = await userService.updateCompanyUserTableData();
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getSurveysUserInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const userService = new UserService();
      const user = req["currentUser"] as UserModel;
      const result = await userService.getSurveysUserInfo(user.id);
      if (!result) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async unsubcribeReceiveUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const msValidate = new MsValidate();
      const body = await msValidate.validateUnsubcribe(req.body);

      const userService = new UserService();
      const current = await userService.findUserSubcribeByParams({ email: body.email, is_subscribe: true });
      if (!current) return badRequest({ message: USER_MESSAGE.emailNotExists }, req, res);

      const update = new UserSubcribesModel({
        ...current,
        is_subscribe: false,
        reason_unsubcribe: body.reason_unsubcribe,
        reason_unsubcribe_type: body.reason_unsubcribe_type,
      });
      if ((await userService.unsubcribeReceiveUpdate(update)) > 0) {
        return created({ message: COMMON_SUCCESS.default }, req, res);
      }
      else
        throw (COMMON_ERROR.pleaseTryAgain)
    } catch (err) {
      next(err);
    }
  }
  public async signupToReceiveUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      // check validate
      const msValidate = new MsValidate();
      delete req.body["g-recaptcha-response"];
      const body = await msValidate.validateSignupSubcribe(req.body);

      // create new user
      const userService = new UserService();
      let user: UserSubcribesModel = null;
      let current = await userService.findUserSubcribeByEmail(body.email, 0);
      if (current) {
        if (current.is_subscribe)
          return badRequest({ message: USER_MESSAGE.emailAlreadyExistsSubcribe }, req, res);
        else {
          current = {
            ...current,
            ...body,
            id: current.id,
            is_subscribe: true,
          }
          user = await userService.updateUserSubcribe(current, current.id);
        }
      }
      else
        user = await userService.createUserSubcribe(body);
      if (user) {
        const mailUtil = new MailUtils();
        mailUtil.confirmationSignupToUpdate(user.email, user.acc_type).then();
        return created({ message: COMMON_SUCCESS.default }, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getDelegateInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userSessionService = new UserSessionBll();
      const token = decodeURIComponent(req.body.token);
      const result = await userSessionService.findTokenForgot(token);
      if (!result || result.length == 0) {
        return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res);
      }
      const email = result[0].email;
      const userService = new UserService();
      const isExisted = await userService.findByEmailSafe(email);
      if (!isExisted) { return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res); }
      const user = {
        id: isExisted.id,
        email: isExisted.email,
        employer_title: isExisted.employer_title,
        employer_id: isExisted.employer_id,
        first_name: isExisted.first_name,
        last_name: isExisted.last_name,
        profile_picture: isExisted.profile_picture
      }
      return ok(user, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async completeDelegateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userSessionService = new UserSessionBll();
      const token = decodeURIComponent(req.body.token);
      const result = await userSessionService.findTokenForgot(token);
      if (!result || result.length == 0) {
        return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res);
      }
      const email = result[0].email;
      const userService = new UserService();
      const isExisted = await userService.findByEmailSafe(email);
      if (!isExisted) { return badRequest({ message: USER_MESSAGE.tokenNotMatch }, req, res); }
      delete req.body.token;
      const msValidate = new MsValidate();
      delete req.body.email;
      const body = await msValidate.validateDelegateAccount(req.body);
      const userUpdate = Object.assign({ email_verified: 1 }, body) as UserModel;
      if (req.file) {
        // console.log(req.file);
        const imageUltis = new ImageUtils();
        body.profile_picture = await imageUltis.resizeImage(req.file, userUpdate.id);
      }
      const user = await userService.updatePassword(isExisted.id, userUpdate as UserModel);
      if (user) {
        // send twilio to verified sms
        delete user.password;
        const userSessionBll = new UserSessionBll();
        const result = await userSessionBll.create(user);
        const auth_info = { access_token: result.access_token, refresh_token: result.refresh_token, expires_in: result.expires_in };
        const data = {
          auth_info,
          user_info: user
        };

        await new NotificationService().insert({
          data: new UserNotificationModel({
            user_id: user.employer_id,
            user_acc_type: user.acc_type,
            type: NOTIFICATION_TYPE.AccountActiveInvite,
            metadata: JSON.stringify({
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              profile_picture: user.profile_picture,
            }),
          })
        });

        return created(data, req, res);
      }
    } catch (err) {
      next(err);
    }
  }

  // Start user story
  public async getAllUserStory(req: Request, res: Response, next: NextFunction) {
    try {
      const userService = new UserService();
      const user = req["currentUser"] as UserModel;
      const result = await userService.getUserStoryInfo(user.id);
      if (!result) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async createUserStory(req: Request, res: Response, next: NextFunction) {
    try {
      const userService = new UserService();
      const user = req["currentUser"] as UserModel;
      let body = req.body;
      const token = bcrypt.hashSync(`${user.id}${body.name}${moment.utc().toISOString()}`, 10);
      body = {...body,
         user_id: user.id, 
         token: token
      };
      const result = await userService.createUserStoryInfo(body);
      if (!result) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getUserStoryByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userService = new UserService();
      const token = get(req, "query.token", "");
      const result = await userService.getUserStoryByToken(token);
      if (!result) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async updateUserStory(req: Request, res: Response, next: NextFunction) {
    try {
      const userService = new UserService();
      const id = get(req, "params.id", "");
      let body = req.body;
      const result = await userService.updateUserStoryInfo(id, body);
      if (!result) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      return ok({message: 'update success'}, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async deleteUserStory(req: Request, res: Response, next: NextFunction) {
    try {
      const userService = new UserService();
      const id = get(req, "params.id", "");
      const result = await userService.deleteUserStoryInfo(id);
      if (!result) {
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      }
      return ok({message: 'delete success'}, req, res);
    } catch (err) {
      next(err);
    }
  }
  // End user story
}
