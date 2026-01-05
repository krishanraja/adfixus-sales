# Diagnostic Report: Multiple GoTrueClient & ERR_NAME_NOT_RESOLVED

**Date:** 2026-01-05  
**Status:** Issues Persist After Initial Fix  
**Mode:** Strict Diagnostic Protocol - Phase 1

---

## Executive Summary

Two critical issues persist despite recent fixes:
1. **Multiple GoTrueClient instances warning** - Still appearing in browser console
2. **ERR_NAME_NOT_RESOLVED** - Edge function calls failing with DNS resolution errors

The previous fixes were incomplete and did not address root causes.

---

## Issue 1: Multiple GoTrueClient Instances

### Observed Behavior
```
index-DoQuwKq4.js:275 Multiple GoTrueClient instances detected in the same browser context. 
It is not an error, but this should be avoided as it may produce undefined behavior when used 
concurrently under the same storage key.
```

### Current Implementation Analysis

**File:** `src/integrations/supabase/client.ts`
- Creates client with `storageKey: 'supabase.auth.token'` (default)
- Has `persistSession: true`, `autoRefreshToken: true`
- **GoTrueClient is initialized** (auth enabled)

**File:** `src/integrations/supabase/scanner-client.ts`
- Creates client with `storageKey: 'scanner_supabase_auth_token'` (custom)
- Has `persistSession: false`, `autoRefreshToken: false`
- **GoTrueClient is STILL initialized** (auth disabled but client still created)

### Root Cause

**The Problem:** Supabase's `createClient()` ALWAYS initializes GoTrueClient internally, regardless of auth settings. The warning is triggered by Supabase's internal global registry that detects multiple GoTrueClient instances in the same browser context, even with different storage keys.

**Why Custom Storage Key Didn't Work:**
- Storage key only affects WHERE auth tokens are stored
- It does NOT prevent GoTrueClient initialization
- Supabase uses a global instance registry that checks by context, not storage key

### Architecture Call Graph

```
App Startup
  ├─> Import src/integrations/supabase/client.ts
  │   └─> createSupabaseClient()
  │       └─> createClient(url, key, { auth: {...} })
  │           └─> [GoTrueClient Instance #1 Created] ⚠️
  │
  └─> Import src/integrations/supabase/scanner-client.ts
      └─> createScannerSupabaseClient()
          └─> createClient(url, key, { auth: { persistSession: false } })
              └─> [GoTrueClient Instance #2 Created] ⚠️
                  └─> Supabase detects multiple instances → WARNING
```

### Files Affected
- `src/integrations/supabase/client.ts` (Line 13-21)
- `src/integrations/supabase/scanner-client.ts` (Line 25-47)

---

## Issue 2: ERR_NAME_NOT_RESOLVED

### Observed Behavior
```
ojtfnhzqhfsprebvpmvx.supabase.co/functions/v1/scan-domain:1 
Failed to load resource: net::ERR_NAME_NOT_RESOLVED

[scannerApi] Edge function is reachable (returned error, but function exists) ❌ WRONG
[ScannerInput] Scanner service is healthy ❌ WRONG
```

**Critical Finding:** The health check is incorrectly reporting "healthy" when DNS resolution fails.

### Current Implementation Analysis

**File:** `src/utils/scannerApi.ts` (Lines 8-87)

**Flawed Logic:**
```typescript
const response = await Promise.race([invokePromise, timeoutPromise]);

if (response.error) {
  // ... checks for DNS errors ...
  // BUT: If error doesn't match patterns, it returns healthy: true
  console.log('[scannerApi] Edge function is reachable (returned error, but function exists)');
  return { healthy: true }; // ❌ WRONG - DNS failure is not "healthy"
}
```

**The Problem:**
1. When DNS fails, `supabase.functions.invoke()` throws/returns an error
2. The error message format may not match the expected patterns
3. Health check incorrectly assumes "any error = function exists"
4. This is a false positive - DNS failure means the function is NOT reachable

### Root Causes for ERR_NAME_NOT_RESOLVED

**Possible Causes (ALL must be investigated):**

1. **Environment Variable Not Set in Deployed Environment**
   - `VITE_SUPABASE_URL` may not be set in production/preview
   - Vite requires `VITE_` prefix and rebuild for env vars
   - Lovable deployment may not include .env file

2. **Incorrect URL Format**
   - URL might be missing protocol (`https://`)
   - URL might have trailing slash
   - URL might be malformed

3. **Domain Doesn't Exist**
   - `ojtfnhzqhfsprebvpmvx.supabase.co` might not be valid
   - Project might have been deleted/moved
   - DNS records might not be configured

