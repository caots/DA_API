ALTER TABLE `assessment_custom_questions`
ADD COLUMN `is_any_correct` tinyint
(1) NULL COMMENT 'check if type = checkbox = 1' AFTER `title_image`;
update assessment_custom_questions set is_any_correct=0 where type = 1;

ALTER TABLE `jobs`
ADD COLUMN `lat` varchar
(20) CHARACTER
SET utf8
COLLATE utf8_general_ci NULL DEFAULT NULL AFTER `is_specific_percent_travel`,
ADD COLUMN `lon` varchar
(20) CHARACTER
SET utf8
COLLATE utf8_general_ci NULL DEFAULT NULL AFTER `lat`;