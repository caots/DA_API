import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import { IChatGroupMembersEntities, IChatGroupsEntities, IChatMessagesEntities, IChatReadMessageEntities } from "./entities";

export class ChatMessagesModel extends autoImplementWithBase(Model)<IChatMessagesEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "chat_messages";
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
export class ChatGroupsModel extends autoImplementWithBase(Model)<IChatGroupsEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "chat_groups";
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
export class ChatGroupMembersModel extends autoImplementWithBase(Model)<IChatGroupMembersEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "chat_group_members";
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
export class ChatReadMessagesModel extends autoImplementWithBase(Model)<IChatReadMessageEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "chat_read_messages";
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
