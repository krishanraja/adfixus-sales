// Scanner API utilities

import { supabase } from '@/integrations/supabase/client';
import { scannerSupabase } from '@/integrations/supabase/scanner-client';
import type { DomainScan, DomainResult, PublisherContext, ScanRequest } from '@/types/scanner';

// Health check to verify edge functions are deployed and accessible
export async function checkEdgeFunctionHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    console.log('[scannerApi] Checking edge function health...');
    
    // Validate client is configured
    if (!supabase) {
      const error = 'Supabase client not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.';
      console.error('[scannerApi]', error);
      return { healthy: false, error };
    }
    
    // Check if we have a valid URL (basic validation)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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
    });
    
    const response = await Promise.race([invokePromise, timeoutPromise]);
    
    // Check for DNS/network errors
    if (response.error) {
      const errorMsg = response.error.message || '';
      
      // DNS resolution failures
      if (errorMsg.includes('NAME_NOT_RESOLVED') || 
          errorMsg.includes('ERR_NAME_NOT_RESOLVED') ||
          errorMsg.includes('Failed to fetch') ||
          errorMsg.includes('NetworkError') ||
          errorMsg === 'TIMEOUT') {
        const error = `Edge function not accessible. This usually means:
1. The edge function is not deployed (check Lovable Cloud dashboard)
2. VITE_SUPABASE_URL is incorrect (should be: https://ojtfnhzqhfsprebvpmvx.supabase.co)
3. Network connectivity issues

Please verify your environment configuration and ensure the edge function is deployed.`;
        console.error('[scannerApi] Edge function not accessible:', errorMsg);
        return { healthy: false, error };
      }
      
      // Other errors (function exists but returned an error - this is actually OK for health check)
      // We just want to know if the function is reachable
      console.log('[scannerApi] Edge function is reachable (returned error, but function exists)');
      return { healthy: true };
    }
    
    console.log('[scannerApi] Edge function is healthy');
    return { healthy: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[scannerApi] Edge function health check failed:', error);
    
    // Provide more specific error messages
    let userFriendlyError = 'Failed to check edge function health. ';
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      userFriendlyError += 'Network error - please check your internet connection and VITE_SUPABASE_URL configuration.';
    } else if (errorMessage.includes('URL') || errorMessage.includes('invalid')) {
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
