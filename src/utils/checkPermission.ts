import { ADMIN_ACCOUNT_TYPE } from '@src/config/index';
import AdminModel from "@src/models/admin";
export const checkAdminPermission = (admin: AdminModel, permitted: number) => {
  const listPermission = admin.permission ? admin.permission.split(",").map(p => parseInt(p)) : [];
  return listPermission.includes(permitted) || admin.acc_type === ADMIN_ACCOUNT_TYPE.SuperAdmin;
};
