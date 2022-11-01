import GroupChatRouter from "@src/chatModule/routes";
import { Router } from "express";
import AdminRouter from "./admin/admin";
import ApplicantRouter from "./applicant";
import AssessmentRouter from "./assessments";
import ContactUsRouter from "./contactUs";
import EmployerMembersRouter, { AccountStatisticRouter } from "./employerMember";
import { FindCandidatesRouter } from "./findCandidate";
import FollowsRouter from "./follows";
import JobsRouter from "./jobs";
import NotificationRouter from "./notification";
import PaymentCartsRouter, { PaymentsRouter } from "./payments";
import ReCaptchasRouter from "./reCaptcha";
import ReportsRouter from "./reports";
import TaskScheduleRouter from "./taskSchedule";
import UploadRouter from "./upload";
import UserRouter from "./user";
import UserPotentialsRouter from "./userPotentials";

class MainRoutes {
  public routers: Router;

  constructor() {
    this.routers = Router();
    false &&
      this.routers.use(function (request, response, next) {
        let data: any = {
        }
        data = {
          ...data,
          t: 'pageview',
          dp: `${request.baseUrl}${request.url}`,
          dh: request.headers.host,
          uip: request.headers['x-forwarded-for'] || request.connection.remoteAddress,
          ua: request.headers['user-agent'],
          dr: request.headers.referrer || request.headers.referer,
          de: request.headers['accept-encoding'],
          ul: request.headers['accept-language']
        };
        console.log(data)

        next();
      })
    this.config();
  }

  private config() {
    this.routers.use("/user", new UserRouter().router);
    this.routers.use("/admin", new AdminRouter().router);
    this.routers.use("/reCaptcha", new ReCaptchasRouter().router);
    this.routers.use("/jobs", new JobsRouter().router);
    this.routers.use("/reports", new ReportsRouter().router);
    this.routers.use("/applicants", new ApplicantRouter().router);
    this.routers.use("/assessments", new AssessmentRouter().router);
    this.routers.use("/uploads", new UploadRouter().router);
    this.routers.use("/chats", new GroupChatRouter().router);
    this.routers.use("/employers", new EmployerMembersRouter().router);
    this.routers.use("/carts", new PaymentCartsRouter().router);
    this.routers.use("/payments", new PaymentsRouter().router);
    this.routers.use("/jobseeker-follows", new FollowsRouter().router);
    this.routers.use("/find-candidate", new FindCandidatesRouter().router);
    this.routers.use("/account-statistics", new AccountStatisticRouter().router);
    this.routers.use("/notifications", new NotificationRouter().router);
    this.routers.use("/contact-us", new ContactUsRouter().router);
    this.routers.use("/task-schedule", new TaskScheduleRouter().router);
    this.routers.use("/user-potentials", new UserPotentialsRouter().router);
  }
}

export default new MainRoutes().routers;
