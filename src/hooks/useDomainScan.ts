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
  useEffect(() => {
    if (!scan?.id || scan.status === 'completed' || scan.status === 'failed') {
      return;
    }

    const unsubscribeScan = subscribeScanUpdates(scan.id, (updatedScan) => {
      setScan(updatedScan);
    });

    const unsubscribeResults = subscribeResultUpdates(scan.id, (newResult) => {
      setResults(prev => {
        // Avoid duplicates
        if (prev.some(r => r.id === newResult.id)) {
          return prev;
        }
        return [...prev, newResult];
      });
    });

    return () => {
      unsubscribeScan();
      unsubscribeResults();
    };
  }, [scan?.id, scan?.status]);

  const startScan = useCallback(async (
    domains: string[], 
    publisherContext?: PublisherContext
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSummary(null);
    setContext(publisherContext);

    const { scanId, error: scanError } = await createScan(domains, publisherContext);
    
    if (scanError || !scanId) {
      setError(scanError || 'Failed to start scan');
      setIsLoading(false);
      return null;
    }

    // Fetch initial scan status
    const initialScan = await getScanStatus(scanId);
    if (initialScan) {
      setScan(initialScan);
    }

    setIsLoading(false);
    return scanId;
  }, []);

  const loadScan = useCallback(async (scanId: string) => {
    setIsLoading(true);
    setError(null);

    const [scanData, resultsData] = await Promise.all([
      getScanStatus(scanId),
      getScanResults(scanId),
    ]);

    if (!scanData) {
      setError('Scan not found');
      setIsLoading(false);
      return;
    }

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
