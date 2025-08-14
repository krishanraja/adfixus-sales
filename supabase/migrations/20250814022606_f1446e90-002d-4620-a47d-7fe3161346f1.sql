-- Fix the security vulnerability in leads table RLS policy
-- The current SELECT policy has condition 'true' which exposes all lead data publicly
-- We need to restrict access to authenticated users only (assuming leads should be admin-viewable)

-- Drop the existing vulnerable policy
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;

-- Create a new secure policy that only allows authenticated users to view leads
-- This assumes leads are meant to be viewable by site administrators/owners only
CREATE POLICY "Only authenticated users can view leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (true);

-- Alternative: If you want to restrict to specific admin users, you would use:
-- USING (auth.jwt() ->> 'email' = 'admin@yourdomain.com')
-- But for now, requiring authentication is the minimum fix