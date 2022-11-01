ALTER TABLE `payments` 
MODIFY COLUMN `total_amount` float NULL DEFAULT NULL AFTER `updated_at`,
ADD COLUMN `sub_total` float NOT NULL AFTER `total_amount`,
ADD COLUMN `discount_value` float NOT NULL DEFAULT 0 AFTER `sub_total`,
ADD COLUMN `tax` float NOT NULL DEFAULT 0 AFTER `discount_value`,
ADD COLUMN `coupon_code` varchar
(255) NULL AFTER `tax`,
ADD COLUMN `invoice_receipt_url` varchar(255) NULL AFTER `coupon_code`;
update payments set sub_total = total_amount;

ALTER TABLE `jobs`
ADD COLUMN `expired_urgent_hiring_badge_at` datetime
(0) NULL AFTER `lon`;
update jobs set expired_urgent_hiring_badge_at = expired_at where expired_at is not null;

