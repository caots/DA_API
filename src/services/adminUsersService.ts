import { PAGE_SIZE } from "@src/config";
import HttpException from "@src/middleware/exceptions/httpException";
import AdminModel from '@src/models/admin';
import IAdminEntities from "@src/models/admin/entities";
import bcrypt from 'bcrypt';
import { ADMIN_ACCOUNT_STATUS, ADMIN_ACCOUNT_TYPE } from '../config/index';

export default class AdminUsersService {
  public async getListAdminUsers(
    q = "",
    page = 0,
    pageSize = PAGE_SIZE.Standand
  ): Promise<any> {
    try {
      let query = AdminModel.query().select([
          "admins.id",
          "admins.first_name",
          "admins.last_name",
          "admins.email",
          "admins.status",
          "admins.created_at",
          "admins.permission"
        ])
        .where("admins.acc_type", ADMIN_ACCOUNT_TYPE.Admin)
        .where("admins.deleted_flag", 0)
      if (q) {
        query = query.where(builder => builder
          .where("admins.email", "like", `%${q}%`)
          .orWhereRaw(`CONCAT(admins.first_name,' ', admins.last_name) like '%${q}%'`)
        );
      }

      return query
        .orderBy("admins.created_at", "DESC")
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async findById(id: number): Promise<IAdminEntities> {
    try {
      const user = await AdminModel.query().findById(id);
      return user;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async updateAdminInfo(adminId: number, model: AdminModel): Promise<AdminModel> {
    try {
      return AdminModel.query().patchAndFetchById(adminId, model);
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async deactiveAdminUser(adminId: number): Promise<any> {
    try {
      return AdminModel.query().deleteById(adminId);
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async createAdminMember(model: AdminModel): Promise<AdminModel> {
    try {
      model.acc_type = ADMIN_ACCOUNT_TYPE.Admin;
      model.status = ADMIN_ACCOUNT_STATUS.Pending;
      model.role_id = 1;
      const hash = bcrypt.hashSync(model.password, 10);
      model.password = hash;
      return AdminModel.query().insert(model);
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
}
