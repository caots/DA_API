import { ACCOUNT_TYPE, JOBSEEKER_RATTING_TYPE, PAGE_SIZE } from "@src/config";
import { logger } from "@src/middleware";
import HttpException from "@src/middleware/exceptions/httpException";
import { ChatReportsModel } from "@src/models/company_reports";
import { PotentialCandidatesModel } from "@src/models/find_candidate_logs";
import JobApplicantsModel from "@src/models/job_applicants";
import moment from "moment";
import { raw, transaction } from "objection";
import { Server, Socket } from "socket.io";
import { CHAT_CONTENT_TYPE, CHAT_GROUP_STATUS, GROUP_NOMAL_TYPE, GROUP_TYPE } from "../lib/config";
import { ChatGroupMembersModel, ChatGroupsModel, ChatMessagesModel, ChatReadMessagesModel } from "../models";

export class ZoomService {
  public io: Server;
  public socket: Socket;
  constructor(ioLib: Server, socketLib: Socket) {
    this.io = ioLib;
    this.socket = socketLib;
  }
  public async joinAllGroup(userId: number, isAdmin = false) {
    let listGroup = [];
    if (isAdmin) {
      listGroup = await ChatGroupsModel.query().select(["chat_groups.id as group_id"]).
        where("chat_groups.type", GROUP_TYPE.Support);
    } else {
      listGroup = await ChatGroupMembersModel.query().select(["chat_group_members.group_id"]).
        where("chat_group_members.member_id", userId).
        where("chat_group_members.is_deleted", 0)
        .join("chat_groups as CG", "chat_group_members.group_id", "CG.id");
    }
    listGroup.forEach((group: ChatGroupMembersModel) => {
      if (!this.socket.rooms[group.group_id.toString()]) {
        this.socket.join(group.group_id.toString(), (...a) => {
        });
      }
    });
  }
  public async getListGroupNomal(
    userId: number, accType = ACCOUNT_TYPE.Employer,
    chatGroupStatus = 0, q = "",
    page = 0, pageSize = PAGE_SIZE.Chat, isGroup = 1
  ): Promise<any> {
    try {
      let selects = [
        "chat_groups.id as group_id",
        "chat_groups.job_id as job_id",
        "chat_groups.ower_id as ower_id",
        "chat_groups.company_id as company_id",
        "J.title as job_title",
        "J.salary as job_salary",
        "J.is_private as job_is_private",
        "chat_groups.type as group_type",
        "chat_groups.group_nomal_type as group_nomal_type",
        "chat_groups.deleted_at as group_deleted_at",
        "chat_groups.status as chat_groups_status",
        "CM.id as msg_id",
        "CM.user_id as msg_sender_id",
        "CM.content as msg_content",
        "CM.content_type as msg_content_type",
        "CM.created_at as msg_last_time_send_message",
        "U.first_name as msg_sender_first_name",
        "U.last_name as msg_sender_last_name",
        "U.profile_picture as msg_sender_profile_picture",
        "CRM.message_id as read_message_id",
        // JA.can_view_profile as can_view_profile,
        "JA.id as job_applicant_id",
        "JA.total_point",
        // "PC.can_view_profile as can_view_profile"
      ];
      const select = await raw(`if(chat_groups.group_nomal_type = 0, JA.can_view_profile, PC.can_view_profile ) as can_view_profile`);
      selects.push(select);
      let orders = [];
      if (!isGroup) {
        orders = ["msg_last_time_send_message", "desc"];
      } else {
        if (accType == ACCOUNT_TYPE.JobSeeker) {
          orders = ["company_id", "desc"];
        } else {
          orders = ["chat_groups.group_nomal_type", "desc", "job_id", "desc"];
        }
      }
      const expired_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
      let query = ChatGroupsModel.query().where("chat_groups.type", GROUP_TYPE.Nomal);
      if (accType == ACCOUNT_TYPE.JobSeeker) {
        const select = [
          "CP.company_name as company_name",
          "CP.company_profile_picture as company_profile_picture",
          "C.user_responsive as company_user_responsive",
          "C.is_deleted as company_is_deleted",
          "C.is_user_deleted as company_is_user_deleted",
          "C.status as company_status",
        ];
        selects = selects.concat(select);
        query = query.where("chat_groups.member_id", userId)
          .leftJoin("users as C", "chat_groups.ower_id", "C.id")
          .leftJoin("company as CP", "C.company_id", "CP.id");
        if (q) {
          const convertQ = q.toLowerCase();
          if (convertQ.includes("direct message")) {
            query = query.where(builder => {
              builder
                .where("CP.company_name", "like", `%${q}%`)
                .orWhere("J.title", "like", `%${q}%`)
                .orWhere("chat_groups.group_nomal_type", GROUP_NOMAL_TYPE.DM);
            });
          } else {
            query = query.where(builder => builder.
              where("CP.company_name", "like", `%${q}%`)
              .orWhere("J.title", "like", `%${q}%`)
            );
          }
        }
        query = query.join(raw(`(select group_id, max(id) as lastSeen from chat_messages GROUP BY group_id) as CM2`), "CM2.group_id", "chat_groups.id")
          .join("chat_messages as CM", s => {
            s.on("CM2.lastSeen", "CM.id")
              .andOn("CM2.group_id", "CM.group_id");
          });

      } else {
        const select = [
          "JS.id as jobSeeker_id",
          "JS.first_name as jobSeeker_first_name",
          "JS.last_name as jobSeeker_last_name",
          "JS.profile_picture as jobSeeker_profile_picture",
          "JSR.rate as job_seeker_rate",
          "JS.user_responsive as job_seeker_user_responsive",
          "JS.is_deleted as jobseeker_is_deleted",
          "JS.is_user_deleted as jobseeker_is_user_deleted",
          "JS.status as jobseeker_user_status",
        ];
        selects = selects.concat(select);
        query = query.join("chat_group_members as CGM", s => {
          s.onIn("CGM.member_id", [userId])
            .andOn("CGM.group_id", "chat_groups.id");
        })
          .leftJoin("users as JS", "chat_groups.member_id", "JS.id")
        switch (chatGroupStatus) {
          // inbox
          case CHAT_GROUP_STATUS.Active:
            query = query.where("chat_groups.status", CHAT_GROUP_STATUS.Active);
            break;
          case CHAT_GROUP_STATUS.Archived:
            query = query.where("chat_groups.status", CHAT_GROUP_STATUS.Archived);
            break;
          default:
            // query = query.where("J.status", JOB_STATUS.Active);
            break;
        }
        if (q) {
          const convertQ = q.toLowerCase();
          if (convertQ.includes("direct message")) {
            query = query.where(builder => {
              builder
                .where("J.title", "like", `%${q}%`)
                .orWhere("chat_groups.group_nomal_type", GROUP_NOMAL_TYPE.DM);
            });
          } else {
            query = query.where("J.title", "like", `%${q}%`);
          }
        }
        query = query
          .leftJoin(raw(`(select group_id, max(id) as lastSeen from chat_messages GROUP BY group_id) as CM2`), "CM2.group_id", "chat_groups.id")
          .leftJoin("chat_messages as CM", s => {
            s.on("CM2.lastSeen", "CM.id")
              .andOn("CM2.group_id", "CM.group_id");
          });
      }

      // .where("chat_group_members.is_deleted", 0)
      query = query
        .leftJoin("job_applicants as JA", "chat_groups.id", "JA.group_id")
        .leftJoin("chat_read_messages as CRM", s => {
          s.onIn("CRM.user_id", [userId])
            .andOn("CRM.group_id", "chat_groups.id");
        })
        .leftJoin("users as U", "U.id", "CM.user_id")
        .leftJoin("jobs as J", "chat_groups.job_id", "J.id")
        .leftJoin("potential_candidates as PC", "PC.chat_group_id", "chat_groups.id");

      if (accType == ACCOUNT_TYPE.Employer) {
        query = query.leftJoin("job_seeker_rating as JSR", conditions => {
          conditions.on("JSR.job_id", "J.id")
            .andOn("JSR.job_seeker_id", "JA.job_sekker_id")
            .andOnIn("JSR.type", [JOBSEEKER_RATTING_TYPE.Applicant])
            .andOn("JSR.reporter_id", "JA.employer_id")
        })
      }
      query = query
        .select(selects)
        .groupBy("group_id")
        .orderBy(orders[0], orders[1]);
      if (isGroup && accType == ACCOUNT_TYPE.Employer) {
        return query
          .orderBy(orders[2], orders[3])
          .page(page, pageSize);
      }
      return query
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // groupType = GROUP_TYPE.Nomal
  public async getGroupNomalHistory(
    groupId: number,
    page = 0, pageSize = PAGE_SIZE.Chat): Promise<any> {
    try {
      const query = ChatMessagesModel.query().select([
        "chat_messages.*",
        "U.first_name as user_first_name",
        "U.last_name as user_last_name",
        "U.profile_picture as user_profile_picture",
        "U.acc_type as user_acc_type",
        "CP.company_name as user_company_name",
        "U.employer_title as user_employer_title",
        "U.employer_id as user_employer_id"
      ]).where("chat_messages.group_id", groupId)
        .join("chat_groups as CG", "chat_messages.group_id", "CG.id")
        .leftJoin("users as U", "chat_messages.user_id", "U.id")
        .leftJoin("company as CP", "U.company_id", "CP.id");
      return query.orderBy("chat_messages.created_at", "desc").page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // groupType = GROUP_TYPE.Nomal
  public async getListFile(
    groupId: number,
    contentType = CHAT_CONTENT_TYPE.Image,
    page = 0, pageSize = PAGE_SIZE.Chat): Promise<any> {
    try {
      const query = ChatMessagesModel.query().select([
        "chat_messages.content", "chat_messages.content_type", "chat_messages.id"
      ]).where("chat_messages.group_id", groupId)
        .where(builder => builder
          .where("chat_messages.content_type", contentType)
          .orWhere(condition => condition
            .where("chat_messages.content_type", CHAT_CONTENT_TYPE.Complex)
            .andWhere("chat_messages.mime_type", contentType))
        );
      return query.orderBy("chat_messages.created_at", "desc").page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getOrCreateGroup(groupId: number, ownerId = null, jobId = null, companyId = null, memberId = 0, groupType = GROUP_TYPE.Nomal): Promise<{ groupInfo: ChatGroupsModel, isNew: boolean }> {
    try {
      let groupInfo = new ChatGroupsModel();
      if (groupId) {
        groupInfo = await ChatGroupsModel.query().findById(groupId);
        return { groupInfo, isNew: false };
      }
      const groupQuery = new ChatGroupsModel();
      groupQuery.type = groupType;
      if (typeof (jobId) == "number") {
        groupQuery.job_id = jobId;
      }
      // direct message
      if (!jobId) {
        groupQuery.group_nomal_type = GROUP_NOMAL_TYPE.DM;
      }
      if (ownerId) {
        groupQuery.ower_id = ownerId;
      }
      if (companyId) {
        groupQuery.company_id = companyId;
      }
      if (memberId) {
        groupQuery.member_id = memberId;
      }
      groupInfo = await ChatGroupsModel.query().findOne(groupQuery);
      if (groupInfo) {
        return { groupInfo, isNew: false };
      }
      const scrappy = await transaction(ChatGroupMembersModel, ChatGroupsModel, async (chatGroupMembersModel, chatGroupsModel) => {
        groupInfo = await chatGroupsModel.query().insert(groupQuery);
        const member1 = new ChatGroupMembersModel();
        member1.group_id = groupInfo.id;
        if (memberId) {
          member1.member_id = memberId;
        }
        await chatGroupMembersModel.query().insert(member1);
        if (groupType == GROUP_TYPE.Nomal) {
          const member2 = new ChatGroupMembersModel();
          member2.group_id = groupInfo.id;
          member2.member_id = ownerId;
          await chatGroupMembersModel.query().insert(member2);

          if (ownerId != companyId) {
            const member3 = new ChatGroupMembersModel();
            member3.group_id = groupInfo.id;
            member3.member_id = companyId;
            await chatGroupMembersModel.query().insert(member3);
          }
        }
      });
      logger.info("create chatGroupsModel");
      logger.info(JSON.stringify(scrappy));
      return { groupInfo, isNew: true };
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async addToGroup(groupId: number, memberId: number): Promise<ChatGroupMembersModel> {
    try {
      const member1 = new ChatGroupMembersModel();
      member1.group_id = groupId;
      if (memberId) {
        member1.member_id = memberId;
      }
      const isExisted = await ChatGroupMembersModel.query().findOne(member1);
      if (isExisted) { return isExisted; }
      return ChatGroupMembersModel.query().insert(member1);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async removeToGroup(chatGroupMemberId: number): Promise<number> {
    try {
      return ChatGroupMembersModel.query().deleteById(chatGroupMemberId);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getListGroupSupportByUser(
    groupId: number,
    page = 0, pageSize = 1
  ): Promise<any> {
    try {
      const selects = [
        "chat_groups.id as group_id",
        "chat_groups.job_id as job_id",
        "chat_groups.ower_id as ower_id",
        "chat_groups.company_id as company_id",
        "chat_groups.member_id as member_id",
        "chat_groups.type as group_type",
        "chat_groups.deleted_at as group_deleted_at",
        "CM.id as msg_id",
        "CM.user_id as msg_sender_id",
        "CM.content as msg_content",
        "CM.content_type as msg_content_type",
        "CM.created_at as msg_last_time_send_message",
        "U.first_name as msg_sender_first_name",
        "U.last_name as msg_sender_last_name",
        "U.profile_picture as msg_sender_profile_picture",
        "Member.first_name as member_first_name",
        "Member.last_name as member_last_name",
        "CP.company_name as member_company_name",
        "Member.employer_id as employer_id",
        "Member.employer_title as member_employer_title",
        "Member.profile_picture as member_profile_picture",
        "Member.acc_type as member_acc_type",
        "CRM.message_id as read_message_id"
      ];
      let query = ChatGroupsModel.query().select(selects)
        .where("chat_groups.type", GROUP_TYPE.Support)
        .where("chat_groups.id", groupId)
        .join("users as Member", "chat_groups.member_id", "Member.id");
      return query
        .leftJoin(raw(`(select group_id, max(id) as lastSeen from chat_messages GROUP BY group_id) as CM2`), "CM2.group_id", "chat_groups.id")
        .leftJoin("chat_messages as CM", s => {
          s.on("CM2.lastSeen", "CM.id")
            .andOn("CM2.group_id", "CM.group_id");
        })
        .leftJoin("chat_read_messages as CRM", s => {
          s.onIn("CRM.user_id", [0])
            .andOn("CRM.group_id", "chat_groups.id");
        })
        .leftJoin("users as U", "U.id", "CM.user_id")
        .leftJoin("company as CP", "CP.id", "U.company_id")
        .groupBy("group_id")
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // ------------ admin ------------------
  public async getListGroupSupport(
    q = "",
    accType = null,
    page = 0, pageSize = PAGE_SIZE.Chat, isGroup = 1,
  ): Promise<any> {
    try {
      let orders = [];
      if (!isGroup || accType == null || accType == ACCOUNT_TYPE.JobSeeker) {
        orders = ["msg_last_time_send_message", "desc"];
      } else if (accType == ACCOUNT_TYPE.Employer) {
        orders = ["company_id", "desc"];
      }
      const selects = [
        "chat_groups.id as group_id",
        "chat_groups.job_id as job_id",
        "chat_groups.ower_id as ower_id",
        "chat_groups.company_id as company_id",
        "chat_groups.member_id as member_id",
        "chat_groups.type as group_type",
        "chat_groups.deleted_at as group_deleted_at",
        "CM.id as msg_id",
        "CM.user_id as msg_sender_id",
        "CM.content as msg_content",
        "CM.content_type as msg_content_type",
        "CM.created_at as msg_last_time_send_message",
        "U.first_name as msg_sender_first_name",
        "U.last_name as msg_sender_last_name",
        "U.profile_picture as msg_sender_profile_picture",
        "Member.first_name as member_first_name",
        "Member.last_name as member_last_name",
        "CP.company_name as member_company_name",
        "Member.employer_id as employer_id",
        "Member.employer_title as member_employer_title",
        "Member.profile_picture as member_profile_picture",
        "Member.acc_type as member_acc_type",
        "CRM.message_id as read_message_id"
      ];
      let query = ChatGroupsModel.query().select(selects)
        .where("chat_groups.type", GROUP_TYPE.Support)
        .where("Member.sign_up_step", ">=", 2)
        .join("users as Member", "chat_groups.member_id", "Member.id")
      if (accType != null && accType != '') {
        query = query.where("Member.acc_type", accType);
      }
      if (q) {
        const nameArr = q.split(" ");
        if (accType == ACCOUNT_TYPE.Employer) {
          query = nameArr.length > 1 ? query.where(builder =>
            builder.where("CP.company_name", "like", `%${q}%`)
              .orWhere(builder => builder.where("Member.first_name", "like", `%${nameArr[0]}%`).where("Member.last_name", "like", `%${nameArr[1]}%`)))
            : query.where(builder =>
              builder.where("CP.company_name", "like", `%${q}%`)
                .orWhere("Member.first_name", "like", `%${q}%`)
                .orWhere("Member.last_name", "like", `%${q}%`));
        } else {
          if (nameArr.length > 1) {
            query = query.where("Member.first_name", "like", `%${nameArr[0]}%`).where("Member.last_name", "like", `%${nameArr[1]}%`);
          } else if (nameArr.length == 1) {
            query = query.where(builder => builder.
              where("Member.first_name", "like", `%${q}%`)
              .orWhere("Member.last_name", "like", `%${q}%`)
            );
          }
        }
      }
      // .where("chat_group_members.is_deleted", 0)
      // return
      // query
      //   .leftJoin("chat_messages as CM", "CM.group_id", "chat_groups.id")
      //   .leftJoin(raw(`(select group_id, max(id) as lastSeen from chat_messages GROUP BY group_id) as CM2`), s => {
      //     s.on("CM2.lastSeen", "CM.id")
      //       .andOn("CM2.group_id", "CM.group_id");
      //   })
      return query
        .leftJoin(raw(`(select group_id, max(id) as lastSeen from chat_messages GROUP BY group_id) as CM2`), "CM2.group_id", "chat_groups.id")
        .leftJoin("chat_messages as CM", s => {
          s.on("CM2.lastSeen", "CM.id")
            .andOn("CM2.group_id", "CM.group_id");
        })
        .leftJoin("chat_read_messages as CRM", s => {
          s.onIn("CRM.user_id", [0])
            .andOn("CRM.group_id", "chat_groups.id");
        })
        .leftJoin("users as U", "U.id", "CM.user_id")
        .join("company as CP", "U.company_id", "CP.id")
        .groupBy("group_id")
        .orderBy("msg_last_time_send_message", "desc")
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async adminCheckUnread(userId: number): Promise<any[]> {
    try {
      const chatReadMessage = await
        ChatGroupsModel.query().select(["chat_groups.id as group_id", "CM2.last_message_id", "CRM.message_id"]).
          where("chat_groups.type", GROUP_TYPE.Support)
          // ChatGroupMembersModel.query().select(["chat_group_members.group_id",
          //   "CM2.last_message_id", "CRM.message_id"]).
          //   where("chat_group_members.member_id", userId).
          //   where("chat_group_members.is_deleted", 0)
          .join(raw(`(select group_id, max(id) as last_message_id from chat_messages GROUP BY group_id) as CM2`), "CM2.group_id", "chat_groups.id")
          .leftJoin("chat_read_messages as CRM", s => {
            s.onIn("CRM.user_id", [userId])
              .andOn("CRM.group_id", "chat_groups.id");
          });
      return chatReadMessage;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // ------------end admin ------------------
  public async createOrUpdateReadMessage(groupId: number, userId: number, messageId: number): Promise<ChatReadMessagesModel> {
    try {
      const readMsg = new ChatReadMessagesModel();
      readMsg.group_id = groupId;
      readMsg.user_id = userId;
      const chatReadMessage = await ChatReadMessagesModel.query().findOne(readMsg);
      if (!chatReadMessage) {
        readMsg.message_id = messageId;
        return ChatReadMessagesModel.query().insert(readMsg);
      }
      if (chatReadMessage && messageId && chatReadMessage.message_id != messageId) {
        return ChatReadMessagesModel.query().updateAndFetchById(chatReadMessage.id, { message_id: messageId });
      }
      return null;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async checkUnread(userId: number): Promise<ChatReadMessagesModel[]> {
    try {
      const readMsg = new ChatReadMessagesModel();
      readMsg.user_id = userId;

      const query = ChatGroupMembersModel.query().select(["chat_group_members.group_id",
        "CM2.last_message_id", "CRM.message_id"]).
        where("chat_group_members.member_id", userId).
        where("chat_group_members.is_deleted", 0)
        .join("chat_groups as CG", "chat_group_members.group_id", "CG.id")
        .join(raw(`(select group_id, max(id) as last_message_id from chat_messages GROUP BY group_id) as CM2`), "CM2.group_id", "chat_group_members.group_id")
        .leftJoin("chat_read_messages as CRM", s => {
          s.onIn("CRM.user_id", [userId])
            .andOn("CRM.group_id", "chat_group_members.group_id");
        });
      const chatReadMessage = await query.execute();

      return chatReadMessage;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async addReportJobs(reporterId: number, userId: number, jobId: number, reportType: number, note: string): Promise<ChatReportsModel> {
    try {
      const report = new ChatReportsModel();
      report.report_type = reportType;
      report.note = note;
      report.reporter_id = reporterId;
      report.user_id = userId;
      report.job_id = jobId;
      const result = await ChatReportsModel.query().insert(report);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getListChatHistory(groupId: number): Promise<any[]> {
    try {
      // return ChatMessagesModel.query().select([
      //   "chat_messages.*",
      //   "U.first_name as user_first_name",
      //   "U.last_name as user_last_name",
      //   "U.employer_title as user_employer_title",
      // ]).where("chat_messages.group_id", groupId)
      //   .where("chat_messages.content_type", CHAT_CONTENT_TYPE.Text)
      //   .join("chat_groups as CG", "chat_messages.group_id", "CG.id")
      //   .leftJoin("users as U", "chat_messages.user_id", "U.id")
      //   .orderBy("chat_messages.created_at", "asc");
      const query = ChatMessagesModel.query().select([
          "chat_messages.*",
          "U.first_name as user_first_name",
          "U.last_name as user_last_name",
          "U.profile_picture as user_profile_picture",
          "U.acc_type as user_acc_type",
          "CP.company_name as user_company_name",
          "U.employer_title as user_employer_title",
          "U.employer_id as user_employer_id"
        ]).where("chat_messages.group_id", groupId)
          .join("chat_groups as CG", "chat_messages.group_id", "CG.id")
          .leftJoin("users as U", "chat_messages.user_id", "U.id")
          .leftJoin("company as CP", "U.company_id", "CP.id");
          
        return query.orderBy("chat_messages.created_at", "desc");
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getGroupChatDetailById(groupId: number): Promise<any> {
    try {
      const chatGroup = await ChatGroupsModel.query().select([
        "chat_groups.id",
        "chat_groups.type AS group_type",
        "chat_groups.group_nomal_type AS group_nomal_type",
        "chat_groups.ower_id as owner_id",
        "chat_groups.member_id",
        "chat_groups.company_id",
        "CP.company_profile_picture AS company_logo",
        "CP.company_name",
        "U.first_name AS member_first_name",
        "U.last_name AS member_last_name",
        "U.profile_picture AS member_profile_picture",
      ]).where("chat_groups.id", groupId)
        .leftJoin("users AS C", "C.id", "chat_groups.company_id")
        .leftJoin("company as CP", "C.company_id", "CP.id")
        .leftJoin("users AS U", "U.id", "chat_groups.member_id")
        .leftJoin("job_applicants AS A", "A.group_id", "chat_groups.id")
        .leftJoin("potential_candidates AS PC", "PC.chat_group_id", "chat_groups.id")
        .first();

      if(chatGroup){
        if(chatGroup["group_nomal_type"] == GROUP_NOMAL_TYPE.DM){
          const potentialsCandidate = await PotentialCandidatesModel.query().where("chat_group_id", chatGroup.id).first();
          if(potentialsCandidate) chatGroup["can_view_profile"] = potentialsCandidate.can_view_profile;
        }else{
          const jobApplicant = await JobApplicantsModel.query().where("group_id", chatGroup.id).first();
          if(jobApplicant) chatGroup["can_view_profile"] = jobApplicant.can_view_profile;
        }
        return chatGroup;
      }
      return null;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  // ------------- end admin--------------

  public async updateGroup(groupId: number, employerId: number, status: number, jobId: number, isAll: number): Promise<boolean> {
    try {
      if (isAll) {
        await ChatGroupsModel.query().where("company_id", employerId).where("job_id", jobId).update({ status });
      } else {
        const chatGroupObj = new ChatGroupsModel();
        chatGroupObj.status = status;
        chatGroupObj.id = groupId;
        chatGroupObj.company_id = employerId;
        await ChatGroupsModel.query().updateAndFetchById(groupId, chatGroupObj);
      }
      return true;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
}