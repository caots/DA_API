import { TASKSCHEDULE_STATUS } from "@src/config";
import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import ITaskScheduleEntities from "./entities";

export default class TaskScheduleModel extends autoImplementWithBase(Model)<ITaskScheduleEntities>() {
  constructor(model?: ITaskScheduleEntities) {
    super();
    if (model != null) {
      this.subject_id = model.subject_id;
      this.type = model.type;
      this.status = model.status != null ? model.status : TASKSCHEDULE_STATUS.NotRun;
      this.metadata = model.metadata || "";
    }
  }
  static get tableName() {
    return "cronjob_tasks";
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
