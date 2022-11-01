export interface IPaymentCartEntities {
  id: number;
  employer_id: number;
  job_id?: number;
  status: number;
}
export interface IProductEntities {
  title: string;
}
export interface IProductJobEntities extends IProductEntities {
  job_id: number;
  is_make_featured: number;
  featured_start_date?: string;
  featured_end_date?: string;
  paid_at: string;
  expired_at?: string;
  total_featured_price: number;
  total_standard_price: number;
  total_urgent_price: number;
  total_private_price: number;
  private_applicants: number;
  add_urgent_hiring_badge?: number;
  is_private?: number;
  item_code?: number;
}
export interface IProductAssessmentEntities extends IProductEntities {
  assessment_id: number;
  assessment_type: number;
}
export interface IProductJobseekerEntities extends IProductEntities {
  avatar: number;
  id: number;
}
// export interface IPaymentTopupEntities {
//   id: number;
//   name: string;
//   nbr_take: number;
// }
export interface IPaymentConvergeLogEntities {
  ssl_txn_id?: string;
  user_id?: number;
  payment_id?: number;
  ssl_token?: string;
  ssl_amount?: string;
  ssl_oar_data?: string;
  ssl_departure_date?: string;
  ssl_card_number?: string;
  ssl_issuer_response?: string;
  ssl_merchant_initiated_unscheduled?: string;
  ssl_avs_response?: string;
  ssl_approval_code?: string;
  ssl_txn_time?: string;
  ssl_exp_date?: string;
  ssl_card_short_description?: string;
  ssl_get_token?: string;
  ssl_completion_date?: string;
  ssl_token_response?: string;
  ssl_card_type?: string;
  ssl_transaction_type?: string;
  ssl_cvm_signature_override_result?: string;
  ssl_account_balance?: string;
  ssl_ps2000_data?: string;
  ssl_result_message?: string;
  ssl_result?: string;
  ssl_invoice_number?: string;
  ssl_cvv2_response?: string;
  ssl_partner_app_id?: string;
}
export interface IPaymentEntities {
  id: number;
  user_id: number;
  payment_type: number;
  products: string;
  description: string;
  status: number;
  ssl_card_type: string;
  ssl_card_number: string;
  ssl_exp_date: string;
  total_amount: number;
  sub_total: number;
  discount_value: number;
  tax: number;
  coupon_code: string;
  invoice_receipt_url: string;
}
export interface IPaymentCardEntities {
  ssl_token: string;
  ssl_account_number: string;
  ssl_exp_date: string;
  ssl_card_type: string;
  ssl_company: string;
  ssl_customer_id: string;
  ssl_first_name: string;
  ssl_last_name: string;
  ssl_avs_address: string;
  ssl_address2: string;
  ssl_avs_zip: string;
  ssl_city: string;
  ssl_state: string;
  ssl_country: string;
  ssl_phone: string;
  ssl_email: string;
  ssl_description: string;
  ssl_user_id: string;
  ssl_result: string;
  ssl_token_response: string;
  ssl_token_provider: string;
  ssl_token_format: string;
}
export interface IJobSeekerPaymentHistoryEntities {
  bill_date: string;
  service: string;
  description: string;
  payment_method: string;
  total: string
}
export interface IJobDetailPaymentHistory {
  title: string;
  standard_duration: string;
  standard_price: string;
  featured_duration: string;
  featured_price: string;
  posting_price: string;
  private_applicants: number;
  add_urgent_hiring_badge?: number;
  is_private?: number;
  total_urgent_price?: number;
  total_private_price?: number;
}
export interface IEmployerPaymentHistoryEntities {
  bill_date: string;
  description: IJobDetailPaymentHistory[];
  payment_method: string;
  total: string
}
export interface IPaymentCouponsEntities {
  id: number;
  code: string;
  discount_acc_type: number;
  expired_type: number;
  expired_from: string;
  expired_to: string;
  discount_for: number;
  nbr_used: number;
  is_nbr_user_limit: number;
  discount_type: number;
  discount_value: number;
  max_discount_value: number;
  status: number;
  is_for_all_user: number;
  // not map
  type?: string;
  user_available?: number[];
  user_available_list?: IPaymentCouponUserAvailableEntities[];
  remaining_number: number;
  user_nbr_used: number;
}
export interface IPaymentCouponUserHistoryEntirties {
  id: number;
  coupon_id: number;
  user_id: number;
  payment_id: number;
}
export interface IPaymentCouponUserAvailableEntities {
  id: number;
  payment_coupon_id: number;
  user_id: number;
}

export default interface IUserBillingInfoEntirties {
  id: number;
  first_name?: string;
  last_name?: string;
  user_id: number;
  company_name?: string;
  address_line_1: string;
  address_line_2: string;
  city_name?: string;
  state_name?: string;
  zip_code: string;
}