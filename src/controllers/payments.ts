import { JOB_STATUS } from "@src/config";
import { COMMON_ERROR, COMMON_SUCCESS, JOB_MESSAGE } from "@src/config/message";
import { logger } from "@src/middleware";
import { badRequest, ok } from "@src/middleware/response";
import JobsModel from "@src/models/jobs";
import UserModel from "@src/models/user";
import JobsService from "@src/services/jobsService";
import PaymentsService from "@src/services/paymentService";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import moment from "moment";

export default class JobsController {

  // ================== start payment cart ==========================
  public async getPaymentCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      const results = await paymentsService.getPaymentCart(user.id);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async removePaymentCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      const cartId = get(req, "params.id", 0);
      const results = await paymentsService.removeToCart(cartId);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  // 
  public async getSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      const results = await paymentsService.getPaymentCart(user.id);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async paymentForEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      const carts = req.body.carts as any[];
      if (carts.length == 0) { return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res); }
      const results = await paymentsService.paymentEmployer(user, carts);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async paymentForBuyMorePrivateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      delete req.body["g-recaptcha-response"];
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      const jobs = req.body.jobs as any[];
      
      if (jobs.length == 0) { return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res); }
      const results = await paymentsService.paymentEmployerBuyMorePrivateJob(jobs);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async paymentForUpgradeJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      delete req.body["g-recaptcha-response"];
      const user = req["currentUser"] as UserModel;
      const jobService = new JobsService();
      const paymentsService = new PaymentsService();
      const jobs = req.body.jobs as JobsModel[];
      if (jobs.length == 0) { return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res); }
      console.log(`Start paymentForUpgradeJob controller.`);
      logger.info(`Start paymentForUpgradeJob controller.`);
      console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
      logger.info(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
      const msValidate = new MsValidate();
      const currentJob = await jobService.getJobByIdEmployerId(jobs[0].id, user.id);
      if (!currentJob) { return badRequest({ message: JOB_MESSAGE.jobNotExists }, req, res); }
      const expiredJob = moment.utc(currentJob.expired_at);
      const dateNow = moment().utc();
      if (currentJob.is_private || currentJob.status != JOB_STATUS.Active || !currentJob.expired_at || expiredJob < dateNow) {
        return badRequest({ message: JOB_MESSAGE.jobNotActive }, req, res);
      }
      const jobParams = await msValidate.validateUpgradeJob(jobs[0]) as JobsModel;
      console.log(`Start Service Payment.`);
      logger.info(`Start Service Payment.`);
      console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
      logger.info(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
      const results = await paymentsService.paymentEmployerUpgradeJob(user, jobParams, currentJob);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
}