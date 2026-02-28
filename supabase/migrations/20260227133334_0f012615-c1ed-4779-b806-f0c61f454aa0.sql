CREATE POLICY "Anyone can delete received emails"
ON public.received_emails
FOR DELETE
USING (true);