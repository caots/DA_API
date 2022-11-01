import HttpException from "@src/middleware/exceptions/httpException";
import JobSeekerAssessmentsModel from "@src/models/job_seeker_assessments";
import JobSeekerAssessmentLogsModel from "@src/models/job_seeker_assessment_logs";
import { JOB_SEEKER_ASSESSMENT_LOG_STATUS } from './../config/index';
export default class JobSeekerAssessmentsService {

  public getJobsekkerAssessment(jobSeekerId: number, status = null): Promise<JobSeekerAssessmentsModel[]> {
    try {
      let query = JobSeekerAssessmentsModel.query()
        .select([
          "job_seeker_assessments.*",
          "assessments.category_id as assessments_category_id",
          "assessments.category_name as assessments_category_name",
          "assessments.name as assessments_name",
          "assessments.duration as assessments_duration",
          "assessments.questions as assessments_questions",
          "assessments.description as assessments_description",
        ])
        .where("job_seeker_assessments.is_deleted", 0)
        .where("job_seeker_assessments.job_seeker_id", jobSeekerId);
      if (status != null) {
        query.where("job_seeker_assessments.status", status);
      }
      query.where("assessments.status", "Active")
        .join("assessments", s => {
          s.on("job_seeker_assessments.assessment_type", "assessments.type")
            .andOn("job_seeker_assessments.assessment_id", "assessments.assessment_id")
        })
        .orderBy("job_seeker_assessments.created_at", "DESC");
      return query;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public getHistoryAssessment(jobSeekerId: number, assessmentId: number): Promise<JobSeekerAssessmentLogsModel[]> {
    try {
      let query = JobSeekerAssessmentLogsModel.query()
        .select([
          "JSAL.weight",
          "JSAL.AttemptedOnUtc",
          "JSAL.Status",
          "JSA.assessment_id",
        ])
        .alias('JSAL')
        .where("JSAL.job_seeker_id", jobSeekerId)
        .join("job_seeker_assessments as JSA", "JSA.id", "JSAL.job_seeker_assessment_id")
        .where("JSA.assessment_id", assessmentId)
        // .where("JSA.assessment_type", ASSESSMENTS_TYPE.IMocha)
        .where("JSAL.status", JOB_SEEKER_ASSESSMENT_LOG_STATUS.Complete)
        .orderBy("JSAL.AttemptedOnUtc", "DESC");
      return query;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async add(model: JobSeekerAssessmentsModel): Promise<JobSeekerAssessmentsModel> {
    try {
      const newAssessment = await JobSeekerAssessmentsModel.query().insert(model);
      return newAssessment;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async update(id, model: JobSeekerAssessmentsModel): Promise<JobSeekerAssessmentsModel> {
    try {
      const update = await JobSeekerAssessmentsModel.query().patchAndFetchById(id, model);
      return update;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findByTestInvitationId(testInvitationId: number): Promise<JobSeekerAssessmentsModel> {
    try {
      const jsa = new JobSeekerAssessmentsModel();
      jsa.current_testInvitationId = testInvitationId;
      const result = await JobSeekerAssessmentsModel.query().findOne(jsa);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findByAssessment(jobSeekerId: number, assessmentId: number, assessmentType: number): Promise<JobSeekerAssessmentsModel> {
    try {
      const jsa = new JobSeekerAssessmentsModel();
      jsa.job_seeker_id = jobSeekerId;
      jsa.assessment_id = assessmentId;
      jsa.assessment_type = assessmentType;
      const result = await JobSeekerAssessmentsModel.query().findOne(jsa);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findByLogJobseekerAssessment(TestInvitationId: number, Status: string, AttemptedOnUtc: string): Promise<JobSeekerAssessmentLogsModel> {
    try {
      const jsaLog = new JobSeekerAssessmentLogsModel();
      jsaLog.TestInvitationId = TestInvitationId;
      jsaLog.Status = Status;
      jsaLog.AttemptedOnUtc = AttemptedOnUtc;
      const result = await JobSeekerAssessmentLogsModel.query().findOne(jsaLog);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async findByJobSeekerAssessmentId(jobSeekerId: number, assessmentId: number, assessmentType: number): Promise<JobSeekerAssessmentsModel> {
    try {
      const jsa = new JobSeekerAssessmentsModel();
      jsa.job_seeker_id = jobSeekerId;
      jsa.assessment_id = assessmentId;
      jsa.assessment_type = assessmentType;
      const result = await JobSeekerAssessmentsModel.query().findOne(jsa);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  //================START JSA LOGS=================/
  public async addJsaLog(model: JobSeekerAssessmentLogsModel): Promise<JobSeekerAssessmentLogsModel> {
    try {
      const newAssessment = await JobSeekerAssessmentLogsModel.query().insert(model);
      return newAssessment;
    } catch (err) {
      return null
    }
  }
  public async getJsaLog(jsaId: number, jsId: number, status: string): Promise<JobSeekerAssessmentLogsModel> {
    try {
      const newAssessment = await JobSeekerAssessmentLogsModel.query()
        .where("job_seeker_assessment_id", jsaId)
        .where("job_seeker_id", jsId)
        .where("Status", status)
        .whereNotNull("ReportPDFUrl")
        .orderBy("AttemptedOnUtc", "desc").limit(1)
        ;
      return newAssessment[0];
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

}
