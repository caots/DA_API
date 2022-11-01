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

 Date: 14/12/2020 15:57:19
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for employer_permissions
-- ----------------------------
DROP TABLE IF EXISTS `employer_permissions`;
CREATE TABLE `employer_permissions` (
  `id` bigint(20) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of employer_permissions
-- ----------------------------
BEGIN;
INSERT INTO `employer_permissions` VALUES (1, 'Create Job');
INSERT INTO `employer_permissions` VALUES (2, 'Change Company Profilie');
INSERT INTO `employer_permissions` VALUES (3, 'Chat');
INSERT INTO `employer_permissions` VALUES (4, 'Change Billing');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
