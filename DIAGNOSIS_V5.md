# Diagnostic Report V5: Complete Scan Failure Analysis

**Date:** 2026-01-06  
**Status:** Phase 1 - Comprehensive Problem Scope  
**Mode:** Strict Diagnostic Protocol  
**Symptom:** Scans complete but show "No Results Found" for ALL domains

---

## Executive Summary

**PRIMARY SYMPTOM:** Scans appear to start successfully (user navigates to results page with valid scanId), but the results page shows "No Results Found" with the message indicating all domains failed to scan or were unreachable.

**CRITICAL DISTINCTION FROM PREVIOUS ISSUES:**
- Previous issues: CORS failures, DNS resolution, edge function not deployed
- Current issue: Scan STARTS (scanId returned), but NO RESULTS are inserted

This indicates the edge function is reachable and creates the scan record, but the **background processing** (processDomains) is failing silently for ALL domains.

---

## Complete Architecture Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                                │
│                                                                          │
│  ScannerInput.tsx                                                        │
│       │                                                                  │
│       ├─► handleStartScan()                                              │
│       │       │                                                          │
│       │       └─► useDomainScan.startScan(domains, context)              │
│       │               │                                                  │
│       │               └─► scannerApi.createScan()                        │
│       │                       │                                          │
│       │                       └─► supabase.functions.invoke('scan-domain')
│       │                               │                                  │
│       │                               │  ✅ Returns scanId               │
│       │                               │                                  │
│       └─► navigate(`/scanner/results/${scanId}`)                         │
│                                                                          │
│  ScannerResults.tsx                                                      │
│       │                                                                  │
│       ├─► useDomainScan.loadScan(scanId)                                 │
│       │       │                                                          │
│       │       ├─► getScanStatus(scanId) → scannerSupabase                │
│       │       └─► getScanResults(scanId) → scannerSupabase               │
│       │               │                                                  │
│       │               └─► ❌ Returns empty array []                      │
│       │                                                                  │
│       └─► Shows "No Results Found"                                       │
│                                                                          │
│  SUPABASE CLIENTS:                                                       │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │ supabase (main client)       │  │ scannerSupabase (scanner client) │ │
│  │ URL: VITE_SUPABASE_URL       │  │ URL: lshyhtgvqdmrakrbcgox.supabase.co │
│  │ Used for: Edge functions     │  │ Used for: DB reads & real-time  │ │
│  │ Project: ojtfnhzqhfsprebvpmvx│  │ Project: lshyhtgvqdmrakrbcgox   │ │
│  └──────────────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ supabase.functions.invoke()
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION: scan-domain (on ojtfnhzqhfsprebvpmvx)        │
│                                                                          │
│  1. Receive request with domains[]                                       │
│  2. Create Supabase client to SCANNER database                           │
│     └─► SCANNER_SUPABASE_URL = lshyhtgvqdmrakrbcgox.supabase.co         │
│     └─► SCANNER_SUPABASE_SERVICE_KEY = Deno.env.get('...')              │
│         │                                                                │
│         └─► ❓ FAILURE POINT 1: Service key not set or invalid          │
│                                                                          │
│  3. INSERT into domain_scans → Returns scanId                            │
│     │                                                                    │
│     └─► ✅ This works (we get scanId back)                              │
│                                                                          │
│  4. Return { scanId } immediately (async processing starts)              │
│                                                                          │
│  5. processDomains() runs in background                                  │
│     │                                                                    │
│     ├─► FOR EACH domain:                                                │
│     │   │                                                                │
│     │   ├─► fetchTrancoData(domain)                                     │
│     │   │   │                                                            │
│     │   │   └─► ❓ FAILURE POINT 2: Tranco API fails                    │
│     │   │                                                                │
│     │   ├─► await delay(1100ms) // Rate limiting                        │
│     │   │                                                                │
│     │   ├─► scanDomain(domain)                                          │
│     │   │   │                                                            │
│     │   │   ├─► IF BROWSERLESS_API_KEY:                                 │
│     │   │   │   └─► scanWithBrowserless()                               │
│     │   │   │       │                                                    │
│     │   │   │       └─► ❓ FAILURE POINT 3: Browserless fails           │
│     │   │   │                                                            │
│     │   │   └─► ELSE / ON ERROR:                                        │
│     │   │       └─► scanWithFetch()                                     │
│     │   │           │                                                    │
│     │   │           └─► ❓ FAILURE POINT 4: Direct fetch fails          │
│     │   │                                                                │
│     │   ├─► analyzeResults(html, cookies, domain)                       │
│     │   │                                                                │
│     │   └─► INSERT into domain_results                                  │
│     │       │                                                            │
│     │       └─► ❓ FAILURE POINT 5: DB insert fails                     │
│     │                                                                    │
│     └─► UPDATE domain_scans SET status = 'completed'                    │
│         │                                                                │
│         └─► ❓ FAILURE POINT 6: Status update fails                     │
│                                                                          │
│  EXTERNAL APIs USED:                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │ Browserless    │  │ Tranco         │  │ Browse AI      │             │
│  │ Headless Chrome│  │ Traffic Rank   │  │ NOT IMPLEMENTED│             │
│  │ BROWSERLESS_   │  │ No auth needed │  │ Throws error   │             │
│  │ API_KEY secret │  │ Rate limited   │  │ always         │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ Service key auth
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│        SCANNER DATABASE (lshyhtgvqdmrakrbcgox.supabase.co)               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ domain_scans                                                     │    │
│  │ - Scan record created ✅                                         │    │
│  │ - Status may stay 'processing' if processDomains crashes        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ domain_results                                                   │    │
│  │ - ❌ NO RECORDS INSERTED if all domains fail                     │    │
│  │ - Even failed results should be inserted with status='failed'  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Real-time subscriptions from frontend should receive updates          │
│  BUT if no records are inserted, no updates are received               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ALL POSSIBLE FAILURE POINTS

