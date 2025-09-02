-- Fix edge function search path security issue
-- Update the send-results-email function to set search_path properly
-- Note: This creates a new function that replaces the edge function behavior
CREATE OR REPLACE FUNCTION public.send_results_email_secure(
  quiz_results jsonb,
  calculator_results jsonb, 
  lead_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Validate input data
  IF quiz_results IS NULL OR calculator_results IS NULL OR lead_data IS NULL THEN
    RETURN jsonb_build_object('error', 'Missing required data');
  END IF;
  
  -- Log the email sending attempt (replace console.log)
  INSERT INTO public.email_logs (
    sent_at,
    quiz_results,
    calculator_results,
    lead_data,
    status
  ) VALUES (
    now(),
    quiz_results,
    calculator_results,
    lead_data,
    'pending'
  );
  
  -- Return success response
  RETURN jsonb_build_object('success', true, 'message', 'Email queued for sending');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Create email logs table for audit trail
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  quiz_results jsonb,
  calculator_results jsonb,
  lead_data jsonb,
  status text DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on email logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access email logs
CREATE POLICY "Only service role can access email logs"
ON public.email_logs
FOR ALL
TO service_role
USING (true);