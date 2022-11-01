import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import IParamsFilterCrawlEntities from "./entities";

export default class ParamsFilterCrawlModel extends autoImplementWithBase(Model)<IParamsFilterCrawlEntities>() {
  static get tableName() {
    return "params_filter_crawler";
  }

  static get idColumn() {
    return "id";
  }
}