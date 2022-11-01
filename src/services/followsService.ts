import { PAGE_SIZE, TRACKING_RECRUITMENT_FOLLOWER_SEARCH, TRACKING_RECRUITMENT_TYPE } from "@src/config";
import HttpException from "@src/middleware/exceptions/httpException";
import { EmployerRecruitmentFunnelsModel } from "@src/models/find_candidate_logs";
import JobApplicantsModel from "@src/models/job_applicants";
import JobSeekerFollowEmployersModel from "@src/models/job_seeker_follow_employers";
import UserModel from "@src/models/user";
import { cloneDeep } from "lodash";
import moment from "moment";

export class JobseekerFollowEmployersService {
  public async getFollowByJobseeker(
    jobseekerId: number,
    employerName = '', orderNo = 0, page = 0, pageSize = PAGE_SIZE.Jobs,
  ): Promise<any> {
    try {
      const orderArray = this.getOrder(orderNo);
      let query = JobSeekerFollowEmployersModel.query()
        .select([
          "job_seeker_follow_employers.*",
          "CP.company_profile_picture as company_image",
          "CP.company_name"
        ])
        .join("users as C", "job_seeker_follow_employers.employer_id", "C.id")
        .leftJoin("company as CP", "C.company_id", "CP.id")
        .where("C.is_deleted", 0)
        .where("C.employer_id", 0)
        .where("job_seeker_follow_employers.job_seeker_id", jobseekerId);
      if (employerName) {
        query = query.where("CP.company_name", "like", `%${employerName}%`)
      }
      const result = await query
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getIds(
    jobseekerId: number
  ): Promise<any> {
    try {
      let query = JobSeekerFollowEmployersModel.query()
        .select("job_seeker_follow_employers.employer_id")
        .where("job_seeker_id", jobseekerId);
      const result = await query;

      return result.map(follow => follow.employer_id);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async add(objectUpdate: JobSeekerFollowEmployersModel): Promise<JobSeekerFollowEmployersModel> {
    try {
      const result = await JobSeekerFollowEmployersModel.query().insert(objectUpdate);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async delete(id: number): Promise<any> {
    try {
      const result = await JobSeekerFollowEmployersModel.query().deleteById(id);
      // await jobApplicantModel.query().delete().where("job_id", jobObject.job_id)
      // .where("job_sekker_id", jobObject.job_sekker_id);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async deleteByIds(ids: any[]): Promise<any> {
    try {
      const result = await JobSeekerFollowEmployersModel.query().delete().whereIn("id", ids);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findById(id: number): Promise<JobSeekerFollowEmployersModel> {
    try {
      const result = await JobSeekerFollowEmployersModel.query().findById(id);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findByObject(obj: JobSeekerFollowEmployersModel): Promise<JobSeekerFollowEmployersModel> {
    try {
      const result = await JobSeekerFollowEmployersModel.query().findOne(obj);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  private getOrder(orderBy: number) {
    let orders;
    switch (orderBy) {
      case 0:
        // latest
        orders = ["job_seeker_follow_employers.created_at", "desc"];
        break;
      case 1:
        // oldest
        orders = ["job_seeker_follow_employers.created_at", "asc"];
        break;
      case 2:
        // a-z
        orders = ["C.company_name", "asc"];
        break;
      case 3:
        // z-a
        orders = ["C.company_name", "desc"];
        break;
      default:
        orders = ["job_seeker_follow_employers.created_at", "desc"];
        break;
    }
    return orders;
  }

  /* get account statistics */
  public async getTotalFollower(
    employerId: number
  ): Promise<any> {
    try {
      let queryFollower = await JobSeekerFollowEmployersModel.query()
        .where("employer_id", employerId).count()
      const totalFollower = queryFollower[0]["count(*)"];
      let queryEmployerViews = await EmployerRecruitmentFunnelsModel.query()
      .where("employer_id", employerId).where("type", 7).count();
      const totalEmployerViews = queryEmployerViews[0]["count(*)"];
      return {
        totalFollower,
        totalEmployerViews
      };
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getFollowerHistory(companyInfo: UserModel,
    fromDate: string, searchValue = TRACKING_RECRUITMENT_FOLLOWER_SEARCH[0].value
  ): Promise<any> {
    try {
      const dates = [];
      // const current = moment().utc().format("YYYY-MM-DDTHH:mm:ss") + `.000Z`;
      switch (searchValue) {
        case TRACKING_RECRUITMENT_FOLLOWER_SEARCH[0].value:
          // Last week
          dates[0] = fromDate;
          dates[1] = this.addDate(fromDate, 1, 'days');
          dates[2] = this.addDate(fromDate, 2, 'days');
          dates[3] = this.addDate(fromDate, 3, 'days');
          dates[4] = this.addDate(fromDate, 4, 'days');
          dates[5] = this.addDate(fromDate, 5, 'days');
          dates[6] = this.addDate(fromDate, 6, 'days');
          dates.push(this.addDate(fromDate, searchValue * -1, 'days'));
          break;
        case TRACKING_RECRUITMENT_FOLLOWER_SEARCH[1].value:
          // Last 30
          dates[0] = fromDate;
          dates[1] = this.addDate(fromDate, 7, 'days');
          dates[2] = this.addDate(fromDate, 14, 'days');
          dates[3] = this.addDate(fromDate, 21, 'days');
          dates.push(this.addDate(fromDate, searchValue * -1, 'days'));
          break;
        case TRACKING_RECRUITMENT_FOLLOWER_SEARCH[2].value:
          // Last 3 months
          dates[0] = fromDate;
          dates[1] = this.addDate(fromDate, 1, 'months');
          dates[2] = this.addDate(fromDate, 2, 'months');
          dates.push(this.addDate(fromDate, searchValue * -1, 'days'));
          break;
        case TRACKING_RECRUITMENT_FOLLOWER_SEARCH[3].value:
          // Last year
          dates[0] = fromDate;
          dates[1] = this.addDate(fromDate, 1, 'months');
          dates[2] = this.addDate(fromDate, 2, 'months');
          dates[3] = this.addDate(fromDate, 3, 'months');
          dates[4] = this.addDate(fromDate, 4, 'months');
          dates[5] = this.addDate(fromDate, 5, 'months');
          dates[6] = this.addDate(fromDate, 6, 'months');
          dates[7] = this.addDate(fromDate, 7, 'months');
          dates[8] = this.addDate(fromDate, 8, 'months');
          dates[9] = this.addDate(fromDate, 9, 'months');
          dates[10] = this.addDate(fromDate, 10, 'months');
          dates[11] = this.addDate(fromDate, 11, 'months');
          dates.push(this.addDate(fromDate, searchValue * -1, 'days'));
          break;
        case TRACKING_RECRUITMENT_FOLLOWER_SEARCH[4].value:
          // All time
          dates[0] = this.addDate(companyInfo.created_at, 0, 'days');
          const diffDay = moment.utc().diff(companyInfo.created_at, 'years');   // =1
          for (let index = 0; index < diffDay; index++) {
            dates.push(this.addDate(companyInfo.created_at, index + 1, 'years'));
          }
          dates.push(this.addDate(fromDate, 0, 'days'));
          break;
        default:
          break;
      }

      let queryFollower = JobSeekerFollowEmployersModel.query()
        .where("employer_id", companyInfo.id).count();
      const dataFollower = await Promise.all(
        dates.map(async (fromDate) => {
          let queryDetail = cloneDeep(queryFollower);
          if (fromDate) {
            queryDetail = queryDetail.where("created_at", "<=", fromDate);
          }
          const result = await queryDetail;
          return result[0]["count(*)"];
        })
      );
      let queryEmployerViews = EmployerRecruitmentFunnelsModel.query()
        .where("employer_id", companyInfo.id).where("type", 7).count();
      const dataEmployerViews = await Promise.all(
        dates.map(async (fromDate) => {
          let queryDetail = cloneDeep(queryEmployerViews);
          if (fromDate) {
            queryDetail = queryDetail.where("created_at", "<=", fromDate);
          }
          const result = await queryDetail;
          return result[0]["count(*)"];
        })
      );
      return {
        dates,
        dataFollower,
        dataEmployerViews,
      };
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getRecruitmentFunnel(companyInfo: UserModel,
    fromDate: string, jobId: number
  ): Promise<any> {
    try {
      const dates = [];
      let query = EmployerRecruitmentFunnelsModel.query()
        .where("employer_id", companyInfo.id).count();
      if (fromDate) {
        query = query.where("created_at", ">=", fromDate);
      }
      if (jobId) {
        query = query.where("job_id", jobId);
      }
      const data = await Promise.all(
        TRACKING_RECRUITMENT_TYPE.filter(x=>x.id != 7).map(async (recruitmentTypeObj) => {
          //  applicant
          if (recruitmentTypeObj.id == 2) {
            let queryDetail = JobApplicantsModel.query().where("employer_id", companyInfo.id).count();
            if (fromDate) {
              queryDetail = queryDetail.where("created_at", ">=", fromDate);
            }
            if (jobId) {
              queryDetail = queryDetail.where("job_id", jobId);
            }
            const result = await queryDetail;
            return {
              id: recruitmentTypeObj.id,
              total: result[0]["count(*)"]
            };
          }
          let queryDetail = cloneDeep(query);
          queryDetail = queryDetail.where("type", recruitmentTypeObj.id);
          const result = await queryDetail;
          return {
            id: recruitmentTypeObj.id,
            total: result[0]["count(*)"]
          };
        })
      );
      return data;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async logRecruitmentFunnel(object: EmployerRecruitmentFunnelsModel): Promise<any> {
    try {
      let query = EmployerRecruitmentFunnelsModel.query().insert(object);
      return query;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  addDate(date: string, amount: any, unit: string) {
    return moment.utc(date).add(amount, unit).format("YYYY-MM-DD HH:mm:ss");
  }
}