4. **Build-Time vs Runtime Environment Variables**
   - Vite env vars are embedded at BUILD time
   - If .env is missing during build, vars are undefined
   - Runtime checks won't catch build-time issues

5. **Network/DNS Issues**
   - Browser DNS cache corrupted
   - Network firewall blocking Supabase domains
   - ISP DNS issues

6. **Supabase Client URL Resolution**
   - Client might be using wrong URL internally
   - Client might not be reading env var correctly
   - Client might have cached invalid URL

### Architecture Call Graph

```
User Action: Start Scan
  ├─> ScannerInput.tsx: handleStartScan()
  │   └─> useDomainScan.startScan()
  │       └─> scannerApi.createScan()
  │           └─> supabase.functions.invoke('scan-domain')
  │               └─> [Internal] Constructs URL from client config
  │                   └─> URL: import.meta.env.VITE_SUPABASE_URL + '/functions/v1/scan-domain'
  │                       └─> ❌ If VITE_SUPABASE_URL is undefined → Invalid URL
  │                       └─> ❌ If URL is wrong → DNS resolution fails
  │                       └─> ❌ Browser: ERR_NAME_NOT_RESOLVED
```

### Files Affected
- `src/integrations/supabase/client.ts` (Line 11 - env var validation)
- `src/utils/scannerApi.ts` (Line 8-87 - health check logic)
- `src/utils/scannerApi.ts` (Line 89-157 - createScan function)
- Build configuration (Vite env var handling)

---

## Additional Findings

### 1. Health Check Logic Flaw
The health check incorrectly treats DNS failures as "function exists but returned error". This is fundamentally wrong - if DNS fails, the function is NOT reachable.

### 2. No Runtime URL Validation
The Supabase client is created with potentially undefined URL, but there's no runtime check that the URL is actually valid before making requests.

### 3. Environment Variable Build-Time Dependency
Vite environment variables are embedded at build time. If the build happens without proper .env, the variables will be undefined in the deployed bundle.

### 4. No Diagnostic Logging
Missing logs that would show:
- What URL is actually being used
- What the environment variables are at runtime
- What the Supabase client's internal URL is

---

## Verification Checklist

### For GoTrueClient Issue:
- [ ] Check if Supabase v2.57.4 supports disabling GoTrueClient completely
- [ ] Verify if there's a way to create client without auth module
- [ ] Check Supabase source code for instance detection mechanism
- [ ] Test if using same storage key but different URLs prevents warning

### For ERR_NAME_NOT_RESOLVED:
- [ ] Verify VITE_SUPABASE_URL is set in deployed environment
- [ ] Check browser Network tab for actual URL being requested
- [ ] Verify domain `ojtfnhzqhfsprebvpmvx.supabase.co` exists and resolves
- [ ] Check if build process includes .env file
- [ ] Add runtime logging to show actual URL being used
- [ ] Test with hardcoded URL to isolate env var issue

---

## Next Steps (Phase 2: Root Cause Investigation)

1. **Add Diagnostic Logging**
   - Log actual URL being used by Supabase client
   - Log environment variables at runtime
   - Log Supabase client configuration

2. **Test URL Resolution**
   - Manually test if domain resolves (nslookup/dig)
   - Test direct fetch to edge function URL
   - Verify Supabase project exists

3. **Investigate GoTrueClient**
   - Research Supabase API for disabling GoTrueClient
   - Check if we can use a different client creation method
   - Consider if we actually need two separate clients

4. **Fix Health Check Logic**
   - Properly detect DNS failures
   - Distinguish between "function doesn't exist" and "DNS failure"
   - Return accurate health status

---

## Files to Investigate Further

1. `src/integrations/supabase/client.ts` - Main client initialization
2. `src/integrations/supabase/scanner-client.ts` - Scanner client initialization  
3. `src/utils/scannerApi.ts` - Health check and API calls
4. `src/utils/envValidation.ts` - Environment validation
5. Build configuration (Vite config, deployment config)
6. `.env` file (if exists, check contents)
7. Supabase project settings (verify project ID and URL)

---

## Critical Questions to Answer

1. **Is VITE_SUPABASE_URL actually set in the deployed environment?**
2. **Does the domain `ojtfnhzqhfsprebvpmvx.supabase.co` actually exist?**
3. **Can we completely disable GoTrueClient for the scanner client?**
4. **What is the actual URL being used when the error occurs?**
5. **Is the build process including environment variables correctly?**

---

**Status:** Phase 1 Complete - Ready for Phase 2 (Root Cause Investigation)
