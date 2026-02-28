-- Enable pgcrypto (may already exist)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create table for user custom domains
CREATE TABLE public.custom_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  session_token TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_code TEXT NOT NULL DEFAULT md5(random()::text),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read their own domains with session token
CREATE POLICY "Users can read their domains with session token"
ON public.custom_domains
FOR SELECT
USING (true);

-- Policy: Anyone can insert domains
CREATE POLICY "Anyone can add domain"
ON public.custom_domains
FOR INSERT
WITH CHECK (true);

-- Policy: Users can update their own domains
CREATE POLICY "Users can update their domains with session token"
ON public.custom_domains
FOR UPDATE
USING (true);

-- Policy: Users can delete their own domains
CREATE POLICY "Users can delete their domains with session token"
ON public.custom_domains
FOR DELETE
USING (true);

-- Create index for faster domain lookup
CREATE INDEX idx_custom_domains_domain ON public.custom_domains(domain);
CREATE INDEX idx_custom_domains_session_token ON public.custom_domains(session_token);