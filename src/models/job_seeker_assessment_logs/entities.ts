export interface IJobSeekerAssessmentLogEntities {
  id: number;
  weight?: number;
  job_seeker_id: number;
  job_seeker_assessment_id: number;
  Status?: string; // 'In Progress, Complete, Test Left',
  TotalScore?: number;
  CandidateScore: number;
  CandidateEmailId: string;
  AttemptedOnUtc: string;
  ReportPDFUrl: string;
  TestInvitationId: number;
  PerformanceCategory: string;
  AttemptedOn: string;
}