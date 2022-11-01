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

 Date: 29/12/2020 17:01:53
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for payment_setting_employers
-- ----------------------------
DROP TABLE IF EXISTS `payment_setting_employers`;
CREATE TABLE `payment_setting_employers` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `standard_price` float DEFAULT NULL COMMENT 'posting/day',
  `featured_price` float DEFAULT NULL COMMENT 'posting/day',
  `type` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0: System, 1: Individual',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
