import { ACCOUNT_TYPE, EXPORT_TYPE, JOB_STATUS, PAGE_SIZE, PAYMENT_TYPE } from "@src/config";
import { COMMON_ERROR, COMMON_SUCCESS, JOB_MESSAGE } from "@src/config/message";
import { logger } from "@src/middleware";
import { badRequest, ok } from "@src/middleware/response";
import JobsModel from "@src/models/jobs";
import { UserBillingInfoModel } from "@src/models/payments";
import UserModel from "@src/models/user";
import BillingSettingsService from "@src/services/billingSettingsService";
import JobsService from "@src/services/jobsService";
import PaymentCouponService from "@src/services/paymentCouponService";
import PaymentsService from "@src/services/paymentService";
import PaymentExportUtils from "@src/utils/paymentExportUtils";
import ConvergeUtils from "@src/utils/paymetCorvegeUtils";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import moment from "moment";
export default class JobsController {
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
  // ================== end payment cart ==========================
  // ================== start payment ==========================
  public async paymentForJobseeker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      delete req.body["g-recaptcha-response"];
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      const msValidate = new MsValidate();
      const paymentType = get(req, "body.paymentType", PAYMENT_TYPE.ValidateTest);
      const assessment = get(req, "body.assessment", {});
      const numRetake = get(req, "body.numRetake", 0);
      const sslToken = get(req, "body.ssl_token", "");
      const isSaveCard = get(req, "body.isSaveCard", 1);
      const coupon = get(req, "body.coupon", "");
   
