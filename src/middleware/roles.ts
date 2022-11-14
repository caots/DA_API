import { ACCOUNT_TYPE, ADMIN_ACCOUNT_STATUS, ADMIN_ACCOUNT_TYPE } from "@src/config";
import { COMMON_ERROR } from "@src/config/message";
import AdminModel from "@src/models/admin";
import UserModel from "@src/models/user";
import { checkAdminPermission } from "@src/utils/checkPermission";
import { NextFunction, Request, Response } from "express";
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
    return next();
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
