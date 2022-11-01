import config, { SIGN_UP_STEP, URL_IMOCHA } from "@src/config";
import { logger } from "@src/middleware";
import { IAssessmentInvitation } from "@src/models/job_seeker_assessments/entities";
import UserModel from "@src/models/user";
import axios, { AxiosInstance } from "axios";
import { get } from "lodash";
import moment from "moment";
export default class IMochaUtils {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: config.IMOCHA_API_URL,
      timeout: 20000,
      headers: { "x-api-key": `${config.IMOCHA_API_KEY}` }
    });
    this.instance.interceptors.response.use((response: any) => {
      // Any status code that lie within the range of 2xx cause this function to trigger
      // Do something with response data
      return response.data;
    }, (error: any) => {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      // Do something with response error
      const errorImocha = get(error, "response.data.errors", []);
      logger.error("errorImocha:" + JSON.stringify(errorImocha.toString()));
      // console.log(errorImocha);
      // console.log(errorImocha.toString());
      return Promise.reject(error);
    });
  }
  public async getTestList(pageNo = 1, pageSize = 10): Promise<{ tests: [], count: number }> {
    try {
      const results = await this.instance.get("/tests", {
        params: {
          pageNo,
          pageSize
        },
        timeout: 120000
      }) as any;
      return results;
    } catch (err) {
      throw err;
    }
  }
  public async getTestDetail(testId: number): Promise<any> {
    try {
      const results = await this.instance.get(`/tests/${testId}`) as any;
      return results;
    } catch (err) {
      throw err;
    }
  }
  public async getTestPreview(testId: number): Promise<any> {
    try {
      let results = await this.instance.get(`/tests/${testId}/preview`) as any;
      const newUrl = results.testPreviewUrl.replace(URL_IMOCHA.ORIGIN_URL, URL_IMOCHA.PREVIEW_ASSESSMENT_URL);
      results = { ...results, testPreviewUrl: newUrl };
      return results;
    } catch (err) {
      throw err;
    }
  }
  public async inviteTest(testId: number, user: UserModel, redirectUrl = ""): Promise<IAssessmentInvitation> {
    try {
      redirectUrl = (user && user.sign_up_step != SIGN_UP_STEP.Completed)
        ? `${config.WEBSITE_URL}` :
        (redirectUrl ? redirectUrl : `${config.WEBSITE_URL}/job-seeker-assessments`);
      const fullname = config.NODE_ENV != "prod" ? `${user.first_name} ${user.last_name} [${config.NODE_ENV}]` : `${user.first_name} ${user.last_name}`;
      const body = {
        email: user.email,
        name: fullname,
        callbackUrl: `${config.API_CALLBACK_IMOCHA_URL}`,
        redirectUrl,
        disableMandatoryFields: 0,
        hideInstruction: 1,
        sendEmail: "no",
        stakeholderEmails: "disable"
      };
      console.log(JSON.stringify(body));
      const results = await this.instance.post(`/tests/${testId}/invite`, body) as any;
      return results;
    } catch (err) {
      throw err;
    }
  }
  public async reattempt(testInvitationId: number, user: UserModel, redirectUrl = ""): Promise<IAssessmentInvitation> {
    try {
      // timezone utc0
      const startDateTime = moment.utc().format();
      const endDateTime = moment.utc().add(365, "d").format();
      redirectUrl = (user && user.sign_up_step != SIGN_UP_STEP.Completed)
        ? `${config.WEBSITE_URL}/job-seeker-settings` :
        (redirectUrl ? redirectUrl : `${config.WEBSITE_URL}/job-seeker-assessments`);
      const results = await this.instance.post(`/invitations/${testInvitationId}/reattempt`, {
        StartDateTime: startDateTime,
        EndDateTime: endDateTime,
        TimeZoneId: 1200,
        CallbackUrl: `${config.API_CALLBACK_IMOCHA_URL}`,
        RedirectUrl: redirectUrl
      }) as any;
      return results;
    } catch (err) {
      const errorImocha = get(err, "response.data.errors", []);
      logger.error("errorImocha:" + JSON.stringify(errorImocha.toString()));
      // Reattempt is not allowed on Test invitation id which is in pending, inprogress, expired or cancelled state
      if (errorImocha.toString().includes("id which is in pending, inprogress, expired or cancelled state")) {
        return { isFalse: true } as any;
      }
      throw err;
    }
  }
}