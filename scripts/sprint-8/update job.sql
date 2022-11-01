ALTER TABLE `jobs` 
MODIFY COLUMN `salary_type` tinyint
(1) NOT NULL DEFAULT 1 COMMENT '0: per year, 1: per month, 2: per week, 3: per day' AFTER `featured_end_date`,
ADD COLUMN `salary_min` float NULL AFTER `employment_type`,
ADD COLUMN `salary_max` float NULL AFTER `salary_min`,
ADD COLUMN `proposed_conpensation` tinyint
(1) NULL DEFAULT 0 COMMENT '0: exact rate; 1: range' AFTER `salary_max`,
MODIFY COLUMN `percent_travel` tinyint
(1) NULL DEFAULT 0 COMMENT '0: onsite, 1: remote, 2: hybrid' AFTER `job_fall_under`,
ADD COLUMN `is_specific_percent_travel` tinyint
(1) NULL AFTER `proposed_conpensation`;


ALTER TABLE `job_applicants`
ADD COLUMN `asking_salary_type` int
(10) NULL AFTER `can_rate_stars`;