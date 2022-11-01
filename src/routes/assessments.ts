import AssessmentsController from "@src/controllers/assessments";
import AuthController from "@src/controllers/auth";
import { Router } from "express";
import { ACCOUNT_TYPE, PERMISSION_EMPLOYER } from "./../config/index";
import { checkRole, permissionsEmp } from "./../middleware/roles";
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
    this.router.get("/list", this.authController.saveCurrentUser, permissionsEmp(PERMISSION_EMPLOYER.AllowOther), this.assessmentsController.getAssessments);
    this.router.get("/list-my-assessment", this.authController.saveCurrentUser, this.assessmentsController.getListMyAssessments);
    this.router.post("/callback", this.assessmentsController.callback);
    this.router.get("/history/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.assessmentsController.historyAssessment);
    this.router.post("/:id/:type/inviteTest", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.assessmentsController.inviteTest);
    this.router.post("/:id/:type/:action", this.authController.authenticateJWT, this.assessmentsController.add);
    // custom assessment
    this.router.post("/customs",
      this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), permissionsEmp(PERMISSION_EMPLOYER.CreateJob),
      this.assessmentsController.createCustom);
    this.router.put("/customs/:id",
      this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), permissionsEmp(PERMISSION_EMPLOYER.CreateJob),
      this.assessmentsController.updateCustom);
    this.router.get("/customs",
      this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), permissionsEmp(PERMISSION_EMPLOYER.AllowOther),
      this.assessmentsController.getCustoms);
    this.router.get("/:id/:type",
      this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), permissionsEmp(PERMISSION_EMPLOYER.AllowOther),
      this.assessmentsController.getAssessmentDetail);
    this.router.delete("/customs/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), permissionsEmp(PERMISSION_EMPLOYER.CreateJob),
      this.assessmentsController.deleteCustom);
    this.router.get("/:id/:type/preview", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), this.assessmentsController.getTestPreview);

    this.router.put("/:id/:type/customs", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.assessmentsController.submitCustom);
    this.router.get("/myAssessment", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.assessmentsController.myAssessments);

    this.router.get("/getReport/:jsaId", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.assessmentsController.getReport);

    this.router.get("/user-story", this.assessmentsController.getAssessmentsUserStory);
  }
}
