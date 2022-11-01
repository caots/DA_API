import HttpException from "@src/middleware/exceptions/httpException";
import AdminModel from "@src/models/admin";
import { AdminRepository } from "@src/repositories/adminRepository";
import bcrypt from "bcrypt";
import { ADMIN_ACCOUNT_STATUS } from '../config/index';

export default class AdminBll {
  private adminRps: AdminRepository;

  constructor() {
    this.adminRps = new AdminRepository(AdminModel);
  }

  /** verify email password */
  public async verifyEmailPassword(email: string, password: string): Promise<AdminModel> {
    try {
      const adminModel = new AdminModel();
      adminModel.email = email;
      const user = await this.adminRps.find(adminModel);
      if (user) {
        if (user.status === ADMIN_ACCOUNT_STATUS.Deactive) {
          throw new HttpException(401, "This account is inactive");
        }
        const checkPassword = bcrypt.compareSync(password, user.password);
        if (checkPassword) return user;
        throw new HttpException(401, "Password is incorrect");
      }
      throw new HttpException(401, "Email or password is incorrect");
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  public async findByEmailSafe(email: string): Promise<AdminModel> {
    try {
      const adminModel = new AdminModel();
      adminModel.email = email;
      const admin = await AdminModel.query().findOne(adminModel);
      if (admin) {
        delete admin.password;
      }
      return admin;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
}