import { ACCOUNT_TYPE, COUPON_DISCOUNT_TYPE, COUPON_EXPIRED_TYPE, PAGE_SIZE, PAYMENT_COUPON_STATUS } from "@src/config";
import { PAYMENT_COUPON_MESSAGE } from "@src/config/message";
import HttpException from "@src/middleware/exceptions/httpException";
import { PaymentCouponsModel, PaymentCouponUserAvailablesModel, PaymentCouponUserHistoryModel } from "@src/models/payments";
import UserModel from "@src/models/user";
import { cloneDeep } from "lodash";
import moment from "moment";
import { transaction } from "objection";

export default class PaymentCouponService {

  public async gets(
    accType = ACCOUNT_TYPE.Employer,
    page = 0, pageSize = PAGE_SIZE.Standand, orderNo = 0
  )
    : Promise<any> {
    try {
      const selects = [
        "payment_coupons.*"
      ];
      // if (accType == ACCOUNT_TYPE.Employer) {
      //   const select = await raw(`(select PCUA.user_id, U.company_name from payment_coupon_user_availables as PCUA` +
      //     ` JOIN users as U ON U.id = PCUA.user_id where PCUA.payment_coupon_id = payment_coupons.id) as user_available_list`);
      //   selects.push(select);
      // };
      // .leftJoin("payment_coupon_user_availables as PCUA", "PCUA.payment_coupon_id", "PC.id")
      return PaymentCouponsModel.query()
        .select(selects)
        .where("payment_coupons.discount_acc_type", accType)
        .whereNot("payment_coupons.status", PAYMENT_COUPON_STATUS.Deleted)
        .orderBy("payment_coupons.created_at", "desc")
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findByCodeAndAccType(accType: number, code: string, isCheckValid = false): Promise<PaymentCouponsModel> {
    try {
      const settingModel = new PaymentCouponsModel();
      settingModel.discount_acc_type = accType;
      settingModel.code = code.toUpperCase();
      if (isCheckValid) {
        settingModel.status = PAYMENT_COUPON_STATUS.Active;
      }
      const result = await PaymentCouponsModel.query().findOne(settingModel);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async find(accType: number, code: string, isCheckValid = false): Promise<PaymentCouponsModel> {
    try {
      const settingModel = new PaymentCouponsModel();
      settingModel.discount_acc_type = accType;
      settingModel.code = code.toUpperCase();
      if (isCheckValid) {
        settingModel.status = PAYMENT_COUPON_STATUS.Active;
      }
      const result = await PaymentCouponsModel.query().findOne(settingModel);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findById(id: number): Promise<PaymentCouponsModel> {
    try {
      const result = await PaymentCouponsModel.query().findById(id);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async add(objectModel: PaymentCouponsModel): Promise<any> {
    try {
      if (objectModel.code) {
        const isExit = await this.findByCodeAndAccType(objectModel.discount_acc_type, objectModel.code);
        if (isExit) { throw new HttpException(400, PAYMENT_COUPON_MESSAGE.Exist); }
      }
      const scrappy = await transaction(PaymentCouponsModel, PaymentCouponUserAvailablesModel, async (paymentCouponsModel, paymentCouponUserAvailablesModel) => {
        const userAvailables = cloneDeep(objectModel.user_available);
        delete objectModel.user_available;
        const newCoupon = await paymentCouponsModel.query().insert(objectModel);
        if (!userAvailables || userAvailables.length == 0) { return; }
        const query = await Promise.all(
          userAvailables.map(async (userId: number) => {
            const userAvailable = new PaymentCouponUserAvailablesModel();
            userAvailable.payment_coupon_id = newCoupon.id;
            userAvailable.user_id = userId;
            return paymentCouponUserAvailablesModel.query().insert(userAvailable);
          }));
      });
      return scrappy;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }

  public async update(id: number, objectModel: PaymentCouponsModel): Promise<any> {
    try {
      if (objectModel.code) {
        const isExit = await this.findByCodeAndAccType(objectModel.discount_acc_type, objectModel.code);
        if (isExit && isExit.id != id) { throw new HttpException(400, PAYMENT_COUPON_MESSAGE.Exist); }
      }
      const scrappy = await transaction(PaymentCouponsModel, PaymentCouponUserAvailablesModel, async (paymentCouponsModel, paymentCouponUserAvailablesModel) => {
        const userAvailables = cloneDeep(objectModel.user_available);
        delete objectModel.user_available;
        const updatedCoupon = await paymentCouponsModel.query().patchAndFetchById(id, objectModel);
        const numDeleted = await paymentCouponUserAvailablesModel.query().delete().where("payment_coupon_id", updatedCoupon.id);
        if (!userAvailables || userAvailables.length == 0) { return; }
        const query = await Promise.all(
          userAvailables.map(async (userId: number) => {
            const userAvailable = new PaymentCouponUserAvailablesModel();
            userAvailable.payment_coupon_id = updatedCoupon.id;
            userAvailable.user_id = userId;
            return paymentCouponUserAvailablesModel.query().insert(userAvailable);
          }));
      });
      return scrappy;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async delete(settingId: number): Promise<PaymentCouponsModel> {
    try {
      return await PaymentCouponsModel.query().updateAndFetchById(settingId, { status: PAYMENT_COUPON_STATUS.Deleted });
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }

  public async findUserAvailable(paymentCouponId: number): Promise<PaymentCouponUserAvailablesModel[]> {
    try {
      const result = await PaymentCouponUserAvailablesModel.query().select(["U.id as user_id", "C.company_name"])
      .where("payment_coupon_id", paymentCouponId)
      .join("users as U", "U.id", "payment_coupon_user_availables.user_id")
      .leftJoin("company as C", "C.id", "U.company_id");
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findUserAvailableByUserId(paymentCouponId: number, userId: number): Promise<PaymentCouponUserAvailablesModel> {
    try {
      const ob = new PaymentCouponUserAvailablesModel();
      ob.payment_coupon_id = paymentCouponId;
      ob.user_id = userId;
      const result = await PaymentCouponUserAvailablesModel.query().findOne(ob);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getCouponHistory(couponId: number, userId: number): Promise<PaymentCouponUserHistoryModel[]> {
    try {
      const result = await PaymentCouponUserHistoryModel.query().where("coupon_id", couponId).where("user_id", userId);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async checkCoupon(couponCode: string, user: UserModel): Promise<{isValid: boolean, couponDetail: PaymentCouponsModel}> {
    try {
      const couponDetail = await this.findByCodeAndAccType(user.acc_type, couponCode);
      if (!couponDetail || couponDetail.status != PAYMENT_COUPON_STATUS.Active) { throw new HttpException(400, PAYMENT_COUPON_MESSAGE.Invalid); }
      if (couponDetail.expired_type == COUPON_EXPIRED_TYPE.Limit) { 
        const startDate = moment.utc(couponDetail.expired_from);
        const endDate = moment.utc(couponDetail.expired_to);
        const now = moment().utc();
        if (now < startDate || now > endDate) {
          throw new HttpException(400, PAYMENT_COUPON_MESSAGE.Invalid); 
        }
      }
      if (couponDetail.discount_acc_type == ACCOUNT_TYPE.Employer && !couponDetail.is_for_all_user) {
        const isExist = await this.findUserAvailableByUserId(couponDetail.id, user.id);
        if(!isExist) { throw new HttpException(400, PAYMENT_COUPON_MESSAGE.Invalid);}
      }
      
      const couponHistory = await this.getCouponHistory(couponDetail.id, user.id);
      couponDetail.user_nbr_used = couponHistory.length;
      let isValid = false;
      if (couponDetail.is_nbr_user_limit) {
        couponDetail.user_nbr_used = couponHistory.length;
        couponDetail.remaining_number = couponDetail.nbr_used - couponHistory.length;

        isValid = couponDetail.remaining_number > 0;
      } else {
        isValid = true;
      }
      return {
        isValid,
        couponDetail
      }
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async getDiscountValue(couponDetail: PaymentCouponsModel, amount: number): Promise<number> {
    try {
      // coupon
      if (couponDetail.discount_type == COUPON_DISCOUNT_TYPE.FixedDollar) {
        return couponDetail.discount_value;
      }
      let discountValue = Math.round((amount * couponDetail.discount_value/100 + Number.EPSILON) * 100) / 100;
      if (couponDetail.max_discount_value > 0 && discountValue > couponDetail.max_discount_value)  {
        discountValue = couponDetail.max_discount_value;
      } 
      return discountValue;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
}
