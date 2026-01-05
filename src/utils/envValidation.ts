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
 * Normalizes Supabase URL to ensure correct format
 * - Trims whitespace
 * - Removes trailing slashes
 * - Ensures https:// protocol
 */
export function normalizeSupabaseUrl(url: string): string {
  if (!url) return url;
  
  // Trim whitespace
  let normalized = url.trim();
  
  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, '');
  
  // Ensure https:// protocol
  if (!normalized.startsWith('https://')) {
    if (normalized.startsWith('http://')) {
      normalized = normalized.replace('http://', 'https://');
    } else {
      normalized = `https://${normalized}`;
    }
  }
  
  return normalized;
}

/**
 * Validates Supabase URL format strictly
 * Returns validation result with error message if invalid
 */
export function validateSupabaseUrlFormat(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is empty' };
  }
  
  // Must start with https://
  if (!url.startsWith('https://')) {
    return { valid: false, error: 'URL must use HTTPS protocol' };
  }
  
  // Must match Supabase domain pattern: https://[project-id].supabase.co
  const supabasePattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;
  if (!supabasePattern.test(url)) {
    return { 
      valid: false, 
      error: `URL format invalid. Expected: https://[project-id].supabase.co, Got: ${url}` 
    };
  }
  
  // Must not have path (check after https://)
  const afterProtocol = url.substring(8); // After "https://"
  const pathIndex = afterProtocol.indexOf('/');
  if (pathIndex !== -1) {
    return { valid: false, error: 'URL must not contain a path' };
  }
  
  return { valid: true };
}

/**
 * Validates Supabase configuration for the main Supabase project
 * Used for edge function calls
 * Automatically normalizes URL format
 */
export function validateSupabaseConfig(): SupabaseConfig {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const errors: string[] = [];
  
  if (!rawUrl) {
    errors.push('VITE_SUPABASE_URL is not set. This is required for edge function calls.');
  } else {
    // Normalize URL (trim, remove trailing slash, ensure https://)
    const normalizedUrl = normalizeSupabaseUrl(rawUrl);
    
    // Log if URL was normalized (for debugging)
    if (rawUrl !== normalizedUrl && import.meta.env.DEV) {
      console.warn('[envValidation] URL was normalized:', { from: rawUrl, to: normalizedUrl });
    }
    
    // Validate format
    const formatCheck = validateSupabaseUrlFormat(normalizedUrl);
    if (!formatCheck.valid) {
      errors.push(`VITE_SUPABASE_URL format error: ${formatCheck.error}`);
      if (rawUrl !== normalizedUrl) {
        errors.push(`Original URL: ${rawUrl}, Normalized: ${normalizedUrl}`);
      }
    }
    
    // Return normalized URL if valid
    if (errors.length === 0) {
      return { url: normalizedUrl, key: key || '' };
    }
  }
  
  if (!key) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY is not set. This is required for Supabase client initialization.');
  } else if (key.length < 50) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY appears invalid (too short).');
  }
  
  if (errors.length > 0) {
    const errorMessage = `Supabase configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}\n\nPlease check your .env file or environment variables in Vercel Dashboard.`;
    
    if (import.meta.env.DEV) {
      console.error('[envValidation]', errorMessage);
      throw new Error(errorMessage);
    } else {
      // In production, log but don't throw to allow graceful degradation
      console.error('[envValidation]', errorMessage);
      throw new Error('Supabase configuration is missing or invalid. Please contact support.');
    }
  }
  
  // This should never be reached, but TypeScript needs it
  const normalizedUrl = rawUrl ? normalizeSupabaseUrl(rawUrl) : '';
  return { url: normalizedUrl, key: key || '' };
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
