import { ok } from "@src/middleware/response";
import AdminSessionBll from "@src/services/adminSession";
import { NextFunction, Request, Response } from "express";
import passport from "passport";

export default class AdminController {
  /** login with email and password */
  public login(req: Request, res: Response, next: NextFunction): void {
    try {
      passport.authenticate("admin-login", { session: false }, async (err, user, info) => {
        try {
          if (err) return next(err);
          if (user) {
            const remember_me = req.body.remember_me ? true : false;
            const adminSessionBll = new AdminSessionBll();
            const result = await adminSessionBll.create(user, remember_me);
            const auth_info = { access_token: result.access_token, refresh_token: result.refresh_token, expires_in: result.expires_in };
            delete user.password;
            const data = {
              auth_info,
              user_info: user
            };
            ok(data, req, res);
          }
        } catch (err) {
          next(err);
        }
      })(req, res);
    } catch (err) {
      next(err);
    }
  }
}