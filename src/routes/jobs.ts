import { ACCOUNT_TYPE, PERMISSION_EMPLOYER } from "@src/config";
import AuthController from "@src/controllers/auth";
import JobsController from "@src/controllers/jobs";
import { checkRole, permissionsEmp } from "@src/middleware/roles";
import { Router } from "express";
export default class JobsRouter {
  public router: Router;
  private jobsController: JobsController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.jobsController = new JobsController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    this.router.get("/cities/:searchType", this.authController.saveCurrentUser,
      checkRole(ACCOUNT_TYPE.JobSeeker, ACCOUNT_TYPE.Guest, ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther),
      this.jobsController.cities);
    this.router.get("/categories", this.authController.saveCurrentUser, this.jobsController.getJobCategories);
    this.router.get("/companies", this.jobsController.getCompanies);
    this.router.get("/industries/all", this.jobsController.getIndustries);
    this.router.get("/updateLatLon", this.jobsController.updateLatLon);
    this.router.get("/levels", this.jobsController.getJobLevels);
    this.router.get("/requiredAssessments/:id", this.authController.saveCurrentUser, this.jobsController.getRequireAssessment);
    // job employer
    this.router.post("/", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.CreateJob), this.jobsController.createJob);
    this.router.get("/employer/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), this.jobsController.getJobDetailByEmployer);
    
    this.router.get("/draft", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.CreateJob), this.jobsController.getAllJobDraftByEmployer);
    this.router.put("/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.CreateJob), this.jobsController.updateJob);
    this.router.put("/:id/hotOrPrivateJob", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.ChangeBilling), this.jobsController.updateHotJobOrPrivate);
    this.router.delete("/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.CreateJob), this.jobsController.deleteJob);
    this.router.put("/:id/duplicate", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.CreateJob), this.jobsController.duplicateJob);
    this.router.get("", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther), this.jobsController.getJobsByEmployer);
    this.router.get("/getJobsCompact", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther), this.jobsController.getJobsCompactByEmployer);
    // job seeker
    this.router.get("/list", this.authController.saveCurrentUser, checkRole(ACCOUNT_TYPE.JobSeeker, ACCOUNT_TYPE.Guest, ACCOUNT_TYPE.Employer), this.jobsController.getJobsByJobSeeker);
    this.router.get("/bookmarks", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.jobsController.bookmarkIds);
    this.router.get("/:id/bookmarks/:type", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.jobsController.bookmarks);
    this.router.get("/:id", this.authController.saveCurrentUser, checkRole(ACCOUNT_TYPE.JobSeeker, ACCOUNT_TYPE.Employer, ACCOUNT_TYPE.Guest), this.jobsController.getJobDetail);
    this.router.get("/:id/company", this.jobsController.getCompanyDetail);
    this.router.post("/report", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.jobsController.report);
  }
}
