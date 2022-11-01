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

 Date: 19/11/2020 13:47:42
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for job_seeker_assessment_logs
-- ----------------------------
DROP TABLE IF EXISTS `job_seeker_assessment_logs`;
CREATE TABLE `job_seeker_assessment_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `job_seeker_id` bigint(20) NOT NULL,
  `job_seeker_assessment_id` bigint(20) DEFAULT NULL,
  `weight` float DEFAULT NULL,
  `Status` varchar(50) NOT NULL DEFAULT '1' COMMENT 'In Progress, Complete, Test Left',
  `AttemptedOnUtc` varchar(200) DEFAULT NULL,
  `TotalScore` float DEFAULT NULL,
  `CandidateScore` float DEFAULT NULL,
  `CandidateEmailId` varchar(50) DEFAULT NULL,
  `ReportPDFUrl` varchar(255) DEFAULT NULL,
  `TestInvitationId` bigint(20) DEFAULT NULL COMMENT 'id of TestInvitationId Imocha',
  `PerformanceCategory` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `AttemptedOn` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `fk_job_assessments` (`job_seeker_id`),
  CONSTRAINT `job_seeker_assessment_logs_ibfk_1` FOREIGN KEY (`job_seeker_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=699 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

SET FOREIGN_KEY_CHECKS = 1;
