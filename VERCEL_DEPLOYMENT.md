# Vercel Deployment Guide

This guide covers deploying the AdFixus Revenue Intelligence Platform to Vercel.

---

## Prerequisites

1. Vercel account (sign up at [vercel.com](https://vercel.com))
2. GitHub repository connected to Vercel
3. Supabase project with edge functions deployed
4. Environment variables ready

---

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration

### 2. Configure Build Settings

Vercel should auto-detect these from `vercel.json`:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

If not auto-detected, manually set:
- Root Directory: `.` (project root)
- Build Command: `npm run build`
- Output Directory: `dist`

### 3. Set Environment Variables

**Critical:** Set these in Vercel Dashboard **BEFORE** first deployment:

1. Go to Project Settings → Environment Variables
2. Add the following variables:

**Required:**
```
VITE_SUPABASE_URL=https://ojtfnhzqhfsprebvpmvx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Important Format Requirements:**
- URL must NOT have trailing slash
- URL must use `https://` protocol
- URL format: `https://[project-id].supabase.co`
- No extra whitespace

**Optional:**
```
VITE_MEETING_BOOKING_URL=https://outlook.office.com/book/SalesTeambooking@adfixus.com
```

3. **Critical:** Set for ALL environments:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
   
   (Click each environment checkbox when adding variable)

4. Click "Save" after adding each variable

**Note:** Build will fail if required env vars are missing (prevents broken deployments)

### 4. Deploy

1. Click "Deploy" button
2. Wait for build to complete (usually 1-2 minutes)
3. Vercel will provide a deployment URL

### 5. Verify Deployment

1. Open the deployment URL
2. Check browser console for errors
3. Look for `[DIAGNOSTIC]` logs showing environment variables
4. Test scanner functionality

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Main Supabase project URL | `https://ojtfnhzqhfsprebvpmvx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | `eyJhbGci...` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_MEETING_BOOKING_URL` | Meeting booking link for PDFs | `https://outlook.office.com/book/...` |

### Setting Variables in Vercel

1. **Via Dashboard:**
   - Project Settings → Environment Variables
   - Add variable → Enter name and value
   - Select environments (Production, Preview, Development)
   - Save

2. **Via CLI:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
   ```

---

## Continuous Deployment

Vercel automatically deploys on:
- Push to `main` branch → Production
- Push to other branches → Preview deployment
- Pull requests → Preview deployment

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## Pre-Deployment Checklist

**Before deploying, verify:**

- [ ] **Environment Variables Set:**
  - [ ] `VITE_SUPABASE_URL` is set in Vercel Dashboard
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set in Vercel Dashboard
  - [ ] Variables are set for Production, Preview, AND Development
  - [ ] URL format is correct (no trailing slash, https://, correct project ID)

- [ ] **Supabase Project Verified:**
  - [ ] Project `ojtfnhzqhfsprebvpmvx` exists in Supabase Dashboard
  - [ ] Project status is "Active"
  - [ ] Edge functions are deployed (check Supabase Dashboard → Edge Functions)

- [ ] **Build Validation:**
  - [ ] Build will fail if env vars missing (automatic validation)
  - [ ] Build logs show: `[build] Environment variables validated successfully`

---

## Troubleshooting

### Build Fails with "Missing required environment variables"

**Cause:** Required env vars not set in Vercel Dashboard

**Solution:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Set for all environments (Production, Preview, Development)
4. Trigger new deployment

**Prevention:** Always set env vars before first deployment

---

### Build Fails with "Invalid VITE_SUPABASE_URL format"

**Cause:** URL format is incorrect

**Solution:**
1. Check URL format in Vercel Dashboard
2. Must be: `https://ojtfnhzqhfsprebvpmvx.supabase.co`
3. Must NOT have trailing slash
4. Must use `https://` (not `http://`)
5. Fix in Vercel Dashboard and redeploy

**Note:** URL is automatically normalized at runtime, but fix in Vercel for consistency

---

### ERR_NAME_NOT_RESOLVED After Deployment

**Symptoms:**
- Scanner shows "Scanner Service Unavailable"
- Browser console shows DNS resolution failure
- Network tab shows `ERR_NAME_NOT_RESOLVED`

**All Possible Causes & Solutions:**

#### Cause 1: Environment Variable Not Set (MOST COMMON)

**Check:**
- Browser console: `[DIAGNOSTIC] VITE_SUPABASE_URL set: false`
- Vercel Dashboard → Environment Variables

**Solution:**
1. Add `VITE_SUPABASE_URL` in Vercel Dashboard
2. Set for ALL environments
3. Trigger new deployment
4. Use "Check Configuration" button in scanner UI to verify

---

#### Cause 2: Environment Variable Set for Wrong Environment

**Check:**
- Which environment is your deployment using? (Production/Preview)
- Are env vars set for that specific environment?

**Solution:**
1. Go to Vercel Dashboard → Environment Variables
2. Edit each variable
3. Check ALL three environments: Production, Preview, Development
4. Save and redeploy

---

#### Cause 3: Build Happened Before Env Vars Were Set

**Check:**
- When were env vars added vs when was build completed?
- Build logs show env var validation?

**Solution:**
1. Go to Vercel Dashboard → Deployments
2. Click "Redeploy" on latest deployment
3. Or push new commit to trigger rebuild
4. Build will now include env vars

---

#### Cause 4: URL Format Issues

**Check:**
- Browser console for normalization warnings
- Use "Check Configuration" button to see normalized URL

**Solution:**
1. Fix URL in Vercel Dashboard:
   - Remove trailing slash if present
   - Ensure `https://` protocol
   - Remove any extra whitespace
2. Redeploy after fixing

---

#### Cause 5: Supabase Project Doesn't Exist

**Check:**
- Use "Check Configuration" button - shows DNS resolution status
- Test URL directly: `https://ojtfnhzqhfsprebvpmvx.supabase.co`

**Solution:**
1. Go to Supabase Dashboard
2. Verify project exists and is active
3. If deleted, create new project and update URL in Vercel

---

#### Cause 6: Edge Function Not Deployed

**Check:**
- Supabase Dashboard → Edge Functions
- Function `scan-domain` exists and is deployed

**Solution:**
1. Deploy edge function in Supabase Dashboard
2. Check function logs for errors
3. Verify function is accessible

---

### Using the Diagnostic Tool

The scanner UI includes comprehensive diagnostics:

1. **When service is unavailable**, click "Check Configuration" button
2. **Review diagnostic results:**
   - Environment variable status
   - URL format validation
   - DNS resolution
   - URL accessibility
   - Specific recommendations
3. **Follow recommendations** to fix the issue
4. **Click "Retry Connection"** after fixing

**Diagnostic checks all root causes automatically and provides actionable feedback.**

---

### Multiple GoTrueClient Warning

**Solution:**
- This warning is minimized with isolated storage
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache
- Warning is mostly harmless but indicates both clients are active

**Note:** This is a known limitation when using two Supabase clients. Functionality is not affected.

---

## Monitoring

### Vercel Analytics

- View deployment logs in Vercel Dashboard
- Check function logs for edge function calls
- Monitor build times and errors

### Browser Console

Look for diagnostic logs:
- `[DIAGNOSTIC]` - Environment variable status
- `[scannerApi]` - API call logs
- `[supabase/client]` - Client initialization

---

## Rollback

If deployment has issues:

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## Best Practices

1. **Always set environment variables before first deployment**
2. **Test preview deployments before promoting to production**
3. **Monitor build logs for warnings**
4. **Keep environment variables in sync across environments**
5. **Use Vercel's environment variable encryption**

---

## Support

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **Project Issues:** Check browser console and Vercel build logs

---

**Last Updated:** 2026-01-05
