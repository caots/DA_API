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

 Date: 27/01/2021 17:05:23
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS
= 0;

-- ----------------------------
-- Records of job_categories
-- ----------------------------
BEGIN;
  INSERT INTO `
  job_categories`
  VALUES
    (1, 'My Custom Assessments', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (2, 'Soft and Communication Skills', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (3, 'Project and Program Management', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (4, 'Data Science and Analytics', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (5, 'Business Intelligence', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (6, 'Cloud Technologies and DevOps', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (7, 'Computer Coding', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (8, 'Computer Coding Tests', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (9, 'Customer Service', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (11, 'Digital Marketing', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (12, 'Engineering and Manufacturing', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (13, 'Finance and Accounting', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (14, 'Healthcare', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (15, 'Human Resources and Recruiting', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (16, 'Logistics and Supply Chain', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (17, 'Project and Program Management', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (18, 'Retail', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (19, 'Sales and Business Development', 1, NULL, NULL);
  INSERT INTO `
  job_categories`
  VALUES
    (20, 'Software User Proficiency', 1, NULL, NULL);
  COMMIT;

  SET FOREIGN_KEY_CHECKS
  = 1;
