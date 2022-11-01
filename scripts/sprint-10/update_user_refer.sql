ALTER TABLE `measuredskill_uat`.`user_refers` 
ADD COLUMN `is_applied` tinyint(1) NOT NULL DEFAULT 0 AFTER `updated_at`;