import config, { ACCOUNT_TYPE, EMPLOYMENT_TYPE } from "@src/config";
import JobsModel from "@src/models/jobs";
import UserModel, { UserSubcribesModel } from "@src/models/user";
import ejs from "ejs";
import fs from "fs";
import nodemailer from "nodemailer";
const EMAIL_TYPE = {
  USER: 1,
  SUBSCRIBE: 2
}
export default class MailUtils {
  private transporter: any;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.MAIL_HOST,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.MAIL_USERNAME || "AKIAYNIC7LEIRNHRBMEG", // generated ethereal user
        pass: config.MAIL_PASSWORD || "BKhIzz15ygI/LfuTDXCiQK2EigsnfwDKUR5XrT20DfEM", // generated ethereal password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  // 1
  public activeAccount(email: string, token: string, isEmployerMember = false, user: UserModel = null) {
    try {
      const subject = isEmployerMember ? "Delegate account - Invitation email" : "MeasuredSkills Sign up Confirmation";
      const fileTemplate = isEmployerMember ? "activeEmployerMemberAccount" : "activeAccount";
      return new Promise((resolve, reject) => {
        // const data = await ejs.renderFile(__dirname + "/test.ejs", { name: 'Stranger' });
        const url = isEmployerMember
          ? `${config.WEBSITE_URL}/complete-delegate-account?token=${encodeURIComponent(token)}&type=set-password`
          : `${config.WEBSITE_URL}/active-account?token=${encodeURIComponent(token)}`;
        const response = this._getCommonResponse(email, url, user.acc_type, user);
        if (isEmployerMember) {
          response.userName = user.first_name;
          response.companyName = user.company_name;
        }
        ejs.renderFile(`./template/${fileTemplate}.ejs`, response, async (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          const result = await this.sendMail({
            from: config.MAIL_FROM_ADDRESS,
            to: email, subject,
            html: data
          });
          resolve(result);
        });
      });
    } catch (error) {
      throw error;
    }
  }
  // 2
  public forgotPassword(email: string, token: string, isAdmin: boolean = false, accountType = ACCOUNT_TYPE.JobSeeker,
    isOwner = true, user: UserModel = null) {
    try {
      const subject = "Reset your MeasuredSkills Password";
      let url = "";
      if (isAdmin) {
        url = `${config.ADMIN_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;
      } else {
        url = `${config.WEBSITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
      }
      console.log(config.MAIL_USERNAME);
      console.log(config.MAIL_PASSWORD);
      const response = this._getCommonResponse(email, url, accountType, user);
      response['ownerTitle'] = `${isOwner ? 'You have requested' : 'The primary account holder is requiring you'} to reset your password for MeasuredSkills. `;
      return new Promise((resolve, reject) => {
        ejs.renderFile("./template/forgotPassword.ejs", response, async (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          const result = await this.sendMail({
            from: config.MAIL_FROM_ADDRESS, to: email, subject, html: data
          });
          resolve(result);
        });
      });
    } catch (error) {
      throw error;
    }
  }
  // 3
  public changedPassword(email: string, user: UserModel) {
    try {
      const subject = "MeasuredSkills Password Changed";
      const response = this._getCommonResponse(email, "", user.acc_type, user);
      return new Promise((resolve, reject) => {
        ejs.renderFile("./template/changedPassword.ejs", response, async (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          const result = await this.sendMail({
            from: config.MAIL_FROM_ADDRESS,
            to: email, subject,
            html: data
          });
          resolve(result);
        });
      });
    } catch (error) {
      throw error;
    }
  }

  // 14 & 15
  public confirmationSignupToUpdate(email: string, accountType: number) {
    try {
      const subject = `Confirmation of Signup for MeasuredSkills Updates`;
      const mainUrl = `${config.WEBSITE_URL}/register?accType=${accountType}`;
      const response = this._getCommonResponse(email, mainUrl, accountType);
      response.contactUsUrl = `${config.WEBSITE_URL}/contact`;
      return new Promise((resolve, reject) => {
        ejs.renderFile("./template/confirmationSignupToUpdate.ejs", response, async (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          const result = await this.sendMail({
            from: config.MAIL_FROM_ADDRESS,
            to: email, subject,
            html: data
          });
          resolve(result);
        });
      });
    } catch (error) {
      throw error;
    }
  }
  
  public changeEmail(email: string, token: string) {
    try {
      const subject = "MeasuredSkills Verify your new email";
      return new Promise((resolve, reject) => {
        fs.readFile("./template/changeEmail.html", "utf8", async (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          data = data.replace(/{Email}/g, email);
          data = data.replace(/{Url}/g, `${config.WEBSITE_URL}/change-email?token=${encodeURIComponent(token)}`);
          const result = await this.sendMail({
            from: config.MAIL_FROM_ADDRESS,
            to: email, subject,
            html: data,
          });
          resolve(result);
        });
      });
    } catch (error) {
      throw error;
    }
  }

  
  private async sendMail(params: {
    from?: string, to: string, subject: string, html: any, attachments?: Array<any>, emailType?: number
  }) {
    const { from = config.MAIL_FROM_ADDRESS, to, subject, html, attachments = [], emailType = null } = params
    try {
      if (EMAIL_TYPE.USER == emailType) {
        if ((await UserModel.query().where({ email: to, is_subscribe: 1 })).length <= 0)
          return;
      }
      else if (EMAIL_TYPE.SUBSCRIBE == emailType) {
        if ((await UserSubcribesModel.query().where({ email: to, is_subscribe: 1, status: 1 })).length <= 0)
          return;
      }
      const objectSendmail = {
        from,
        to, // list of receivers
        subject, // Subject line
        // text: "Hello world?"
        // , // plain text body
        html,
        ...attachments.length > 0 && { attachments }
      }
      const info = await this.transporter.sendMail(objectSendmail);
      console.log("Message sent: %s", info);
      return info;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  private _getCommonResponse(recipientEmail: string, mainUrl: string, accountType: number, user: UserModel = null): ResponseEmailModel {
    const currentYear = new Date().getFullYear();
    const partUnsubcribeUrl = user
      ? user.acc_type == ACCOUNT_TYPE.JobSeeker
        ? `/job-seeker-profile/profile`
        : `/employer-profile/profile`
      : `/unsubcribe?email=${recipientEmail}&type=${accountType}`;
    const ACCOUNT_TYPE_CONST = ACCOUNT_TYPE;
    const EMPLOYMENT_TYPE_CONST = EMPLOYMENT_TYPE;
    const logoUrl = `${config.S3_URL}${accountType == ACCOUNT_TYPE.JobSeeker ? 'logo-jobseeker.png' : 'logo-employer.jpg'}`
    return {
      recipientEmail,
      mainUrl,
      accountType,
      ACCOUNT_TYPE_CONST,
      EMPLOYMENT_TYPE_CONST,
      urlUnsubcribe: `${config.WEBSITE_URL}${partUnsubcribeUrl}`,
      websiteUrl: config.WEBSITE_URL,
      currentYear,
      logoUrl,
      user
    };
  }
}
export interface ResponseEmailModel {
  recipientEmail: string;
  mainUrl: string;
  accountType: number;
  ACCOUNT_TYPE_CONST: any;
  EMPLOYMENT_TYPE_CONST: any;
  urlUnsubcribe: string;
  websiteUrl: string;
  currentYear: number;
  logoUrl: string;
  // Optional
  user?: UserModel
  jobTitle?: string;
  companyName?: string;
  userName?: string;
  unreadMessage?: number;
  jobs?: JobsModel[];
  contactUsUrl?: string;
  nbrRetake?: number;
  // end Optional
}
