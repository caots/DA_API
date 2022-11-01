import { ACCOUNT_TYPE } from "@src/config";
import Joi from "joi";
import moment from "moment";
export default class MsValidate {
  private joi: Joi.AnySchema;
  // constructor() {}
  public validateSignup(signupObj: any) {
    const object = {
      password: Joi.string().min(6)
        // .max(30)
        .required(),
      email: Joi.string()
        .email({ minDomainSegments: 2 }),
      phone_number: Joi.string().allow(""),
      region_code: Joi.string().max(5).required(),
      acc_type: Joi.number().max(1).required()
      // ,
      // verified_code: Joi.string().min(4).max(4).required()

    };
    return this.setUpJoi(object, signupObj);
  }

  public validateSignupPotentials(signupObj: any) {
    const object = {
      email: Joi.string()
        .email({ minDomainSegments: 2 }),
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
      categories: Joi.array(),
    };
    return this.setUpJoi(object, signupObj);
  }

  public validateEmployerMemberInvite(signupObj: any) {
    const object = {
      email: Joi.string()
        .email({ minDomainSegments: 2 }),
      first_name: Joi.string().max(25).required(),
      last_name: Joi.string().max(25).required(),
      employer_title: Joi.string().max(25).required(),
      permissions: Joi.array().min(1)
    };
    return this.setUpJoi(object, signupObj);
  }
  public validateEmployerMemberUpdate(signupObj: any) {
    const object = {
      // email: Joi.string()
      //   .email({ minDomainSegments: 2 }),
      first_name: Joi.string().max(25).required(),
      last_name: Joi.string().max(25).required(),
      employer_title: Joi.string().max(25).required(),
      permissions: Joi.array().min(1)
    };
    return this.setUpJoi(object, signupObj);
  }
  public validateChangePass(signupObj: any) {
    const object = {
      oldPassword: Joi.string().min(6)
        .required(),
      newPassword: Joi.string().min(6)
        .required()

    };
    return this.setUpJoi(object, signupObj);
  }
  public validateCheckMail(signupObj: any) {
    const object = {
      email: Joi.string()
        .email({ minDomainSegments: 2 })
    };
    return this.setUpJoi(object, signupObj);
  }
  public validateSendCode(codeObject) {
    const object = {
      region_code: Joi.string()
        .required()
      ,
      phone_number: Joi.string()
        .required()
    };
    return this.setUpJoi(object, codeObject);
  }

  public updateInfoCompany(userUpdate: any) {
    const object = {
      email: Joi.string().email({ minDomainSegments: 2 }),
      company_name: Joi.string().required(),
      description: Joi.string().allow(""),
      profile_picture: Joi.string().allow(""),
      city_name: Joi.string().allow(""),
      state_name: Joi.string().allow(""),
      employer_company_photo: Joi.string().allow(""),
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
      company_size_max: Joi.any(),
      is_crawl: Joi.any(),
      company_size_min: Joi.any(),
      employer_revenue_min: Joi.any(),
      employer_revenue_max: Joi.any(),
      employer_industry: Joi.string().allow(""),
      employer_year_founded: Joi.string().allow(""),
      employer_ceo_name: Joi.string().allow(""),
      employer_company_url: Joi.string().allow(""),
      employer_company_twitter: Joi.string().allow(""),
      employer_company_facebook: Joi.string().allow(""),
      address_line: Joi.string().allow(""),
    };
    return this.setUpJoi(object, userUpdate);
  }

