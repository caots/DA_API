import { ACCOUNT_TYPE, PERMISSION_EMPLOYER } from '@src/config';
import AuthController from "@src/controllers/auth";
import FindCandidatesController from '@src/controllers/findCandidates';
import { verifiedRC } from "@src/middleware";
import { checkRole, permissionsEmp } from '@src/middleware/roles';
import { Router } from "express";
export class FindCandidatesRouter {
  public router: Router;
  private findCandidatesController: FindCandidatesController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.findCandidatesController = new FindCandidatesController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    this.router.get("", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.FindCandidate), this.findCandidatesController.gets);
    this.router.get("/getJobToInvite", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.FindCandidate), this.findCandidatesController.getJobToInvite);
    this.router.post("/invited", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.FindCandidate), this.findCandidatesController.invited);
    this.router.get("/getAssessments", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.FindCandidate), this.findCandidatesController.getAssessments);
    this.router.post("/bookmark/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.FindCandidate), this.findCandidatesController.bookmarkJobApplicant);
    this.router.post("/payment", verifiedRC, this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.FindCandidate), this.findCandidatesController.paymentCandidateForEmployer);
    this.router.post("/createGroupChat", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.FindCandidate), this.findCandidatesController.createGroupChat);
    this.router.post("/requestUnmask/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.FindCandidate), this.findCandidatesController.requestUnmask);

    this.router.post("/requestUnmask/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.FindCandidate), this.findCandidatesController.requestUnmask);

  }
}