// Separate Supabase client for the Scanner tool
// Uses a different project than the main calculator

import { createClient } from '@supabase/supabase-js';

const SCANNER_SUPABASE_URL = 'https://lshyhtgvqdmrakrbcgox.supabase.co';
const SCANNER_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHlodGd2cWRtcmFrcmJjZ294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODY5NDEsImV4cCI6MjA4MzE2Mjk0MX0.ltwoNJ4MitSMmjL1mKhKPlAOtLv-63naF3qTqJES_CI';

export const scannerSupabase = createClient(
  SCANNER_SUPABASE_URL,
  SCANNER_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Helper to get the scanner Supabase URL for edge function calls
export const getScannerFunctionUrl = (functionName: string) => {
  return `${SCANNER_SUPABASE_URL}/functions/v1/${functionName}`;
};
