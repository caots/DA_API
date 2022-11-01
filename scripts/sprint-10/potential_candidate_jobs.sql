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

 Date: 16/04/2021 10:50:55
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for potential_candidate_jobs
-- ----------------------------
DROP TABLE IF EXISTS `potential_candidate_jobs`;
CREATE TABLE `potential_candidate_jobs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `job_seeker_id` bigint(20) NOT NULL,
  `employer_id` bigint(20) NOT NULL,
  `job_id` float NOT NULL,
  `potential_candidate_id` bigint(20) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1: invited',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
