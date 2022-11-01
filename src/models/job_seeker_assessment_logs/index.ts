import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import { IJobSeekerAssessmentLogEntities } from "./entities";

export default class JobSeekerAssessmentLogsModel extends autoImplementWithBase(Model)<IJobSeekerAssessmentLogEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "job_seeker_assessment_logs";
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
