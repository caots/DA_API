export const ZOOM_NAME = {
  Chat: "CHAT_", // CHAT_[UserId]
  TakeAssessment: "TAKE_ASSESSMENT_USER_", // user_id
  InviteJoinZoom: "INVITE_JOIN_ZOOM_", // user_id
  Notification: "NOTIFICATION_" // user_id
};
export const EMIT_EVENT = {
  OnReceiveNotification: "ON_RECEIVED_NOTIFICATION",
  OnReceiveAsmResult: "ON_RECEIVED_ASSESSMENT_RESULT",
  OnReceiveInviteJoinZoom: "ON_RECEIVED_INVITE_JOIN_ZOOM",
  JoinAllZoom: "JOIN_ALL_ZOOM",
  AdminJoinAllZoom: "ADMIN_JOIN_ALL_ZOOM",
  JoinZoom: "JOIN_ZOOM",
};
export const CHAT_CONTENT_TYPE = {
  Text: 0,
  Image: 1,
  File: 2,
  Complex: 3
};
export const CHAT_GROUP_STATUS = {
  All: 0,
  Active: 1,
  Archived: 2
};
// export const SEARCH_GROUP_TYPE = {
//   All: "all",
//   Inbox: "inbox",
//   Archived: "archived",
// };
export const GROUP_TYPE = {
  Support: 0, // admin to user
  Nomal: 1
  // Applicant: 1, // employer to applicant
  // Potential: 2 // employer to applicant
};
export const GROUP_NOMAL_TYPE = {
  Nomal: 0,
  DM: 1
  // Applicant: 1, // employer to applicant
  // Potential: 2 // employer to applicant
};
export const CHAT_REPORT_TYPE = {
  Inappropriate: 1,
  Suspectedfraud: 2,
  Applicantisimeronating: 3,
  Other: 4
};
export const AVATAR_DEFAULT = {
  Employer: "/uploads/avatar-template/employer_default.png",
  JobSeeker: "/uploads/avatar-template/jobseeker_default.jpg"
}