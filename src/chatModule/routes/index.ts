import { ACCOUNT_TYPE, PERMISSION_EMPLOYER } from "@src/config";
import { ADMIN_PERMISSION } from '@src/config/index';
import AuthController from "@src/controllers/auth";
import { checkRole, permissionsAdmin, permissionsEmp } from '@src/middleware/roles';
import { Router } from "express";
import UserController from '../../controllers/user';
import GroupController from "../controller/group";
export default class GroupChatRouter {
  public router: Router;
  private authController: AuthController;
  private groupController: GroupController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.groupController = new GroupController();
    this.config();
  }

  private config() {
    this.router.get("/history/:groupId", this.authController.authenticateJWT, this.groupController.downloadChatHistory);

    this.router.get("/list", this.authController.authenticateJWT, this.groupController.getListGroup);
    this.router.get("/:id/", this.authController.authenticateJWT, this.groupController.getGroupNomalHistory);
    this.router.get("/:id/:contentType", this.authController.authenticateJWT, this.groupController.getListFile);
    this.router.put("/:groupId/:status", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),
      permissionsEmp(PERMISSION_EMPLOYER.Chat), this.groupController.archivedGroup);

    this.router.post("/:id/:memberId", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), permissionsEmp(PERMISSION_EMPLOYER.FindCandidate), this.groupController.invite);
    this.router.get("", this.authController.authenticateJWT, this.groupController.checkUnread);
    this.router.put("/report", this.authController.authenticateJWT, this.groupController.report);
    this.router.post("/download-interview-infomation/", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer), this.groupController.downloadICSFile);

  }
}

export class AdminGroupChatRouter {
  public router: Router;
  private authController: AuthController;
  private groupController: GroupController;
  private userControler: UserController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.groupController = new GroupController();
    this.userControler = new UserController();
    this.config();
  }

  private config() {
    // admin
    this.router.get("/list", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.Message), this.groupController.getListGroupSupport);
    this.router.get("/:id", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.Message), this.groupController.getGroupSupportHistory);
    this.router.get("/:id/:contentType", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.Message), this.groupController.getListFile);
    this.router.get("", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.Message), this.groupController.adminCheckUnread);
    this.router.post("/delete-file", this.authController.adminAuthenticateJWT, permissionsAdmin(ADMIN_PERMISSION.Message), this.userControler.deleteFile)
  }
}
