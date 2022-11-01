ALTER TABLE `assessments` 
MODIFY COLUMN `assessment_id` bigint
(20) NOT NULL COMMENT 'id of IMocha or customs' AFTER `id`,
ADD COLUMN `employer_id` bigint
(20) NULL AFTER `updated_at`,
MODIFY COLUMN `description` varchar
(2000) CHARACTER
SET utf8
COLLATE utf8_general_ci NULL DEFAULT NULL AFTER `category_name`;


ALTER TABLE `job_seeker_assessments`
ADD COLUMN `do_exam_at` datetime
(0) NULL DEFAULT NULL AFTER `is_deleted`,