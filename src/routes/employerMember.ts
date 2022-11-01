import { ACCOUNT_TYPE, PERMISSION_EMPLOYER } from "@src/config";
import AuthController from "@src/controllers/auth";
import EmployerMembersController from "@src/controllers/employerMembers";
import { checkRole, permissionsEmp } from "@src/middleware/roles";
import ImageUtils from "@src/utils/image";
// import uploadMulter from "@src/utils/image";
import { Router } from "express";
export default class EmployerMembersRouter {
  public router: Router;
  private employerMembersController: EmployerMembersController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.employerMembersController = new EmployerMembersController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    /** login with email and password */
    const imageUlti = new ImageUtils();
    this.router.post("", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.NotAllow), this.employerMembersController.invite);
    this.router.put("/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.NotAllow), this.employerMembersController.updateMember);
    this.router.get("", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther), this.employerMembersController.gets);
    this.router.get("/resetPasswordMember/:id", this.authController.authenticateJWT, this.employerMembersController.resetPasswordMember);
    this.router.get("/deleteMember/:id", this.authController.authenticateJWT, this.employerMembersController.deleteMember);
  }
}
export class AccountStatisticRouter {
  public router: Router;
  private employerMembersController: EmployerMembersController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.employerMembersController = new EmployerMembersController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    this.router.get("/total", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther), this.employerMembersController.getFollowerCount);
    this.router.get("/getFollowerHistory", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther), this.employerMembersController.getFollowerHistory);
    this.router.get("/getRecruitmentFunnel", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.AllowOther), this.employerMembersController.getRecruitmentFunnel);
    this.router.post("/logRecruitmentFunnel", this.authController.saveCurrentUser, this.employerMembersController.logRecruitmentFunnel);
  }
}