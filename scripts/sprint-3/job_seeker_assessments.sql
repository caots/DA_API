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

 Date: 19/11/2020 13:47:26
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for job_seeker_assessments
-- ----------------------------
DROP TABLE IF EXISTS `job_seeker_assessments`;
CREATE TABLE `job_seeker_assessments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `job_seeker_id` bigint(20) NOT NULL,
  `assessment_id` bigint(20) NOT NULL,
  `assessment_type` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0: aspring_mind, 1: custom',
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `totalTake` int(10) unsigned DEFAULT '0',
  `weight` float DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `current_testInvitationId` bigint(20) DEFAULT NULL COMMENT 'id of TestInvitationId Imocha',
  `current_testUrl` varchar(250) DEFAULT NULL,
  `current_testStatus` varchar(50) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `fk_job_assessments` (`job_seeker_id`),
  CONSTRAINT `job_seeker_assessments_ibfk_1` FOREIGN KEY (`job_seeker_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=721 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

SET FOREIGN_KEY_CHECKS = 1;
