import { ACCOUNT_TYPE, PERMISSION_EMPLOYER } from "@src/config";
import AuthController from "@src/controllers/auth";
import { checkRole, permissionsEmp } from '@src/middleware/roles';
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
    this.router.get("/list", this.authController.authenticateJWT, this.groupController.getListGroup);
    this.router.get("/:id/", this.authController.authenticateJWT, this.groupController.getGroupNomalHistory);
    this.router.get("/:id/:contentType", this.authController.authenticateJWT, this.groupController.getListFile);
    this.router.put("/:groupId/:status", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.Employer),permissionsEmp(PERMISSION_EMPLOYER.Chat), this.groupController.archivedGroup);
    this.router.get("", this.authController.authenticateJWT, this.groupController.checkUnread);

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
  }
}
