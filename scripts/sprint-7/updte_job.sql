ALTER TABLE `jobs` 
MODIFY COLUMN `benefits` text CHARACTER
SET utf8
COLLATE utf8_general_ci NULL COMMENT '[1, 2 ,3]' AFTER `qualifications`,
ADD COLUMN `salary_type` tinyint
(1) NOT NULL DEFAULT 1 COMMENT '0: per year, 1: per month, 2: per week' AFTER `featured_end_date`,
ADD COLUMN `bonus` text NULL COMMENT '[{id: 0, title: \'signing bonus\'}]' AFTER `salary_type`,
ADD COLUMN `job_fall_under` varchar
(255) NULL AFTER `bonus`,
ADD COLUMN `percent_travel` tinyint
(1) NULL DEFAULT 0 COMMENT '0: onsite, 1: remote' AFTER `job_fall_under`,
ADD COLUMN `specific_percent_travel` float NULL AFTER `percent_travel`,
ADD COLUMN `schedule_job` text NULL COMMENT '[{id: 0, title: \'signing bonus\'}]' AFTER `specific_percent_travel`,
ADD COLUMN `add_urgent_hiring_badge` tinyint
(1) NULL DEFAULT 0 AFTER `schedule_job`,
ADD COLUMN `is_private` tinyint
(1) NULL DEFAULT 0 AFTER `add_urgent_hiring_badge`,
ADD COLUMN `private_applicants` int
(10) NULL AFTER `is_private`;
ADD COLUMN `employment_type` tinyint
(1) NULL AFTER `private_applicants` COMMENT '0: full time, 1: part time, 2: contract, 3: temporary, 4: intership';
