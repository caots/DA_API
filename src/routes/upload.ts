import AuthController from "@src/controllers/auth";
import UploadsController from "@src/controllers/upload";
import ImageUtils from "@src/utils/image";
import { Router } from "express";
export default class UploadsRouter {
  public router: Router;
  private authController: AuthController;
  private uploadsController: UploadsController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.uploadsController = new UploadsController();
    this.config();
  }

  private config() {
    const imageUlti = new ImageUtils(true);
    this.router.post("", this.authController.authenticateJWT, imageUlti.upload.single("file"), this.uploadsController.upload);
    this.router.post("/:id", imageUlti.upload.single("file"), this.uploadsController.upload);
  }
}