  public validateUpdateUser(accountType = ACCOUNT_TYPE.JobSeeker, userUpdate: any) {
    const object = {
      email: Joi.string().email({ minDomainSegments: 2 }),
      address_line: Joi.string().allow(""),
      profile_picture: Joi.string().allow(""),
      city_name: Joi.string().allow(""),
      state_name: Joi.string().allow(""),
      note: Joi.string(),
      is_user_potentials: Joi.string(),
      category_user_potentials: Joi.string(),
      phone_number: Joi.string().allow(""),
      region_code: Joi.string().max(5),
      zip_code: Joi.string().allow(""),
      first_name: Joi.string().max(25).required(),
      last_name: Joi.string().max(25).required(),
      sign_up_step: Joi.number().allow(null),
      is_subscribe: Joi.number().allow(null),
    };
    const addionalObj = accountType === ACCOUNT_TYPE.JobSeeker ? {
      asking_salary: Joi.string().allow(""),
      asking_benefits: Joi.string().allow(""),
      date_of_birth: Joi.date().allow(""),
      asking_salary_type: Joi.number().allow(null),
      enable_show_avatar: Joi.number().allow(null)
    } : {
      employer_title: Joi.string().allow(""),
      company_name: Joi.string().allow(""),
      company_size_max: Joi.number().allow(null).allow(""),
      company_size_min: Joi.number().allow(null).allow(""),
      description: Joi.string().allow(""),
    };
    Object.assign(object, addionalObj);
    return this.setUpJoi(object, userUpdate);
  }
  public validateUpdateProfile(userUpdate: any) {
    const object = {
      description: Joi.string().allow(""),
      company_size_max: Joi.number().allow(null).allow(""),
      company_size_min: Joi.number().allow(null).allow(""),
      employer_industry: Joi.string().allow(""),
      employer_revenue_min: Joi.number().allow(null),
      employer_revenue_max: Joi.number().allow(null),
      employer_year_founded: Joi.string().allow(""),
      employer_company_photo: Joi.string().allow(""),
      employer_ceo_name: Joi.string().allow(""),
      employer_ceo_picture: Joi.string().allow(""),
      employer_company_url: Joi.string().allow(""),
      employer_company_twitter: Joi.string().allow(""),
      employer_company_facebook: Joi.string().allow(""),
      address_line: Joi.string().allow(""),
      city_name: Joi.string().allow(""),
      state_name: Joi.string().allow(""),
      company_name: Joi.string().allow(""),
      company_profile_picture: Joi.string().allow(""),
      sign_up_step: Joi.number().allow(null)
    };
    return this.setUpJoi(object, userUpdate);
  }
  public validateCreateJobs(jobs: any) {
    if (jobs.featured_start_date) {
      jobs.featured_start_date = moment.utc(jobs.featured_start_date).format("YYYY-MM-DD HH:mm:ss");
    }
    if (jobs.featured_end_date) {
      jobs.featured_end_date = moment.utc(jobs.featured_end_date).format("YYYY-MM-DD HH:mm:ss");
    }
    const joiJobsObject = {
      title: Joi.string().required(),
      salary: Joi.number().allow(null),
      desciption: Joi.string().allow(null),
      benefits: Joi.string().allow(null),
      jobs_level_id: Joi.number().allow(null),
      jobs_category_ids: Joi.number(),
      nbr_open: Joi.number().allow(null),
      employer_id: Joi.number(),
      city_name: Joi.string().allow(""),
      state_name: Joi.string().allow(""),
      expired_days: Joi.number().allow(null),
      status: Joi.number(),
      is_make_featured: Joi.number().allow(null),
      featured_start_date: Joi.string().allow(null),
      featured_end_date: Joi.string().allow(null),
      salary_type: Joi.number().allow(null),
      bonus: Joi.string().allow(''),
      job_fall_under: Joi.string().allow(''),
      percent_travel: Joi.number().allow(null),
      specific_percent_travel_type: Joi.number().allow(null),
      schedule_job: Joi.string().allow(''),
      add_urgent_hiring_badge: Joi.number().allow(null),
      is_private: Joi.number().allow(null),
      employment_type: Joi.number().allow(null),
      salary_min: Joi.number().allow(null),
      salary_max: Joi.number().allow(null),
      proposed_conpensation: Joi.number().allow(null),
    };
    return this.setUpJoi(joiJobsObject, jobs);
  }
  public validateUpdateHotJobOrPrivate(jobs: any, isPrivate = 0) {
    if (jobs.featured_start_date && jobs.featured_start_date.length > 0) {
      jobs.featured_start_date = moment.utc(jobs.featured_start_date).format("YYYY-MM-DD HH:mm:ss");
    }
    if (jobs.featured_end_date && jobs.featured_end_date.length > 0) {
      jobs.featured_end_date = moment.utc(jobs.featured_end_date).format("YYYY-MM-DD HH:mm:ss");
    }
    const joiJobsObject = !isPrivate ? {
      is_make_featured: Joi.number().allow(null),
      featured_start_date: Joi.string().allow(null),
      featured_end_date: Joi.string().allow(null),
      add_urgent_hiring_badge: Joi.number().allow(null)
    } : {
      private_applicants: Joi.number().allow(null)
    };
    return this.setUpJoi(joiJobsObject, jobs);
  }
  public validateUpgradeJob(jobs: any) {
    if (jobs.featured_start_date && jobs.featured_start_date.length > 0) {
      jobs.featured_start_date = moment.utc(jobs.featured_start_date).format("YYYY-MM-DD HH:mm:ss");
    }
    if (jobs.featured_end_date && jobs.featured_end_date.length > 0) {
      jobs.featured_end_date = moment.utc(jobs.featured_end_date).format("YYYY-MM-DD HH:mm:ss");
    }
    const joiJobsObject = {
      id: Joi.number(),
      expired_days: Joi.number().allow(null),
      is_make_featured: Joi.number().allow(null),
      featured_start_date: Joi.string().allow(null),
      featured_end_date: Joi.string().allow(null),
      add_urgent_hiring_badge: Joi.number().allow(null),
      expired_at: Joi.string().allow(null)
    };
    return this.setUpJoi(joiJobsObject, jobs);
  }
  public validateCreateJobAssessments(jobAssessments: any) {
    const service = {
      point: Joi.number().required(),
      assessment_id: Joi.number().required(),
      assessment_type: Joi.number()
    };
    this.joi = Joi.array().items(service);
    return this.joi.validateAsync(jobAssessments);
  }
  public validateReportCompany(object: any) {
    const joiObject = {
      company_id: Joi.number().required(),
      reporter_id: Joi.number(),
      type_fraud: Joi.boolean(),
      type_wrongOrMisleadingInformation: Joi.boolean(),
      type_harrassingTheApplicants: Joi.boolean(),
      type_other: Joi.boolean(),
      note: Joi.string()
    };
    return this.setUpJoi(joiObject, object);
  }
  public validateApplicant(object: any) {
    const joiObject = {
      job_sekker_id: Joi.number().required(),
      employer_id: Joi.number().required(),
      job_id: Joi.number().required(),
      status: Joi.number(),
      asking_salary: Joi.number().allow(null),
      asking_salary_type: Joi.number().allow(null),
      asking_benefits: Joi.string().allow(""),
      bookmarked: Joi.boolean(),
      date_picking: Joi.date(),
      note: Joi.string().allow(""),
      total_point: Joi.number().greater(-1),
      assessments_result: Joi.string().allow("")
    };
    return this.setUpJoi(joiObject, object);
  }

