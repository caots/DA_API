import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IJobsSuggestJobseekerEntities from "./entities";

export default class JobsSuggestJobseekerModel extends autoImplementWithBase(Model)<IJobsSuggestJobseekerEntities>() {
  constructor(model?: IJobsSuggestJobseekerEntities | any) {
    super();
    if (model != null) {
      Object.keys(model).forEach(k => (this[k] = model[k]))
    }
  }
  static get tableName() {
    return "jobs_suggest_jobseeker";
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
