import { BILLING_SETTING_MESSAGE, COMMON_SUCCESS } from "@src/config/message";
import { badRequest, ok } from "@src/middleware/response";
import BillingSettingEmployerModel from "@src/models/employer_billing_settings";
import BillingSettingJobSeekerModel from "@src/models/jobseeker_billing_settings";
import BillingSettingsService from "@src/services/billingSettingsService";
import MsValidate from "@src/utils/validate";
import Avatax from 'avatax';
import { NextFunction, Request, Response } from "express";
const config = {
  appName: 'Measuredskills QA',
  appVersion: '1.2',
  environment: 'sandbox',
  machineName: 'ABC'
};

const creds = {
  username: '2001520110',
  password: 'E52B7294D0D92414'
};
var client = new Avatax(config).withSecurity(creds);
export default class BillingSettingsController {
  public async getSystemSettingsForJobSeeker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const billingSettingsService = new BillingSettingsService();
      const jobSeekerSettings = await billingSettingsService.getSystemSettingsForJobSeeker();
      if (!jobSeekerSettings) {
        return ok({ message: BILLING_SETTING_MESSAGE.settingNotExist }, req, res);
      }
      return ok(jobSeekerSettings, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async addSystemSettingsForJobSeeker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const billingSettingsService = new BillingSettingsService();
      const systemSetting = await billingSettingsService.getSystemSettingsForJobSeeker();
      if (systemSetting) {
        return badRequest({ message: BILLING_SETTING_MESSAGE.settingExist }, req, res);
      }

      const msValidate = new MsValidate();
      const settingsModel = await msValidate.validateJobSeekerSystemBillingSettings(req.body);
      settingsModel.top_up = JSON.stringify(settingsModel.top_up);
      const newSettings = await billingSettingsService.addSystemSettingsForJobSeeker(settingsModel as BillingSettingJobSeekerModel);
      return ok({ message: COMMON_SUCCESS.addBillingSetting }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateSystemSettingsForJobSeeker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const billingSettingsService = new BillingSettingsService();
      const systemSetting = await billingSettingsService.getSystemSettingsForJobSeeker();
      if (!systemSetting) {
        return badRequest({ message: BILLING_SETTING_MESSAGE.settingNotExist }, req, res);
      }

      const msValidate = new MsValidate();
      const settingsModel = await msValidate.validateJobSeekerSystemBillingSettings(req.body);
      settingsModel.top_up = JSON.stringify(settingsModel.top_up);
      const currentSetting = await billingSettingsService.getSystemSettingsForJobSeeker();
      const newSettings = await billingSettingsService.updateSystemSettingsForJobSeeker(systemSetting.id, currentSetting, settingsModel as BillingSettingJobSeekerModel);
      return ok({ message: COMMON_SUCCESS.updateBillingSetting }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getSystemSettingsForEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const billingSettingsService = new BillingSettingsService();
      const employerSettings = await billingSettingsService.getSystemSettingsForEmployer();
      if (!employerSettings) {
        return ok({ message: BILLING_SETTING_MESSAGE.settingNotExist }, req, res);
      }
      return ok(employerSettings, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async addSystemSettingsForEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const billingSettingsService = new BillingSettingsService();
      const systemSetting = await billingSettingsService.getSystemSettingsForEmployer();
      if (systemSetting) {
        return badRequest({ message: BILLING_SETTING_MESSAGE.settingExist }, req, res);
      }

      const msValidate = new MsValidate();
      const settingsModel = await msValidate.validateEmployerSystemBillingSettings(req.body) as BillingSettingEmployerModel;
      settingsModel.topup_credit = JSON.stringify(settingsModel.topup_credit);
      const newSettings = await billingSettingsService.addSystemSettingsForEmployer(settingsModel);
      return ok({ message: COMMON_SUCCESS.addBillingSetting }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateSystemSettingsForEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const billingSettingsService = new BillingSettingsService();
      const systemSetting = await billingSettingsService.getSystemSettingsForEmployer();
      if (!systemSetting) {
        return badRequest({ message: BILLING_SETTING_MESSAGE.settingNotExist }, req, res);
      }

      const msValidate = new MsValidate();
      const settingsModel = await msValidate.validateEmployerSystemBillingSettings(req.body) as BillingSettingEmployerModel;
      settingsModel.topup_credit = JSON.stringify(settingsModel.topup_credit);
      const newSettings = await billingSettingsService.updateSystemSettingsForEmployer(systemSetting.id, settingsModel);
      return ok({ message: COMMON_SUCCESS.updateBillingSetting }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async resolveAddressAva(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // resolve configuration and credentials
      const config = {
        appName: 'Measuredskills QA',
        appVersion: '1.2',
        environment: 'sandbox',
        machineName: 'ABC'
      };

      const creds = {
        username: '2001520110',
        password: 'E52B7294D0D92414'
      };
      var client = new Avatax(config).withSecurity(creds);

      const address = {
        line1: req.query.line1,
        city: req.query.city,
        postalCode: req.query.postalCode,
        region: req.query.region,
        country: 'US'
      };

      const result = await client.resolveAddress(address);
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async createTransactionAva(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // resolve configuration and credentials
      const config = {
        appName: 'Measuredskills QA',
        appVersion: '1.2',
        environment: 'sandbox',
        machineName: 'ABC'
      };

      const creds = {
        username: '2001520110',
        password: 'E52B7294D0D92414'
      };
      var client = new Avatax(config).withSecurity(creds);
      let lines = [];
      req.body.lines.forEach((line, index)=> {
        lines.push({
          number: `${index+1}`,
          quantity: line.quantity,
          amount: line.amount,
          itemCode: line.itemCode,
          description: line.description,
          discounted: true,
        })
      }); 
      const taxDocument = {
        type: 'SalesInvoice',
        companyCode: 'DEFAULT-2',
        date: '2021-05-14',
        customerCode: 'Split Job',
        discount: req.body.discount_value,
        // purchaseOrderNo: '2017-04-12-001',
        addresses: {
          SingleLocation: {
            line1: req.body.line1,
            city: req.body.city,
            region: req.body.region,
            country: 'US',
            postalCode: req.body.postalCode
          }
        },
        lines,
        commit: true,
        currencyCode: 'USD',
        description: req.body.description
      }

      const result = await client.createTransaction({ model: taxDocument });
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async commitTransactionAva(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // resolve configuration and credentials
      const config = {
        appName: 'Measuredskills QA',
        appVersion: '1.2',
        environment: 'sandbox',
        machineName: 'ABC'
      };

      const creds = {
        username: '2001520110',
        password: 'E52B7294D0D92414'
      };

      var client = new Avatax(config).withSecurity(creds);
      const transaction = await client.queryItems();
      return ok(transaction, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getTax(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taxDocument = {
        type: 'SalesOrder',
        companyCode: 'DEFAULT-2',
        date: '2021-04-20',
        customerCode: 'GET Tax',
        addresses: {
          SingleLocation: {
            line1: req.body.line1,
            city: req.body.city,
            region: req.body.region,
            country: 'US',
            postalCode: req.body.postalCode
          }
        },
        lines: [
          {
            number: '1',
            quantity: 1,
            amount: req.body.amount,
            description: 'test'
          },
        ],
        // commit: false,
        currencyCode: 'USD',
        description: req.body.description
      }
      const result = await client.createTransaction({ model: taxDocument });
      const data = {
        amount: result.totalAmount,
        totalTax: result.totalTax
      }
      return ok(data, req, res);
    } catch (err) {
      next(err);
    }
  }
}
