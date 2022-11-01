/*
 Navicat Premium Data Transfer

 Source Server         : cescount-uat
 Source Server Type    : MySQL
 Source Server Version : 50731
 Source Host           : localhost:3306
 Source Schema         : measuredskill_qa

 Target Server Type    : MySQL
 Target Server Version : 50731
 File Encoding         : 65001

 Date: 30/10/2020 17:52:48
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for company_reports
-- ----------------------------
DROP TABLE IF EXISTS `company_reports`;
CREATE TABLE `company_reports` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `reporter_id` bigint(20) DEFAULT NULL,
  `company_id` bigint(20) DEFAULT NULL,
  `comany_name` varchar(255) DEFAULT NULL,
  `reporter_first_name` varchar(255) DEFAULT NULL,
  `reporter_last_name` varchar(255) DEFAULT NULL,
  `type_wrongOrMisleadingInformation` tinyint(1) DEFAULT '0',
  `type_harrassingTheApplicants` tinyint(1) DEFAULT '0',
  `type_other` tinyint(1) DEFAULT '0',
  `note` text,
  `type_fraud` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
