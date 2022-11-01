import config from "@src/config";
import HttpException from "@src/middleware/exceptions/httpException";
import AdminModel from "@src/models/admin";
import AdminSessionModel from "@src/models/admin_session";
import { AdminSessionRepository } from "@src/repositories/adminSessionRepository";
import jwt from "jsonwebtoken";
import moment from "moment";

export default class AdminSessionBll {
  private adminSessionRps: AdminSessionRepository;

  constructor() {
    this.adminSessionRps = new AdminSessionRepository(AdminSessionModel);
  }

  /** create record in user_session */
  public async create(user: AdminModel, remember = true): Promise<AdminSessionModel> {
    try {
      /** check token expires and remove from database */
      await this.adminSessionRps.removeAllExpiresByUser(user.$id());
      /** create new token and save database */
      const expiresIn = config.JWT_SECRET_EXPIRES_NO_REMEMBER_ME;
      const token = jwt.sign({ email: user.email, admin: true }, config.JWT_SECRET, { expiresIn });
      const refreshToken = jwt.sign({ email: user.email, admin: true }, config.JWT_SECRET_REFRESH);
      const adminSessionModel = new AdminSessionModel();
      adminSessionModel.user_id = parseInt(user.$id());
      adminSessionModel.access_token = token;
      adminSessionModel.refresh_token = refreshToken;
      adminSessionModel.expires_in = parseInt(expiresIn);
      const createTime = moment().utc().format("YYYY-MM-DD HH:mm:ss");
      adminSessionModel.created_at = createTime;
      adminSessionModel.updated_at = createTime;
      const result = (await this.adminSessionRps.create(adminSessionModel)) as AdminSessionModel;
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  /** find user_session bu id_user and access_token */
  public async findByUserAndAccessToken(idUser: number, accessToken: string): Promise<AdminSessionModel> {
    try {
      const adminSessionModel = new AdminSessionModel();
      adminSessionModel.user_id = idUser;
      adminSessionModel.access_token = accessToken;
      const adminSession = await this.adminSessionRps.find(adminSessionModel);
      return adminSession;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async removeSessionByDeactiveUser(idUser: number): Promise<any> {
    try {
      const result = await AdminSessionModel.query()
        .where({ user_id: idUser })
        .del();
      return result;
    } catch (err) {
      throw err;
    }
  }
}