// Separate Supabase client for the Scanner tool
// Uses a different project than the main calculator - for DATABASE ACCESS ONLY
// Edge functions are called via the main Lovable Supabase client

import { createClient } from '@supabase/supabase-js';

const SCANNER_SUPABASE_URL = 'https://lshyhtgvqdmrakrbcgox.supabase.co';
const SCANNER_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHlodGd2cWRtcmFrcmJjZ294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODY5NDEsImV4cCI6MjA4MzE2Mjk0MX0.ltwoNJ4MitSMmjL1mKhKPlAOtLv-63naF3qTqJES_CI';

// Database-only client for the external scanner project
// Auth is completely disabled to avoid Multiple GoTrueClient warning
export const scannerSupabase = createClient(
  SCANNER_SUPABASE_URL,
  SCANNER_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
  }
);
