
import { COMMON_ERROR } from "@src/config/message";
import { badRequest, ok } from "@src/middleware/response";
import UserModel from "@src/models/user";
import NotificationService from "@src/services/notification";
import { NextFunction, Request, Response } from "express";

export default class NotificationController {
  public static bll: NotificationService;
  constructor() {
    NotificationController.bll = NotificationController.bll == null ? new NotificationService() : NotificationController.bll;
  }
  public async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", 6));
      const isRead = parseInt(req.param("isRead", -1));

      let list = await NotificationController.bll.getListByUserId(user.id, page, pageSize, isRead);
      return ok(list, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;
      const notification_id = req.param("id", '');
      var ids = (notification_id + '').split(',').map(e => e.trim()).filter(e => e != null && e != '').map(e => parseInt(e));
      if (ids.length <= 0)
        return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      const notification = await NotificationController.bll.markRead(user.id, ids);
      return ok(notification, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async totalMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;

      let data = await NotificationController.bll.total(user.id);
      return ok({ total: data }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async clickApplyJob(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;
      const jobId = parseInt(req.param("id", 0));

      await NotificationController.bll.addJobTrigger(jobId, user.id);
      return ok({ message: "success" }, req, res);
    } catch (err) {
      next(err);
    }
  }
}