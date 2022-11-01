import { ACCOUNT_TYPE } from "@src/config";
import AuthController from "@src/controllers/auth";
import ReportsController from "@src/controllers/reports";
import { checkRole } from "@src/middleware/roles";
import { Router } from "express";
export default class ReportsRouter {
  public router: Router;
  private authController: AuthController;
  private reportsController: ReportsController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.reportsController = new ReportsController();
    this.config();
  }

  private config() {
    this.router.post("/company", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.reportsController.reportCompany);
  }
}
