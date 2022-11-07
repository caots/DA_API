import { errorMiddleware, notFoundMiddleware } from "@src/middleware";
import routes from "@src/routes";
import { json, urlencoded } from "body-parser";
import cors from "cors";
import express from "express";
import passport from "passport";
import path from "path";
import AuthController from "./controllers/auth";

export const appSchedule = express();
class App {
  public app: express.Application;
  private auth: AuthController;

  constructor() {
    this.app = express();
    this.auth = new AuthController();
    this.config();
    this.router();
  }

  private config() {
    /** support application/json type post data */
    this.app.use(json());
    this.app.use(cors());
    /** support application/x-www-form-urlencoded post data */
    this.app.use(urlencoded({ extended: true }));

  }
  private router() {
    this.app.use(passport.initialize());
    const dir = path.join(__dirname, "../uploads");
    // console.log(dir);
    this.app.use("/uploads", express.static(dir));
    /** add auth jwt */
    this.auth.config();
    /** add routes */
    this.app.use("/v1", routes);
    // this.app.get("/", (_req, res) => res.sendFile(__dirname + "/demo/index.html"));
    this.app.get("/", (req, res) => {
      res.sendFile(__dirname + "/index.html");
    });
    /** not found error */
    this.app.use(notFoundMiddleware);
    this.app.use(errorMiddleware);
  }
}

export default new App().app;
