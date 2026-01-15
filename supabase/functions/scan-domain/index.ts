// Version: 3.1.0 - Fixed addressability gap and Safari loss calculations to use actual data instead of heuristics
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase credentials
const SCANNER_SUPABASE_URL = 'https://lshyhtgvqdmrakrbcgox.supabase.co';
const SCANNER_SUPABASE_SERVICE_KEY = Deno.env.get('SCANNER_SUPABASE_SERVICE_KEY') || '';

// Browserless API for dynamic scanning
const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY') || '';

// Tranco API for traffic estimation
const TRANCO_API_KEY = Deno.env.get('TRANCO_API_KEY') || '';

// Traffic estimation constants (power-law formula from CrUX research)
const PAGEVIEW_COEFFICIENT = 7.73e12;
const PAGEVIEW_EXPONENT = -1.06;

// Industry benchmarks (2026)
const SAFARI_MARKET_SHARE = 0.35; // Safari market share (per REVENUE_CALCULATION_LOGIC.md)

// ============================================================================
// COMPREHENSIVE VENDOR DETECTION PATTERNS
// From AdTech Vendor Analysis PDF - SSPs, DSPs, Universal IDs
// ============================================================================

// SSP (Supply-Side Platform) Detection Patterns
const SSP_PATTERNS = {
  magnite: { 
    cookies: ['khaos', 'ruid', 'audit', 'ses', 'vis', 'ruids'], 
    domains: ['rubiconproject.com', 'tremorhub.com', 'magnite.com'],
    name: 'Magnite/Rubicon'
  },
  pubmatic: { 
    cookies: ['KADUSERCOOKIE', 'KRTBCOOKIE', 'PUBRETARGET', 'PugT', 'PUBMDCID'], 
    domains: ['pubmatic.com', 'ads.pubmatic.com'],
    name: 'PubMatic'
  },
  openx: { 
    cookies: ['i', 'pd', 'OX_dnt', 'oxc', 'OX_plg'], 
    domains: ['openx.net', 'openx.com', 'servedbyopenx.com'],
    name: 'OpenX'
  },
  triplelift: { 
    cookies: ['TLUID', 'TLUIDP', 'tltuid', 'tlThird'], 
    domains: ['3lift.com', 'triplelift.com'],
    name: 'TripleLift'
  },
  indexExchange: { 
    cookies: ['CMPS', 'CMST', 'CMRUM3', 'CMPRO'], 
    domains: ['casalemedia.com', 'indexexchange.com'],
    name: 'Index Exchange'
  },
  sharethrough: { 
    cookies: ['stx_user_id', 'STR_UID'], 
    domains: ['sharethrough.com'],
    name: 'Sharethrough'
  },
  sovrn: { 
    cookies: ['ljt_reader', 'ljt_c'], 
    domains: ['sovrn.com', 'lijit.com'],
    name: 'Sovrn'
  },
  gumgum: { 
    cookies: ['__gumgum_tcl'], 
    domains: ['gumgum.com'],
    name: 'GumGum'
  },
  yieldmo: { 
    cookies: ['ymuid', 'ymo'], 
    domains: ['yieldmo.com'],
    name: 'Yieldmo'
  },
  unruly: { 
    cookies: ['unruly_data'], 
    domains: ['unruly.co', 'unrulygroup.com'],
    name: 'Unruly'
  },
  googleAds: {
    cookies: ['IDE', 'DSID', '__gads', '__gpi', '__gac'],
    domains: ['doubleclick.net', 'googletag.net', 'googleadservices.com', 'google-analytics.com'],
    name: 'Google Ad Manager'
  },
};

// DSP (Demand-Side Platform) Detection Patterns
const DSP_PATTERNS = {
  appnexus: { 
    cookies: ['uuid2', 'anj', 'XANDR_PANID', 'icu', 'anj_uuid'], 
    domains: ['adnxs.com', 'xandr.com', 'appnexus.com'],
    name: 'AppNexus/Xandr'
  },
  tradeDesk: { 
    cookies: ['TDID', 'TTDOptOutOfDataSale', 'TTDOptOut'], 
    domains: ['adsrvr.org', 'thetradedesk.com'],
    name: 'The Trade Desk'
  },
  criteo: { 
    cookies: ['uid', 'dis', 'optout', 'cto_bundle', 'cto_tld_test'], 
    domains: ['criteo.com', 'criteo.net'],
    name: 'Criteo'
  },
  mediamath: { 
    cookies: ['uuidc', 'mt_mop', 'mt_misc', 'uuid', 'mt_svcs'], 
    domains: ['mathtag.com', 'mediamath.com'],
    name: 'MediaMath'
  },
  dv360: { 
    cookies: ['IDE', 'ar_debug', 'wd', 'NID', 'test_cookie'], 
    domains: ['doubleclick.net', 'googlesyndication.com'],
    name: 'DV360/Google'
  },
  beeswax: { 
    cookies: ['bwid'], 
    domains: ['beeswax.com'],
    name: 'Beeswax'
  },
  amobee: { 
    cookies: ['aid', 'TId'], 
    domains: ['amobee.com', 'turn.com'],
    name: 'Amobee'
  },
  amazon: { 
    cookies: ['ad-id', 'ad-privacy', 'amazon-adsystem'], 
    domains: ['amazon-adsystem.com', 'amazonadserver.com'],
    name: 'Amazon DSP'
  },
};

