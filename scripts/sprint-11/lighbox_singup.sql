CREATE TABLE `measuredskill_uat`.`user_potentials` (
  `id` BIGINT(20) NOT NULL,
  `first_name` VARCHAR(255) NULL,
  `last_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `status` TINYINT(1) NULL DEFAULT 1,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  `submited_password` TINYINT(1) NULL DEFAULT 0,
  PRIMARY KEY (`id`));

ALTER TABLE `measuredskill_uat`.`user_potentials` 
CHANGE COLUMN `id` `id` BIGINT(20) NOT NULL AUTO_INCREMENT ;


CREATE TABLE `measuredskill_uat`.`user_potentials_submit_password` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NULL,
  `token` VARCHAR(500) NULL,
  `created_at` DATETIME NULL,
  PRIMARY KEY (`id`));

CREATE TABLE `measuredskill_uat`.`user_potentials_category` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_potential_id` BIGINT(20) NULL,
  `category_id` BIGINT(20) NULL,
  `status` TINYINT(1) NULL DEFAULT 1,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_category_id_idx` (`category_id` ASC),
  CONSTRAINT `fk_user_potentials_id`
    FOREIGN KEY (`user_potential_id`)
    REFERENCES `measuredskill_uat`.`users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_category_id`
    FOREIGN KEY (`category_id`)
    REFERENCES `measuredskill_uat`.`job_categories` (`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT);

ALTER TABLE `measuredskill_uat`.`user_potentials_category` 
DROP FOREIGN KEY `fk_category_id`,
DROP FOREIGN KEY `fk_user_potentials_id`;
ALTER TABLE `measuredskill_uat`.`user_potentials_category` 
CHANGE COLUMN `user_potential_id` `user_potential_id` BIGINT(20) NOT NULL ,
CHANGE COLUMN `category_id` `category_id` BIGINT(20) NOT NULL ,
DROP INDEX `fk_user_potentials_id` ,
ADD INDEX `fk_user_potentials_id_idx` (`user_potential_id` ASC);
;
ALTER TABLE `measuredskill_uat`.`user_potentials_category` 
ADD CONSTRAINT `fk_category_id`
  FOREIGN KEY (`category_id`)
  REFERENCES `measuredskill_uat`.`job_categories` (`id`),
ADD CONSTRAINT `fk_user_potentials_id`
  FOREIGN KEY (`user_potential_id`)
  REFERENCES `measuredskill_uat`.`user_potentials` (`id`);

CREATE TABLE `measuredskill_uat`.`user_surveys` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NULL,
  `description` VARCHAR(2000) NULL,
  `type` INT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  `answers` TEXT NULL,
  `full_answers` TEXT NULL,
  `user_id` BIGINT(20) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_user_surveys_idx` (`user_id` ASC),
  CONSTRAINT `fk_user_surveys`
    FOREIGN KEY (`user_id`)
    REFERENCES `measuredskill_uat`.`users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT);
