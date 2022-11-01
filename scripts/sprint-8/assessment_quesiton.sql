ALTER TABLE `assessment_custom_questions` 
MODIFY COLUMN `title` varchar
(1000) CHARACTER
SET utf8
COLLATE utf8_general_ci NOT NULL AFTER `assessment_custom_id`,
ADD COLUMN `title_image` varchar
(255) NULL AFTER `updated_at`;