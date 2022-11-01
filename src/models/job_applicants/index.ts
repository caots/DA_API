import { APPLICANT_STATUS } from "@src/config";
import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IEntities from "./entities";

export default class JobApplicantsModel extends autoImplementWithBase(Model)<IEntities>() {
  public created_at?: string;
  public updated_at?: string;

  static get tableName() {
    return "job_applicants";
  }

  static get idColumn() {
    return "id";
  }
  public $beforeInsert() {
    this.created_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
    this.status = APPLICANT_STATUS.Active;
  }

  public $beforeUpdate() {
    this.updated_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }
}