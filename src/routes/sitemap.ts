import SitemapController from "@src/controllers/sitemap";
import { Router } from "express";


export default class FollowsRouter {
  public router: Router;
  private sitemapController: SitemapController;

  constructor() {
    this.router = Router();
    this.sitemapController = new SitemapController();
    this.config();
  }

  private config() {
    this.router.get("/static", this.sitemapController.genSitemapStaticUrl);
    this.router.get("/job/:page", this.sitemapController.genSitemapJobUrl);
    this.router.get("/company/:page", this.sitemapController.genSitemapCompanyUrl);
  }
}