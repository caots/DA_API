export default interface IJobApplicantEntities {
  id: number;
  job_sekker_id: number;
  employer_id?: number;
  job_id?: number;
  asking_salary?: number;
  asking_salary_type?: number;
  asking_benefits?: string;
  note?: string;
  bookmarked?: number;
  date_picking?: string;
  total_point?: number;
  assessments_result?: string;
  scheduleTime?: string;
  stage?: number;
  group_id?: number;
  can_view_profile?: number;
  status: number;
  can_rate_stars: number;
  type: number;
}