import { GROUP_TYPE } from "@src/chatModule/lib/config";
import { ChatGroupMembersModel, ChatGroupsModel } from "@src/chatModule/models";
import { ZoomService } from "@src/chatModule/service/room";
import { ACCOUNT_TYPE, ADMIN_PERMISSION, COMMON_STATUS, JOB_SEEKER_ASSESSMENT_STATUS, NOTIFICATION_TYPE, PAGE_SIZE, USER_STATUS } from "@src/config";
import HttpException from "@src/middleware/exceptions/httpException";
import logger from "@src/middleware/logger";
import AdminModel from "@src/models/admin";
import CompanyModel from "@src/models/company";
import CompanyReportsModel, { JobSeekerRattingsModel } from "@src/models/company_reports";
import FindCandidateLogsModel from "@src/models/find_candidate_logs";
import JobAssessmentsModel from "@src/models/job_assessments";
import UserModel, { UserSubcribesModel } from "@src/models/user";
import UserNotificationModel from "@src/models/user_notifications";
import { UserEmailChangesModel, UserRefersModel } from "@src/models/user_password_reset";
import UserSessionModel from "@src/models/user_session";
import UserSurveysModel from "@src/models/user_surveys";
import { UserRepository } from "@src/repositories/userRepository";
import { UserSessionRepository } from "@src/repositories/userSessionRepository";
import { checkAdminPermission } from '@src/utils/checkPermission';
import MailUtils from "@src/utils/sendMail";
import bcrypt from "bcrypt";
import moment from "moment";
import { raw, transaction } from "objection";
import Zipcodes from "zipcodes";
import { JOBSEEKER_RATTING_TYPE } from './../config/index';
import BillingSettingsService from "./billingSettingsService";
import JobSeekerAssessmentsService from "./jobSeekerAssessmentsService";
import JobsService from "./jobsService";
import NotificationService from "./notification";
export default class UserBll {
  private userRps: UserRepository;

  constructor() {
    this.userRps = new UserRepository(UserModel);
  }

