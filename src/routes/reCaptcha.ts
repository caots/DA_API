import ReCaptchaController from "@src/controllers/reCaptcha";
import { Router } from "express";

export default class ReCaptchasRouter {
  public router: Router;
  private reCaptchaController: ReCaptchaController;

  constructor() {
    this.router = Router();
    this.reCaptchaController = new ReCaptchaController();
    this.config();
  }

  private config() {
    /** gen rc script token */
    this.router.get("/genScriptToken", this.reCaptchaController.genRcScript);
  }
}
