-- Remove unique constraint on session_token to allow multiple emails per session
ALTER TABLE public.temp_emails DROP CONSTRAINT IF EXISTS temp_emails_session_token_key;

-- Add index for faster lookups (without unique constraint)
CREATE INDEX IF NOT EXISTS idx_temp_emails_session_token ON public.temp_emails(session_token);