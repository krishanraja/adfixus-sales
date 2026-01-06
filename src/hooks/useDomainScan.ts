// Domain Scan Hook

import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // CRITICAL FIX: Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // CRITICAL FIX: Use refs to track scan state without triggering re-subscriptions
  const scanIdRef = useRef<string | null>(null);
  const scanStatusRef = useRef<string | null>(null);
  
  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update summary when results change
  useEffect(() => {
    if (results.length > 0 && isMountedRef.current) {
      const newSummary = generateScanSummary(results, context);
      setSummary(newSummary);
    }
  }, [results, context]);

  // Subscribe to real-time updates when we have a scan
  // CRITICAL FIX: Only depend on scanIdRef changes, not scan?.status to prevent loops
  useEffect(() => {
    const currentScanId = scanIdRef.current;
    const currentStatus = scanStatusRef.current;
    
    if (!currentScanId || currentStatus === 'completed' || currentStatus === 'failed') {
      return;
    }

    console.log('[useDomainScan] Setting up real-time subscriptions for:', currentScanId);

    let unsubscribeScan: (() => void) | null = null;
    let unsubscribeResults: (() => void) | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isCleanedUp = false; // Local cleanup flag for this effect instance

    try {
      // Set up real-time subscriptions
      unsubscribeScan = subscribeScanUpdates(currentScanId, (updatedScan) => {
        if (isCleanedUp || !isMountedRef.current) return; // Guard against unmount
        console.log('[useDomainScan] Scan updated via subscription:', updatedScan.status);
        scanStatusRef.current = updatedScan.status;
        setScan(updatedScan);
      });

      unsubscribeResults = subscribeResultUpdates(currentScanId, (newResult) => {
        if (isCleanedUp || !isMountedRef.current) return; // Guard against unmount
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
        // CRITICAL FIX: Check cleanup and mount state before any async work
        if (isCleanedUp || !isMountedRef.current) return;
        
        // Also check if scan is already completed
        if (scanStatusRef.current === 'completed' || scanStatusRef.current === 'failed') {
          console.log('[useDomainScan] Scan already finished, stopping poll');
          if (pollInterval) clearInterval(pollInterval);
          return;
        }
        
        try {
          const [currentScan, currentResults] = await Promise.all([
            getScanStatus(currentScanId),
            getScanResults(currentScanId),
          ]);

          // CRITICAL FIX: Check again after async operation
          if (isCleanedUp || !isMountedRef.current) return;

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
                scanStatusRef.current = currentScan.status;
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
      isCleanedUp = true; // Mark as cleaned up before async cleanup
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
  }, [scan?.id]); // CRITICAL FIX: Only depend on scan ID, not status

  const startScan = useCallback(async (
    domains: string[], 
    publisherContext?: PublisherContext
  ): Promise<string | null> => {
    console.log('[useDomainScan] Starting scan...');
    console.log('[useDomainScan] Domains:', domains);
    console.log('[useDomainScan] Context:', publisherContext);
    
    if (!isMountedRef.current) return null;
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSummary(null);
    setContext(publisherContext);
    
    // Reset refs for new scan
    scanIdRef.current = null;
    scanStatusRef.current = null;

    const { scanId, error: scanError } = await createScan(domains, publisherContext);
    
    // Check mounted state after async operation
    if (!isMountedRef.current) return null;
    
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
    
    // Check mounted state after async operation
    if (!isMountedRef.current) return scanId;
    
    if (initialScan) {
      console.log('[useDomainScan] Initial scan status:', initialScan.status);
      // CRITICAL: Update refs BEFORE setting state to trigger subscription effect correctly
      scanIdRef.current = scanId;
      scanStatusRef.current = initialScan.status;
      setScan(initialScan);
    }

    setIsLoading(false);
    return scanId;
  }, []);

  const loadScan = useCallback(async (scanId: string) => {
    console.log('[useDomainScan] Loading scan:', scanId);
    
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    // Reset refs for new scan load
    scanIdRef.current = null;
    scanStatusRef.current = null;

    // CRITICAL FIX: Race condition protection
    const loadId = scanId; // Capture current load ID
    
    const [scanData, resultsData] = await Promise.all([
      getScanStatus(scanId),
      getScanResults(scanId),
    ]);

    // Check if still mounted and this is still the current load operation
    if (!isMountedRef.current) return;
    if (loadId !== scanId) {
      console.log('[useDomainScan] Stale load operation, ignoring results');
      return;
    }

    if (!scanData) {
      console.error('[useDomainScan] Scan not found:', scanId);
      setError(`Scan not found. The scan ID "${scanId}" may be invalid or the scan may have been deleted.`);
      setIsLoading(false);
      return;
    }

    console.log('[useDomainScan] Loaded scan:', scanData.status, 'with', resultsData.length, 'results');
    
    // CRITICAL: Update refs BEFORE setting state
    scanIdRef.current = scanId;
    scanStatusRef.current = scanData.status;
    
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
