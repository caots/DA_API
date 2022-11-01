import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IBillingSettingEmployer from "./entities";

export default class BillingSettingEmployerModel extends autoImplementWithBase(Model)<IBillingSettingEmployer>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "payment_setting_employers";
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
