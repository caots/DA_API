CREATE TABLE `user_receive_email` (
  `id` BIGINT(11) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(11) NULL,
  `job_id` BIGINT(11) NULL,
  `quantity` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_user_receive_email_idx` (`user_id` ASC),
  INDEX `fk_user_receive_email_job_idx` (`job_id` ASC),
  CONSTRAINT `fk_user_receive_email_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_receive_email_job`
    FOREIGN KEY (`job_id`)
    REFERENCES `jobs` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

ALTER TABLE `user_receive_email` 
DROP FOREIGN KEY `fk_user_receive_email_user`,
DROP FOREIGN KEY `fk_user_receive_email_job`;
ALTER TABLE `user_receive_email` 
DROP INDEX `fk_user_receive_email_job_idx` ,
DROP INDEX `fk_user_receive_email_idx` ;
;
