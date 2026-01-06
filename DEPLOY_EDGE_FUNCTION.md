# Deploy Edge Function - Quick Guide

## Problem
The diagnostic tool shows:
- **Edge Function Deployed:** No
- **CORS Working:** No
- **Error:** "Failed to reach edge function. Check if function is deployed and URL is correct."

## Solution: Deploy the Edge Function

### Option 1: Using Supabase Dashboard (Easiest)

**⚠️ IMPORTANT: Do NOT use SQL Editor! Edge functions are TypeScript code, not SQL.**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select project: `lshyhtgvqdmrakrbcgox`

2. **Navigate to Edge Functions:**
   - In the left sidebar, look for **"Edge Functions"** (NOT "SQL Editor")
   - If you don't see it, it might be under "Project Settings" → "Edge Functions"
   - Click "Create a new function" or "New Function"

3. **Create Function:**
   - Function name: `scan-domain` (exactly this name)
   - **Copy the ENTIRE contents** of `supabase/functions/scan-domain/index.ts`
   - **Paste into the Edge Function editor** (this is a TypeScript/Deno editor, NOT SQL)
   - Click "Deploy" or "Save"

**Common Mistake:**
- ❌ Don't paste into SQL Editor (will give syntax error)
- ✅ Use Edge Functions interface (TypeScript editor)

4. **Set Secrets (Required):**
   - Go to Project Settings → Edge Functions → Secrets
   - Add these secrets:
     - `SCANNER_SUPABASE_SERVICE_KEY` - Your service role key from Supabase
     - `BROWSERLESS_API_KEY` - Your Browserless API key
     - `TRANCO_API_KEY` - Your Tranco API key (if you have one)

5. **Verify Deployment:**
   - Go back to Edge Functions → `scan-domain`
   - Check that it shows "Active" status
   - Test the function URL: `https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain`

### Option 2: Using Supabase CLI (Recommended for Development)

1. **Install Supabase CLI:**
   ```bash
   # Windows (using Scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   
   # Or using npm
   npm install -g supabase
   
   # Or download from: https://github.com/supabase/cli/releases
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link to Your Project:**
   ```bash
   supabase link --project-ref lshyhtgvqdmrakrbcgox
   ```

4. **Deploy the Function:**
   ```bash
   supabase functions deploy scan-domain
   ```

5. **Set Secrets:**
   ```bash
   supabase secrets set SCANNER_SUPABASE_SERVICE_KEY=your-service-key
   supabase secrets set BROWSERLESS_API_KEY=your-browserless-key
   supabase secrets set TRANCO_API_KEY=your-tranco-key
   ```

### Verify Deployment

After deploying, test the function:

```bash
# Test OPTIONS request (CORS preflight)
curl -X OPTIONS https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain \
  -H "Origin: https://adfixus-sales.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Expected Response:**
- Status: `200 OK`
- Headers include: `Access-Control-Allow-Origin: *`

### Check Function Logs

1. Go to Supabase Dashboard → Edge Functions → `scan-domain` → Logs
2. Look for "Handling CORS preflight" when OPTIONS request is made
3. Check for any error messages

### After Deployment

1. Go back to your app
2. Click "Retry Connection" button
3. The diagnostic should now show:
   - **Edge Function Deployed:** Yes
   - **CORS Working:** Yes

---

## Important Notes

- **No SQL queries needed** - Edge functions are deployed separately from the database
- **Secrets are required** - The function needs API keys to work properly
- **CORS is configured** - The function already has CORS headers in the code
- **Function exists** - The code is in `supabase/functions/scan-domain/index.ts`

## Troubleshooting

**If deployment fails:**
- Check Supabase Dashboard → Edge Functions → Logs for errors
- Verify all secrets are set correctly
- Ensure function name matches exactly: `scan-domain`

**If CORS still fails after deployment:**
- Check function logs for OPTIONS requests
- Verify function returns status 200 for OPTIONS
- Check that CORS headers are present in response
