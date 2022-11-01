import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IJobCrawlUrlEntities from "./entities";

export default class JobCrawlUrlModel extends autoImplementWithBase(Model)<IJobCrawlUrlEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "job_crawl_url";
  }

  static get idColumn() {
    return "id";
  }
  public $beforeInsert() {
    this.created_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }

  public $beforeUpdate() {
    this.updated_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }
}