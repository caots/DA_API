export default interface IJobsEntities {
  id: number;
  title: string;
  salary?: number;
  desciption?: string;
  // qualifications?: string;
  benefits?: string;
  jobs_level_id?: number;
  jobs_category_ids?: number;
  nbr_open?: number;
  location?: string;
  expired_at?: string;
  expired_days?: number;
  employer_id: number;
  city_id?: number;
  city_name: string;
  state_name?: string;
  state_id: number;
  country_name?: string;
  country_id: number;
  status: number;
  paid_at?: string;
  total_applicants: number;
  toal_view?: number;
  is_make_featured: number;
  featured_start_date?: string;
  featured_end_date?: string;
  salary_type?: number;
  bonus?: string;
  job_fall_under: string;
  percent_travel?: number;
  specific_percent_travel_type?: number;
  schedule_job: string;
  add_urgent_hiring_badge?: number;
  is_private?: number;
  private_applicants?: number;
  employment_type?: number;
  salary_min?: number;
  salary_max?: number;
  proposed_conpensation?: number;
  // not map
  jobs_levels_name?: string;
  jobs_category_name?: string;
  job_assessments?: any;
  is_applied?: boolean;
  total_featured_price?: number;
  total_standard_price?: number;
  total_private_price?: number;
  total_urgent_price?: number;
  is_crawl?: number;
  is_exclude_company?: number;
  crawl_url?: string;
  crawl_from?: string;
  lat?: string;
  lon?: string;
  expired_urgent_hiring_badge_at: string;
  is_crawl_text_status?: number;
  //not map
  employer_company_name?: string
}
export interface IJobReportEntities {
  id: number;
  reporter_id: number;
  job_id: number;
  company_id: number;
  report_type: number;
  note: string;
}
