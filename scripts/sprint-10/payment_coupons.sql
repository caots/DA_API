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

 Date: 16/04/2021 10:49:09
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for payment_coupons
-- ----------------------------
DROP TABLE IF EXISTS `payment_coupons`;
CREATE TABLE `payment_coupons` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(255) DEFAULT NULL,
  `discount_acc_type` tinyint(1) DEFAULT NULL COMMENT '0: employer; 1: jobseeker',
  `expired_type` tinyint(1) DEFAULT NULL COMMENT '0: limit, 1 limited',
  `expired_from` datetime DEFAULT NULL,
  `expired_to` datetime DEFAULT NULL,
  `discount_for` tinyint(1) DEFAULT NULL COMMENT '0: retake, 1: job posting, 2: direct message',
  `nbr_used` int(10) DEFAULT NULL COMMENT 'number used per user',
  `is_nbr_user_limit` tinyint(1) DEFAULT '0' COMMENT 'is limit or not',
  `discount_type` tinyint(1) DEFAULT NULL COMMENT '0: percentage; 1: fixed dollar',
  `discount_value` float DEFAULT NULL,
  `max_discount_value` float DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL COMMENT '0: inactive; 1: active; 2: deleted',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_for_all_user` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
