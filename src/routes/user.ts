import { ACCOUNT_TYPE, PERMISSION_EMPLOYER } from '@src/config';
import AuthController from "@src/controllers/auth";
import UserController from "@src/controllers/user";
import { verifiedRC } from "@src/middleware";
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
    this.router.post("/login", verifiedRC, this.userController.login);
    this.router.post("/checkMail", verifiedRC, this.userController.checkEmail);
    this.router.post("/signupToReceiveUpdate", verifiedRC, this.userController.signupToReceiveUpdate);
    this.router.post("/unsubcribeReceiveUpdate", this.userController.unsubcribeReceiveUpdate);
    this.router.post("/refreshToken", this.authController.authenticateJWT, this.userController.refreshToken);
    this.router.get("/", this.authController.authenticateJWT, this.userController.get);
    this.router.put("/", this.authController.authenticateJWT, imageUlti.upload.single("profile_picture"), this.userController.put);
    this.router.put("/profile", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), permissionsEmp(PERMISSION_EMPLOYER.ChangeCompanyProfile), this.userController.updateProfile);
    this.router.post("/delete-photo", this.authController.authenticateJWT, this.userController.deleteFile)
    // this.router.post("/sendCode", verifiedRC, this.userController.sendSmsCode);
    this.router.post("/verifiedCode", verifiedRC, this.userController.signup);
    this.router.post("/signup", verifiedRC, this.userController.signup);
    this.router.post("/forgotPassword", this.userController.forgotPassword);
    this.router.post("/setPassword", this.userController.setPassword);
    this.router.post("/activeAccount", this.userController.activeAccount);
    this.router.post("/completeDelegateAccount", imageUlti.upload.single("profile_picture"), this.userController.completeDelegateAccount);
    this.router.post("/getDelegateInfo", this.userController.getDelegateInfo);
    this.router.post("/completedSignup", this.authController.authenticateJWT, this.userController.completedSignup);
    this.router.post("/changePassword", this.authController.authenticateJWT, this.userController.changePassword);
    this.router.post("/changeEmail", this.authController.authenticateJWT, this.userController.changeEmail);
    this.router.post("/verifiedEmail", this.userController.verifiedEmail);
    this.router.get("/genReferLink", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.userController.genReferLink);
    this.router.delete("/", this.authController.authenticateJWT, this.userController.deleleAccount);
    this.router.post("/voteResponsive", this.authController.authenticateJWT, this.userController.voteResponsive);
    this.router.get("/voteResponsive", this.authController.authenticateJWT, this.userController.getVoteResponsive);
    this.router.post("/survey", this.authController.authenticateJWT, this.userController.createSurveysUserInfo);
    this.router.get("/survey", this.authController.authenticateJWT, this.userController.getSurveysUserInfo);
    this.router.put("/survey", this.authController.authenticateJWT, this.userController.updateSurveysUserInfo);
    // user story
    this.router.get("/story", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.userController.getAllUserStory);
    this.router.get("/story/token", this.userController.getUserStoryByToken);
    this.router.post("/story", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker),this.userController.createUserStory);
    this.router.put("/story/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker),this.userController.updateUserStory);
    this.router.delete("/story/:id", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker),this.userController.deleteUserStory);
  }
}