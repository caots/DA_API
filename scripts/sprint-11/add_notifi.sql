CREATE TABLE `contact_us` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(45) DEFAULT NULL,
  `last_name` varchar(45) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `phone_number` varchar(45) DEFAULT NULL,
  `phone_country` varchar(5) DEFAULT NULL,
  `type` tinyint(1) DEFAULT NULL,
  `institution` varchar(45) DEFAULT NULL,
  `message` varchar(1000) DEFAULT NULL,
  `is_send_mail` bit(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
)
CREATE TABLE `cronjob_tasks` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL,
  `subject_id` bigint(20) NOT NULL COMMENT '// job_id',
  `type` int(10) DEFAULT NULL COMMENT '0: new post jobs,',
  `metadata` varchar(4000) DEFAULT NULL COMMENT 'JSON string of the subject related to the cronjob',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0: not run,1: running, 2: success, 3 fail\n',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
)
CREATE TABLE `user_notifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `user_acc_type` tinyint(1) NOT NULL COMMENT '0: employer, 1: job seeker',
  `type` int(10) DEFAULT NULL COMMENT '0: confirm password change, 1: delegate account active account, 2: jobseeker is invited by employer to apply from Find Candidates, 3: New posts to jobseekers from employers they follow and employer they’ve applied to before, 4: Reminder to complete application, 5: Reminder saved job is about to expire, 6. Referral credit has been added',
  `metadata` varchar(2000) DEFAULT NULL COMMENT 'JSON string of the subject related to the message',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `is_sent_mail` tinyint(1) NOT NULL DEFAULT '0',
  `sent_mail_status` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
)

CREATE TABLE `jobs_suggest_jobseeker` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jobs_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
)

ALTER TABLE `measuredskill_qa`.`user_subcribes`
ADD COLUMN reason_unsubcribe_type tinyint(1) NULL,
ADD COLUMN is_subscribe tinyint(1) NULL DEFAULT '1' AFTER updated_at,
ADD COLUMN reason_unsubcribe varchar(500) NULL

ALTER TABLE `measuredskill_qa`.`users`
ADD COLUMN is_subscribe tinyint(1) NULL DEFAULT '1' AFTER enable_show_avatar