import { JOB_STATUS, SITEMAP_STATIC, TYPE_SITEMAP } from "@src/config";
import SiteMapService from "@src/services/genSitemapService";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import { get } from "lodash";
import path from "path";

export default class SitemapController {

  public async genSitemapStaticUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sitemapService = new SiteMapService();
      const data = await sitemapService.genSitemapUrl(SITEMAP_STATIC, TYPE_SITEMAP.STATIC);
      const folderSitemap = path.join(__dirname, "../sitemap/");
      if (!fs.existsSync(folderSitemap)) {
        fs.mkdirSync(folderSitemap);
      }
      fs.writeFileSync(`${folderSitemap}sitemap.xml`, data);
      return res.status(200).sendFile(`${folderSitemap}sitemap.xml`);
    } catch (err) {
      next(err);
    }
  }

  public async genSitemapCompanyUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = get(req, "params.page", 0);
      const pageSize = 500;
      const sitemapService = new SiteMapService();
      const listCompany = await sitemapService.getListCompany(page, pageSize);
      const data = await sitemapService.genSitemapUrl(listCompany.results, TYPE_SITEMAP.COMPANY);      
      const folderSitemap = path.join(__dirname, "../sitemap/");
      if (!fs.existsSync(folderSitemap)) {
        fs.mkdirSync(folderSitemap);
      }
      fs.writeFileSync(`${folderSitemap}sitemap.xml`, data);
      return res.status(200).sendFile(`${folderSitemap}sitemap.xml`);
    } catch (err) {
      next(err);
    }
  }

  public async genSitemapJobUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = get(req, "params.page", 0);
      const pageSize = 500;
      const status = JOB_STATUS.Active;
      const sitemapService = new SiteMapService();
      const listJobs = await sitemapService.getJobsByJobSeeker(status, page, pageSize);
      const data = await sitemapService.genSitemapUrl(listJobs.results, TYPE_SITEMAP.JOB);
      const folderSitemap = path.join(__dirname, "../sitemap/");
      if (!fs.existsSync(folderSitemap)) {
        fs.mkdirSync(folderSitemap);
      }
      fs.writeFileSync(`${folderSitemap}sitemap.xml`, data);
      return res.status(200).sendFile(`${folderSitemap}sitemap.xml`);
    } catch (err) {
      next(err);
    }
  }
}