// Environment Variable Validation Utility
// Provides runtime validation and helpful error messages for missing/invalid configuration

interface SupabaseConfig {
  url: string;
  key: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates Supabase configuration for the main Lovable Cloud project
 * Used for edge function calls
 */
export function validateSupabaseConfig(): SupabaseConfig {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const errors: string[] = [];
  
  if (!url) {
    errors.push('VITE_SUPABASE_URL is not set. This is required for edge function calls.');
  } else if (!url.startsWith('https://')) {
    errors.push(`VITE_SUPABASE_URL must be a valid HTTPS URL. Got: ${url}`);
  } else if (!url.includes('.supabase.co')) {
    errors.push(`VITE_SUPABASE_URL appears invalid. Expected format: https://[project-id].supabase.co`);
  }
  
  if (!key) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY is not set. This is required for Supabase client initialization.');
  } else if (key.length < 50) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY appears invalid (too short).');
  }
  
  if (errors.length > 0) {
    const errorMessage = `Supabase configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}\n\nPlease check your .env file or environment variables.`;
    
    if (import.meta.env.DEV) {
      console.error('[envValidation]', errorMessage);
      throw new Error(errorMessage);
    } else {
      // In production, log but don't throw to allow graceful degradation
      console.error('[envValidation]', errorMessage);
      throw new Error('Supabase configuration is missing or invalid. Please contact support.');
    }
  }
  
  return { url, key };
}

/**
 * Validates scanner database configuration
 * Returns validation result without throwing (for optional features)
 */
export function validateScannerConfig(): ValidationResult {
  const url = 'https://lshyhtgvqdmrakrbcgox.supabase.co';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHlodGd2cWRtcmFrcmJjZ294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODY5NDEsImV4cCI6MjA4MzE2Mjk0MX0.ltwoNJ4MitSMmjL1mKhKPlAOtLv-63naF3qTqJES_CI';
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Scanner config is hardcoded, so we just validate format
  if (!url.startsWith('https://')) {
    errors.push('Scanner Supabase URL format is invalid');
  }
  
  if (!key || key.length < 50) {
    errors.push('Scanner Supabase key appears invalid');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates all environment variables and logs warnings/errors
 * Call this at app startup in development mode
 */
export function validateAllEnvVars(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    validateSupabaseConfig();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown Supabase config error');
  }
  
  const scannerResult = validateScannerConfig();
  errors.push(...scannerResult.errors);
  warnings.push(...scannerResult.warnings);
  
  // Check for optional variables
  if (!import.meta.env.VITE_MEETING_BOOKING_URL) {
    warnings.push('VITE_MEETING_BOOKING_URL is not set. PDF export may have incorrect booking links.');
  }
  
  if (import.meta.env.DEV && (errors.length > 0 || warnings.length > 0)) {
    console.group('[envValidation] Environment Variable Check');
    if (errors.length > 0) {
      console.error('Errors:', errors);
    }
    if (warnings.length > 0) {
      console.warn('Warnings:', warnings);
    }
    console.groupEnd();
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets the Supabase URL for edge function calls
 * Validates before returning
 */
export function getSupabaseUrl(): string {
  const config = validateSupabaseConfig();
  return config.url;
}

/**
 * Gets the Supabase publishable key
 * Validates before returning
 */
export function getSupabaseKey(): string {
  const config = validateSupabaseConfig();
  return config.key;
}
