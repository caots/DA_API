import { logger } from "@src/middleware";
import { PhoneNumberUtil } from "google-libphonenumber";
export default class PhoneNumberUtils {
  private phoneNumberUtil: PhoneNumberUtil;

  constructor() {
    this.phoneNumberUtil = PhoneNumberUtil.getInstance();
  }
  public phoneNumberValidator(phone_number: string, regionCode: string = "US") {
    let validNumber = false;
    if (phone_number === "" || phone_number === null) {
      return true;
    }

    try {
      const phoneNumber = this.phoneNumberUtil.parseAndKeepRawInput(phone_number, regionCode);
      validNumber = this.phoneNumberUtil.isValidNumber(phoneNumber);
    } catch (e) {
      logger.error(e);
      return false;
    }
    return validNumber;
  }
  public getCountryCode(phone_number: string, regionCode: string = "US") {
    try {
      const phoneNumber = this.phoneNumberUtil.parseAndKeepRawInput(phone_number, regionCode);
      const code = phoneNumber.getCountryCode();
      return `+${code}`;
    } catch (e) {
      return null;
    }
  }
}