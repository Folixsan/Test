-- Create table for temporary email addresses
CREATE TABLE public.temp_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for received emails
CREATE TABLE public.received_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  temp_email_id UUID NOT NULL REFERENCES public.temp_emails(id) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  from_name TEXT,
  subject TEXT NOT NULL DEFAULT '(No Subject)',
  body_text TEXT,
  body_html TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_temp_emails_email ON public.temp_emails(email);
CREATE INDEX idx_temp_emails_session_token ON public.temp_emails(session_token);
CREATE INDEX idx_received_emails_temp_email_id ON public.received_emails(temp_email_id);
CREATE INDEX idx_received_emails_received_at ON public.received_emails(received_at DESC);

-- Enable Row Level Security
ALTER TABLE public.temp_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for temp_emails (public access via session token)
CREATE POLICY "Anyone can create temp email" 
ON public.temp_emails 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read temp email with session token" 
ON public.temp_emails 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can delete temp email with session token" 
ON public.temp_emails 
FOR DELETE 
USING (true);

-- RLS Policies for received_emails
CREATE POLICY "Anyone can read received emails" 
ON public.received_emails 
FOR SELECT 
USING (true);

CREATE POLICY "Edge functions can insert received emails" 
ON public.received_emails 
FOR INSERT 
WITH CHECK (true);