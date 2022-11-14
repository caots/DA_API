import { PAGE_SIZE } from "@src/config";
import { ok } from "@src/middleware/response";
import UserModel from "@src/models/user";
import JobsApplicantService from "@src/services/jobsApplicantService";
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import { CHAT_CONTENT_TYPE, CHAT_GROUP_STATUS, GROUP_TYPE } from "../lib/config";
import { ChatReadMessagesModel } from "../models";
import { IGroupInfoEntities } from "../models/entities";
import { ZoomService } from "../service/room";
const ics = require('ics')
export default class GroupController {

  public async checkUnread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const zoomService = new ZoomService(null, null);
      const listReadMessage = await zoomService.checkUnread(user.id);
      const unreads = listReadMessage.filter((msg: any) => {
        if (!msg.message_id || msg.message_id < msg.last_message_id) {
          return true;
        }
        return false;
      });
      return ok({ unread: unreads.length }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getListGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Chat));
      const chatGroupStatus = parseInt(req.param("searchType", CHAT_GROUP_STATUS.All));
      const isGroup = parseInt(req.param("isGroup", 0));
      const isSupport = parseInt(req.param("isSupport", 0));
      let q = req.param("q");
      // containsEncodedComponents
      if (decodeURI(q) !== decodeURIComponent(q)) {
        q = decodeURIComponent(q);
      }
      const zoomService = new ZoomService(null, null);
      let result;
      if (isSupport) {
        result = await zoomService.getListGroupSupportByUser(user.chat_group_id);
      } else {
        result = await zoomService.getListGroupNomal(user.id, user.acc_type, chatGroupStatus, q, page, pageSize, isGroup);
      }
      return ok(result, req, res);
      // return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getGroupNomalHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", 0));
      const groupId = get(req, "params.id", 0);
      // const ownerId = parseInt(req.param("ownerId", null));
      // const jobId = parseInt(req.param("jobId", null));
      // let jobSeekerId = parseInt(req.param("jobSeekerId", 0));
      const zoomService = new ZoomService(null, null);
      // const jobsApplicantService = new JobsApplicantService();
      // const userService = new UserBll();
      const checkGroupExist = await zoomService.getOrCreateGroup(groupId);
      const info = {} as IGroupInfoEntities;
      if (!checkGroupExist.groupInfo || !checkGroupExist.groupInfo.id) {
        return ok(info, req, res);
      }
      if (checkGroupExist.groupInfo.type == GROUP_TYPE.Support) {
        const crm = new ChatReadMessagesModel();
        crm.group_id = checkGroupExist.groupInfo.id;
        crm.user_id = user.id;
        const readMsgOb = await ChatReadMessagesModel.query().findOne(crm);
        checkGroupExist.groupInfo["read_message_id"] = readMsgOb && readMsgOb.message_id ? readMsgOb.message_id : null;
      }
      info.groupInfo = checkGroupExist.groupInfo;
      if (checkGroupExist.isNew) {
        info.messages = { results: [], total: 0 };
      }
      // if (checkGroupExist.groupInfo.type == GROUP_TYPE.Nomal) {
      //   jobSeekerId = checkGroupExist.groupInfo.member_id;
      // }
      const messagesPromise = zoomService.getGroupNomalHistory(groupId, page, pageSize);
      const results = await Promise.all([messagesPromise]);
      info.messages = results[0];
      // info.jobSeeker = results[1];
      return ok(info, req, res);
      // return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getListFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Chat));
      const groupId = parseInt(req.param("id", 0));
      const contentType = parseInt(req.param("contentType", 1));
      if (contentType == CHAT_CONTENT_TYPE.Text) {
        return ok({ results: [], total: 0 }, req, res);
      }
      const zoomService = new ZoomService(null, null);
      const result = await zoomService.getListFile(groupId, contentType, page, pageSize);
      // info.jobSeeker = results[1];
      return ok(result, req, res);
      // return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async archivedGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zoomService = new ZoomService(null, null);
      const jobsApplicantService = new JobsApplicantService();
      const user = req["currentUser"] as UserModel;
      const groupId = parseInt(get(req, "params.groupId", 0));
      const status = parseInt(get(req, "params.status", CHAT_GROUP_STATUS.Archived));
      const jobId = parseInt(get(req, "body.jobId", 0));
      const isAll = parseInt(get(req, "body.isAll", 0));
      const result = await zoomService.updateGroup(groupId, user.id, status, jobId, isAll);
      return ok(result, req, res);
    } catch (err) {
      next(err);
    }
  }
}
