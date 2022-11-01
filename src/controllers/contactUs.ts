
import { COMMON_SUCCESS } from "@src/config/message";
import { ok } from "@src/middleware/response";
import ContactUsModel from "@src/models/contact-us";
import ContactUsService from "@src/services/contactUs";
import { NextFunction, Request, Response } from "express";

export default class ContactUsController {
  public static bll: ContactUsService;
  constructor() {
    ContactUsController.bll = ContactUsController.bll == null ? new ContactUsService() : ContactUsController.bll;
  }
  public async insert(req: Request, res: Response, next: NextFunction) {
    try {
      let contact = req.body as ContactUsModel;
      contact = await ContactUsController.bll.insert(contact);
      return ok({ Message: COMMON_SUCCESS.default, Data: contact }, req, res);
    } catch (err) {
      next(err);
    }
  }
}