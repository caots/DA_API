import { AdminGroupChatRouter } from "@src/chatModule/routes";
import { ADMIN_PERMISSION } from '@src/config/index';
import AdminController from "@src/controllers/admin";
import AdminUsersController from '@src/controllers/admin/adminUsersController';
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

  }
}