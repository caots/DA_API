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

 Date: 20/04/2021 11:55:17
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for find_candidate_logs
-- ----------------------------
DROP TABLE IF EXISTS `find_candidate_logs`;
CREATE TABLE `find_candidate_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `employer_id` bigint(20) NOT NULL,
  `max_compensation` varchar(10) DEFAULT NULL,
  `distances` varchar(20) DEFAULT NULL,
  `assessments` text,
  `location` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `zipcode` varchar(255) DEFAULT NULL,
  `lat` varchar(255) DEFAULT NULL,
  `lon` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `order_no` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1329 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
