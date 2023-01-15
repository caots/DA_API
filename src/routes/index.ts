import GroupChatRouter from "@src/chatModule/routes";
import { Router } from "express";
import AdminRouter from "./admin/admin";
import ApplicantRouter from "./applicant";
import AssessmentRouter from "./assessments";
import ContactUsRouter from "./contactUs";
import { FindCandidatesRouter } from "./findCandidate";
import FollowsRouter from "./follows";
import JobsRouter from "./jobs";
import PaymentCartsRouter, { PaymentsRouter } from "./payments";
import ReportsRouter from "./reports";
import UploadRouter from "./upload";
import UserRouter from "./user";

class MainRoutes {
  public routers: Router;

  constructor() {
    this.routers = Router();
    this.config();
  }

  private config() {
    this.routers.use("/user", new UserRouter().router);
    this.routers.use("/admin", new AdminRouter().router);
    this.routers.use("/jobs", new JobsRouter().router);
    this.routers.use("/reports", new ReportsRouter().router);
    this.routers.use("/applicants", new ApplicantRouter().router);
    this.routers.use("/assessments", new AssessmentRouter().router);
    this.routers.use("/uploads", new UploadRouter().router);
    this.routers.use("/chats", new GroupChatRouter().router);
    this.routers.use("/carts", new PaymentCartsRouter().router);
    this.routers.use("/payments", new PaymentsRouter().router);
    this.routers.use("/jobseeker-follows", new FollowsRouter().router);
    this.routers.use("/find-candidate", new FindCandidatesRouter().router);
    this.routers.use("/contact-us", new ContactUsRouter().router);
  }
}

export default new MainRoutes().routers;
