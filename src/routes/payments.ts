import { ACCOUNT_TYPE, PERMISSION_EMPLOYER } from "@src/config";
import AuthController from "@src/controllers/auth";
import PaymentController from "@src/controllers/payments";
import { checkRole, permissionsEmp } from "@src/middleware/roles";
import { Router } from "express";

export default class PaymentCartsRouter {
  public router: Router;
  private paymentController: PaymentController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.paymentController = new PaymentController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    this.router.get("", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther), this.paymentController.getPaymentCart);
    this.router.delete("/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.ChangeBilling), this.paymentController.removePaymentCart);
  }
}
export class PaymentsRouter {
  public router: Router;
  private paymentController: PaymentController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.paymentController = new PaymentController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    this.router.post("/employer", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.ChangeBilling), this.paymentController.paymentForEmployer);
    this.router.post("/buyMoreEmployer", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.ChangeBilling), this.paymentController.paymentForBuyMorePrivateJob);
    this.router.post("/upgradeJob", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.ChangeBilling), this.paymentController.paymentForUpgradeJob);
  }
}
