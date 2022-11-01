import { USER_STATUS } from "@src/config";
import HttpException from "@src/middleware/exceptions/httpException";
import UserPotentialsModel from "@src/models/user_potentials";
import UserPotentialsCategoryModel from "@src/models/user_potentials_category";
import UserPotentialsSubmitPasswordEntitiesModel from "@src/models/user_potentials_submit_password";
import bcrypt from "bcrypt";
import moment from "moment";

export default class UserPotentialsService {

  public async createUserPotentials(user: UserPotentialsModel, categoriesId: number[]): Promise<any> {
    try {
      user.status = USER_STATUS.active;
      user.submited_password = 0;
      const newUser = await UserPotentialsModel.query().insert(user);

      if (!categoriesId || categoriesId.length == 0) return;
      const query = await Promise.all(
        categoriesId.map(async (categoryId: number) => {
          let userPotentialsCategory = new UserPotentialsCategoryModel();
          userPotentialsCategory.category_id = categoryId;
          userPotentialsCategory.user_potential_id = newUser.id;
          return await UserPotentialsCategoryModel.query().insert(userPotentialsCategory);
        }));
      return newUser;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateUserPotentialsCategory(user: UserPotentialsModel, categoriesId: number[]): Promise<any> {
    try {
      // delete all category user potentials
      await UserPotentialsCategoryModel.query().delete().where("user_potential_id", user.id);
      // add new category user potentials
      if (!categoriesId || categoriesId.length == 0) return;
      await Promise.all(
        categoriesId.map(async (categoryId: number) => {
          const newUser = {
            user_potential_id: user.id,
            category_id: categoryId
          }
          return await UserPotentialsCategoryModel.query().insert(newUser);
        }));
      return true;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  /** find by email */
  public async findByEmail(email: string): Promise<UserPotentialsModel> {
    try {
      const userPotentialsModel = new UserPotentialsModel();
      userPotentialsModel.email = email;
      const user = await UserPotentialsModel.query().where('email', email);
      if (user && user.length > 0) return user[0];
      return null;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async findByEmailSafe(email: string): Promise<UserPotentialsModel> {
    try {
      if (!email) {
        return null;
      }
      const user = await this.findByEmail(email);
      return user;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async findListCategory(id: number): Promise<any> {
    try {
      const listUserCategory = await UserPotentialsCategoryModel.query().where("user_potential_id", id);
      return listUserCategory;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async updateUserPotentialsStatusSubmited(userPotentials: UserPotentialsModel): Promise<UserPotentialsModel> {
    try {
      if (!userPotentials) {
        return null;
      }
      userPotentials.submited_password = 1;
      const user = await UserPotentialsModel.query().updateAndFetchById(userPotentials.id, userPotentials);
      return user;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async updateUserPotentialsCompleteInfo(userPotentials: UserPotentialsModel): Promise<UserPotentialsModel> {
    try {
      if (!userPotentials) {
        return null;
      }
      const user = await UserPotentialsModel.query().updateAndFetchById(userPotentials.id, userPotentials);
      return user;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async findUserByToken(token: string): Promise<UserPotentialsSubmitPasswordEntitiesModel[]> {
    try {
      const upseModel = new UserPotentialsSubmitPasswordEntitiesModel();
      upseModel.token = token;
      return UserPotentialsSubmitPasswordEntitiesModel.query().where("token", token);
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async changePasswordRequest(id: number, userPotentials: UserPotentialsModel): Promise<UserPotentialsSubmitPasswordEntitiesModel> {
    try {
      const uecModel = new UserPotentialsSubmitPasswordEntitiesModel();
      uecModel.email = userPotentials.email;
      const token = bcrypt.hashSync(`${id}${moment.utc().toISOString()}`, 10);
      uecModel.token = token;
      let newUPSP = await UserPotentialsSubmitPasswordEntitiesModel.query().insert(uecModel);
      return newUPSP;
    } catch (err) {
      throw new HttpException(400, err.message);
    }
  }

}