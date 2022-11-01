import { EMIT_EVENT, ZOOM_NAME } from "@src/chatModule/lib/config";
import { ASSESSMENT_STATUS, PAGE_SIZE, PAYMENT_TYPE } from "@src/config";
import { COMMON_ERROR, COMMON_SUCCESS, JOB_MESSAGE, PAYMENT_COUPON_MESSAGE } from "@src/config/message";
import { badRequest, ok } from "@src/middleware/response";
import FindCandidateLogsModel, { PotentialCandidatesModel } from "@src/models/find_candidate_logs";
import { UserBillingInfoModel } from "@src/models/payments";
import UserModel from "@src/models/user";
import AssessmentsService from "@src/services/assessmentsService";
import FindCandidateService from "@src/services/findCandidateService";
import JobsService from "@src/services/jobsService";
import PaymentsService from "@src/services/paymentService";
import UserBll from "@src/services/user";
import MsValidate from "@src/utils/validate";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import { Server } from "socket.io";
export default class FindCandidatesController {
  public async gets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const findCandidateService = new FindCandidateService();
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Standand));
      const maxCompensation = req.param("maxCompensation");
      const city = req.param("city");
      const state = req.param("state");
      const orderNo = parseInt(req.param("orderNo", 0));
      const zipcode = req.param("zipcode");
      const lat = req.param("lat");
      const lon = req.param("lon");
      const within = req.param("within");
      const onlyBookmark = parseInt(req.param("onlyBookmark", 0));
      const jobseekerId = parseInt(req.param("jobseekerId", 0));
      // const assessments = req.body.assessments as JobAssessmentsModel[];
      // const assessmentParams = await msValidate.validateCreateJobAssessments(assessments) || [];
      let assessments = [];
      try {
        if (req.param("assessments")) {
          const q = decodeURIComponent(req.param("assessments")).replace(new RegExp("\\\\", 'g'), "");
          // const q = decodeURIComponent(req.param("assessments")).replace("/\\\\/g", "");
          assessments = JSON.parse(q);
        }
      } catch (e) {
        console.log(e);
      }
      if (!assessments.length && !jobseekerId && !onlyBookmark) {
        return ok({ results: [], total: 0 }, req, res);
      }
      // add to log
      // const log = await 
      if (!jobseekerId) {
        const updateLog = new FindCandidateLogsModel();
        updateLog.assessments = req.param("assessments");
        updateLog.max_compensation = maxCompensation;
        updateLog.city = city;
        updateLog.state = state;
        updateLog.order_no = `${orderNo}`;
        updateLog.zipcode = zipcode;
        updateLog.lat = lat;
        updateLog.lon = lon;
        updateLog.distances = within;
        updateLog.employer_id = user.id;
        await findCandidateService.addFindCandidateLogs(updateLog);
      }
      // get list candidate
      const results = await findCandidateService.findCandidate(user.id, assessments, maxCompensation, lat, lon,
        within, city, state, zipcode, orderNo, page, pageSize, jobseekerId, onlyBookmark)
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getJobToInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Jobs));
      const jobseekerId = parseInt(req.param("jobseekerId", 0));
      const q = req.param("q");
      const jobService = new JobsService();
      const jobsPagesModel = await jobService.getInviteJobs(
        user.id,
        jobseekerId,
        q,
        0,
        page, pageSize
      );
      return ok(jobsPagesModel, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async invited(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const findCandidateService = new FindCandidateService();
      const jobseekerId = get(req, 'body.jobseekerId', 0);
      const jobIds = req.body.jobIds;
      if (!jobIds || jobIds.length == 0) {
        return badRequest({ message: "JobIds length = 0." }, req, res);
      }
      // return ok({ message: COMMON_SUCCESS.applyJob }, req, res);
      const chatOwnerId = user.employer_id ? user.onwer_id : user.id;
      const results = await findCandidateService.makeInvitedJobs(user.id, jobseekerId, jobIds);
      results.forEach((groupId: number) => {
        if (!groupId) { return; }
        const io = global["io"] as Server;
        const zoomJobseeker = `${ZOOM_NAME.InviteJoinZoom}${jobseekerId}`;
        const zoomJobEmployer = `${ZOOM_NAME.InviteJoinZoom}${user.id}`;
        const event = EMIT_EVENT.OnReceiveInviteJoinZoom;
        console.log("zoom: ", zoomJobseeker);
        console.log("zoom: ", zoomJobEmployer);
        console.log("event: ", event);
        const dataEmit = { group_id: groupId };
        io.to(zoomJobseeker).emit(event, dataEmit);
        io.to(zoomJobEmployer).emit(event, dataEmit);
        if (chatOwnerId != user.id) {
          const zoomOwner = `${ZOOM_NAME.InviteJoinZoom}${chatOwnerId}`;
          io.to(zoomOwner).emit(event, dataEmit);
        }
      });

      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async bookmarkJobApplicant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const jobseekerId = get(req, "params.id", 0);
      const bookmark = get(req, "body.bookmark", 0);
      const findCandidateService = new FindCandidateService();
      await findCandidateService.bookmarkCandidate(user.id, jobseekerId, bookmark);
      return ok({ message: `${bookmark ? "bookmarked" : "un bookmarked"} candidate success.` }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async paymentCredit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const jobseekerId = get(req, "params.id", 0);
      const bookmark = get(req, "body.bookmark", 0);
      const findCandidateService = new FindCandidateService();
      await findCandidateService.bookmarkCandidate(user.id, jobseekerId, bookmark);
      return ok({ message: `${bookmark ? "bookmarked" : "un bookmarked"} candidate success.` }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getAssessments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const assessmentsService = new AssessmentsService();
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Standand));
      const jobseekerId = parseInt(req.param("jobseekerId", 0));
      const notInAssessmentIds = req.param("notInAssessmentIds", "").split(",");
      const q = req.param("q") ? decodeURIComponent(req.param("q")) : "";
      const status = ASSESSMENT_STATUS.Active;
      const results = await assessmentsService.getAssessMents(0, jobseekerId, status, 1, q, page, pageSize, user.id, 0, notInAssessmentIds, 1);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async paymentCandidateForEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const paymentsService = new PaymentsService();
      const carts = req.body.carts as any[];
      const sslToken = get(req, "body.ssl_token", "");
      const isSaveCard = get(req, "body.isSaveCard", 1);
      const paymentType = get(req, "body.paymentType", null);
      const numCredit = get(req, "body.numCredit", 0);
      const jobseekerInfo = get(req, "body.jobseekerInfo", null);
      if ((paymentType == PAYMENT_TYPE.Topup && !numCredit)
        || (paymentType == PAYMENT_TYPE.DirectMesssage && (!numCredit || !jobseekerInfo.id))) { return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res); }
      let potential;
      const findCandidateService = new FindCandidateService();
      if (paymentType == PAYMENT_TYPE.DirectMesssage) {
        potential = await findCandidateService.getPotentialCandidate(user.id, jobseekerInfo.id);
        if (potential && potential.chat_group_id) {
          return badRequest({ message: "Had direct message before." }, req, res);
        }
      }
      if (sslToken) {
        user.converge_ssl_token = sslToken;
      }

      const coupon = get(req, "body.coupon", "");
      const msValidate = new MsValidate();
      const notPayment = get(req, "body.notPayment", 0);
      let billingInfo;
      if (!notPayment) {
        const billingAddressBody = {
          address_line_1: req.body.address_line_1,
          address_line_2: req.body.address_line_2,
          city_name: req.body.city_name,
          state_name: req.body.state_name,
          zip_code: req.body.zip_code,
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          company_name: req.body.company_name
        };
        billingInfo = await msValidate.validateCreateBilling(billingAddressBody) as UserBillingInfoModel;
      }

      const results = await paymentsService.paymentEmployer(user, [], isSaveCard,
        paymentType, numCredit, jobseekerInfo, coupon, billingInfo
      );
      const chatOwnerId = user.employer_id ? user.onwer_id : user.id;
      if (paymentType == PAYMENT_TYPE.DirectMesssage) {
        if (!potential) {
          potential = await findCandidateService.addPotentialCandidate(user.id, jobseekerInfo.id, true, chatOwnerId);
        } else {
          potential = await findCandidateService.createChatGroupPotentialCandidate(potential.id, user.id, jobseekerInfo.id, chatOwnerId);
        }
        if (potential.chat_group_id) {
          const io = global["io"] as Server;
          const zoomJobseeker = `${ZOOM_NAME.InviteJoinZoom}${jobseekerInfo.id}`;
          const zoomJobEmployer = `${ZOOM_NAME.InviteJoinZoom}${user.id}`;
          const event = EMIT_EVENT.OnReceiveInviteJoinZoom;
          console.log("zoom: ", zoomJobseeker);
          console.log("zoom: ", zoomJobEmployer);
          console.log("event: ", event);
          const dataEmit = { group_id: potential.chat_group_id };
          io.to(zoomJobseeker).emit(event, dataEmit);
          io.to(zoomJobEmployer).emit(event, dataEmit);
          if (chatOwnerId != user.id) {
            const zoomOwner = `${ZOOM_NAME.InviteJoinZoom}${chatOwnerId}`;
            io.to(zoomOwner).emit(event, dataEmit);
          }
        }
        return ok({ groupId: potential.chat_group_id }, req, res);
      }
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async createGroupChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let user = req["currentUser"] as UserModel;
      const userService = new UserBll();
      const jobseekerId = get(req, "body.jobseekerId", 0);
      if (!jobseekerId) { return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res); }
      let potential;
      const findCandidateService = new FindCandidateService();
      user = await userService.getById(user.id);
      const nbrFrees = user.nbr_free_credits ? user.nbr_free_credits : 0;
      const nbrCredits = user.nbr_credits ? user.nbr_credits : 0;
      const currentCredits = nbrFrees + nbrCredits;
      if (currentCredits < 1) {
        return badRequest({ message: PAYMENT_COUPON_MESSAGE.CreditOptOut }, req, res);
      }
      potential = await findCandidateService.getPotentialCandidate(user.id, jobseekerId);
      if (potential && potential.chat_group_id) {
        return badRequest({ message: "Had direct message before." }, req, res);
      }
      const chatOwnerId = user.employer_id ? user.onwer_id : user.id;
      if (!potential) {
        potential = await findCandidateService.addPotentialCandidate(user.id, jobseekerId, true, chatOwnerId);
      } else {
        potential = await findCandidateService.createChatGroupPotentialCandidate(potential.id, user.id, jobseekerId, chatOwnerId);
      }
      if (potential.chat_group_id) {
        const io = global["io"] as Server;
        const zoomJobseeker = `${ZOOM_NAME.InviteJoinZoom}${jobseekerId}`;
        const zoomJobEmployer = `${ZOOM_NAME.InviteJoinZoom}${user.id}`;
        const event = EMIT_EVENT.OnReceiveInviteJoinZoom;
        console.log("zoom: ", zoomJobseeker);
        console.log("zoom: ", zoomJobEmployer);
        console.log("event: ", event);
        const dataEmit = { group_id: potential.chat_group_id };
        io.to(zoomJobseeker).emit(event, dataEmit);
        io.to(zoomJobEmployer).emit(event, dataEmit);
        if (chatOwnerId != user.id) {
          const zoomOwner = `${ZOOM_NAME.InviteJoinZoom}${chatOwnerId}`;
          io.to(zoomOwner).emit(event, dataEmit);
        }
      }
      const userObj = nbrFrees >= 1 ? { nbr_free_credits: nbrFrees - 1 } : { nbr_credits: nbrCredits - 1 };
      user = await userService.update(user.id, userObj as UserModel);
      return ok({ companyUpdate: { nbr_credits: user.nbr_credits, nbr_free_credits: user.nbr_free_credits }, groupId: potential.chat_group_id }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async requestUnmask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as any;
      const id = parseInt(get(req, "params.id", 0));
      const findCandidateService = new FindCandidateService();
      const potential = await findCandidateService.getPotentialCandidate(user.id, id);
      if (!potential) {
        return badRequest({ message: JOB_MESSAGE.applicantNotExists }, req, res);
      }
      if (potential.can_view_profile === null) {
        await findCandidateService.updatePotentialCandidate(potential.id, { can_view_profile: -1 } as PotentialCandidatesModel);
      }
      return ok({ message: `Success.` }, req, res);
    } catch (err) {
      next(err);
    }
  }
}
