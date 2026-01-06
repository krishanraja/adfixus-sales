# API Capabilities Analysis: Optimal Data Pipeline Design

**Date:** 2026-01-06  
**Purpose:** Document each API's capabilities and design optimal data pipeline

---

## 1. Tranco API

### What It Provides
- **Domain Ranking:** Position 1 to 1,000,000 (lower = more popular)
- **30-Day History:** Daily rank for past 30 days
- **Trend Analysis:** Derived from rank changes

### Data Extracted
```json
{
  "domain": "vox.com",
  "ranks": [
    { "date": "2026-01-05", "rank": 2121 },
    { "date": "2026-01-04", "rank": 2117 },
    // ... 30 days of data
  ]
}
```

### How We Use It
1. **Traffic Estimation:** Power-law formula converts rank to estimated pageviews
2. **Revenue Sizing:** Pageviews × CPM = estimated revenue
3. **Trend Detection:** Growing vs declining sites
4. **Benchmarking:** Compare against industry averages

### Current Implementation Status
- **Working correctly** - Verified with direct API call
- Issue: Data may not be stored/displayed correctly in frontend

---

## 2. Browserless API

### Available Endpoints

| Endpoint | Purpose | Data |
|----------|---------|------|
| `/content` | Get rendered HTML | HTML string |
| `/scrape` | Extract data + cookies | JSON + cookies array |
| `/function` | Custom Puppeteer code | **ANYTHING** |
| `/performance` | Lighthouse audits | Performance metrics |

### Current Implementation (BROKEN)
Uses `/content` and `/scrape` endpoints:
- `/content`: Gets HTML but no cookies
- `/scrape`: Should get cookies but may be failing

**Problem:** These endpoints are LIMITED. They cannot:
- Intercept network requests
- Detect third-party domain calls
- Track vendor pixels
- Analyze consent flows

### Optimal Implementation: `/function` API

The `/function` API allows **full Puppeteer access**:

```javascript
export default async function ({ page, context }) {
  const networkRequests = [];
  const thirdPartyDomains = new Set();
  
  // Intercept ALL network requests
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = new URL(request.url());
    networkRequests.push({
      url: request.url(),
      type: request.resourceType(),
      domain: url.hostname,
    });
    if (!url.hostname.includes(context.targetDomain)) {
      thirdPartyDomains.add(url.hostname);
    }
    request.continue();
  });
  
  // Navigate and wait for network idle
  await page.goto(context.url, { waitUntil: 'networkidle2' });
  
  // Get all cookies AFTER JavaScript execution
  const cookies = await page.cookies();
  
  // Get rendered HTML
  const html = await page.content();
  
  return {
    data: {
      html,
      cookies,
      networkRequests,
      thirdPartyDomains: Array.from(thirdPartyDomains),
    },
    type: 'application/json',
  };
}
```

### What `/function` API Can Capture

| Category | Data Points |
|----------|-------------|
| **Cookies** | All cookies with domain, path, expires, httpOnly, secure, sameSite |
| **Network Requests** | Every HTTP request made by the page |
| **Third-Party Domains** | All external domains called |
| **Vendor Detection** | Google, Meta, TTD, LiveRamp, Criteo, etc. by domain |
| **Pre-Consent Tracking** | Requests made BEFORE consent dialog |
| **Post-Consent Behavior** | What happens after consent is given |
| **Safari ITP Impact** | Cookies that would be blocked |

### Safari Blindness Detection

With network interception, we can detect:
1. **Third-party cookies** - Blocked in Safari
2. **7-day ITP cookies** - First-party cookies capped at 7 days
3. **Cross-site tracking** - Domains that track across sites
4. **Fingerprinting attempts** - Suspicious API calls

---

## 3. Browse.ai API

### How It Works
1. **Create Robot** in Browse.ai dashboard (manual)
2. **Configure Robot** to extract specific data
3. **Run Robot via API** with different URLs
4. **Poll for Results** or use webhooks

### API Endpoints
- `GET /robots` - List your robots
- `GET /robots/{robotId}` - Get robot details
- `POST /robots/{robotId}/tasks` - Run a robot
- `GET /robots/{robotId}/tasks` - List task results
- `GET /robots/{robotId}/tasks/{taskId}` - Get specific result

### Best Use Cases
1. **Change Detection:** Monitor sites for changes over time
2. **Structured Extraction:** Extract specific data points
3. **Complex Interactions:** Login, form filling, multi-step flows
4. **Long-running Tasks:** Background processing with webhooks

