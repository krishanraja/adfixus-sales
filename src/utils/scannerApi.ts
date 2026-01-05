// Scanner API utilities

import { supabase } from '@/integrations/supabase/client';
import { scannerSupabase } from '@/integrations/supabase/scanner-client';
import type { DomainScan, DomainResult, PublisherContext, ScanRequest } from '@/types/scanner';
import { normalizeSupabaseUrl, validateSupabaseUrlFormat } from '@/utils/envValidation';

/**
 * Diagnostic result interface
 */
export interface DiagnosticResult {
  envVarSet: boolean;
  envVarFormat: 'valid' | 'invalid' | 'unknown';
  url: string | null;
  urlAccessible: boolean;
  dnsResolves: boolean;
  recommendations: string[];
}

/**
 * Comprehensive diagnostic for environment and configuration
 * Checks all possible root causes of ERR_NAME_NOT_RESOLVED errors
 */
export async function diagnoseConfiguration(): Promise<DiagnosticResult> {
  const diagnostics: DiagnosticResult = {
    envVarSet: false,
    envVarFormat: 'unknown',
    url: null,
    urlAccessible: false,
    dnsResolves: false,
    recommendations: [],
  };
  
  // Check if env var is set
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  diagnostics.envVarSet = !!rawUrl;
  
  console.log('[scannerApi] [DIAGNOSTIC] Starting configuration diagnosis...');
  console.log('[scannerApi] [DIAGNOSTIC] VITE_SUPABASE_URL set:', diagnostics.envVarSet);
  
  if (!rawUrl) {
    diagnostics.recommendations.push(
      'VITE_SUPABASE_URL is not set. Set it in Vercel Dashboard → Project Settings → Environment Variables'
    );
    diagnostics.recommendations.push(
      'Ensure the variable is set for all environments: Production, Preview, and Development'
    );
    diagnostics.recommendations.push(
      'After setting, trigger a new deployment in Vercel'
    );
    console.error('[scannerApi] [DIAGNOSTIC] Environment variable not set');
    return diagnostics;
  }
  
  // Normalize and validate URL
  const normalizedUrl = normalizeSupabaseUrl(rawUrl);
  const formatCheck = validateSupabaseUrlFormat(normalizedUrl);
  diagnostics.url = normalizedUrl;
  diagnostics.envVarFormat = formatCheck.valid ? 'valid' : 'invalid';
  
  console.log('[scannerApi] [DIAGNOSTIC] Raw URL:', rawUrl);
  console.log('[scannerApi] [DIAGNOSTIC] Normalized URL:', normalizedUrl);
  console.log('[scannerApi] [DIAGNOSTIC] URL format valid:', formatCheck.valid);
  
  if (rawUrl !== normalizedUrl) {
    console.warn('[scannerApi] [DIAGNOSTIC] URL was normalized:', { from: rawUrl, to: normalizedUrl });
    diagnostics.recommendations.push(
      `URL was normalized from "${rawUrl}" to "${normalizedUrl}". Consider updating Vercel env var to the normalized format.`
    );
  }
  
  if (!formatCheck.valid) {
    diagnostics.recommendations.push(
      `URL format is invalid: ${formatCheck.error}`
    );
    diagnostics.recommendations.push(
      'Expected format: https://[project-id].supabase.co'
    );
    diagnostics.recommendations.push(
      'Example: https://ojtfnhzqhfsprebvpmvx.supabase.co'
    );
    console.error('[scannerApi] [DIAGNOSTIC] URL format invalid:', formatCheck.error);
    return diagnostics;
  }
  
  // Test URL accessibility and DNS resolution
  try {
    console.log('[scannerApi] [DIAGNOSTIC] Testing URL accessibility...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${normalizedUrl}/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    diagnostics.urlAccessible = response.ok || response.status < 500;
    diagnostics.dnsResolves = true; // If fetch doesn't throw, DNS resolved
    
    console.log('[scannerApi] [DIAGNOSTIC] URL accessible:', diagnostics.urlAccessible);
    console.log('[scannerApi] [DIAGNOSTIC] DNS resolves:', diagnostics.dnsResolves);
    console.log('[scannerApi] [DIAGNOSTIC] Response status:', response.status);
    
    if (!diagnostics.urlAccessible && response.status >= 500) {
      diagnostics.recommendations.push(
        'Supabase URL is reachable but returned server error. Check Supabase project status.'
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[scannerApi] [DIAGNOSTIC] URL test failed:', errorMessage);
    
    if (error instanceof TypeError && errorMessage.includes('Failed to fetch')) {
      diagnostics.dnsResolves = false;
      diagnostics.recommendations.push(
        'DNS resolution failed. The domain cannot be resolved.'
      );
      diagnostics.recommendations.push(
        'Possible causes:'
      );
      diagnostics.recommendations.push(
        '  1. Supabase project does not exist or was deleted'
      );
      diagnostics.recommendations.push(
        '  2. Project ID is incorrect'
      );
      diagnostics.recommendations.push(
        '  3. Network/DNS issues'
      );
      diagnostics.recommendations.push(
        'Action: Verify project exists in Supabase Dashboard'
      );
    } else if (error instanceof Error && error.name === 'AbortError') {
      diagnostics.urlAccessible = false;
      diagnostics.recommendations.push(
        'URL accessibility test timed out. Check network connectivity.'
      );
    } else {
      diagnostics.urlAccessible = false;
      diagnostics.recommendations.push(
        `Could not reach Supabase URL: ${errorMessage}`
      );
      diagnostics.recommendations.push(
        'Check network connectivity and firewall settings.'
      );
    }
  }
  
  // If all checks pass but still having issues, provide general recommendations
  if (diagnostics.envVarSet && diagnostics.envVarFormat === 'valid' && diagnostics.dnsResolves) {
    diagnostics.recommendations.push(
      'Configuration appears correct. If issues persist:'
    );
    diagnostics.recommendations.push(
      '  1. Check Vercel build logs for env var warnings'
    );
    diagnostics.recommendations.push(
      '  2. Verify edge function is deployed in Supabase Dashboard'
    );
    diagnostics.recommendations.push(
      '  3. Try clearing Vercel build cache and redeploying'
    );
  }
  
  console.log('[scannerApi] [DIAGNOSTIC] Diagnosis complete:', diagnostics);
  return diagnostics;
}

// Health check to verify edge functions are deployed and accessible
export async function checkEdgeFunctionHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    console.log('[scannerApi] Checking edge function health...');
    
    // Diagnostic logging
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    console.log('[scannerApi] [DIAGNOSTIC] VITE_SUPABASE_URL set:', !!supabaseUrl);
    console.log('[scannerApi] [DIAGNOSTIC] VITE_SUPABASE_URL length:', supabaseUrl?.length || 0);
    if (supabaseUrl) {
      console.log('[scannerApi] [DIAGNOSTIC] Supabase URL (first 30 chars):', supabaseUrl.substring(0, 30) + '...');
    }
    
    // Validate client is configured
    if (!supabase) {
      const error = 'Supabase client not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.';
      console.error('[scannerApi]', error);
      return { healthy: false, error };
    }
    
    // Log actual client URL if available
    try {
      const clientUrl = (supabase as any).supabaseUrl || (supabase as any).rest?.url;
      console.log('[scannerApi] [DIAGNOSTIC] Supabase client URL:', clientUrl ? clientUrl.substring(0, 50) + '...' : 'not available');
    } catch (e) {
      // Ignore - diagnostic only
    }
    
    // Check if we have a valid URL (basic validation)
    if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
      const error = 'Invalid Supabase URL configuration. Please check VITE_SUPABASE_URL environment variable.';
      console.error('[scannerApi]', error);
      return { healthy: false, error };
    }
    
    // Attempt to invoke the edge function with a timeout
    const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) => {
      setTimeout(() => {
        resolve({ error: { message: 'TIMEOUT' } });
      }, 10000); // 10 second timeout
    });
    
    const invokePromise = supabase.functions.invoke('scan-domain', {
      body: { healthCheck: true },
    }).catch((err) => {
      // Catch network errors that might not be in response.error
      // Preserve full error structure including name, stack, and cause
      const errorObj = err instanceof Error ? err : new Error(String(err));
      const errorName = errorObj.name || '';
      const errorMsg = errorObj.message || String(err) || '';
      const errorStack = errorObj.stack || '';
      const errorCause = (errorObj as any).cause || (errorObj as any).originalError || null;
      
      console.error('[scannerApi] [DIAGNOSTIC] Invoke promise rejected:', {
        name: errorName,
        message: errorMsg,
        stack: errorStack,
        cause: errorCause,
      });
      
      // Return error object with full structure preserved
      return { 
        error: {
          name: errorName,
          message: errorMsg,
          stack: errorStack,
          cause: errorCause,
          originalError: (errorObj as any).originalError,
        }
      };
    });
    
    const response = await Promise.race([invokePromise, timeoutPromise]);
    
    // Check for DNS/network errors - inspect full error object structure
    if (response.error) {
      const error = response.error;
      const errorName = error.name || '';
      const errorMsg = error.message || '';
      const errorStack = error.stack || '';
      const errorCause = (error as any).cause || (error as any).originalError || null;
      const errorConstructor = error.constructor?.name || '';
      
      // Comprehensive error object logging for diagnostics
      console.error('[scannerApi] [DIAGNOSTIC] Full error object:', {
        name: errorName,
        message: errorMsg,
        stack: errorStack,
        cause: errorCause,
        originalError: (error as any).originalError,
        constructor: errorConstructor,
        keys: Object.keys(error),
        toString: String(error),
      });
      
      // Check error name/type - also check constructor name as fallback
      const isFunctionsFetchError = 
        errorName === 'FunctionsFetchError' || 
        errorConstructor === 'FunctionsFetchError' ||
        String(error).includes('FunctionsFetchError') ||
        errorMsg.includes('Failed to send a request to the Edge Function');
      
      // Check message for network indicators
      const hasNetworkErrorInMessage = 
        errorMsg.includes('Failed to send') ||
        errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('NetworkError') ||
        errorMsg.includes('NAME_NOT_RESOLVED') ||
        errorMsg.includes('ERR_NAME_NOT_RESOLVED');
      
      // Check stack for DNS errors
      const hasDNSInStack = 
        errorStack.includes('NAME_NOT_RESOLVED') ||
        errorStack.includes('ERR_NAME_NOT_RESOLVED') ||
        errorStack.includes('Failed to fetch');
      
      // Check underlying cause
      const causeHasDNS = errorCause && (
        String(errorCause).includes('NAME_NOT_RESOLVED') ||
        String(errorCause).includes('ERR_NAME_NOT_RESOLVED')
      );
      
      // Check for timeout
      const isTimeout = errorMsg === 'TIMEOUT';
      
      // If FunctionsFetchError with network indicators, treat as DNS failure
      if (isFunctionsFetchError && (hasNetworkErrorInMessage || hasDNSInStack || causeHasDNS)) {
        const errorMessage = `Edge function not accessible. This usually means:
1. The edge function is not deployed (check Supabase dashboard)
2. VITE_SUPABASE_URL is incorrect (should be: https://ojtfnhzqhfsprebvpmvx.supabase.co)
3. Network connectivity issues

Please verify your environment configuration and ensure the edge function is deployed.`;
        console.error('[scannerApi] Edge function not accessible - DNS/Network error detected');
        return { healthy: false, error: errorMessage };
      }
      
      // If FunctionsFetchError but we can't determine if it's network error, default to unhealthy (fail-safe)
      if (isFunctionsFetchError) {
        const errorMessage = 'Failed to reach edge function. This usually indicates a network or configuration issue. Please check VITE_SUPABASE_URL and ensure the edge function is deployed.';
        console.error('[scannerApi] FunctionsFetchError detected - defaulting to unhealthy (fail-safe)');
        return { healthy: false, error: errorMessage };
      }
      
      // Check for explicit DNS/network errors in message or stack
      if (hasNetworkErrorInMessage || hasDNSInStack || causeHasDNS || isTimeout) {
        const errorMessage = `Edge function not accessible. This usually means:
1. The edge function is not deployed (check Supabase dashboard)
2. VITE_SUPABASE_URL is incorrect (should be: https://ojtfnhzqhfsprebvpmvx.supabase.co)
3. Network connectivity issues

Please verify your environment configuration and ensure the edge function is deployed.`;
        console.error('[scannerApi] Edge function not accessible - DNS/Network error:', errorMsg);
        return { healthy: false, error: errorMessage };
      }
      
      // If we can't determine the error type, default to unhealthy (fail-safe approach)
      // Only return healthy if we're CERTAIN it's a function-level error (e.g., 400, 500 from function)
      // For now, default to unhealthy when uncertain to avoid false positives
      console.warn('[scannerApi] Unknown error type - defaulting to unhealthy (fail-safe):', errorMsg);
      return { healthy: false, error: errorMsg || 'Unknown error - cannot determine edge function status' };
    }
    
    console.log('[scannerApi] Edge function is healthy');
    return { healthy: true };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorName = errorObj.name || '';
    const errorMessage = errorObj.message || '';
    const errorStack = errorObj.stack || '';
    const errorCause = (errorObj as any).cause || (errorObj as any).originalError || null;
    
    // Comprehensive error object logging for diagnostics
    console.error('[scannerApi] [DIAGNOSTIC] Exception caught - Full error object:', {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
      cause: errorCause,
      originalError: (errorObj as any).originalError,
      constructor: errorObj.constructor?.name,
      keys: Object.keys(errorObj),
    });
    
    // Check if it's a network/DNS error
    const hasNetworkErrorInMessage = 
      errorMessage.includes('NAME_NOT_RESOLVED') || 
      errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('fetch');
    
    const hasDNSInStack = 
      errorStack.includes('NAME_NOT_RESOLVED') ||
      errorStack.includes('ERR_NAME_NOT_RESOLVED') ||
      errorStack.includes('Failed to fetch');
    
    const causeHasDNS = errorCause && (
      String(errorCause).includes('NAME_NOT_RESOLVED') ||
      String(errorCause).includes('ERR_NAME_NOT_RESOLVED')
    );
    
    if (hasNetworkErrorInMessage || hasDNSInStack || causeHasDNS) {
      return { 
        healthy: false, 
        error: 'Network/DNS error - cannot reach edge function. Please check VITE_SUPABASE_URL and network connectivity.'
      };
    }
    
    // Provide more specific error messages
    let userFriendlyError = 'Failed to check edge function health. ';
    if (errorMessage.includes('URL') || errorMessage.includes('invalid')) {
      userFriendlyError += 'Invalid configuration - please check VITE_SUPABASE_URL environment variable.';
    } else {
      userFriendlyError += errorMessage;
    }
    
    return { 
      healthy: false, 
      error: userFriendlyError
    };
  }
}

