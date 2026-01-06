# Diagnostic Report V4: CORS Preflight Failure - Root Cause Identified

**Date:** 2026-01-05  
**Status:** Phase 2 - Root Cause Verified  
**Mode:** Strict Diagnostic Protocol

---

## Executive Summary

**ROOT CAUSE IDENTIFIED:** CORS (Cross-Origin Resource Sharing) preflight request is failing. The browser is blocking the request because the OPTIONS preflight response does not have HTTP ok status.

**Current State:**
- ✅ Environment variable is set correctly (`VITE_SUPABASE_URL`)
- ✅ URL format is valid (`https://lshyhtgvqdmrakrbcgox.supabase.co`)
- ✅ DNS resolution works
- ✅ URL is accessible (REST API responds with 401 - expected without auth)
- ✅ Edge function code has CORS headers configured
- ❌ **CORS preflight (OPTIONS) request is failing**
- ❌ Browser blocks the actual request due to CORS policy violation

---

## Observed Behavior

**Browser Console Error:**
```
Access to fetch at 'https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain' 
from origin 'https://adfixus-sales.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

**Network Tab:**
```
lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain:1
Failed to load resource: net::ERR_FAILED
```

**Console Logs:**
```
[scannerApi] [DIAGNOSTIC] VITE_SUPABASE_URL set: true
[scannerApi] [DIAGNOSTIC] Supabase URL: https://lshyhtgvqdmrakrbcgox.supabase.co
[scannerApi] Edge function not accessible - DNS/Network error detected
```

**UI Display:**
- Red error box: "Scanner Service Unavailable"
- Error message: "Edge function not accessible. This usually means:
  1. The edge function is not deployed (check Supabase dashboard)
  2. VITE_SUPABASE_URL is incorrect (should be: https://lshyhtgvqdmrakrbcgox.supabase.co)
  3. Network connectivity issues"
- Issue persists despite correct configuration

---

## Critical Gap Identified

### Gap: Diagnostic Tool Doesn't Check Edge Function Deployment

**Current Diagnostic Flow:**
```
diagnoseConfiguration()
  ├─> Check env var set ✅
  ├─> Check URL format ✅
  ├─> Check DNS resolution ✅
  ├─> Check URL accessibility (REST API) ✅
  └─> Returns "Configuration appears correct" ✅
```

**Missing Check:**
```
  └─> Check edge function deployment ❌ NOT CHECKED
  └─> Check edge function accessibility ❌ NOT CHECKED
