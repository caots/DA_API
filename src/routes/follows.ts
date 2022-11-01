import { ACCOUNT_TYPE } from "@src/config";
import AuthController from "@src/controllers/auth";
import jobseekerFollowEmployersController from "@src/controllers/jobseekerFollowEmployers";
import { checkRole } from "@src/middleware/roles";
import { Router } from "express";

export default class FollowsRouter {
  public router: Router;
  private jobseekerFollowEmployersController: jobseekerFollowEmployersController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.jobseekerFollowEmployersController = new jobseekerFollowEmployersController();
    this.authController = new AuthController();
    this.config();
  }

  private config() {
    // for job seeker
    this.router.get("/", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.jobseekerFollowEmployersController.gets);
    this.router.get("/ids", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.jobseekerFollowEmployersController.getListIds);
    this.router.post("/:id/:action", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.jobseekerFollowEmployersController.follows);
    this.router.delete("/", this.authController.authenticateJWT, checkRole(ACCOUNT_TYPE.JobSeeker), this.jobseekerFollowEmployersController.unFollows);
  }
} 