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

 Date: 14/12/2020 15:54:35
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for chat_groups
-- ----------------------------
DROP TABLE IF EXISTS `chat_groups`;
CREATE TABLE `chat_groups` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `type` int(1) NOT NULL DEFAULT '1' COMMENT '0: admin to user, 1: user to user',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `ower_id` bigint(20) DEFAULT NULL COMMENT 'if type = 0 => owner_id is 0; if type= 1 => owner_id is employer',
  `job_id` bigint(20) DEFAULT NULL,
  `member_id` bigint(20) DEFAULT NULL COMMENT 'if type = 0 => member_id is user; if type= 1 => member_id is jobseeker',
  `company_id` bigint(20) DEFAULT NULL COMMENT 'if member_id != company_id => member employer',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=390 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
