import { ACCOUNT_TYPE, EXPORT_TYPE, JOB_STATUS, PAGE_SIZE, PAYMENT_AMOUNT_MIN, PAYMENT_TYPE, PAYMENT_TYPE_STR } from "@src/config";
import { logger } from "@src/middleware";
import HttpException from "@src/middleware/exceptions/httpException";
import BillingSettingEmployerModel from "@src/models/employer_billing_settings";
import JobsModel from "@src/models/jobs";
import PaymentCartsModel, { PaymentConvergeLogsModel, PaymentCouponsModel, PaymentCouponUserHistoryModel, PaymentsModel, UserBillingInfoModel } from "@src/models/payments";
import { IEmployerPaymentHistoryEntities, IJobDetailPaymentHistory, IJobSeekerPaymentHistoryEntities, IProductAssessmentEntities, IProductJobEntities, IProductJobseekerEntities } from "@src/models/payments/entities";
import UserModel from "@src/models/user";
import PaymentExportUtils from "@src/utils/paymentExportUtils";
import ConvergeUtils from "@src/utils/paymetCorvegeUtils";
import MailUtils from "@src/utils/sendMail";
import Avatax from 'avatax';
import moment from "moment";
import { transaction } from "objection";
import BillingSettingsService from "./billingSettingsService";
import JobsService from "./jobsService";
import PaymentCouponService from "./paymentCouponService";
const avaConfig = {
  appName: 'config.AVATAX_APP_NAME',
  appVersion: 'config.AVATAX_APP_VERSION',
  environment:' config.AVATAX_ENVIROMENT',
  machineName: 'config.AVATAX_MACHINE_NAME',
};
const avaCompanyCode = 'config.AVATAX_COMPANY_CODE';
const avaCreds = {
  username: 'config.AVATAX_USERNAME',
  password: 'config.AVATAX_PASSWORD'
};
const avaClient = new Avatax(avaConfig).withSecurity(avaCreds);

