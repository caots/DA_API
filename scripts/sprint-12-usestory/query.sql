CREATE TABLE `user_story` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NULL,
  `name` VARCHAR(255) NULL,
  `assessment` MEDIUMTEXT NULL,
  `token` MEDIUMTEXT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_user_story_idx` (`user_id` ASC),
  CONSTRAINT `fk_user_story`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);