      if (
        (paymentType != PAYMENT_TYPE.BuyCredit && paymentType != PAYMENT_TYPE.ValidateTest && paymentType != PAYMENT_TYPE.RetryValidateTest && paymentType != PAYMENT_TYPE.Topup)
        || ((paymentType == PAYMENT_TYPE.ValidateTest || paymentType == PAYMENT_TYPE.RetryValidateTest) && !assessment.id)
        || (paymentType == PAYMENT_TYPE.Topup && !numRetake)
        || (paymentType == PAYMENT_TYPE.BuyCredit && !numRetake)
      ) { return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res); }
      const notPayment = get(req, "body.notPayment", 0);
      let billingInfo;
      if (!notPayment) {
        const billingAddressBody = {
          address_line_1: req.body.address_line_1,
          address_line_2: req.body.address_line_2,
          city_name: req.body.city_name,
          state_name: req.body.state_name,
          zip_code: req.body.zip_code,
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          company_name: req.body.company_name
        };
        billingInfo = await msValidate.validateCreateBilling(billingAddressBody) as UserBillingInfoModel;
      }
      // const amountObj = await paymentsService.calcTotalAmountJobseeker(paymentType, numRetake);
      // const resultTax = await paymentsService.getTax(billingAddress, user.id, amountObj.amount);
      // if(resultTax.totalTax != tax) {
      //   const message = "tax different";
      //   // const message = COMMON_ERROR.pleaseTryAgain;
      //   return badRequest({ message }, req, res);
      // }
      if (sslToken) {
        user.converge_ssl_token = sslToken;
      }
      const results = await paymentsService.paymentJobseeker(user, paymentType, numRetake, assessment, isSaveCard, coupon, billingInfo);
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
  // ================== end payment ================================

  // ================== start card info ============================
  public async updateCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      const sslToken = get(req, "body.ssl_token", "");
      if (!sslToken) { return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res); }
      const results = await paymentsService.updateCard(user, sslToken);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async deleteCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      if (!user.converge_ssl_token) { return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res); }
      const results = await paymentsService.deleteCard(user);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getCardInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      if (!user.converge_ssl_token) { return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res); }
      const results = await paymentsService.getCardDetail(user);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  // ================== end card info ================================

  // ================== start get billing ============================
  public async getBillingSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const billingSettingsService = new BillingSettingsService();
      if (user && user.acc_type == ACCOUNT_TYPE.JobSeeker) {
        const results = await billingSettingsService.getSystemSettingsForJobSeeker();
        return ok(results, req, res);
      }
      const results = await billingSettingsService.getSystemSettingsForEmployer();
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getBillingHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Standand));
      const paymentsService = new PaymentsService();
      const results = await paymentsService.getBillingHistory(user.id, page, pageSize);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async exportBillingHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      const paymentExportUtils = new PaymentExportUtils();
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Standand));
      const type = get(req, "params.type", "");

      let payments = await paymentsService.getBillingHistory(user.id, page, pageSize, true);
      if (user.acc_type === ACCOUNT_TYPE.Employer) {
        payments = paymentsService.genEmployerPayment(payments, type);
      } else if (user.acc_type === ACCOUNT_TYPE.JobSeeker) {
        payments = paymentsService.genJobSeekerPayment(payments, type);
      }

      let filePath = null;
      const timestamp = Date.now();
      const fileName = `billing-history-${user.first_name || user.company_name.replace(/ /g, "")}-${timestamp}`;
      if (type === EXPORT_TYPE.Excel) {
        if (user.acc_type === ACCOUNT_TYPE.Employer) {
          filePath = await paymentExportUtils.exportEmployerBillingHistoryExcel(payments, fileName);
        } else if (user.acc_type === ACCOUNT_TYPE.JobSeeker) {
          filePath = await paymentExportUtils.exportJobSeekerBillingHistoryExcel(payments, fileName);
        }
      } else if (type === EXPORT_TYPE.PDF) {
        filePath = await paymentExportUtils.exportBillingHistoryPDF(payments, fileName, user.acc_type, user);
      }

      return ok({ filePath }, req, res);
    } catch (err) {
      next(err);
    }
  }
  // ================== end get billing ============================
  
  // ================== start AvaTax ===============================
  // public async createTransactionAva(req: Request, res: Response, next: NextFunction): Promise<void> {
  //   try {
  //     const taxDocument = {
  //       type: 'SalesInvoice',
  //       companyCode: 'DEFAULT-2',
  //       date: '2021-04-20',
  //       customerCode: 'ABC',
  //       // purchaseOrderNo: '2017-04-12-001',
  //       addresses: {
  //         SingleLocation: {
  //           line1: req.body.line1,
  //           city: req.body.city,
  //           region: req.body.region,
  //           country: 'US',
  //           postalCode: req.body.postalCode
  //         }
  //       },
  //       lines: [
  //         {
  //           number: '1',
  //           quantity: req.body.quantity,
  //           amount: req.body.amount,
  //           description: req.body.description
  //         },
  //       ],
  //       commit: true,
  //       currencyCode: 'USD',
  //       description: req.body.description
  //     }

  //     const result = await avaClient.createTransaction({ model: taxDocument });
  //     return ok(result, req, res);
  //   } catch (err) {
  //     next(err);
  //   }
  // }
  // public async commitTransactionAva(req: Request, res: Response, next: NextFunction): Promise<void> {
  //   try {
  //     const transactionCode = req.body.transactionId;
  //     const transaction = await avaClient.getTransactionByCode({ companyCode: "DEFAULT-2", transactionCode });
  //     if (transaction.status != "Saved") {
  //       return badRequest({ message: "transaction code not saved" }, req, res);
  //     }

  //     const result = await avaClient.commitTransaction({ companyCode: "DEFAULT-2", transactionCode, model: { commit: true } });
  //     return ok(result, req, res);
  //   } catch (err) {
  //     next(err);
  //   }
  // }
  public async getTax(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const msValidate = new MsValidate();
      const body = req.body;
      const paymentService = new PaymentsService();
      const isSaveBilling = +get(req, 'body.isSaveBilling', 1);
      const subTotal = +get(req, 'body.sub_total', 0);
      const discountValue = +get(req, 'body.discount_value', 0);
      const paymentType = +get(req, 'body.payment_type', PAYMENT_TYPE.StandardJob);
      delete req.body.isSaveBilling;
      delete req.body.sub_total;
      delete req.body.discount_value;
      delete req.body.payment_type;
      const billingAddress = await msValidate.validateCreateBilling(body) as UserBillingInfoModel;
      const resultTax = await paymentService.getTax(billingAddress, user, subTotal, discountValue, paymentType);
      const data = {
        avatax: {
          amount: resultTax.totalAmount,
          tax: resultTax.totalTax
        }
      } 
      if (isSaveBilling) {
        billingAddress.user_id = user.id;
        data['userBillingInfo'] = await paymentService.saveBillingInfo(billingAddress);
      }
      return ok(data, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async checkCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const paymentCouponService = new PaymentCouponService();
      const couponCode = get(req, 'body.coupon', "");
      const checkCouponObj = await paymentCouponService.checkCoupon(couponCode, user);
      return ok(checkCouponObj, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async transaction_token(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const object = req.body;
      const convergeUtils = new ConvergeUtils();
      console.log('body:', object)
      const result = await convergeUtils.getTransactionToken(object);
      return ok({data: result}, req, res);
    } catch (err) {
      next(err);
    }
  }
}