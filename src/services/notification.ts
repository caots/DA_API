import { EMIT_EVENT, ZOOM_NAME } from "@src/chatModule/lib/config";
import { TASKSCHEDULE_STATUS, TASKSCHEDULE_TYPE } from "@src/config";
import JobsModel from "@src/models/jobs";
import TaskScheduleModel from "@src/models/task_schedule";
import UserModel from "@src/models/user";
import UserNotificationModel from "@src/models/user_notifications";
import { NotificationRepository } from "@src/repositories/notificationRepository";
import { TaskScheduleRepository } from "@src/repositories/taskScheduleRepository";
import { Server } from "socket.io";

export default class NotificationService {
  private notificationRps: NotificationRepository;
  constructor() {
    this.notificationRps = new NotificationRepository(UserNotificationModel);
  }

  public async insert(args: { data: UserNotificationModel, socketIo?: Server, isPushNotification?: boolean }): Promise<UserNotificationModel> {
    let { data, socketIo, isPushNotification = true } = args;
    data = await UserNotificationModel.query().insert(data)

    if (isPushNotification) {
      const io = socketIo == null ? global["io"] as Server : socketIo;
      const zoom = `${ZOOM_NAME.Notification}${data.user_id}`;
      const event = EMIT_EVENT.OnReceiveNotification;
      console.log("zoom: ", zoom);
      console.log("event: ", event);
      io.to(zoom).emit(event, data);
    }
    return data;
  }
  public getListByUserId(userId: number, page = 0, pageSize: number = 6, is_read = -1): Promise<any> {
    var query = UserNotificationModel.query()
      .where({
        ...is_read == -1 ? {} : { is_read },
        user_id: userId
      })
      .page(page, pageSize)
      .orderBy('id', 'desc');
    //console.log(query.toSql())
    return query.execute();
  }

  public markRead(userId: number, ids: Array<number>): Promise<Array<UserNotificationModel> | UserNotificationModel> {
    return new Promise(async (resolve, reject) => {
      if (ids.length <= 0) {
        reject("ids not empty");
        return;
      }
      let results = await UserNotificationModel.query().where({ user_id: userId, is_read: 0 }).whereIn('id', ids).where(function () { this.where({ is_read: 0 }).orWhere({ is_read: null }) });
      if (results.length > 0) {
        await UserNotificationModel.query().update({ is_read: 1 }).where({ user_id: userId }).whereIn('id', ids)
        resolve(ids.length == 1 ? results[0] : ids.length > 1 ? results : null);
      }
      else {
        reject("Record not exists.");
      }
    })
  }
  public async addJobTrigger(jobId: number, userId: number): Promise<any> {
    let job: JobsModel = (await JobsModel.query().where('id', jobId))[0];

    if (job == null)
      throw ("job is not exists");

    let user: UserModel = (await UserModel.query().where({ id: userId }))[0];
    if (user == null) throw ('user not exists.')
    let currentTask: TaskScheduleModel = (await TaskScheduleModel.query().where({
      'user_id': userId,
      'subject_id': jobId,
      'status': TASKSCHEDULE_STATUS.NotRun,
      'type': TASKSCHEDULE_TYPE.ReminderCompleteApplication
    }))[0];
    if (currentTask == null)
      await TaskScheduleModel.query().insert({
        user_id: userId,
        subject_id: jobId,
        type: TASKSCHEDULE_TYPE.ReminderCompleteApplication,
        metadata: JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            acc_type: user.acc_type,
            first_name: user.first_name,
            last_name: user.last_name,
          },
          jobDetails: {
            id: job.id,
            title: job.title,
            add_urgent_hiring_badge: job.add_urgent_hiring_badge,
            city_name: job.city_name,
            state_name: job.state_name,
            expired_at: job.expired_at,
          }
        })
      })
    else {
      await new TaskScheduleRepository(TaskScheduleModel).update(currentTask.id.toString(), currentTask);
    }
  }
  public async total(userId: number): Promise<any> {
    return await UserNotificationModel.raw(`
    select
      sum(case when user_notifications.is_read = 0 then 1 else 0 end) as total_unread,
      sum(case when user_notifications.is_read = 1 then 1 else 0 end) as total_read,
      count(user_notifications.id) as total
    from user_notifications
    where user_notifications.user_id = ${userId}
    `)
  }

}