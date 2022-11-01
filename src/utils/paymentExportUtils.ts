import config, { ACCOUNT_TYPE, FolderPath, PAYMENT_TYPE } from "@src/config";
import logger from "@src/middleware/logger";
import BillingSettingEmployerModel from "@src/models/employer_billing_settings";
import { UserBillingInfoModel } from "@src/models/payments";
import { IEmployerPaymentHistoryEntities, IJobSeekerPaymentHistoryEntities } from "@src/models/payments/entities";
import UserModel from '@src/models/user/index';
import ejs from "ejs";
import excel from "exceljs";
import pdf from "html-pdf";
import { max } from "lodash";
import path from "path";
import { promisify } from "util";
import ImageUtils from "./image";

export default class PaymentExportUtils {
  public async exportJobSeekerBillingHistoryExcel(data: IJobSeekerPaymentHistoryEntities[], fileName: string): Promise<string> {
    try {
      let workbook = new excel.Workbook();
      const template = "jobseeker-billing-history-template.xlsx";
      workbook = await workbook.xlsx.readFile(path.join(__dirname, "../../template/", template));
      const worksheet = workbook.getWorksheet("billing");
      let lengthDescription = [];
      data.forEach((item) => {
        const length = item.description.split("\n").map(x => x.length);
        lengthDescription = lengthDescription.concat(length);
        const row = Object.values(item);
        worksheet.addRow(row);
      });

      const maxWidth = max(lengthDescription);
      const rowHeightDefault = 15;
      const firstTableRowNum = 4;
      const lastTableRowNum = worksheet.lastRow.number;
      worksheet.getColumn("C").width = maxWidth;
      for (let i = firstTableRowNum; i <= lastTableRowNum; i++) {
        const numberOfJob = data[i - firstTableRowNum].description.split("\n").length;
        worksheet.getRow(i).height = numberOfJob * rowHeightDefault;
      }

      const fileOuputPath = path.join(__dirname, `../..${FolderPath.uploadDraftPath}/`, `${fileName}.xlsx`);
      await workbook.xlsx.writeFile(fileOuputPath);
      return `${FolderPath.uploadDraftPath}/${fileName}.xlsx`;
    } catch (err) {
      logger.error(`Error when export excel file: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  public async exportEmployerBillingHistoryExcel(data: IEmployerPaymentHistoryEntities[], fileName: string): Promise<string> {
    try {
      let workbook = new excel.Workbook();
      const template = "employer-billing-history-template.xlsx";
      workbook = await workbook.xlsx.readFile(path.join(__dirname, "../../template/", template));
      const worksheet = workbook.getWorksheet("billing");
      let firstTableRowNum = 5;
      data.forEach((item) => {
        const numberRowMerge = item.description.length - 1;
        item.description.forEach((job) => {
          const objRow = {
            bill_date: item.bill_date,
            title: job.title,
            standard_duration: job.standard_duration,
            standard_price: job.standard_price,
            featured_duration: job.featured_duration,
            featured_price: job.featured_price,
            posting_price: job.posting_price,
            payment_method: item.payment_method,
            total: item.total
          }
          const row = Object.values(objRow);
          worksheet.addRow(row);
        })
        worksheet.mergeCells(`A${firstTableRowNum}:A${firstTableRowNum + numberRowMerge}`);
        worksheet.mergeCells(`H${firstTableRowNum}:H${firstTableRowNum + numberRowMerge}`);
        worksheet.mergeCells(`I${firstTableRowNum}:I${firstTableRowNum + numberRowMerge}`);
        firstTableRowNum += numberRowMerge + 1;
      });

      const fileOuputPath = path.join(__dirname, `../..${FolderPath.uploadDraftPath}/`, `${fileName}.xlsx`);
      await workbook.xlsx.writeFile(fileOuputPath);
      return `${FolderPath.uploadDraftPath}/${fileName}.xlsx`;
    } catch (err) {
      logger.error(`Error when export excel file: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  public async exportBillingHistoryPDF(data: any[], fileName: string, userType: number, user: UserModel = null): Promise<string> {
    try {
      let templatePath = "";
      const apiUrl = config.API_BASE_URL;
      if (userType === ACCOUNT_TYPE.JobSeeker) {
        templatePath = path.join(__dirname, "../../template/jobseeker-billing-history.ejs");
      } else if (userType === ACCOUNT_TYPE.Employer) {
        templatePath = path.join(__dirname, "../../template/employer-billing-history.ejs");
      }

      const html = await ejs.renderFile(templatePath, {
        payments: data,
        user,
        apiUrl
      }, { async: true });

      const options = {
        height: "11.25in",
        width: "1180",
        header: {
          height: "10mm",
        },
        footer: {
          height: "20mm",
        },
      };

      const fileOuputPath = path.join(__dirname, `../..${FolderPath.uploadDraftPath}/`, `${fileName}.pdf`);
      const createResult = pdf.create(html, options);
      await promisify(createResult.toFile).bind(createResult)(fileOuputPath);
      return `${FolderPath.uploadDraftPath}/${fileName}.pdf`;
    } catch (err) {
      logger.error(`Error when export pdf file: ${JSON.stringify(err)}`);
      throw err;
    }
  }
  public async exportPaymentReceiptPDF(payment: any, fileName: string, user: UserModel = null, billingInfo: UserBillingInfoModel, setting: BillingSettingEmployerModel): Promise<string> {
    try {
      const templatePath = path.join(__dirname, "../../template/invoiceReceipt.ejs");
      const logoUrl = `${config.S3_URL}logo-employer.jpg`;
      const response = {
        payment,
        user,
        setting,
        logoUrl,
        billingInfo,
        ACCOUNT_TYPE_CONST: ACCOUNT_TYPE,
        PAYMENT_TYPE_CONST: PAYMENT_TYPE
      };
      const html = await ejs.renderFile(templatePath, response , { async: true });
      const options = {
        // height: "18.25in",
        // width: "1300",
        format: "A4",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid
        orientation: "portrait", // portrait or landscape
        header: {
          height: "13mm",
          contents: `<div style="padding-right: 26px;line-height: 12px"><p style="text-align: right; line-height: 12px;color: #555;font-size: 10px;margin-bottom: 0;font-family: "Avenir-Roman", sans-serif;">Receipt Number: ${payment.id}</p><p style="text-align: right; line-height: 12px;color: #555;font-size: 10px;font-family: "Avenir-Roman", sans-serif;">Date: ${payment.bill_date}</p></div>`
        },
        paginationOffset: 1,
        footer: {
          height: "10mm",
          contents: {
            default: '<p style="color: #222; padding: 0 0.5cm; font-size: 10px;margin-bottom: 0; margin-left: 0;font-family: "Avenir-Roman", sans-serif;">For questions regarding this trasnsaction please email <a href="mailto:billing@measuredskills.com">billing@measuredskills.com</a><span style="float: right;color: #72777C;">Page {{page}} of {{pages}}</span></p>'
          }
        },
      };
      const fileOuputPath = path.join(__dirname, `../..${FolderPath.uploadDraftPath}/`, `${fileName}`);
      const createResult = pdf.create(html, options);
      await promisify(createResult.toFile).bind(createResult)(fileOuputPath);
      // return `${FolderPath.uploadDraftPath}/${fileName}`;
      const imageUltis = new ImageUtils();
      return imageUltis.uploadToS3(fileOuputPath, fileName, 'application/pdf');
    } catch (err) {
      logger.error(`Error when export pdf file: ${JSON.stringify(err)}`);
      return '';
    }
  }
}
