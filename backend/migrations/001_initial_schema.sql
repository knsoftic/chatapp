-- Chat Application Database Schema
-- MySQL 5.7+ / MariaDB 10.3+

CREATE DATABASE IF NOT EXISTS chat_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chat_app;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)   NOT NULL PRIMARY KEY,
  mobile_number VARCHAR(20)   NOT NULL,
  country_code  VARCHAR(5)    NOT NULL DEFAULT '+92',
  email         VARCHAR(255)  NULL,
  first_name    VARCHAR(100)  NOT NULL,
  last_name     VARCHAR(100)  NOT NULL,
  profile_picture VARCHAR(500) NULL,
  bio           TEXT          NULL,
  is_online     TINYINT(1)    NOT NULL DEFAULT 0,
  last_seen     DATETIME      NULL,
  expo_push_token VARCHAR(500) NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_mobile_number UNIQUE (mobile_number),
  INDEX idx_is_online (is_online),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- OTP TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS otps (
  id             VARCHAR(36)  NOT NULL PRIMARY KEY,
  mobile_number  VARCHAR(20)  NOT NULL,
  otp_hash       VARCHAR(255) NOT NULL,
  session_info   TEXT         NULL,
  purpose        ENUM('REGISTRATION','LOGIN') NOT NULL DEFAULT 'LOGIN',
  expires_at     DATETIME     NOT NULL,
  attempts       TINYINT      NOT NULL DEFAULT 0,
  is_verified    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mobile_expires (mobile_number, expires_at),
  INDEX idx_is_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CONVERSATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id              VARCHAR(36) NOT NULL PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  user_id         VARCHAR(36) NOT NULL,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_conv_user UNIQUE (conversation_id, user_id),
  CONSTRAINT fk_cp_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id                VARCHAR(36)   NOT NULL PRIMARY KEY,
  conversation_id   VARCHAR(36)   NOT NULL,
  sender_id         VARCHAR(36)   NOT NULL,
  receiver_id       VARCHAR(36)   NOT NULL,
  client_message_id VARCHAR(100)  NOT NULL,
  message_type      ENUM('TEXT','VOICE','DOCUMENT','IMAGE','SYSTEM') NOT NULL DEFAULT 'TEXT',
  message_text      TEXT          NULL,
  file_url          VARCHAR(1000) NULL,
  file_name         VARCHAR(500)  NULL,
  file_size         BIGINT        NULL,
  mime_type         VARCHAR(255)  NULL,
  duration          FLOAT         NULL,
  status            ENUM('SENDING','SENT','DELIVERED','READ','FAILED') NOT NULL DEFAULT 'SENT',
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at      DATETIME      NULL,
  read_at           DATETIME      NULL,
  CONSTRAINT uq_sender_client_msg UNIQUE (sender_id, client_message_id),
  CONSTRAINT fk_msg_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id) REFERENCES users(id),
  INDEX idx_conversation_created (conversation_id, created_at DESC),
  INDEX idx_receiver_status (receiver_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEVICE TOKENS TABLE (Expo Push Notifications)
-- ============================================================
CREATE TABLE IF NOT EXISTS device_tokens (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id         VARCHAR(36)  NOT NULL,
  expo_push_token VARCHAR(500) NOT NULL,
  platform        ENUM('android','ios','web') NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_push_token UNIQUE (expo_push_token),
  CONSTRAINT fk_dt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
