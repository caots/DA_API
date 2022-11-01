import { ACCOUNT_TYPE } from "@src/config";
import { COMMON_ERROR, COMMON_SUCCESS, USER_MESSAGE } from "@src/config/message";
import { badRequest, ok } from "@src/middleware/response";
import JobSeekerFollowEmployersModel from "@src/models/job_seeker_follow_employers";
import UserModel from "@src/models/user";
import { JobseekerFollowEmployersService } from "@src/services/followsService";
import UserBll from "@src/services/user";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";

export default class jobseekerFollowEmployersController {
  public async follows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobseekerFollowEmployersService = new JobseekerFollowEmployersService();
      const userService = new UserBll();
      const employerId = get(req, "params.id", 0);
      const action = get(req, "params.action", 'follow');
      const employer = await userService.getById(employerId);
      if (!employer || employer.acc_type != ACCOUNT_TYPE.Employer || employer.employer_id) {
        return badRequest({ message: USER_MESSAGE.employerNotExist }, req, res);
      }
      const addObj = {
        job_seeker_id: user.id,
        employer_id: employerId
      } as JobSeekerFollowEmployersModel;
      const follow = await jobseekerFollowEmployersService.findByObject(addObj);
      if (!follow && action == "follow") {
        const result = await jobseekerFollowEmployersService.add(addObj);
        return ok({ message: COMMON_SUCCESS.default }, req, res);
      }

      if (follow && action != "follow") {
        const result = await jobseekerFollowEmployersService.delete(follow.id);
        return ok({ message: COMMON_SUCCESS.default }, req, res);
      }
      return badRequest({ message: COMMON_ERROR.internalServerError }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async unFollows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobseekerFollowEmployersService = new JobseekerFollowEmployersService();
      const userService = new UserBll();
      const idsString = get(req, "body.ids", '');
      let ids = [];
      try {
        ids = idsString.split(",");
      } catch (e) {

      }
      const follow = await jobseekerFollowEmployersService.deleteByIds(ids);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async gets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobseekerFollowEmployersService = new JobseekerFollowEmployersService();
      const q = get(req, "query.q");
      const orderNo = parseInt(get(req, "query.orderNo", 0));
      const page = get(req, "query.page", 0);
      const pageSize = get(req, "query.pageSize");
      const results = await jobseekerFollowEmployersService.getFollowByJobseeker(
        user.id,
        q,
        orderNo,
        page,
        pageSize
      );
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getListIds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const jobseekerFollowEmployersService = new JobseekerFollowEmployersService();
      const results = await jobseekerFollowEmployersService.getIds(
        user.id,
      );
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
}