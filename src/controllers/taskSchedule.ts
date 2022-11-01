
import { ok } from "@src/middleware/response";
import UserModel from "@src/models/user";
import TaskScheduleService from "@src/services/TaskScheduleService";
import { NextFunction, Request, Response } from "express";
import moment from "moment";

export default class TaskScheduleController {
  public static bll: TaskScheduleService;
  constructor() {
    TaskScheduleController.bll = TaskScheduleController.bll == null ? new TaskScheduleService() : TaskScheduleController.bll;
  }
  public async execute(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req["currentUser"] as UserModel;
      const { type: typeTask } = req.params || {};
      if (typeTask == 'removeAfter30Day')
        TaskScheduleController.bll.removeAfter30Day();
      else if (typeTask == 'newJobsToFollower')
        TaskScheduleController.bll.newJobsToFollower();
      else if (typeTask == 'newJobsSuggestJobseeker')
        TaskScheduleController.bll.newJobsSuggestJobseeker();
      else if (typeTask == 'reminderCompleteApplication')
        TaskScheduleController.bll.reminderCompleteApplication();
      else if (typeTask == 'reminderSavedJobExpire')
        TaskScheduleController.bll.reminderSavedJobExpire();
      else if (typeTask == 'unreadMessages')
        TaskScheduleController.bll.unreadMessages();
        
      return ok({ Success: 1, Data: {
        execute: typeTask,
        time: moment().utc().format('YYYY-MM-DD HH:mm:ss')
      } }, req, res);
    } catch (err) {
      next(err);
    }
  }
}