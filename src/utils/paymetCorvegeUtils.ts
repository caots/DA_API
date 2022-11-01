import config from "@src/config";
import { COMMON_ERROR } from "@src/config/message";
import { logger } from "@src/middleware";
import HttpException from "@src/middleware/exceptions/httpException";
import { IPaymentCardEntities, IPaymentConvergeLogEntities } from "@src/models/payments/entities";
import axios, { AxiosInstance } from "axios";
import { clone, get } from "lodash";
import convert from "xml-js";
export default class ConvergeUtils {
  private instance: AxiosInstance;
  private defaultObject = {
    txn: {
      ssl_vendor_id: config.CONVERGE_SSL_VENDOR_ID,
      ssl_merchant_id: config.CONVERGE_MERCHANT_ID,
      ssl_user_id: config.CONVERGE_USER_ID,
      ssl_pin: config.CONVERGE_PIN,
    }
  }
  opxml2js = { ignoreComment: true, alwaysChildren: true, compact: true };
  opjs2xml = { ignoreAttributes: true, compact: true, ignoreComment: true, spaces: 0 };
  constructor() {
    this.instance = axios.create({
      baseURL: config.CONVERGE_API_URL,
      timeout: 20000,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      // headers: { 'Content-Type': 'xml' }
    });
    this.instance.interceptors.response.use((response: any) => {
      // Any status code that lie within the range of 2xx cause this function to trigger
      // Do something with response data
      return response.data;
    }, (error: any) => {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      // Do something with response error
      const errorImocha = get(error, "response.data.errors", []);
      logger.error("errorConverge:" + JSON.stringify(errorImocha.toString()));
      return Promise.reject(error);
    });
  }
  public async getCardDetail(sslToken: string): Promise<IPaymentCardEntities> {
    try {
      const js = clone(this.defaultObject);
      Object.assign(js.txn, {
        ssl_token: sslToken,
        ssl_transaction_type: "ccquerytoken"
      });
      let xml = convert.js2xml(js, this.opjs2xml);
      xml = `xmldata=${xml}`;
      const results = await this.instance.post("", xml) as any;
      const result = convert.xml2js(results, this.opxml2js); // or convert.xml2json(xml, options)
      // console.log(result);
      const errorMessage = get(result, "txn.errorMessage._text", "");
      if (errorMessage) { throw { message: errorMessage } };
      return this._mapCardDetail(result);
    } catch (err) {
      throw err;
    }
  }
  public async payment(sslToken: string, amount: number): Promise<IPaymentConvergeLogEntities> {
    try {
      amount = Math.round(amount * 100) / 100;
      const js = clone(this.defaultObject);
      Object.assign(js.txn, {
        ssl_token: sslToken,
        ssl_amount: amount,
        ssl_transaction_type: "ccsale"
      });
      let xml = convert.js2xml(js, this.opjs2xml);
      xml = `xmldata=${xml}`;
      // const xml2 = "xmldata=<txn><ssl_merchant_id>0021507</ssl_merchant_id><ssl_user_id>apiuser</ssl_user_id><ssl_pin>MQC538YHVJ7ABKNHKPYIKSU6QLHALGQOHWS0CNIVJ1NWLKK02Y9X09DCCUGPOO5D</ssl_pin><ssl_token>5551976044662124</ssl_token><ssl_amount>123</ssl_amount><ssl_transaction_type>ccsale</ssl_transaction_type></txn>";
      let results = await this.instance.post("", xml) as any;
      // error
      // results = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<txn><ssl_merchant_initiated_unscheduled>N</ssl_merchant_initiated_unscheduled><ssl_issuer_response>15</ssl_issuer_response><ssl_card_number>42**********4242</ssl_card_number><ssl_departure_date></ssl_departure_date><ssl_result>1</ssl_result><ssl_txn_id>220721A44-ABDECD5E-C236-44F6-BD7A-035BB9854484</ssl_txn_id><ssl_avs_response>U</ssl_avs_response><ssl_approval_code>      </ssl_approval_code><ssl_amount>14.14</ssl_amount><ssl_txn_time>07/22/2021 08:22:06 PM</ssl_txn_time><ssl_description>Job seeker</ssl_description><ssl_exp_date>1224</ssl_exp_date><ssl_card_short_description>VISA</ssl_card_short_description><ssl_get_token></ssl_get_token><ssl_completion_date></ssl_completion_date><ssl_token_response>SUCCESS</ssl_token_response><ssl_customer_code></ssl_customer_code><ssl_card_type>CREDITCARD</ssl_card_type><ssl_transaction_type>SALE</ssl_transaction_type><ssl_salestax></ssl_salestax><ssl_account_balance>0.00</ssl_account_balance><ssl_result_message>INVALID CARD</ssl_result_message><ssl_invoice_number></ssl_invoice_number><ssl_cvv2_response></ssl_cvv2_response><ssl_token>4047472616044242</ssl_token><ssl_partner_app_id>01</ssl_partner_app_id></txn>';
      // 
      logger.info(`PAYMENT sslToken: ${sslToken}`);
      logger.info(`${JSON.stringify(results)}`);
      logger.info(`---------------------------`);

      const result = convert.xml2js(results, this.opxml2js); // or convert.xml2json(xml, options)
      console.log(result['txn']);
      const errorMessage = get(result, "txn.errorMessage._text", "");
      if (errorMessage) { throw { message: errorMessage } };
      // 0: success, 1: fail
      const sslResult = get(result, "txn.ssl_result._text", "0");
      const resultMessage = get(result, "txn.ssl_result_message._text", "");
      if (sslResult == '1') { throw { message: resultMessage } };
      return this._mapTransaction(result);
    } catch (err) {
      logger.error(`payment XML ${JSON.stringify(err)}`);
      // throw err;
      const message = err.message || COMMON_ERROR.internalServerError
      throw new HttpException(400, message);
    }
  }
  public async getTransactionToken(obj): Promise<any> {
    try {
      obj = Object.assign(
        {ssl_vendor_id: config.CONVERGE_SSL_VENDOR_ID,
        ssl_merchant_id: config.CONVERGE_MERCHANT_ID,
        ssl_user_id: config.CONVERGE_USER_ID,
        ssl_pin: config.CONVERGE_PIN}, obj)
        console.log('getTransactionToken');
        console.log(obj);
      const url = `${config.CONVERGE_HOST_PAYMENT}/transaction_token?${this._convertObjectToQuery(obj)}`;
      let results = await axios.post(url, null) as any;
      console.log(results.data);
      return results.data;
    } catch (err) {
      console.log(`getTransactionToken error ${JSON.stringify(err)}`);
      // throw err;
      const message = err.message || COMMON_ERROR.internalServerError
      throw new HttpException(400, message);
    }
  }
  private _mapTransaction(result: any) {
    const obj = {
      ssl_merchant_initiated_unscheduled: this.getValue(result, "ssl_merchant_initiated_unscheduled"),
      ssl_issuer_response: this.getValue(result, "ssl_issuer_response"),
      ssl_card_number: this.getValue(result, "ssl_card_number"),
      ssl_departure_date: this.getValue(result, "ssl_departure_date"),
      ssl_oar_data: this.getValue(result, "ssl_oar_data"),
      ssl_result: this.getValue(result, "ssl_result"),
      ssl_txn_id: this.getValue(result, "ssl_txn_id"),
      ssl_avs_response: this.getValue(result, "ssl_avs_response"),
      ssl_approval_code: this.getValue(result, "ssl_approval_code"),
      ssl_amount: this.getValue(result, "ssl_amount"),
      ssl_txn_time: this.getValue(result, "ssl_txn_time"),
      ssl_exp_date: this.getValue(result, "ssl_exp_date"),
      ssl_card_short_description: this.getValue(result, "ssl_card_short_description"),
      ssl_get_token: this.getValue(result, "ssl_get_token"),
      ssl_completion_date: this.getValue(result, "ssl_completion_date"),
      ssl_token_response: this.getValue(result, "ssl_token_response"),
      ssl_card_type: this.getValue(result, "ssl_card_type"),
      ssl_transaction_type: this.getValue(result, "ssl_transaction_type"),
      ssl_cvm_signature_override_result: this.getValue(result, "ssl_cvm_signature_override_result"),
      ssl_account_balance: this.getValue(result, "ssl_account_balance"),
      ssl_ps2000_data: this.getValue(result, "ssl_ps2000_data"),
      ssl_result_message: this.getValue(result, "ssl_result_message"),
      ssl_invoice_number: this.getValue(result, "ssl_invoice_number"),
      ssl_cvv2_response: this.getValue(result, "ssl_cvv2_response"),
      ssl_token: this.getValue(result, "ssl_token"),
      ssl_partner_app_id: this.getValue(result, "ssl_partner_app_id"),
    } as IPaymentConvergeLogEntities;
    return obj;
  }
  private _mapCardDetail(result: any) {
    const obj = {
      ssl_token: this.getValue(result, "ssl_token"),
      ssl_account_number: this.getValue(result, "ssl_account_number"),
      ssl_exp_date: this.getValue(result, "ssl_exp_date"),
      ssl_card_type: this.getValue(result, "ssl_card_type"),
      ssl_company: this.getValue(result, "ssl_company"),
      ssl_customer_id: this.getValue(result, "ssl_customer_id"),
      ssl_first_name: this.getValue(result, "ssl_first_name"),
      ssl_last_name: this.getValue(result, "ssl_last_name"),
      ssl_avs_address: this.getValue(result, "ssl_avs_address"),
      ssl_address2: this.getValue(result, "ssl_address2"),
      ssl_avs_zip: this.getValue(result, "ssl_avs_zip"),
      ssl_city: this.getValue(result, "ssl_city"),
      ssl_state: this.getValue(result, "ssl_state"),
      ssl_country: this.getValue(result, "ssl_country"),
      ssl_phone: this.getValue(result, "ssl_phone"),
      ssl_email: this.getValue(result, "ssl_email"),
      ssl_description: this.getValue(result, "ssl_description"),
      ssl_user_id: this.getValue(result, "ssl_user_id"),
      ssl_result: this.getValue(result, "ssl_result"),
      ssl_token_response: this.getValue(result, "ssl_token_response"),
      ssl_token_provider: this.getValue(result, "ssl_token_provider"),
      ssl_token_format: this.getValue(result, "ssl_token_format"),
    } as IPaymentCardEntities;
    return obj;
  }
  getValue(result, property: string) {
    const value = get(result, `txn.${property}._text`, "") as string;
    return value;
  }
  private _convertObjectToQuery(obj) {
    let query = '';
    for (let key in obj) {
      if (obj[key] !== undefined) {
        if (query) {
          query += `&${key}=${obj[key]}`;
        } else {
          query += `${key}=${obj[key]}`;
        }
      }
    }
    return query;
  }
}