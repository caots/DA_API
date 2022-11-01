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

 Date: 16/04/2021 10:48:56
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for payment_coupon_user_availables
-- ----------------------------
DROP TABLE IF EXISTS `payment_coupon_user_availables`;
CREATE TABLE `payment_coupon_user_availables` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `payment_coupon_id` bigint(20) NOT NULL,
  `user_id` tinyint(1) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
