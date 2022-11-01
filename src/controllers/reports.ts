import { JOB_MESSAGE } from "@src/config/message";
import { logger } from "@src/middleware";
import { badRequest, ok } from "@src/middleware/response";
import UserModel from "@src/models/user";
import JobsService from "@src/services/jobsService";
import UserBll from "@src/services/user";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
export default class JobsController {

  public async reportCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const msValidate = new MsValidate();
      req.body.reporter_id = user.id;
      const reportParams = await msValidate.validateReportCompany(req.body);
      const userService = new UserBll();
      const company = await userService.findById(reportParams.company_id);
      if (!company) { return badRequest({ message: JOB_MESSAGE.companyNotExists }, req, res); }
      reportParams.comany_name = company.city_name;
      reportParams.reporter_first_name = user.first_name;
      reportParams.reporter_last_name = user.last_name;
      const newReport = await userService.createReport(reportParams);
      logger.info("newReport");
      logger.info(JSON.stringify(newReport));
      return ok({ message: "Created sucess" }, req, res);
    } catch (err) {
      next(err);
    }
  }
}