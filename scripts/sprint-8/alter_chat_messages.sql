ALTER TABLE `chat_messages`
ADD COLUMN `content_html` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `content`;
