import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IEntities, { IUserEmailChangeEntities, IUserReferEntities } from "./entities";

export default class UserPasswordResetModel extends autoImplementWithBase(Model)<IEntities>() {
  public created_at: string;
  static get tableName() {
    return "user_password_resets";
  }

  static get idColumn() {
    return "id";
  }
  public $beforeInsert() {
    this.created_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }
}
export class UserEmailChangesModel extends autoImplementWithBase(Model)<IUserEmailChangeEntities>() {
  public created_at: string;
  public updated_at: string;
  static get tableName() {
    return "user_email_change";
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
export class UserRefersModel extends autoImplementWithBase(Model)<IUserReferEntities>() {
  public created_at: string;
  public updated_at: string;
  static get tableName() {
    return "user_refers";
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
