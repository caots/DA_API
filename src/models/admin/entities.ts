export default interface IAdminEntities {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  password: string;
  role_id: number;
  created_at?: string;
  updated_at?: string;
  deleted_flag: boolean;
  status?: number;
  acc_type: number;
  permission: string;
}
