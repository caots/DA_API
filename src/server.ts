import "module-alias/register";
import app, { appSchedule } from "./app";
import inItSocket from "./chatModule/lib/socketio";
import config from "./config";
import { logger } from "./middleware";
import TaskScheduleService from "./services/TaskScheduleService";
const server = app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port} - env: ${process.env.NODE_ENV}`);
  console.log(`Server listening on port ${config.port} - env: ${process.env.NODE_ENV}`);
  logger.info(`DB name ${config.DB_NAME}`);
});
const ioSocket = global["io"] = inItSocket(server);

appSchedule.listen(config.portSchedule, () => {
  TaskScheduleService.config(ioSocket);
})
