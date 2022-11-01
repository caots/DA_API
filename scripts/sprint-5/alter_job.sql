ALTER TABLE `jobs`
ADD COLUMN `is_make_featured` tinyint
(1) NOT NULL DEFAULT 0 AFTER `toal_view`,
ADD COLUMN `featured_start_date` datetime
(0) NULL AFTER `is_make_featured`,
ADD COLUMN `featured_end_date` datetime
(0) NULL AFTER `featured_start_date`;


ALTER TABLE `users` 
CHANGE COLUMN `converge_customer_id` `converge_ssl_token` varchar
(100) CHARACTER
SET utf8
COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'id of customer coverge which is payment process' AFTER `email_verified`,
ADD COLUMN `nbr_free_credits` int
(11) NULL DEFAULT 0 AFTER `user_responsive`;
