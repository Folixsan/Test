-- Add is_admin_created flag to temp_emails
-- Emails created by admin won't have their messages auto-deleted by cleanup
ALTER TABLE temp_emails ADD COLUMN IF NOT EXISTS is_admin_created BOOLEAN DEFAULT FALSE;
