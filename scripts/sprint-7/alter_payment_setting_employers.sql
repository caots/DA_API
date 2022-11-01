ALTER TABLE `payment_setting_employers`
ADD COLUMN `urgent_hiring_price` float DEFAULT NULL COMMENT 'posting/day' AFTER `featured_price`,
ADD COLUMN `private_job_price` float DEFAULT NULL COMMENT 'access/person' AFTER `featured_price`;

ALTER TABLE `payment_setting_jobseekers`
MODIFY `nbr_referral_for_one_validation` FLOAT DEFAULT NULL;
