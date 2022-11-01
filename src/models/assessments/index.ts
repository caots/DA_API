import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import { IAssessmentCustomQuestionEntities, IAssessmentEntities } from "./entities";

export default class AssessmentsModel extends autoImplementWithBase(Model)<IAssessmentEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "assessments";
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
export class AssessmentCustomQuestionsModel extends autoImplementWithBase(Model)<IAssessmentCustomQuestionEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "assessment_custom_questions";
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
