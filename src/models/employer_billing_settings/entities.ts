export default interface IBillingSettingEmployer {
  id: number;
  standard_price?: number;
  featured_price?: number;
  private_job_price?: number;
  urgent_hiring_price?: number;
  type: number;
  free_direct_message: number;
  standard_direct_message_price: number;
  topup_credit: string;
}
