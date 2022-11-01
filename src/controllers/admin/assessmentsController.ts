import { ok } from "@src/middleware/response";
import AssessmentModel from "@src/models/assessments";
import UserModel from "@src/models/user";
import AssessmentsService from "@src/services/assessmentsService";
import HttpRequestUtils from "@src/utils/iMochaUtils";
import ExcelJS from 'exceljs';
import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
export default class AdminAssessmentsController {
  public async fetchTestsFromImocha(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req["currentUser"] as UserModel;
      const httpUtil = new HttpRequestUtils();
      const assessmentService = new AssessmentsService();
      // const results = await httpUtil.getTestList(1, 100);
      // const update = await Promise.all(
      //   results.tests.map(async (testImocha: ITestImocha) => {
      //     const testDetail = await httpUtil.getTestDetail(testImocha.testId);
      //     if (!testDetail) {
      //       return null;
      //     }
      //     const assessment = await assessmentService.addAssessment(testDetail);
      //     return assessment;
      //   }));
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile('./scripts/imocha-import.xlsx');
      const listAssessment = [];
      const workSheet = workbook.worksheets[0];
      workSheet.eachRow((row, rowNumber) => {
        console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
        const assessment = new AssessmentModel();
        // assement
        if (row.values[1] == 1162211) {
          debugger;
        }
        assessment.assessment_id = row.values[1];
        assessment.name = row.values[2];
        if (typeof row.values[3] != "string") {
          const des1 = get(row.values[3], "richText.0.text", "");
          const des2 = get(row.values[3], "richText.1.text", "");
          assessment.description = `${des1}${des2}`;
        } else {
          assessment.description = row.values[3];
        }
        assessment.questions = row.values[4];
        assessment.duration = row.values[5];
        assessment.category_name = row.values[6];
        listAssessment.push(assessment);
      });
      const update = await Promise.all(
        listAssessment.map(async (ass: AssessmentModel) => {

          const assessment = await assessmentService.addAssessmentFromExcel(ass);
          return assessment;
        }));
      return ok(update, req, res);
    } catch (err) {
      next(err);
    }
  }
}