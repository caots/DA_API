import AuthController from "@src/controllers/auth";
import TaskScheduleController from "@src/controllers/taskSchedule";
import { Router } from "express";
export default class TaskScheduleRouter {
  public router: Router;
  private taskScheduleController: TaskScheduleController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.taskScheduleController = new TaskScheduleController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    this.router.get("/execute/:type", this.authController.authenticateJWT, this.taskScheduleController.execute);
  }
}