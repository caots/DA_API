import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IUserPotentialsSubmitPasswordEntities from "./entities";

export default class UserPotentialsSubmitPasswordEntitiesModel extends autoImplementWithBase(Model)<IUserPotentialsSubmitPasswordEntities>() {
  public created_at: string;
  static get tableName() {
    return "user_potentials_submit_password";
  }

  static get idColumn() {
    return "id";
  }
  public $beforeInsert() {
    this.created_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }
}