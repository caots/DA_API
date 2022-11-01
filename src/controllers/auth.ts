import config, { USER_STATUS } from "@src/config";
import HttpException from "@src/middleware/exceptions/httpException";
import AdminBll from "@src/services/admin";
import AdminSessionBll from "@src/services/adminSession";
import UserBll from "@src/services/user";
import UserSessionBll from "@src/services/userSession";
import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";

export default class AuthController {
  private userBll: UserBll;
  private adminBll: AdminBll;
  private userSessionBll: UserSessionBll;
  private adminSessionBll: AdminSessionBll;

  constructor() {
    this.userBll = new UserBll();
    this.adminBll = new AdminBll();
    this.userSessionBll = new UserSessionBll();
    this.adminSessionBll = new AdminSessionBll();
  }

  public config() {
    passport.use("user-login",
      new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
        try {
          const user = await this.userBll.verifyEmailPassword(email, password);
          done(null, user);
        } catch (error) {
          done(error);
        }
      })
    );

    passport.use("admin-login",
      new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
        try {
          const user = await this.adminBll.verifyEmailPassword(email, password);
          done(null, user);
        } catch (error) {
          done(error);
        }
      })
    );

    passport.use(
      new JwtStrategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: config.JWT_SECRET,
          ignoreExpiration: true,
          passReqToCallback: true
        },
        async (req, payload, done) => {
          try {
            const user = payload.admin ? await this.adminBll.findByEmailSafe(payload.email)
              : await this.userBll.findByEmailSafe(payload.email);
            if (!user || user.status == USER_STATUS.deactive) return done(null, null);
            const token = req.header("authorization").replace("Bearer ", "");
            const userSession = payload.admin ? await this.adminSessionBll.findByUserAndAccessToken(parseInt(user.$id()), token)
              : await this.userSessionBll.findByUserAndAccessToken(parseInt(user.$id()), token);
            if (!userSession) return done(null, null);
            if (payload.admin) {
              user["admin"] = true;
            }
            done(null, user);
          } catch (error) {
            done(error);
          }
        }
      )
    );
  }

  public authenticateJWT(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("jwt", (err, user, info) => {
      if (err) return next(err);
      if (!user) return next(new HttpException(401, "unauthorized"));
      req["currentUser"] = user;
      next();
    })(req, res, next);
  }
  public adminAuthenticateJWT(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("jwt", (err, user, info) => {
      if (err) return next(err);
      if (!user || !user.admin) return next(new HttpException(401, "unauthorized"));
      req["currentUser"] = user;
      next();
    })(req, res, next);
  }

  // only save user, not return err, support for guest and user
  public saveCurrentUser(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("jwt", (err, user, info) => {
      req["currentUser"] = user;
      next();
    })(req, res, next);
  }
}
