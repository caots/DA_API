import { AdminGroupChatRouter } from "@src/chatModule/routes";
import { ADMIN_PERMISSION } from '@src/config/index';
import AdminController from "@src/controllers/admin";
import AdminUsersController from '@src/controllers/admin/adminUsersController';
import AdminBlackListController from "@src/controllers/admin/blackListUserController";
import AdminJobsController from "@src/controllers/admin/jobsController";
import AdminUserController from "@src/controllers/admin/usersController";
import AuthController from "@src/controllers/auth";
import { permissionsAdmin } from '@src/middleware/roles';
import ImageUtils from "@src/utils/image";
import { Router } from "express";
import AdminAccountingRouter from "./adminAccounting";
import AdminAssessmentRouter from "./adminAssessments";
import AdminBillingSettingsRouter from "./adminBillingSettings";
import PaymentCouponsRouter from "./adminPaymentCoupons";
import AdminUsersRouter from "./adminUsers";

export default class AdminsRouter {
  public router: Router;
  private adminController: AdminController;
  private adminUserController: AdminUserController;
  private authController: AuthController;
  private adminJobsController: AdminJobsController;
  private adminUsersController: AdminUsersController;

  constructor() {
    this.router = Router();
    this.adminController = new AdminController();
    this.adminUserController = new AdminUserController();
    this.authController = new AuthController();
    this.adminJobsController = new AdminJobsController();
    this.adminUsersController = new AdminUsersController();
    this.config();
  }

  private config() {
    const imageUlti = new ImageUtils(true);
    this.router.post("/login", this.adminController.login);
    this.router.get("/users", this.authController.adminAuthenticateJWT, this.adminUserController.gets);
    this.router.get("/company", this.authController.adminAuthenticateJWT, this.adminUserController.getCompanys);
    this.router.get("/users/delegates", this.authController.adminAuthenticateJWT, this.adminUserController.getAllDelegateUser);
    this.router.put("/users/delegates/re-assign/:id", this.authController.adminAuthenticateJWT, this.adminUserController.reassignDelegateUser);
    this.router.delete("/users", this.authController.adminAuthenticateJWT, this.adminUserController.deletes);
    this.router.put("/users/:id", this.authController.adminAuthenticateJWT, imageUlti.upload.single("profile_picture"), this.adminUserController.put);
    this.router.get("/users/:id", this.authController.adminAuthenticateJWT, this.adminUserController.get);
    this.router.get("/users/:id/active/:status", this.authController.adminAuthenticateJWT, this.adminUserController.updateStatus);
    this.router.post("/users/forgotPassword", this.adminUsersController.forgotPassword);

    this.router.post("/jobs/list", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.gets);
    this.router.get("/jobs/companies", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.getListCompanies);
    this.router.get("/jobs/crawl-template", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.getListJobCrawlerTemplate);
    this.router.post("/jobs/crawl-template", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.updateListJobCrawlerTemplate);
    this.router.get("/jobs/applicants/:jobId", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.getListApplicant);
    this.router.put("/jobs/restore", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.restoreJob);
    this.router.delete("/jobs", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.deleteJob);
    this.router.put("/jobs/deactive", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.deactiveJob);
    this.router.put("/jobs/active", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.activeJob);
    this.router.get("/jobs/:id", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.getJobDetail);
    this.router.put("/jobs/:id", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageJobPosting), this.adminJobsController.updateJob);

    this.router.use("/assessments", new AdminAssessmentRouter().router);
    this.router.use("/chats", new AdminGroupChatRouter().router);
    this.router.use("/billing", new AdminBillingSettingsRouter().router);
    this.router.use("/admin-users", new AdminUsersRouter().router);
    this.router.use("/account", new AdminAccountingRouter().router);
    this.router.use("/coupon", new PaymentCouponsRouter().router);

    // black list
    this.router.get("/blacklist", new AdminBlackListController().getListBlackListUser);
    this.router.get("/blacklist/:id", new AdminBlackListController().getBlackListUserById);
    this.router.post("/blacklist", new AdminBlackListController().add);
    this.router.put("/blacklist/:id", new AdminBlackListController().update);
    this.router.delete("/blacklist/:id", new AdminBlackListController().remove);

    // crawler
    this.router.get("/company/crawler", this.authController.adminAuthenticateJWT, this.adminUserController.getCompanysExcludeCrawler);
    this.router.get("/company/crawler/list", this.authController.adminAuthenticateJWT, this.adminUserController.getCompanysCrawler);
    this.router.get("/company/crawler/page", this.authController.adminAuthenticateJWT, this.adminUserController.getCompanysCrawlerPage);
    this.router.delete("/company/crawler/:id/:typeExclude", this.authController.adminAuthenticateJWT, this.adminJobsController.deleteCompanyCrawler);
    this.router.put("/company/crawler/claimed", this.authController.adminAuthenticateJWT, this.adminJobsController.updateClaimedCompanyCrawl);

    this.router.post("/jobs/crawler", this.authController.adminAuthenticateJWT, imageUlti.upload.single("file"), this.adminJobsController.updateJobCrawler);
    this.router.post("/jobs/get-crawler", this.authController.adminAuthenticateJWT, this.adminJobsController.getListJobCrawler);
    this.router.get("/jobs/update-showtext/:id/:type", this.authController.adminAuthenticateJWT, this.adminJobsController.updateStatusShowTextCrawl);
    this.router.delete("/jobs/crawler", this.authController.adminAuthenticateJWT, this.adminJobsController.deleteJobCrawler);
    this.router.put("/jobs/crawler/active", this.authController.adminAuthenticateJWT, this.adminJobsController.activeJobCrawler);

    this.router.get("/crawler/config", this.authController.adminAuthenticateJWT, this.adminJobsController.getConfigParamsJobCrawler);
    this.router.get("/crawler/config/duplicate/:index", this.authController.adminAuthenticateJWT, this.adminJobsController.newConfigParamsJobCrawler);
    this.router.put("/crawler/config/:id", this.authController.adminAuthenticateJWT, this.adminJobsController.updateConfigParamsJobCrawler);
    this.router.delete("/crawler/config/:configNumber", this.authController.adminAuthenticateJWT, this.adminJobsController.deleteConfigParamsJobCrawler);
    this.router.post("/crawler/config/upload", this.authController.adminAuthenticateJWT, imageUlti.upload.single("file"), this.adminJobsController.updateFileConfigCrawler);

  }
}