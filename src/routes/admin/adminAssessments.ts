import AssessmentsController from "@src/controllers/admin/assessmentsController";
import AuthController from "@src/controllers/auth";
import { Router } from "express";
export default class JobsRouter {
  public router: Router;
  private assessmentsController: AssessmentsController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.assessmentsController = new AssessmentsController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    this.router.get("/fetchTestsFromImocha", this.assessmentsController.fetchTestsFromImocha);
  }
}