  public validateJobSeekerSystemBillingSettings(object: any) {
    const objectSchema = Joi.object({
      name: Joi.string().required(),
      num_retake: Joi.number().greater(0).required(),
      price: Joi.number().greater(0).required()
    });
    const joiObject = {
      is_enable_free_assessment: Joi.number().required(),
      free_assessment_validation: Joi.number().min(0).required().allow(null),
      nbr_referral_for_one_validation: Joi.number().min(0).required(),
      standard_validation_price: Joi.number().greater(0).required(),
      top_up: Joi.array().items(objectSchema).default([])
    };
    return this.setUpJoi(joiObject, object);
  }

  public validateEmployerSystemBillingSettings(object: any) {
    const objectSchema = Joi.object({
      name: Joi.string().required(),
      num_dm: Joi.number().greater(0).required(),
      price: Joi.number().greater(0).required()
    });
    const joiObject = {
      standard_price: Joi.number().greater(0).required(),
      featured_price: Joi.number().greater(0).required(),
      urgent_hiring_price: Joi.number().greater(0).required(),
      private_job_price: Joi.number().greater(0).required(),
      free_direct_message: Joi.number().min(0).required(),
      standard_direct_message_price: Joi.number().greater(0).required(),
      topup_credit: Joi.array().items(objectSchema).default([])
    };
    return this.setUpJoi(joiObject, object);
  }

  public validateAdminUser(updateObj: any) {
    const joiObject = {
      first_name: Joi.string().max(25).required(),
      last_name: Joi.string().max(25).required(),
      permission: Joi.array().min(1).required()
    };
    return this.setUpJoi(joiObject, updateObj);
  }

  public validateInviteAdminUser(obj: any) {
    const joiObject = {
      first_name: Joi.string().max(25).required(),
      last_name: Joi.string().max(25).required(),
      email: Joi.string().email({ minDomainSegments: 2 }),
      permission: Joi.array().min(1).required()
    };
    return this.setUpJoi(joiObject, obj);
  }

