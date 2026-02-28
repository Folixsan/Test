-- Migration: Multi-admin support + Domain management
-- - Creates admin_users table (multi-admin with username/password)
-- - Creates domains table (replaces MAIL_DOMAINS env var)
-- - Adds admin_id to temp_emails (replaces is_admin_created boolean)

-- 1. Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  session_token text UNIQUE NOT NULL,
  is_owner boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Domains table
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text UNIQUE NOT NULL,
  added_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- 3. Add admin_id to temp_emails (who created it — NULL = user-created)
ALTER TABLE temp_emails ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL;

-- 4. Drop is_admin_created (replaced by admin_id IS NOT NULL)
ALTER TABLE temp_emails DROP COLUMN IF EXISTS is_admin_created;
