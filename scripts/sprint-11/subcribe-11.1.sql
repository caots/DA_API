ALTER TABLE `user_subcribes`
--DELETE đi nhé ADD COLUMN user_subcribescol varchar(45) NOT NULL,
ADD COLUMN reason_unsubcribe_type tinyint(1) NULL,
ADD COLUMN is_subscribe tinyint(1) NULL DEFAULT '1' AFTER updated_at,
ADD COLUMN reason_unsubcribe varchar(500) NULL;

ALTER TABLE `users`
ADD COLUMN is_subscribe tinyint(1) NULL DEFAULT '1' AFTER enable_show_avatar;