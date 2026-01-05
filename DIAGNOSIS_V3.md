# Diagnostic Report V3: ERR_NAME_NOT_RESOLVED - Comprehensive Root Cause Analysis

**Date:** 2026-01-05  
**Status:** Phase 1 - Complete Problem Scope  
**Mode:** Strict Diagnostic Protocol

---

## Executive Summary

The health check is now correctly detecting DNS failures and showing appropriate error messages. However, the **underlying DNS error (`ERR_NAME_NOT_RESOLVED`) persists**, indicating a configuration or infrastructure issue that must be resolved at the source.

**Current State:**
- ✅ Health check correctly returns `healthy: false` when DNS fails
- ✅ Error message is displayed to user
- ❌ DNS resolution still failing (`ERR_NAME_NOT_RESOLVED`)
- ❌ Edge functions cannot be reached

---

## Complete Problem Scope

### Observed Behavior

**Browser Network Tab:**
```
ojtfnhzqhfsprebvpmvx.supabase.co/functions/v1/scan-domain:1 
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
```

**UI Display:**
- Red error box: "Scanner Service Unavailable"
- Error message: "Edge function not accessible. This usually means:
  1. The edge function is not deployed (check Supabase dashboard)
  2. VITE_SUPABASE_URL is incorrect (should be: https://ojtfnhzqhfsprebvpmvx.supabase.co)
  3. Network connectivity issues"

**Console Logs:**
- `[scannerApi] [DIAGNOSTIC] VITE_SUPABASE_URL set: true/false` (needs verification)
- `[scannerApi] FunctionsFetchError detected - defaulting to unhealthy (fail-safe)`

---

## All Possible Root Causes (Comprehensive List)

### Root Cause 1: Environment Variable Not Set in Vercel Dashboard

**Likelihood:** HIGH  
**Impact:** CRITICAL

**Why This Happens:**
1. Vite embeds environment variables at **BUILD TIME**
2. If `VITE_SUPABASE_URL` is not set in Vercel Dashboard → variable is `undefined` in built bundle
3. Supabase client receives `undefined` as URL
4. Browser tries to resolve `undefined/functions/v1/scan-domain` → DNS failure

**Verification Steps:**
- Check Vercel Dashboard → Project Settings → Environment Variables
- Verify `VITE_SUPABASE_URL` exists and has correct value
- Check if variable is set for correct environment (Production/Preview/Development)
- Check Vercel build logs for env var warnings

**Prevention:**
- Build-time validation that fails build if env vars missing
- Runtime validation with clear error messages
- Documentation requiring env vars before first deployment

---

### Root Cause 2: Environment Variable Set for Wrong Environment

**Likelihood:** MEDIUM  
**Impact:** HIGH

**Why This Happens:**
- Vercel has separate env vars for Production, Preview, and Development
- Variable might be set only for Production but user is on Preview
- Or vice versa

**Verification Steps:**
- Check Vercel Dashboard → Environment Variables
- Verify variable is set for ALL environments (Production, Preview, Development)
- Check which environment the current deployment is using

**Prevention:**
- Documentation requiring env vars for all environments
- Build-time check that warns if env vars missing for current environment

---

### Root Cause 3: Environment Variable Format Issues

**Likelihood:** MEDIUM  
**Impact:** HIGH

**Possible Format Issues:**
1. **Trailing slash:** `https://ojtfnhzqhfsprebvpmvx.supabase.co/` (should not have trailing slash)
2. **Missing protocol:** `ojtfnhzqhfsprebvpmvx.supabase.co` (missing `https://`)
3. **Extra whitespace:** ` https://ojtfnhzqhfsprebvpmvx.supabase.co ` (leading/trailing spaces)
4. **Wrong project ID:** `https://wrong-project-id.supabase.co`
5. **Malformed URL:** `https://ojtfnhzqhfsprebvpmvx.supabase.co/some-path` (should not have path)

**Why This Happens:**
- Copy-paste errors
- Manual entry mistakes
- URL normalization not applied

**Verification Steps:**
- Check actual value in Vercel Dashboard (without exposing in logs)
- Check diagnostic logs for actual URL being used
- Test URL format validation

**Prevention:**
- Automatic URL normalization (remove trailing slash, trim whitespace, ensure https://)
- URL format validation with clear error messages
- Build-time URL validation

---

### Root Cause 4: Supabase Project Doesn't Exist or Was Deleted

**Likelihood:** LOW  
**Impact:** CRITICAL

**Why This Happens:**
- Supabase project was deleted
- Project ID changed
- Project was paused/suspended
- Project moved to different region

**Verification Steps:**
- Test DNS resolution: `nslookup ojtfnhzqhfsprebvpmvx.supabase.co`
- Try accessing `https://ojtfnhzqhfsprebvpmvx.supabase.co` directly in browser
- Check Supabase Dashboard for project status
- Verify project ID is correct

**Prevention:**
- Health check that validates project exists
- Better error messages distinguishing DNS failure from project deletion
- Documentation on how to verify project status

---

### Root Cause 5: Build-Time vs Runtime Environment Variable Mismatch

**Likelihood:** MEDIUM  
**Impact:** HIGH

**Why This Happens:**
1. Build happens BEFORE env vars are set in Vercel
2. Built bundle has `undefined` for env vars
3. Even if env vars are added later, bundle still has `undefined`
4. Requires rebuild after adding env vars

**Verification Steps:**
- Check Vercel build logs timestamp vs env var creation timestamp
- Check if rebuild happened after env vars were added
- Inspect built bundle for env var values (if possible)

**Prevention:**
- Documentation requiring env vars BEFORE first build
- Build-time validation that fails if env vars missing
- Clear error message if env vars missing at build time

---

### Root Cause 6: Vercel Build Cache Issues

**Likelihood:** LOW  
**Impact:** MEDIUM

**Why This Happens:**
- Vercel caches build artifacts
- Old build might have cached env vars from previous deployment
- New env vars not picked up due to cache

**Verification Steps:**
- Clear Vercel build cache
- Force rebuild
- Check if issue persists

**Prevention:**
- Documentation on clearing build cache
- Build-time validation that doesn't rely on cache

---

### Root Cause 7: Browser Cache Issues

**Likelihood:** LOW  
**Impact:** LOW (affects user experience, not root cause)

**Why This Happens:**
- Browser cached old bundle with `undefined` env vars
- Even after fix, browser uses cached code

**Verification Steps:**
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Clear browser cache
- Test in incognito/private window

**Prevention:**
- Proper cache headers in Vercel config
- Versioned assets
- Documentation on clearing browser cache

---

### Root Cause 8: Network/DNS Issues

**Likelihood:** VERY LOW  
**Impact:** MEDIUM

**Why This Happens:**
- ISP DNS issues
- Network firewall blocking Supabase domains
- Corporate network restrictions
- DNS propagation delays

**Verification Steps:**
- Test from different network
- Test DNS resolution from command line
- Check if other Supabase projects resolve

**Prevention:**
- Better error messages distinguishing network issues
- Retry mechanisms
- Fallback DNS servers

---

### Root Cause 9: Vercel Environment Variable Encryption/Encoding Issues

**Likelihood:** VERY LOW  
**Impact:** MEDIUM

**Why This Happens:**
- Vercel encrypts env vars
- Special characters in URL might be encoded incorrectly
- URL might be double-encoded

**Verification Steps:**
- Check if URL has any special characters
- Verify URL encoding in Vercel Dashboard
- Check diagnostic logs for actual URL value

**Prevention:**
- URL normalization that handles encoding
- Validation that rejects invalid characters

---

### Root Cause 10: Multiple Deployments with Different Configurations

**Likelihood:** LOW  
**Impact:** MEDIUM

**Why This Happens:**
- Multiple Vercel projects pointing to same repo
- Different env vars in different projects
- User accessing wrong deployment

**Verification Steps:**
- Check which Vercel project is being accessed
- Verify env vars are set in correct project
- Check deployment URL matches expected project

**Prevention:**
- Clear documentation on which project to use
- Environment-specific configuration
- Build-time validation that logs which project is being built

---

## Architecture Call Graph

```
User Opens Scanner Page
  ├─> ScannerInput.tsx mounts
  │   └─> useEffect calls checkHealth()
  │       └─> checkEdgeFunctionHealth()
  │           ├─> Reads import.meta.env.VITE_SUPABASE_URL
  │           │   └─> ❌ If undefined → validation fails
  │           │   └─> ❌ If wrong format → validation fails
  │           │   └─> ✅ If set → continues
  │           │
  │           ├─> Creates Supabase client (if not exists)
  │           │   └─> validateSupabaseConfig()
  │           │       └─> Checks VITE_SUPABASE_URL format
  │           │           └─> ❌ If invalid → throws error
  │           │           └─> ✅ If valid → returns config
  │           │
  │           └─> supabase.functions.invoke('scan-domain')
  │               └─> Constructs URL: ${VITE_SUPABASE_URL}/functions/v1/scan-domain
  │                   └─> ❌ If URL is undefined → "undefined/functions/v1/scan-domain"
  │                   └─> ❌ If URL is wrong → DNS resolution fails
  │                   └─> ❌ Browser: ERR_NAME_NOT_RESOLVED
  │                   └─> ✅ Supabase returns FunctionsFetchError
  │                       └─> Health check detects error → returns unhealthy
```

---

## Files Affected

1. **src/integrations/supabase/client.ts**
   - Line 11: `validateSupabaseConfig()` called
   - Line 19: Client created with config.url
   - **Issue:** Validation happens at runtime, but env vars are embedded at build time

2. **src/utils/envValidation.ts**
   - Line 19-53: `validateSupabaseConfig()` function
   - **Issue:** Only validates format, doesn't check if env var exists at build time

3. **src/utils/scannerApi.ts**
   - Line 13: Reads `import.meta.env.VITE_SUPABASE_URL`
   - Line 36: Validates URL format
   - **Issue:** Validation happens after env var is already embedded in bundle

4. **vite.config.ts**
   - **Issue:** No build-time validation for env vars
   - **Issue:** No plugin to fail build if env vars missing

5. **vercel.json**
   - **Issue:** No validation that env vars are set before build

---

## Critical Gaps in Current Implementation

### Gap 1: No Build-Time Validation

**Problem:** Vite embeds env vars at build time. If env var is missing, it becomes `undefined` in the bundle. Current validation only happens at runtime, which is too late.

**Impact:** Build succeeds even if env vars are missing, resulting in broken production app.

**Fix Required:** Add build-time validation plugin or script that fails build if required env vars are missing.

---

### Gap 2: No URL Normalization

**Problem:** URLs might have trailing slashes, extra whitespace, or missing protocol. Current validation only checks format but doesn't normalize.

**Impact:** Even if env var is set, malformed URLs cause DNS failures.

**Fix Required:** Automatic URL normalization (trim, remove trailing slash, ensure https://).

---

### Gap 3: No Environment-Specific Validation

**Problem:** Vercel has separate env vars for Production, Preview, and Development. Current code doesn't check which environment is being built.

**Impact:** Build might succeed with wrong environment's vars, or fail if vars not set for current environment.

**Fix Required:** Environment-aware validation that checks correct env vars for current build environment.

---

### Gap 4: No Diagnostic Tools

**Problem:** When DNS fails, it's hard to determine the root cause. Current diagnostic logging is limited.

**Impact:** Difficult to diagnose whether issue is env var, URL format, or project deletion.

**Fix Required:** Comprehensive diagnostic tool that checks all possible causes and provides actionable feedback.

---

### Gap 5: No Graceful Degradation

**Problem:** If env vars are missing, app might crash or show cryptic errors.

**Impact:** Poor user experience when configuration is wrong.

**Fix Required:** Graceful degradation with clear error messages and recovery steps.

---

## Next Steps

1. **Phase 2:** Root Cause Verification
   - Verify which root cause is actually happening
   - Check Vercel Dashboard for env vars
   - Test DNS resolution
   - Inspect built bundle

2. **Phase 3:** Implementation Plan
   - Build-time validation
   - URL normalization
   - Enhanced diagnostic tools
   - Better error messages
   - Documentation updates

---

**Status:** Phase 1 Complete - Ready for Phase 2 (Root Cause Verification) and Phase 3 (Implementation Plan)
