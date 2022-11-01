ALTER TABLE `assessments`
ADD COLUMN `format` varchar
(255) NULL AFTER `employer_id`;

update assessments set format= 'Coding' where type = 0 and assessments.questions <= 2;

update assessments set format= 'MCQ and Logic Box' where assessment_id in (1162259, 1162260);

update assessments set format= 'MCQ' where format is null and type = 0;


ALTER TABLE `chat_groups`
ADD COLUMN `status` tinyint
(4) NULL DEFAULT 1 COMMENT '1 : inbox, 2: archived' AFTER `company_id`;
ADD COLUMN `group_nomal_type` int
(10) NULL DEFAULT 0 COMMENT '0: nomal, 1:direct msg' AFTER `status`;

ALTER TABLE `jobs`
DROP COLUMN `is_specific_percent_travel`,
CHANGE COLUMN `specific_percent_travel` `specific_percent_travel_type` tinyint
(1) NULL DEFAULT 0 AFTER `percent_travel`;
update `jobs`
set
`specific_percent_travel_type` = 0;

ALTER TABLE `users`
ADD COLUMN `company_profile_picture` varchar
(255) CHARACTER
SET utf8
COLLATE utf8_general_ci NULL DEFAULT NULL AFTER `nbr_free_credits`
ADD COLUMN `lat` varchar
(255) NULL AFTER `company_profile_picture`,
ADD COLUMN `lon` varchar
(255) NULL AFTER `lat`;
ADD COLUMN `asking_salary_type` tinyint
(1) NOT NULL DEFAULT 0 COMMENT '0: per year, 1: per month, 2: per week, 3: per day' AFTER `lon`,
ADD COLUMN `enable_show_avatar` tinyint
(1) NULL DEFAULT 1 AFTER `asking_salary_type`;

update users set company_profile_picture = profile_picture  where acc_type = 1 and employer_id = 0;

ALTER TABLE `job_seeker_ratting`
ADD COLUMN `type` tinyint
(1) NULL DEFAULT 0 COMMENT '0: applicant, 1: potential candidate' AFTER `job_id`


ALTER TABLE `job_applicants`
ADD COLUMN `type` tinyint
(1) NULL DEFAULT 0 COMMENT '0: applicant, 1: potential invited' AFTER `asking_salary_type`
ADD COLUMN `potential_candidate_id` bigint
(20) NULL AFTER `type`;

ALTER TABLE `payment_setting_employers`
ADD COLUMN `free_direct_message` int
(10) NULL DEFAULT 0 AFTER `updated_at`,
ADD COLUMN `standard_direct_message_price` float NULL AFTER `free_direct_message`,
ADD COLUMN `topup_credit` text NULL COMMENT 'JSON type: [{name: , num_dm: }]' AFTER `standard_direct_message_price`;

ALTER TABLE `chat_groups`
MODIFY COLUMN `job_id` bigint
(20) NULL DEFAULT NULL COMMENT 'if job = 0 is direct messsage' AFTER `ower_id`;

ALTER TABLE `user_responsive`
ADD COLUMN `group_nomal_type` int
(1) NULL DEFAULT 0 COMMENT '0: nomal, 1: direct message' AFTER `is_responsive`;