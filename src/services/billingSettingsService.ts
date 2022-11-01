import { BILLING_SETTING } from "@src/config";
import HttpException from "@src/middleware/exceptions/httpException";
import BillingSettingEmployerModel from "@src/models/employer_billing_settings";
import BillingSettingJobSeekerModel from "@src/models/jobseeker_billing_settings";

export default class BillingSettingsService {
  public async getSystemSettingsForJobSeeker(): Promise<BillingSettingJobSeekerModel> {
    try {
      const settingModel = new BillingSettingJobSeekerModel();
      settingModel.type = BILLING_SETTING.System;
      const result = await BillingSettingJobSeekerModel.query().findOne(settingModel);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async addSystemSettingsForJobSeeker(objectModel: BillingSettingJobSeekerModel): Promise<BillingSettingJobSeekerModel> {
    try {
      return await BillingSettingJobSeekerModel.query().insert(objectModel);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

     
  public async updateSystemSettingsForJobSeeker(settingId: number, currentSetting: BillingSettingJobSeekerModel, objectModel: BillingSettingJobSeekerModel): Promise<BillingSettingJobSeekerModel> {
    try {
      if (!objectModel.is_enable_free_assessment) { 
        objectModel.free_assessment_validation = 0;
      }
      return await BillingSettingJobSeekerModel.query().updateAndFetchById(settingId, objectModel);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getSystemSettingsForEmployer(): Promise<BillingSettingEmployerModel> {
    try {
      const settingModel = new BillingSettingEmployerModel();
      settingModel.type = BILLING_SETTING.System;
      const result = await BillingSettingEmployerModel.query().findOne(settingModel);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async addSystemSettingsForEmployer(objectModel: BillingSettingEmployerModel): Promise<BillingSettingEmployerModel> {
    try {
      return await BillingSettingEmployerModel.query().insert(objectModel);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateSystemSettingsForEmployer(settingId: number, objectModel: BillingSettingEmployerModel): Promise<BillingSettingEmployerModel> {
    try {
      return await BillingSettingEmployerModel.query().updateAndFetchById(settingId, objectModel);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
}
