-- Migration: 002_add_user_token_version.sql
-- Description: Adds token_version column to users table for server-side JWT revocation

ALTER TABLE users 
ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER business_phone;
