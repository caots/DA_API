import config, { ACCOUNT_TYPE, TYPE_SITEMAP, USER_STATUS } from "@src/config/index";
import HttpException from "@src/middleware/exceptions/httpException";
import JobsModel from "@src/models/jobs";
import UserModel from "@src/models/user";
import { convertToSlugUrl, deleteSpecialText } from '@src/utils/jobUtils';
import dySitemap from "dynamic-sitemap";
import moment from "moment";

export default class GenSitemapService {
  constructor() {
  }

  public async getJobsByJobSeeker(status, page = 0, pageSize): Promise<any> {
    try {
      let selects = ["jobs.*", "CP.company_name as employer_company_name"];
      return JobsModel.query().select(selects).join("users as EP", "jobs.employer_id", "EP.id")
        .leftJoin("company as CP", "EP.company_id", "CP.id")
        .where("jobs.status", status)
        .where("jobs.is_deleted", 0)
        .where("EP.is_deleted", 0)
        .where("EP.is_user_deleted", 0)
        .where("jobs.is_private", 0)
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getListCompany(page = 0, pageSize): Promise<any> {
    try {
      const selects = [
        "users.id as company_id",
        "CP.company_name"
      ];
      return UserModel.query().select(selects)
        .leftJoin("company as CP", "users.company_id", "CP.id")
        .where("users.acc_type", ACCOUNT_TYPE.Employer)
        .where("users.employer_id", 0)
        .where("users.status", USER_STATUS.active)
        .where("users.is_user_deleted", 0)
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async genSitemapUrl(listData: any[], type: number): Promise<any> {
    try {
      let listUrls = [];
      switch (type) {
        case TYPE_SITEMAP.STATIC:
          listUrls = listData;
          break;
        case TYPE_SITEMAP.JOB:
          listData.length > 0 && listData.map(job => {
            listUrls.push({
              loc: `${config.WEBSITE_URL}/job/${deleteSpecialText(convertToSlugUrl(job.title, job.id))}`,
              lastmod: moment(new Date()).format('YYYY-MM-DDThh:mm:ssZ')
            });
          });
          break;
        case TYPE_SITEMAP.COMPANY:
          listData.length > 0 && listData.map(company => {
            listUrls.push({
              loc: `${config.WEBSITE_URL}/company/${deleteSpecialText(convertToSlugUrl(company.company_name, company.company_id))}?tab=employer&amp;searchJob=1`,
              lastmod: moment(new Date()).format('YYYY-MM-DDThh:mm:ssZ')
            });
          });
          break;
      }
      const xml = dySitemap.build(listUrls)
      return xml;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
}