import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IContactUsEntities from "./entities";

export default class ContactUsModel extends autoImplementWithBase(Model)<IContactUsEntities>() {
  constructor(model?: IContactUsEntities) {
    super();
    if (model != null) {
      this.last_name = model.first_name;
      this.last_name = model.last_name;
      this.phone_number = model.phone_number;
      this.phone_country = model.phone_country;
      this.type = model.type;
      this.institution = model.institution;
      this.message = model.message;
      this.is_send_mail = model.is_send_mail;
    }
  }
  static get tableName() {
    return `contact_us`;
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
