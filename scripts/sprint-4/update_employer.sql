ALTER TABLE `measuredskill_qa`.`users`
ADD COLUMN `employer_industry` varchar
(255) NULL AFTER `is_deleted`,
ADD COLUMN `employer_revenue_min` float NULL AFTER `employer_industry`,
ADD COLUMN `employer_revenue_max` float NULL AFTER `employer_revenue_min`,
ADD COLUMN `employer_year_founded` varchar
(5) NULL AFTER `employer_revenue_max`,
ADD COLUMN `employer_company_photo` varchar
(2000) NULL AFTER `employer_year_founded`,
ADD COLUMN `employer_company_video` varchar
(255) NULL AFTER `employer_company_photo`,
ADD COLUMN `employer_ceo_name` varchar
(255) NULL AFTER `employer_company_video`,
ADD COLUMN `employer_ceo_picture` varchar
(255) NULL AFTER `employer_ceo_name`,
ADD COLUMN `employer_company_url` varchar
(255) NULL AFTER `employer_ceo_picture`,
ADD COLUMN `employer_company_facebook` varchar
(255) NULL AFTER `employer_company_url`,
ADD COLUMN `employer_company_twitter` varchar
(255) NULL AFTER `employer_company_facebook`;
ADD COLUMN `rate` float NULL AFTER `employer_company_twitter`;
ADD COLUMN `is_user_deleted` tinyint
(1) NULL DEFAULT 0 AFTER `rate`;
ADD COLUMN `old_email` varchar
(50) NULL AFTER `is_user_deleted`;
ADD COLUMN `refer_link` varchar
(255) NULL AFTER `old_email`;
ADD COLUMN `employer_title` varchar
(255) NULL AFTER `refer_link`;
ADD COLUMN `employer_id` bigint
(20) NOT NULL DEFAULT 0 AFTER `employer_title`
ADD COLUMN `chat_group_id` bigint
(20) NULL AFTER `employer_id`;
ADD COLUMN `user_responsive` int
(10) NULL DEFAULT 0 AFTER `chat_group_id`;



ALTER TABLE `measuredskill_qa`.`job_applicants`

ADD COLUMN `scheduleTime` datetime
(0) NULL AFTER `assessments_result`,
ADD COLUMN `stage` int
(20) NULL AFTER `scheduleTime`,
DROP COLUMN `date_picking`,
ADD COLUMN `group_id` bigint
(20) NULL AFTER `stage`,
ADD COLUMN `can_view_profile` tinyint
(1) NULL AFTER `group_id`,
ADD COLUMN `can_rate_stars` tinyint
(1) NULL AFTER `can_view_profile`,