import AuthController from "@src/controllers/auth";
import NotificationController from "@src/controllers/notification";
import { Router } from "express";
export default class NotificationRouter {
  public router: Router;
  private notificationController: NotificationController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.notificationController = new NotificationController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    this.router.get("/:isRead/:page/:pageSize", this.authController.authenticateJWT, this.notificationController.getList);
    this.router.put("/:id", this.authController.authenticateJWT, this.notificationController.markRead);
    this.router.get("/clickApplyJob/:id", this.authController.authenticateJWT, this.notificationController.clickApplyJob);
    this.router.get("/total", this.authController.authenticateJWT, this.notificationController.totalMessage);
  }
}