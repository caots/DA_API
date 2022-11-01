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

 Date: 16/04/2021 10:48:21
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for employer_recruitment_funnel
-- ----------------------------
DROP TABLE IF EXISTS `employer_recruitment_funnel`;
CREATE TABLE `employer_recruitment_funnel` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `employer_id` bigint(20) NOT NULL,
  `object_data` varchar(1000) DEFAULT NULL,
  `job_id` bigint(20) DEFAULT NULL,
  `type` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1. Unique views, 2. Invitation, 3. Applications, 4. Message sent, 5. Message received, 6. Offers, 7. Hires, ',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
