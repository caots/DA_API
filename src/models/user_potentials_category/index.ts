import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IUserPotentialsCategoryEntities from "./entities";

export default class UserPotentialsCategoryModel extends autoImplementWithBase(Model)<IUserPotentialsCategoryEntities>() {
  public created_at?: string;
  public updated_at?: string;

  static get tableName() {
    return "user_potentials_category";
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