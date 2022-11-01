
export interface IChatMessagesEntities {
  id: number;
  user_id: number;
  group_id: number;
  last_seen?: string;
  content?: string;
  content_type?: number;
  deleted_at?: string;
  mime_type?: string;
  content_html?: string;
}
export interface IChatGroupsEntities {
  id: number;
  name?: string;
  type: number;
  ower_id?: number;
  job_id?: number; // if job = 0 is direct messsage
  member_id?: number;
  company_id?: number;
  deleted_at?: string;
  status?: number;
  group_nomal_type: number;
}
export interface IChatGroupMembersEntities {
  id: number;
  group_id: number;
  member_id: number;
  member_type?: number;
}
export interface IGroupInfoEntities {
  groupInfo: IChatGroupsEntities;
  messages: {
    results: any[],
    total: number
  };
  // jobSeeker?: UserModel;
  // employer?: UserModel;
}
export interface IChatReadMessageEntities {
  id: number;
  user_id?: number;
  group_id?: number;
  message_id?: number;
}