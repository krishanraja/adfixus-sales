# Migration Plan: Lovable → Vercel + Fix Critical Issues

**Date:** 2026-01-05  
**Status:** Phase 3 - Implementation Plan  
**Based on:** DIAGNOSIS.md, ROOT_CAUSE.md

---

## Executive Summary

Migrate deployment from Lovable to Vercel while fixing:
1. Multiple GoTrueClient instances warning
2. ERR_NAME_NOT_RESOLVED errors
3. Environment variable configuration issues
4. Health check logic flaws

---

## Architecture Changes

### Current Architecture (Lovable)
```
Frontend (Lovable) → Supabase Edge Functions (Lovable Cloud) → External Scanner DB
```

### New Architecture (Vercel)
```
Frontend (Vercel) → Supabase Edge Functions (Supabase Cloud) → External Scanner DB
```

**Key Change:** Edge functions remain on Supabase (independent of Lovable), but frontend deploys to Vercel.

---

## Phase 1: Vercel Setup & Configuration

### 1.1 Create Vercel Configuration

**File:** `vercel.json` (NEW)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Purpose:**
- Configure Vercel to build Vite app
- Handle SPA routing with rewrites
- Optimize asset caching

### 1.2 Update Vite Config for Vercel

**File:** `vite.config.ts`

**Changes:**
- Remove Lovable-specific plugins in production
- Ensure build output is compatible with Vercel
- Add base path configuration if needed

### 1.3 Environment Variables Setup

**Vercel Dashboard Configuration:**
- `VITE_SUPABASE_URL` - Set in Vercel dashboard
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Set in Vercel dashboard
- `VITE_MEETING_BOOKING_URL` - Set in Vercel dashboard (optional)

**File:** `.env.example` (UPDATE)
- Document all required variables
- Add Vercel-specific notes

---

## Phase 2: Fix GoTrueClient Multiple Instances

### 2.1 Research Supabase Client Options

**Investigation:**
- Check if Supabase v2.57.4 supports disabling GoTrueClient
- Research alternative client creation methods
- Check Supabase documentation for multi-client scenarios

### 2.2 Implement Fix

**Option A: Disable Auth Module Completely (PREFERRED)**

**File:** `src/integrations/supabase/scanner-client.ts`

```typescript
// Try to create client without auth module
// If Supabase doesn't support this, use Option B
```

**Option B: Use Single Client with Context Switching**

**File:** `src/integrations/supabase/client.ts`

```typescript
// Create single client
// Use different storage keys for different operations
// Not ideal but may be necessary
```

**Option C: Lazy Load Scanner Client**

**File:** `src/integrations/supabase/scanner-client.ts`

```typescript
// Only create scanner client when needed
// Destroy after use
// More complex but avoids instance conflict
```

**Option D: Suppress Warning (LAST RESORT)**

```typescript
// Add console.warn override
// Not recommended - doesn't fix underlying issue
```

### 2.3 Verification

- Test in browser console - no GoTrueClient warning
- Verify both clients work independently
- Test real-time subscriptions still work

---

## Phase 3: Fix ERR_NAME_NOT_RESOLVED

### 3.1 Fix Health Check Logic

**File:** `src/utils/scannerApi.ts`

**Current Problem:**
```typescript
// Health check incorrectly reports "healthy" on DNS failures
if (response.error) {
  // If error doesn't match DNS patterns, assume healthy ❌
  return { healthy: true };
}
```

**Fix:**
```typescript
// Properly detect DNS failures
if (response.error) {
  const errorMsg = response.error.message || '';
  
  // DNS failures = NOT healthy
  if (errorMsg.includes('NAME_NOT_RESOLVED') || 
      errorMsg.includes('ERR_NAME_NOT_RESOLVED') ||
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('NetworkError') ||
      errorMsg === 'TIMEOUT') {
    return { healthy: false, error: 'DNS resolution failed...' };
  }
  
  // Other errors might mean function exists but returned error
  // But we should still check if it's a network error
  // If we can't determine, assume unhealthy
  return { healthy: false, error: errorMsg };
}
```

### 3.2 Add Runtime URL Validation

**File:** `src/integrations/supabase/client.ts`

**Add:**
```typescript
// After client creation, validate URL is accessible
// Log actual URL being used
console.log('[DIAGNOSTIC] Supabase URL:', config.url);
console.log('[DIAGNOSTIC] Edge function URL:', `${config.url}/functions/v1/scan-domain`);
```

### 3.3 Add Diagnostic Logging

**File:** `src/utils/scannerApi.ts`

**Add:**
```typescript
// Log environment variables (without exposing secrets)
console.log('[DIAGNOSTIC] VITE_SUPABASE_URL set:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('[DIAGNOSTIC] VITE_SUPABASE_URL length:', import.meta.env.VITE_SUPABASE_URL?.length);
console.log('[DIAGNOSTIC] Supabase client URL:', supabase.supabaseUrl);
```

### 3.4 Environment Variable Validation

**File:** `src/utils/envValidation.ts`

**Enhance:**
- Add build-time validation (if possible)
- Add runtime URL accessibility check
- Provide clear error messages

---

## Phase 4: Update Edge Function Configuration

