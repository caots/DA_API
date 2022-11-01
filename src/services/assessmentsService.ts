import { ChatMessagesModel } from "@src/chatModule/models";
import { ZoomService } from "@src/chatModule/service/room";
import { ASSESSMENTS_CUSTOM_QUESTION_ACTION, ASSESSMENTS_CUSTOM_QUESTION_TYPE, ASSESSMENTS_TYPE, ASSESSMENT_STATUS, CATEGORY_TYPE, PAGE_SIZE } from "@src/config";
import { logger } from "@src/middleware";
import HttpException from "@src/middleware/exceptions/httpException";
import AssessmentModel, { AssessmentCustomQuestionsModel } from "@src/models/assessments";
import { AssessmentCustomAnswers } from "@src/models/assessments/entities";
import CategoryAssessmentsModel from "@src/models/category_assessments";
import JobAssessmentsModel from "@src/models/job_assessments";
import { isSame } from "@src/utils/stringUtils";
import { ref, transaction } from "objection";
import { Server } from "socket.io";
export default class AssessmentsService {
  public async getMyAssessMents(jobseekerId: number = 0): Promise<any> {
    try {
      let query = AssessmentModel.query()
        .select([
          "assessments.*",
          "JSA.weight as job_seeker_assessments_weight",
          "JSA.status as job_seeker_assessments_status",
          "JSA.updated_at as job_seeker_assessments_time",
          "JSA.current_testInvitationId as job_seeker_assessments_current_testInvitationId",
          "JSA.current_testStatus as job_seeker_assessments_current_testStatus",
          "JSA.current_testUrl as job_seeker_assessments_current_testUrl",
          "JSA.totalTake as job_seeker_assessments_totalTake"
        ])
        .where("assessments.status", ASSESSMENT_STATUS.Active)
        query = query.join("job_seeker_assessments as JSA", s => {
          s.onIn("JSA.job_seeker_id", [jobseekerId])
            .andOn("JSA.assessment_type", "assessments.type")
            .andOn("JSA.assessment_id", "assessments.assessment_id")
            .andOnIn("JSA.is_deleted", [0]);
        });
      let orderArray = ["assessments.name", "asc"];
      query = query.where("JSA.weight", ">=", 0).andWhere("assessments.type", ASSESSMENTS_TYPE.IMocha);
      return query.orderBy(orderArray[0], orderArray[1])
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getAssessmentsUserStory(assessmentIds: number[]): Promise<any> {
    try {
      let query = AssessmentModel.query().select(["assessments.*"])
        if(assessmentIds.length > 0){
          query.whereIn("assessments.id", assessmentIds);
        }
      return query;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getAssessMents(
    categoryId: number = 0,
    jobseekerId: number = 0,
    status = ASSESSMENT_STATUS.Active,
    onlyViewMyAssessment = 0,
    q = "",
    // orderNo = 0,
    page = 0, pageSize = PAGE_SIZE.Standand,
    employerId = 0, isGetFromHomePage = 0, notInAssessmentIds = [], onlyValidated = 0
  ): Promise<any> {
    try {
      // if status = close => query status = active and expired < date.now
      let query = AssessmentModel.query().distinct([
          "assessments.*"
        ])
        .where("assessments.status", status)
        .join("category_assessments as CA", "CA.assessment_id", "assessments.id");
      // .leftJoin("job_categories as JL", "jobs.jobs_level_id", "JL.id")
      // .leftJoin("job_categories as JC", "assessments.category_id", "JC.id");
      if (jobseekerId > 0) {
        query = AssessmentModel.query().distinct(
          [
            "assessments.*",
            "JSA.weight as job_seeker_assessments_weight",
            "JSA.status as job_seeker_assessments_status",
            "JSA.updated_at as job_seeker_assessments_time",
            "JSA.current_testInvitationId as job_seeker_assessments_current_testInvitationId",
            "JSA.current_testStatus as job_seeker_assessments_current_testStatus",
            "JSA.current_testUrl as job_seeker_assessments_current_testUrl",
            "JSA.totalTake as job_seeker_assessments_totalTake"
          ]
        )
          .where("assessments.status", status)
          .join("category_assessments as CA", "CA.assessment_id", "assessments.id");
        if (onlyViewMyAssessment) {
          query = query.join("job_seeker_assessments as JSA", s => {
            s.onIn("JSA.job_seeker_id", [jobseekerId])
              .andOn("JSA.assessment_type", "assessments.type")
              .andOn("JSA.assessment_id", "assessments.assessment_id")
              .andOnIn("JSA.is_deleted", [0]);
          });
        } else {
          query = query.leftJoin("job_seeker_assessments as JSA", s => {
            s.onIn("JSA.job_seeker_id", [jobseekerId])
              .andOn("JSA.assessment_type", "assessments.type")
              .andOn("JSA.assessment_id", "assessments.assessment_id")
              .andOnIn("JSA.is_deleted", [0]);
          });
          // check category customer assessment
          query.whereRaw(`(assessments.type = ${CATEGORY_TYPE.IMOCHA} or ( assessments.type = ${CATEGORY_TYPE.CUSTOM} and JSA.job_seeker_id = ${jobseekerId} ))`);
        }
        // please remove skills which are validated from search page. It makes user confused
        // because we allow no actions on these skill and they display at top.
        // const jsaService = new JobSeekerAssessmentsService();
        // const jsaAssessment = await jsaService.getJobsekkerAssessment(jobseekerId);
        // // const jsaAssessmentReduce = jsaAssessment.map(jsa => {
        // //   return { assessment_id: jsa.assessment_id, assessment_type: jsa.assessment_type };
        // // });
        // const jsaAssessmentReduce = jsaAssessment.map(jsa => {
        //   return jsa.assessment_id;
        // });
        // if (jsaAssessment.length > 0 && jsaAssessmentReduce.length > 0) {
        //   query.whereNotIn("assessments.assessment_id", jsaAssessmentReduce);
        // }
        // query = query.where("assessments.type", ASSESSMENTS_TYPE.IMocha);
      }
      let orderArray = ["name", "asc"];
      if (jobseekerId && employerId) {
        orderArray = ["job_seeker_assessments_weight", "desc"];
      }
      if (notInAssessmentIds.length > 0) {
        query = query.whereNotIn("assessments.assessment_id", notInAssessmentIds);
      }
      if (onlyValidated) {
        query = query.where("JSA.weight", ">=", 0);
      }
      if (employerId) {
        query = query.where(builder =>
          builder.where("assessments.type", ASSESSMENTS_TYPE.IMocha)
            .orWhere("assessments.employer_id", employerId));
      }
      if (isGetFromHomePage) {
        query = query.where("assessments.type", ASSESSMENTS_TYPE.IMocha);
      }
      if (q) {
        query = query.where("assessments.name", "like", `%${q}%`);
      }
      if (categoryId) {
        query = query.where("CA.category_id", categoryId);
      }
      return query
        .orderBy(orderArray[0], orderArray[1])
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getCustomAssessMents(
    categoryId: number = 0,
    employerId: number = 0,
    status = '',
    q = "",
    page = 0, pageSize = PAGE_SIZE.Standand): Promise<any> {
    try {
      let query = AssessmentModel.query()
        .select([
          "assessments.*",
          JobAssessmentsModel.query().where("assessment_type", ref("assessments.type"))
            .where("assessment_id", ref("assessments.assessment_id")).count().as("total_job")
        ])
      if (q) {
        query = query.where("assessments.name", "like", `%${q}%`);
      }
      if (typeof status == 'number') {
        query = query.where("assessments.status", status);
      }
      if (categoryId) {
        query = query.where("assessments.category_id", categoryId);
      }
      if (employerId) {
        query = query.where("assessments.employer_id", employerId);
      }
      return query
        .orderBy('name', 'asc')
        .page(page, pageSize);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async addAssessment(testImochaDetail) {
    try {
      const assessment = new AssessmentModel();
      assessment.type = ASSESSMENTS_TYPE.IMocha;
      assessment.assessment_id = testImochaDetail.testId;
      const objectUpdate = {
        name: testImochaDetail.testName,
        questions: testImochaDetail.questions,
        duration: testImochaDetail.duration
      } as AssessmentModel;
      const currentAsm = await AssessmentModel.query().findOne(assessment);
      objectUpdate.status = testImochaDetail.status;
      // UPDATE
      if (currentAsm) {
        // Object.assign(currentAsm, objectUpdate);
        return AssessmentModel.query().updateAndFetchById(currentAsm.id, objectUpdate);
      }
      Object.assign(assessment, objectUpdate);
      const newAssessment = await AssessmentModel.query().insert(assessment);
      return newAssessment;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async addAssessmentFromExcel(assessment: AssessmentModel, status = "Active") {
    try {
      const currentAsm = await AssessmentModel.query().findOne({ type: ASSESSMENTS_TYPE.IMocha, assessment_id: assessment.assessment_id });
      assessment.status = status;
      assessment.type = ASSESSMENTS_TYPE.IMocha;;
      // UPDATE
      if (currentAsm) {
        return AssessmentModel.query().updateAndFetchById(currentAsm.id, assessment);
      }
      const newAssessment = await AssessmentModel.query().insert(assessment);
      return newAssessment;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async createCustomAssessment(customAssessment: AssessmentModel, questions: AssessmentCustomQuestionsModel[]) {
    try {
      const scrappy = await transaction(AssessmentModel, AssessmentCustomQuestionsModel, async (assessmentModel, assessmentCustomQuestionsModel) => {
        let newAssessment = await assessmentModel.query().insert(customAssessment);
        newAssessment = await assessmentModel.query().updateAndFetchById(newAssessment.id, { assessment_id: newAssessment.id });
        // add category assessments (category_id = 1)
        await this.addCategoryAssessments(newAssessment.id);  
        if (!questions || questions.length == 0) { return; }
        const query = await Promise.all(
          questions.map(async (obj: AssessmentCustomQuestionsModel) => {
            obj.assessment_custom_id = newAssessment.id;
            obj.answers = this.genAnswers(obj);
            return assessmentCustomQuestionsModel.query().insert(obj);
          }));
      });
      return scrappy;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async updateCustomAssessment(customAssessmentId: number, customAssessment: AssessmentModel, questions: AssessmentCustomQuestionsModel[]) {
    try {
      const scrappy = await transaction(AssessmentModel, AssessmentCustomQuestionsModel, async (assessmentModel, assessmentCustomQuestionsModel) => {
        const updateAssessment = await assessmentModel.query().updateAndFetchById(customAssessmentId, customAssessment);
        if (!questions || questions.length == 0) { return; }
        const query = await Promise.all(
          questions.map(async (obj: AssessmentCustomQuestionsModel) => {
            const questionUpdate = new AssessmentCustomQuestionsModel();
            questionUpdate.title = obj.title;
            questionUpdate.title_image = obj.title_image;
            questionUpdate.answers = this.genAnswers(obj);
            questionUpdate.full_answers = obj.full_answers;
            questionUpdate.type = obj.type;
            questionUpdate.weight = obj.weight;
            questionUpdate.assessment_custom_id = updateAssessment.id;
            if (obj.type == ASSESSMENTS_CUSTOM_QUESTION_TYPE.CheckBoxes) {
              questionUpdate.is_any_correct = obj.is_any_correct;
            }
            switch (obj.action) {
              case ASSESSMENTS_CUSTOM_QUESTION_ACTION.Add:
                return assessmentCustomQuestionsModel.query().insert(questionUpdate);
              case ASSESSMENTS_CUSTOM_QUESTION_ACTION.Remove:
                return assessmentCustomQuestionsModel.query().deleteById(obj.id);
              default:
                return assessmentCustomQuestionsModel.query().updateAndFetchById(obj.id, questionUpdate);
            }
          }));
      });
      return scrappy;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async deleteCustomAssessment(customAssessmentId: number) {
    try {
      const nbrJobAssessment = await JobAssessmentsModel.query().where("assessment_type", ASSESSMENTS_TYPE.Custom)
        .where("assessment_id", customAssessmentId).limit(1);
      if (nbrJobAssessment && nbrJobAssessment.length > 0) { throw new HttpException(500, "Assessment is existed in job."); }
      const scrappy = await transaction(AssessmentModel, AssessmentCustomQuestionsModel,
        async (assessmentModel, assessmentCustomQuestionsModel) => {
          await assessmentCustomQuestionsModel.query().delete().where("assessment_custom_id", customAssessmentId);
          await assessmentModel.query().delete().where("assessment_id", customAssessmentId).where("type", ASSESSMENTS_TYPE.Custom);
        });
      return scrappy;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public async getAssessmentDetail(assessmentId: number, type: number, employerId = 0) {
    try {
      const assessmentModel = new AssessmentModel();
      assessmentModel.assessment_id = assessmentId;
      assessmentModel.type = type;
      if (employerId) {
        assessmentModel.employer_id = employerId;
      }
      return AssessmentModel.query().findOne(assessmentModel);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async addCategoryAssessments(assessmentId: number) {
    try {
      const data = {
        assessment_id: assessmentId,
        category_id: 1
      } as CategoryAssessmentsModel;
      return CategoryAssessmentsModel.query().insert(data);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getQuestionList(assessmentId: number, isSelectFullAnswer = false) {
    try {
      let selects = [
        "id",
        "assessment_custom_id",
        "title",
        "title_image",
        "type",
        "answers",
        "weight",
        "is_any_correct",
        "created_at",
        "updated_at",
      ];
      if (isSelectFullAnswer) {
        selects.push("full_answers");
      }
      return AssessmentCustomQuestionsModel.query().select(selects).where('assessment_custom_id', assessmentId);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  genAnswers(question: AssessmentCustomQuestionsModel) {
    try {
      let rightAnswersArr = [];

      if (question.type == ASSESSMENTS_CUSTOM_QUESTION_TYPE.SingleTextBox) {
        return '';
      }
      try {
        rightAnswersArr = JSON.parse(question.full_answers) as AssessmentCustomAnswers[];
      } catch (e) {
        logger.error(e);
      }
      const answer = rightAnswersArr.map((obj) => {
        const fullA = {
          id: obj.id,
          answer: obj.answer,
        } as AssessmentCustomAnswers;
        return fullA;
      });
      return JSON.stringify(answer);
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }
  public checkIsCorrectAnswer(userAnswer: any[], question: AssessmentCustomQuestionsModel) {
    if (!userAnswer) { return false; }
    const fullAnswer = JSON.parse(question.full_answers) as any[];
    let correctAnswer;
    switch (question.type) {
      case ASSESSMENTS_CUSTOM_QUESTION_TYPE.MULTIPLE_CHOICE:
        correctAnswer = fullAnswer.find(x => x.is_true);
        if (!correctAnswer || correctAnswer.id != userAnswer[0]) { return false; }
        return true;
      case ASSESSMENTS_CUSTOM_QUESTION_TYPE.TrueFalse:
        correctAnswer = fullAnswer.find(x => x.is_true);
        if (!correctAnswer || correctAnswer.id != userAnswer[0]) { return false; }
        return true;
      case ASSESSMENTS_CUSTOM_QUESTION_TYPE.CheckBoxes:
        correctAnswer = fullAnswer.filter(x => x.is_true) as any[];
        if (!correctAnswer || userAnswer.length == 0) { return false; }
        let nbrCorrect = 0;
        userAnswer.forEach((x: number) => {
          const isTrue = correctAnswer.some((y: any) => y.id == x);
          if (isTrue) { nbrCorrect = nbrCorrect + 1; }
        });
        // check is_any_correct
        if (nbrCorrect > 0 && question.is_any_correct) { return true; }
        // end
        if (!correctAnswer || correctAnswer.length != userAnswer.length) { return false; }
        if (nbrCorrect == correctAnswer.length) { return true; }
        return false;
      case ASSESSMENTS_CUSTOM_QUESTION_TYPE.SingleTextBox:
        const isTrue = fullAnswer.some((y: any) => {
          return isSame(y.answer, userAnswer[0])
        });
        return isTrue;
    }
    return false;
  }
  public calcWeightAssessmentCustom(answers: Answer[], questions: AssessmentCustomQuestionsModel[]) {
    let weight = 0;
    answers.forEach((answer: Answer) => {
      const question = questions.find((x => x.id == answer.question_id));
      const isCorrect = this.checkIsCorrectAnswer(answer.answer, question);
      if (question && isCorrect) {
        weight = weight + question.weight;
      }
    })
    return weight;
  }

  public async sendMessageToJobseeker(data) {
    try {
      const io = global["io"] as Server;
      const messageModel = new ChatMessagesModel();
      messageModel.content = data.content;
      messageModel.content_html = data.content_html;
      messageModel.content_type = data.content_type;
      messageModel.group_id = data.group_id;
      messageModel.user_id = data.current_user.id;
      messageModel.mime_type = data.mime_type;
      const result = await ChatMessagesModel.query().insert(messageModel);
      data.message_id = result.id;
      io.to(`${data.group_id}`).emit("send_message_to_client", data);
      const zoomService = new ZoomService(null, null);
      zoomService.createOrUpdateReadMessage(messageModel.group_id, messageModel.user_id, messageModel.id);
    } catch (e) {
      console.error(e);
    }
  }

  // -------------------------------------------------------------
  // Start get locations Feature

}
export interface Answer {
  question_id: number;
  answer: any[]
}
