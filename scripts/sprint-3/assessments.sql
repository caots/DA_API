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

 Date: 19/11/2020 13:50:39
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for assessments
-- ----------------------------
DROP TABLE IF EXISTS `assessments`;
CREATE TABLE `assessments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `assessment_id` bigint(20) NOT NULL COMMENT 'id of AM or customs',
  `name` varchar(255) NOT NULL,
  `type` tinyint(4) DEFAULT '0',
  `category_id` bigint(20) DEFAULT NULL,
  `status` varchar(10) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `category_name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `duration` int(20) DEFAULT NULL COMMENT 'minutes',
  `questions` int(20) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `fk_cat_asm` (`category_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of assessments
-- ----------------------------
BEGIN;
INSERT INTO `assessments` VALUES (26, 1158573, 'Node.JS', 0, 139, 'Active', '2020-11-13 02:51:36', NULL, NULL, NULL, 20, 10);
INSERT INTO `assessments` VALUES (27, 1158485, 'Java Coding Test - High', 0, NULL, 'Active', '2020-11-13 02:51:36', NULL, NULL, NULL, 60, 2);
INSERT INTO `assessments` VALUES (28, 1158420, '3Ds Max', 0, 3, 'Active', '2020-11-13 02:51:36', NULL, NULL, NULL, 20, 10);
INSERT INTO `assessments` VALUES (29, 1158537, 'Abstract Reasoning', 0, 28, 'Active', '2020-11-13 02:51:36', NULL, NULL, NULL, 28, 14);
INSERT INTO `assessments` VALUES (30, 1158414, '.Net Design Patterns', 0, NULL, 'Active', '2020-11-13 02:51:36', NULL, NULL, NULL, 20, 10);
INSERT INTO `assessments` VALUES (31, 1158599, 'Perl Coding Test', 0, 120, 'Active', '2020-11-13 04:27:36', NULL, NULL, NULL, 30, 2);
INSERT INTO `assessments` VALUES (32, 1158614, 'Vendor Management', 0, NULL, 'Active', '2020-11-13 04:27:36', NULL, NULL, NULL, 20, 10);
INSERT INTO `assessments` VALUES (33, 1158601, 'PHP Coding Test - Medium', 0, 104, 'Active', '2020-11-13 04:27:36', NULL, NULL, NULL, 40, 2);
INSERT INTO `assessments` VALUES (34, 1158612, 'SHEQ (Safety, Health, Environment and Quality)', 0, NULL, 'Active', '2020-11-13 04:27:36', NULL, NULL, NULL, 20, 10);
INSERT INTO `assessments` VALUES (35, 1158597, 'Java Coding Test - High', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 60, 2);
INSERT INTO `assessments` VALUES (36, 1158593, 'C# Coding Test - Medium', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 40, 2);
INSERT INTO `assessments` VALUES (37, 1158607, 'Axiom SL Tool', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 20, 10);
INSERT INTO `assessments` VALUES (38, 1158596, 'Data Structures Coding Easy', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 15, 1);
INSERT INTO `assessments` VALUES (39, 1158598, 'Microsoft SQL Coding', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 15, 3);
INSERT INTO `assessments` VALUES (40, 1158595, 'C++ Coding Test - Medium', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 40, 2);
INSERT INTO `assessments` VALUES (41, 1158611, 'Business Analyst for Investment Banking ', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 30, 30);
INSERT INTO `assessments` VALUES (42, 1158592, 'Python Coding Test - Basic', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 32, 3);
INSERT INTO `assessments` VALUES (43, 1158610, 'Business Analyst for Healthcare', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 25, 25);
INSERT INTO `assessments` VALUES (44, 1158603, 'Abstract Reasoning', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 40, 20);
INSERT INTO `assessments` VALUES (45, 1158616, 'Ab Initio', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 20, 10);
INSERT INTO `assessments` VALUES (46, 1158600, 'PHP Coding Test - Basic', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 30, 2);
INSERT INTO `assessments` VALUES (47, 1158602, 'Python 3 Coding Test - Basic', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 30, 2);
INSERT INTO `assessments` VALUES (48, 1158615, 'Yii 2.0', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 20, 10);
INSERT INTO `assessments` VALUES (49, 1158609, 'Business Analyst Excel Test', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 20, 10);
INSERT INTO `assessments` VALUES (50, 1158605, 'Business Analyst Aptitude Test', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 35, 20);
INSERT INTO `assessments` VALUES (51, 1158613, 'Sales Fundamentals', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 20, 20);
INSERT INTO `assessments` VALUES (52, 1158594, 'C++ Coding Test - High', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 60, 2);
INSERT INTO `assessments` VALUES (53, 1158590, 'C Coding Test - Basic', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 30, 2);
INSERT INTO `assessments` VALUES (54, 1158617, 'Machine Learning (ML)', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 20, 15);
INSERT INTO `assessments` VALUES (55, 1158618, 'Business Analyst Aptitude Test', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 35, 20);
INSERT INTO `assessments` VALUES (56, 1158608, 'Business Analyst for Banking', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 30, 30);
INSERT INTO `assessments` VALUES (57, 1158606, 'Auditor Excel Test', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 20, 10);
INSERT INTO `assessments` VALUES (58, 1158604, 'Basic Aptitude Test', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 30, 30);
INSERT INTO `assessments` VALUES (59, 1158591, 'C Coding Test - High', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 60, 2);
INSERT INTO `assessments` VALUES (60, 1158619, 'Basic Aptitude Test', 0, NULL, 'Active', '2020-11-13 04:27:37', NULL, NULL, NULL, 30, 30);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
