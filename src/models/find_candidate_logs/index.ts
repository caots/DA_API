import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import { IEmployerRecruitmentFunnelEntities, IFindCandidateLogEntities, IPotentialCandidateEntities } from "./entities";

export default class FindCandidateLogsModel extends autoImplementWithBase(Model)<IFindCandidateLogEntities>() {
  public created_at?: string;
  static get tableName() {
    return "find_candidate_logs";
  }

  static get idColumn() {
    return "id";
  }
  public $beforeInsert() {
    this.created_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }
}
export class PotentialCandidatesModel extends autoImplementWithBase(Model)<IPotentialCandidateEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "potential_candidates";
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
export class EmployerRecruitmentFunnelsModel extends autoImplementWithBase(Model)<IEmployerRecruitmentFunnelEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "employer_recruitment_funnel";
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

