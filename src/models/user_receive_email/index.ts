import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import IUserReceiveEmailEntities from "./entities";

export default class UserReceiveEmailModel extends autoImplementWithBase(Model)<IUserReceiveEmailEntities>() {
  static get tableName() {
    return "user_receive_email";
  }

  static get idColumn() {
    return "id";
  }
}