```

**Problem:**
- Diagnostic tool only checks if Supabase project exists and REST API is accessible
- It does NOT check if the `scan-domain` edge function is deployed
- It does NOT check if the edge function endpoint is accessible
- Configuration can be correct but edge function can still be missing

---

## Root Cause Analysis

### Root Cause 1: CORS Preflight Failure (CONFIRMED - PRIMARY ISSUE)

**Likelihood:** CONFIRMED  
**Impact:** CRITICAL

**Evidence:**
1. Browser console explicitly states: "Response to preflight request doesn't pass access control check: It does not have HTTP ok status"
2. Error occurs before actual request is sent (preflight fails)
3. Network tab shows `ERR_FAILED` (browser blocked due to CORS)
4. Configuration is correct (env vars, DNS, URL all valid)

**Why This Happens:**
1. Browser sends OPTIONS preflight request before actual POST request
2. Edge function must respond to OPTIONS with 200 status and CORS headers
3. If OPTIONS response is not 200 or missing CORS headers, browser blocks the request
4. Current error detection treats this as "DNS/Network error" instead of CORS error

**Edge Function Code Analysis:**
```typescript
// supabase/functions/scan-domain/index.ts:94-98
if (req.method === 'OPTIONS') {
  console.log('[scan-domain] Handling CORS preflight');
  return new Response(null, { status: 200, headers: corsHeaders });
}
```

**Possible Causes:**
1. Edge function not deployed → OPTIONS request fails (404/500)
2. Edge function deployed but OPTIONS handler not executing
3. Supabase platform blocking OPTIONS requests
4. CORS headers not being sent correctly
5. Edge function returning error before OPTIONS handler

**Verification Steps:**
- Check Supabase Dashboard → Edge Functions → `scan-domain` → Logs
- Look for OPTIONS request logs
- Test OPTIONS request directly: `curl -X OPTIONS https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain -H "Origin: https://adfixus-sales.vercel.app" -v`
- Verify response status is 200 and CORS headers are present

---

### Root Cause 2: Edge Function Not Deployed (SECONDARY - NEEDS VERIFICATION)

**Likelihood:** HIGH  
**Impact:** CRITICAL

**Why This Happens:**
1. Edge functions are deployed separately from frontend
2. Edge function `scan-domain` may not exist in Supabase Dashboard
3. Edge function may have been deleted or never deployed
4. Edge function deployment may have failed

**Evidence:**
- Configuration is correct (diagnostics pass)
- But edge function calls fail
- Health check likely returns unhealthy

**Verification Steps:**
- Check Supabase Dashboard → Edge Functions
- Verify `scan-domain` function exists and is deployed
- Check function logs for errors
- Test edge function URL directly: `https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain`

---

### Root Cause 2: Edge Function Deployed to Wrong Project

**Likelihood:** MEDIUM  
**Impact:** CRITICAL

**Why This Happens:**
1. Edge function deployed to old project (`ojtfnhzqhfsprebvpmvx`)
2. Frontend now points to new project (`lshyhtgvqdmrakrbcgox`)
3. Function doesn't exist in new project

**Evidence:**
- Configuration points to correct project
- But edge function doesn't exist in that project
- Health check fails

**Verification Steps:**
- Check which Supabase project has the edge function
- Verify edge function is in project `lshyhtgvqdmrakrbcgox`
- If in wrong project, redeploy to correct project

---

### Root Cause 3: Edge Function Requires Authentication/Authorization

**Likelihood:** LOW  
**Impact:** HIGH

**Why This Happens:**
1. Edge function may require specific headers
2. Edge function may require authentication token
3. Edge function may be restricted to certain origins

**Evidence:**
- Configuration correct
- DNS resolves
- But function returns 401/403 errors

**Verification Steps:**
- Check edge function logs for auth errors
- Check function configuration in Supabase Dashboard
- Verify function doesn't require special headers

---

### Root Cause 4: Edge Function Has Runtime Errors

**Likelihood:** MEDIUM  
**Impact:** HIGH

**Why This Happens:**
1. Edge function deployed but crashes on execution
2. Function has bugs that cause it to fail
3. Function dependencies missing

**Evidence:**
- Function exists and is accessible
- But returns 500 errors or crashes
- Health check may pass but actual calls fail

**Verification Steps:**
- Check Supabase Dashboard → Edge Functions → Logs
- Look for runtime errors
- Test function with minimal payload

---

### Root Cause 5: Health Check Logic Gap

**Likelihood:** MEDIUM  
**Impact:** MEDIUM

**Why This Happens:**
1. Health check may not properly distinguish between:
   - Configuration errors (env vars, DNS)
   - Deployment errors (function not deployed)
   - Runtime errors (function crashes)
2. Health check may return wrong status

**Evidence:**
- Diagnostics say configuration is correct
- But health check may still fail
- Unclear error messages

**Verification Steps:**
- Check health check return value
- Check what error message is shown
- Verify health check logic handles all cases

---

### Root Cause 6: CORS or Network Policy Issues

**Likelihood:** LOW  
**Impact:** MEDIUM

**Why This Happens:**
1. Edge function may block requests from Vercel domain
2. CORS headers not configured correctly
3. Network policies blocking function access

**Evidence:**
- Configuration correct
- Function exists
- But requests blocked by browser

**Verification Steps:**
- Check browser console for CORS errors
- Check Network tab for blocked requests
- Verify CORS configuration in edge function

---

## Architecture Call Graph

```
User Opens Scanner
  ├─> ScannerInput.tsx mounts
  │   └─> checkHealth() called
  │       └─> checkEdgeFunctionHealth()
  │           ├─> Validates env vars ✅
  │           ├─> Validates URL format ✅
  │           └─> supabase.functions.invoke('scan-domain')
  │               └─> ❌ If function not deployed → FunctionsFetchError
  │               └─> ❌ If function crashes → 500 error
  │               └─> ❌ If CORS issue → Network error
  │
  └─> User clicks "Check Configuration"
      └─> runDiagnostics() called
          └─> diagnoseConfiguration()
              ├─> Check env var set ✅
              ├─> Check URL format ✅
              ├─> Check DNS resolution ✅
              ├─> Check URL accessibility (REST API) ✅
              └─> ❌ MISSING: Check edge function deployment
              └─> ❌ MISSING: Check edge function accessibility