### CATEGORY A: Edge Function Configuration

#### A1. SCANNER_SUPABASE_SERVICE_KEY Not Set
**Likelihood:** HIGH  
**Impact:** CRITICAL - All database operations fail

**Evidence:**
```typescript
// supabase/functions/scan-domain/index.ts:13
const SCANNER_SUPABASE_SERVICE_KEY = Deno.env.get('SCANNER_SUPABASE_SERVICE_KEY') || '';

// Line 176-181: Returns error if not set
if (!SCANNER_SUPABASE_SERVICE_KEY) {
  console.error('[scan-domain] SCANNER_SUPABASE_SERVICE_KEY not configured');
  return new Response(
    JSON.stringify({ error: 'Scanner database not configured' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**BUT WAIT:** If this check fails, we wouldn't get a scanId back at all. The fact that we get a scanId means the scan record IS created successfully. So this is likely not the issue.

**Verification:**
- Check if frontend receives scanId ✅ (seems to work)
- Check Supabase Dashboard → Edge Functions → scan-domain → Secrets

---

#### A2. BROWSERLESS_API_KEY Not Set or Invalid
**Likelihood:** HIGH  
**Impact:** HIGH - Forces fallback to fetch, which may also fail

**Evidence:**
```typescript
// supabase/functions/scan-domain/index.ts:16
const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY') || '';

