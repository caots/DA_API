import { ACCOUNT_TYPE, ADMIN_ACCOUNT_STATUS, ADMIN_ACCOUNT_TYPE, PERMISSION_EMPLOYER } from "@src/config";
import { COMMON_ERROR } from "@src/config/message";
import AdminModel from "@src/models/admin";
import UserModel from "@src/models/user";
import UserBll from "@src/services/user";
import { checkAdminPermission } from "@src/utils/checkPermission";
import { NextFunction, Request, Response } from "express";
import { cloneDeep } from "lodash";
import { forbidden } from "./response";
export const checkRole = (...permittedRoles) => {
  // return a middleware
  return (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req["currentUser"] as UserModel;
    if (!currentUser && permittedRoles.includes(ACCOUNT_TYPE.Guest)) {
      return next();
    } else {
      if (!currentUser || !permittedRoles.includes(currentUser.acc_type)) {
        return forbidden({ message: COMMON_ERROR.forbidden }, req, res);
      }
      // check permission member employer;
    }
    next(); // role is allowed, so continue on the next middleware
  };

};
export const permissionsEmp = (permitted: number) => {
  // return a middleware
  return async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req["currentUser"] as UserModel;
    // check permission member employer;
    if (currentUser.acc_type != ACCOUNT_TYPE.Employer || currentUser.employer_id == 0) {
      return next();
    }
    if (permitted == PERMISSION_EMPLOYER.NotAllow) {
      return forbidden({ message: COMMON_ERROR.notPermission }, req, res);
    }
    const userService = new UserBll();
    const permissions = await userService.getEmployerMembersPermission(currentUser.id);
    const listPermission = permissions.map(item => item.employer_permission_id);
    if (listPermission.includes(permitted) || permitted == PERMISSION_EMPLOYER.AllowOther) {
      currentUser.onwer_id = cloneDeep(currentUser.id);
      currentUser.id = currentUser.employer_id;
      const masterUser = await userService.getById(currentUser.employer_id);
      currentUser.companyInfo = masterUser;
      currentUser.converge_ssl_token = masterUser.converge_ssl_token;

      return next();
    }
    return forbidden({ message: COMMON_ERROR.notPermission }, req, res);
  };

};
export const checkAdminRole = (permitted: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req["currentUser"] as AdminModel;
    if (!currentUser || currentUser.acc_type !== permitted) {
      return forbidden({ message: COMMON_ERROR.forbidden }, req, res);
    }
    next();
  };
};
export const permissionsAdmin = (permitted: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const adminUser = req["currentUser"] as AdminModel;
    if (adminUser.acc_type === ADMIN_ACCOUNT_TYPE.SuperAdmin) {
      return next();
    }
    if (adminUser.status !== ADMIN_ACCOUNT_STATUS.Active) {
      return forbidden({ message: COMMON_ERROR.notPermission }, req, res);
    }
    return checkAdminPermission(adminUser, permitted) ?
      next() :
      forbidden({ message: COMMON_ERROR.notPermission }, req, res);
  };
};
