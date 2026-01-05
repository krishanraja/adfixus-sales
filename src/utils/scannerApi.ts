// Scanner API utilities

import { getScannerFunctionUrl, scannerSupabase } from '@/integrations/supabase/scanner-client';
import type { DomainScan, DomainResult, PublisherContext, ScanRequest } from '@/types/scanner';

export async function createScan(
  domains: string[],
  context?: PublisherContext
): Promise<{ scanId: string; error?: string }> {
  try {
    const response = await fetch(getScannerFunctionUrl('scan-domain'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHlodGd2cWRtcmFrcmJjZ294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODY5NDEsImV4cCI6MjA4MzE2Mjk0MX0.ltwoNJ4MitSMmjL1mKhKPlAOtLv-63naF3qTqJES_CI',
      },
      body: JSON.stringify({
        domains,
        context,
      } as ScanRequest),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Scan creation failed:', error);
      return { scanId: '', error: error || 'Failed to create scan' };
    }
    
    const data = await response.json();
    return { scanId: data.scanId };
  } catch (error) {
    console.error('Scan creation error:', error);
    return { scanId: '', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getScanStatus(scanId: string): Promise<DomainScan | null> {
  const { data, error } = await scannerSupabase
    .from('domain_scans')
    .select('*')
    .eq('id', scanId)
    .single();
  
  if (error) {
    console.error('Error fetching scan status:', error);
    return null;
  }
  
  return data as DomainScan;
}

export async function getScanResults(scanId: string): Promise<DomainResult[]> {
  const { data, error } = await scannerSupabase
    .from('domain_results')
    .select('*')
    .eq('scan_id', scanId)
    .order('scanned_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching scan results:', error);
    return [];
  }
  
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

// Subscribe to real-time scan updates
export function subscribeScanUpdates(
  scanId: string,
  onUpdate: (scan: DomainScan) => void
) {
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
        onUpdate(payload.new as DomainScan);
      }
    )
    .subscribe();
  
  return () => {
    scannerSupabase.removeChannel(channel);
  };
}

// Subscribe to real-time result updates
export function subscribeResultUpdates(
  scanId: string,
  onResult: (result: DomainResult) => void
) {
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
        onResult(payload.new as DomainResult);
      }
    )
    .subscribe();
  
  return () => {
    scannerSupabase.removeChannel(channel);
  };
}
