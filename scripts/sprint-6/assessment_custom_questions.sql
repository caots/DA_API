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

 Date: 13/01/2021 16:42:34
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for assessment_custom_questions
-- ----------------------------
DROP TABLE IF EXISTS `assessment_custom_questions`;
CREATE TABLE `assessment_custom_questions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `assessment_custom_id` bigint(20) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `type` tinyint(4) DEFAULT '0' COMMENT 'MultipleChoice: 0,   CheckBoxes: 1,   SingleTextBox: 2,\n\n \n  CheckBoxes: 1,\n  SingleTextBox: 2,',
  `answers` text COMMENT '[{"Id":1,"Answer":"123"},...]',
  `full_answers` text NOT NULL COMMENT '[{"Id":1,"Answer":"123","IsTrue":0},...]',
  `weight` float DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `fk_cat_asm` (`assessment_custom_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
