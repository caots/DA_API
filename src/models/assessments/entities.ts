import { AssessmentCustomQuestionsModel } from ".";

export interface IAssessmentEntities {
  id: number;
  name?: string;
  assessment_id: number;
  category_id?: number;
  category_name?: string;
  type?: number;
  status?: string;
  description?: string;
  instruction?: string;
  duration?: number;
  questions?: number;
  employer_id?: number;
  format: string;
  //not map
  questionList?: AssessmentCustomQuestionsModel[];
}
export interface ITestImocha {
  testId: number;
  testName: string;
  status: string;
}
export interface IAssessmentCustomQuestionEntities {
  id: number;
  assessment_custom_id: number;
  title: string;
  type: number;
  answers: string;
  full_answers: string;
  weight?: number;
  //not map
  action: string;
  title_image?: string;
  is_any_correct?: number
}
export interface AssessmentCustomAnswers {
  id: number;
  answer: string;
  is_true?: number;
}