import { NextFunction, Request, Response } from "express";
import { renderRC } from "../middleware/recaptcha";
export default class ReCaptchaController {
  /** create */
  public async genRcScript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rcScript = renderRC();
      res.status(200).send(rcScript);
    } catch (err) {
      next(err);
    }
  }
}
