# Implementation Plan: Fix All API Failures - Architectural Solution

**Date:** 2026-01-06  
**Status:** Ready for Implementation  
**Diagnosis:** DIAGNOSIS_V7_API_FAILURES.md

---

## Problem Summary

All APIs appear to return zero/empty data:
- **0 cookies** (Total, First-Party, Third-Party)
- **No vendors detected**
- **No traffic data** (0 impressions, $0 revenue)

**Root Causes:**
1. Browserless may be failing silently → falls back to static fetch
2. Static fetch **cannot capture cookies** (JavaScript limitation)
3. Tranco data may not be stored correctly
4. No error visibility when APIs fail

---

## ALL Root Causes (Complete List)

### 1. Browserless Silent Failure → Static Fetch Limitation

**Problem:** Browserless fails → falls back to static fetch → static fetch can't get cookies

**Why:** Modern sites set cookies via JavaScript after page load. Static `fetch()` only gets initial HTML.

**Fix:** 
- Add comprehensive error handling for Browserless
- Store which method was used in result
- Show user-friendly message when static fetch is used

---

### 2. Cookie Estimation Logic Flaw

**Problem:** `estimateCookiesFromHtml()` only estimates if vendor patterns match. If patterns don't match → returns 0.

**Why:** Minified code, CDN URLs, different script formats may not match regex patterns.

**Fix:**
- Improve vendor pattern detection
- Add minimum estimate based on detected vendors
- Return "unknown" instead of 0 when uncertain

---

### 3. Tranco Data Not Displayed

**Problem:** Tranco API works (verified) but data shows as 0 in UI.

**Possible Causes:**
- Data not being stored (insert error)
- Field name mismatch
- Frontend not reading correctly

**Fix:**
- Verify data is stored correctly
- Add logging to track data flow
- Fix any field name mismatches

---

### 4. No Error Visibility

**Problem:** When APIs fail, user sees zeros but doesn't know why.

**Fix:**
- Store error messages in `error_message` field
- Show user-friendly error messages in UI
- Indicate which scanning method was used

---

### 5. Browserless API Key May Be Invalid

**Problem:** Key is set but may be expired/invalid.

**Fix:**
- Test Browserless API directly
- Add validation/health check
- Show clear error if key is invalid

---

## Implementation Plan

### Phase 1: Add Comprehensive Logging & Error Tracking

**File:** `supabase/functions/scan-domain/index.ts`

**Changes:**
1. **Store scanning method used** (line ~261):
   ```typescript
   const scanMethod = BROWSERLESS_API_KEY ? 'browserless' : 'static';
   const result = await scanDomain(domain, scanMethod);
   ```

2. **Store Browserless errors** (line ~533):
   ```typescript
   } catch (err) {
     const errorMsg = err instanceof Error ? err.message : String(err);
     console.error(`[scan-domain] Browserless failed for ${domain}:`, errorMsg);
     // Store error for user visibility
     browserlessError = errorMsg;
   }
   ```

3. **Add method to result** (line ~778):
   ```typescript
   return {
     ...existing fields,
     scan_method: scanMethod,
     browserless_error: browserlessError || null,
   };
   ```

4. **Store method in database** (line ~269):
   ```typescript
   scan_method: result.scan_method,
   browserless_error: result.browserless_error,
   ```

---

### Phase 2: Improve Cookie Estimation

**File:** `supabase/functions/scan-domain/index.ts`

**Changes:**
1. **Fix estimateCookiesFromHtml** (lines 832-842):
   ```typescript
   function estimateCookiesFromHtml(html: string): number {
     let estimate = 0;
     const detectedVendors = [];
     
     if (VENDOR_PATTERNS.google_analytics.some(p => p.test(html))) {
       estimate += 3;
       detectedVendors.push('GA');
     }
     if (VENDOR_PATTERNS.gtm.some(p => p.test(html))) {
       estimate += 2;
       detectedVendors.push('GTM');
     }
     if (VENDOR_PATTERNS.meta_pixel.some(p => p.test(html))) {
       estimate += 4;
       detectedVendors.push('Meta');
     }
     if (VENDOR_PATTERNS.criteo.some(p => p.test(html))) {
       estimate += 5;
       detectedVendors.push('Criteo');
     }
     if (VENDOR_PATTERNS.liveramp.some(p => p.test(html))) {
       estimate += 3;
       detectedVendors.push('LiveRamp');
     }
     if (VENDOR_PATTERNS.ttd.some(p => p.test(html))) {
       estimate += 3;
       detectedVendors.push('TTD');
     }
     
     // If vendors detected but estimate is 0, return minimum
     if (detectedVendors.length > 0 && estimate === 0) {
       return detectedVendors.length * 2; // Minimum 2 cookies per vendor
     }
     
     return estimate;
   }
   ```

