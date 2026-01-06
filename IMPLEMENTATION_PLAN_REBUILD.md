# Implementation Plan: Rebuild Data, API & AI Pipeline

**Date:** 2026-01-06  
**Status:** Ready for Implementation  
**Scope:** Complete rewrite of scan-domain edge function using Browserless /function API

---

## Executive Summary

The current scanner fails because it uses limited Browserless endpoints (`/content` + `/scrape`) that cannot properly capture:
- Network requests (vendor detection)
- All cookies (Safari blindness)
- Pre-consent tracking behavior

The fix: Rewrite using Browserless `/function` API which provides full Puppeteer access for comprehensive scanning.

---

## Architecture Comparison

### Current (Broken)
```
scan-domain → /content (HTML only) → /scrape (limited cookies)
           → Regex patterns on HTML → Misses most vendors
           → Zero cookies → Zero Safari blindness data
```

### New (Fixed)
```
scan-domain → /function (full Puppeteer)
           → Network interception → ALL third-party calls
           → page.cookies() → ALL cookies with metadata
           → Pre-consent analysis → Compliance detection
           → Rich data → Accurate Safari blindness
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/scan-domain/index.ts` | **Rewrite** | Use /function API with network interception |
| `src/types/scanner.ts` | **Update** | Add new fields for network data |
| `src/utils/revenueImpactScoring.ts` | **Update** | Use actual network data |
| `supabase/functions/generate-insights/index.ts` | **Minor update** | Handle new data structure |

---

## Phase 1: Rewrite scan-domain Edge Function

### 1.1 New Browserless Integration

Replace current `scanWithBrowserless` with `/function` API:

**Location:** `supabase/functions/scan-domain/index.ts`

**New Function:**

```typescript
async function scanWithBrowserlessFunction(url: string, domain: string): Promise<ScanResult> {
  const functionUrl = `https://chrome.browserless.io/function?token=${BROWSERLESS_API_KEY}`;
  
  // Puppeteer code to execute
  const puppeteerCode = `
    export default async function ({ page, context }) {
      const networkRequests = [];
      const thirdPartyDomains = new Set();
      const adTechRequests = [];
      const targetDomain = context.domain.replace(/^www\\./, '');
      
      // Enable request interception
      await page.setRequestInterception(true);
      
      page.on('request', (request) => {
        try {
          const requestUrl = request.url();
          const urlObj = new URL(requestUrl);
          const hostname = urlObj.hostname;
          
          networkRequests.push({
            url: requestUrl,
            type: request.resourceType(),
            domain: hostname,
            isThirdParty: !hostname.includes(targetDomain),
          });
          
          if (!hostname.includes(targetDomain)) {
            thirdPartyDomains.add(hostname);
          }
          
          // Detect ad tech vendors
          const adTechPatterns = [
            { name: 'google_analytics', patterns: ['google-analytics.com', 'googletagmanager.com', 'analytics.google.com'] },
            { name: 'meta_pixel', patterns: ['facebook.net', 'facebook.com/tr', 'connect.facebook'] },
            { name: 'ttd', patterns: ['thetradedesk.com', 'adsrvr.org'] },
            { name: 'liveramp', patterns: ['rlcdn.com', 'liveramp.com'] },
            { name: 'id5', patterns: ['id5-sync.com'] },
            { name: 'criteo', patterns: ['criteo.net', 'criteo.com'] },
            { name: 'prebid', patterns: ['prebid.org', 'rubiconproject.com', 'pubmatic.com'] },
          ];
          
          for (const vendor of adTechPatterns) {
            if (vendor.patterns.some(p => hostname.includes(p))) {
              adTechRequests.push({
                vendor: vendor.name,
                url: requestUrl,
                domain: hostname,
              });
            }
          }
        } catch (e) {
          // Ignore URL parsing errors
        }
        
        request.continue();
      });
      
      // Navigate with timeout
      try {
        await page.goto(context.url, { 
          waitUntil: 'networkidle2', 
          timeout: 45000 
        });
      } catch (navError) {
        // Continue even if navigation times out
        console.log('Navigation timeout, continuing with partial data');
      }
      
      // Wait a bit more for late-loading scripts
      await new Promise(r => setTimeout(r, 2000));
      
      // Get all cookies
      const cookies = await page.cookies();
      
      // Get rendered HTML
      const html = await page.content();
      
      // Classify cookies
      const firstPartyCookies = cookies.filter(c => 
        c.domain.includes(targetDomain) || c.domain.startsWith('.')
      );
      const thirdPartyCookies = cookies.filter(c => 
        !c.domain.includes(targetDomain) && !c.domain.startsWith('.')
      );
      
      // Safari ITP analysis
      const now = Date.now() / 1000;
      const safariBlocked = thirdPartyCookies.length + 
        firstPartyCookies.filter(c => (c.expires - now) > 7 * 86400).length;
      
      return {
        data: {
          html: html.substring(0, 100000), // Limit HTML size
          cookies: cookies.slice(0, 100), // Limit cookie count
          networkRequests: networkRequests.slice(0, 500),
          thirdPartyDomains: Array.from(thirdPartyDomains),
          adTechRequests: adTechRequests,
          cookieAnalysis: {
            total: cookies.length,
            firstParty: firstPartyCookies.length,
            thirdParty: thirdPartyCookies.length,
            safariBlocked: safariBlocked,
            maxDurationDays: Math.max(0, ...cookies.map(c => (c.expires - now) / 86400)),
            sessionCookies: cookies.filter(c => c.expires === -1 || c.expires === 0).length,
            persistentCookies: cookies.filter(c => c.expires > now).length,
          },
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
  
  const result = await response.json();
  return analyzeNetworkResults(result.data, domain);
}
```

