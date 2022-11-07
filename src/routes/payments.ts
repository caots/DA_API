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
    this.router.post("/jobseeker", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker),
      this.paymentController.paymentForJobseeker);
    this.router.post("/upgradeJob", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.ChangeBilling), this.paymentController.paymentForUpgradeJob);
    this.router.get("/setting", this.authController.saveCurrentUser, this.paymentController.getBillingSetting);
    this.router.get("/history", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker, ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther),
      this.paymentController.getBillingHistory);
    this.router.get("/card", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker, ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther),
      this.paymentController.getCardInfo);
    this.router.put("/card", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker, ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.ChangeBilling),
      this.paymentController.updateCard);
    this.router.put("/transaction_token", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker, ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.ChangeBilling),
      this.paymentController.transaction_token);
    this.router.delete("/card", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker, ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.ChangeBilling),
      this.paymentController.deleteCard);
    this.router.get("/export/:type", this.authController.authenticateJWT,
      this.paymentController.exportBillingHistory)
    this.router.post("/getTax", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker, ACCOUNT_TYPE.Employer),
    permissionsEmp(PERMISSION_EMPLOYER.AllowOther), this.paymentController.getTax);
    this.router.post("/checkCoupon", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker, ACCOUNT_TYPE.Employer),
    permissionsEmp(PERMISSION_EMPLOYER.ChangeBilling), this.paymentController.checkCoupon);
  }
}
