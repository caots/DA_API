CREATE TABLE `measuredskill_uat`.`blacklist` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NULL,
  `ip` VARCHAR(100) NULL,
  PRIMARY KEY (`id`));

INSERT INTO `measuredskill_uat`.`blacklist` (`email`) VALUES ('@gexik');
INSERT INTO `measuredskill_uat`.`blacklist` (`ip`) VALUES ('87.214.*.*');
INSERT INTO `measuredskill_uat`.`blacklist` (`ip`) VALUES ('73.53.*.*');
INSERT INTO `measuredskill_uat`.`blacklist` (`ip`) VALUES ('99.121.*.*');