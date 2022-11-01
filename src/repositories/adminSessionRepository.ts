import AdminSessionModel from "@src/models/admin_session";
import { BaseRepository } from "./baseRepository";

export class AdminSessionRepository extends BaseRepository<AdminSessionModel> {
  /** remove all token expires by user */
  public async removeAllExpiresByUser(idUser: number) {
    try {
      const result = await AdminSessionModel.query()
        .where({ user_id: idUser })
        .whereRaw(`updated_at + expires_in < UTC_TIMESTAMP()`)
        .del();
      return result;
    } catch (err) {
      throw err;
    }
  }
}
