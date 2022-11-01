/*
 Navicat Premium Data Transfer

 Source Server         : db-local
 Source Server Type    : MySQL
 Source Server Version : 80020
 Source Host           : localhost:3306
 Source Schema         : measuredskills

 Target Server Type    : MySQL
 Target Server Version : 80020
 File Encoding         : 65001

 Date: 28/10/2020 11:21:03
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for job_bookmarks
-- ----------------------------
DROP TABLE IF EXISTS `job_bookmarks`;
CREATE TABLE `job_bookmarks` (
  `job_id` bigint NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `job_seeker_id` bigint NOT NULL,
  PRIMARY KEY (`job_id`,`job_seeker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPACT;

SET FOREIGN_KEY_CHECKS = 1;