### 4.1 Verify Supabase Edge Functions

**Action:**
- Edge functions are on Supabase Cloud (not Lovable)
- Verify they're accessible at: `https://ojtfnhzqhfsprebvpmvx.supabase.co/functions/v1/`
- Ensure secrets are set in Supabase dashboard

### 4.2 Update Documentation

**Files:** `README.md`, `HANDOFF.md`, `ARCHITECTURE.md`

**Changes:**
- Update deployment instructions
- Change references from "Lovable Cloud" to "Supabase Cloud"
- Add Vercel deployment steps
- Update environment variable setup

---

## Phase 5: Testing & Verification

### 5.1 Local Testing

**Checklist:**
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] No console warnings about GoTrueClient
- [ ] Environment variables validated
- [ ] Health check works correctly

### 5.2 Vercel Deployment Testing

**Checklist:**
- [ ] Vercel deployment succeeds
- [ ] Environment variables set in Vercel dashboard
- [ ] App loads correctly
- [ ] Edge functions accessible
- [ ] Scanner works end-to-end
- [ ] No ERR_NAME_NOT_RESOLVED errors
- [ ] No GoTrueClient warnings

### 5.3 Integration Testing

**Checklist:**
- [ ] Scanner can start scans
- [ ] Real-time subscriptions work
- [ ] Results display correctly
- [ ] PDF export works
- [ ] All features functional

---

## Implementation Steps

### Step 1: Create Vercel Configuration
1. Create `vercel.json`
2. Update `vite.config.ts` (remove Lovable-specific in production)
3. Test build locally

### Step 2: Fix GoTrueClient Issue
1. Research Supabase API options
2. Implement chosen solution
3. Test in browser - verify no warning

### Step 3: Fix Health Check Logic
1. Update `checkEdgeFunctionHealth()` function
2. Add proper DNS failure detection
3. Add diagnostic logging
4. Test health check

### Step 4: Add Runtime Validation
1. Add URL validation in client creation
2. Add diagnostic logging
3. Test with missing/invalid env vars

### Step 5: Deploy to Vercel
1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy
4. Verify deployment

### Step 6: Update Documentation
1. Update README.md
2. Update HANDOFF.md
3. Update ARCHITECTURE.md
4. Create VERCEL_DEPLOYMENT.md guide

---

## Files to Modify

### New Files
1. `vercel.json` - Vercel configuration
2. `VERCEL_DEPLOYMENT.md` - Deployment guide

### Modified Files
1. `vite.config.ts` - Remove Lovable-specific config
2. `src/integrations/supabase/scanner-client.ts` - Fix GoTrueClient
3. `src/integrations/supabase/client.ts` - Add validation/logging
4. `src/utils/scannerApi.ts` - Fix health check logic
5. `src/utils/envValidation.ts` - Enhance validation
6. `README.md` - Update deployment instructions
7. `HANDOFF.md` - Update architecture docs
8. `ARCHITECTURE.md` - Update deployment platform
9. `.env.example` - Update with Vercel notes

---

## Checkpoints

### CP0: Plan Approval
- Review migration approach
- Confirm Vercel deployment strategy
- Approve GoTrueClient fix method

### CP1: Vercel Configuration
- `vercel.json` created and tested
- Build succeeds locally
- No build errors

### CP2: GoTrueClient Fix
- No console warnings
- Both clients work independently
- Real-time subscriptions functional

### CP3: Health Check Fix
- Health check correctly detects DNS failures
- Diagnostic logging works
- Error messages are accurate

### CP4: Vercel Deployment
- Deployment succeeds
- Environment variables configured
- App loads correctly

### CP5: Integration Testing
- Scanner works end-to-end
- No ERR_NAME_NOT_RESOLVED errors
- All features functional

---

## Risk Mitigation

### Risk 1: Edge Functions Not Accessible
**Mitigation:**
- Verify Supabase project exists
- Test edge function URLs directly
- Ensure secrets are set in Supabase dashboard

### Risk 2: Environment Variables Not Set
**Mitigation:**
- Clear documentation for Vercel setup
- Validation at runtime with clear errors
- Test deployment with missing vars

### Risk 3: GoTrueClient Fix Doesn't Work
**Mitigation:**
- Research multiple solution approaches
- Have fallback options ready
- Test thoroughly before deployment

### Risk 4: Build Issues on Vercel
**Mitigation:**
- Test build locally first
- Use Vercel's build logs
- Have rollback plan ready

---

## Success Criteria

1. ✅ No GoTrueClient warnings in console
2. ✅ No ERR_NAME_NOT_RESOLVED errors
3. ✅ Health check accurately reports status
4. ✅ Environment variables properly configured
5. ✅ App deployed successfully on Vercel
6. ✅ All features work end-to-end
7. ✅ Documentation updated

---

## Timeline Estimate

- **Phase 1 (Vercel Setup):** 1-2 hours
- **Phase 2 (GoTrueClient Fix):** 2-3 hours
- **Phase 3 (Health Check Fix):** 1-2 hours
- **Phase 4 (Edge Functions):** 1 hour
- **Phase 5 (Testing):** 2-3 hours
- **Total:** 7-11 hours

---

**Status:** Ready for Implementation