export default class PaymentsService {
  public async getPaymentCart(
    employerId: number,
  )
    : Promise<any> {
    try {
      let query = PaymentCartsModel.query()
        .select([
          "payment_carts.*",
          "jobs.title as job_title",
          "jobs.salary as job_salary",
          "jobs.status as job_status",
          "jobs.expired_days as job_expired_days",
          "jobs.expired_at as job_expired_at",
          "jobs.created_at as job_created_at",
          "jobs.updated_at as job_updated_at",
          "jobs.is_deleted as job_is_deleted",
          "jobs.is_make_featured as job_is_make_featured",
          "jobs.featured_start_date as job_featured_start_date",
          "jobs.featured_end_date as job_featured_end_date",
          "jobs.is_private as job_is_private",
          "jobs.add_urgent_hiring_badge as job_add_urgent_hiring_badge",
          "jobs.private_applicants as job_private_applicants",
        ])
        .where("payment_carts.employer_id", employerId)
        .where("jobs.is_deleted", 0)
        .where("jobs.status", JOB_STATUS.UnPaid)
        .join("jobs", "jobs.id", "payment_carts.job_id");
      return query
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async addToCart(jobId: number, employerId: number) {
    try {
      if (!jobId || !employerId) {
        return;
      }
      const paymentCartModel = new PaymentCartsModel();
      paymentCartModel.job_id = jobId;
      paymentCartModel.employer_id = employerId;
      const itemCart = await PaymentCartsModel.query().findOne(paymentCartModel);
      if (itemCart) { return; }
      return PaymentCartsModel.query().insert(paymentCartModel);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async removeToCart(id: number) {
    try {
      return PaymentCartsModel.query().deleteById(id);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async findPaymentCartById(id: number) {
    try {
      return PaymentCartsModel.query().findById(id);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async findPaymentCartByJobIdEmployerId(jobId: number, employerId: number): Promise<PaymentCartsModel> {
    try {
      if (!jobId || !employerId) {
        return;
      }
      const paymentCartModel = new PaymentCartsModel();
      paymentCartModel.job_id = jobId;
      paymentCartModel.employer_id = employerId;
      return PaymentCartsModel.query().findOne(paymentCartModel);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async removesPaymentCartByEployerId(employerId: number): Promise<number> {
    try {
      return PaymentCartsModel.query().delete().where("employer_id", employerId);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  // end cart

  // ====================start payment=======================
  getNbrDayHotJob(start: string, end: string) {
    try {
      const endDate = moment(end);
      const startDate = moment(start);
      return Math.round(endDate.diff(startDate, 'days', true)); // 1.75
    } catch (e) {
      return 0;
    }
  }
  mathRound(num) {
    return +(Math.round(num * 100) / 100).toFixed(2);
  }
  mathRoundDecimal2(num) {
    return (Math.round(num * 100) / 100).toFixed(2);
  }
  calcTotalDayCart(job: JobsModel, settings: BillingSettingEmployerModel) {
    let total = {
      total_featured_price: 0,
      total_standard_price: 0,
      total_urgent_price: 0,
      total_private_price: 0
    }
    if (!settings) { return total; }
    if (job.is_private) {
      if (!job.private_applicants) {
        throw new HttpException(500, "private_applicants must > 0");
        return;
      }
      total.total_private_price = this.mathRound(job.private_applicants * settings.private_job_price);
      return total;
    }
    const numberHotJob = job.is_make_featured ? this.getNbrDayHotJob(job.featured_start_date, job.featured_end_date) : 0;
    total.total_featured_price = this.mathRound(numberHotJob * settings.featured_price);
    total.total_standard_price = this.mathRound((job.expired_days || 0) * settings.standard_price);
    if (job.add_urgent_hiring_badge) {
      total.total_urgent_price = this.mathRound(settings.urgent_hiring_price);
    }
    return total;
  }
  public async calcTotalAmountEmployer(carts: any[], isBuyMore = false, paymentType = null, nbrCredit = 1) {
    try {
      const billingSettingsService = new BillingSettingsService();
      const setting = await billingSettingsService.getSystemSettingsForEmployer();
      let total = 0;
      const jobService = new JobsService();
      if (paymentType == PAYMENT_TYPE.Topup || paymentType == PAYMENT_TYPE.DirectMesssage) {
        if (paymentType == PAYMENT_TYPE.DirectMesssage) {
          return {
            nbr: 0,
            amount: setting.standard_direct_message_price
          };
        }
        const topupSetting = setting.topup_credit ? JSON.parse(setting.topup_credit) : [];
        const topup = topupSetting.find(x => x.num_dm === nbrCredit);
        if (!topup) {
          throw new Error("Error when get billing setting");
        }
        return {
          nbr: nbrCredit,
          amount: topup.price
        };
      }

      // paymentType buy job
      carts = await Promise.all(carts.map(async (cart) => {
        // calc amount
        if (!isBuyMore) {
          const detail = await this.findPaymentCartById(cart.id);
          const job = await jobService.getJobById(detail.job_id);
          const priceObj = this.calcTotalDayCart(job, setting);
          total = total + priceObj.total_featured_price + priceObj.total_standard_price +
            priceObj.total_urgent_price + priceObj.total_private_price;
          Object.assign(job, priceObj);
          cart.job = job;
          return cart;
        }
        const job = await jobService.getJobById(cart.id);
        const pricePrivate = this.mathRound(cart.private_applicants * setting.private_job_price);
        total = total + pricePrivate;
        cart.job = job;
        cart.total_private_price = pricePrivate;
        return cart;
      }))
      return {
        nbr: 0,
        amount: total
      };
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async calcTotalAmountJobseeker(paymentType: number, nbrRetake = 1) {
    try {
      const billingSettingsService = new BillingSettingsService();
      const setting = await billingSettingsService.getSystemSettingsForJobSeeker();
      if (paymentType == PAYMENT_TYPE.ValidateTest || paymentType == PAYMENT_TYPE.RetryValidateTest) {
        return {
          nbr: 1,
          amount: setting.standard_validation_price
        };
      }
      if (paymentType == PAYMENT_TYPE.BuyCredit) {
        return {
          nbr: nbrRetake,
          amount: setting.standard_validation_price
        };
      }
      const topupSetting = setting.top_up ? JSON.parse(setting.top_up) : [];
      let topup = topupSetting.find(x => x.num_retake === nbrRetake);
      if (!topup) {
        if (nbrRetake > 1) {
          throw new Error("Error when get billing setting");
        } else {
          topup = {
            price: setting.standard_validation_price
          }
        }
      }
      return {
        nbr: nbrRetake,
        amount: topup.price
      };
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async paymentEmployer(
    user: UserModel, carts: any[], jobseekerInfo: any = null) {
    try {
      if (carts.length > 0) {
        const cartIds = carts.map(cart => cart.id);
        PaymentCartsModel.query().delete().whereIn("id", cartIds).then();
        const updateJob = await Promise.all(carts.map(async (cart) => {
          const jobService = new JobsService();
          const detail = await this.findPaymentCartById(cart.id);
          const job = await jobService.getJobById(detail.job_id);
          const jobUpdate = this.buyJob(job, cart);
          const updated = await JobsModel.query().updateAndFetchById(job.id, jobUpdate);
          return updated;
        }));
        return updateJob;
      }
      return null;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }

  public async paymentEmployerBuyMorePrivateJob(jobs: any[]) {
    try {
      if (jobs.length > 0) {
        const jobService = new JobsService();
        const updateJob = await Promise.all(jobs.map(async (job) => {
          const currentJob = await jobService.getJobById(job.id);
          await JobsModel.query().updateAndFetchById(job.id, { private_applicants: currentJob.private_applicants + job.private_applicants });
        }));
        return updateJob;
      }
      return null;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async paymentJobseeker(
    user: UserModel, paymentType: number,
    nbrRetake: number, assessment: any, isSaveCard = 1,
    couponCode: string, billingInfo: UserBillingInfoModel) {
    try {
      const amountObj = await this.calcTotalAmountJobseeker(paymentType, nbrRetake);
      let newPayment;
      const {
        paymentConvergeLog,
        totalAmount,
        tax,
        resultTax,
        isSaveAvatax,
        checkCouponObj,
        discountValue,
        isSaveCoupon
      } = await this._checkCouponAndTax(user, amountObj.amount, couponCode, billingInfo, paymentType);
      const scrappy = await transaction(PaymentConvergeLogsModel, PaymentsModel, UserModel, PaymentCouponUserHistoryModel,
        async (paymentConvergeLogsModel, paymentsModel, userModel, paymentCouponUserHistoryModel) => {
          // create payment
          const paymentObj = this._createPaymentObj(paymentConvergeLog, isSaveCoupon, totalAmount, amountObj.amount, discountValue, checkCouponObj, tax, user)
          paymentObj.payment_type = paymentType;
          paymentObj.products = this.genProductsJobseeker([assessment], paymentType, amountObj.nbr);
          const quantity = this._getQuantity([assessment], paymentType, amountObj.nbr);
          newPayment = await paymentsModel.query().insert(paymentObj);
          logger.info(`add payment ${JSON.stringify(newPayment)}`);
          const nbrCredit = user.nbr_credits ? user.nbr_credits + amountObj.nbr : amountObj.nbr;
          const userUpdate = {
            nbr_credits: nbrCredit
          };
          if (isSaveCard) {
            Object.assign(userUpdate, { converge_ssl_token: user.converge_ssl_token });
          }
          await userModel.query().updateAndFetchById(user.id, userUpdate as UserModel);
          // create payment log
          if (paymentConvergeLog) {
            // send mail
            this.exportPaymentReceiptPdf(user, newPayment, billingInfo).then(fileInfo => {
              const mail = new MailUtils();
              if (!fileInfo.path) { return; }
              newPayment.invoice_receipt_url = fileInfo.path;
              PaymentsModel.query().updateAndFetchById(newPayment.id, { invoice_receipt_url: fileInfo.path }).then(res => {
                logger.info(`update invoice receipt: ${fileInfo.path}`);
                console.log(`update invoice receipt: ${fileInfo.path}`);
              }, err => {
                logger.info(`update invoice error: ${JSON.stringify(err)}`);
                console.log(`update invoice error: ${JSON.stringify(err)}`);
              });
            
            });
            paymentConvergeLog.user_id = user.id;
            paymentConvergeLog.payment_id = newPayment.id;
            paymentConvergeLogsModel.query().insert(paymentConvergeLog).then();
          }
          // add avatax transaction
          if (isSaveAvatax) {
            this.createTransactionAvatax(billingInfo, user, newPayment, quantity).then(res => {
              logger.info(`isSaveAvatax payment: ${JSON.stringify(res)}`);
            });

          }
          // save coupon
          if (checkCouponObj.isValid) {
            const pcuh = new PaymentCouponUserHistoryModel();
            pcuh.payment_id = newPayment.id;
            pcuh.user_id = user.id;
            pcuh.coupon_id = checkCouponObj.couponDetail.id;
            PaymentCouponUserHistoryModel.query().insert(pcuh).then(res => {
              logger.info(`PaymentCouponUserHistoryModel insert: ${JSON.stringify(res)}`);
            });
          }
        });
      logger.info(JSON.stringify(scrappy));
      return newPayment;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }

  private checkIncludeFeatureDateJob(currentJob: JobsModel, startHotJob, endHotJob) {
    startHotJob = new Date(startHotJob);
    endHotJob = new Date(endHotJob);
    startHotJob = new Date(startHotJob);
    const currentFeaturedStartDate = new Date(currentJob.featured_start_date);
    const currentFeaturedEbdDate = new Date(currentJob.featured_end_date);
    if (currentJob.is_make_featured == 0 || !currentJob.featured_start_date || !currentJob.featured_end_date) return 0;
    if (currentFeaturedStartDate <= startHotJob && currentFeaturedEbdDate >= endHotJob) return -1;
    if (currentFeaturedEbdDate < startHotJob || currentFeaturedStartDate > endHotJob) return 0;
    if (currentFeaturedEbdDate == startHotJob || currentFeaturedStartDate == endHotJob) return 1;
    if (startHotJob >= currentFeaturedStartDate && startHotJob <= currentFeaturedEbdDate && endHotJob >= currentFeaturedEbdDate) {
      const start = moment(startHotJob);
      const end = moment(currentFeaturedEbdDate);
      const days = end.diff(start, 'days') + 1;
      return days;
    }

    if (currentFeaturedStartDate >= startHotJob && currentFeaturedStartDate <= endHotJob && currentFeaturedEbdDate >= endHotJob) {
      const start = moment(currentFeaturedStartDate);
      const end = moment(endHotJob);
      const days = end.diff(start, 'days') + 1;
      return days;
    }

    if (currentFeaturedStartDate >= startHotJob && currentFeaturedEbdDate <= endHotJob) {
      const start = moment(currentFeaturedStartDate);
      const end = moment(currentFeaturedEbdDate);
      const days = end.diff(start, 'days') + 1;
      return days;
    }

    return 0;
  }

  public async paymentEmployerUpgradeJob(user: UserModel, jobParam: JobsModel, currentJob: JobsModel) {
    try {
       // update job
       const updateJob = await this._upgradeJob(jobParam, currentJob);
      return updateJob;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }

  // ====================end payment=========================
  public getPaymentEmployerType(user: UserModel, products: any[], paymentType = null) {
    try {
      if (user.acc_type != ACCOUNT_TYPE.Employer) { return null; }
      if (paymentType == PAYMENT_TYPE.DirectMesssage || paymentType == PAYMENT_TYPE.Topup) {
        return paymentType;
      }
      if (products.length > 1) { return PAYMENT_TYPE.MultiJobs; }
      const product = products[0].job as JobsModel;
      if (product.is_make_featured) { return PAYMENT_TYPE.HotJob }
      return PAYMENT_TYPE.StandardJob;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public genProductsEmployer(products: any[], paymentType = null, numberCredit = 0, jobseekerInfo: any = null) {
    try {
      let productDetails;
      // employer
      if (paymentType == PAYMENT_TYPE.BuyMorePrivate) {
        productDetails = products.map(product => {
          const job = product.job as JobsModel;
          return {
            job_id: job.id,
            private_applicants: product.private_applicants,
            title: job.title,
            total_private_price: product.total_private_price,
          } as IProductJobEntities
        })
        return JSON.stringify(productDetails);
      }
      if (paymentType == PAYMENT_TYPE.DirectMesssage) {
        // job seeker
        productDetails = [jobseekerInfo as unknown as IProductJobseekerEntities];
        return JSON.stringify(productDetails);
      }
      if (paymentType == PAYMENT_TYPE.Topup) {
        productDetails = {
          num_retake: numberCredit
        }
        return JSON.stringify(productDetails);
      }
      // if (paymentType == PAYMENT_TYPE.UpgradeJob) {
      //   productDetails = {
      //     num_retake: numberCredit
      //   }
      //   return JSON.stringify(productDetails);
      // }
      productDetails = products.map(product => {
        const job = product.job as JobsModel;
        return {
          job_id: job.id,
          is_make_featured: job.is_make_featured,
          paid_at: job.paid_at,
          expired_at: job.expired_at,
          featured_end_date: job.featured_end_date,
          featured_start_date: job.featured_start_date,
          title: job.title,
          total_featured_price: job.total_featured_price,
          total_standard_price: job.total_standard_price,
          is_private: job.is_private,
          private_applicants: job.private_applicants,
          add_urgent_hiring_badge: job.add_urgent_hiring_badge,
          total_urgent_price: job.total_urgent_price,
          total_private_price: job.total_private_price
        } as IProductJobEntities
      })
      return JSON.stringify(productDetails);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public genProductsJobseeker(products: any[], paymentType = null, numRetake = 0) {
    try {
      let productDetails;
      if (paymentType == PAYMENT_TYPE.ValidateTest || paymentType == PAYMENT_TYPE.RetryValidateTest) {
        // job seeker
        productDetails = products.map(product => {
          return {
            title: product.name,
            assessment_id: product.id,
            assessment_type: product.type
          } as IProductAssessmentEntities
        })
        return JSON.stringify(productDetails);
      }
      productDetails = {
        num_retake: numRetake
      }
      return JSON.stringify(productDetails);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }

  // ===================== start billing =============================
  public async getBillingHistory(userId: number,
    page = 0, pageSize = PAGE_SIZE.Standand, isGetAll = false
  ): Promise<any> {
    try {
      let query = PaymentsModel.query()
        .select([
          "payments.*",
        ])
        .where("payments.user_id", userId)
        .orderBy("created_at", "desc");
      if (!isGetAll) {
        return query.page(page, pageSize);
      }
      return query;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  // ===================== end billing =============================

  // ===================== start card =============================
  public async getCardDetail(user: UserModel) {
    try {
      const convergeService = new ConvergeUtils();
      return convergeService.getCardDetail(user.converge_ssl_token);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async updateCard(user: UserModel, sslToken: string) {
    try {
      const userObject = new UserModel();
      userObject.converge_ssl_token = sslToken;
      return UserModel.query().updateAndFetchById(user.id, userObject);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async deleteCard(user: UserModel) {
    try {
      const userObject = new UserModel();
      userObject.converge_ssl_token = null;
      return UserModel.query().updateAndFetchById(user.id, userObject);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  // ===================== end card =============================
  public genJobSeekerPayment(payments: any[], fileType: string): IJobSeekerPaymentHistoryEntities[] {
    return payments.map(payment => {
      let service = PAYMENT_TYPE_STR[payment.payment_type];
      let products = payment.products ? JSON.parse(payment.products) : [];
      if (!Array.isArray(products)) { products = [products]; }
      const billDate = moment(payment.created_at).format("MM/DD/YYYY");
      const paymentMethod = `${payment.ssl_card_type} ${payment.ssl_card_number}`;
      let description = "";
      if (payment.payment_type === PAYMENT_TYPE.ValidateTest || payment.payment_type === PAYMENT_TYPE.RetryValidateTest) {
        description = fileType === EXPORT_TYPE.Excel
          ? products.map(x => x.title).join("\n")
          : products.map(x => x.title).join("<br/>");
      } else if (payment.payment_type === PAYMENT_TYPE.Topup || payment.payment_type === PAYMENT_TYPE.BuyCredit) {
        description = `${products[0].num_retake} retakes`;
      }

      return {
        bill_date: billDate,
        service,
        description,
        payment_method: paymentMethod,
        total: fileType === EXPORT_TYPE.Excel ? payment.total_amount : `$${payment.total_amount}`,
      } as IJobSeekerPaymentHistoryEntities;
    })
  }

  public genEmployerPayment(payments: any[], fileType: string): IEmployerPaymentHistoryEntities[] {
    return payments.map(payment => {
      const billDate = moment(payment.created_at).format("MM/DD/YYYY");
      const paymentMethod = `${payment.ssl_card_type} ${payment.ssl_card_number}`;
      try {
        let products = payment.products ? JSON.parse(payment.products) : [];
        if (!Array.isArray(products)) { products = [products]; }
        const description = products.map(product => {
          const startStdJob = product.paid_at ? moment(product.paid_at).format("MM/DD/YYYY") : "";
          const endStdJob = product.expired_at ? moment(product.expired_at).format("MM/DD/YYYY") : "";
          const startFeatJob = product.featured_start_date ? moment(product.featured_start_date).format("MM/DD/YYYY") : "";
          const endFeatJob = product.featured_end_date ? moment(product.featured_end_date).format("MM/DD/YYYY") : "";
          const stdPrice = product.total_standard_price || 0;
          const featPrice = product.total_featured_price || 0;
          const urgentPrice = product.total_urgent_price || 0;
          const privatePrice = product.total_private_price || 0;
          const postingPrice = stdPrice + featPrice + urgentPrice + privatePrice;

          return {
            title: product.title,
            standard_duration: `${startStdJob} - ${endStdJob}`,
            standard_price: fileType === EXPORT_TYPE.Excel ? stdPrice : `$${stdPrice}`,
            featured_duration: `${startFeatJob} - ${endFeatJob}`,
            featured_price: fileType === EXPORT_TYPE.Excel ? featPrice : `$${featPrice}`,
            posting_price: fileType === EXPORT_TYPE.Excel ? postingPrice : `$${postingPrice}`,
            private_applicants: product.private_applicants,
            add_urgent_hiring_badge: product.add_urgent_hiring_badge,
            is_private: product.is_private || payment.payment_type === PAYMENT_TYPE.BuyMorePrivate,
            total_urgent_price: fileType === EXPORT_TYPE.Excel ? urgentPrice : `$${urgentPrice}`,
            total_private_price: fileType === EXPORT_TYPE.Excel ? privatePrice : `$${privatePrice}`
          } as IJobDetailPaymentHistory;
        });

        return {
          bill_date: billDate,
          description,
          payment_method: paymentMethod,
          total: fileType === EXPORT_TYPE.Excel ? payment.total_amount : `$${payment.total_amount}`,
        } as IEmployerPaymentHistoryEntities;
      } catch (e) {
        return {
          bill_date: billDate,
          description: {},
          payment_method: paymentMethod,
          total: fileType === EXPORT_TYPE.Excel ? payment.total_amount : `$${payment.total_amount}`,
        } as IEmployerPaymentHistoryEntities;
      }

    })
  }
  public buyJob(job: JobsModel, cart: any) {
    let jobUpdate = new JobsModel();
    if (job.is_private) {
      jobUpdate.private_applicants = job.private_applicants;
      jobUpdate.add_urgent_hiring_badge = 0;
    } else {
      // process When Expired Day Is 1
      // get expired_at from client to update.
      const dateExpired = job.expired_days == 1 ? moment.utc(cart.expired_at) : moment().utc().add(job.expired_days, "d");
      jobUpdate.expired_at = dateExpired.format("YYYY-MM-DD HH:mm:ss");
      job.add_urgent_hiring_badge && (jobUpdate.expired_urgent_hiring_badge_at = jobUpdate.expired_at);
      jobUpdate.add_urgent_hiring_badge = job.add_urgent_hiring_badge;
    }
    jobUpdate.paid_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
    jobUpdate.status = JOB_STATUS.Active;
    return jobUpdate;
  }

  public async saveBillingInfo(objectUpdate: UserBillingInfoModel) {
    try {
      const newObj = new UserBillingInfoModel();
      newObj.user_id = objectUpdate.user_id;
      const isExist = await UserBillingInfoModel.query().findOne(newObj);
      if (!isExist) {
        const info = await UserBillingInfoModel.query().insert(objectUpdate);
        return info;
      }
      const update = await UserBillingInfoModel.query().updateAndFetchById(isExist.id, objectUpdate);
      return update;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async getBillingInfo(userId: number) {
    try {
      const ob = new UserBillingInfoModel();
      ob.user_id = userId;
      return UserBillingInfoModel.query().findOne(ob);
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  public async getTax(billingAddress: UserBillingInfoModel, user: UserModel, subTotal: number, discountValue = 0, paymentType: number): Promise<{ totalAmount: number, totalTax: number }> {
    try {
      const currentDate = moment().utc().format("YYYY-MM-DD");
      const itemCode = this._getAvataxItemCode(paymentType, user.acc_type);
      const lines = [
        {
          number: '1',
          amount: subTotal,
          itemCode
        }
      ];
      if (discountValue) {
        lines.push({
          number: '2',
          amount: discountValue * -1,
          itemCode: 3000
        })
      }
      const taxDocument = {
        type: 'SalesOrder',
        companyCode: avaCompanyCode,
        date: currentDate,
        customerCode: user.id,
        // discount: discountValue,
        addresses: {
          SingleLocation: {
            line1: billingAddress.address_line_1,
            city: billingAddress.city_name,
            region: billingAddress.state_name,
            country: 'US',
            postalCode: billingAddress.zip_code
          }
        },
        lines,
        // commit: false,
        currencyCode: 'USD',
        description: 'get tax'
      }
      const result = await avaClient.createTransaction({ model: taxDocument });
      return result;
    } catch (err) {
      // throw new HttpException(400, err.message);
      const data = {
        totalAmount: Math.round((subTotal - discountValue) * 100) / 100,
        totalTax: 0,
      }
      return data;
    }
  }
  public async createTransactionAvatax(billingAddress: UserBillingInfoModel, user: UserModel, paymentLog: PaymentsModel, quantity = 1) {
    try {
      const currentDate = moment().utc().format("YYYY-MM-DD");
      const itemCode = this._getAvataxItemCode(paymentLog.payment_type, user.acc_type);
      const lines = [
        {
          number: '1',
          quantity,
          amount: paymentLog.sub_total,
          itemCode,
        }
      ];
      if (paymentLog.discount_value) {
        lines.push({
          number: '2',
          quantity: 1,
          amount: paymentLog.discount_value * -1,
          itemCode: 3000
        })
      }
      const taxDocument = {
        type: 'SalesInvoice',
        companyCode: avaCompanyCode,
        date: currentDate,
        customerCode: user.id,
        purchaseOrderNo: paymentLog.id,
        // discount: paymentLog.discount_value,
        addresses: {
          SingleLocation: {
            line1: billingAddress.address_line_1,
            city: billingAddress.city_name,
            region: billingAddress.state_name,
            country: 'US',
            postalCode: billingAddress.zip_code
          }
        },
        lines,
        commit: true,
        currencyCode: 'USD',
        description: `user id: ${user.id} purchase with payment id: ${paymentLog.id}`
      }
      const result = await avaClient.createTransaction({ model: taxDocument });
      return result;
    } catch (err) {
      // throw new HttpException(err.status || 500, err.message);
      const data = {
        totalAmount: Math.round((paymentLog.sub_total - paymentLog.discount_value) * 100) / 100,
        totalTax: 0,
      }
    }
  }
  private async _checkCouponAndTax(user: UserModel, amount: number, couponCode: string,
    billingInfo: UserBillingInfoModel, paymentType) {
    const paymentCouponService = new PaymentCouponService();
    const convergeService = new ConvergeUtils();
    let discountValue = 0;
    let isSaveCoupon = false;
    let checkCouponObj: { isValid: boolean, couponDetail: PaymentCouponsModel };
    // get discount value:
    // console.log(`Start _checkCoupon.`);
    logger.info(`Start _checkCoupon.`);
    // console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
    logger.info(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
    if (couponCode && couponCode.length > 0) {
      checkCouponObj = await paymentCouponService.checkCoupon(couponCode, user);
      if (checkCouponObj.isValid) {
        isSaveCoupon = true;
        discountValue = await paymentCouponService.getDiscountValue(checkCouponObj.couponDetail, amount);
      }
    } else {
      checkCouponObj = {
        isValid: false,
        couponDetail: {} as PaymentCouponsModel
      };
    }
    // console.log(`End _checkCoupon.`);
    logger.info(`End _checkCoupon.`);
    // console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
    logger.info(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
    //
    const grandTotal = amount - discountValue;
    let tax = 0;
    let resultTax;
    let isSaveAvatax = false;
    // get tax if grandTotal > Avatax min
    // console.log(`Start _checkTax.`);
    logger.info(`Start _checkTax.`);
    // console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
    logger.info(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
    let paymentConvergeLog;
    let totalAmount;
    if (grandTotal > PAYMENT_AMOUNT_MIN.Avatax) {
      resultTax = await this.getTax(billingInfo, user, amount, discountValue, paymentType);
      // console.log(`End _checkTax.`);
      logger.info(`End _checkTax.`);
      // console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
      logger.info(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
      // console.log(`Start call payment.`);
      logger.info(`Start call payment.`);
      // console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
      logger.info(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
      isSaveAvatax = true;
      tax = resultTax.totalTax;
      totalAmount = tax + grandTotal;
      paymentConvergeLog = await convergeService.payment(user.converge_ssl_token, totalAmount);
    } else {
      totalAmount = 0;
    }
    // if (grandTotal > PAYMENT_AMOUNT_MIN.Converge) {
    //   paymentConvergeLog = await convergeService.payment(user.converge_ssl_token, totalAmount);
    // } else {
    //   totalAmount = 0;
    // }
    // console.log(`end call payment.`);
    logger.info(`end call payment.`);
    // console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
    logger.info(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
    return {
      paymentConvergeLog,
      totalAmount,
      tax,
      resultTax,
      isSaveAvatax,
      checkCouponObj,
      discountValue,
      isSaveCoupon
    }
  }
  private _createPaymentObj(paymentConvergeLog, isSaveCoupon, totalAmount, amount, discountValue, checkCouponObj, tax, user) {
    const paymentObj = new PaymentsModel();
    if (paymentConvergeLog && paymentConvergeLog.ssl_amount) {
      paymentObj.ssl_card_number = paymentConvergeLog.ssl_card_number;
      paymentObj.ssl_card_type = paymentConvergeLog.ssl_card_short_description;
      paymentObj.ssl_exp_date = paymentConvergeLog.ssl_exp_date;
    }
    paymentObj.total_amount = totalAmount;
    paymentObj.sub_total = amount;
    paymentObj.discount_value = discountValue;
    if (isSaveCoupon) { paymentObj.coupon_code = checkCouponObj.couponDetail.code; }
    paymentObj.tax = tax;
    paymentObj.user_id = user.id;
    return paymentObj;

  }
  private _getAvataxItemCode(paymentType: number, accType: number) {
    // if (
    //   [
    //     PAYMENT_TYPE.StandardJob, PAYMENT_TYPE.HotJob, PAYMENT_TYPE.MultiJobs, 
    //     PAYMENT_TYPE.BuyMorePrivate, PAYMENT_TYPE.UpgradeJob, 
    //   ]
    //   .includes(paymentType)) {
    //     return 1000;
    //   }
    if (paymentType == PAYMENT_TYPE.Topup) {
      return accType == ACCOUNT_TYPE.Employer ? 1100 : 2000;
    }
    if (paymentType == PAYMENT_TYPE.ValidateTest || paymentType == PAYMENT_TYPE.RetryValidateTest) {
      return 2000;
    }
    return 1000;
  }
  private _getQuantity(products: any[], paymentType = null, numberCredit = 0) {
    try {
      if (paymentType == PAYMENT_TYPE.Topup) {
        return numberCredit;
      }
      if (paymentType == PAYMENT_TYPE.DirectMesssage || paymentType == PAYMENT_TYPE.ValidateTest || paymentType == PAYMENT_TYPE.RetryValidateTest) {
        return 1;
      }
      return products.length;
    } catch (err) {
      throw new HttpException(err.status || 500, err.message);
    }
  }
  private async _upgradeJob(jobParams: JobsModel, currentJob: JobsModel) {
    let jobUpdate = new JobsModel();
    const now = moment().utc();
    const currentExpiredDate = moment.utc(currentJob.expired_at);
    const expiredMoment = currentExpiredDate > now ? currentExpiredDate : now;
    let dateExpired;
    if (!jobParams.expired_days) {
      dateExpired = currentExpiredDate;
    } else {
      dateExpired = jobParams.expired_days == 1 ? moment.utc(jobParams.expired_at) : expiredMoment.add(jobParams.expired_days, "d");
    }
    jobUpdate.expired_at = dateExpired.format("YYYY-MM-DD HH:mm:ss");

    if (jobParams.add_urgent_hiring_badge) {
      jobUpdate.add_urgent_hiring_badge = jobParams.add_urgent_hiring_badge;
      jobUpdate.expired_urgent_hiring_badge_at = jobUpdate.expired_at;
    } 
    
    if (jobParams.featured_start_date && jobParams.featured_end_date) {
      if (!currentJob.featured_start_date || currentJob.featured_start_date.length == 0) {
        // job cu ko co featured
        jobUpdate.featured_start_date = jobParams.featured_start_date;
      } else {
        if (new Date(jobParams.featured_start_date) > new Date(currentJob.featured_start_date)) {
          jobUpdate.featured_start_date = currentJob.featured_start_date;
        } else jobUpdate.featured_start_date = jobParams.featured_start_date;
      }
      jobUpdate.featured_end_date = jobParams.featured_end_date;
    }
    jobUpdate.is_make_featured = jobParams.is_make_featured ? 1 : 0;

    jobUpdate.paid_at = now.format("YYYY-MM-DD HH:mm:ss");
    jobUpdate.status = JOB_STATUS.Active;
    const updatedJob = await JobsModel.query().updateAndFetchById(currentJob.id, jobUpdate);
    return updatedJob;
  }
  
  public async exportPaymentReceiptPdf(user: UserModel, payment: PaymentsModel, billingInfo: UserBillingInfoModel, setting: BillingSettingEmployerModel = null) {
    let filePath = null;
    const now = moment().utc().format("MM-DD-YYYY");
    const paymentExportUtils = new PaymentExportUtils();
    const filename = `Receipt-${now}-${payment.id}.pdf`;
    const paymentBinding = this._genDataToPaymentReceipt(payment);
    const path = await paymentExportUtils.exportPaymentReceiptPDF(paymentBinding, filename, user, billingInfo, setting);
    return {
      filename,
      path,
      contentType: 'application/pdf'
    }
  }
  private _genDataToPaymentReceipt(payment: PaymentsModel) {
    const billDate = moment(payment.created_at).format("MM/DD/YYYY");
    const paymentMethod = `${payment.ssl_card_type} ${payment.ssl_card_number}`;
    try {
      let products = payment.products ? JSON.parse(payment.products) : [];
      if (!Array.isArray(products)) { products = [products]; }
      const description = products.map(product => {
        const startStdJob = product.paid_at ? moment(product.paid_at).format("MM/DD/YYYY") : "";
        const endStdJob = product.expired_at ? moment(product.expired_at).format("MM/DD/YYYY") : "";
        const startFeatJob = product.featured_start_date ? moment(product.featured_start_date).format("MM/DD/YYYY") : "";
        const endFeatJob = product.featured_end_date ? moment(product.featured_end_date).format("MM/DD/YYYY") : "";
        const stdPrice = product.total_standard_price || 0;
        const featPrice = product.total_featured_price || 0;
        const urgentPrice = product.total_urgent_price || 0;
        const privatePrice = product.total_private_price || 0;
        const postingPrice = stdPrice + featPrice + urgentPrice + privatePrice;
        return {
          title: product.title,
          standard_duration: `${startStdJob} - ${endStdJob}`,
          standard_price: this.mathRoundDecimal2(stdPrice),
          featured_duration: `${startFeatJob} - ${endFeatJob}`,
          featured_price: this.mathRoundDecimal2(featPrice),
          posting_price: this.mathRoundDecimal2(postingPrice),
          private_applicants: product.private_applicants,
          add_urgent_hiring_badge: product.add_urgent_hiring_badge,
          is_private: product.is_private || payment.payment_type === PAYMENT_TYPE.BuyMorePrivate,
          total_urgent_price: this.mathRoundDecimal2(urgentPrice),
          total_private_price: this.mathRoundDecimal2(privatePrice),
          num_retake: product.num_retake || 0
        };
      });
      return {
        ...payment,
        total_amount_string: this.mathRoundDecimal2(payment.total_amount),
        sub_total_string: this.mathRoundDecimal2(payment.sub_total),
        discount_value_string: this.mathRoundDecimal2(payment.discount_value),
        tax_string: this.mathRoundDecimal2(payment.tax),
        bill_date: billDate,
        description,
        payment_method: paymentMethod,

      };
    } catch (e) {
      return {
        bill_date: billDate,
        description: {},
        payment_method: paymentMethod,
        ...payment
      }
    }
  }
}
