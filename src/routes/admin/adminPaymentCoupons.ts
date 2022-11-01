import { ADMIN_PERMISSION } from "@src/config";
import PaymentCouponsController from "@src/controllers/admin/paymentCouponsController";
import AuthController from "@src/controllers/auth";
import { permissionsAdmin } from '@src/middleware/roles';
import { Router } from "express";

export default class PaymentCouponsRouter {
  public router: Router;
  private authController: AuthController;
  private paymentCouponsController: PaymentCouponsController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.paymentCouponsController = new PaymentCouponsController();
    this.config();
  }

  private config() {
    this.router.get("", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.paymentCouponsController.gets);
    this.router.put("/:id", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.paymentCouponsController.update);
    this.router.get("/:id", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.paymentCouponsController.getDetail);
    this.router.post("", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.paymentCouponsController.add);
    this.router.delete("/:id", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.SettingPricing), this.paymentCouponsController.delete);
  }
}
