import socketio from "socket.io";
import { ChatService } from "../service/chat";
import { ZoomService } from "../service/room";
import { EMIT_EVENT, ZOOM_NAME } from "./config";
// socket.io handlers
const socket = (server: any) => {
  const io = socketio(server);
  io.on("connection", (socket: socketio.Socket) => {
    // const eventHandlers = [
    //   // foo(app, socket),
    //   // bar(app, socket)
    // ];
    // // Bind events to handlers
    // eventHandlers.forEach(handler => {
    //   handler.forEach(eventName => {
    //     socket.on(eventName, handler[eventName]);
    //   });
    // });

    // Keep track of the socket
    // app.allSockets.push(socket);
    // function listen message send from client and post message to all client
    socket.on("connected", (data: any) => {
    });
    const zoomService = new ZoomService(io, socket);
    socket.on(EMIT_EVENT.JoinAllZoom, (userId: number) => {
      if (!userId) {
        return;
      }
      if (!socket.rooms[`${ZOOM_NAME.TakeAssessment}${userId}`]) {
        console.log(`join ${ZOOM_NAME.TakeAssessment}${userId}`);
        socket.join(`${ZOOM_NAME.TakeAssessment}${userId}`);
      }
      if (!socket.rooms[`${ZOOM_NAME.InviteJoinZoom}${userId}`]) {
        console.log(`join ${ZOOM_NAME.InviteJoinZoom}${userId}`);
        socket.join(`${ZOOM_NAME.InviteJoinZoom}${userId}`);
      }
      if (!socket.rooms[`${ZOOM_NAME.Notification}${userId}`]) {
        console.log(`join ${ZOOM_NAME.Notification}${userId}`);
        socket.join(`${ZOOM_NAME.Notification}${userId}`);
      }
      zoomService.joinAllGroup(userId);
    });
    socket.on(EMIT_EVENT.AdminJoinAllZoom, () => {
      zoomService.joinAllGroup(0, true);
    });
    socket.on(EMIT_EVENT.JoinZoom, (id) => {
      if (!id) { return; }
      if (!socket.rooms[`${id}`]) {
        console.log(`join ${id}`);
        socket.join(`${id}`);
      }
    });

    const chatService = new ChatService(io, socket);
    chatService.onMessage();
    chatService.seenMessage();
    chatService.receivedMessage();
    chatService.onRequestUnmark();
    chatService.onJoinGroup();
  });
  return io;
};
export default socket;
