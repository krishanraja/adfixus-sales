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
  edgeFunctionDeployed: boolean;
  edgeFunctionCorsWorking: boolean;
  edgeFunctionError: string | null;
  recommendations: string[];
}

/**
 * Comprehensive diagnostic for environment and configuration
 * Checks all possible root causes of ERR_NAME_NOT_RESOLVED errors
 */
/**
 * Test edge function CORS configuration
 */
async function testEdgeFunctionCors(url: string): Promise<{
  corsWorking: boolean;
  optionsStatus: number | null;
  corsHeaders: Record<string, string>;
  error?: string;
}> {
  const result = {
    corsWorking: false,
    optionsStatus: null as number | null,
    corsHeaders: {} as Record<string, string>,
    error: undefined as string | undefined,
  };

  try {
    const functionUrl = `${url}/functions/v1/scan-domain`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://adfixus-sales.vercel.app';
    
    // Get the anon key for authentication - Supabase requires apikey header even for OPTIONS
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    console.log('[scannerApi] [DIAGNOSTIC] Testing edge function CORS...');
    console.log('[scannerApi] [DIAGNOSTIC] Function URL:', functionUrl);
    console.log('[scannerApi] [DIAGNOSTIC] Origin:', origin);
    console.log('[scannerApi] [DIAGNOSTIC] Anon key available:', !!anonKey);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Supabase Edge Functions require 'apikey' header even for OPTIONS requests
    // This is the REAL fix - without this, Supabase blocks the request
    const headers: Record<string, string> = {
      'Origin': origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization, x-client-info, apikey, content-type',
    };
    
    // Add apikey header if available (required by Supabase)
    if (anonKey) {
      headers['apikey'] = anonKey;
    }
    
    const response = await fetch(functionUrl, {
      method: 'OPTIONS',
      headers: headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    result.optionsStatus = response.status;
    
    // Extract CORS headers
    const corsHeaderNames = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
      'Access-Control-Max-Age',
    ];
    
    corsHeaderNames.forEach(headerName => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        result.corsHeaders[headerName] = headerValue;
      }
    });
    
    // CORS is working if:
    // 1. Status is 200 (not 404, 500, etc.)
    // 2. CORS headers are present
    result.corsWorking = response.status === 200 && 
      result.corsHeaders['Access-Control-Allow-Origin'] !== undefined;
    
    console.log('[scannerApi] [DIAGNOSTIC] OPTIONS response status:', result.optionsStatus);
    console.log('[scannerApi] [DIAGNOSTIC] CORS headers:', result.corsHeaders);
    console.log('[scannerApi] [DIAGNOSTIC] CORS working:', result.corsWorking);
    
    if (!result.corsWorking) {
      if (response.status === 404) {
        result.error = 'Edge function not found (404). Function may not be deployed.';
      } else if (response.status >= 500) {
        result.error = `Edge function server error (${response.status}). Check function logs.`;
      } else if (response.status !== 200) {
        result.error = `Edge function returned unexpected status (${response.status}). Expected 200 for OPTIONS.`;
      } else if (!result.corsHeaders['Access-Control-Allow-Origin']) {
        result.error = 'CORS headers missing. Edge function OPTIONS handler not returning CORS headers.';
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[scannerApi] [DIAGNOSTIC] CORS test failed:', errorMessage);
    
    if (error instanceof TypeError && errorMessage.includes('Failed to fetch')) {
      result.error = 'Failed to reach edge function. Check if function is deployed and URL is correct.';
    } else if (error instanceof Error && error.name === 'AbortError') {
      result.error = 'CORS test timed out. Edge function may be slow to respond or not deployed.';
    } else {
      result.error = `CORS test error: ${errorMessage}`;
    }
  }
  
  return result;
}

export async function diagnoseConfiguration(): Promise<DiagnosticResult> {
  const diagnostics: DiagnosticResult = {
    envVarSet: false,
    envVarFormat: 'unknown',
    url: null,
    urlAccessible: false,
    dnsResolves: false,
    edgeFunctionDeployed: false,
    edgeFunctionCorsWorking: false,
    edgeFunctionError: null,
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
  
  // Test edge function deployment and CORS if basic configuration is valid
  if (diagnostics.envVarSet && diagnostics.envVarFormat === 'valid' && diagnostics.dnsResolves && diagnostics.url) {
    console.log('[scannerApi] [DIAGNOSTIC] Testing edge function deployment and CORS...');
    
    const corsTest = await testEdgeFunctionCors(diagnostics.url);
    
    diagnostics.edgeFunctionDeployed = corsTest.optionsStatus !== null && corsTest.optionsStatus !== 404;
    diagnostics.edgeFunctionCorsWorking = corsTest.corsWorking;
    diagnostics.edgeFunctionError = corsTest.error || null;
    
    if (corsTest.optionsStatus === 404) {
      diagnostics.recommendations.push(
        'Edge function not found (404). The scan-domain function is not deployed.'
      );
      diagnostics.recommendations.push(
        'Action: Deploy the edge function in Supabase Dashboard → Edge Functions → Deploy scan-domain'
      );
    } else if (corsTest.optionsStatus !== 200) {
      diagnostics.recommendations.push(
        `Edge function OPTIONS request returned status ${corsTest.optionsStatus}. Expected 200.`
      );
      diagnostics.recommendations.push(
        'Action: Check edge function logs in Supabase Dashboard for errors'
      );
    } else if (!corsTest.corsWorking) {
      diagnostics.recommendations.push(
        'Edge function OPTIONS handler is not returning CORS headers correctly.'
      );
      diagnostics.recommendations.push(
        'Action: Verify edge function OPTIONS handler returns status 200 with CORS headers'
      );
      diagnostics.recommendations.push(
        'Required headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers'
      );
    } else {
      diagnostics.recommendations.push(
        'Edge function CORS configuration appears correct.'
      );
    }
    
    if (corsTest.error) {
      diagnostics.recommendations.push(`Error: ${corsTest.error}`);
    }
  }
  
  // If all checks pass but still having issues, provide general recommendations
  if (diagnostics.envVarSet && diagnostics.envVarFormat === 'valid' && diagnostics.dnsResolves && diagnostics.edgeFunctionCorsWorking) {
    diagnostics.recommendations.push(
      'Configuration appears correct. If issues persist:'
    );
    diagnostics.recommendations.push(
      '  1. Check Vercel build logs for env var warnings'
    );
    diagnostics.recommendations.push(
      '  2. Check edge function logs in Supabase Dashboard for runtime errors'
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
      
      // Check for CORS errors - these are distinct from DNS/network errors
      const hasCorsError = 
        errorMsg.includes('CORS') ||
        errorMsg.includes('cors') ||
        errorMsg.includes('preflight') ||
        errorMsg.includes('access control') ||
        errorMsg.includes('Access-Control') ||
        errorStack.includes('CORS') ||
        errorStack.includes('cors') ||
        errorStack.includes('preflight') ||
        errorStack.includes('access control') ||
        (errorCause && (
          String(errorCause).includes('CORS') ||
          String(errorCause).includes('cors') ||
          String(errorCause).includes('preflight')
        )) ||
        // ERR_FAILED combined with FunctionsFetchError often indicates CORS block
        (isFunctionsFetchError && errorMsg.includes('ERR_FAILED'));
      
      // If CORS error detected, provide specific CORS guidance
      if (hasCorsError) {
        const corsErrorMessage = `CORS (Cross-Origin Resource Sharing) error detected. The edge function preflight request is failing.

This usually means:
1. Edge function OPTIONS handler is not returning 200 status
2. Edge function CORS headers are missing or incorrect
3. Edge function may not be deployed (OPTIONS returns 404/500)

Action steps:
1. Check Supabase Dashboard → Edge Functions → scan-domain → Logs
2. Verify OPTIONS requests are being handled (look for "Handling CORS preflight" in logs)
3. Test OPTIONS request directly: curl -X OPTIONS https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain -H "Origin: ${typeof window !== 'undefined' ? window.location.origin : 'https://adfixus-sales.vercel.app'}" -v
4. Verify edge function returns status 200 with CORS headers for OPTIONS requests

If edge function is not deployed, deploy it in Supabase Dashboard.`;
        console.error('[scannerApi] CORS error detected - preflight request failing');
        return { healthy: false, error: corsErrorMessage };
      }
      
      // If FunctionsFetchError with network indicators, treat as DNS failure
      if (isFunctionsFetchError && (hasNetworkErrorInMessage || hasDNSInStack || causeHasDNS)) {
        const errorMessage = `Edge function not accessible. This usually means:
1. The edge function is not deployed (check Supabase dashboard)
2. VITE_SUPABASE_URL is incorrect (should be: https://lshyhtgvqdmrakrbcgox.supabase.co)
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
2. VITE_SUPABASE_URL is incorrect (should be: https://lshyhtgvqdmrakrbcgox.supabase.co)
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
    
    // Check for CORS errors in exception handler
    const hasCorsError = 
      errorMessage.includes('CORS') ||
      errorMessage.includes('cors') ||
      errorMessage.includes('preflight') ||
      errorMessage.includes('access control') ||
      errorMessage.includes('Access-Control') ||
      errorStack.includes('CORS') ||
      errorStack.includes('cors') ||
      errorStack.includes('preflight') ||
      errorStack.includes('access control') ||
      (errorCause && (
        String(errorCause).includes('CORS') ||
        String(errorCause).includes('cors') ||
        String(errorCause).includes('preflight')
      ));
    
    if (hasCorsError) {
      const corsErrorMessage = `CORS (Cross-Origin Resource Sharing) error detected. The edge function preflight request is failing.

This usually means:
1. Edge function OPTIONS handler is not returning 200 status
2. Edge function CORS headers are missing or incorrect
3. Edge function may not be deployed (OPTIONS returns 404/500)

Action steps:
1. Check Supabase Dashboard → Edge Functions → scan-domain → Logs
2. Verify OPTIONS requests are being handled
3. Test OPTIONS request directly with curl
4. Verify edge function returns status 200 with CORS headers for OPTIONS requests

If edge function is not deployed, deploy it in Supabase Dashboard.`;
      console.error('[scannerApi] CORS error detected in exception handler');
      return { healthy: false, error: corsErrorMessage };
    }
    
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
      
      // Check for CORS errors first
      if (error.message?.includes('CORS') || 
          error.message?.includes('cors') ||
          error.message?.includes('preflight') ||
          error.message?.includes('access control')) {
        userFriendlyError = 'CORS (Cross-Origin Resource Sharing) error. The edge function preflight request is failing.\n\n' +
          'This usually means:\n' +
          '1. Edge function OPTIONS handler is not returning 200 status\n' +
          '2. Edge function CORS headers are missing or incorrect\n' +
          '3. Edge function may not be deployed\n\n' +
          'Check Supabase Dashboard → Edge Functions → scan-domain → Logs to verify OPTIONS requests are handled.';
      } else if (error.message?.includes('NAME_NOT_RESOLVED') || 
          error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError')) {
        userFriendlyError = 'Failed to connect to scanner service. This usually means:\n' +
          '1. The edge function is not deployed (check Supabase dashboard)\n' +
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
