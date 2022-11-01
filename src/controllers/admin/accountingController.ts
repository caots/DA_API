import { PAGE_SIZE, SEARCH_USER_STATUS } from '@src/config';
import { USER_MESSAGE } from '@src/config/message';
import { badRequest, ok } from '@src/middleware/response';
import { UserBillingInfoModel } from '@src/models/payments';
import AdminAccountingService from '@src/services/accountingService';
import PaymentsService from '@src/services/paymentService';
import UserBll from '@src/services/user';
import PaymentExportUtils from '@src/utils/paymentExportUtils';
import { NextFunction, Request, Response } from 'express';
import { get } from 'lodash';
import moment from 'moment';
import { ACCOUNT_TYPE, USER_STATUS } from '../../config/index';

export default class AdminAccountingController {
  public async getListAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminAccountingService = new AdminAccountingService();
      const q = get(req, "query.q") ? decodeURIComponent(get(req, "query.q")) : "";
      const searchType = get(req, "query.searchType", "");
      const orderNo = parseInt(get(req, "query.orderNo", 0));
      const page = get(req, "query.page", 0);
      const pageSize = get(req, "query.pageSize", PAGE_SIZE.Standand);
      const categoryId = get(req, "query.categoryId", 0);
      const location = get(req, "query.location", "");
      const accType = parseInt(get(req, "query.accType", ACCOUNT_TYPE.JobSeeker));
      let status;
      switch (searchType) {
        case SEARCH_USER_STATUS.Active:
          status = USER_STATUS.active;
          break;
        case SEARCH_USER_STATUS.Inactive:
          status = USER_STATUS.deactive;
          break;
        case SEARCH_USER_STATUS.Draft:
          status = USER_STATUS.draft;
          break;
        default:
          status = USER_STATUS.active;
      }
      const listAccount = await adminAccountingService.getListAccount(
        categoryId,
        location,
        status,
        q,
        orderNo,
        page,
        pageSize,
        accType
      );

      return ok({ data: listAccount }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminAccountingService = new AdminAccountingService();
      const userService = new UserBll();
      const userId = parseInt(get(req, "params.userId", 0));
      const user = await userService.getById(userId);
      if (!user) {
        return badRequest({ message: USER_MESSAGE.userNotExists }, req, res);
      }

      const paymentsService = new PaymentsService();
      let paymentMethod = null;
      
      if (user.converge_ssl_token) {
        paymentMethod = await paymentsService.getCardDetail(user);
      }

      const testAttemp = {
        available_retakes: user.nbr_credits
      }

      const firstAndLastPayment = await adminAccountingService.getFirstAndLastBilling(user.id);
      const range = {
        firstPayment: firstAndLastPayment.firstPayment ? firstAndLastPayment.firstPayment.created_at : null,
        lastPayment: firstAndLastPayment.lastPayment ? firstAndLastPayment.lastPayment.created_at : null
      }

      const dateStart = get(req, "query.from", "");
      const dateEnd =  get(req, "query.end") ? moment(get(req, "query.end"), "YYYY-MM-DD").add(1, "days").format("YYYY-MM-DD") : "";
      const searchType = get(req, "query.searchType") ? parseInt(get(req, "query.searchType")) : null;
      const page = get(req, "query.page", 0);
      const pageSize = get(req, "query.pageSize", PAGE_SIZE.Standand);
      let billingHistory = await adminAccountingService.getBillingHistory(
        user.id,
        dateStart,
        dateEnd,
        searchType,
        false,
        user.acc_type,
        page,
        pageSize
      );
      billingHistory.results = adminAccountingService.genBillingHistory(billingHistory.results, user.acc_type, false);
      const billingInfo  = {
        "address_line_1": "525 E. College",
        "address_line_2": "",
        "city_name": "Mount Vernon",
        "state_name": "WA",
        "zip_code": 98273,
        "first_name": "first",
        "last_name": "last",
        "company_name": "123",
      } as unknown as UserBillingInfoModel;
      return ok({ paymentMethod, billingHistory, testAttemp, range, billingInfo }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async exportBillingHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminAccountingService = new AdminAccountingService();
      const userService = new UserBll();
      const paymentExportUtils = new PaymentExportUtils();
      const userId = get(req, "params.userId", 0);
      const user = await userService.getById(userId);
      if (!user) {
        return badRequest({ message: USER_MESSAGE.userNotExists }, req, res);
      }

      const dateStart = get(req, "query.from", "");
      const dateEnd = get(req, "query.end") ? moment(get(req, "query.end"), "YYYY-MM-DD").add(1, "days").format("YYYY-MM-DD") : "";
      let billingHistory = await adminAccountingService.getBillingHistory(
        user.id,
        dateStart,
        dateEnd,
        null,
        true,
        user.acc_type
      );
      const timestamp = Date.now();
      billingHistory = adminAccountingService.genBillingHistory(billingHistory, user.acc_type);
      const fileName = `billing-history-${user.first_name || user.company_name.replace(/ /g, "")}-${timestamp}`;
      const filePath = await paymentExportUtils.exportBillingHistoryPDF(billingHistory, fileName, user.acc_type, user);
      return ok({ filePath }, req, res);
    } catch (err) {
      next(err);
    }
  }
}