2. **Update cookie calculation** (line 744):
   ```typescript
   const totalCookies = cookies.length > 0 
     ? cookies.length 
     : (estimateCookiesFromHtml(html) || 0);
   ```

---

### Phase 3: Verify & Fix Tranco Data Storage

**File:** `supabase/functions/scan-domain/index.ts`

**Changes:**
1. **Add logging for Tranco data** (line ~502):
   ```typescript
   console.log(`[scan-domain] Tranco data for ${cleanDomain}:`, {
     rank,
     monthlyPageviews,
     monthlyImpressions,
     confidence,
   });
   ```

2. **Verify data is inserted** (line ~307):
   ```typescript
   console.log(`[scan-domain] Inserting Tranco data:`, {
     tranco_rank: trancoData.rank,
     estimated_monthly_impressions: trancoData.monthlyImpressions,
   });
   ```

3. **Add error handling for insert** (line ~317):
   ```typescript
   if (insertError) {
     console.error(`[scan-domain] Database insertion failed for ${domain}:`, insertError);
     console.error(`[scan-domain] Failed data:`, {
       tranco_rank: trancoData.rank,
       estimated_monthly_impressions: trancoData.monthlyImpressions,
     });
     throw new Error(`Failed to insert result: ${insertError.message}`);
   }
   ```

---

### Phase 4: Add User-Friendly Error Messages

**File:** `src/pages/scanner/ScannerResults.tsx`

**Changes:**
1. **Show scan method** (line ~694):
   ```tsx
   {result.scan_method === 'static' && (
     <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded text-xs text-warning">
       ⚠️ Static scan used - cookies may be incomplete. Browserless unavailable.
     </div>
   )}
   ```

2. **Show Browserless errors** (if present):
   ```tsx
   {result.browserless_error && (
     <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
       Browserless error: {result.browserless_error}
     </div>
   )}
   ```

---

### Phase 5: Test Browserless API Directly

**Action:** Create test script to verify Browserless API key works

**File:** `test-browserless.ps1` (new file)

```powershell
$apiKey = "your-key-here"
$url = "https://chrome.browserless.io/content?token=$apiKey"

$body = @{
    url = "https://vox.com"
    waitFor = 5000
    gotoOptions = @{
        waitUntil = "networkidle2"
        timeout = 45000
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
    Write-Host "SUCCESS: Browserless API works"
    Write-Host "HTML length: $($response.Length)"
} catch {
    Write-Host "ERROR: Browserless API failed"
    Write-Host $_.Exception.Message
}
```

---

## Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `supabase/functions/scan-domain/index.ts` | Add scan method tracking | ~261, 533, 778, 269 |
| `supabase/functions/scan-domain/index.ts` | Improve cookie estimation | 744, 832-842 |
| `supabase/functions/scan-domain/index.ts` | Add Tranco logging | ~502, ~307, ~317 |
| `src/pages/scanner/ScannerResults.tsx` | Show error messages | ~694 |
| `src/types/scanner.ts` | Add scan_method field | TBD |

---

## Verification Checkpoints

| CP | Action | Expected | Verification |
|----|--------|----------|--------------|
| CP0 | Plan approved | - | User approval |
| CP1 | Add logging | Logs show method used | Edge function logs |
| CP2 | Improve estimation | Cookies > 0 when vendors detected | Database query |
| CP3 | Fix Tranco storage | Data stored correctly | Database query |
| CP4 | Deploy function | No errors | CLI output |
| CP5 | Test scan | Results show method & errors | Browser test |
| CP6 | Verify data | Cookies & traffic > 0 | Database + UI |

---

## Database Schema Updates Needed

**Table:** `domain_results`

**New Columns:**
- `scan_method` (text) - 'browserless' | 'static'
- `browserless_error` (text, nullable) - Error message if Browserless failed

**Migration:**
```sql
ALTER TABLE domain_results 
ADD COLUMN scan_method TEXT,
ADD COLUMN browserless_error TEXT;
```

---

## Prevention Measures

1. **Health Check Endpoint:** Add `/health` endpoint to test all APIs
2. **Monitoring:** Log all API calls with success/failure
3. **Fallback Strategy:** Clear messaging when fallback is used
4. **Validation:** Verify API keys on startup
5. **Documentation:** Document limitations of static fetch

---

**Status:** Ready for implementation upon approval