// Line 528-534: Tries Browserless, falls through on error
if (BROWSERLESS_API_KEY) {
  try {
    return await scanWithBrowserless(url, domain);
  } catch (err) {
    // Fall through to static fetch - NO LOGGING!
  }
}
```

**CRITICAL ISSUE:** If Browserless fails, the error is SWALLOWED silently. No logging. This means we don't know why it failed.

**Verification:**
- Check Supabase Dashboard → Edge Functions → scan-domain → Secrets for BROWSERLESS_API_KEY
- Check Browserless dashboard for quota/errors
- Add logging to scanWithBrowserless catch block

---

#### A3. All External Fetches Fail Due to Deno Edge Runtime Restrictions
**Likelihood:** MEDIUM  
**Impact:** CRITICAL

**Evidence:**
Supabase Edge Functions run in Deno, which may have restrictions on outbound requests to certain domains or may timeout differently.

**Verification:**
- Check edge function logs for timeout errors
- Check if any domains successfully scan
- Test with well-known domains (google.com, facebook.com)

---

### CATEGORY B: Domain Scanning Failures

#### B1. HTTPS-Only Assumption Fails for HTTP Sites
**Likelihood:** MEDIUM  
**Impact:** HIGH

**Evidence:**
```typescript
// supabase/functions/scan-domain/index.ts:525
const url = domain.startsWith('http') ? domain : `https://${domain}`;
```

If domain doesn't start with 'http', it's assumed to be HTTPS. Sites that only support HTTP will fail.

**BUT:** The fallback should catch this and return a failed result with error message.

---

#### B2. All Domains Block Edge Function User-Agent
**Likelihood:** LOW  
**Impact:** HIGH

**Evidence:**
```typescript
// supabase/functions/scan-domain/index.ts:672-675
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}
```

Some sites may detect and block automated requests from cloud IPs.

---

#### B3. Timeout Too Short (30 seconds)
**Likelihood:** MEDIUM  
**Impact:** MEDIUM

**Evidence:**
```typescript
// supabase/functions/scan-domain/index.ts:666-667
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
```

30 seconds may not be enough for slow sites, especially if multiple redirects occur.

---

### CATEGORY C: Database Insert Failures

#### C1. Database Schema Mismatch
**Likelihood:** MEDIUM  
**Impact:** CRITICAL

**Evidence:**
The edge function inserts many columns. If any column is:
- Missing from the table
- Has wrong type
- Has NOT NULL constraint without default

The INSERT will fail.

**Verification:**
- Check scanner database schema matches insert columns
- Look for database constraint errors in edge function logs

---

#### C2. RLS Policies Blocking Writes
**Likelihood:** LOW (using service key should bypass)  
**Impact:** CRITICAL

**Evidence:**
Service key should bypass RLS, but if there's a misconfiguration...

**Verification:**
- Check RLS policies on domain_results table
- Verify service key role has write permissions

---

#### C3. Foreign Key Constraint Failure
**Likelihood:** LOW  
**Impact:** HIGH

**Evidence:**
If domain_results.scan_id references domain_scans.id and the scan record doesn't exist, INSERT fails.

**BUT:** Scan record IS created before processDomains runs, so this shouldn't happen.

---

### CATEGORY D: Silent Error Handling Issues

#### D1. processDomains Crashes Before Any Insert (MOST LIKELY)
**Likelihood:** HIGH  
**Impact:** CRITICAL

**Evidence:**
```typescript
// supabase/functions/scan-domain/index.ts:215-225
processDomains(supabase, scanId, domains).catch(err => {
  console.error('[scan-domain] Background processing error:', err);
  // Update scan status to failed if processing crashes
  supabase
    .from('domain_scans')
    .update({ status: 'failed' })
    .eq('id', scanId)
    .catch(updateErr => {
      console.error('[scan-domain] Failed to update scan status to failed:', updateErr);
    });
});
```

**CRITICAL ISSUE:** If processDomains throws BEFORE entering the for loop (e.g., first Tranco call fails unexpectedly), no results are inserted and scan stays in 'processing' or is marked 'failed'.

---

#### D2. Error in First Domain Crashes Entire Process
**Likelihood:** MEDIUM  
**Impact:** HIGH

**Evidence:**
```typescript
// Inside processDomains, line 252-397
try {
  for (const domain of domains) {
    try {
      // Domain processing
    } catch (err) {
      // Insert failed result - but what if THIS fails?
      const { error: failInsertError } = await supabase.from('domain_results').insert({...});
      if (failInsertError) {
        console.error(`[scan-domain] Failed to insert error result:`, failInsertError);
      }
    }
  }
} catch (err) {
  // Fatal error - marks scan as failed
}
```

If inserting the failed result also fails (e.g., schema mismatch), the error is logged but processing continues. If there's an unhandled error outside the inner try/catch, all domains fail.

---

#### D3. Tranco API Rate Limit Exception
**Likelihood:** MEDIUM  
**Impact:** HIGH

**Evidence:**
```typescript
// Line 255-259
const trancoData = await fetchTrancoData(domain);

