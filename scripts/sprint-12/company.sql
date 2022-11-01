CREATE TABLE `measuredskill_qa`.`company` (
  `id` INT NOT NULL,
  `company_name` VARCHAR(255) NULL,
  `lat` VARCHAR(255) NULL,
  `lon` VARCHAR(255) NULL,
  `company_profile_picture` VARCHAR(255) NULL,
  `employer_id` BIGINT(20) NULL,
  `chat_group_id` BIGINT(20) NULL,
  `rate` FLOAT NULL,
  `refer_link` VARCHAR(255) NULL,
  `employer_company_twitter` VARCHAR(255) NULL,
  `employer_company_facebook` VARCHAR(255) NULL,
  `employer_company_url` VARCHAR(255) NULL,
  `employer_ceo_picture` VARCHAR(4255) NULL,
  `employer_ceo_name` VARCHAR(255) NULL,
  `employer_company_video` VARCHAR(255) NULL,
  `employer_company_photo` VARCHAR(255) NULL,
  `employer_year_founded` VARCHAR(255) NULL,
  `employer_revenue_max` FLOAT NULL,
  `employer_revenue_min` FLOAT NULL,
  `employer_industry` VARCHAR(255) NULL,
  `note` VARCHAR(1000) NULL,
  `state_name` VARCHAR(255) NULL,
  `city_name` VARCHAR(255) NULL,
  `company_size_max` VARCHAR(11) NULL,
  `company_size_min` VARCHAR(11) NULL,
  `description` VARCHAR(4000) NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `measuredskill_qa`.`company` 
CHANGE COLUMN `employer_company_photo` `employer_company_photo` VARCHAR(2000) NULL DEFAULT NULL ;

ALTER TABLE `measuredskill_qa`.`company` 
ADD COLUMN `address_line` VARCHAR(255) NULL AFTER `description`;

ALTER TABLE `measuredskill_qa`.`company` 
ADD COLUMN `created_at` DATETIME NULL AFTER `address_line`,
ADD COLUMN `updated_at` DATETIME NULL AFTER `created_at`;

ALTER TABLE `measuredskill_qa`.`company` 
ADD COLUMN `zip_code` VARCHAR(20) NULL AFTER `updated_at`;


ALTER TABLE `measuredskill_qa`.`users` 
ADD COLUMN `company_id` BIGINT(20) NULL AFTER `ip_address`;

