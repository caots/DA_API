import HttpException from "@src/middleware/exceptions/httpException";
import BlackListUserModel from "@src/models/blacklist";

export default class BlackListService {
  public async getListBackList(): Promise<BlackListUserModel[]> {
    try {
      const result = await BlackListUserModel.query();
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getBackListById(id: number): Promise<BlackListUserModel> {
    try {
      const result = await BlackListUserModel.query().findById(id);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async add(item): Promise<any> {
    try {
      const result = await BlackListUserModel.query().insert(item);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async update(id: number, item): Promise<any> {
    try {
      const result = await BlackListUserModel.query().updateAndFetchById(id, item);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async delete(id): Promise<any> {
    try {
      const result = await BlackListUserModel.query().deleteById(id);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
}