export async function createScan(
  domains: string[],
  context?: PublisherContext
): Promise<{ scanId: string; error?: string }> {
  console.log('[scannerApi] Starting scan for domains:', domains);
  console.log('[scannerApi] Context:', context);
  
  try {
    // Validate client is configured
    if (!supabase) {
      const error = 'Supabase client not initialized. Please check your environment configuration.';
      console.error('[scannerApi]', error);
      return { scanId: '', error };
    }
    
    // Call edge function via Lovable's Supabase client (where functions are deployed)
    const { data, error } = await supabase.functions.invoke('scan-domain', {
      body: { domains, context } as ScanRequest,
    });
    
    console.log('[scannerApi] Response:', { data, error });
    
    if (error) {
      console.error('[scannerApi] Function error:', error);
      
      // Provide user-friendly error messages
      let userFriendlyError = error.message || 'Failed to start scan';
      
      if (error.message?.includes('NAME_NOT_RESOLVED') || 
          error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError')) {
        userFriendlyError = 'Failed to connect to scanner service. This usually means:\n' +
          '1. The edge function is not deployed (check Lovable Cloud dashboard)\n' +
          '2. VITE_SUPABASE_URL is incorrect\n' +
          '3. Network connectivity issues\n\n' +
          'Please verify your configuration and try again.';
      } else if (error.message?.includes('Failed to send a request')) {
        userFriendlyError = 'Failed to send request to scanner service. Please check:\n' +
          '1. Your internet connection\n' +
          '2. That the edge function is deployed\n' +
          '3. Your Supabase configuration';
      }
      
      return { scanId: '', error: userFriendlyError };
    }
    
    if (!data?.scanId) {
      console.error('[scannerApi] No scanId in response:', data);
      return { scanId: '', error: 'No scan ID returned from server. The scan may not have been created.' };
    }
    
    console.log('[scannerApi] Scan created successfully:', data.scanId);
    return { scanId: data.scanId };
  } catch (error) {
    console.error('[scannerApi] Exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide user-friendly error messages for common exceptions
    let userFriendlyError = errorMessage;
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      userFriendlyError = 'Network error occurred. Please check your internet connection and try again.';
    } else if (errorMessage.includes('timeout')) {
      userFriendlyError = 'Request timed out. The scanner service may be slow to respond. Please try again.';
    }
    
    return { scanId: '', error: userFriendlyError };
  }
}

