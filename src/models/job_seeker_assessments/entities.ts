export interface IJobSeekerAssessmentEntities {
  id: number;
  weight?: number;
  job_seeker_id: number;
  assessment_id?: number;
  assessment_type?: number;
  status?: number;
  totalTake?: number;
  current_testInvitationId?: number;
  current_testUrl?: string;
  current_testStatus?: string;
  is_deleted: boolean;
  do_exam_at: string;
}
export interface IAssessmentInvitation {
  testInvitationId: number;
  testUrl: string;
  callbackUrlRegistered?: string;
  redirectUrlRegistered?: string;

  jobSeekerAssessment?: any;  // not map
  isFalse?: boolean;  // not map
  isOld?: boolean;  // not map
}