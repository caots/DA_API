import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IEntities, { IChatReportEntities, IJobSeekerRattingEntities } from "./entities";

export default class CompanyReportsModel extends autoImplementWithBase(Model)<IEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "company_reports";
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
export class JobSeekerRattingsModel extends autoImplementWithBase(Model)<IJobSeekerRattingEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "job_seeker_rating";
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
export class ChatReportsModel extends autoImplementWithBase(Model)<IChatReportEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "chat_reports";
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
