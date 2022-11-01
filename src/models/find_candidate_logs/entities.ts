export interface IFindCandidateLogEntities {
  id: number;
  employer_id: number;
  max_compensation: string;
  distances: string;
  assessments: string;
  location: string;
  city: string;
  state: string;
  lat: string;
  lon: string;
  zipcode: string;
  order_no: string;
}
export interface IPotentialCandidateEntities {
  id: number;
  job_seeker_id: number;
  employer_id?: number;
  status: number;
  bookmarked?: number;
  chat_group_id?: number;
  can_view_profile?: number;
  can_rate_stars: number;
}
export interface IEmployerRecruitmentFunnelEntities {
  id: number;
  employer_id: number;
  object_data?: string;
  type: number;
  job_id?: number;
}