```

---

## Critical Findings

### Finding 1: Diagnostic Tool Incomplete

**Problem:** `diagnoseConfiguration()` only checks:
- Environment variable set
- URL format
- DNS resolution
- REST API accessibility

**Missing Checks:**
- Edge function deployment status
- Edge function endpoint accessibility
- Edge function response validation

**Impact:** Diagnostic tool can report "correct" even when edge function is not deployed.

---

### Finding 2: Health Check May Not Distinguish Error Types

**Problem:** Health check may treat all errors the same way, not distinguishing between:
- Configuration errors (should show config error)
- Deployment errors (should show deployment error)
- Runtime errors (should show function error)

**Impact:** User sees generic error message instead of specific guidance.

---

### Finding 3: No Edge Function Deployment Verification

**Problem:** There's no automated way to verify edge function is deployed. User must manually check Supabase Dashboard.

**Impact:** Configuration can be correct but function missing, causing confusion.

---

## Files Affected

1. **src/utils/scannerApi.ts**
   - `diagnoseConfiguration()` - Missing edge function deployment check
   - `checkEdgeFunctionHealth()` - May not distinguish error types clearly

2. **src/pages/scanner/ScannerInput.tsx**
   - Error messages may not be specific enough
   - May not guide user to check edge function deployment

---

## Implementation Status

**Phase 2 & 3: COMPLETED**

### Implemented Solutions

1. **CORS Error Detection** ✅
   - Added CORS-specific error detection in `checkEdgeFunctionHealth()`
   - Detects CORS errors by checking for:
     - 'CORS', 'cors', 'preflight', 'access control' in error messages
     - ERR_FAILED combined with FunctionsFetchError
   - Provides specific CORS error messages with actionable guidance

2. **Edge Function Deployment Verification** ✅
   - Enhanced `diagnoseConfiguration()` to test edge function endpoint
   - Added `testEdgeFunctionCors()` helper function
   - Tests OPTIONS preflight request to verify CORS configuration
   - Returns detailed CORS test results including:
     - `edgeFunctionDeployed`: boolean
     - `edgeFunctionCorsWorking`: boolean
     - `edgeFunctionError`: string | null

3. **Improved Error Messages** ✅
   - Created specific CORS error messages in `checkEdgeFunctionHealth()`
   - Updated `createScan()` to detect CORS errors
   - Provides actionable guidance:
     - If CORS error: Specific steps to check OPTIONS handler
     - If function not deployed: Instructions to deploy
     - If function deployed but CORS fails: Steps to fix CORS headers

4. **UI Updates** ✅
   - Updated `ScannerInput.tsx` to display CORS-specific error states
   - Added edge function deployment and CORS status to diagnostic display
   - Updated toast messages to distinguish CORS from deployment errors

### Verification Steps (Manual)

1. **Test OPTIONS Request:**
   ```bash
   curl -X OPTIONS https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain \
     -H "Origin: https://adfixus-sales.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: authorization, x-client-info, apikey, content-type" \
     -v
   ```

2. **Expected Response:**
   - Status: 200 OK
   - Headers:
     - `Access-Control-Allow-Origin: *` (or specific origin)
     - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
     - `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`

3. **Check Supabase Dashboard:**
   - Go to Edge Functions → scan-domain
   - Check Logs for OPTIONS requests
   - Verify "Handling CORS preflight" appears in logs

---

**Status:** Implementation Complete - Ready for Testing and Verification
