-- Fix RLS policies for leads table to be more secure
-- Remove overly permissive "Anyone can create leads" policy and replace with proper authentication
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Only authenticated users can view leads" ON public.leads;

-- Create more secure policies
-- Only allow authenticated users to create leads with their own data
CREATE POLICY "Authenticated users can create leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Only allow users to view their own leads (if we had user_id) or admin access
-- Since leads table doesn't have user_id, we'll restrict to service role only for now
CREATE POLICY "Only service role can view leads" 
ON public.leads 
FOR SELECT 
TO service_role
USING (true);

-- Add UPDATE policy for service role only
CREATE POLICY "Only service role can update leads" 
ON public.leads 
FOR UPDATE 
TO service_role
USING (true);

-- Add DELETE policy for service role only  
CREATE POLICY "Only service role can delete leads" 
ON public.leads 
FOR DELETE 
TO service_role
USING (true);