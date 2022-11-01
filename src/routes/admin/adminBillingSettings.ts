import { ADMIN_PERMISSION } from "@src/config";
import BillingSettingsController from "@src/controllers/admin/billingSettingsController";
import AuthController from "@src/controllers/auth";
import { permissionsAdmin } from '@src/middleware/roles';
import { Router } from "express";

export default class AdminBillingSettingsRouter {
  public router: Router;
  private authController: AuthController;
  private billingSettingsController: BillingSettingsController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.billingSettingsController = new BillingSettingsController();
    this.config();
  }

  private config() {
    this.router.post("/job-seeker", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.billingSettingsController.addSystemSettingsForJobSeeker);
    this.router.get("/job-seeker", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.billingSettingsController.getSystemSettingsForJobSeeker);
    this.router.put("/job-seeker", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.billingSettingsController.updateSystemSettingsForJobSeeker);

    this.router.post("/employer", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.billingSettingsController.addSystemSettingsForEmployer);
    this.router.get("/employer", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.billingSettingsController.getSystemSettingsForEmployer);
    this.router.put("/employer", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.billingSettingsController.updateSystemSettingsForEmployer);
    // this.router.get("/resolveAddressAva", this.billingSettingsController.resolveAddressAva);
    // this.router.post("/createTransactionAva", this.billingSettingsController.createTransactionAva);
    // this.router.post("/commitTransactionAva", this.billingSettingsController.commitTransactionAva);
    // this.router.post("/getTax", this.billingSettingsController.getTax);
  }
}
