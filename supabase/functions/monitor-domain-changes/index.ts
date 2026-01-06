// Version: 1.0.0 - Browse AI Change Detection - 2026-01-06
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// External Scanner Supabase credentials - stored in secrets
const SCANNER_SUPABASE_URL = 'https://lshyhtgvqdmrakrbcgox.supabase.co';
const SCANNER_SUPABASE_SERVICE_KEY = Deno.env.get('SCANNER_SUPABASE_SERVICE_KEY') || '';

// Browse AI API for change detection
const BROWSE_AI_API_KEY = Deno.env.get('BROWSE_AI_API_KEY') || '';

interface MonitorRequest {
  scanId: string;
  domain: string;
  baselineSnapshotId?: string; // Optional: compare against specific snapshot
}

interface DomainSnapshot {
  scan_id: string;
  domain: string;
  snapshot_data: {
    html?: string;
    cookies?: any[];
    vendors?: Record<string, boolean>;
    detected_ssps?: string[];
    timestamp: string;
  };
}

interface DomainChange {
  snapshot_id: string;
  change_type: 'vendor_added' | 'vendor_removed' | 'cookie_changed' | 'ssp_changed' | 'layout_changed' | 'other';
  change_details: {
    field: string;
    old_value?: any;
    new_value?: any;
    description: string;
  };
}