// Small delay for Tranco API rate limiting (1 query/second)
await new Promise(resolve => setTimeout(resolve, 1100));
```

The delay is AFTER fetching, not before. If multiple scans run simultaneously, rate limiting could cause failures.

**Also:** fetchTrancoData returns emptyResult on error, so this shouldn't crash the process.

---

### CATEGORY E: Frontend Data Loading Issues

#### E1. Race Condition in loadScan
**Likelihood:** LOW  
**Impact:** MEDIUM

**Evidence:**
```typescript
// useDomainScan.ts:258-261
const [scanData, resultsData] = await Promise.all([
  getScanStatus(scanId),
  getScanResults(scanId),
]);
```

If called before any results are inserted, returns empty. But polling should catch new results.

---

#### E2. Real-time Subscriptions Not Working
**Likelihood:** MEDIUM  
**Impact:** MEDIUM

**Evidence:**
Real-time requires proper RLS configuration and the anon key to have SELECT permissions.

**Verification:**
- Check browser console for subscription errors
- Check if manual refresh shows results
- Verify RLS allows SELECT for anon key

---

#### E3. Polling Stops Prematurely
**Likelihood:** LOW  
**Impact:** LOW

**Evidence:**
```typescript
// Line 104-108
if (scanStatusRef.current === 'completed' || scanStatusRef.current === 'failed') {
  console.log('[useDomainScan] Scan already finished, stopping poll');
  if (pollInterval) clearInterval(pollInterval);
  return;
}
```

If scan status is marked 'completed' but results aren't loaded yet, polling stops.

---

### CATEGORY F: Environment/Configuration Issues

#### F1. Edge Function Deployed to Wrong Supabase Project
**Likelihood:** LOW  
**Impact:** CRITICAL

**Evidence:**
Edge functions should be on ojtfnhzqhfsprebvpmvx.supabase.co, database on lshyhtgvqdmrakrbcgox.supabase.co.

**Verification:**
- Check where edge functions are actually deployed
- Verify VITE_SUPABASE_URL points to edge function project

---

#### F2. Secrets Set on Wrong Project
**Likelihood:** MEDIUM  
**Impact:** CRITICAL

**Evidence:**
SCANNER_SUPABASE_SERVICE_KEY, BROWSERLESS_API_KEY, etc. must be set on the project where edge functions are deployed (ojtfnhzqhfsprebvpmvx).

**Verification:**
- Check secrets in Supabase Dashboard for ojtfnhzqhfsprebvpmvx project
- NOT on lshyhtgvqdmrakrbcgox project

---

#### F3. Edge Function Not Redeployed After Code Changes
**Likelihood:** MEDIUM  
**Impact:** HIGH

**Evidence:**
Code changes in supabase/functions/scan-domain/index.ts may not be deployed if:
- Deployment failed
- Cache issues
- Manual deployment required

**Verification:**
- Check edge function logs for recent deployment
- Add version comment and redeploy
- Compare deployed code with local code

---

## MOST LIKELY ROOT CAUSE (Hypothesis)

Based on the symptom (scan creates successfully, but no results), the most likely causes are:

1. **BROWSERLESS_API_KEY is not set or invalid** - Browserless fails silently, fallback to fetch also fails for most/all domains

2. **Database schema mismatch** - INSERT fails due to missing/mismatched columns

3. **processDomains throws before any domain is processed** - Some early failure crashes the whole background process

4. **All domains return non-200 HTTP status** - Sites blocking or returning errors

---

## VERIFICATION STEPS (MUST DO BEFORE ANY FIX)

### Step 1: Check Edge Function Logs
```
Supabase Dashboard → Project ojtfnhzqhfsprebvpmvx → Edge Functions → scan-domain → Logs
```

Look for:
- `[scan-domain] Background processing error:`
- `[scan-domain] Error scanning {domain}:`
- `[scan-domain] Database insertion failed for {domain}:`
- Any stack traces

### Step 2: Check Secrets Configuration
```
Supabase Dashboard → Project ojtfnhzqhfsprebvpmvx → Edge Functions → scan-domain → Secrets
```

Verify these exist and are valid:
- SCANNER_SUPABASE_SERVICE_KEY
- BROWSERLESS_API_KEY
- OPENAI_API_KEY (for insights)

### Step 3: Check Scanner Database
```
Supabase Dashboard → Project lshyhtgvqdmrakrbcgox → Database
```

Check:
- domain_scans table: Are scans being created? What status?
- domain_results table: Are ANY results ever inserted?
- Table schema: Do columns match edge function INSERT?

### Step 4: Test Individual Components
```bash
# Test Browserless API directly
curl -X POST "https://chrome.browserless.io/content?token=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com", "waitFor": 5000}'

# Test Tranco API
curl "https://tranco-list.eu/api/ranks/domain/google.com"
```

### Step 5: Check Browser Console
```
Open DevTools → Console → Filter by '[useDomainScan]' and '[scannerApi]'
```

Look for:
- Scan created successfully?
- Any polling errors?
- Subscription errors?

### Step 6: Check Database Directly
After running a scan, query the scanner database:
```sql
-- Check if scan exists
SELECT * FROM domain_scans ORDER BY created_at DESC LIMIT 5;

-- Check if any results exist for that scan
SELECT * FROM domain_results WHERE scan_id = 'your-scan-id';
```

---

## FILES REQUIRING INVESTIGATION

1. **supabase/functions/scan-domain/index.ts**
   - Line 16: BROWSERLESS_API_KEY usage
   - Line 215: processDomains error handling
   - Line 528-533: Browserless fallback (silent failure)
   - Line 269-324: INSERT statement columns

2. **Scanner Database Schema**
   - domain_scans table structure
   - domain_results table structure
   - RLS policies

3. **Supabase Dashboard**
   - Edge function deployment status
   - Secrets configuration
   - Function logs

---

## NEXT STEPS

1. **IMMEDIATE:** Check edge function logs for errors
2. **IMMEDIATE:** Verify all secrets are set on correct project
3. **HIGH:** Add logging to silent catch blocks in edge function
4. **HIGH:** Test individual APIs (Browserless, Tranco)
5. **MEDIUM:** Query database directly to see what's being inserted
6. **MEDIUM:** Test with a single, known-good domain

---

**Status:** Phase 1 Complete - Awaiting verification data before proposing fixes
