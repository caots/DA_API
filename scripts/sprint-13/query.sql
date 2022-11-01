CREATE TABLE `category_assessments` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT(20) NULL,
  `assessment_id` BIGINT(20) NULL,
  PRIMARY KEY (`id`));


ALTER TABLE `users` 
ADD COLUMN `is_take_first_assessment` TINYINT(1) NULL DEFAULT 0 AFTER `company_id`;