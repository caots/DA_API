import { ACCOUNT_TYPE, PERMISSION_EMPLOYER } from "@src/config";
import ApplicantsController from "@src/controllers/applicants";
import AuthController from "@src/controllers/auth";
import { checkRole, permissionsEmp } from "@src/middleware/roles";
import { Router } from "express";

export default class ApplicantsRouter {
  public router: Router;
  private applicantsController: ApplicantsController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.applicantsController = new ApplicantsController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    // for job employer
    this.router.get("/", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther),
      this.applicantsController.getJobApplicantByEmployer);
    this.router.post("/:id/note", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.Chat), this.applicantsController.noteJobApplicant);
    this.router.put("/:id/bookmark", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.CreateJob), this.applicantsController.bookmarkJobApplicant);
    this.router.put("/:id/ratting",
      this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther), this.applicantsController.ratting);
    this.router.put("/:id/makeCanRateStars", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther),
      this.applicantsController.makeCanRate);
    this.router.put("/:id/requestUnmask", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther),
      this.applicantsController.requestUnmask);
    this.router.put("/:applicantId/makeToViewProfileByEmployer",
      this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      this.applicantsController.makeToViewByEmployer);

    // for job seeker
    this.router.get("/byJobseeker", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.applicantsController.getApplicantDetailByJobseeker);
    this.router.put("/:jobId/makeToViewProfile", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.applicantsController.makeToView);

    this.router.post("/:id/apply", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.applicantsController.applyJob);
    this.router.delete("/:id/drawJob", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.applicantsController.drawJob);
  }
} 