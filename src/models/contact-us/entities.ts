export default interface IContactUsEntities {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  phone_country: string;
  type: number;
  institution: string;
  message: string;
  is_send_mail: boolean;
  created_at?: string;
  updated_at?: string;
}