serve(async (req) => {
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    const origin = req.headers.get('origin') || 'unknown';
    console.log('[monitor-domain-changes] Request received from:', origin);
    
    const { scanId, domain, baselineSnapshotId }: MonitorRequest = await req.json();
    
    if (!scanId || !domain) {
      return new Response(
        JSON.stringify({ error: 'scanId and domain are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SCANNER_SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Scanner database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!BROWSE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Browse AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[monitor-domain-changes] Monitoring changes for domain: ${domain}, scanId: ${scanId}`);

    // Create Supabase client for scanner database
    const supabase = createClient(SCANNER_SUPABASE_URL, SCANNER_SUPABASE_SERVICE_KEY);

    // Get current scan result to use as new snapshot
    const { data: currentResult, error: resultError } = await supabase
      .from('domain_results')
      .select('*')
      .eq('scan_id', scanId)
      .eq('domain', domain)
      .single();

    if (resultError || !currentResult) {
      return new Response(
        JSON.stringify({ error: 'Current scan result not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create snapshot from current result
    const snapshotData: DomainSnapshot['snapshot_data'] = {
      vendors: {
        has_google_analytics: currentResult.has_google_analytics,
        has_gtm: currentResult.has_gtm,
        has_meta_pixel: currentResult.has_meta_pixel,
        has_meta_capi: currentResult.has_meta_capi,
        has_ttd: currentResult.has_ttd,
        has_liveramp: currentResult.has_liveramp,
        has_id5: currentResult.has_id5,
        has_criteo: currentResult.has_criteo,
        has_ppid: currentResult.has_ppid,
      },
      detected_ssps: currentResult.detected_ssps || [],
      cookies: currentResult.cookies_raw || [],
      timestamp: new Date().toISOString(),
    };

    // Insert new snapshot
    const { data: newSnapshot, error: snapshotError } = await supabase
      .from('domain_snapshots')
      .insert({
        scan_id: scanId,
        domain,
        snapshot_data: snapshotData,
      })
      .select()
      .single();

    if (snapshotError) {
      console.error('[monitor-domain-changes] Failed to create snapshot:', snapshotError);
      return new Response(
        JSON.stringify({ error: 'Failed to create snapshot', details: snapshotError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[monitor-domain-changes] Created snapshot: ${newSnapshot.id}`);

    // Find baseline snapshot for comparison
    let baselineSnapshot: DomainSnapshot | null = null;
    
    if (baselineSnapshotId) {
      // Use specified baseline
      const { data, error } = await supabase
        .from('domain_snapshots')
        .select('*')
        .eq('id', baselineSnapshotId)
        .single();
      
      if (!error && data) {
        baselineSnapshot = data as DomainSnapshot;
      }
    } else {
      // Find most recent snapshot before this one for the same domain
      const { data, error } = await supabase
        .from('domain_snapshots')
        .select('*')
        .eq('domain', domain)
        .lt('id', newSnapshot.id)
        .order('id', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        baselineSnapshot = data as DomainSnapshot;
      }
    }

    const changes: DomainChange[] = [];

    if (baselineSnapshot) {
      console.log(`[monitor-domain-changes] Comparing against baseline: ${baselineSnapshot.id}`);
      
      const baseline = baselineSnapshot.snapshot_data;
      const current = snapshotData;

      // Compare vendors
      const vendorFields = [
        'has_google_analytics', 'has_gtm', 'has_meta_pixel', 'has_meta_capi',
        'has_ttd', 'has_liveramp', 'has_id5', 'has_criteo', 'has_ppid'
      ];

      for (const vendor of vendorFields) {
        const baselineValue = baseline.vendors?.[vendor] || false;
        const currentValue = current.vendors?.[vendor] || false;

        if (baselineValue !== currentValue) {
          changes.push({
            snapshot_id: newSnapshot.id,
            change_type: currentValue ? 'vendor_added' : 'vendor_removed',
            change_details: {
              field: vendor,
              old_value: baselineValue,
              new_value: currentValue,
              description: `${vendor} ${currentValue ? 'added' : 'removed'}`,
            },
          });
        }
      }

      // Compare SSPs
      const baselineSsps = new Set(baseline.detected_ssps || []);
      const currentSsps = new Set(current.detected_ssps || []);
      
      const addedSsps = [...currentSsps].filter(s => !baselineSsps.has(s));
      const removedSsps = [...baselineSsps].filter(s => !currentSsps.has(s));

      if (addedSsps.length > 0 || removedSsps.length > 0) {
        changes.push({
          snapshot_id: newSnapshot.id,
          change_type: 'ssp_changed',
          change_details: {
            field: 'detected_ssps',
            old_value: baseline.detected_ssps,
            new_value: current.detected_ssps,
            description: `SSPs changed: ${addedSsps.length} added, ${removedSsps.length} removed`,
          },
        });
      }

      // Compare cookie count
      const baselineCookieCount = baseline.cookies?.length || 0;
      const currentCookieCount = current.cookies?.length || 0;

      if (Math.abs(baselineCookieCount - currentCookieCount) > 5) {
        changes.push({
          snapshot_id: newSnapshot.id,
          change_type: 'cookie_changed',
          change_details: {
            field: 'cookie_count',
            old_value: baselineCookieCount,
            new_value: currentCookieCount,
            description: `Cookie count changed from ${baselineCookieCount} to ${currentCookieCount}`,
          },
        });
      }
    } else {
      console.log('[monitor-domain-changes] No baseline snapshot found - this is the first snapshot');
    }

    // Insert changes into database
    if (changes.length > 0) {
      const { error: changesError } = await supabase
        .from('domain_changes')
        .insert(changes);

      if (changesError) {
        console.error('[monitor-domain-changes] Failed to insert changes:', changesError);
      } else {
        console.log(`[monitor-domain-changes] Detected ${changes.length} changes`);
      }
    } else {
      console.log('[monitor-domain-changes] No changes detected');
    }

    return new Response(
      JSON.stringify({
        snapshotId: newSnapshot.id,
        changesDetected: changes.length,
        changes: changes.map(c => ({
          type: c.change_type,
          description: c.change_details.description,
        })),
        message: changes.length > 0 
          ? `Detected ${changes.length} change(s)` 
          : 'No changes detected since last snapshot',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[monitor-domain-changes] Error:', error);
    
    const errorHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
    };
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: errorHeaders }
    );
  }
});
