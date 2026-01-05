# Diagnostic Report V2: Persistent Issues After Vercel Migration

**Date:** 2026-01-05  
**Status:** Issues Persist - Root Cause Analysis Required  
**Mode:** Strict Diagnostic Protocol - Phase 1

---

## Executive Summary

Two critical issues persist after Vercel migration and previous fixes:

1. **Multiple GoTrueClient instances warning** - Still appearing despite isolated storage
2. **ERR_NAME_NOT_RESOLVED** - Health check incorrectly reports "healthy" when DNS fails

**Critical Finding:** The health check logic flaw is causing false positives. The error message format from Supabase doesn't match our detection patterns.

---

## Issue 1: Multiple GoTrueClient Instances

### Observed Behavior
```
index-DoQuwKq4.js:275 Multiple GoTrueClient instances detected in the same browser context.
```

### Root Cause Analysis

**Why Previous Fix Failed:**
- Supabase's `createClient()` **ALWAYS** initializes GoTrueClient internally
- Isolated storage key only affects WHERE tokens are stored, not WHETHER GoTrueClient is created
- Supabase uses a global instance registry that detects multiple instances by browser context
- Different storage keys don't prevent the warning

**Technical Details:**
1. Both clients call `createClient()` which internally creates GoTrueClient
2. Supabase's internal registry detects two instances in same browser context
3. Warning is triggered regardless of storage key differences
4. The warning is mostly harmless but indicates architectural issue

### Possible Solutions

**Option A: Accept Warning (If Harmless)**
- Warning doesn't break functionality
- Both clients work independently
- May cause undefined behavior in edge cases

**Option B: Use REST Client for Scanner (If Available)**
- Use Supabase REST API directly without full client
- Would require significant refactoring
- May not support real-time subscriptions

**Option C: Single Client with Context Switching**
- Use one client for both purposes
- Violates separation of concerns
- Not recommended

**Option D: Lazy Load Scanner Client**
- Only create when needed
- Destroy after use
- Complex and may cause other issues

---

## Issue 2: ERR_NAME_NOT_RESOLVED - Health Check False Positive

### Observed Behavior
```
Browser Network Tab:
  ojtfnhzqhfsprebvpmvx.supabase.co/functions/v1/scan-domain:1 
  Failed to load resource: net::ERR_NAME_NOT_RESOLVED

Console Logs:
  [scannerApi] Edge function is reachable (returned error, but function exists) ❌ WRONG
  [ScannerInput] Scanner service is healthy ❌ WRONG
```

### Root Cause Analysis

**The Critical Flaw:**

The error from `supabase.functions.invoke()` is:
```
FunctionsFetchError: Failed to send a request to the Edge Function
```

**Why Detection Fails:**
1. Browser shows `ERR_NAME_NOT_RESOLVED` in Network tab
2. But Supabase wraps it in `FunctionsFetchError` with generic message
3. Our pattern matching checks for:
   - `NAME_NOT_RESOLVED` ❌ (not in message)
   - `ERR_NAME_NOT_RESOLVED` ❌ (not in message)
   - `Failed to fetch` ❌ (not in message)
   - `NetworkError` ❌ (not in message)
4. Error message is: `"Failed to send a request to the Edge Function"` - doesn't match any pattern
5. Health check incorrectly assumes "any error = function exists" → returns `healthy: true`

### Current Code Flow

```typescript
// src/utils/scannerApi.ts:68-98
const response = await Promise.race([invokePromise, timeoutPromise]);

if (response.error) {
  const errorMsg = response.error.message || '';
  
  // Check for DNS errors - BUT THIS FAILS!
  if (errorMsg.includes('NAME_NOT_RESOLVED') || ...) {
    return { healthy: false, error: ... };
  }
  
  // Falls through to here - WRONG!
  console.log('[scannerApi] Edge function is reachable but returned error:', errorMsg);
  return { healthy: true }; // ❌ FALSE POSITIVE
}
```

### The Fix Required

**We need to:**
1. Check error type/name, not just message
2. Detect `FunctionsFetchError` as network error
3. Check for `ERR_NAME_NOT_RESOLVED` in error stack or underlying cause
4. Default to `healthy: false` if we can't determine function is reachable

---

## Additional Findings

### Finding 1: Error Object Structure Unknown

We don't know the full structure of `FunctionsFetchError`. It may have:
- `error.name` = "FunctionsFetchError"
- `error.message` = "Failed to send a request to the Edge Function"
- `error.cause` or `error.originalError` with the actual DNS error
- `error.stack` with the underlying error

**Action Required:** Inspect full error object structure in diagnostic logging.

### Finding 2: No URL Validation Before Request

The Supabase client might be using an undefined or invalid URL, but we don't validate it before making the request.

**Action Required:** Add URL validation and logging before invoking functions.

### Finding 3: Browser Network Tab Shows DNS Error

The browser Network tab clearly shows `ERR_NAME_NOT_RESOLVED`, which means:
- The URL is being constructed (not undefined)
- The browser is attempting to resolve the domain
- DNS resolution is failing

**Possible Causes:**
1. Domain doesn't exist (project deleted/moved)
2. Environment variable has wrong URL
3. Network/DNS issues
4. Vercel build didn't include env vars correctly

---

## Verification Checklist

### For Health Check Fix:
- [ ] Inspect full error object structure (error.name, error.cause, error.stack)
- [ ] Add detection for `FunctionsFetchError` type
- [ ] Check if error has underlying cause with DNS error
- [ ] Default to `healthy: false` when uncertain
- [ ] Add comprehensive error logging

### For GoTrueClient Warning:
- [ ] Research if Supabase v2.57.4 has option to disable auth completely
- [ ] Check if we can use REST client for scanner
- [ ] Verify if warning actually causes issues
- [ ] Consider accepting warning if harmless

### For ERR_NAME_NOT_RESOLVED:
- [ ] Verify `VITE_SUPABASE_URL` is set in Vercel Dashboard
- [ ] Check actual URL being used (add diagnostic logging)
- [ ] Test domain resolution: `nslookup ojtfnhzqhfsprebvpmvx.supabase.co`
- [ ] Verify Supabase project exists and is active
- [ ] Check Vercel build logs for env var inclusion

---

## Files Requiring Changes

1. **src/utils/scannerApi.ts** (Lines 68-98)
   - Fix health check logic to detect FunctionsFetchError
   - Add error object structure inspection
   - Default to unhealthy when uncertain

2. **src/integrations/supabase/client.ts** (Optional)
   - Add URL validation before client creation
   - Add diagnostic logging for URL

3. **src/integrations/supabase/scanner-client.ts** (Optional)
   - Research alternative client creation methods
   - Consider if warning can be eliminated

---

## Next Steps

1. **Immediate:** Fix health check logic to properly detect DNS failures
2. **High Priority:** Add comprehensive error object logging
3. **Medium Priority:** Verify environment variables in Vercel
4. **Low Priority:** Address GoTrueClient warning (if causing issues)

---

**Status:** Phase 1 Complete - Ready for Phase 2 (Root Cause Verification) and Phase 3 (Implementation Plan)
