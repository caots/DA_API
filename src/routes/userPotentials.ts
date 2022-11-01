import UserPotentialsController from "@src/controllers/userPotentials";
import { verifiedRC } from "@src/middleware";
import { Router } from "express";
export default class UserPotentialsRouter {
  public router: Router;
  private userPotentialsController: UserPotentialsController;

  constructor() {
    this.router = Router();
    this.userPotentialsController = new UserPotentialsController();
    this.config();
  }

  private config() {
    this.router.post("/create", verifiedRC, this.userPotentialsController.createUserPotentials);
    this.router.post("/complete-signup", this.userPotentialsController.completeUserPotentials);
  }
}
