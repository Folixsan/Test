-- Setup pg_cron job to auto-cleanup old emails every hour
-- Deletes received_emails older than 3 hours, EXCEPT messages for admin-created temp_emails

-- Ensure pg_net is not needed — we do cleanup directly in SQL (simpler, no HTTP call needed)

-- Remove existing job if any (idempotent)
SELECT cron.unschedule('cleanup-old-emails') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-emails'
);

-- Schedule cleanup every hour
SELECT cron.schedule(
  'cleanup-old-emails',
  '0 * * * *',
  $$
  DELETE FROM public.received_emails
  WHERE received_at < now() - interval '3 hours'
  AND temp_email_id NOT IN (
    SELECT id FROM public.temp_emails WHERE admin_id IS NOT NULL
  );
  $$
);
