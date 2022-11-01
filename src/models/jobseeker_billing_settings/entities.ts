export default interface IBillingSettingJobSeeker {
  id: number;
  is_enable_free_assessment: number;
  free_assessment_validation?: number;
  nbr_referral_for_one_validation?: number;
  standard_validation_price?: number;
  topup_validation_price?: number;
  top_up?: string;
  type: number;
}
