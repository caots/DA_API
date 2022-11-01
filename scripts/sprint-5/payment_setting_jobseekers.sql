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

 Date: 29/12/2020 17:02:02
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for payment_setting_jobseekers
-- ----------------------------
DROP TABLE IF EXISTS `payment_setting_jobseekers`;
CREATE TABLE `payment_setting_jobseekers` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `is_enable_free_assessment` tinyint(1) NOT NULL DEFAULT '1' COMMENT '0: Disable, 1: Enable',
  `free_assessment_validation` int(11) DEFAULT NULL,
  `nbr_referral_for_one_validation` int(11) DEFAULT NULL,
  `standard_validation_price` float DEFAULT NULL,
  `topup_validation_price` float DEFAULT NULL,
  `top_up` text COMMENT 'JSON type: [{name: , num_retake: }]',
  `type` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0: System, 1: Individual',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
