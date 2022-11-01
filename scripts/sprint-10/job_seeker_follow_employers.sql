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

 Date: 05/03/2021 17:05:33
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for job_seeker_follow_employers
-- ----------------------------
DROP TABLE IF EXISTS `job_seeker_follow_employers`;
CREATE TABLE `job_seeker_follow_employers` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `job_seeker_id` bigint(20) NOT NULL,
  `employer_id` bigint(20) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `fk_seeker_applicant` (`job_seeker_id`),
  CONSTRAINT `job_seeker_follow_employers_ibfk_2` FOREIGN KEY (`job_seeker_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=175 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

SET FOREIGN_KEY_CHECKS = 1;
