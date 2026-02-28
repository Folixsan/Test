-- Webhooks table: notify external URLs (e.g. WA gateway) on new email
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  label TEXT DEFAULT '',
  email_filter TEXT DEFAULT NULL, -- NULL = all emails, or specific email address
  added_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookup on new email
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks (is_active) WHERE is_active = true;
