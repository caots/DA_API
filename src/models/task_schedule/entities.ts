export default interface ITaskScheduleEntities {
  id: number;
  user_id?: number;
  subject_id?: number;
  type: number;
  status?: number;
  metadata?: string;
  created_at?: string;
  updated_at?: string;
}
