import AuthController from "@src/controllers/auth";
import ContactUsController from "@src/controllers/contactUs";
import { Router } from "express";
export default class ContactUsRouter {
  public router: Router;
  private contactUsController: ContactUsController;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.contactUsController = new ContactUsController();
    this.config();
  }

  private config() {
    this.router.post("/", this.contactUsController.insert);
  }
}