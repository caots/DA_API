import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IUserNotificationEntities from "./entities";

export default class UserNotificationModel extends autoImplementWithBase(Model)<IUserNotificationEntities>() {
  constructor(model?: IUserNotificationEntities) {
    super();
    if (model != null) {
      this.user_id = model.user_id;
      this.user_acc_type = model.user_acc_type;
      this.type = model.type;
      this.metadata = model.metadata || "";
      this.is_read = model.is_read || 0;
      this.is_sent_mail = model.is_sent_mail || 0;
      this.sent_mail_status = model.sent_mail_status || 0;
    }
  }
  static get tableName() {
    return "user_notifications";
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
