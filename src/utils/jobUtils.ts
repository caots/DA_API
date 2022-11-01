import { JOB_EXPIRED_DAYS } from "@src/config";
import { compile } from 'html-to-text';
import slugify from 'slugify';
export const getDayExpiredFromDayConfig = (dayConfig: number) => {
  switch (dayConfig) {
    case JOB_EXPIRED_DAYS["7Days"]:
      return 7;
    case JOB_EXPIRED_DAYS["14Days"]:
      return 14;
    case JOB_EXPIRED_DAYS["30Days"]:
      return 30;
    default:
      return 7;
  }
};

export const getOrder = (orderBy: number, totalMyAssessment = 0) => {
  let orders;
  switch (orderBy) {
    case 0:
      orders = ["jobs.created_at", "desc"];
      break;
    case 1:
      orders = ["jobs.created_at", "asc"];
      break;
    case 2:
      orders = ["jobs.salary", "desc"];
      break;
    case 3:
      orders = ["jobs.salary", "asc"];
      break;
    case 4:
      // Highest Score
      orders = ["jobs.created_at", "desc"];
      break;
    case 5:
      // Lowest Score
      orders = ["jobs.created_at", "asc"];
      break;
    case 6:
      // Best Match
      orders = totalMyAssessment > 0 ? ["total_point", "desc"] : ["jobs.created_at", "desc"];
      break;
    case 7:
      // expires soonest 
      orders = ["jobs.expired_at", "asc"];
      break;
    case 8:
      // Recently Posted 
      orders = ["jobs.paid_at", "desc"];
      break;
    default:
      orders = ["jobs.created_at", "desc"];
      break;
  }
  return orders;
};

export const extractContent = (htmls) => {
  const convert = compile({
    wordwrap: 130
  });
  const texts = convert(htmls);
  return texts
};


export const getOrderForApplicant = (orderBy: number) => {
  let orders;
  switch (orderBy) {
    case 0:
      orders = ["jobs.created_at", "desc"];
      break;
    case 1:
      orders = ["jobs.created_at", "asc"];
      break;
    case 2:
      orders = ["job_applicants.asking_salary", "desc"];
      break;
    case 3:
      orders = ["job_applicants.asking_salary", "asc"];
      break;
    case 4:
      // Highest Score
      orders = ["job_applicants.total_point", "desc"];
      break;
    case 5:
      // Lowest Score
      orders = ["job_applicants.total_point", "asc"];
      break;
    case 6:
      // Highest ratting
      orders = ["job_seeker_rate", "desc"];
      break;
    case 7:
      // Lowest ratting
      orders = ["job_seeker_rate", "asc"];
      break;
    default:
      orders = ["jobs.created_at", "desc"];
      break;
  }
  return orders;
};
export const getOrderForInvitedCandidate = (orderBy: number) => {
  let orders;
  switch (orderBy) {
    case 0:
      orders = ["jobs.created_at", "desc"];
      break;
    case 1:
      orders = ["jobs.created_at", "asc"];
      break;
    case 2:
      orders = ["potential_candidates.asking_salary", "desc"];
      break;
    case 3:
      orders = ["potential_candidates.asking_salary", "asc"];
      break;
    case 4:
      // Highest Score
      orders = ["potential_candidates.total_point", "desc"];
      break;
    case 5:
      // Lowest Score
      orders = ["potential_candidates.total_point", "asc"];
      break;
    case 6:
      // Highest ratting
      orders = ["job_seeker_rate", "desc"];
      break;
    case 7:
      // Lowest ratting
      orders = ["job_seeker_rate", "asc"];
      break;
    default:
      orders = ["jobs.created_at", "desc"];
      break;
  }
  return orders;
};

export const convertToSlugUrl = (title = "", id = null) => {
  if (title) {
    let titlejob = title.trim().toString().toLowerCase();
    let urlSlice = slugify(`${titlejob}`);
    if (urlSlice.length > 200) {
      urlSlice = urlSlice.slice(0, 200)
      let list: number[] = [];
      for (var i = 0; i < urlSlice.length; i++) {
        if (urlSlice[i] === "-") {
          list.push(i);
        }
      }
      let indexSlice = list[list.length - 2]
      urlSlice = urlSlice.slice(0, Number(indexSlice));
      if(id) return slugify(`${urlSlice}-${id}`);
      else return slugify(`${urlSlice}`);
    }
    else {
      if(id) return slugify(`${titlejob}-${id}`);
      else return slugify(`${titlejob}`);
    }
  }
  return id;
}

export const deleteSpecialText = (str: string = '') => {
  return str.toString().replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
}

export const convertObjectToQuery = (obj) => {
  let query = "";
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
