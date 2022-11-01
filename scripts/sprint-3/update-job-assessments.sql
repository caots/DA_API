
ALTER TABLE `job_assessments` 
CHANGE COLUMN `assessments_id` `assessment_id` bigint
(20) NULL DEFAULT NULL AFTER `jobs_id`,
CHANGE COLUMN `assessments_type` `assessment_type` tinyint
(1) NOT NULL DEFAULT 0 COMMENT '0: aspring_mind, 1: custom' AFTER `assessment_id`;