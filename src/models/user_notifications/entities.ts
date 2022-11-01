export default interface IUserNotificationEntities {
  id?: number;
  user_id: number;
  user_acc_type: number;
  type: number;
  metadata?: string;
  is_read?: number;
  is_sent_mail?: number;
  sent_mail_status?: number;
  created_at?: string;
  updated_at?: string;
}
