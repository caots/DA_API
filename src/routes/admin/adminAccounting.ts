import { ADMIN_PERMISSION } from "@src/config/index";
import AdminAccountingController from "@src/controllers/admin/accountingController";
import AuthController from "@src/controllers/auth";
import { permissionsAdmin } from "@src/middleware/roles";
import { Router } from "express";

export default class AdminAccountingRouter {
  public router: Router;
  private authController: AuthController;
  private adminAccountingController: AdminAccountingController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.adminAccountingController = new AdminAccountingController();
    this.config();
  }

  private config() {
    this.router.get("/", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageAccounting), this.adminAccountingController.getListAccount);
    this.router.get("/:userId", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageAccounting), this.adminAccountingController.getPaymentById);
    this.router.get("/:userId/export", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.ManageAccounting), this.adminAccountingController.exportBillingHistory);
  }
}
