import { ACCOUNT_TYPE, PERMISSION_EMPLOYER } from '@src/config';
import AuthController from "@src/controllers/auth";
import UserController from "@src/controllers/user";
import { checkRole, permissionsEmp } from '@src/middleware/roles';
import ImageUtils from "@src/utils/image";
// import uploadMulter from "@src/utils/image";
import { Router } from "express";
export default class UsersRouter {
  public router: Router;
  private userController: UserController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    /** login with email and password */

    const imageUlti = new ImageUtils();
    this.router.post("/login", this.userController.login);
    this.router.post("/checkMail", this.userController.checkEmail);
    this.router.post("/refreshToken", this.authController.authenticateJWT, this.userController.refreshToken);
    this.router.get("/", this.authController.authenticateJWT, this.userController.get);
    this.router.put("/", this.authController.authenticateJWT, imageUlti.upload.single("profile_picture"), this.userController.put);
    this.router.put("/profile", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), permissionsEmp(PERMISSION_EMPLOYER.ChangeCompanyProfile), this.userController.updateProfile);
    this.router.post("/delete-photo", this.authController.authenticateJWT, this.userController.deleteFile)
    // this.router.post("/sendCode", this.userController.sendSmsCode);
    this.router.post("/verifiedCode", this.userController.signup);
    this.router.post("/signup", this.userController.signup);
    this.router.post("/forgotPassword", this.userController.forgotPassword);
    this.router.post("/setPassword", this.userController.setPassword);
    this.router.post("/activeAccount", this.userController.activeAccount);
    this.router.post("/completedSignup", this.authController.authenticateJWT, this.userController.completedSignup);
    this.router.post("/changePassword", this.authController.authenticateJWT, this.userController.changePassword);
    this.router.post("/changeEmail", this.authController.authenticateJWT, this.userController.changeEmail);
    this.router.post("/verifiedEmail", this.userController.verifiedEmail);
    this.router.get("/genReferLink", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.userController.genReferLink);
    this.router.delete("/", this.authController.authenticateJWT, this.userController.deleleAccount);
    this.router.post("/survey", this.authController.authenticateJWT, this.userController.createSurveysUserInfo);
    this.router.get("/survey", this.authController.authenticateJWT, this.userController.getSurveysUserInfo);
    this.router.put("/survey", this.authController.authenticateJWT, this.userController.updateSurveysUserInfo);
  }
}