import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IJobsEntities, { IJobReportEntities } from "./entities";

export default class JobsModel extends autoImplementWithBase(Model)<IJobsEntities>() {
  constructor(model?: IJobsEntities | any) {
    super();
    if (model != null) {
      Object.keys(model).forEach(k => (this[k] = model[k]))
    }
  }

  public created_at?: string;
  public updated_at?: string;
  public is_deleted: number;
  static get tableName() {
    return "jobs";
  }

  static get idColumn() {
    return "id";
  }
  public $beforeInsert() {
    this.created_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
    this.is_deleted = 0;
  }

  public $beforeUpdate() {
    // if (this.total_standard_price) { delete this.total_standard_price; }
    // if (this.total_featured_price) { delete this.total_featured_price; }
    this.updated_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }
}
export class JobReportsModel extends autoImplementWithBase(Model)<IJobReportEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "job_reports";
  }

  static get idColumn() {
    return "id";
  }
  public $beforeInsert() {
    this.created_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
    this.updated_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }

  public $beforeUpdate() {
    this.updated_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }
}