  /** create user */
  public async create(user: UserModel): Promise<UserModel> {
    try {
      /** create hashed password */
      const hash = bcrypt.hashSync(user.password, 10);
      const verifiedToken = bcrypt.hashSync(`${user.email}${Date.now()}`, 10);
      user.password = hash;
      user.verified_token = verifiedToken;
      const result = await this.userRps.create(user) as UserModel;
      const newUser = await this.userRps.find(result);
      return newUser as UserModel;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  /** verify email password */
  public async verifyEmailPassword(email: string, password: string): Promise<UserModel> {
    try {
      const userModel = new UserModel();
      userModel.email = email;
      const user = await this.userRps.find(userModel);
      if (user) {
        const checkPassword = bcrypt.compareSync(password, user.password);
        const dayDiff = moment().utc().diff(moment(user.created_at).utc(), "days", true);
        if (!user.email_verified && dayDiff >= 1) {
          const msg = !user.old_email ? "Please check your email and complete your account verification to log in." : "You need to check your mailbox and verify your new email before you can sign in with that email."
          throw new HttpException(401, msg);
        }
        if (user.status == USER_STATUS.deactive || user.is_deleted) {
          throw new HttpException(401, "This account has been restricted. Please contact MeasuredSkills for more information.");
        }
        // if (user.status == USER_STATUS.deactive) {
        //   throw new HttpException(401, "The user has been deactivated");
        // }
        // if (user.is_deleted) {
        //   throw new HttpException(401, "Your account was suspended. Please create a new account");
        // }
        if (checkPassword) {
          if (user.is_user_deleted) {
            userModel.is_user_deleted = 0;
            await this.update(user.id, userModel);
          }
          return user;
        }
        throw new HttpException(401, "Password is incorrect");
      }
      throw new HttpException(401, "Email or password is incorrect");
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  public checkPassword(user: UserModel, password: string) {
    const checkPassword = bcrypt.compareSync(password, user.password);
    return checkPassword;
  }
  /** find by email */
  public async findByEmail(email: string): Promise<UserModel> {
    try {
      const userModel = new UserModel();
      userModel.email = email;
      const user = await this.userRps.find(userModel);
      // if (user) return user;
      // throw new HttpException(401, "Email fail");
      return user;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  public async getById(id: number): Promise<UserModel> {
    try {
      const user = await UserModel.query().findById(id);
      delete user.password;
      return user;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async getCompanyById(id: number): Promise<CompanyModel> {
    try {
      const user = await CompanyModel.query().findById(id);
      return user;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async findByVerifiedToken(token: string): Promise<UserModel> {
    try {
      const user = await UserModel.query().where("verified_token", token);
      if (user && user.length > 0) { return user[0]; }
      return null;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async getAllComnpanies(orderNo = 0): Promise<CompanyModel[]> {
    try {
      const orderArray = this.getOrderCompany(orderNo);
      const companies = await CompanyModel.query()
        .where(buider => buider
          .whereNull("is_crawl")
          .orWhereRaw("is_crawl = 1 and is_claimed = 1")
        ).orderBy(orderArray[0], orderArray[1]);
      if (companies && companies.length > 0) return companies;
      return null;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  public async getAllComnpaniesExcludeCrawler(typeExcludeCrawl = 0, name): Promise<any> {
    try {
      let query = CompanyModel.query().select('company.*', 'EP.email as email_user')
        .join("users as EP", "company.employer_id", "EP.id")
        .where('company.is_crawl', 1)
      if (typeExcludeCrawl > 0) {
        query = query.where('company.is_exclude', typeExcludeCrawl)
      }
      if (name) {
        query = query.where(builder => builder.where("company.company_name", "like", `%${name}%`))
      }
      return query;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  public async getAllComnpaniesCrawler(): Promise<any> {
    try {
      let query = CompanyModel.query().select('company.*', 'EP.email as email_user')
        .join("users as EP", "company.employer_id", "EP.id")
        .where('company.is_crawl', 1)
      return query;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  public async getAllComnpaniesCrawlerPage(page, pageSize, name, orderNo = 0): Promise<any> {
    try {
      const orderArray = this.getOrderCompanyCrawl(orderNo);
      let query = CompanyModel.query().select('company.*', 'EP.email as email_user')
        .join("users as EP", "company.employer_id", "EP.id")
        .where('company.is_crawl', 1)
      if (name) {
        query = query.where(builder => builder.where("company.company_name", "like", `%${name}%`))
      }
      return query
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  getOrderCompanyCrawl(orderBy: number) {
    let orders;
    switch (orderBy) {
      case 0:
        orders = ["company.created_at", "desc"];
        break;
      case 1:
        orders = ["company.created_at", "asc"];
        break;
      default:
        orders = ["company.created_at", "desc"];
        break;
    }
    return orders;
  }

  getOrderCompany(orderBy: number) {
    let orders;
    switch (orderBy) {
      case 0:
        orders = ["company.company_name", "asc"];
        break;
      case 1:
        orders = ["company.company_name", "desc"];
        break;
      default:
        orders = ["company.company_name", "asc"];
        break;
    }
    return orders;
  }

  public async findByEmailSafe(email: string): Promise<UserModel> {
    try {
      if (!email) {
        return null;
      }
      const user = await this.findByEmail(email);
      if (user) {
        delete user.password;
        delete user.verified_token;
      }

      return user;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  public async update(id: number, userUpdate: UserModel): Promise<UserModel> {
    try {
      userUpdate = this.getLatLon(userUpdate);
      const user = await UserModel.query().patchAndFetchById(id, userUpdate);
      const delegates = await UserModel.query().where("employer_id", id).andWhere("acc_type", ACCOUNT_TYPE.Employer);
      if(delegates && delegates.length > 0){
        await Promise.all(
          delegates.map(async (delegate: UserModel) => {
            await UserModel.query().patchAndFetchById(delegate.id, userUpdate);
          })
        )
      }
      return user;
    } catch (err) {
      throw new HttpException(400, err.message);
    }
  }

  public async createInfoCompany(company: CompanyModel): Promise<CompanyModel> {
    try {
      const result = await CompanyModel.query().insert(company);
      return result as CompanyModel;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateInfoCompany(id: number, companyUpdate: CompanyModel): Promise<CompanyModel> {
    try {
      companyUpdate = this.getLatLon(companyUpdate);
      const company = await CompanyModel.query().patchAndFetchById(id, companyUpdate);
      return company;
    } catch (err) {
      throw new HttpException(400, err.message);
    }
  }
  public async updateEmailUserByAdmin(id: number, user: any): Promise<any> {
    try {
      const result = await UserModel.query().patchAndFetchById(id, user);
      return result;
    } catch (err) {
      throw new HttpException(400, err.message);
    }
  }
  // public async updateFreeCredits(nbr_free_credits_add): Promise<any> {
  //   try {
  //     const user = await UserModel.query().patch({ nbr_free_credits: raw('nbr_free_credits + ?', nbr_free_credits_add) })
  //       .where("acc_type", ACCOUNT_TYPE.JobSeeker);
  //     // const query = `update users set nbr_free_credits = nbr_free_credits + ${nbr_free_credits_add} where acc_type = ${ACCOUNT_TYPE.JobSeeker};`
  //     // const user = await UserModel.raw(query);
  //     return user;
  //   } catch (err) {
  //     throw new HttpException(400, err.message);
  //   }
  // }
  public getLatLon(userUpdate: any) {
    const jobService = new JobsService();
    if ((userUpdate.city_name && userUpdate.state_name) || userUpdate.zip_code) {
      const coordinates = jobService.getLatLong(userUpdate.city_name, userUpdate.state_name, userUpdate.zip_code);
      if (coordinates && coordinates.length == 2) {
        userUpdate.lat = coordinates[0];
        userUpdate.lon = coordinates[1];
      }
    }
    return userUpdate;
  }
  public async updatePassword(id: number, userUpdate: UserModel): Promise<UserModel> {
    try {
      const hash = bcrypt.hashSync(userUpdate.password, 10);
      userUpdate.password = hash;
      const result = await this.update(id, userUpdate);
      const mailUtil = new MailUtils();
      if (result.status == COMMON_STATUS.Active && result.is_deleted == 0 && result.is_user_deleted == 0) mailUtil.changedPassword(result.email, result).then();
      return result;
    } catch (err) {
      throw new HttpException(400, err.message);
    }
  }

  public async updateUserIPAddress(id: number, ip: string): Promise<number> {
    try {
      const result = await UserModel.query().update({ ip_address: ip }).where("id", id);
      return result;
    } catch (err) {
      throw new HttpException(400, err.message);
    }
  }

  public async deleles(ids: number[], action = "restore"): Promise<number> {
    try {
      const is_deleted = action == "restore" ? 0 : 1;
      const result = await UserModel.query().update({ is_deleted }).whereIn("id", ids);
      await Promise.all(
        ids.map(async (id: number) => {
          const delegates = await UserModel.query().where("employer_id", id).andWhere("acc_type", ACCOUNT_TYPE.Employer);
          if(delegates && delegates.length > 0){
            await Promise.all(
              delegates.map(async (delegate: UserModel) => {
                await UserModel.query().update({ is_deleted }).where("id", delegate.id);
              })
            )
          }
        })
      );
      return result;
    } catch (err) {
      throw new HttpException(400, err.message);
    }
  }

  public async findById(id: number): Promise<UserModel> {
    try {
      const user = await UserModel.query().findById(id);
      return user;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  // -------------------------------------------------------------
  // Start Report Feature
  public async createReport(object: CompanyReportsModel) {
    try {
      const newReport = await CompanyReportsModel.query().insert(object);
      logger.info("create newReport");
      logger.info(JSON.stringify(newReport));
      return newReport;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getReports(companyId: number) {
    try {
      const reports = await CompanyReportsModel.query().where("company_id", companyId);
      return reports;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // -------------------------------------------------------------
  // End Report Feature

  public async getUsers(
    accType = ACCOUNT_TYPE.Employer,
    // companyId = '',
    location = "", name = "",
    isHasReport = false, status = COMMON_STATUS.Active,
    orderNo = 0,
    page = 0, pageSize = PAGE_SIZE.Standand
  )
    : Promise<any> {
    try {
      const orderArray = this.getOrder(orderNo);
      let query = UserModel.query()
        .select([
          "users.id", "users.acc_type", "users.email", "users.provider", "users.sign_up_step", "users.date_of_birth",
          "users.status", "users.profile_picture",
          "users.first_name", "users.last_name", "C.company_name", "users.phone_number", "C.address_line",
          "users.asking_salary", "users.note",
          "users.asking_benefits", "C.description", "users.created_at", "users.updated_at", "users.converge_ssl_token",
          "users.nbr_credits",
          "users.region_code", "users.verified_token", "users.company_size_min", "C.company_size_max", "C.city_name",
          "users.state_name",
          "users.is_deleted", "users.employer_id", "users.company_id", "users.chat_group_id"
        ])
        .where("users.acc_type", accType)
        .leftJoin("company as C", "C.id", "users.company_id")
      // .where("users.employer_id", 0);
      // .join("company_reports as CR", "CR.company_id", "users.id");
      // if (companyId) {
      //   query = query.where("C.id", companyId);
      // }

      if(accType == ACCOUNT_TYPE.Employer){
        query = query.where("users.employer_id", 0);
        query = query
        .where(buider => buider
          .whereNull("C.is_crawl")
          .orWhereRaw("C.is_crawl = 1 and C.is_claimed = 1"))
      }

      if (name) {
        const nameArr = name.split(" ");
        if (accType == ACCOUNT_TYPE.Employer) {
          query = nameArr.length > 1 ? query.where(builder =>
            builder.where("C.company_name", "like", `%${name}%`)
              .orWhere(builder => builder.where("users.first_name", "like", `%${nameArr[0]}%`).where("users.last_name", "like", `%${nameArr[1]}%`)))
            : query.where(builder =>
              builder.where("C.company_name", "like", `%${name}%`)
                .orWhere("users.first_name", "like", `%${name}%`)
                .orWhere("users.last_name", "like", `%${name}%`));
        } else {
          if (nameArr.length > 1) {
            query = query.where("users.first_name", "like", `%${nameArr[0]}%`).where("users.last_name", "like", `%${nameArr[1]}%`);
          } else if (nameArr.length == 1) {
            query = query.where(builder => builder.
              where("users.first_name", "like", `%${name}%`)
              .orWhere("users.last_name", "like", `%${name}%`)
            );
          }
        }
      }
      if (!isHasReport && status != undefined) {
        query = query.where("users.status", status);
      }
      if (isHasReport && accType == ACCOUNT_TYPE.Employer) {
        query.whereExists(
          CompanyReportsModel.query()
            .select("id")
            .whereColumn("users.id", "company_reports.company_id")
        );
      }
      if (location) {
        query = query.where("users.city_name", location);
      }
      return query
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateUserGroupChat(
  )
    : Promise<any> {
    try {
      let query = await UserModel.query().where("chat_group_id", null);
      query = await Promise.all(
        query.map(async (employer: UserModel) => {
          const group = await this.createGroupSupportChat(employer);
          return employer;
        })
      );
      return query;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async updateMiss(
  )
    : Promise<any> {
    try {
      const listMiss = await ChatGroupMembersModel.query().whereNull("member_id");
      let query = await Promise.all(
        listMiss.map(async (employer: ChatGroupMembersModel) => {
          const group = await ChatGroupsModel.query().findById(employer.group_id);
          employer.member_id = group.member_id;
          await ChatGroupMembersModel.query().updateAndFetchById(employer.id, { member_id: group.member_id });
        })
      );
      return query;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  //  Highest Score, Lowest Score, Hightest Salary và Lowest Salary
  public getOrder(orderBy: number) {
    let orders;
    switch (orderBy) {
      case 0:
        orders = ["users.created_at", "desc"];
        break;
      case 1:
        orders = ["users.created_at", "asc"];
        break;
      case 2:
        orders = ["users.last_name", "asc"];
        break;
      case 3:
        orders = ["users.last_name", "desc"];
        break;
      default:
        orders = ["users.created_at", "desc"];
        break;
    }
    return orders;
  }

  // ratting job seeker
  public async addOrUpdateRatting(jobId: number, jobSeekerId: number, reporterId: number, rate: number, type = JOBSEEKER_RATTING_TYPE.Applicant): Promise<boolean> {
    try {
      const jsRatting = new JobSeekerRattingsModel();
      jsRatting.job_seeker_id = jobSeekerId;
      jsRatting.reporter_id = reporterId;
      if (type == JOBSEEKER_RATTING_TYPE.Applicant) {
        jsRatting.job_id = jobId;
      }
      jsRatting.type = type;
      const current = await JobSeekerRattingsModel.query().findOne(jsRatting);
      if (current) {
        jsRatting.rate = rate;
        const a = await JobSeekerRattingsModel.query().patchAndFetchById(current.id, jsRatting);
        return true;
      }
      jsRatting.rate = rate;
      const result = await JobSeekerRattingsModel.query().insert(jsRatting);
      return true;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async updateAvgRattingJobseeker(jobSeekerId: number) {
    try {
      const rateAvgResult = await JobSeekerRattingsModel.query()
        .avg("rate")
        .where("job_seeker_id", jobSeekerId)
        .as("avgRating");
      if (rateAvgResult.length > 0 && rateAvgResult[0]["avg(`rate`)"] != null) {
        const userModel = new UserModel();
        userModel.rate = rateAvgResult[0]["avg(`rate`)"];
        await this.update(jobSeekerId, userModel);
      }
      return true;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // end ratting job seeker

  // delete
  public async makeDeleleByUser(id: number, action = "delete"): Promise<UserModel> {
    try {
      const is_user_deleted = action == "restore" ? 0 : 1;
      const userModel = new UserModel();
      userModel.is_user_deleted = is_user_deleted;
      const result = await UserModel.query().updateAndFetchById(id, userModel);
      const userSession = new UserSessionRepository(UserSessionModel);
      await userSession.removeAllByUserId(id);
      return result;
    } catch (err) {
      throw new HttpException(400, err.message);
    }
  }
  // end delete

  // change Email
  public async changeEmailRequest(id: number, userUpdate: UserModel): Promise<UserEmailChangesModel> {
    try {
      const uecModel = new UserEmailChangesModel();
      uecModel.new_email = userUpdate.email;
      uecModel.expires_in = 86400; // 1 day
      uecModel.user_id = id;
      const token = bcrypt.hashSync(`${id}${moment.utc().toISOString()}`, 10);
      uecModel.token = token;
      let newUEC;
      const scrappy = await transaction(UserModel, UserEmailChangesModel, async (userModel, userEmailChangesModel) => {
        const user = await userModel.query().patchAndFetchById(id, userUpdate);
        newUEC = await userEmailChangesModel.query().insert(uecModel);
      });
      logger.info("create changeEmail");
      logger.info(JSON.stringify(scrappy));
      return newUEC;
    } catch (err) {
      throw new HttpException(400, err.message);
    }
  }
  public async findUserByToken(token: string): Promise<UserEmailChangesModel> {
    try {
      const uecModel = new UserEmailChangesModel();
      uecModel.token = token;
      const uec = await UserEmailChangesModel.query().findOne(uecModel);
      return uec;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  
  public async changeEmailSuccess(uecId: number, userId: number, userUpdate: UserModel): Promise<any> {
    try {
      const uecModel = new UserEmailChangesModel();
      uecModel.id = uecId;
      const scrappy = await transaction(UserModel, UserEmailChangesModel, async (userModel, userEmailChangesModel) => {
        const user = await userModel.query().patchAndFetchById(userId, userUpdate);
        const ewUEC = await userEmailChangesModel.query().deleteById(uecId);
      });
      logger.info("changeEmailSuccess");
      logger.info(JSON.stringify(scrappy));
      return scrappy;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }

  // end change email

  // gen genReferLink
  public async genReferLink(userId: number): Promise<UserModel> {
    try {
      const token = bcrypt.hashSync(`${moment.utc().toISOString()}`, 5);
      // const token = bcrypt.hashSync(`${moment.utc().toISOString()}`, 5);
      const updateUSer = new UserModel();
      updateUSer.refer_link = token;
      const user = await this.update(userId, updateUSer);
      return user;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  public async addUserReferLink(ref: string, registerId: number): Promise<boolean> {
    try {
      const updateUSer = new UserModel();
      updateUSer.refer_link = ref;
      const user = await UserModel.query().findOne(updateUSer);
      if (user) {
        const userRefersModel = new UserRefersModel();
        userRefersModel.refer_id = user.id;
        userRefersModel.register_id = registerId;
        const userRef = await UserRefersModel.query().findOne(userRefersModel);
        if (!userRef) {
          const result = await UserRefersModel.query().insert(userRefersModel);
        }
      }
      return true;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  public async getUserReferLink(registerId: number, isApplied = 0): Promise<UserRefersModel> {
    try {
      const userRefersModel = new UserRefersModel();
      userRefersModel.register_id = registerId;
      userRefersModel.is_applied = isApplied;
      const userRef = await UserRefersModel.query().findOne(userRefersModel);
      return userRef;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  public async appliedLogicReferLink(userRefer: UserRefersModel): Promise<boolean> {
    try {
      if (!userRefer || !userRefer.refer_id) {
        return;
      }
      const referUser = await this.findById(userRefer.refer_id);
      if (!referUser) {
        return;
      }
      const updateUSer = new UserModel();
      const billingSettingsService = new BillingSettingsService();
      const jobSeekerSettings = await billingSettingsService.getSystemSettingsForJobSeeker();
      const userRegister = await UserModel.query().where({ 'id': userRefer.register_id }).first();
      if (!jobSeekerSettings.nbr_referral_for_one_validation) { return; }
      const addNbrCredit = Math.ceil((jobSeekerSettings.nbr_referral_for_one_validation) * 1000) / 1000;
      updateUSer.nbr_credits = referUser.nbr_credits + addNbrCredit;
      const user = await this.update(referUser.id, updateUSer);
      new NotificationService().insert({
        data: new UserNotificationModel({
          user_id: referUser.id,
          type: NOTIFICATION_TYPE.ReferralCredit,
          user_acc_type: ACCOUNT_TYPE.JobSeeker,
          metadata: JSON.stringify({
            register_id: userRegister.id,
            first_name: userRegister.first_name,
            last_name: userRegister.last_name,
          })
        })
      })

      //send mail
      const mailUtil = new MailUtils();
      const registUser = await this.findById(userRefer.register_id);
      UserRefersModel.query().updateAndFetchById(userRefer.id, { is_applied: 1 } as UserRefersModel).then();
      // const userRef = await UserRefersModel.query().delete(userRefersModel);
      return true;
    } catch (err) {
      throw new HttpException(401, err.message);
    }
  }
  // end gen refer

  public async createGroupSupportChat(user: UserModel) {
    try {
      // create support group
      const zoomService = new ZoomService(null, null);
      let companyId = null;
      if (user.acc_type == ACCOUNT_TYPE.Employer) {
        companyId = user.employer_id > 0 ? user.employer_id : user.id;
      }
      const groupObj = await zoomService.getOrCreateGroup(null, 0, null, companyId, user.id, GROUP_TYPE.Support);
      logger.info("add group:" + JSON.stringify(groupObj));
      await this.update(user.id, { chat_group_id: groupObj.groupInfo.id } as UserModel);
      user.chat_group_id = groupObj.groupInfo.id;
      return groupObj;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }


  public checkHavePermission(adminUser: AdminModel, accType: number): boolean {
    let permitted = null;
    switch (accType) {
      case ACCOUNT_TYPE.Employer:
        permitted = ADMIN_PERMISSION.AccessEmployer;
        break;
      case ACCOUNT_TYPE.JobSeeker:
        permitted = ADMIN_PERMISSION.AccessJobseeker;
        break;
      default:
        permitted = null;
    }
    return permitted === null || checkAdminPermission(adminUser, permitted);
  }

  public async unsubcribeReceiveUpdate(user: UserSubcribesModel): Promise<number> {
    try {
      const { id, ...rest } = user;
      const result = (await UserSubcribesModel.query().update(rest).where({ email: user.email }));
      return result
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async updateUserSubcribe(user: UserSubcribesModel, id: number): Promise<UserSubcribesModel> {
    try {
      await UserSubcribesModel.query().update(user).where({ id: id });
      return (await UserSubcribesModel.query().where({ id: id }))[0]
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async createUserSubcribe(user: UserSubcribesModel): Promise<UserSubcribesModel> {
    try {
      const result = await UserSubcribesModel.query().insert(user) as UserSubcribesModel;
      return result
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findUserSubcribeByParams(params: object): Promise<UserSubcribesModel> {
    try {
      const result = (await UserSubcribesModel.query().where(params))[0];
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findUserSubcribeByEmail(email: string, acc_type = ACCOUNT_TYPE.Employer): Promise<UserSubcribesModel> {
    try {
      let obj: object = { email };
      acc_type >= 0 && (obj = { ...obj, acc_type })

      const result = await UserSubcribesModel.query().findOne(obj);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async addFindCandidateLogs(object: FindCandidateLogsModel): Promise<FindCandidateLogsModel> {
    try {
      const result = await FindCandidateLogsModel.query().insert(object);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public getOrderFindCandidate(orderBy: number) {
    let orders;
    switch (orderBy) {
      case 0:
        orders = ["total_point", "desc"];
        break;
      case 1:
        orders = ["total_point", "asc"];
        break;
      default:
        orders = ["total_point", "desc"];
        break;
    }
    return orders;
  }
  public async findCandidate(
    employerId,
    assessments = [],
    maxCompensation = '',
    lat = "", lon = "", within = "", city = "", state = "", zipcode = "",
    orderNo = 0,
    page = 0,
    pageSize = PAGE_SIZE.Standand, jobseekerId = 0,
  )
    : Promise<any> {
    try {
      const orderArray = this.getOrderFindCandidate(orderNo);
      const selects = [
        "users.id", "users.email", "users.status", "users.profile_picture",
        "users.first_name", "users.last_name", "users.address_line",
        "users.asking_salary", "users.asking_salary_type",
        "users.asking_benefits", "users.description", "users.created_at",
        "users.city_name", "users.state_name",
        "PC.chat_group_id",
        "PC.can_view_profile",
        "PC.can_rate_stars",
        "PC.potential_candidates_status",
      ];
      let query = UserModel.query()
        .where("users.acc_type", ACCOUNT_TYPE.JobSeeker)
        .where("users.status", USER_STATUS.active)
        .where("users.is_user_deleted", 0)
        .leftJoin("potential_candidates as PC", s => {
          s.on("PC.job_seeker_id", "users.id")
            .andOn("PC.employer_id", employerId);
        })

      const jsaService = new JobSeekerAssessmentsService();
      // let jsas = await jsaService.getJobsekkerAssessment(jobSeekerId, JOB_SEEKER_ASSESSMENT_STATUS.Taked);
      // solution
      // 	(select weight from job_seeker_assessments where assessment_id in ('1158573') and job_seeker_id = users.id and weight is not null) as weight_1,
      // 	(select weight from job_seeker_assessments where assessment_id in ('1158596') and job_seeker_id = users.id and weight is not null) as weight_2,
      // 	(select weight from job_seeker_assessments where assessment_id in ('1158598') and job_seeker_id = users.id and weight is not null) as weight_3
      // (select if(weight_1 >= 0, weight_1, 0)*50 + if(weight_2 >= 0, weight_2, 0)*30 + if(weight_3 >= 0, weight_3, 0)*20) as total
      // ,(select if(weight_1 >= 0, 50, 0) + if(weight_2 >= 0, 30, 0)+if(weight_3 >= 0, 20, 0)) as total_percent
      // , (select total/total_percent) as total_point
      if (assessments.length > 0) {
        //	(select weight from job_seeker_assessments where assessment_id in ('1158573') and job_seeker_id = users.id and weight is not null) as weight_0,
        assessments.map(async (assessment: JobAssessmentsModel, index) => {
          const select = await raw(`(select weight from job_seeker_assessments where assessment_id = ${assessment.assessment_id}` +
            ` and job_seeker_id = users.id and status = ${JOB_SEEKER_ASSESSMENT_STATUS.Taked}) as weight_${assessment.assessment_id}`);
          selects.push(select);
        })

        let selectTotalString = `(select [IfElements] 0 ) as total`;
        let ffElements = ``;
        // 	(select if(weight_1 >= 0, weight_1, 0)*50 + if(weight_2 >= 0, weight_2, 0)*30 + if(weight_3 >= 0, weight_3, 0)*20) as total
        assessments.map(async (assessment: JobAssessmentsModel, index) => {
          const ifElement = `if(weight_${assessment.assessment_id} >= 0, weight_${assessment.assessment_id}, 0)*${assessment.point} +`;
          ffElements = `${ffElements} ${ifElement}`;
        })
        selectTotalString = selectTotalString.replace("[IfElements]", ffElements);
        selects.push(await raw(selectTotalString));

        let selectTotalPercent = `(select [IfElements] 0 ) as total_percent`;
        let ffElementsPercent = ``;
        // (select if(weight_1 >= 0, 50, 0) + if(weight_2 >= 0, 30, 0)+if(weight_3 >= 0, 20, 0)) as total_percent
        assessments.map(async (assessment: JobAssessmentsModel, index) => {
          const ifElement = `if(weight_${assessment.assessment_id} >= 0, ${assessment.point}, 0) +`;
          ffElementsPercent = `${ffElementsPercent} ${ifElement}`;
        })
        selectTotalPercent = selectTotalPercent.replace("[IfElements]", ffElementsPercent);
        selects.push(await raw(selectTotalPercent));
        // , (select total/total_percent) as total_point
        selects.push(await raw(`(select total/total_percent) as total_point`));
      }
      if (jobseekerId) {
        query = query.where("users.id", jobseekerId);
      }
      if (within && parseFloat(within) && ((lat && lon) || zipcode)) {
        // search by zipcode
        if (zipcode && !(lat || lon)) {
          lat = '';
          lon = '';
          const loc = Zipcodes.lookup(zipcode);
          if (loc) {
            lat = `${loc.longitude}`;
            lon = `${loc.latitude}`;
          }
        }
        const sql = `ST_Distance_Sphere (point (users.lat, users.lon), point (${parseFloat(lat)}, ${parseFloat(lon)})) * 0.000621371192`;
        const select = await raw(`${sql} as distance`);
        selects.push(select);
        query = query.whereRaw(`${sql} <= ${parseFloat(within)}`);
      } else {
        if (city) {
          query = query.where("users.city_name", city);
        }
        if (state) {
          query = query.where("users.state_name", state);
        }
      }
      return query.select(selects)
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async createSurveysUserInfo(userSurvey: UserSurveysModel): Promise<UserSurveysModel> {
    try {
      const findUser = await UserSurveysModel.query().where("user_id", userSurvey.user_id);
      if (findUser && findUser.length > 0) {
        const result = await UserSurveysModel.query().updateAndFetchById(findUser[0].id, userSurvey);
        return result;
      }
      const result = await UserSurveysModel.query().insert(userSurvey);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }



  public async updateSurveysUserInfo(idSurvey: number, userSurvey: UserSurveysModel): Promise<UserSurveysModel> {
    try {
      const result = await UserSurveysModel.query().updateAndFetchById(idSurvey, userSurvey);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateCompanyUserTableData(): Promise<any> {
    try {
      //update company id in user table
      const listEmployer = await UserModel.query().select("*")
        .where("users.acc_type", 0).where("users.is_deleted", 0);

      const updateList = await Promise.all(
        listEmployer.map(async (employer: UserModel) => {
          employer.company_id = employer.employer_id == 0 ? employer.id : employer.employer_id;
          await UserModel.query().updateAndFetchById(employer.id, employer);
          return employer;
        })
      );
      return listEmployer;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateCompanyTableData(): Promise<any> {
    try {
      // update data table company
      const listEmployer = await UserModel.query().select("*")
        .where("users.acc_type", 0).where("users.is_deleted", 0).andWhere('users.employer_id', '=', 0);
      const updateList = await Promise.all(
        listEmployer.map(async (employer: UserModel) => {
          const companyInfo: any = {
            id: employer.id,
            company_name: employer.company_name,
            lat: employer.lat,
            lon: employer.lon,
            company_profile_picture: employer.company_profile_picture,
            rate: employer.rate,
            refer_link: employer.refer_link,
            employer_company_twitter: employer.employer_company_twitter,
            employer_company_facebook: employer.employer_company_facebook,
            employer_company_url: employer.employer_company_url,
            employer_ceo_picture: employer.employer_ceo_picture,
            employer_ceo_name: employer.employer_ceo_name,
            employer_company_video: employer.employer_company_video,
            employer_company_photo: employer.employer_company_photo,
            employer_year_founded: employer.employer_year_founded,
            employer_revenue_max: employer.employer_revenue_max,
            employer_revenue_min: employer.employer_revenue_min,
            employer_industry: employer.employer_industry,
            note: employer.note,
            state_name: employer.state_name,
            city_name: employer.city_name,
            employer_id: employer.id,
            company_size_max: employer.company_size_max,
            company_size_min: employer.company_size_min,
            description: employer.description,
            address_line: employer.address_line,
            zip_code: employer.zip_code,
          }
          await CompanyModel.query().insert(companyInfo);
          return employer;
        })
      );
      return listEmployer;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }


  public async getSurveysUserInfo(userId: number): Promise<UserSurveysModel> {
    try {
      const userSurvey = await UserSurveysModel.query().where("user_id", userId);
      if (userSurvey && userSurvey.length > 0) return userSurvey[0];
      return null;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

}
