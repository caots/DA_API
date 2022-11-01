import config from "@src/config/index";
import { errorMiddleware, logger, notFoundMiddleware } from "@src/middleware";
import routes from "@src/routes";
import { json, urlencoded } from "body-parser";
import cors from "cors";
import express from "express";
import multer from "multer";
import passport from "passport";
import path from "path";
import AuthController from "./controllers/auth";
import SitemapRouter from "./routes/sitemap";
const upload = multer();

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
    // const corConfig = {
    //   origin: false,
    //   credentials: true
    //   // maxAge: 3600
    // };
    
    // this.app.use(cors(corsOptions));
    // this.app.use(cors());
    // this.app.use((req, res, next) => {
    //   res.setHeader("Access-Control-Allow-Origin", "*");
    //   res.setHeader("Access-Control-Allow-Headers", "Access-Control-Request-Headers, Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token,Authorization, If-Modified-Since, X-Requested-With");
    //   res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
    //   res.setHeader("Access-Control-Expose-Headers", "X-Api-Version, X-Request-Id, X-Response-Time");
    //   res.setHeader("Access-Control-Max-Age", "1000");
    //   res.setHeader("Access-Control-Allow-Credentials", "true");
    //   next();
    // });
    /** support application/json type post data */
    this.app.use(json());
    /** support application/x-www-form-urlencoded post data */
    this.app.use(urlencoded({ extended: true }));
    // this.app.use(upload.array("image", 10));
    // this.app.use(upload.single("image"));
    // support csrf
    // this.app.use(cookieParser());
    // endpoint get csrf token
    // this.app.use("/csrfProtection", csrf({ cookie: true }), (req, res) => {
    //   res.json(req.csrfToken());
    // });
    // this.app.use(csrf({ cookie: true, ignoreMethods: ["HEAD", "OPTIONS"] }));
    /** middle-ware that initialises Passport */
  }
  private router() {
    this.app.use(passport.initialize());
    const dir = path.join(__dirname, "../uploads");
    const whiteList = [config.WEBSITE_URL, config.ADMIN_URL]
    const corsOptions = {
      origin: (origin, callback) => {
        callback(null, true)
        return;
        logger.info(origin);
        console.log(origin)
        if (whiteList.indexOf(origin) !== -1 || (origin && origin.includes('.measuredskills.com') || (origin == undefined))) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      optionsSuccessStatus: 200 // For legacy browser support
      }
    // console.log(dir);
    this.app.use("/uploads", cors(corsOptions), express.static(dir));
    /** add auth jwt */
    this.auth.config();
    /** add routes */
    this.app.use("/v1", cors(corsOptions), routes);
    /** gen sitemap */
    this.app.use("/sitemap", new SitemapRouter().router);
    // this.app.get("/", (_req, res) => res.sendFile(__dirname + "/demo/index.html"));
    this.app.get("/", (req, res) => {
      res.sendFile(__dirname + "/index.html");
    });
    /** not found error */
    this.app.use(notFoundMiddleware);
    /** csrf error */
    // this.app.use(csrfMiddleware);
    /** internal server Error  */
    this.app.use(errorMiddleware);
  }
}

export default new App().app;
