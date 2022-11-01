import AdminUsersController from "@src/controllers/admin/adminUsersController";
import AuthController from "@src/controllers/auth";
import { Router } from "express";
import { ADMIN_ACCOUNT_TYPE } from '../../config/index';
import { checkAdminRole } from '../../middleware/roles';

export default class AdminUsersRouter {
  public router: Router;
  private authController: AuthController;
  private adminUsersController: AdminUsersController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.adminUsersController = new AdminUsersController();
    this.config();
  }

  private config() {
    this.router.get("/", this.authController.adminAuthenticateJWT, checkAdminRole(ADMIN_ACCOUNT_TYPE.SuperAdmin), this.adminUsersController.getListAdminUsers);
    this.router.post("/invite", this.authController.adminAuthenticateJWT, checkAdminRole(ADMIN_ACCOUNT_TYPE.SuperAdmin), this.adminUsersController.inviteMember);
    this.router.put("/:userId", this.authController.adminAuthenticateJWT, checkAdminRole(ADMIN_ACCOUNT_TYPE.SuperAdmin), this.adminUsersController.updateAdminInfo);
    this.router.put("/:userId/deactive", this.authController.adminAuthenticateJWT, checkAdminRole(ADMIN_ACCOUNT_TYPE.SuperAdmin), this.adminUsersController.deactiveAdminAccount);
    this.router.post("/setPassword", this.adminUsersController.setPassword);
  }
}
