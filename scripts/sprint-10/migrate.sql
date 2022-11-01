update chat_messages set content = CONCAT('https://api.uat.measuredskill.uat4.pgtest.co',content)  where content_type in (1,2,3);
update assessment_custom_questions set title_image = CONCAT('https://api.qa.measuredskill.uat4.pgtest.co',title_image) where title_image is not null;
update users set employer_company_photo = null;
update users set profile_picture = CONCAT('https://api.qa.measuredskill.uat4.pgtest.co',profile_picture) where length(profile_picture) > 0;
update users set employer_ceo_picture = CONCAT('https://api.qa.measuredskill.uat4.pgtest.co',employer_ceo_picture) where length(employer_ceo_picture) > 0;
update users set company_profile_picture = CONCAT('https://api.qa.measuredskill.uat4.pgtest.co',company_profile_picture) where length(company_profile_picture) > 0;