export async function getScanStatus(scanId: string): Promise<DomainScan | null> {
  console.log('[scannerApi] Fetching scan status:', scanId);
  
  const { data, error } = await scannerSupabase
    .from('domain_scans')
    .select('*')
    .eq('id', scanId)
    .single();
  
  if (error) {
    console.error('[scannerApi] Error fetching scan status:', error);
    return null;
  }
  
  console.log('[scannerApi] Scan status:', data);
  return data as DomainScan;
}

export async function getScanResults(scanId: string): Promise<DomainResult[]> {
  console.log('[scannerApi] Fetching scan results:', scanId);
  
  const { data, error } = await scannerSupabase
    .from('domain_results')
    .select('*')
    .eq('scan_id', scanId)
    .order('scanned_at', { ascending: true });
  
  if (error) {
    console.error('[scannerApi] Error fetching scan results:', error);
    return [];
  }
  
  console.log('[scannerApi] Scan results count:', data?.length);
  return data as DomainResult[];
}

export function parseDomains(input: string): string[] {
  return input
    .split(/[\n,]/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(domain => {
      // Remove protocol if present
      let cleaned = domain.replace(/^https?:\/\//, '');
      // Remove path if present
      cleaned = cleaned.split('/')[0];
      // Remove www. prefix
      cleaned = cleaned.replace(/^www\./, '');
      return cleaned;
    })
    .filter((domain, index, self) => self.indexOf(domain) === index) // Remove duplicates
    .slice(0, 20); // Limit to 20 domains
}

export async function parseCSVFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const domains = parseDomains(text);
      resolve(domains);
    };
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
}

