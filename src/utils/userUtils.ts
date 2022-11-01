import CompanyModel from "@src/models/company";
import UserModel from "@src/models/user";

export const mapUserAndCompanyData = (user: UserModel, company: CompanyModel) => {
  return {
    ...user,
    company_name: company?.company_name,
    lat: company?.lat,
    lon: company?.lon,
    refer_link: company?.refer_link,
    company_profile_picture: company?.company_profile_picture,
    rate: company?.rate,
    employer_industry: company?.employer_industry,
    employer_revenue_min: company?.employer_revenue_min,
    employer_revenue_max: company?.employer_revenue_max,
    employer_year_founded: company?.employer_year_founded,
    employer_company_photo: company?.employer_company_photo,
    employer_company_video: company?.employer_company_video,
    employer_ceo_name: company?.employer_ceo_name,
    employer_ceo_picture: company?.employer_ceo_picture,
    employer_company_url: company?.employer_company_url,
    employer_company_twitter: company?.employer_company_twitter,
    employer_company_facebook: company?.employer_company_facebook,
    city_name: company?.city_name,
    state_name: company?.state_name,
    company_size_min: company?.company_size_min,
    company_size_max: company?.company_size_max,
    is_crawl: company?.is_crawl,
    is_exclude: company?.is_exclude,
    status_crawl: company?.status_crawl,
    address_line: company?.address_line,
    description: company?.description,
    note: company?.note,
    zip_code: company?.zip_code,
    is_claimed: company?.is_claimed,
  }
} 