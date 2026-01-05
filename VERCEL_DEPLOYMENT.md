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

**Critical:** Set these in Vercel Dashboard before deploying:

1. Go to Project Settings → Environment Variables
2. Add the following variables:

**Required:**
```
VITE_SUPABASE_URL=https://ojtfnhzqhfsprebvpmvx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Optional:**
```
VITE_MEETING_BOOKING_URL=https://outlook.office.com/book/SalesTeambooking@adfixus.com
```

3. **Important:** Set for all environments (Production, Preview, Development)
4. Click "Save" after adding each variable

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

## Troubleshooting

### Build Fails

**Check:**
1. Build logs in Vercel Dashboard
2. TypeScript errors: `npm run lint`
3. Missing dependencies: `npm install`

### Environment Variables Not Working

**Symptoms:**
- `ERR_NAME_NOT_RESOLVED` errors
- Scanner shows "Service Unavailable"
- Console shows `[DIAGNOSTIC] VITE_SUPABASE_URL set: false`

**Solution:**
1. Verify variables are set in Vercel Dashboard
2. Check variable names match exactly (case-sensitive)
3. Ensure variables are set for correct environment
4. Redeploy after adding variables
5. Check browser console for `[DIAGNOSTIC]` logs

### Edge Functions Not Accessible

**Symptoms:**
- Health check fails
- DNS resolution errors

**Solution:**
1. Verify `VITE_SUPABASE_URL` is correct
2. Check Supabase Dashboard → Edge Functions are deployed
3. Test edge function URL directly: `https://ojtfnhzqhfsprebvpmvx.supabase.co/functions/v1/scan-domain`
4. Check browser console for `[DIAGNOSTIC]` logs showing actual URL

### Multiple GoTrueClient Warning

**Solution:**
- This is now minimized with isolated storage
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache
- Warning is harmless but can be ignored

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
