import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import ICrawlLogEntities from "./entities";

export default class CrawlLogUsModel extends autoImplementWithBase(Model)<ICrawlLogEntities>() {
  static get tableName() {
    return `crawl_log`;
  }

  static get idColumn() {
    return "id";
  }
  public $beforeInsert() {
    this.created_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }
}
