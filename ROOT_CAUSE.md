# Root Cause Analysis: Multiple GoTrueClient & ERR_NAME_NOT_RESOLVED

**Date:** 2026-01-05  
**Status:** Phase 2 - Root Cause Investigation  
**Based on:** DIAGNOSIS.md findings

---

## Issue 1: Multiple GoTrueClient Instances - Root Cause

### Primary Root Cause

**Supabase's `createClient()` ALWAYS initializes GoTrueClient**, regardless of auth configuration. The warning is triggered by Supabase's internal global instance registry that detects multiple GoTrueClient instances in the same browser context.

### Technical Details

1. **GoTrueClient Initialization:**
   - When `createClient()` is called, it internally creates a GoTrueClient instance
   - This happens even if `persistSession: false` and `autoRefreshToken: false`
   - The auth module is always loaded, even if not actively used

2. **Instance Detection:**
   - Supabase uses a global registry (likely `window.__SUPABASE_CLIENTS__` or similar)
   - It checks for multiple instances by URL + storage key combination
   - Even with different storage keys, if both use the same browser context, warning appears

3. **Why Custom Storage Key Failed:**
   - Storage key only affects WHERE tokens are stored (localStorage key)
   - It does NOT prevent GoTrueClient initialization
   - It does NOT prevent instance detection

### Solution Approaches

**Option 1: Completely Disable Auth for Scanner Client (RECOMMENDED)**
- Use Supabase client without auth module
- May require using a different client creation method
- Or use a "read-only" client configuration

**Option 2: Use Single Client with Different Contexts**
- Create one client and use it for both purposes
- Use different storage keys for different operations
- Not ideal - violates separation of concerns

**Option 3: Lazy Load Scanner Client**
- Only create scanner client when needed
- Destroy it after use
- Complex and may cause other issues

**Option 4: Suppress Warning (NOT RECOMMENDED)**
- Ignore the warning
- Risk of undefined behavior
- Not a real fix

### Recommended Fix

**Completely disable GoTrueClient for scanner client** by:
1. Using a client configuration that doesn't initialize auth
2. Or using a different Supabase client creation method
3. Or checking if Supabase v2.57.4 has an option to disable auth module entirely

---

## Issue 2: ERR_NAME_NOT_RESOLVED - Root Cause Analysis

### Primary Root Causes (Multiple Possible)

#### Root Cause 1: Environment Variable Not Set in Deployment (MOST LIKELY)

**Evidence:**
- Error occurs in deployed/preview environment
- Health check incorrectly reports "healthy" (suggests env var might be undefined)
- Vite requires `VITE_` prefix and rebuild for env vars

**Why This Happens:**
1. Vite embeds environment variables at BUILD time
2. If `.env` file is missing during build, variables are `undefined`
3. Deployed bundle has `undefined` for `VITE_SUPABASE_URL`
4. Supabase client tries to use `undefined` as URL
5. Browser attempts to resolve `undefined/functions/v1/scan-domain` → DNS failure

**Verification:**
- Check if `.env` file exists in deployment
- Check if Lovable deployment process includes `.env`
- Check browser console for actual URL being used
- Check Network tab for failed request URL

#### Root Cause 2: Incorrect URL Format

**Evidence:**
- URL might be missing `https://` protocol
- URL might have trailing slash
- URL might be malformed

**Why This Happens:**
- Environment variable might be set incorrectly
- Build process might modify the URL
- Copy-paste error in configuration

**Verification:**
- Log actual URL at runtime
- Check `.env` file format
- Verify URL format matches Supabase requirements

#### Root Cause 3: Domain Doesn't Exist or DNS Issue

**Evidence:**
- `ojtfnhzqhfsprebvpmvx.supabase.co` might not resolve
- Project might have been deleted/moved
- DNS records might not be configured

**Why This Happens:**
- Supabase project might have been deleted
- Project ID might be incorrect
- DNS propagation issues

**Verification:**
- Test domain resolution: `nslookup ojtfnhzqhfsprebvpmvx.supabase.co`
- Try accessing `https://ojtfnhzqhfsprebvpmvx.supabase.co` directly
- Check Supabase dashboard for project status

