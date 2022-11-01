CREATE TABLE `params_filter_crawler` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL,
  `value` VARCHAR(255) NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `jobs` 
ADD COLUMN `is_crawl` INT NULL AFTER `expired_urgent_hiring_badge_at`,
ADD COLUMN `crawl_url` MEDIUMTEXT NULL AFTER `is_crawl`,
ADD COLUMN `crawl_from` VARCHAR(255) NULL AFTER `crawl_url`;

ALTER TABLE `company` 
ADD COLUMN `is_crawl` INT NULL AFTER `zip_code`,
ADD COLUMN `is_exclude` INT NULL AFTER `is_crawl`;


INSERT INTO `params_filter_crawler` (`name`, `value`) VALUES ('url', 'https://indeed.com/jobs');
INSERT INTO `params_filter_crawler` (`name`, `value`) VALUES ('drivertype', 'indeed_jobs');
INSERT INTO `params_filter_crawler` (`name`, `value`) VALUES ('name', 'a');
INSERT INTO `params_filter_crawler` (`name`) VALUES ('salary');
INSERT INTO `params_filter_crawler` (`name`, `value`) VALUES ('fromage', '7');
INSERT INTO `params_filter_crawler` (`name`) VALUES ('multi_location');
INSERT INTO `params_filter_crawler` (`name`, `value`) VALUES ('range', '200');
INSERT INTO `params_filter_crawler` (`name`, `value`) VALUES ('employee', '500');


CREATE TABLE `company_crawl_url` (
  `id` BIGINT(11) NOT NULL,
  `url` MEDIUMTEXT NULL,
  `start_job` INT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `company_crawl_url` 
CHANGE COLUMN `id` `id` BIGINT(11) NOT NULL AUTO_INCREMENT ;

ALTER TABLE `company_crawl_url` 
RENAME TO  `job_crawl_url` ;

ALTER TABLE `company` CHANGE COLUMN `id` `id` INT(11) NOT NULL AUTO_INCREMENT ;

ALTER TABLE `jobs` ADD COLUMN `is_exclude_company` INT NULL DEFAULT 0 AFTER `crawl_from`;

ALTER TABLE `params_filter_crawler` 
ADD COLUMN `label` VARCHAR(255) NULL AFTER `value`,
CHANGE COLUMN `value` `value` VARCHAR(2000) NULL DEFAULT NULL ;

UPDATE `params_filter_crawler` SET `label` = 'What' WHERE (`id` = '3');
UPDATE `params_filter_crawler` SET `label` = 'Salary' WHERE (`id` = '4');
UPDATE `params_filter_crawler` SET `label` = 'Age - Jobs published (days)' WHERE (`id` = '5');
UPDATE `params_filter_crawler` SET `label` = 'Multi Location' WHERE (`id` = '6');
UPDATE `params_filter_crawler` SET `label` = 'Number of Job' WHERE (`id` = '7');
UPDATE `params_filter_crawler` SET `label` = 'Number of Employees' WHERE (`id` = '8');

ALTER TABLE `params_filter_crawler` 
ADD COLUMN `config_number` INT NULL AFTER `label`;

UPDATE `params_filter_crawler` SET `config_number` = '1' WHERE (`id` = '1');
UPDATE `params_filter_crawler` SET `config_number` = '1' WHERE (`id` = '2');
UPDATE `params_filter_crawler` SET `config_number` = '1' WHERE (`id` = '3');
UPDATE `params_filter_crawler` SET `config_number` = '1' WHERE (`id` = '4');
UPDATE `params_filter_crawler` SET `config_number` = '1' WHERE (`id` = '5');
UPDATE `params_filter_crawler` SET `config_number` = '1' WHERE (`id` = '6');
UPDATE `params_filter_crawler` SET `config_number` = '1' WHERE (`id` = '7');
UPDATE `params_filter_crawler` SET `config_number` = '1' WHERE (`id` = '8');

ALTER TABLE `job_crawl_url` 
ADD COLUMN `config_file` INT NULL AFTER `updated_at`;

ALTER TABLE `job_crawl_url` 
ADD COLUMN `employee` INT NULL AFTER `config_file`;

ALTER TABLE `jobs` 
ADD COLUMN `is_crawl_text_status` INT NULL AFTER `is_exclude_company`;

ALTER TABLE `jobs` 
CHANGE COLUMN `is_crawl_text_status` `is_crawl_text_status` INT(11) NULL DEFAULT 1 ;

CREATE TABLE `crawl_log` (
  `id` BIGINT(11) NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME NULL,
  `log` TEXT NULL,
  `url_file` VARCHAR(255) NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `params_filter_crawler` 
ADD COLUMN `status` INT NULL DEFAULT 1 AFTER `config_number`;

ALTER TABLE `company` 
ADD COLUMN `status_crawl` INT(11) NULL DEFAULT 0 AFTER `is_exclude`;

ALTER TABLE `company` 
ADD COLUMN `is_claimed` INT(11) NULL DEFAULT 0 AFTER `status_crawl`;