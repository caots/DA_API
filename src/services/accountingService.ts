import { PAGE_SIZE, PAYMENT_TYPE_STR } from '@src/config';
import HttpException from '@src/middleware/exceptions/httpException';
import { PaymentsModel } from '@src/models/payments';
import { IJobDetailPaymentHistory } from '@src/models/payments/entities';
import UserModel from '@src/models/user';
import moment from 'moment';
import { raw } from 'objection';
import { ACCOUNT_TYPE, PAYMENT_TYPE, USER_STATUS } from '../config/index';

export default class AdminAccountingService {
  public async getListAccount(
    categoryId = 0,
    location = "",
    status = USER_STATUS.active,
    q = "",
    orderNo = 0,
    page = 0,
    pageSize = PAGE_SIZE.Standand,
    accType = ACCOUNT_TYPE.Employer
  ): Promise<any> {
    try {
      const orderArray = this.getOrder(orderNo);
      let query = UserModel.query()
        .select([
          "users.id",
          "users.acc_type",
          "users.email",
          "users.provider",
          "users.date_of_birth",
          "users.status",
          "users.first_name",
          "users.last_name",
          "CP.company_name",
          "users.phone_number",
          "users.address_line",
          "users.note",
          "users.asking_benefits",
          "users.description",
          "users.created_at",
          "users.updated_at",
          "users.region_code",
          "users.city_name",
          "users.state_name",
          "users.is_deleted",
          "users.employer_id",
          "users.chat_group_id",
        ])
        .where("users.acc_type", accType)
        .join("company as CP", "users.company_id", "CP.id")
        .where("users.employer_id", 0)
        .where("users.is_deleted", 0)
        .where("users.status", status);
        console.log(status)
      if (q) {
        query = query
          .where((builder) =>
            builder
              .where("users.email", "like", `%${q}%`)
              .orWhereRaw(`CONCAT(users.first_name,' ', users.last_name) like '%${q}%'`)
          )
      }

      if (location) {
        query = query.where((builder) =>
          builder
            .where("users.city_name", "like", `%${location}%`)
            .orWhere("users.state_name", "like", `%${location}%`)
        )
      }

      if (accType === ACCOUNT_TYPE.JobSeeker && categoryId) {
        query = query.leftJoin(raw(`(
          SELECT JSA.job_seeker_id, CONCAT(',', GROUP_CONCAT(A.category_id) ,',') AS skill FROM job_seeker_assessments JSA
          LEFT JOIN assessments A ON JSA.assessment_id = A.assessment_id
          WHERE JSA.is_deleted = 0
          GROUP BY JSA.job_seeker_id
        ) AS S `), "S.job_seeker_id", "users.id")
          .where("S.skill", "like", `%,${categoryId},%`)
      }

      return query
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getBillingHistory(
    userId = 0,
    dateStart,
    dateEnd,
    searchType,
    isGetAll = false,
    accType = ACCOUNT_TYPE.JobSeeker,
    page = 0,
    pageSize = PAGE_SIZE.Standand
  ): Promise<any> {
    try {
      let query = PaymentsModel.query()
        .select([
          "payments.*",
        ])
        .where("payments.user_id", userId)
        .orderBy("created_at", "desc");

      if (dateStart) {
        query = query.whereRaw(`payments.created_at >= '${dateStart}'`);
      }

      if (dateEnd) {
        query = query.whereRaw(`payments.created_at <= '${dateEnd}'`);
      }

      if (accType === ACCOUNT_TYPE.JobSeeker && searchType !== null) {
        switch (searchType) {
          case PAYMENT_TYPE.RetryValidateTest:
            query = query.where("payments.payment_type", PAYMENT_TYPE.RetryValidateTest);
            break;
          case PAYMENT_TYPE.ValidateTest:
            query = query.where("payments.payment_type", PAYMENT_TYPE.ValidateTest);
            break;
          case PAYMENT_TYPE.Topup:
            query = query.where("payments.payment_type", PAYMENT_TYPE.Topup);
            break;
          default:
            break;
        }
      }

      if (!isGetAll) {
        return query.page(page, pageSize);
      }
      return query;

    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public getOrder(orderBy: number): string[] {
    let orders;
    switch (orderBy) {
      case 0:
        orders = ["users.created_at", "desc"];
        break;
      case 1:
        orders = ["users.created_at", "asc"];
        break;
      case 2:
        orders = ["users.first_name", "desc"];
        break;
      case 3:
        orders = ["users.first_name", "asc"];
        break;
      default:
        orders = ["users.created_at", "desc"];
        break;
    }
    return orders;
  };

  public genBillingHistory(bills: any[], accType: number = ACCOUNT_TYPE.JobSeeker, isExport: boolean = true): any[] {
    return bills.map(payment => {
      let products = payment.products ? JSON.parse(payment.products) : [];
      const bill_date = moment(payment.created_at).format("MM/DD/YYYY");
      if (!Array.isArray(products)) { products = [products]; }
      const service = PAYMENT_TYPE_STR[payment.payment_type];
      const payment_method = `${payment.ssl_card_type} ${payment.ssl_card_number}`;
      let description = null;
      if (accType === ACCOUNT_TYPE.JobSeeker) {
        if (payment.payment_type === PAYMENT_TYPE.ValidateTest || payment.payment_type === PAYMENT_TYPE.RetryValidateTest) {
          description = products[0].title;
        } else if (payment.payment_type === PAYMENT_TYPE.Topup || payment.payment_type === PAYMENT_TYPE.BuyCredit) {
          description = `${products.num_retake} retakes`;
        }
      } else if (accType === ACCOUNT_TYPE.Employer) {
        description = products.map(product => {
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
            standard_price: isExport ? `$${stdPrice}` : stdPrice,
            featured_duration: `${startFeatJob} - ${endFeatJob}`,
            featured_price: isExport ? `$${featPrice}` : featPrice,
            posting_price: isExport ? `$${postingPrice}` : postingPrice,
            private_applicants : product.private_applicants,
            add_urgent_hiring_badge: product.add_urgent_hiring_badge,
            is_private: product.is_private || payment.payment_type === PAYMENT_TYPE.BuyMorePrivate,
            total_urgent_price: isExport ? `$${urgentPrice}` : urgentPrice,
            total_private_price: isExport ? `$${privatePrice}` : privatePrice
          } as IJobDetailPaymentHistory
        });
      }

      return {
        ...payment,
        products,
        description,
        payment_method,
        bill_date,
        service,
        total: isExport ? `$${payment.total_amount}` : payment.total_amount
      }
    })
  }

  public async getFirstAndLastBilling(userId: number = 0): Promise<any> {
    const firstPayment = await PaymentsModel.query()
        .select([
          "payments.*",
        ])
        .where("payments.user_id", userId)
        .orderBy("created_at", "asc").first();
    const lastPayment = await PaymentsModel.query()
        .select([
          "payments.*",
        ])
        .where("payments.user_id", userId)
        .orderBy("created_at", "desc").first();

    return {
      firstPayment,
      lastPayment,
    };
  }
}
