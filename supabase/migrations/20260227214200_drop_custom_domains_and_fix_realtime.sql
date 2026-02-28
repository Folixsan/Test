-- Drop custom_domains table (feature removed - domains now configured via MAIL_DOMAINS env var)
DROP TABLE IF EXISTS public.custom_domains;

-- Fix realtime: Set REPLICA IDENTITY FULL on received_emails
-- This ensures Supabase Realtime payload.new contains ALL columns (including temp_email_id)
-- Without this, only the primary key (id) is sent, breaking client-side filtering
ALTER TABLE public.received_emails REPLICA IDENTITY FULL;

-- Add message_id column for webhook idempotency (deduplication)
ALTER TABLE public.received_emails ADD COLUMN IF NOT EXISTS message_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_received_emails_message_id ON public.received_emails(message_id) WHERE message_id IS NOT NULL;
