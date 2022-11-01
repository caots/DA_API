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

 Date: 19/11/2020 13:48:12
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for job_categories
-- ----------------------------
DROP TABLE IF EXISTS `job_categories`;
CREATE TABLE `job_categories` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '0: inactive, 1: active',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

-- ----------------------------
-- Records of job_categories
-- ----------------------------
BEGIN;
INSERT INTO `job_categories` VALUES (1, 'Account Management\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (2, 'Administration\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (3, 'Adobe\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (4, 'Apache\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (5, 'API Management\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (6, 'Aptitude\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (7, 'Artificial Intelligence\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (8, 'Atlassian Toolset\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (9, 'AWS (Amazon Web Services)\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (10, 'Backend Technologies\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (11, 'Backup and Recovery\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (12, 'Banking\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (13, 'Big Data\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (14, 'Blockchain\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (15, 'Business Analyst (BABOK)\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (16, 'Business Intelligence\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (17, 'Business Process Management (BPM)\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (18, 'Business Skills\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (19, 'C Language\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (20, 'C# .NET\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (21, 'C++\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (22, 'CA Technologies\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (23, 'C-ACT\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (24, 'Cisco\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (25, 'Citrix\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (26, 'Cloud Computing\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (27, 'Code Quality Tools\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (28, 'Cognitive Ability\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (31, 'Cognos\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (32, 'Computer Fundamentals\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (33, 'Coupa\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (34, 'Customer Service\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (35, 'Cyber Security\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (36, 'Data Modeling\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (37, 'Data Science\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (38, 'Data Science with Python\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (39, 'Database Technologies\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (40, 'Databases\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (41, 'Derivatives Analyst\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (42, 'Design Thinking\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (43, 'Design Tools\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (44, 'DevOps\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (45, 'Digital Marketing\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (46, 'Ecommerce\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (47, 'Electrical Engineering\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (48, 'Electronics Engineering\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (49, 'Emotional intelligence\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (50, 'Entrepreneurship\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (51, 'Equity Trading\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (52, 'Essay Writing\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (53, 'ETL\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (54, 'Finance\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (55, 'French\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (56, 'Frontend Technologies\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (57, 'Full Stack Micro-services\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (58, 'GDPR Awareness\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (59, 'German Language\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (60, 'Healthcare\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (61, 'Helpdesk\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (62, 'HR\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (63, 'IBM\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (64, 'IBM Lotus Notes\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (65, 'IBM Mainframe\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (66, 'INFA IDQ Developer\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (67, 'Informatica\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (68, 'Investment Banking\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (69, 'ISACA\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (70, 'IT Competency\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (71, 'Java 6\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (72, 'Java 8\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (73, 'Java IDE\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (74, 'Java Integration\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (75, 'JSF\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (76, 'Linux\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (77, 'LogicBox\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (78, 'Machine Learning (ML)\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (79, 'Mainframes\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (80, 'Market Research\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (81, 'Master Data Management\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (82, 'Mechanical Engineering\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (83, 'Microsoft\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (84, 'Microsoft .NET\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (85, 'Microsoft Azure\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (86, 'Microsoft BI (Business Intelligence)\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (87, 'Microsoft Server\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (88, 'Microsoft SharePoint\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (89, 'Microsoft SharePoint 2010\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (90, 'Microsoft SQL\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (91, 'Mobile\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (92, 'Mobile Testing\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (93, 'MS Dynamics\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (94, 'MS Dynamics CRM\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (95, 'MS Office\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (96, 'Networking\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (97, 'NextGen Technologies\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (98, 'Office 365 Administration\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (99, 'Operating System\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (100, 'Operation Management\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (101, 'Oracle\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (102, 'Oracle Hyperion\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (103, 'Pharmaceutical\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (104, 'PHP\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (105, 'PMBOK 6.0\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (106, 'Portuguese Language\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (107, 'Product Management\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (108, 'Profile Writing\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (109, 'Project Management\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (110, 'Quality Management\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (111, 'Reading Comprehension\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (112, 'Reasoning Skills\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (113, 'Retail\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (114, 'Ruby on Rails\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (115, 'Sales\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (116, 'Salesforce\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (117, 'SAP\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (118, 'SAP Business Objects\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (119, 'SAS\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (120, 'Scripting\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (121, 'Search Engine and Analytics\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (122, 'Security\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (123, 'ServiceNow\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (124, 'Sitecore\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (125, 'SnapLogic\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (126, 'SOA\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (127, 'Software Architecture\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (128, 'Software Development\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (129, 'Software Engineering\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (130, 'Software Testing\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (131, 'Spanish\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (132, 'Sybase\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (133, 'Teradata\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (134, 'Tibco\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (135, 'Verbal Ability / English Proficiency\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (136, 'Video Interview\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (137, 'VMware\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (138, 'Wealth Management\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (139, 'Web Programming\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (140, 'Web Servers\r', 1, NULL, NULL);
INSERT INTO `job_categories` VALUES (141, 'Workday\r', 1, NULL, NULL);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
