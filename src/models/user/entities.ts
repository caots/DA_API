export default interface IUserEntities {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number: string;
  acc_type: number;
  password: string;
  verified_token: string;
  provider?: number;
  sign_up_step?: number;
  date_of_birth?: string;
  status?: number;
  profile_picture?: string;
  company_name?: string;
  company_profile_picture?: string;
  address_line?: string;
  asking_salary?: number;
  asking_benefits?: string;
  description?: string;
  email_verified?: number;
  nbr_credits?: number;
  nbr_free_credits?: number;
  region_code?: string;
  company_size_min?: number;
  company_size_max?: number;
  city_name?: string;
  state_name?: string;
  note?: string;
  is_deleted: number;
  is_user_deleted: number;
  employer_industry?: string;
  employer_revenue_min?: number;
  employer_revenue_max?: number;
  employer_year_founded?: string;
  employer_company_photo?: string;
  employer_company_video?: string;
  employer_ceo_name?: string;
  employer_ceo_picture?: string;
  employer_company_url?: string;
  employer_company_twitter?: string;
  employer_company_facebook?: string;
  rate?: number;
  old_email?: string;
  refer_link?: string;
  asking_salary_type: number;
  lat: string;
  lon: string;
  assessments: any[];
  employer_title?: string;
  employer_id?: number;
  chat_group_id?: number;
  user_responsive?: number;
  converge_ssl_token?: string;
  title?: string;
  zip_code: string;
  enable_show_avatar: number;
  company_id: number;
  // not map
  reports?: any[];
  companyInfo: any;
  onwer_id: number;
  is_subscribe?: boolean;
  ip_address: string;
  is_take_first_assessment: number;
}
export interface IEmployerPermissionEntities {
  id: number;
  name: string;
}
export interface IEmployerMemberPermissionEntities {
  id: number;
  employer_member_id?: number;
  employer_permission_id?: number;
  employer_id?: number;
}

export interface IUserSubcribeEntities {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  acc_type: number;
  is_subscribe: boolean;
  reason_unsubcribe?: string;
  reason_unsubcribe_type?: number;
}

export interface IUserStoryEntities {
  id: number;
  user_id: number;
  name: string;
  assessment: string;
  token: string;
}