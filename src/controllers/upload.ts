import { UPLOAD_TYPE } from "@src/config";
import { COMMON_ERROR } from "@src/config/message";
import { badRequest, ok } from "@src/middleware/response";
import UserModel from "@src/models/user";
import ImageUtils from "@src/utils/image";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
export default class UserController {

  public async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: handlerId } = req.params || {};
      const currentUser = req["currentUser"] as UserModel;
      let userId: number = currentUser?.id || eval(handlerId);
      // check image
      const uploadType = parseInt(get(req, "body.uploadType", UPLOAD_TYPE.EmployerAvatar));
      if (req.file) {
        console.log(req.file);
        const imageUltis = new ImageUtils();
        const url = await imageUltis.resizeUploadImage(req.file, userId, uploadType);
        return ok({ url }, req, res);
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
}
