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

 Date: 16/04/2021 10:51:02
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for potential_candidates
-- ----------------------------
DROP TABLE IF EXISTS `potential_candidates`;
CREATE TABLE `potential_candidates` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `job_seeker_id` bigint(20) NOT NULL,
  `employer_id` bigint(20) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1: invited',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `asking_salary` float DEFAULT NULL,
  `asking_salary_type` int(10) DEFAULT NULL,
  `asking_benefits` varchar(1000) DEFAULT NULL,
  `bookmarked` tinyint(1) DEFAULT '0',
  `assessments_result` text,
  `chat_group_id` bigint(20) DEFAULT NULL,
  `can_view_profile` tinyint(1) DEFAULT NULL,
  `can_rate_stars` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
