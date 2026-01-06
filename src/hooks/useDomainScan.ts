// Domain Scan Hook

import { useState, useEffect, useCallback } from 'react';
import { 
  createScan, 
  getScanStatus, 
  getScanResults,
  subscribeScanUpdates,
  subscribeResultUpdates
} from '@/utils/scannerApi';
import { generateScanSummary } from '@/utils/revenueImpactScoring';
import type { 
  DomainScan, 
  DomainResult, 
  PublisherContext,
  DomainScanSummary 
} from '@/types/scanner';

interface UseDomainScanResult {
  scan: DomainScan | null;
  results: DomainResult[];
  summary: DomainScanSummary | null;
  isLoading: boolean;
  error: string | null;
  startScan: (domains: string[], context?: PublisherContext) => Promise<string | null>;
  loadScan: (scanId: string) => Promise<void>;
}

export function useDomainScan(): UseDomainScanResult {
  const [scan, setScan] = useState<DomainScan | null>(null);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [summary, setSummary] = useState<DomainScanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<PublisherContext | undefined>();

  // Update summary when results change
  useEffect(() => {
    if (results.length > 0) {
      const newSummary = generateScanSummary(results, context);
      setSummary(newSummary);
    }
  }, [results, context]);

  // Subscribe to real-time updates when we have a scan
  // Includes polling fallback for reliability
  useEffect(() => {
    if (!scan?.id || scan.status === 'completed' || scan.status === 'failed') {
      return;
    }

    console.log('[useDomainScan] Setting up real-time subscriptions for:', scan.id);

    let unsubscribeScan: (() => void) | null = null;
    let unsubscribeResults: (() => void) | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    try {
      // Set up real-time subscriptions
      unsubscribeScan = subscribeScanUpdates(scan.id, (updatedScan) => {
        console.log('[useDomainScan] Scan updated via subscription:', updatedScan.status);
        setScan(updatedScan);
      });

      unsubscribeResults = subscribeResultUpdates(scan.id, (newResult) => {
        console.log('[useDomainScan] New result via subscription:', newResult.domain);
        setResults(prev => {
          // Avoid duplicates
          if (prev.some(r => r.id === newResult.id)) {
            return prev;
          }
          return [...prev, newResult];
        });
      });

      // Polling fallback: poll every 2.5 seconds to ensure UI updates even if subscriptions fail
      pollInterval = setInterval(async () => {
        try {
          const [currentScan, currentResults] = await Promise.all([
            getScanStatus(scan.id),
            getScanResults(scan.id),
          ]);

          if (currentScan) {
            // Update scan if status or progress changed
            setScan(prevScan => {
              if (!prevScan) return currentScan;
              
              const hasChanged = 
                prevScan.status !== currentScan.status ||
                prevScan.completed_domains !== currentScan.completed_domains ||
                prevScan.total_domains !== currentScan.total_domains;
              
              if (hasChanged) {
                console.log('[useDomainScan] Scan updated via polling:', currentScan.status);
                return currentScan;
              }
              return prevScan;
            });
          }

          // Update results if new ones were found
          if (currentResults.length > 0) {
            setResults(prevResults => {
              const newResults = currentResults.filter(
                newResult => !prevResults.some(r => r.id === newResult.id)
              );
              
              if (newResults.length > 0) {
                console.log('[useDomainScan] New results via polling:', newResults.length);
                return [...prevResults, ...newResults];
              }
              return prevResults;
            });
          }
        } catch (pollError) {
          console.error('[useDomainScan] Polling error:', pollError);
          // Don't throw - polling is a fallback, errors are non-critical
        }
      }, 2500); // Poll every 2.5 seconds

    } catch (error) {
      console.error('[useDomainScan] Error setting up subscriptions:', error);
      // If subscriptions fail, polling will still work as fallback
    }

    return () => {
      console.log('[useDomainScan] Cleaning up subscriptions and polling');
      if (unsubscribeScan) {
        unsubscribeScan();
      }
      if (unsubscribeResults) {
        unsubscribeResults();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [scan?.id, scan?.status]);

  const startScan = useCallback(async (
    domains: string[], 
    publisherContext?: PublisherContext
  ): Promise<string | null> => {
    console.log('[useDomainScan] Starting scan...');
    console.log('[useDomainScan] Domains:', domains);
    console.log('[useDomainScan] Context:', publisherContext);
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSummary(null);
    setContext(publisherContext);

    const { scanId, error: scanError } = await createScan(domains, publisherContext);
    
    if (scanError || !scanId) {
      console.error('[useDomainScan] Scan failed:', scanError);
      
      // The error from createScan is already user-friendly, but we can enhance it further
      let userFriendlyError = scanError || 'Failed to start scan';
      
      // Additional context for common error patterns
      if (scanError?.includes('not initialized') || scanError?.includes('configuration')) {
        userFriendlyError = 'Scanner configuration error. Please contact support if this persists.';
      } else if (scanError?.includes('Network error') || scanError?.includes('timeout')) {
        userFriendlyError = 'Network error occurred. Please check your internet connection and try again.';
      } else if (scanError?.includes('not deployed') || scanError?.includes('not accessible')) {
        userFriendlyError = 'Scanner service is not available. This may be a temporary issue. Please try again in a few minutes.';
      }
      
      setError(userFriendlyError);
      setIsLoading(false);
      return null;
    }

    console.log('[useDomainScan] Scan started:', scanId);

    // Fetch initial scan status
    const initialScan = await getScanStatus(scanId);
    if (initialScan) {
      console.log('[useDomainScan] Initial scan status:', initialScan.status);
      setScan(initialScan);
    }

    setIsLoading(false);
    return scanId;
  }, []);

  const loadScan = useCallback(async (scanId: string) => {
    console.log('[useDomainScan] Loading scan:', scanId);
    setIsLoading(true);
    setError(null);

    const [scanData, resultsData] = await Promise.all([
      getScanStatus(scanId),
      getScanResults(scanId),
    ]);

    if (!scanData) {
      console.error('[useDomainScan] Scan not found:', scanId);
      setError(`Scan not found. The scan ID "${scanId}" may be invalid or the scan may have been deleted.`);
      setIsLoading(false);
      return;
    }

    console.log('[useDomainScan] Loaded scan:', scanData.status, 'with', resultsData.length, 'results');
    
    setScan(scanData);
    setResults(resultsData);
    
    if (scanData.monthly_impressions || scanData.publisher_vertical || scanData.owned_domains_count) {
      setContext({
        monthlyImpressions: scanData.monthly_impressions ?? undefined,
        publisherVertical: scanData.publisher_vertical as PublisherContext['publisherVertical'],
        ownedDomainsCount: scanData.owned_domains_count ?? undefined,
      });
    }

    setIsLoading(false);
  }, []);

  return {
    scan,
    results,
    summary,
    isLoading,
    error,
    startScan,
    loadScan,
  };
}
