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

 Date: 29/12/2020 17:01:17
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for payment_converge_logs
-- ----------------------------
DROP TABLE IF EXISTS `payment_converge_logs`;
CREATE TABLE `payment_converge_logs` (
  `ssl_txn_id` varchar(100) NOT NULL,
  `payment_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `ssl_token` varchar(255) DEFAULT NULL,
  `ssl_amount` varchar(50) DEFAULT NULL,
  `ssl_oar_data` varchar(100) DEFAULT NULL,
  `ssl_departure_date` varchar(50) DEFAULT NULL,
  `ssl_card_number` varchar(50) DEFAULT NULL,
  `ssl_issuer_response` varchar(10) DEFAULT NULL,
  `ssl_merchant_initiated_unscheduled` varchar(10) DEFAULT NULL,
  `ssl_avs_response` varchar(10) DEFAULT NULL,
  `ssl_approval_code` varchar(50) DEFAULT NULL,
  `ssl_txn_time` varchar(50) DEFAULT NULL,
  `ssl_exp_date` varchar(10) DEFAULT NULL,
  `ssl_card_short_description` varchar(10) DEFAULT NULL,
  `ssl_get_token` varchar(50) DEFAULT NULL,
  `ssl_completion_date` varchar(50) DEFAULT NULL,
  `ssl_token_response` varchar(50) DEFAULT NULL,
  `ssl_card_type` varchar(50) DEFAULT NULL,
  `ssl_transaction_type` varchar(50) DEFAULT NULL,
  `ssl_cvm_signature_override_result` varchar(50) DEFAULT NULL,
  `ssl_account_balance` varchar(50) DEFAULT NULL,
  `ssl_ps2000_data` varchar(255) DEFAULT NULL,
  `ssl_result_message` varchar(50) DEFAULT NULL,
  `ssl_invoice_number` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `ssl_cvv2_response` varchar(10) DEFAULT NULL,
  `ssl_partner_app_id` varchar(10) DEFAULT NULL,
  `ssl_result` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ssl_txn_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