### Why It's NOT Primary Scanner
- Requires pre-configured robots (can't scan arbitrary URLs)
- Better suited for monitoring vs one-time scans
- Higher latency (async task model)

### Optimal Use: Change Detection Feature
Use Browse.ai for the "Monitor Changes" button:
1. Store baseline scan data
2. Set up monitoring robot
3. Compare periodic scans for changes

---

## 4. OpenAI API (AI Insights)

### Current Status
- Recently switched from Lovable gateway to direct OpenAI
- Using `gpt-4o-mini` model
- Generates strategic analysis from scan results

### Data It Receives
```json
{
  "results": [{
    "domain": "vox.com",
    "addressability_gap_pct": 52,
    "third_party_cookies": 15,
    "has_google_analytics": true,
    // ... all scan metrics
  }],
  "context": {
    "monthlyImpressions": 5000000,
    "publisherVertical": "news"
  }
}
```

### What It Generates
1. **Executive Summary** - One-liner assessment
2. **Key Findings** - Prioritized list of issues
3. **Strategic Opportunities** - Revenue-driving actions
4. **90-Day Roadmap** - Phased implementation plan

---

## 5. Optimal Data Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  ScannerInput → useDomainScan hook → ScannerResults              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SUPABASE EDGE FUNCTION                          │
│                    scan-domain/index.ts                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   TRANCO API     │ │ BROWSERLESS API  │ │ SUPABASE DB      │
│                  │ │ /function        │ │                  │
│ - Domain rank    │ │                  │ │ - domain_scans   │
│ - 30-day history │ │ - Network reqs   │ │ - domain_results │
│ - Traffic est.   │ │ - ALL cookies    │ │                  │
└──────────────────┘ │ - Third parties  │ └──────────────────┘
                     │ - Vendor detect  │
                     │ - Consent flows  │
                     │ - HTML content   │
                     └──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 ANALYSIS ENGINE (in Edge Function)               │
│                                                                   │
│  • Cookie Classification (1st party, 3rd party, Safari-blocked)  │
│  • Vendor Detection (GA, Meta, TTD, LiveRamp, Criteo, etc.)     │
│  • Consent Compliance (TCF, pre-consent tracking)               │
│  • Revenue Impact Scoring (addressability gap, ID bloat)        │
│  • Safari Blindness Calculation (% invisible inventory)         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OPENAI API                                    │
│                  generate-insights                               │
│                                                                   │
│  • Executive Summary                                             │
│  • Strategic Opportunities                                       │
│  • 90-Day Roadmap                                               │
│  • Product Recommendations (AFxID, CAPI, etc.)                  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BROWSE.AI API (Future)                           │
│                                                                   │
│  • Change Detection over time                                    │
│  • Architecture shift monitoring                                 │
│  • Competitive intelligence                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Key Data Points to Extract

### From Browserless /function API

**Network Analysis:**
- Total HTTP requests
- Third-party domain count
- Ad tech vendor requests
- Analytics requests
- Tracking pixel fires

**Cookie Analysis:**
- Total cookies
- First-party cookies (with domain matching)
- Third-party cookies (different domain)
- Cookie durations (session vs persistent)
- Safari ITP-blocked (3rd party + 7+ day 1st party)
- Cookie values/purposes where detectable

**Vendor Detection (by network requests AND HTML):**
- Google Analytics (`google-analytics.com`, `googletagmanager.com`)
- Google Tag Manager
- Google Consent Mode
- Meta Pixel (`facebook.net`, `fbevents.js`)
- Meta CAPI (server-side calls)
- The Trade Desk (`thetradedesk.com`)
- LiveRamp (`rlcdn.com`)
- ID5 (`id5-sync.com`)
- Criteo (`criteo.net`, `criteo.com`)
- Prebid.js
- SSPs (Rubicon, PubMatic, OpenX, etc.)

**Consent Analysis:**
- CMP presence (OneTrust, Cookiebot, etc.)
- TCF API detection (`__tcfapi`)
- Pre-consent tracking (vendors loading before consent)
- Consent banner detection

### From Tranco API

- Current rank
- 30-day rank history
- Rank trend (improving/declining)
- Estimated monthly pageviews
- Estimated monthly impressions
- Traffic confidence level

---

## 7. Safari Blindness Calculation

**Formula:**
```
Safari Blindness % = (Safari-blocked cookies / Total cookies) × 100
                   + Third-party domain dependency weight
                   + ITP-capped cookie weight
```

**Components:**
1. **Third-party cookies:** 100% blocked in Safari
2. **Long-duration 1st-party:** Capped at 7 days via ITP
3. **Cross-site tracking:** Completely blocked
4. **Fingerprinting attempts:** May trigger additional blocks

**Estimated Safari Traffic Loss:**
```
Lost Revenue = Monthly Impressions × Safari Market Share × Blindness %
             = 5M × 0.35 × 0.52
             = $910K/month
```

---

## 8. Recommendations

### Immediate Actions

1. **Rewrite `scan-domain` edge function** to use Browserless `/function` API
2. **Implement network request interception** for accurate vendor detection
3. **Capture all cookies with metadata** for accurate Safari blindness calculation
4. **Store raw data** for debugging and future analysis

### Future Enhancements

1. **Browse.ai Integration** for change detection monitoring
2. **Comparative Analysis** against industry benchmarks
3. **Competitive Intelligence** scanning competitor sites
4. **Automated Alerts** when sites change significantly

---

## Summary

| API | Primary Use | Key Data |
|-----|-------------|----------|
| **Tranco** | Traffic estimation | Rank, pageviews, trends |
| **Browserless /function** | Deep scanning | Cookies, network, vendors, consent |
| **Browse.ai** | Change monitoring | Architecture changes, visual diffs |
| **OpenAI** | AI insights | Strategic recommendations |

The current implementation fails because it uses shallow `/content` + `/scrape` endpoints instead of the powerful `/function` API that allows full network interception and comprehensive cookie capture.
