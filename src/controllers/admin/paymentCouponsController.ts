import { ACCOUNT_TYPE, PAGE_SIZE, PAYMENT_COUPON_STATUS } from "@src/config";
import { COMMON_SUCCESS, PAYMENT_COUPON_MESSAGE } from "@src/config/message";
import { logger } from "@src/middleware";
import { badRequest, ok } from "@src/middleware/response";
import { PaymentCouponsModel } from "@src/models/payments";
import PaymentCouponService from "@src/services/paymentCouponService";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";

export default class PaymentCouponsController {
  public async gets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Standand));
      const accountType = parseInt(req.param("accountType", ACCOUNT_TYPE.Employer));
      const paymentCouponService = new PaymentCouponService();
      const datas = await paymentCouponService.gets(accountType, page, pageSize);
      if (accountType == ACCOUNT_TYPE.Employer) {
        datas.results = await Promise.all(
          datas.results.map(async (object: PaymentCouponsModel) => {
            object.user_available_list = await paymentCouponService.findUserAvailable(object.id);
            return object;
          })
        );
      }
      return ok(datas, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentCouponService = new PaymentCouponService();
      let newCoupon;
      const couponId = get(req, "params.id", 0);
      newCoupon = await paymentCouponService.delete(couponId);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentCouponService = new PaymentCouponService();
      const msValidate = new MsValidate();
      const body = get(req, "body", {}) as PaymentCouponsModel;
      let newCoupon;
      if (body.discount_acc_type != ACCOUNT_TYPE.Employer && body.discount_acc_type != ACCOUNT_TYPE.JobSeeker) {
        return badRequest({ message: "No discount_acc_type select" }, req, res);
      }
      if (body.status == PAYMENT_COUPON_STATUS.Inactive) {
        logger.info("draft");
        const nbrProp = Object.keys(body).length;
        if (nbrProp == 1) { return badRequest({ message: "Create Failed" }, req, res); }
        newCoupon = await paymentCouponService.add(body);
        return ok({ message: "Created sucess." }, req, res);
      }
      if ((!body.user_available || body.user_available.length == 0) && !body.is_for_all_user && body.discount_acc_type == ACCOUNT_TYPE.Employer) {
        return badRequest({ message: PAYMENT_COUPON_MESSAGE.EmployerApplied }, req, res);
      }
      const couponParams = await msValidate.validateCreateCoupon(body) as PaymentCouponsModel;
      newCoupon = await paymentCouponService.add(couponParams);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentCouponService = new PaymentCouponService();
      const msValidate = new MsValidate();
      const body = get(req, "body", {}) as PaymentCouponsModel;
      let newCoupon;
      const couponId = get(req, "params.id", 0);
      if (body.discount_acc_type != ACCOUNT_TYPE.Employer && body.discount_acc_type != ACCOUNT_TYPE.JobSeeker) {
        return badRequest({ message: "No discount_acc_type select" }, req, res);
      }
      if (body.status == PAYMENT_COUPON_STATUS.Inactive) {
        logger.info("draft");
        const nbrProp = Object.keys(body).length;
        if (nbrProp == 1) { return badRequest({ message: "Create Failed" }, req, res); }
        newCoupon = await paymentCouponService.update(couponId, body);
        return ok({ message: "Created sucess." }, req, res);
      }
      if ((!body.user_available || body.user_available.length == 0) && !body.is_for_all_user && body.discount_acc_type == ACCOUNT_TYPE.Employer) {
        return badRequest({ message: PAYMENT_COUPON_MESSAGE.EmployerApplied }, req, res);
      }
      const couponParams = await msValidate.validateCreateCoupon(body) as PaymentCouponsModel;
      newCoupon = await paymentCouponService.update(couponId, couponParams);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentCouponService = new PaymentCouponService();
      const couponId = get(req, "params.id", 0);
      const current = await paymentCouponService.findById(couponId);
      if (!current) {
        return badRequest({ message: "id not valid" }, req, res);
      }
      if (current.discount_acc_type == ACCOUNT_TYPE.Employer && !current.is_for_all_user) {
        current.user_available_list = await paymentCouponService.findUserAvailable(current.id);
      }
      return ok(current, req, res);
    } catch (err) {
      next(err);
    }
  }
}
