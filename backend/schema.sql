CREATE DATABASE IF NOT EXISTS urlshortener;
USE urlshortener;

CREATE TABLE IF NOT EXISTS users (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  api_key    VARCHAR(64)  NOT NULL UNIQUE,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_api_key (api_key)
);

CREATE TABLE IF NOT EXISTS urls (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  short_code VARCHAR(20)  NOT NULL UNIQUE,
  long_url   TEXT         NOT NULL,
  user_id    BIGINT UNSIGNED NULL,
  custom_slug TINYINT(1)  DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP    NULL,
  INDEX idx_short_code (short_code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS clicks (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  short_code VARCHAR(20)  NOT NULL,
  ip         VARCHAR(45)  NULL,
  user_agent TEXT         NULL,
  referer    TEXT         NULL,
  country    VARCHAR(64)  NULL,
  device     VARCHAR(32)  NULL,
  clicked_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_short_code (short_code),
  INDEX idx_clicked_at (clicked_at)
);
