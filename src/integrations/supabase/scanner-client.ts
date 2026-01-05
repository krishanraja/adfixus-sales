// Separate Supabase client for the Scanner tool
// Uses a different project than the main calculator - for DATABASE ACCESS ONLY
// Edge functions are called via the main Lovable Supabase client

import { createClient } from '@supabase/supabase-js';
import { validateScannerConfig } from '@/utils/envValidation';

const SCANNER_SUPABASE_URL = 'https://lshyhtgvqdmrakrbcgox.supabase.co';
const SCANNER_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHlodGd2cWRtcmFrcmJjZ294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODY5NDEsImV4cCI6MjA4MzE2Mjk0MX0.ltwoNJ4MitSMmjL1mKhKPlAOtLv-63naF3qTqJES_CI';

// Validate scanner configuration
const scannerConfig = validateScannerConfig();
if (!scannerConfig.valid && import.meta.env.DEV) {
  console.warn('[scanner-client] Scanner configuration validation failed:', scannerConfig.errors);
}

// Singleton pattern - ensure client is only created once
let scannerSupabaseInstance: ReturnType<typeof createClient> | null = null;

function createScannerSupabaseClient() {
  try {
    // Database-only client for the external scanner project
    // Auth is completely disabled to avoid Multiple GoTrueClient warning
    // Uses custom storage key to isolate from main client's auth storage
    const client = createClient(
      SCANNER_SUPABASE_URL,
      SCANNER_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          // Custom storage key to prevent conflicts with main client
          storageKey: 'scanner_supabase_auth_token',
          storage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          },
        },
        global: {
          headers: {
            'x-client-info': 'scanner-client',
          },
        },
      }
    );
    
    if (import.meta.env.DEV) {
      console.log('[scanner-client] Scanner Supabase client initialized successfully');
    }
    
    return client;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[scanner-client] Failed to initialize scanner Supabase client:', errorMessage);
    
    // Create a dummy client that will fail gracefully
    return createClient('https://invalid.supabase.co', 'invalid-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
}

export const scannerSupabase = (() => {
  if (!scannerSupabaseInstance) {
    scannerSupabaseInstance = createScannerSupabaseClient();
  }
  return scannerSupabaseInstance;
})();
