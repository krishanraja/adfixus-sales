import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Scanner Supabase credentials
const SCANNER_SUPABASE_URL = 'https://lshyhtgvqdmrakrbcgox.supabase.co';
const SCANNER_SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Browserless API for dynamic scanning
const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY') || '';

// Tranco API for traffic estimation
const TRANCO_API_KEY = Deno.env.get('TRANCO_API_KEY') || '';

// Traffic estimation constants (power-law formula from CrUX research)
const PAGEVIEW_COEFFICIENT = 7.73e12;
const PAGEVIEW_EXPONENT = -1.06;

// Vendor detection patterns
const VENDOR_PATTERNS = {
  google_analytics: [/google-analytics\.com/, /gtag\(/, /G-[A-Z0-9]{10}/, /UA-\d+-\d+/],
  gtm: [/googletagmanager\.com/, /GTM-[A-Z0-9]{6,}/],
  gcm: [/gtag\(['"]consent['"]/, /googletagmanager.*consent/],
  meta_pixel: [/connect\.facebook\.net/, /fbq\(/, /fbevents\.js/, /\d{15,16}/],
  meta_capi: [/facebook.*conversions/, /graph\.facebook\.com.*events/],
  ttd: [/TTDUniversalPixelApi/, /thetradedesk\.com/, /adsrvr\.org/],
  liveramp: [/idsync\.rlcdn\.com/, /idl_env/, /launchpad\.liveramp/],
  id5: [/id5-sync\.com/, /id5id/, /id5\.sync/],
  criteo: [/static\.criteo\.net/, /cto_bundle/, /criteo\.com.*rtax/],
  prebid: [/prebid\.js/, /pbjs\.que/, /prebid.*\d+\.\d+\.\d+/],
  amazon_tam: [/amazon-adsystem\.com/, /apstag/],
};

const CMP_PATTERNS = {
  onetrust: [/cdn\.cookielaw\.org/, /optanon/, /onetrust/i],
  cookiebot: [/consent\.cookiebot\.com/, /Cookiebot/],
  quantcast: [/quantcast\.mgr\.consensu\.org/, /cmpui\.js/],
  didomi: [/sdk\.privacy-center\.org/, /didomi/i],
  trustarc: [/consent\.trustarc\.com/, /truste/i],
};

const SSP_PATTERNS = [
  { name: 'Google Ad Manager', pattern: /googletag|doubleclick\.net|securepubads/i },
  { name: 'AppNexus/Xandr', pattern: /adnxs\.com|appnexus/i },
  { name: 'Rubicon', pattern: /rubiconproject\.com/i },
  { name: 'Index Exchange', pattern: /casalemedia\.com|indexww\.com/i },
  { name: 'OpenX', pattern: /openx\.net/i },
  { name: 'PubMatic', pattern: /pubmatic\.com/i },
  { name: 'Magnite', pattern: /magnite\.com|rubiconproject/i },
];

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Domain scan function called');
    const { domains, context }: ScanRequest = await req.json();

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

    console.log(`Starting scan for ${domains.length} domains`);

    // Create Supabase client for scanner database
    const supabase = createClient(
      SCANNER_SUPABASE_URL,
      SCANNER_SUPABASE_SERVICE_KEY || Deno.env.get('SUPABASE_ANON_KEY') || ''
    );

    // Create scan record
    const { data: scanRecord, error: insertError } = await supabase
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

    if (insertError) {
      console.error('Failed to create scan record:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create scan record', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scanId = scanRecord.id;
    console.log(`Created scan record: ${scanId}`);

    // Process domains (async - don't wait for completion)
    processDomains(supabase, scanId, domains).catch(err => {
      console.error('Background processing error:', err);
    });

    return new Response(
      JSON.stringify({ scanId, message: 'Scan started' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scan error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processDomains(supabase: any, scanId: string, domains: string[]) {
  let completedCount = 0;

  for (const domain of domains) {
    try {
      console.log(`Scanning domain: ${domain}`);
      
      // Fetch Tranco rank first (with rate limiting)
      const trancoData = await fetchTrancoData(domain);
      console.log(`Tranco data for ${domain}:`, trancoData);
      
      // Small delay for Tranco API rate limiting (1 query/second)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await scanDomain(domain);
      
      // Insert result with Tranco data
      await supabase.from('domain_results').insert({
        scan_id: scanId,
        domain,
        status: result.status,
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
        network_requests_summary: result.network_requests_summary,
        // Tranco traffic data
        tranco_rank: trancoData.rank,
        estimated_monthly_pageviews: trancoData.monthlyPageviews,
        estimated_monthly_impressions: trancoData.monthlyImpressions,
        traffic_confidence: trancoData.confidence,
        // Trend analysis
        tranco_rank_history: trancoData.rankHistory,
        rank_trend: trancoData.rankTrend,
        rank_change_30d: trancoData.rankChange30d,
      });

      completedCount++;
      
      // Update scan progress
      await supabase
        .from('domain_scans')
        .update({ completed_domains: completedCount })
        .eq('id', scanId);

    } catch (err) {
      console.error(`Error scanning ${domain}:`, err);
      
      await supabase.from('domain_results').insert({
        scan_id: scanId,
        domain,
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
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
        tcf_compliant: false,
        loads_pre_consent: false,
        has_prebid: false,
        has_header_bidding: false,
        has_conversion_api: false,
        detected_ssps: [],
        addressability_gap_pct: 52,
        estimated_safari_loss_pct: 30,
        id_bloat_severity: 'medium',
        privacy_risk_level: 'moderate',
        competitive_positioning: 'at-risk',
      });

      completedCount++;
      await supabase
        .from('domain_scans')
        .update({ completed_domains: completedCount })
        .eq('id', scanId);
    }
  }

  // Mark scan as completed
  await supabase
    .from('domain_scans')
    .update({ status: 'completed' })
    .eq('id', scanId);

  console.log(`Scan ${scanId} completed`);
}

// Fetch Tranco rank and estimate traffic with 30-day trend analysis
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
    // Clean domain (remove www, protocol, path)
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split(':')[0];
    
    console.log(`Fetching Tranco rank for: ${cleanDomain}`);
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    // Add API key if available
    if (TRANCO_API_KEY) {
      headers['Authorization'] = `Bearer ${TRANCO_API_KEY}`;
    }
    
    const response = await fetch(
      `https://tranco-list.eu/api/ranks/domain/${cleanDomain}`,
      { headers }
    );
    
    if (!response.ok) {
      console.log(`Tranco API returned ${response.status} for ${cleanDomain}`);
      return emptyResult;
    }
    
    const data = await response.json();
    
    // Get ranks array (contains 30 days of history)
    if (data.ranks && data.ranks.length > 0) {
      const rank = data.ranks[0].rank; // Most recent rank
      
      // Store full history for trend analysis
      const rankHistory: RankHistoryEntry[] = data.ranks.map((r: { date: string; rank: number }) => ({
        date: r.date,
        rank: r.rank,
      }));
      
      // Calculate trend (positive change = improving, lower rank is better)
      let rankTrend: 'growing' | 'stable' | 'declining' = 'stable';
      let rankChange30d = 0;
      
      if (rankHistory.length >= 2) {
        const newestRank = rankHistory[0].rank;
        const oldestRank = rankHistory[rankHistory.length - 1].rank;
        rankChange30d = oldestRank - newestRank; // Positive = improved (lower rank)
        
        const threshold = 1000; // 1000 rank positions is significant
        if (rankChange30d > threshold) {
          rankTrend = 'growing';
        } else if (rankChange30d < -threshold) {
          rankTrend = 'declining';
        }
      }
      
      // Calculate estimated traffic using power-law formula
      const annualPageviews = Math.round(PAGEVIEW_COEFFICIENT * Math.pow(rank, PAGEVIEW_EXPONENT));
      const monthlyPageviews = Math.round(annualPageviews / 12);
      const monthlyImpressions = monthlyPageviews * 4; // Assume 4 ad slots per page
      
      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low';
      if (rank <= 100000) confidence = 'high';
      else if (rank <= 1000000) confidence = 'medium';
      else confidence = 'low';
      
      console.log(`Tranco rank for ${cleanDomain}: #${rank}, trend: ${rankTrend} (${rankChange30d > 0 ? '+' : ''}${rankChange30d}), est. ${monthlyImpressions} impressions/mo`);
      
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
    
    console.log(`No Tranco rank found for ${cleanDomain}`);
    return emptyResult;
    
  } catch (err) {
    console.error(`Tranco lookup failed for ${domain}:`, err);
    return emptyResult;
  }
}

async function scanDomain(domain: string) {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  
  // Try Browserless first if available
  if (BROWSERLESS_API_KEY) {
    try {
      return await scanWithBrowserless(url, domain);
    } catch (err) {
      console.log(`Browserless failed for ${domain}, falling back to static:`, err);
    }
  }
  
  // Fallback to static analysis
  return await scanWithFetch(url, domain);
}

async function scanWithBrowserless(url: string, domain: string) {
  const browserlessUrl = `https://chrome.browserless.io/content?token=${BROWSERLESS_API_KEY}`;
  
  const response = await fetch(browserlessUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      waitFor: 5000,
      gotoOptions: {
        waitUntil: 'networkidle2',
        timeout: 45000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Browserless error: ${response.status}`);
  }

  const html = await response.text();
  
  // Also get cookies via Browserless scrape endpoint
  const cookieResponse = await fetch(`https://chrome.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      waitFor: 5000,
      elements: [{ selector: 'html' }],
      cookies: true,
    }),
  });

  let cookies: Cookie[] = [];
  if (cookieResponse.ok) {
    const cookieData = await cookieResponse.json();
    cookies = cookieData.cookies || [];
  }

  return analyzeResults(html, cookies, domain);
}

async function scanWithFetch(url: string, domain: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    clearTimeout(timeout);

    // Static analysis can't capture cookies, so estimate based on scripts
    return analyzeResults(html, [], domain);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function analyzeResults(html: string, cookies: Cookie[], domain: string) {
  // Vendor detection
  const hasGoogleAnalytics = VENDOR_PATTERNS.google_analytics.some(p => p.test(html));
  const hasGtm = VENDOR_PATTERNS.gtm.some(p => p.test(html));
  const hasGcm = VENDOR_PATTERNS.gcm.some(p => p.test(html));
  const hasMetaPixel = VENDOR_PATTERNS.meta_pixel.some(p => p.test(html));
  const hasMetaCapi = VENDOR_PATTERNS.meta_capi.some(p => p.test(html));
  const hasTtd = VENDOR_PATTERNS.ttd.some(p => p.test(html));
  const hasLiveramp = VENDOR_PATTERNS.liveramp.some(p => p.test(html));
  const hasId5 = VENDOR_PATTERNS.id5.some(p => p.test(html));
  const hasCriteo = VENDOR_PATTERNS.criteo.some(p => p.test(html));
  const hasPrebid = VENDOR_PATTERNS.prebid.some(p => p.test(html));
  const hasAmazonTam = VENDOR_PATTERNS.amazon_tam.some(p => p.test(html));
  
  // PPID detection - look for custom first-party ID patterns
  const hasPpid = /ppid|publisher.*id|first.*party.*id|user_id.*cookie|login.*token/i.test(html);
  
  // CMP detection
  let cmpVendor: string | null = null;
  for (const [vendor, patterns] of Object.entries(CMP_PATTERNS)) {
    if (patterns.some(p => p.test(html))) {
      cmpVendor = vendor;
      break;
    }
  }

  // TCF detection
  const tcfCompliant = /__tcfapi|__tcfapiLocator|__cmp|gdpr.*consent/i.test(html);

  // Pre-consent tracking detection
  const loadsPreConsent = !cmpVendor && (hasGoogleAnalytics || hasMetaPixel || hasCriteo);

  // SSP detection
  const detectedSsps = SSP_PATTERNS
    .filter(ssp => ssp.pattern.test(html))
    .map(ssp => ssp.name);

  // Header bidding detection
  const hasHeaderBidding = hasPrebid || hasAmazonTam || detectedSsps.length > 1;

  // Conversion API detection
  const hasConversionApi = hasMetaCapi || /enhanced.*conversion|gtag.*conversion/i.test(html);

  // Cookie analysis
  const totalCookies = cookies.length > 0 ? cookies.length : estimateCookiesFromHtml(html);
  const thirdPartyCookies = cookies.filter(c => !c.domain.includes(domain)).length;
  const firstPartyCookies = totalCookies - thirdPartyCookies;
  const sessionCookies = cookies.filter(c => c.expires === -1 || c.expires === 0).length;
  const persistentCookies = totalCookies - sessionCookies;
  
  // Safari would block third-party cookies
  const safariBlockedCookies = thirdPartyCookies > 0 ? thirdPartyCookies : Math.floor(totalCookies * 0.58);
  
  // Max cookie duration
  const maxCookieDuration = cookies.length > 0
    ? Math.max(...cookies.map(c => c.expires > 0 ? Math.floor((c.expires * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) : 0))
    : 365;

  // Revenue impact calculations
  const safariMarketShare = 0.52;
  const blockedRatio = totalCookies > 0 ? safariBlockedCookies / totalCookies : 0.58;
  const addressabilityGapPct = blockedRatio * safariMarketShare * 100;
  const estimatedSafariLossPct = addressabilityGapPct * 0.30;

  // ID bloat severity
  let idBloatSeverity: string;
  if (totalCookies > 100) idBloatSeverity = 'critical';
  else if (totalCookies > 70) idBloatSeverity = 'high';
  else if (totalCookies > 40) idBloatSeverity = 'medium';
  else idBloatSeverity = 'low';

  // Privacy risk level
  let privacyRiskLevel: string;
  if (loadsPreConsent || !cmpVendor) privacyRiskLevel = 'high-risk';
  else if (!tcfCompliant) privacyRiskLevel = 'moderate';
  else privacyRiskLevel = 'compliant';

  // Competitive positioning
  let competitivePositioning: string;
  const hasIdGraph = hasLiveramp || hasId5 || hasTtd;
  const thirdPartyRatio = totalCookies > 0 ? thirdPartyCookies / totalCookies : 0.58;
  
  if (hasConversionApi && hasPpid) {
    competitivePositioning = 'walled-garden-parity';
  } else if (hasIdGraph && !hasPpid) {
    competitivePositioning = 'middle-pack';
  } else if (thirdPartyRatio > 0.6 && !hasPpid) {
    competitivePositioning = 'at-risk';
  } else if (!hasIdGraph && !hasPpid && !hasConversionApi) {
    competitivePositioning = 'commoditized';
  } else {
    competitivePositioning = 'middle-pack';
  }

  return {
    status: 'success' as const,
    error_message: null,
    total_cookies: totalCookies,
    first_party_cookies: firstPartyCookies,
    third_party_cookies: thirdPartyCookies,
    max_cookie_duration_days: maxCookieDuration,
    session_cookies: sessionCookies,
    persistent_cookies: persistentCookies,
    safari_blocked_cookies: safariBlockedCookies,
    has_google_analytics: hasGoogleAnalytics,
    has_gtm: hasGtm,
    has_gcm: hasGcm,
    has_meta_pixel: hasMetaPixel,
    has_meta_capi: hasMetaCapi,
    has_ttd: hasTtd,
    has_liveramp: hasLiveramp,
    has_id5: hasId5,
    has_criteo: hasCriteo,
    has_ppid: hasPpid,
    cmp_vendor: cmpVendor,
    tcf_compliant: tcfCompliant,
    loads_pre_consent: loadsPreConsent,
    has_prebid: hasPrebid,
    has_header_bidding: hasHeaderBidding,
    has_conversion_api: hasConversionApi,
    detected_ssps: detectedSsps,
    addressability_gap_pct: Math.round(addressabilityGapPct * 100) / 100,
    estimated_safari_loss_pct: Math.round(estimatedSafariLossPct * 100) / 100,
    id_bloat_severity: idBloatSeverity,
    privacy_risk_level: privacyRiskLevel,
    competitive_positioning: competitivePositioning,
    cookies_raw: cookies,
    vendors_raw: {
      googleAnalytics: hasGoogleAnalytics,
      gtm: hasGtm,
      gcm: hasGcm,
      metaPixel: hasMetaPixel,
      metaCapi: hasMetaCapi,
      ttd: hasTtd,
      liveramp: hasLiveramp,
      id5: hasId5,
      criteo: hasCriteo,
      ppid: hasPpid,
      prebid: hasPrebid,
      headerBidding: hasHeaderBidding,
      conversionApi: hasConversionApi,
      detectedSsps,
      cmpVendor,
      tcfCompliant,
      loadsPreConsent,
    },
    network_requests_summary: {
      totalRequests: 0,
      thirdPartyRequests: 0,
      trackingRequests: 0,
      adRequests: 0,
    },
  };
}

function estimateCookiesFromHtml(html: string): number {
  // Estimate cookies based on detected vendors
  let estimate = 10; // Base cookies
  
  if (/google-analytics|gtag/.test(html)) estimate += 8;
  if (/googletagmanager/.test(html)) estimate += 5;
  if (/facebook|fbq/.test(html)) estimate += 6;
  if (/criteo/.test(html)) estimate += 10;
  if (/liveramp|rlcdn/.test(html)) estimate += 8;
  if (/thetradedesk|adsrvr/.test(html)) estimate += 5;
  if (/id5-sync/.test(html)) estimate += 3;
  if (/prebid/.test(html)) estimate += 15;
  if (/doubleclick|googletag/.test(html)) estimate += 12;
  
  return Math.min(estimate, 150);
}
