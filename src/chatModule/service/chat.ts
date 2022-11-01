import { logger } from "@src/middleware";
import { Server, Socket } from "socket.io";
import { ChatMessagesModel } from "../models";
import { ZoomService } from "./room";

export class ChatService {
  public io: Server;
  public socket: Socket;
  constructor(ioLib: Server, socketLib: Socket) {
    this.io = ioLib;
    this.socket = socketLib;
  }
  public onMessage() {
    this.socket.on("send_message", data => {
      this.saveMessage(data);
    });
  }
  public seenMessage() {
    this.socket.on("seen_message", data => {
      this.readMessage(data);
    });
  }
  public receivedMessage() {
    this.socket.on("received_message", data => {
      this.io.to(data.group_id).emit("received_message_to_client", data);
    });
  }
  public onRequestUnmark() {
    this.socket.on("request_unmark", data => {
      this.io.to(data.group_id).emit("request_unmark_update", data);
    });
  }
  public onJoinGroup() {
    this.socket.on("join_group", data => {
      this.joinToGroup(data);
      if (!this.socket.rooms[`${data.group_id}`]) {
        this.socket.join(`${data.group_id}`);
      }
    });
  }
  private async saveMessage(data) {
    try {
      const messageModel = new ChatMessagesModel();
      messageModel.content = data.content;
      messageModel.content_type = data.content_type;
      messageModel.group_id = data.group_id;
      messageModel.user_id = data.current_user.id;
      messageModel.mime_type = data.mime_type;
      messageModel.content_html = data.content_html;
      const result = await ChatMessagesModel.query().insert(messageModel);
      data.message_id = result.id;
      this.io.to(`${data.group_id}`).emit("send_message_to_client", data);
      const zoomService = new ZoomService(null, null);
      zoomService.createOrUpdateReadMessage(messageModel.group_id, messageModel.user_id, messageModel.id);
    } catch (e) {
      console.error(e);
    }
  }
  private async readMessage(data) {
    try {
      const zoomService = new ZoomService(null, null);
      if (!data.group_id || typeof (data.updated_user_id) != "number" || !data.message_id) {
        return;
      }
      const readMessage = await zoomService.createOrUpdateReadMessage(data.group_id, data.updated_user_id, data.message_id);
      logger.info("readMessage: " + JSON.stringify(readMessage));
      this.io.to(data.group_id).emit("seen_message_to_client", data);
    } catch (e) {
      console.error(e);
    }
  }
  private async joinToGroup(data) {
    try {
      const zoomService = new ZoomService(null, null);
      if (!data.group_id || !data.user_id) {
        return;
      }
      const result = await zoomService.addToGroup(data.group_id, data.user_id);
      logger.info("joinToGroup: " + JSON.stringify(result));
    } catch (e) {
      console.error(e);
    }
  }
}