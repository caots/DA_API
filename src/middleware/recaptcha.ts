import { NextFunction, Response } from "express";
import { RecaptchaV3 } from "express-recaptcha";
import config from "../config/";
import { logger } from "../middleware";
import { badRequest } from "./response";
const recaptcha = new RecaptchaV3(config.RC_SITE_KEY, config.RC_SECRET_KEY, { callback: "cb" });
export const verifiedRC = (req: any, res: Response, next: NextFunction) => {
  // next();
  recaptcha.verify(req, (error, data) => {
    if (error) {
      logger.error("err verifiedRC");
      logger.error(JSON.stringify(error));
      return badRequest({ message: getMsgRecapcha(error) }, req, res);
    }
    logger.info("verifiedRC");
    logger.info(JSON.stringify(data));
    if (data.score < Number(config.RC_MIN_SCORE)) {
      return badRequest({ message: "not trust enough" }, req, res);
    }
    next();
  });
};
export const renderRC = () => {
  return recaptcha.render();
};
function getMsgRecapcha(errorCode) {
  switch (errorCode) {
    case "missing-input-secret":
      return "The secret parameter is missing";
    case "invalid-input-secret":
      return "The secret parameter is invalid or malformed";
    case "missing-input-response":
      return "The response parameter is missing";
    case "invalid-input-response":
      return "The response parameter is invalid or malformed";
    case "bad-request":
      return "The request is invalid or malformed";
    case "timeout-or-duplicate":
      return "The response is no longer valid: either is too old or has been used previously";
    default:
      break;
  }
}