### 1.2 New Analysis Engine

Replace pattern-based detection with network-based detection:

```typescript
function analyzeNetworkResults(data: BrowserlessResult, domain: string): ScanResult {
  const { html, cookies, networkRequests, thirdPartyDomains, adTechRequests, cookieAnalysis } = data;
  
  // Vendor detection from network requests (accurate)
  const vendorCounts = new Map<string, number>();
  for (const req of adTechRequests) {
    vendorCounts.set(req.vendor, (vendorCounts.get(req.vendor) || 0) + 1);
  }
  
  const hasGoogleAnalytics = vendorCounts.has('google_analytics');
  const hasMetaPixel = vendorCounts.has('meta_pixel');
  const hasTTD = vendorCounts.has('ttd');
  const hasLiveramp = vendorCounts.has('liveramp');
  const hasId5 = vendorCounts.has('id5');
  const hasCriteo = vendorCounts.has('criteo');
  const hasPrebid = vendorCounts.has('prebid');
  
  // Also check HTML for additional patterns (GTM, GCM, CAPI)
  const hasGtm = /googletagmanager\.com|GTM-[A-Z0-9]{6,}/.test(html);
  const hasGcm = /gtag\(['"]consent['"]/.test(html);
  const hasMetaCapi = /graph\.facebook\.com.*events|facebook.*conversions/i.test(html);
  const hasPpid = /ppid|publisher.*id|first.*party.*id/i.test(html);
  
  // CMP detection
  let cmpVendor = null;
  if (/onetrust|optanon/i.test(html)) cmpVendor = 'OneTrust';
  else if (/cookiebot/i.test(html)) cmpVendor = 'Cookiebot';
  else if (/quantcast/i.test(html)) cmpVendor = 'Quantcast';
  else if (/sourcepoint/i.test(html)) cmpVendor = 'Sourcepoint';
  
  // TCF compliance
  const tcfCompliant = /__tcfapi|__cmp|__gpp/i.test(html);
  
  // Pre-consent tracking (vendors loading before consent)
  const loadsPreConsent = !cmpVendor && (hasGoogleAnalytics || hasMetaPixel || hasCriteo);
  
  // SSP detection from network
  const detectedSsps = [];
  const sspPatterns = [
    { name: 'Rubicon', pattern: /rubiconproject\.com/ },
    { name: 'PubMatic', pattern: /pubmatic\.com/ },
    { name: 'OpenX', pattern: /openx\.net/ },
    { name: 'AppNexus', pattern: /adnxs\.com/ },
    { name: 'Index Exchange', pattern: /casalemedia\.com/ },
  ];
  for (const ssp of sspPatterns) {
    if (thirdPartyDomains.some(d => ssp.pattern.test(d))) {
      detectedSsps.push(ssp.name);
    }
  }
  
  // Calculate scores
  const addressabilityGap = calculateAddressabilityGap(
    hasGoogleAnalytics, hasMetaPixel, hasPpid, hasLiveramp, hasId5, cookieAnalysis.thirdParty
  );
  
  const safariLoss = Math.min(30 + (cookieAnalysis.safariBlocked * 2), 50);
  
  const idBloatSeverity = calculateIdBloat(
    hasLiveramp, hasId5, hasCriteo, hasTTD, cookieAnalysis.thirdParty
  );
  
  const privacyRisk = calculatePrivacyRisk(
    loadsPreConsent, !tcfCompliant, cookieAnalysis.thirdParty, cookieAnalysis.maxDurationDays
  );
  
  const competitivePosition = calculateCompetitivePosition(
    hasMetaCapi, hasPpid, hasPrebid, addressabilityGap
  );
  
  return {
    status: 'completed',
    error_message: null,
    total_cookies: cookieAnalysis.total,
    first_party_cookies: cookieAnalysis.firstParty,
    third_party_cookies: cookieAnalysis.thirdParty,
    max_cookie_duration_days: Math.round(cookieAnalysis.maxDurationDays),
    session_cookies: cookieAnalysis.sessionCookies,
    persistent_cookies: cookieAnalysis.persistentCookies,
    safari_blocked_cookies: cookieAnalysis.safariBlocked,
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
    has_header_bidding: hasPrebid || detectedSsps.length > 0,
    has_conversion_api: hasMetaCapi,
    detected_ssps: detectedSsps,
    addressability_gap_pct: addressabilityGap,
    estimated_safari_loss_pct: safariLoss,
    id_bloat_severity: idBloatSeverity,
    privacy_risk_level: privacyRisk,
    competitive_positioning: competitivePosition,
    cookies_raw: cookies,
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
      total_requests: networkRequests.length,
      third_party_domains: thirdPartyDomains.length,
      ad_tech_requests: adTechRequests.length,
      total_vendors: detectedSsps.length + (hasGoogleAnalytics ? 1 : 0) + (hasMetaPixel ? 1 : 0),
    },
  };
}
```

