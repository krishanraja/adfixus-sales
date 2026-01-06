# Implementation Plan: Fix Domain Scanning (Complete Architecture Fix)

**Date:** 2026-01-06  
**Status:** Ready for Implementation  
**Root Cause:** Edge function not deployed to user's Supabase project; config pointing to wrong project

---

## Problem Summary

Scans complete but show "No Results Found" because:

1. **supabase/config.toml** points to project `ojtfnhzqhfsprebvpmvx` (inaccessible)
2. **Edge function not deployed** to user's project `lshyhtgvqdmrakrbcgox`
3. **Documentation references wrong project** throughout the codebase

The edge function code EXISTS in the repository but was never deployed to the correct project.

---

## Implementation Steps

### Phase 1: Configuration Fixes (Before Deployment)

#### Step 1.1: Update supabase/config.toml
**File:** `supabase/config.toml`

**Change:**
```toml
# FROM:
project_id = "ojtfnhzqhfsprebvpmvx"

# TO:
project_id = "lshyhtgvqdmrakrbcgox"
```

#### Step 1.2: Update Documentation References
**Files to update:**
- `HANDOFF.md` - Multiple references to old project
- `ARCHITECTURE.md` - References to old project
- `DEPLOY_INSTRUCTIONS.md` - If it exists

**Changes:**
- Replace all `ojtfnhzqhfsprebvpmvx` with `lshyhtgvqdmrakrbcgox`
- Update architecture diagrams to show SINGLE project (not two)
- Clarify that edge functions AND database are on the SAME project

---

### Phase 2: Deploy Edge Functions

#### Step 2.1: Link Supabase CLI to Correct Project
```powershell
# Navigate to project root
cd C:\Users\krish\OneDrive\Documents\AdFixus\adfixus-sales

# Link to YOUR project
supabase link --project-ref lshyhtgvqdmrakrbcgox
```

#### Step 2.2: Deploy scan-domain Function
```powershell
supabase functions deploy scan-domain --no-verify-jwt
```

#### Step 2.3: Deploy Other Functions (if needed)
```powershell
supabase functions deploy generate-insights --no-verify-jwt
supabase functions deploy send-pdf-email --no-verify-jwt
```

---

### Phase 3: Set Required Secrets

#### Step 3.1: Get Service Role Key
1. Go to Supabase Dashboard → lshyhtgvqdmrakrbcgox
2. Settings → API → Service Role Key (NOT anon key)
3. Copy the key

#### Step 3.2: Set Secrets via CLI
```powershell
# Set the service key (allows edge function to write to database)
supabase secrets set SCANNER_SUPABASE_SERVICE_KEY=your-service-role-key-here

# Set Browserless API key (for headless Chrome scanning)
supabase secrets set BROWSERLESS_API_KEY=your-browserless-api-key

# Set OpenAI API key (for AI insights)
supabase secrets set OPENAI_API_KEY=your-openai-api-key

# Set Tranco API key (optional, for traffic ranking)
supabase secrets set TRANCO_API_KEY=your-tranco-api-key
```

**IMPORTANT:** Get these API keys:
- **Browserless:** https://www.browserless.io/ - Sign up for free tier
- **OpenAI:** https://platform.openai.com/api-keys
- **Tranco:** Optional, no auth needed for basic use

---

### Phase 4: Verify Database Tables Exist

#### Step 4.1: Check Tables
In Supabase Dashboard → lshyhtgvqdmrakrbcgox → Database → Tables, verify these exist:

- `domain_scans`
- `domain_results`

If they don't exist, they need to be created with the proper schema.

#### Step 4.2: Check RLS Policies
Ensure:
- Service role can INSERT/UPDATE on both tables
- Anon key can SELECT (for frontend reads)
- Realtime is enabled (for live updates)

---

### Phase 5: Update Frontend Environment

#### Step 5.1: Verify Vercel Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://lshyhtgvqdmrakrbcgox.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHlodGd2cWRtcmFrcmJjZ294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODY5NDEsImV4cCI6MjA4MzE2Mjk0MX0.ltwoNJ4MitSMmjL1mKhKPlAOtLv-63naF3qTqJES_CI
```

Ensure set for: Production, Preview, AND Development

#### Step 5.2: Trigger Vercel Rebuild
After updating env vars, trigger a new deployment in Vercel.

---

### Phase 6: Verification Tests

#### Step 6.1: Test Edge Function Endpoint
```powershell
# Test CORS (OPTIONS request)
curl -X OPTIONS "https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain" `
  -H "Origin: https://your-vercel-url.vercel.app" `
  -H "Access-Control-Request-Method: POST" `
  -v

# Expected: HTTP 200 with CORS headers
```

#### Step 6.2: Test Health Check
```powershell
curl -X POST "https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHlodGd2cWRtcmFrcmJjZ294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODY5NDEsImV4cCI6MjA4MzE2Mjk0MX0.ltwoNJ4MitSMmjL1mKhKPlAOtLv-63naF3qTqJES_CI" `
  -d '{"healthCheck": true}'

# Expected: {"status":"healthy","message":"Edge function is operational"}
```

#### Step 6.3: Test Actual Scan
1. Go to your app
2. Login to scanner
3. Enter a single test domain: `google.com`
4. Start scan
5. Check edge function logs in Supabase Dashboard
6. Verify results appear

---

## Checkpoint Summary

| Checkpoint | Action | Expected Outcome | Verification |
|------------|--------|------------------|--------------|
| CP0 | Config updated | config.toml has correct project_id | Read file |
| CP1 | CLI linked | `supabase link` succeeds | Terminal output |
| CP2 | Functions deployed | `supabase functions deploy` succeeds | Terminal output + Dashboard |
| CP3 | Secrets set | `supabase secrets set` succeeds | Dashboard → Secrets |
| CP4 | CORS works | OPTIONS returns 200 | curl test |
| CP5 | Health check works | Health check returns healthy | curl test |
| CP6 | Scan works | Results appear in UI | End-to-end test |

---

## Files Being Modified

1. **supabase/config.toml** - Change project_id
2. **HANDOFF.md** - Update project references
3. **ARCHITECTURE.md** - Update project references (optional)
4. **No code changes needed** - Edge function code is already correct

---

## Secrets Required

| Secret Name | Source | Purpose |
|-------------|--------|---------|
| SCANNER_SUPABASE_SERVICE_KEY | Supabase Dashboard → Settings → API | Allows edge function to write to DB |
| BROWSERLESS_API_KEY | browserless.io account | Headless Chrome scanning |
| OPENAI_API_KEY | OpenAI Platform | AI insights generation |
| TRANCO_API_KEY | Optional | Traffic ranking (works without auth) |

---

## Post-Implementation

After successful implementation:

1. **Update DIAGNOSIS_V5.md** with resolution
2. **Update CHANGELOG.md** with fix description
3. **Remove outdated deployment docs** that reference wrong project
4. **Test with multiple domain types** (http, https, www, plain)

---

## Rollback Plan

If deployment fails:
1. Check Supabase Dashboard → Edge Functions → Logs
2. Verify secrets are set correctly
3. Ensure database tables exist with correct schema
4. Check for TypeScript errors in function code

---

**Status:** Ready for implementation upon user approval
