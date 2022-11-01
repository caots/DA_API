import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import { ICategoryAssessments } from "./entities";

export default class CategoryAssessmentsModel extends autoImplementWithBase(Model)<ICategoryAssessments>() {
  static get tableName() {
    return "category_assessments";
  }

  static get idColumn() {
    return "id";
  }
}