// Universal ID / ID Solution Detection Patterns
const UNIVERSAL_ID_PATTERNS = {
  liveramp: { 
    cookies: ['pxrc', 'rlas3', 'ats', 'pb_li_oids', '_lr_env_src_ats'],
    domains: ['rlcdn.com', 'liveramp.com', 'pippio.com'],
    name: 'LiveRamp ATS',
    idPattern: /^XY[a-zA-Z0-9]{20,}/
  },
  id5: { 
    cookies: ['id5id', 'id5id_nb', 'id5id.1st', 'id5.1st'], 
    domains: ['id5-sync.com', 'id5.io'],
    name: 'ID5'
  },
  uid2: { 
    localStorage: ['uid2_token', '__uid2_advertising_token', 'uid2-sdk'],
    domains: ['uidapi.com', 'unifiedid.com'],
    name: 'UID2/EUID',
    cookies: []
  },
  thirtyThreeAcross: { 
    cookies: ['33acrossId', '33x_lexId', '33x', '33xd'], 
    domains: ['33across.com', '33across.io'],
    name: '33Across'
  },
  zeotap: { 
    cookies: ['zeotap_id', 'zeuid'], 
    domains: ['zeotap.com'],
    name: 'Zeotap'
  },
  lotame: { 
    cookies: ['panorama_id', 'crwdcntrl.net', 'lotcc'], 
    domains: ['crwdcntrl.net', 'lotame.com'],
    name: 'Lotame Panorama'
  },
  sharedId: { 
    cookies: ['pubcid', '_pubcid', '_sharedid'], 
    domains: [],
    name: 'Shared ID'
  },
  fabrick: { 
    cookies: ['fabrickId'], 
    domains: ['neustar.biz', 'fabrick.io'],
    name: 'Fabrick ID'
  },
  merkle: { 
    cookies: ['merkid', '_merkid'], 
    domains: ['merkleinc.com'],
    name: 'Merkle ID'
  },
  netId: { 
    cookies: ['netid', 'netId'], 
    domains: ['netid.de'],
    name: 'NetID'
  },
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ScanRequest {
  domains: string[];
  context?: {
    monthlyImpressions?: number;
    publisherVertical?: string;
    ownedDomainsCount?: number;
  };
}

interface Cookie {
  name: string;
  domain: string;
  path: string;
  expires: number;
  size: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
}

interface RankHistoryEntry {
  date: string;
  rank: number;
}

interface TrancoData {
  rank: number | null;
  monthlyPageviews: number | null;
  monthlyImpressions: number | null;
  confidence: 'high' | 'medium' | 'low' | null;
  rankHistory: RankHistoryEntry[] | null;
  rankTrend: 'growing' | 'stable' | 'declining' | null;
  rankChange30d: number | null;
}

interface NetworkRequest {
  url: string;
  type: string;
  domain: string;
  isThirdParty: boolean;
}

interface AdTechRequest {
  vendor: string;
  url: string;
  domain: string;
}

interface CookieAnalysis {
  total: number;
  firstParty: number;
  thirdParty: number;
  safariBlocked: number;
  safariCapped: number;
  maxDurationDays: number;
  sessionCookies: number;
  persistentCookies: number;
}

interface BrowserlessResult {
  html: string;
  cookies: Cookie[];
  networkRequests: NetworkRequest[];
  thirdPartyDomains: string[];
  adTechRequests: AdTechRequest[];
  cookieAnalysis: CookieAnalysis;
  scanMethod: string;
  error?: string;
}

interface ScanResult {
  status: 'completed' | 'failed';
  error_message: string | null;
  scan_method: string;
  total_cookies: number;
  first_party_cookies: number;
  third_party_cookies: number;
  max_cookie_duration_days: number;
  session_cookies: number;
  persistent_cookies: number;
  safari_blocked_cookies: number;
  has_google_analytics: boolean;
  has_gtm: boolean;
  has_gcm: boolean;
  has_meta_pixel: boolean;
  has_meta_capi: boolean;
  has_ttd: boolean;
  has_liveramp: boolean;
  has_id5: boolean;
  has_criteo: boolean;
  has_ppid: boolean;
  cmp_vendor: string | null;
  tcf_compliant: boolean;
  loads_pre_consent: boolean;
  has_prebid: boolean;
  has_header_bidding: boolean;
  has_conversion_api: boolean;
  detected_ssps: string[];
  addressability_gap_pct: number;
  estimated_safari_loss_pct: number;
  id_bloat_severity: 'low' | 'medium' | 'high' | 'critical';
  privacy_risk_level: 'low' | 'moderate' | 'high' | 'critical';
  competitive_positioning: 'walled-garden-parity' | 'middle-pack' | 'at-risk' | 'commoditized';
  cookies_raw: Cookie[];
  vendors_raw: Record<string, boolean>;
  network_requests_summary: {
    total_requests: number;
    third_party_domains: number;
    ad_tech_requests: number;
    total_vendors: number;
  };
}

// ============================================================================
// MAIN SERVER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: corsHeaders });
  }

  try {
    const origin = req.headers.get('origin') || 'unknown';
    console.log('[scan-domain] v3.0.0 - Request from:', origin);
    
    const body = await req.json().catch(() => ({}));
    
    // Health check
    if (body.healthCheck === true) {
      console.log('[scan-domain] Health check request');
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          version: '3.0.0',
          message: 'Edge function operational with /function API',
          browserlessConfigured: !!BROWSERLESS_API_KEY,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { domains, context }: ScanRequest = body;
    console.log('[scan-domain] Domains:', domains);
    console.log('[scan-domain] Context:', context);

    if (!domains || domains.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No domains provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (domains.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Maximum 20 domains allowed per scan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SCANNER_SUPABASE_SERVICE_KEY) {
      console.error('[scan-domain] SCANNER_SUPABASE_SERVICE_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Scanner service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SCANNER_SUPABASE_URL, SCANNER_SUPABASE_SERVICE_KEY);

    // Create scan record
    const { data: scanData, error: scanError } = await supabase
      .from('domain_scans')
      .insert({
        status: 'processing',
        total_domains: domains.length,
        completed_domains: 0,
        monthly_impressions: context?.monthlyImpressions,
        publisher_vertical: context?.publisherVertical,
        owned_domains_count: context?.ownedDomainsCount,
      })
      .select()
      .single();

    if (scanError || !scanData) {
      console.error('[scan-domain] Failed to create scan:', scanError);
      return new Response(
        JSON.stringify({ error: 'Failed to create scan record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scanId = scanData.id;
    console.log('[scan-domain] Scan created:', scanId);

    // Process domains in background
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processDomains(supabase as any, scanId, domains).catch(err => {
      console.error('[scan-domain] Background processing error:', err);
      supabase.from('domain_scans').update({ status: 'failed' }).eq('id', scanId);
    });

    return new Response(
      JSON.stringify({ scanId, message: 'Scan started' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[scan-domain] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// DOMAIN PROCESSING
// ============================================================================

async function processDomains(supabase: ReturnType<typeof createClient>, scanId: string, domains: string[]) {
  let completedCount = 0;

  for (const domain of domains) {
    try {
      console.log(`[scan-domain] Processing: ${domain}`);
      
      // Fetch Tranco data first
      const trancoData = await fetchTrancoData(domain);
      console.log(`[scan-domain] Tranco data for ${domain}:`, trancoData.rank ? `#${trancoData.rank}` : 'not ranked');
      
      // Rate limiting for Tranco API
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Scan the domain
      console.log(`[scan-domain] Starting scanDomain for ${domain}...`);
      const result = await scanDomain(domain);
      console.log(`[scan-domain] Scan result for ${domain}: ${result.status}, cookies: ${result.total_cookies}, method: ${result.scan_method}`);
      
      // Build insert object with all columns including Tranco data
      const insertData = {
        scan_id: scanId,
        domain,
        status: result.status === 'completed' ? 'success' : 'failed',
        error_message: result.error_message,
        total_cookies: result.total_cookies,
        first_party_cookies: result.first_party_cookies,
        third_party_cookies: result.third_party_cookies,
        max_cookie_duration_days: result.max_cookie_duration_days,
        session_cookies: result.session_cookies,
        persistent_cookies: result.persistent_cookies,
        safari_blocked_cookies: result.safari_blocked_cookies,
        has_google_analytics: result.has_google_analytics,
        has_gtm: result.has_gtm,
        has_gcm: result.has_gcm,
        has_meta_pixel: result.has_meta_pixel,
        has_meta_capi: result.has_meta_capi,
        has_ttd: result.has_ttd,
        has_liveramp: result.has_liveramp,
        has_id5: result.has_id5,
        has_criteo: result.has_criteo,
        has_ppid: result.has_ppid,
        cmp_vendor: result.cmp_vendor,
        tcf_compliant: result.tcf_compliant,
        loads_pre_consent: result.loads_pre_consent,
        has_prebid: result.has_prebid,
        has_header_bidding: result.has_header_bidding,
        has_conversion_api: result.has_conversion_api,
        detected_ssps: result.detected_ssps,
        addressability_gap_pct: result.addressability_gap_pct,
        estimated_safari_loss_pct: result.estimated_safari_loss_pct,
        id_bloat_severity: result.id_bloat_severity,
        privacy_risk_level: result.privacy_risk_level,
        competitive_positioning: result.competitive_positioning,
        cookies_raw: result.cookies_raw,
        vendors_raw: result.vendors_raw,
        // Tranco data (new columns)
        tranco_rank: trancoData.rank,
        estimated_monthly_pageviews: trancoData.monthlyPageviews,
        estimated_monthly_impressions: trancoData.monthlyImpressions,
        traffic_confidence: trancoData.confidence,
        tranco_rank_history: trancoData.rankHistory,
        rank_trend: trancoData.rankTrend,
        rank_change_30d: trancoData.rankChange30d,
        scan_method: result.scan_method,
      };
      
      console.log(`[scan-domain] Inserting result for ${domain}...`);
      
      // Insert result
      const { error: insertError } = await supabase.from('domain_results').insert(insertData);

      if (insertError) {
        console.error(`[scan-domain] Insert error for ${domain}:`, JSON.stringify(insertError));
        // Try inserting with minimal columns
        console.log(`[scan-domain] Retrying with minimal columns for ${domain}...`);
        const { error: minimalError } = await supabase.from('domain_results').insert({
          scan_id: scanId,
          domain,
          status: result.status === 'completed' ? 'success' : 'failed',
          error_message: `Insert failed: ${insertError.message}`,
          total_cookies: result.total_cookies,
          first_party_cookies: result.first_party_cookies,
          third_party_cookies: result.third_party_cookies,
          addressability_gap_pct: result.addressability_gap_pct,
          estimated_safari_loss_pct: result.estimated_safari_loss_pct,
          id_bloat_severity: result.id_bloat_severity,
          privacy_risk_level: result.privacy_risk_level,
          competitive_positioning: result.competitive_positioning,
        });
        if (minimalError) {
          console.error(`[scan-domain] Minimal insert also failed for ${domain}:`, JSON.stringify(minimalError));
        } else {
          console.log(`[scan-domain] Minimal insert succeeded for ${domain}`);
        }
      } else {
        console.log(`[scan-domain] Insert successful for ${domain}`);
      }

      completedCount++;
      await supabase.from('domain_scans').update({ completed_domains: completedCount }).eq('id', scanId);
      
    } catch (err) {
      console.error(`[scan-domain] Error processing ${domain}:`, err instanceof Error ? err.stack : err);
      
      // Insert failed result - use null for calculated fields to prevent skewing portfolio averages
      // Frontend should exclude failed domains from calculations
      const { error: failedInsertError } = await supabase.from('domain_results').insert({
        scan_id: scanId,
        domain,
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        total_cookies: 0,
        first_party_cookies: 0,
        third_party_cookies: 0,
        // Use null instead of default values to prevent skewing portfolio calculations
        // Frontend will exclude failed domains from averages
        addressability_gap_pct: null,
        estimated_safari_loss_pct: null,
        id_bloat_severity: 'low', // Use 'low' as neutral value, not 'medium'
        privacy_risk_level: 'low', // Use 'low' as neutral value
        competitive_positioning: 'middle-pack', // Use neutral value instead of 'at-risk'
      });
      
      if (failedInsertError) {
        console.error(`[scan-domain] Failed to insert error result for ${domain}:`, JSON.stringify(failedInsertError));
      }
      
      completedCount++;
      await supabase.from('domain_scans').update({ completed_domains: completedCount }).eq('id', scanId);
    }
  }

  // Mark scan as completed
  await supabase.from('domain_scans').update({ status: 'completed' }).eq('id', scanId);
  console.log(`[scan-domain] Scan ${scanId} completed`);
}

// ============================================================================
// TRANCO API
// ============================================================================

async function fetchTrancoData(domain: string): Promise<TrancoData> {
  const emptyResult: TrancoData = { 
    rank: null, 
    monthlyPageviews: null, 
    monthlyImpressions: null, 
    confidence: null,
    rankHistory: null,
    rankTrend: null,
    rankChange30d: null,
  };
  
  try {
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split(':')[0];
    
    console.log(`[scan-domain] Fetching Tranco rank for: ${cleanDomain}`);
    
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (TRANCO_API_KEY) {
      headers['Authorization'] = `Bearer ${TRANCO_API_KEY}`;
    }
    
    const response = await fetch(
      `https://tranco-list.eu/api/ranks/domain/${cleanDomain}`,
      { headers }
    );
    
    if (!response.ok) {
      console.log(`[scan-domain] Tranco API returned ${response.status} for ${cleanDomain}`);
      return emptyResult;
    }
    
    const data = await response.json();
    
    if (data.ranks && data.ranks.length > 0) {
      const rank = data.ranks[0].rank;
      
      const rankHistory: RankHistoryEntry[] = data.ranks.map((r: { date: string; rank: number }) => ({
        date: r.date,
        rank: r.rank,
      }));
      
      let rankTrend: 'growing' | 'stable' | 'declining' = 'stable';
      let rankChange30d = 0;
      
      if (rankHistory.length >= 2) {
        const newestRank = rankHistory[0].rank;
        const oldestRank = rankHistory[rankHistory.length - 1].rank;
        rankChange30d = oldestRank - newestRank;
        
        const threshold = 1000;
        if (rankChange30d > threshold) {
          rankTrend = 'growing';
        } else if (rankChange30d < -threshold) {
          rankTrend = 'declining';
        }
      }
      
      const annualPageviews = Math.round(PAGEVIEW_COEFFICIENT * Math.pow(rank, PAGEVIEW_EXPONENT));
      const monthlyPageviews = Math.round(annualPageviews / 12);
      const monthlyImpressions = monthlyPageviews * 4;
      
      let confidence: 'high' | 'medium' | 'low';
      if (rank <= 100000) confidence = 'high';
      else if (rank <= 1000000) confidence = 'medium';
      else confidence = 'low';
      
      console.log(`[scan-domain] Tranco: ${cleanDomain} #${rank}, ${monthlyImpressions.toLocaleString()} imp/mo`);
      
      return {
        rank,
        monthlyPageviews,
        monthlyImpressions,
        confidence,
        rankHistory,
        rankTrend,
        rankChange30d,
      };
    }
    
    return emptyResult;
    
  } catch (err) {
    console.error(`[scan-domain] Tranco lookup failed:`, err);
    return emptyResult;
  }
}

// ============================================================================
// DOMAIN SCANNING - BROWSERLESS /function API
// ============================================================================

async function scanDomain(domain: string): Promise<ScanResult> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  
  // Try Browserless /function API first (comprehensive)
  if (BROWSERLESS_API_KEY) {
    try {
      console.log(`[scan-domain] Scanning ${domain} with Browserless /function API`);
      return await scanWithBrowserlessFunction(url, cleanDomain);
    } catch (err) {
      console.error(`[scan-domain] Browserless /function failed for ${domain}:`, err);
    }
  }
  
  // Fallback to static fetch
  console.log(`[scan-domain] Falling back to static fetch for ${domain}`);
  try {
    return await scanWithFetch(url, cleanDomain);
  } catch (err) {
    console.error(`[scan-domain] All methods failed for ${domain}:`, err);
    return createFailedResult(err instanceof Error ? err.message : 'All scanning methods failed');
  }
}

async function scanWithBrowserlessFunction(url: string, domain: string): Promise<ScanResult> {
  const functionUrl = `https://chrome.browserless.io/function?token=${BROWSERLESS_API_KEY}`;
  
  // Puppeteer code to execute in Browserless
  const puppeteerCode = `
export default async function ({ page, context }) {
  const networkRequests = [];
  const thirdPartyDomains = new Set();
  const adTechRequests = [];
  const targetDomain = context.domain.replace(/^www\\./, '');
  
  // Ad tech vendor patterns
  const adTechPatterns = [
    { name: 'google_analytics', patterns: ['google-analytics.com', 'googletagmanager.com', 'analytics.google.com'] },
    { name: 'meta_pixel', patterns: ['facebook.net', 'facebook.com/tr', 'connect.facebook'] },
    { name: 'ttd', patterns: ['thetradedesk.com', 'adsrvr.org'] },
    { name: 'liveramp', patterns: ['rlcdn.com', 'liveramp.com'] },
    { name: 'id5', patterns: ['id5-sync.com'] },
    { name: 'criteo', patterns: ['criteo.net', 'criteo.com'] },
    { name: 'prebid', patterns: ['prebid.org', 'rubiconproject.com', 'pubmatic.com', 'openx.net', 'adnxs.com'] },
    { name: 'gam', patterns: ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com'] },
  ];
  
  // Enable request interception
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    try {
      const requestUrl = request.url();
      if (!requestUrl.startsWith('http')) {
        request.continue();
        return;
      }
      
      const urlObj = new URL(requestUrl);
      const hostname = urlObj.hostname;
      
      const isThirdParty = !hostname.includes(targetDomain);
      
      networkRequests.push({
        url: requestUrl.substring(0, 200),
        type: request.resourceType(),
        domain: hostname,
        isThirdParty: isThirdParty,
      });
      
      if (isThirdParty) {
        thirdPartyDomains.add(hostname);
      }
      
      // Detect ad tech vendors
      for (const vendor of adTechPatterns) {
        if (vendor.patterns.some(p => hostname.includes(p) || requestUrl.includes(p))) {
          adTechRequests.push({
            vendor: vendor.name,
            url: requestUrl.substring(0, 200),
            domain: hostname,
          });
          break;
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
    
    request.continue();
  });
  
  // Navigate
  try {
    await page.goto(context.url, { 
      waitUntil: 'networkidle2', 
      timeout: 45000 
    });
  } catch (navError) {
    console.log('Navigation completed with possible timeout');
  }
  
  // Wait for late-loading scripts
  await new Promise(r => setTimeout(r, 3000));
  
  // Get cookies
  const cookies = await page.cookies();
  
  // Get HTML
  const html = await page.content();
  
  // Classify cookies with proper domain matching
  const now = Date.now() / 1000;
  
  // Helper function for proper cookie domain matching
  const isFirstPartyCookie = (cookieDomain) => {
    // Remove leading dot from cookie domain
    const cleanCookieDomain = cookieDomain.replace(/^\\./, '');
    
    // Exact match
    if (cleanCookieDomain === targetDomain) {
      return true;
    }
    
    // Subdomain match: cookie domain is a subdomain of target domain
    // e.g., targetDomain = "example.com", cookieDomain = "sub.example.com"
    if (cleanCookieDomain.endsWith('.' + targetDomain)) {
      return true;
    }
    
    // Parent domain match: target domain is a subdomain of cookie domain
    // e.g., targetDomain = "sub.example.com", cookieDomain = "example.com"
    // But only if cookie domain is a valid parent (not just a TLD)
    if (targetDomain.endsWith('.' + cleanCookieDomain)) {
      // Additional validation: cookie domain must have at least one dot (not just TLD)
      // This prevents false positives like targetDomain="example.com", cookieDomain=".com"
      const cookieParts = cleanCookieDomain.split('.');
      if (cookieParts.length >= 2) {
        return true;
      }
    }
    
    return false;
  };
  
  const firstPartyCookies = cookies.filter(c => isFirstPartyCookie(c.domain));
  const thirdPartyCookies = cookies.filter(c => !isFirstPartyCookie(c.domain));
  
  // Safari ITP 2.3+ analysis
  // ITP blocks: ALL third-party cookies + first-party cookies >7 days (capped)
  const safariBlocked = thirdPartyCookies.length;
  const safariCapped = firstPartyCookies.filter(c => 
    c.expires > 0 && (c.expires - now) > 7 * 86400
  ).length;
  
  const maxDuration = Math.max(0, ...cookies.map(c => c.expires > 0 ? (c.expires - now) / 86400 : 0));
  
  return {
    data: {
      html: html.substring(0, 50000),
      cookies: cookies.slice(0, 50).map(c => ({
        name: c.name,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
        size: c.size || 0,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite,
      })),
      networkRequests: networkRequests.slice(0, 200),
      thirdPartyDomains: Array.from(thirdPartyDomains).slice(0, 100),
      adTechRequests: adTechRequests.slice(0, 100),
      cookieAnalysis: {
        total: cookies.length,
        firstParty: firstPartyCookies.length,
        thirdParty: thirdPartyCookies.length,
        safariBlocked: safariBlocked,
        safariCapped: safariCapped,
        maxDurationDays: Math.round(maxDuration),
        sessionCookies: cookies.filter(c => c.expires === -1 || c.expires === 0).length,
        persistentCookies: cookies.filter(c => c.expires > now).length,
      },
      scanMethod: 'browserless_function',
    },
    type: 'application/json',
  };
}
`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: puppeteerCode,
      context: { url, domain },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Browserless function error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const responseData = await response.json();
  const data = responseData.data as BrowserlessResult;
  
  return analyzeNetworkResults(data, domain);
}

async function scanWithFetch(url: string, domain: string): Promise<ScanResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    clearTimeout(timeout);

    // Create minimal result from HTML analysis
    return analyzeHtmlOnly(html, domain);
    
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ============================================================================
// ANALYSIS ENGINE
// ============================================================================

function analyzeNetworkResults(data: BrowserlessResult, domain: string): ScanResult {
  const { html, cookies, networkRequests, thirdPartyDomains, adTechRequests, cookieAnalysis } = data;
  
  // Vendor detection from network requests
  const vendorCounts = new Map<string, number>();
  for (const req of adTechRequests || []) {
    vendorCounts.set(req.vendor, (vendorCounts.get(req.vendor) || 0) + 1);
  }
  
  const hasGoogleAnalytics = vendorCounts.has('google_analytics') || vendorCounts.has('gam');
  const hasMetaPixel = vendorCounts.has('meta_pixel');
  const hasTTD = vendorCounts.has('ttd');
  const hasLiveramp = vendorCounts.has('liveramp');
  const hasId5 = vendorCounts.has('id5');
  const hasCriteo = vendorCounts.has('criteo');
  const hasPrebid = vendorCounts.has('prebid');
  
  // Also check HTML for patterns
  const hasGtm = /googletagmanager\.com|GTM-[A-Z0-9]{6,}/i.test(html);
  const hasGcm = /gtag\(['"]consent['"]|consent.*mode/i.test(html);
  const hasMetaCapi = /graph\.facebook\.com.*events|facebook.*conversions|fbevents/i.test(html);
  const hasPpid = /ppid|publisher.*id|first.*party.*id|__fpid/i.test(html);
  
  // CMP detection
  let cmpVendor: string | null = null;
  if (/onetrust|optanon/i.test(html)) cmpVendor = 'OneTrust';
  else if (/cookiebot/i.test(html)) cmpVendor = 'Cookiebot';
  else if (/quantcast/i.test(html)) cmpVendor = 'Quantcast';
  else if (/sourcepoint/i.test(html)) cmpVendor = 'Sourcepoint';
  else if (/didomi/i.test(html)) cmpVendor = 'Didomi';
  else if (/trustarc|truste/i.test(html)) cmpVendor = 'TrustArc';
  
  // TCF compliance
  const tcfCompliant = /__tcfapi|__cmp|__gpp/i.test(html);
  
  // Pre-consent tracking
  const loadsPreConsent = !cmpVendor && (hasGoogleAnalytics || hasMetaPixel || hasCriteo);
  
  // Enhanced SSP detection using comprehensive patterns
  const detectedSsps: string[] = [];
  const allDomains = [...(thirdPartyDomains || [])];
  const allCookieNames = (cookies || []).map(c => c.name.toLowerCase());
  
  // Check SSP patterns against domains and cookies
  for (const [key, ssp] of Object.entries(SSP_PATTERNS)) {
    const domainMatch = allDomains.some(d => 
      ssp.domains.some(pattern => d.toLowerCase().includes(pattern.replace('.', '')))
    );
    const cookieMatch = ssp.cookies.some(cookie => 
      allCookieNames.some(name => name.toLowerCase().includes(cookie.toLowerCase()))
    );
    if (domainMatch || cookieMatch) {
      if (!detectedSsps.includes(ssp.name)) {
        detectedSsps.push(ssp.name);
      }
    }
  }
  
  // Check DSP patterns - also add to detected SSPs for visibility
  for (const [key, dsp] of Object.entries(DSP_PATTERNS)) {
    const domainMatch = allDomains.some(d => 
      dsp.domains.some(pattern => d.toLowerCase().includes(pattern.replace('.', '')))
    );
    const cookieMatch = dsp.cookies.some(cookie => 
      allCookieNames.some(name => name.toLowerCase().includes(cookie.toLowerCase()))
    );
    if (domainMatch || cookieMatch) {
      if (!detectedSsps.includes(dsp.name)) {
        detectedSsps.push(dsp.name);
      }
    }
  }
  
  // Enhanced Universal ID detection
  let enhancedLiveramp = hasLiveramp;
  let enhancedId5 = hasId5;
  let enhancedTtd = hasTTD;
  
  for (const [key, uid] of Object.entries(UNIVERSAL_ID_PATTERNS)) {
    const domainMatch = allDomains.some(d => 
      uid.domains.some(pattern => d.toLowerCase().includes(pattern.replace('.', '')))
    );
    const cookieMatch = uid.cookies?.some(cookie => 
      allCookieNames.some(name => name.toLowerCase().includes(cookie.toLowerCase()))
    );
    
    if (domainMatch || cookieMatch) {
      if (key === 'liveramp') enhancedLiveramp = true;
      if (key === 'id5') enhancedId5 = true;
      if (key === 'tradeDesk') enhancedTtd = true;
      // Add UID solutions to SSP list for reporting
      if (!detectedSsps.includes(uid.name)) {
        detectedSsps.push(uid.name);
      }
    }
  }
  
  // Calculate addressability gap based on ACTUAL Safari blocking
  // Formula: (safari_blocked_cookies / total_cookies) * safari_market_share * 100
  const totalCookies = cookieAnalysis?.total || 0;
  const safariBlockedCookies = cookieAnalysis?.safariBlocked || 0;
  
  let addressabilityGap: number;
  if (totalCookies === 0) {
    // If no cookies, assume baseline gap based on market share
    addressabilityGap = SAFARI_MARKET_SHARE * 100;
  } else {
    const blockedPct = safariBlockedCookies / totalCookies;
    addressabilityGap = blockedPct * SAFARI_MARKET_SHARE * 100;
  }
  // Clamp between 10% and 80% for reasonable bounds
  addressabilityGap = Math.max(10, Math.min(80, addressabilityGap));
  
  // Calculate Safari loss based on ACTUAL market share impact
  // Formula: (safari_blocked_cookies / total_cookies) * safari_market_share * 100
  let safariLoss: number;
  if (totalCookies === 0) {
    safariLoss = SAFARI_MARKET_SHARE * 100;
  } else {
    const blockedPct = safariBlockedCookies / totalCookies;
    safariLoss = blockedPct * SAFARI_MARKET_SHARE * 100;
  }
  // Clamp between 0% and 52% (max market share)
  safariLoss = Math.max(0, Math.min(SAFARI_MARKET_SHARE * 100, safariLoss));
  
  const idBloatSeverity = calculateIdBloat(
    enhancedLiveramp, enhancedId5, hasCriteo, enhancedTtd, cookieAnalysis?.thirdParty || 0
  );
  
  const privacyRisk = calculatePrivacyRisk(
    loadsPreConsent, !tcfCompliant, cookieAnalysis?.thirdParty || 0, cookieAnalysis?.maxDurationDays || 0
  );
  
  const competitivePosition = calculateCompetitivePosition(
    hasMetaCapi, hasPpid, hasPrebid, addressabilityGap
  );
  
  return {
    status: 'completed',
    error_message: null,
    scan_method: data.scanMethod || 'browserless_function',
    total_cookies: cookieAnalysis?.total || 0,
    first_party_cookies: cookieAnalysis?.firstParty || 0,
    third_party_cookies: cookieAnalysis?.thirdParty || 0,
    max_cookie_duration_days: cookieAnalysis?.maxDurationDays || 0,
    session_cookies: cookieAnalysis?.sessionCookies || 0,
    persistent_cookies: cookieAnalysis?.persistentCookies || 0,
    safari_blocked_cookies: cookieAnalysis?.safariBlocked || 0,
    has_google_analytics: hasGoogleAnalytics,
    has_gtm: hasGtm,
    has_gcm: hasGcm,
    has_meta_pixel: hasMetaPixel,
    has_meta_capi: hasMetaCapi,
    has_ttd: enhancedTtd,
    has_liveramp: enhancedLiveramp,
    has_id5: enhancedId5,
    has_criteo: hasCriteo,
    has_ppid: hasPpid,
    cmp_vendor: cmpVendor,
    tcf_compliant: tcfCompliant,
    loads_pre_consent: loadsPreConsent,
    has_prebid: hasPrebid,
    has_header_bidding: hasPrebid || detectedSsps.length > 0,
    has_conversion_api: hasMetaCapi,
    detected_ssps: detectedSsps,
    addressability_gap_pct: addressabilityGap,
    estimated_safari_loss_pct: safariLoss,
    id_bloat_severity: idBloatSeverity,
    privacy_risk_level: privacyRisk,
    competitive_positioning: competitivePosition,
    cookies_raw: cookies || [],
    vendors_raw: {
      google_analytics: hasGoogleAnalytics,
      gtm: hasGtm,
      gcm: hasGcm,
      meta_pixel: hasMetaPixel,
      meta_capi: hasMetaCapi,
      ttd: enhancedTtd,
      liveramp: enhancedLiveramp,
      id5: enhancedId5,
      criteo: hasCriteo,
      prebid: hasPrebid,
    },
    network_requests_summary: {
      total_requests: networkRequests?.length || 0,
      third_party_domains: thirdPartyDomains?.length || 0,
      ad_tech_requests: adTechRequests?.length || 0,
      total_vendors: detectedSsps.length + (hasGoogleAnalytics ? 1 : 0) + (hasMetaPixel ? 1 : 0),
    },
  };
}

function analyzeHtmlOnly(html: string, domain: string): ScanResult {
  // Fallback HTML-only analysis
  const hasGoogleAnalytics = /google-analytics\.com|gtag\(|G-[A-Z0-9]{10}/i.test(html);
  const hasGtm = /googletagmanager\.com|GTM-[A-Z0-9]{6,}/i.test(html);
  const hasGcm = /gtag\(['"]consent['"]/.test(html);
  const hasMetaPixel = /connect\.facebook\.net|fbq\(|fbevents\.js/i.test(html);
  const hasMetaCapi = /graph\.facebook\.com.*events/i.test(html);
  const hasTTD = /thetradedesk\.com|adsrvr\.org/i.test(html);
  const hasLiveramp = /rlcdn\.com|liveramp/i.test(html);
  const hasId5 = /id5-sync\.com/i.test(html);
  const hasCriteo = /criteo\.net|criteo\.com/i.test(html);
  const hasPrebid = /prebid\.js|pbjs\.que/i.test(html);
  const hasPpid = /ppid|publisher.*id/i.test(html);
  
  let cmpVendor: string | null = null;
  if (/onetrust|optanon/i.test(html)) cmpVendor = 'OneTrust';
  else if (/cookiebot/i.test(html)) cmpVendor = 'Cookiebot';
  
  const tcfCompliant = /__tcfapi|__cmp/i.test(html);
  const loadsPreConsent = !cmpVendor && (hasGoogleAnalytics || hasMetaPixel);
  
  // Estimate cookies based on vendors
  let estimatedCookies = 0;
  if (hasGoogleAnalytics) estimatedCookies += 3;
  if (hasGtm) estimatedCookies += 2;
  if (hasMetaPixel) estimatedCookies += 4;
  if (hasCriteo) estimatedCookies += 5;
  if (hasLiveramp) estimatedCookies += 3;
  if (hasTTD) estimatedCookies += 3;
  
  // Calculate addressability gap based on estimated Safari blocking
  // For HTML-only fallback, estimate that 70% of cookies are third-party (blocked by Safari)
  const estimatedThirdPartyCookies = Math.round(estimatedCookies * 0.7);
  let addressabilityGap: number;
  if (estimatedCookies === 0) {
    addressabilityGap = SAFARI_MARKET_SHARE * 100;
  } else {
    const blockedPct = estimatedThirdPartyCookies / estimatedCookies;
    addressabilityGap = blockedPct * SAFARI_MARKET_SHARE * 100;
  }
  addressabilityGap = Math.max(10, Math.min(80, addressabilityGap));
  
  // Calculate Safari loss using same formula
  let safariLoss: number;
  if (estimatedCookies === 0) {
    safariLoss = SAFARI_MARKET_SHARE * 100;
  } else {
    const blockedPct = estimatedThirdPartyCookies / estimatedCookies;
    safariLoss = blockedPct * SAFARI_MARKET_SHARE * 100;
  }
  safariLoss = Math.max(0, Math.min(SAFARI_MARKET_SHARE * 100, safariLoss));
  
  return {
    status: 'completed',
    error_message: 'Static fetch used - cookie data may be incomplete',
    scan_method: 'static_fetch',
    total_cookies: estimatedCookies,
    first_party_cookies: Math.round(estimatedCookies * 0.3),
    third_party_cookies: Math.round(estimatedCookies * 0.7),
    max_cookie_duration_days: 365,
    session_cookies: Math.round(estimatedCookies * 0.2),
    persistent_cookies: Math.round(estimatedCookies * 0.8),
    safari_blocked_cookies: Math.round(estimatedCookies * 0.7),
    has_google_analytics: hasGoogleAnalytics,
    has_gtm: hasGtm,
    has_gcm: hasGcm,
    has_meta_pixel: hasMetaPixel,
    has_meta_capi: hasMetaCapi,
    has_ttd: hasTTD,
    has_liveramp: hasLiveramp,
    has_id5: hasId5,
    has_criteo: hasCriteo,
    has_ppid: hasPpid,
    cmp_vendor: cmpVendor,
    tcf_compliant: tcfCompliant,
    loads_pre_consent: loadsPreConsent,
    has_prebid: hasPrebid,
    has_header_bidding: hasPrebid,
    has_conversion_api: hasMetaCapi,
    detected_ssps: [],
    addressability_gap_pct: addressabilityGap,
    estimated_safari_loss_pct: safariLoss,
    id_bloat_severity: 'medium',
    privacy_risk_level: 'moderate',
    competitive_positioning: 'at-risk',
    cookies_raw: [],
    vendors_raw: {
      google_analytics: hasGoogleAnalytics,
      gtm: hasGtm,
      gcm: hasGcm,
      meta_pixel: hasMetaPixel,
      meta_capi: hasMetaCapi,
      ttd: hasTTD,
      liveramp: hasLiveramp,
      id5: hasId5,
      criteo: hasCriteo,
      prebid: hasPrebid,
    },
    network_requests_summary: {
      total_requests: 0,
      third_party_domains: 0,
      ad_tech_requests: 0,
      total_vendors: (hasGoogleAnalytics ? 1 : 0) + (hasMetaPixel ? 1 : 0),
    },
  };
}

function createFailedResult(errorMessage: string): ScanResult {
  return {
    status: 'failed',
    error_message: errorMessage,
    scan_method: 'none',
    total_cookies: 0,
    first_party_cookies: 0,
    third_party_cookies: 0,
    max_cookie_duration_days: 0,
    session_cookies: 0,
    persistent_cookies: 0,
    safari_blocked_cookies: 0,
    has_google_analytics: false,
    has_gtm: false,
    has_gcm: false,
    has_meta_pixel: false,
    has_meta_capi: false,
    has_ttd: false,
    has_liveramp: false,
    has_id5: false,
    has_criteo: false,
    has_ppid: false,
    cmp_vendor: null,
    tcf_compliant: false,
    loads_pre_consent: false,
    has_prebid: false,
    has_header_bidding: false,
    has_conversion_api: false,
    detected_ssps: [],
    // Use null for calculated fields - frontend should exclude failed domains from calculations
    addressability_gap_pct: null as any, // Will be stored as null in DB
    estimated_safari_loss_pct: null as any, // Will be stored as null in DB
    id_bloat_severity: 'low', // Use neutral value
    privacy_risk_level: 'low', // Use neutral value
    competitive_positioning: 'middle-pack', // Use neutral value
    cookies_raw: [],
    vendors_raw: {},
    network_requests_summary: {
      total_requests: 0,
      third_party_domains: 0,
      ad_tech_requests: 0,
      total_vendors: 0,
    },
  };
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

// DEPRECATED: This heuristic-based calculation is no longer used.
// Addressability gap is now calculated based on actual Safari blocking:
// (safari_blocked_cookies / total_cookies) * SAFARI_MARKET_SHARE * 100
// Keeping this function for reference but it should not be called.
function calculateAddressabilityGap(
  hasGA: boolean,
  hasMeta: boolean,
  hasPpid: boolean,
  hasLiveramp: boolean,
  hasId5: boolean,
  thirdPartyCookies: number
): number {
  console.warn('[scan-domain] DEPRECATED: calculateAddressabilityGap should not be used. Use actual Safari blocking calculation instead.');
  let gap = 52; // Baseline
  
  if (hasPpid) gap -= 15;
  if (hasLiveramp) gap -= 10;
  if (hasId5) gap -= 8;
  if (!hasGA && !hasMeta) gap += 10;
  if (thirdPartyCookies > 20) gap += 5;
  
  return Math.max(10, Math.min(80, gap));
}

function calculateIdBloat(
  hasLiveramp: boolean,
  hasId5: boolean,
  hasCriteo: boolean,
  hasTTD: boolean,
  thirdPartyCookies: number
): 'low' | 'medium' | 'high' | 'critical' {
  let score = 0;
  
  if (hasLiveramp) score += 2;
  if (hasId5) score += 2;
  if (hasCriteo) score += 2;
  if (hasTTD) score += 2;
  if (thirdPartyCookies > 30) score += 3;
  else if (thirdPartyCookies > 15) score += 2;
  else if (thirdPartyCookies > 5) score += 1;
  
  if (score >= 8) return 'critical';
  if (score >= 5) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function calculatePrivacyRisk(
  loadsPreConsent: boolean,
  noTcf: boolean,
  thirdPartyCookies: number,
  maxCookieDays: number
): 'low' | 'moderate' | 'high' | 'critical' {
  let score = 0;
  
  if (loadsPreConsent) score += 3;
  if (noTcf) score += 2;
  if (thirdPartyCookies > 20) score += 2;
  if (maxCookieDays > 365) score += 2;
  else if (maxCookieDays > 180) score += 1;
  
  if (score >= 6) return 'critical';
  if (score >= 4) return 'high';
  if (score >= 2) return 'moderate';
  return 'low';
}

function calculateCompetitivePosition(
  hasCapi: boolean,
  hasPpid: boolean,
  hasHeaderBidding: boolean,
  addressabilityGap: number
): 'walled-garden-parity' | 'middle-pack' | 'at-risk' | 'commoditized' {
  let score = 0;
  
  if (hasCapi) score += 3;
  if (hasPpid) score += 3;
  if (hasHeaderBidding) score += 2;
  if (addressabilityGap < 30) score += 2;
  else if (addressabilityGap > 50) score -= 2;
  
  if (score >= 7) return 'walled-garden-parity';
  if (score >= 4) return 'middle-pack';
  if (score >= 1) return 'at-risk';
  return 'commoditized';
}
