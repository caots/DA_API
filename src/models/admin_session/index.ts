import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import IAdminSessionEntities from "./entities";

export default class AdminSessionModel extends autoImplementWithBase(Model)<IAdminSessionEntities>() {
  static get tableName() {
    return "admin_session";
  }

  static get idColumn() {
    return "id";
  }
}