#### Root Cause 4: Health Check Logic Flaw (SECONDARY ISSUE)

**Evidence:**
- Health check reports "healthy" when DNS fails
- Log shows: "Edge function is reachable (returned error, but function exists)"

**Why This Happens:**
- Health check logic incorrectly assumes "any error = function exists"
- DNS failures are not properly detected
- Error message format might not match expected patterns

**Impact:**
- User sees "healthy" status but scans fail
- Misleading error messages
- Difficult to diagnose actual issue

### Solution Approaches

**For Root Cause 1 (Env Var Not Set):**
1. Ensure `.env` file is included in deployment
2. Configure Lovable to include environment variables
3. Add build-time validation to fail if env vars missing
4. Add runtime fallback with clear error message

**For Root Cause 2 (URL Format):**
1. Add URL format validation
2. Normalize URL (remove trailing slashes, ensure https://)
3. Log actual URL being used for debugging

**For Root Cause 3 (Domain Issue):**
1. Verify Supabase project exists
2. Verify project ID is correct
3. Test domain resolution
4. Check Supabase dashboard

**For Root Cause 4 (Health Check):**
1. Fix health check logic to properly detect DNS failures
2. Distinguish between "function doesn't exist" and "DNS failure"
3. Return accurate health status
4. Add better error detection patterns

---

## Critical Findings

### Finding 1: Health Check Returns False Positive

The health check is fundamentally flawed:
```typescript
// Current (WRONG):
if (response.error) {
  // Check for DNS errors...
  // If not DNS error, assume function exists
  return { healthy: true }; // ❌ WRONG
}
```

**Problem:** Any error that doesn't match DNS patterns is treated as "function exists". This is incorrect - if we can't reach the function, it's not healthy.

**Fix Required:** Health check must properly detect DNS failures and return `healthy: false` in those cases.

### Finding 2: No Runtime URL Validation

The Supabase client is created with potentially undefined URL, but there's no runtime validation that:
1. The URL is actually set
2. The URL is valid
3. The URL can be resolved

**Fix Required:** Add runtime URL validation and logging.

### Finding 3: Build-Time vs Runtime Environment Variables

Vite environment variables are embedded at BUILD time. This means:
- If `.env` is missing during build → variables are `undefined` in bundle
- Runtime checks won't catch build-time issues
- Need build-time validation

**Fix Required:** Add build-time validation and clear error messages.

---

## Verification Steps

### Step 1: Verify Environment Variables
```bash
# Check if .env exists
ls -la .env

# Check .env contents (without exposing secrets)
grep VITE_SUPABASE_URL .env

# Check if variables are in deployed bundle
# (Inspect built JS files for env var values)
```

### Step 2: Verify Domain Resolution
```bash
# Test DNS resolution
nslookup ojtfnhzqhfsprebvpmvx.supabase.co

# Test HTTP access
curl -I https://ojtfnhzqhfsprebvpmvx.supabase.co

# Test edge function endpoint
curl -I https://ojtfnhzqhfsprebvpmvx.supabase.co/functions/v1/scan-domain
```

### Step 3: Add Diagnostic Logging
```typescript
// Add to client initialization
console.log('[DIAGNOSTIC] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('[DIAGNOSTIC] Supabase client URL:', supabase.supabaseUrl);
console.log('[DIAGNOSTIC] Edge function URL:', `${supabase.supabaseUrl}/functions/v1/scan-domain`);
```

### Step 4: Test with Hardcoded URL
Temporarily hardcode the URL to isolate env var issue:
```typescript
const SUPABASE_URL = 'https://ojtfnhzqhfsprebvpmvx.supabase.co';
// If this works, env var is the issue
// If this fails, domain/network is the issue
```

---

## Recommended Fix Priority

1. **HIGH:** Fix health check logic to properly detect DNS failures
2. **HIGH:** Add runtime URL validation and diagnostic logging
3. **HIGH:** Verify environment variables are set in deployment
4. **MEDIUM:** Fix GoTrueClient multiple instances warning
5. **MEDIUM:** Add build-time environment variable validation
6. **LOW:** Improve error messages and user feedback

---

**Status:** Phase 2 Complete - Ready for Phase 3 (Implementation Plan)
