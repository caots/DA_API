
export default interface IUserPasswordResetEntities {
  id: number;
  email: string;
  token: string;
}

export interface IUserEmailChangeEntities {
  id: number;
  new_email: string;
  token: string;
  user_id: number;
  expires_in: number;
}

export interface IUserReferEntities {
  id: number;
  refer_id: number;
  register_id: number;
  is_applied: number;
}

export interface IUserResponsiveEntities {
  id: number;
  user_id: number;
  reporter_id: number;
  is_responsive: number;
  group_nomal_type: number;
}