import { ok } from "@src/middleware/response";
import BlackListService from "@src/services/blackListService";
import { NextFunction, Request, Response } from 'express';
import { get } from "lodash";

export default class AdminBlackListController {
  public async getListBlackListUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blackListService = new BlackListService();
      const results = await blackListService.getListBackList();
      return ok({ data: results }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getBlackListUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(get(req, "params.id", 0));
      const blackListService = new BlackListService();
      const results = await blackListService.getBackListById(id);
      return ok({ data: results }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const blackListService = new BlackListService();
      const results = await blackListService.add(body);
      return ok({ data: results }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const id = parseInt(get(req, "params.id", 0));
      const blackListService = new BlackListService();
      const results = await blackListService.update(id, body);
      return ok({ data: results }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(get(req, "params.id", 0));
      const blackListService = new BlackListService();
      const results = await blackListService.delete(id);
      return ok({ data: results }, req, res);
    } catch (err) {
      next(err);
    }
  }
}