import config, { PAGE_SIZE } from "@src/config";
import { COMMON_ERROR, COMMON_SUCCESS } from "@src/config/message";
import { badRequest, ok } from "@src/middleware/response";
import AdminModel from "@src/models/admin";
import UserModel from "@src/models/user";
import JobsApplicantService from "@src/services/jobsApplicantService";
import UserBll from "@src/services/user";
import ImageUtils from "@src/utils/image";
import { convertToSlugUrl } from '@src/utils/jobUtils';
import ejs from "ejs";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import pdf from "html-pdf";
import { get } from "lodash";
import moment from "moment";
import path from "path";
import { promisify } from "util";
import { AVATAR_DEFAULT, CHAT_CONTENT_TYPE, CHAT_GROUP_STATUS, GROUP_TYPE } from "../lib/config";
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
  public async invite(req: Request, res: Response, next: NextFunction) {
    try {
      // check validate
      const employer = req["currentUser"] as UserModel;
      const groupId = parseInt(get(req, "params.id", 0));
      const memberId = parseInt(get(req, "params.memberId", 0));
      const status = get(req, "body.status", "invited");
      const zoomService = new ZoomService(null, null);
      const userService = new UserBll();
      // if (employer.employer_id) {
      //   return forbidden({ message: "Forbidden" }, req, res);
      // }
      // const jobsApplicantService = new JobsApplicantService();
      // const userService = new UserBll();
      // only invite nomal group
      const group = await zoomService.getOrCreateGroup(groupId, null, null, null, null);
      if (!group.groupInfo.id || group.groupInfo.type == GROUP_TYPE.Support) {
        return badRequest({ message: "no group" }, req, res);
      }
      const companyId = employer.company_id;
      const users = await userService.getEmployerMembers(
        companyId,
        group.groupInfo.id,
        0,
        0, 1000, group.groupInfo.group_nomal_type);
      const memberInfo = users.results.find((user: UserModel) => user.id == memberId);
      if (!memberInfo) {
        return badRequest({ message: "no member" }, req, res);
      }
      if (status == "invited") {
        // add to group
        const result = await zoomService.addToGroup(group.groupInfo.id, memberId);
        if (result) {
          return ok(result, req, res);
        }
      } else {
        // remove to group
        const result = await zoomService.removeToGroup(memberInfo.chat_group_member_id);
        if (result) {
          return ok({ message: COMMON_SUCCESS.default }, req, res);
        }
      }
      return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  // ---------------- admin -------------------------
  public async getListGroupSupport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = req["currentUser"] as UserModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", PAGE_SIZE.Chat));
      const accoutType = req.param("accoutType", null);
      const isGroup = parseInt(req.param("isGroup", 0));
      const q = req.param("q");
      const zoomService = new ZoomService(null, null);
      const result = await zoomService.getListGroupSupport(q, accoutType, page, pageSize, isGroup);
      return ok(result, req, res);
      // return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async getGroupSupportHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = req["currentUser"] as AdminModel;
      const page = parseInt(req.param("page", 0));
      const pageSize = parseInt(req.param("pageSize", 0));
      const groupId = get(req, "params.id", 0);
      const zoomService = new ZoomService(null, null);
      const checkGroupExist = await zoomService.getOrCreateGroup(groupId, null, null, null, null);
      const info = {} as IGroupInfoEntities;
      info.groupInfo = checkGroupExist.groupInfo;
      info.messages = await zoomService.getGroupNomalHistory(groupId, page, pageSize);
      return ok(info, req, res);
    } catch (err) {
      next(err);
    }
  }
  // public async adminReadMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  //   try {
  //     const admin = req["currentUser"] as AdminModel;
  //     const messageId = parseInt(get(req, "body.messageId", 0));
  //     const groupId = get(req, "params.id", 0);
  //     const zoomService = new ZoomService(null, null);
  //     const readMessage = await zoomService.createOrUpdateReadMessage(groupId, 0, messageId);
  //     return ok(readMessage, req, res);
  //   } catch (err) {
  //     next(err);
  //   }
  // }
  public async adminCheckUnread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = req["currentUser"] as AdminModel;
      const zoomService = new ZoomService(null, null);
      const listReadMessage = await zoomService.adminCheckUnread(0);
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
  // ---------------- end admin -------------------------
  public async report(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const zoomService = new ZoomService(null, null);
      const note = req.param("note");
      const reportType = parseInt(req.param("reportType"));
      const jobId = parseInt(req.param("jobId"));
      const userId = parseInt(req.param("userId"));
      const result = await zoomService.addReportJobs(user.id, userId, jobId, reportType, note);
      return ok({ message: COMMON_SUCCESS.default }, req, res);
    } catch (err) {
      next(err);
    }
  }
  public async downloadChatHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zoomService = new ZoomService(null, null);
      const jobsApplicantService = new JobsApplicantService();
      const user = req["currentUser"] as UserModel;
      const groupId = parseInt(get(req, "params.groupId", 0));
      const groupInfo = await zoomService.getGroupChatDetailById(groupId);
      const apiUrl = config.API_BASE_URL;
      if (groupInfo && groupInfo.group_type === GROUP_TYPE.Support) {
        return badRequest({ message: COMMON_ERROR.cannotGetHisotry }, req, res);
      }
      let chats = await zoomService.getListChatHistory(groupId);
      chats = chats.map((item) => {
        return {
          ...item,
          created_at: moment(item.created_at).format("hh:mm a, MMMM DD, YYYY")
        };
      });
      const job = await jobsApplicantService.getJobDetailByGroupChatId(groupId);
      if (job) {
        job.scheduleTime = job.scheduleTime ? moment(job.scheduleTime).format("hh:mm a, MMMM DD, YYYY") : "";
      }

      if (user.id === groupInfo.member_id) {
        // user is job seeker
        groupInfo.ownerName = groupInfo.company_name;
        groupInfo.ownerProfilePicture = groupInfo.company_logo || `${apiUrl}${AVATAR_DEFAULT.Employer}`;
      } else {
        // user is employer
        groupInfo.ownerName = `${groupInfo.member_first_name} ${groupInfo.member_last_name}`;
        groupInfo.ownerProfilePicture = groupInfo.member_profile_picture && groupInfo.can_view_profile === 1
          ? groupInfo.member_profile_picture : `${apiUrl}${AVATAR_DEFAULT.JobSeeker}`;
      }
      const defaultAvatarCompany = `${apiUrl}${AVATAR_DEFAULT.Employer}`;
      const defaultAvatarEmployer = `${apiUrl}${AVATAR_DEFAULT.JobSeeker}`;
      const defaultAvatarJobSeeker = `${apiUrl}${AVATAR_DEFAULT.JobSeeker}`;
      const nowFormat = moment().utc().format("dddd, MMM D, YYYY h:mm:sa");
      const html = await ejs.renderFile(path.join(__dirname, '../../../template/chatHistory.ejs'), {
        user,
        job,
        chats,
        groupInfo,
        apiUrl,
        defaultAvatarEmployer,
        defaultAvatarJobSeeker,
        defaultAvatarCompany
      }, { async: true });

      const options = {
        // height: "11.25in",
        // width: "1180",
        // header: {
        //   height: "10mm",
        // },
        // footer: {
        //   height: "24mm",
        //   contents: {
        //     default: '<div style="color: #444; text-align: center">{{page}}</div>'
        //   }
        // },
        format: "A4",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid
        orientation: "portrait", // portrait or landscape
        header: {
          height: "2mm",
        },
        paginationOffset: 1,
        footer: {
          height: "10mm",
          contents: {
            default: `<p style="padding: 0 0.5cm; font-size: 10px !important;margin-bottom: 0; margin-left: 0;font-family: "Avenir-Roman", sans-serif;"><span>Downloaded ${nowFormat}</span><span style="float: right">Page {{page}} of {{pages}}</span></p>`
          }
        },
        base: `${config.API_BASE_URL}/uploads/profile/`,
      };
      const title = job ? job.title : "Direct Message";
      const timestamp = Date.now();
      const fileName = `chat-history-${title.replace(/ /g, "").substring(0, 20)}-${groupInfo.ownerName.replace(/ /g, "")}-${timestamp}.pdf`;
      const filePath = path.join(__dirname, '../../../uploads/draft/', fileName);
      const createResult = pdf.create(html, options);
      await promisify(createResult.toFile).bind(createResult)(filePath);
      const pathFileOutPut =  `uploads/draft/${fileName}`;
      const imageUlti = new ImageUtils();
      const url = await imageUlti.uploadToS3(pathFileOutPut, fileName, 'application/pdf');
      if (!url) return badRequest({ message: COMMON_ERROR.pleaseTryAgain }, req, res);
      const filePathOutPut = path.join(__dirname, `../../../${pathFileOutPut}`);
      fs.unlinkSync(filePath);
      if (filePathOutPut != filePath) {
        fs.unlinkSync(filePathOutPut);
      };
      return ok({ filePath: url}, req, res);
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

  public async downloadICSFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      const title: string = data.title;
      const urlJob: string = data.urlJob;
      const scheduleTime: Date = new Date(data.scheduleTime);

      ics.createEvent({
        title: title,
        description: title,
        status: 'CONFIRMED',
        url: urlJob,
        start: [scheduleTime.getFullYear(), scheduleTime.getMonth() + 1, scheduleTime.getDate(), scheduleTime.getHours(), scheduleTime.getMinutes()],
        // duration: { minutes: 50 }
      }, (error, value) => {
        if (error) {
          console.log(error)
        }
        return ok({ title: `${convertToSlugUrl(title)}.ics`, data: value }, req, res);
      })
      return ok({}, req, res);
    } catch (err) {
      next(err);
    }
  }
}