---

## Phase 2: Update Type Definitions

**Location:** `src/types/scanner.ts`

Add new fields:

```typescript
export interface NetworkSummary {
  total_requests?: number;
  third_party_domains?: number;
  ad_tech_requests?: number;
  total_vendors: number;
  analytics_requests?: number;
}
```

---

## Phase 3: Deploy and Test

### Deployment Steps

1. Update edge function code
2. Deploy: `npx supabase functions deploy scan-domain`
3. Test with a known domain (vox.com)
4. Verify all data is captured

### Verification Checklist

| Check | Expected | How to Verify |
|-------|----------|---------------|
| Tranco rank | > 0 | Database query |
| Total cookies | > 0 | Database query |
| Third-party cookies | > 0 | Database query |
| Vendor detection | Multiple | UI display |
| Network requests | 50+ | Edge function logs |
| AI insights | Generated | UI display |

---

## Phase 4: UI Enhancements (Optional)

After core pipeline works:

1. **Show scan method used** (Browserless function vs fallback)
2. **Display network analysis** (third-party domain count)
3. **Show pre-consent violations** with severity
4. **Safari blindness breakdown** (what's blocked and why)

---

## Implementation Order

1. **Rewrite `scanWithBrowserless`** → Use /function API
2. **Update `analyzeResults`** → Network-based detection
3. **Remove old pattern-based code** → Clean up
4. **Deploy and test** → Verify data
5. **Update frontend** → Show new data (if needed)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Browserless /function quota limits | Add rate limiting, batch requests |
| Large response sizes | Limit HTML/cookies in response |
| Timeout on slow sites | 45s timeout, partial data capture |
| Network interception failures | Fallback to current /content method |

---

## Success Criteria

1. **Cookies > 0** for major sites
2. **Vendors detected** via network (not just HTML)
3. **Safari blindness** calculated accurately
4. **AI insights** generated successfully
5. **No regressions** in existing functionality

---

## Files Summary

| File | Lines Changed | Change Type |
|------|---------------|-------------|
| `supabase/functions/scan-domain/index.ts` | ~300 | Rewrite |
| `src/types/scanner.ts` | ~10 | Update |
| `API_CAPABILITIES_ANALYSIS.md` | New | Documentation |

---

**Ready for implementation upon approval.**