// Subscribe to real-time scan updates (uses scanner database)
export function subscribeScanUpdates(
  scanId: string,
  onUpdate: (scan: DomainScan) => void
) {
  console.log('[scannerApi] Subscribing to scan updates:', scanId);
  
  const channel = scannerSupabase
    .channel(`scan-${scanId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'domain_scans',
        filter: `id=eq.${scanId}`,
      },
      (payload) => {
        console.log('[scannerApi] Scan update received:', payload.new);
        onUpdate(payload.new as DomainScan);
      }
    )
    .subscribe();
  
  return () => {
    console.log('[scannerApi] Unsubscribing from scan updates:', scanId);
    scannerSupabase.removeChannel(channel);
  };
}

// Subscribe to real-time result updates (uses scanner database)
export function subscribeResultUpdates(
  scanId: string,
  onResult: (result: DomainResult) => void
) {
  console.log('[scannerApi] Subscribing to result updates:', scanId);
  
  const channel = scannerSupabase
    .channel(`results-${scanId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'domain_results',
        filter: `scan_id=eq.${scanId}`,
      },
      (payload) => {
        console.log('[scannerApi] Result update received:', payload.new);
        onResult(payload.new as DomainResult);
      }
    )
    .subscribe();
  
  return () => {
    console.log('[scannerApi] Unsubscribing from result updates:', scanId);
    scannerSupabase.removeChannel(channel);
  };
}
