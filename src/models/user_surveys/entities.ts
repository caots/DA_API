export default interface IUserSurveysEntities {
  id: number;
  title: string;
  description: string;
  type: number;
  created_at?: string;
  updated_at?: string;
  answers: string;
  full_answers: string;
  user_id: number;
}