ALTER TABLE `admins`
ADD COLUMN `status` tinyint(1) NULL DEFAULT 1 COMMENT '0: Pending, 1: Active, 2: Deactive' AFTER `role_id`,
ADD COLUMN `acc_type` tinyint(1) NULL DEFAULT 0 COMMENT '0: SuperAdmin, 1: Admin' AFTER `role_id`