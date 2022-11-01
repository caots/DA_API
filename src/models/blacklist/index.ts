import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import IBlackListUser from './entities';

export default class BlackListUserModel extends autoImplementWithBase(Model)<IBlackListUser>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "blacklist";
  }

  static get idColumn() {
    return "id";
  }

}