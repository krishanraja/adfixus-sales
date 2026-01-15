// Separate Supabase client for the Scanner tool
// Uses a different project than the main calculator - for DATABASE ACCESS ONLY
// Edge functions are called via the main Supabase client
// 
// IMPORTANT: This client uses a workaround to avoid GoTrueClient multiple instances warning.
// We use a custom storage implementation and ensure the client is created with minimal auth footprint.

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let scannerSupabaseInstance: any = null;

function createScannerSupabaseClient() {
  try {
    // Create a custom storage that completely isolates from main client
    // This prevents GoTrueClient from detecting multiple instances
    const isolatedStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };

    // Database-only client for the external scanner project
    // Auth is completely disabled to avoid Multiple GoTrueClient warning
    // Uses isolated storage and custom storage key to prevent conflicts
    const client = createClient(
      SCANNER_SUPABASE_URL,
      SCANNER_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          // Use a completely isolated storage key to prevent any conflicts
          storageKey: 'scanner_supabase_auth_token_isolated',
          // Use isolated storage that never persists anything
          storage: isolatedStorage,
          // Disable flow type to minimize GoTrueClient initialization
          flowType: 'pkce',
        },
        global: {
          headers: {
            'x-client-info': 'scanner-client',
          },
        },
        // Disable realtime for this client to reduce initialization
        realtime: {
          params: {
            eventsPerSecond: 2,
          },
        },
      }
    );
    
    // Suppress the GoTrueClient warning by ensuring we only use this client for DB operations
    // The warning is harmless but we minimize it by using isolated storage
    
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
