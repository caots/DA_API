export default interface IEntities {
  id: number;
  note?: string;
  company_id?: string;
  comany_name?: string;
  reporter_id?: string;
  reporter_first_name?: string;
  reporter_last_name?: string;

  type_fraud: boolean;
  type_wrongOrMisleadingInformation: boolean;
  type_harrassingTheApplicants: boolean;
  type_other: boolean;
}
export interface IJobSeekerRattingEntities {
  id: number;
  reporter_id?: number;
  job_seeker_id?: number;
  rate: number;
  job_id?: number;
  type: number;
  potential_candidate_id?: number;
}
export interface IChatReportEntities {
  id: number;
  reporter_id: number;
  job_id: number;
  user_id: number;
  report_type: number;
  note: string;
}