  public validateCustomAssessment(custom: any) {
    const joiObject = {
      name: Joi.string().required(),
      type: Joi.number(),
      status: Joi.string().allow(null),
      description: Joi.string().allow(null).allow(''),
      instruction: Joi.string().allow(null).allow(''),
      duration: Joi.number().allow(null),
      questions: Joi.number(),
      employer_id: Joi.number(),
      format: Joi.string().allow(null)
    };
    return this.setUpJoi(joiObject, custom);
  }
  public validateCustomAssessmentQuestion(questions: any) {
    const joiObject = {
      id: Joi.number(),
      action: Joi.string().allow(null).allow(''),
      assessment_custom_id: Joi.number().allow(null),
      title: Joi.string().required(),
      type: Joi.number(),
      is_any_correct: Joi.number().allow(null),
      answers: Joi.string().allow(null).allow(''),
      full_answers: Joi.string().allow(null),
      weight: Joi.number().allow(null),
      title_image: Joi.string().allow(null).allow(''),

    };
    this.joi = Joi.array().items(joiObject);
    return this.joi.validateAsync(questions);
  }
  private setUpJoi(objectInit: any, objectUpdate: any) {
    this.joi = Joi.object(objectInit);
    delete objectUpdate["g-recaptcha-response"];
    return this.joi.validateAsync(objectUpdate);
  }
  public validateSignupSubcribe(signupObj: any) {
    const object = {
      email: Joi.string()
        .email({ minDomainSegments: 2 }),
      acc_type: Joi.number().max(3).required(),
      first_name: Joi.string().max(25).allow(''),
      last_name: Joi.string().max(25).allow(''),
    };
    return this.setUpJoi(object, signupObj);
  }
  public validateUnsubcribe(signupObj: any) {
    const object = {
      email: Joi.string()
        .email({ minDomainSegments: 2 }),
      reason_unsubcribe: Joi.string().max(250).allow(''),
      reason_unsubcribe_type: Joi.number().max(4).required().min(1),
    };
    return this.setUpJoi(object, signupObj);
  }
  public validateDelegateAccount(userUpdate: any) {
    const object = {
      // email: Joi.string().email({ minDomainSegments: 2 }),
      profile_picture: Joi.string().allow(""),
      password: Joi.string().min(6).required(),
      first_name: Joi.string().max(25).required(),
      last_name: Joi.string().max(25).required(),
      phone_number: Joi.string().allow(""),
      region_code: Joi.string().max(5).allow(""),
      employer_title: Joi.string().allow('')
    };
    return this.setUpJoi(object, userUpdate);
  }
  public validateCreateCoupon(object: any) {
    const joiObject = {
      code: Joi.string().required(),
      discount_acc_type: Joi.number().required(),
      expired_type: Joi.number().required(),
      expired_from: Joi.string().allow(''),
      expired_to: Joi.string().allow(''),
      discount_for: Joi.number().required(),
      nbr_used: Joi.number().allow(null),
      is_nbr_user_limit: Joi.number().allow(null),
      discount_type: Joi.number().required(),
      discount_value: Joi.number().required(),
      max_discount_value: Joi.number().required(),
      status: Joi.number().allow(null)
    };
    const addionalObj = object.discount_acc_type === ACCOUNT_TYPE.JobSeeker ? {
    } : {
      is_for_all_user: Joi.number(),
      user_available: Joi.array().items(Joi.number()).allow(null)
    };
    Object.assign(joiObject, addionalObj);
    return this.setUpJoi(joiObject, object);
  }
  public validateLogFunndel(object: any) {
    const joiObject = {
      employer_id: Joi.number().required(),
      job_id: Joi.number().required().allow(null),
      object_data: Joi.object().allow(null),
      type: Joi.number().required()
    };
    return this.setUpJoi(joiObject, object);
  }
  public validateCreateBilling(jobs: any) {
    const joiBilingObject = {
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
      address_line_1: Joi.string().required(),
      address_line_2: Joi.string().allow(''),
      company_name: Joi.string().allow(''),
      city_name: Joi.string().required(),
      state_name: Joi.string().required(),
      zip_code: Joi.number().required()
    };
    return this.setUpJoi(joiBilingObject, jobs);
  }
}