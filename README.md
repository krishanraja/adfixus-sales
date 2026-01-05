# AdFixus Revenue Intelligence Platform

A dual-purpose React application consisting of:
1. **Identity ROI Calculator** - Helps publishers calculate revenue impact from identity resolution
2. **Domain Scanner** - AI-powered domain analysis revealing hidden revenue opportunities

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Lovable)                        │
│  React + Vite + Tailwind CSS + TypeScript                       │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  ROI Calculator  │  │  Domain Scanner  │                     │
│  │  (standalone)    │  │  (needs backend) │                     │
│  └──────────────────┘  └────────┬─────────┘                     │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  │ supabase.functions.invoke()
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LOVABLE CLOUD (Supabase)                        │
│  Edge Functions: scan-domain, generate-insights, send-pdf-email │
│  Project: ojtfnhzqhfsprebvpmvx                                  │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Service Key Auth
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL SCANNER DATABASE (Supabase)                │
│  Tables: domain_scans, domain_results                           │
│  Project: [SCANNER_SUPABASE_URL]                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Radix UI, Lucide Icons |
| **State** | React Hooks, Custom Hooks |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **PDF** | pdfmake (client-side) |
| **Backend** | Supabase Edge Functions (Deno) |
| **Database** | PostgreSQL (Supabase) |
| **External APIs** | Browserless (headless Chrome), Tranco (traffic data) |

## 📁 Project Structure

```
├── src/
│   ├── assets/                    # Static images (logos, etc.)
│   ├── components/
│   │   ├── ui/                    # Shadcn/Radix UI components
│   │   ├── shared/                # Shared business components
│   │   ├── calculator/            # ROI Calculator components
│   │   ├── scanner/               # Domain Scanner components
│   │   ├── Hero.tsx               # Landing page hero
│   │   ├── IdentityHealthQuiz.tsx # Quiz flow
│   │   ├── RevenueCalculator.tsx  # Calculator interface
│   │   ├── ResultsDashboard.tsx   # Results display
│   │   └── ...
│   ├── hooks/
│   │   ├── useDomainScan.ts       # Scanner state management
│   │   ├── useScannerAuth.ts      # Scanner authentication
│   │   ├── useCalculatorState.ts  # Calculator state
│   │   ├── useLeadCapture.ts      # Lead form handling
│   │   └── ...
│   ├── pages/
│   │   ├── scanner/
│   │   │   ├── ScannerLogin.tsx   # Scanner auth page
│   │   │   ├── ScannerInput.tsx   # Domain input page
│   │   │   └── ScannerResults.tsx # Results display page
│   │   └── NotFound.tsx
│   ├── utils/
│   │   ├── scannerApi.ts          # Scanner API calls
│   │   ├── calculationEngine.ts   # Revenue calculations
│   │   ├── pdfGenerator.ts        # PDF generation
│   │   ├── scannerPdfGenerator.ts # Scanner PDF export
│   │   ├── revenueImpactScoring.ts# Scoring algorithms
│   │   ├── trafficEstimation.ts   # Traffic calculations
│   │   └── ...
│   ├── types/
│   │   ├── scanner.ts             # Scanner type definitions
│   │   └── index.ts               # Calculator types
│   ├── integrations/supabase/
│   │   ├── client.ts              # Main Supabase client
│   │   └── scanner-client.ts      # Scanner DB client (read-only)
│   ├── index.css                  # Design system tokens
│   └── App.tsx                    # Router setup
├── supabase/
│   ├── functions/
│   │   ├── scan-domain/           # Domain scanning logic
│   │   ├── generate-insights/     # AI insights generation
│   │   └── send-pdf-email/        # Email delivery
│   └── config.toml                # Supabase configuration
├── public/
│   └── lovable-uploads/           # User-uploaded assets
└── [config files]
```

## 🔐 Environment Variables

### Supabase Edge Function Secrets

Edge functions are deployed on Supabase Cloud (not Vercel). Secrets are managed in Supabase dashboard:

| Secret | Description | Required For | Location |
|--------|-------------|--------------|----------|
| `SCANNER_SUPABASE_URL` | External scanner database URL | scan-domain | Supabase Dashboard |
| `SCANNER_SUPABASE_SERVICE_KEY` | External scanner DB service key | scan-domain | Supabase Dashboard |
| `BROWSERLESS_API_KEY` | Browserless.io API key | scan-domain | Supabase Dashboard |
| `OPENAI_API_KEY` | OpenAI API key | generate-insights | Supabase Dashboard |
| `RESEND_API_KEY` | Resend email API key | send-pdf-email | Supabase Dashboard |

### Frontend Environment Variables

**For Vercel Deployment:**

Set these in Vercel Dashboard → Project Settings → Environment Variables:

**Required Variables:**

```bash
# Main Supabase project - Used for edge function calls
VITE_SUPABASE_URL=https://ojtfnhzqhfsprebvpmvx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**For Local Development:**

Create `.env` file in project root:

**Optional Variables:**

```bash
# Used in PDF exports for meeting booking links
VITE_MEETING_BOOKING_URL=https://outlook.office.com/book/SalesTeambooking@adfixus.com
```

**Setup Instructions:**

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required values:
   - Get `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from your Supabase project settings
   - The URL should be: `https://ojtfnhzqhfsprebvpmvx.supabase.co`

3. Restart your dev server after changing `.env`:
   ```bash
   npm run dev
   ```

**Important Notes:**
- **Vercel**: Set environment variables in Vercel Dashboard (Project Settings → Environment Variables)
- **Local**: Use `.env` file (never commit to version control)
- **Build-Time Validation**: Build will fail if required env vars are missing (prevents broken deployments)
- **URL Normalization**: URLs are automatically normalized (trailing slashes removed, https:// ensured)
- **Runtime Validation**: Environment variables are validated at runtime with clear error messages
- **See `.env.example` for template**

### Pre-Deployment Checklist

**Before deploying to Vercel, ensure:**

- [ ] `VITE_SUPABASE_URL` is set in Vercel Dashboard
  - Format: `https://[project-id].supabase.co`
  - Example: `https://ojtfnhzqhfsprebvpmvx.supabase.co`
  - Must NOT have trailing slash
  - Must use HTTPS protocol
  
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set in Vercel Dashboard
  - Get from Supabase Dashboard → Project Settings → API
  - Should be the "anon" or "public" key (not service role key)
  - Minimum 50 characters long

- [ ] Environment variables are set for ALL environments:
  - [ ] Production
  - [ ] Preview
  - [ ] Development

- [ ] Supabase project exists and is active
  - Verify project ID matches URL
  - Check Supabase Dashboard for project status

- [ ] Edge functions are deployed
  - Check Supabase Dashboard → Edge Functions
  - Verify `scan-domain` function is deployed

- [ ] Test build locally (optional but recommended):
  ```bash
  # Set env vars temporarily
  export VITE_SUPABASE_URL=https://ojtfnhzqhfsprebvpmvx.supabase.co
  export VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
  
  # Build should succeed
  npm run build
```

## 📋 Key Features

### 1. Identity Health Quiz (`/`)
- Multi-step questionnaire assessing identity resolution capabilities
- Scoring system generating grades (A+ to F)
- Lead capture integration

### 2. Revenue Calculator (`/`)
- Interactive sliders for traffic and revenue inputs
- Real-time calculation of potential uplift
- Advanced settings for detailed configuration

### 3. Domain Scanner (`/scanner/*`)
- **Login**: Password-protected access
- **Input**: Enter up to 20 domains (text or CSV)
- **Scanning**: Real-time progress with live updates
- **Results**: 
  - Portfolio summary with traffic trends
  - Per-domain analysis (cookies, vendors, compliance)
  - AI-generated strategic insights
  - PDF export

## 🔄 Data Flow

### Scanner Flow

```
1. User enters domains on ScannerInput.tsx
                ↓
2. startScan() calls supabase.functions.invoke('scan-domain')
                ↓
3. Edge function creates scan record in external DB
                ↓
4. For each domain:
   a. Fetch Tranco traffic data
   b. Scan with Browserless (or fetch fallback)
   c. Detect vendors, cookies, CMPs
   d. Calculate scores (addressability, ID bloat, privacy)
   e. Insert result into domain_results table
                ↓
5. Frontend subscribes to real-time updates
   (scannerSupabase.channel().on('postgres_changes'))
                ↓
6. Results displayed with charts, metrics, AI insights
```

### Database Schema (External Scanner DB)

**domain_scans**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Scan creation time |
| created_by | text | User identifier |
| status | enum | pending/processing/completed/failed |
| total_domains | int | Number of domains to scan |
| completed_domains | int | Progress counter |
| monthly_impressions | bigint | Optional publisher context |
| publisher_vertical | text | Optional vertical |
| owned_domains_count | int | Optional domain count |

**domain_results**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| scan_id | uuid | FK to domain_scans |
| domain | text | Scanned domain |
| status | enum | success/failed/timeout/blocked |
| total_cookies | int | Cookie count |
| has_google_analytics | bool | Vendor detection |
| tranco_rank | int | Traffic rank |
| addressability_gap_pct | float | Revenue impact score |
| ... | ... | (see src/types/scanner.ts) |

## 🚀 Development Workflow

### Running Locally

```bash
npm run dev         # Start dev server (http://localhost:8080)
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

### Deployment

**Vercel (Frontend):**
- Deploys automatically on git push to main branch
- Environment variables must be set in Vercel Dashboard
- Build command: `npm run build`
- Output directory: `dist`

**Supabase (Edge Functions):**
- Edge functions are deployed on Supabase Cloud
- Deploy via Supabase CLI or dashboard
- To force redeployment, update version comment in function file:
```typescript
// Version: X.X.X - Force redeploy YYYY-MM-DD
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
```

### Debugging

1. **Console logs**: Check browser DevTools (look for `[DIAGNOSTIC]` prefixed logs)
2. **Network tab**: Verify API calls to edge functions
3. **Edge function logs**: View in Supabase Dashboard → Edge Functions → Logs
4. **Real-time subscriptions**: Look for `[scannerApi]` prefixed logs
5. **Environment variables**: Check Vercel Dashboard → Environment Variables

## ⚠️ Common Issues & Solutions

### "ERR_NAME_NOT_RESOLVED" or "Failed to send a request to the Edge Function"

**Symptoms:**
- Console shows `ERR_NAME_NOT_RESOLVED` error
- Scanner shows "Scanner Service Unavailable" with red error box
- Health check fails
- Browser Network tab shows DNS resolution failure

**All Possible Root Causes & Solutions:**

#### Root Cause 1: Environment Variable Not Set in Vercel (MOST COMMON)

**Symptoms:**
- `[DIAGNOSTIC] VITE_SUPABASE_URL set: false` in console
- Build succeeded but app shows DNS error

**Solution:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `VITE_SUPABASE_URL` with value: `https://ojtfnhzqhfsprebvpmvx.supabase.co`
3. Add `VITE_SUPABASE_PUBLISHABLE_KEY` with your Supabase anon key
4. **Critical**: Set for ALL environments (Production, Preview, Development)
5. **Trigger new deployment** after adding variables (Vercel → Deployments → Redeploy)

**Verification:**
- Check browser console for `[DIAGNOSTIC] VITE_SUPABASE_URL set: true`
- Use "Check Configuration" button in scanner UI

---

#### Root Cause 2: Environment Variable Set for Wrong Environment

**Symptoms:**
- Variable exists but only for one environment
- Preview/Development deployments fail while Production works (or vice versa)

**Solution:**
1. Go to Vercel Dashboard → Environment Variables
2. For each variable, click "Edit"
3. Check all three environments: Production, Preview, Development
4. Save and redeploy

**Verification:**
- Check which environment your deployment is using
- Verify variables are set for that specific environment

---

#### Root Cause 3: Environment Variable Format Issues

**Symptoms:**
- Variable is set but URL format is wrong
- Console shows URL normalization warnings

**Common Format Issues:**
- ❌ Trailing slash: `https://ojtfnhzqhfsprebvpmvx.supabase.co/`
- ❌ Missing protocol: `ojtfnhzqhfsprebvpmvx.supabase.co`
- ❌ Extra whitespace: ` https://ojtfnhzqhfsprebvpmvx.supabase.co `
- ❌ Wrong project ID: `https://wrong-id.supabase.co`

**Solution:**
1. URL is automatically normalized, but fix in Vercel Dashboard:
2. Use exact format: `https://ojtfnhzqhfsprebvpmvx.supabase.co`
3. No trailing slash, no extra spaces, correct project ID
4. Redeploy after fixing

**Verification:**
- Check console for normalization warnings
- Use "Check Configuration" button to see normalized URL

---

#### Root Cause 4: Build Happened Before Env Vars Were Set

**Symptoms:**
- Env vars are set in Vercel but app still shows DNS error
- Build logs show no env var warnings

**Solution:**
1. Go to Vercel Dashboard → Deployments
2. Click "Redeploy" on latest deployment
3. Or push a new commit to trigger rebuild
4. Build will now include env vars

**Verification:**
- Check build logs for env var validation messages
- Build should show: `[build] Environment variables validated successfully`

---

#### Root Cause 5: Supabase Project Doesn't Exist

**Symptoms:**
- DNS resolution fails even with correct URL
- "Check Configuration" shows DNS resolution failed

**Solution:**
1. Go to Supabase Dashboard
2. Verify project `ojtfnhzqhfsprebvpmvx` exists
3. Check project status (should be "Active")
4. If project was deleted, create new project and update URL

**Verification:**
- Test URL directly: `https://ojtfnhzqhfsprebvpmvx.supabase.co`
- Use "Check Configuration" button in scanner UI
- Check DNS resolution: `nslookup ojtfnhzqhfsprebvpmvx.supabase.co`

---

#### Root Cause 6: Edge Function Not Deployed

**Symptoms:**
- DNS resolves but edge function returns error
- Health check shows function not accessible

**Solution:**
1. Go to Supabase Dashboard → Edge Functions
2. Verify `scan-domain` function is deployed
3. Check function logs for errors
4. Redeploy function if needed:
   - Update version comment in `supabase/functions/scan-domain/index.ts`
   - Deploy via Supabase CLI or dashboard

**Verification:**
- Test edge function directly: `https://ojtfnhzqhfsprebvpmvx.supabase.co/functions/v1/scan-domain`
- Check Supabase Dashboard → Edge Functions → Logs

---

#### Root Cause 7: Browser Cache Issues

**Symptoms:**
- Old error messages persist after fix
- Console shows old log messages

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache:
   - DevTools → Application → Clear storage
   - Or use incognito/private window
3. Clear site data if needed

**Verification:**
- Check console for new `[DIAGNOSTIC]` logs
- Verify error messages match current code

---

#### Root Cause 8: Vercel Build Cache

**Symptoms:**
- Env vars set but build uses old cached values
- Build succeeds but app has wrong configuration

**Solution:**
1. Go to Vercel Dashboard → Settings → General
2. Clear build cache
3. Trigger new deployment

**Verification:**
- Check build logs for env var values (be careful not to expose secrets)
- Verify build includes latest env vars

---

### Using the Diagnostic Tool

The scanner UI includes a "Check Configuration" button that runs comprehensive diagnostics:

1. **Click "Check Configuration"** when service is unavailable
2. **Review diagnostic results** showing:
   - Environment variable status
   - URL format validation
   - DNS resolution
   - Specific recommendations
3. **Follow recommendations** to fix the issue
4. **Click "Retry Connection"** after fixing

**Diagnostic checks:**
- ✅ Environment variable is set
- ✅ URL format is valid
- ✅ DNS resolution works
- ✅ URL is accessible
- ✅ Provides specific recommendations based on findings

### "Multiple GoTrueClient instances detected"

**Symptoms:**
- Console warning: "Multiple GoTrueClient instances detected in the same browser context"
- May cause undefined behavior with auth

**Root Causes:**
- Both Supabase clients sharing the same storage key
- Stale browser cache

**Solutions:**
1. **Hard Refresh:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear Browser Cache:**
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"

3. **Clear Site Data:**
   - DevTools → Application → Storage → Clear site data

4. **Verify Fix:**
   - The scanner client now uses a custom storage key (`scanner_supabase_auth_token`)
   - This should prevent conflicts
   - If warning persists, check browser console for client initialization logs

### Scanner Service Shows "Offline" or "Unavailable"

**Symptoms:**
- Connection status indicator shows "Offline"
- Health check fails
- Cannot start scans

**Solutions:**
1. **Click "Retry Connection" button** in the UI
2. **Check Environment Variables:**
   - Verify `VITE_SUPABASE_URL` is set correctly
   - Verify `VITE_SUPABASE_PUBLISHABLE_KEY` is set
   - Restart dev server after changing .env

3. **Check Edge Function Status:**
   - Verify function is deployed in Lovable Cloud
   - Check function logs for errors
   - Ensure all required secrets are set

4. **Network Connectivity:**
   - Check internet connection
   - Verify no firewall blocking Supabase requests
   - Try accessing Supabase dashboard directly

### Scanner Results Not Appearing

**Symptoms:**
- Scan starts but results don't appear
- Real-time updates not working

**Root Causes:**
- Real-time subscription failed
- Scanner database connection issue

**Solutions:**
1. **Check Scanner Database:**
   - Scanner uses external database (hardcoded in `scanner-client.ts`)
   - Verify database is accessible
   - Check RLS policies allow reads

2. **Check Console Logs:**
   - Look for `[scannerApi]` prefixed logs
   - Check for subscription errors
   - Verify scan ID is valid

3. **Refresh Page:**
   - Sometimes subscriptions need to reconnect
   - Navigate away and back to results page

### AI Insights Not Generating

**Symptoms:**
- Insights panel shows "Generating..." indefinitely
- No insights appear

**Root Causes:**
- Missing or invalid `OPENAI_API_KEY`
- OpenAI API error

**Solutions:**
1. **Check Lovable Cloud Secrets:**
   - Go to Project Settings → Secrets
   - Verify `OPENAI_API_KEY` is set
   - Check key is valid and has credits

2. **Check Edge Function Logs:**
   - View `generate-insights` function logs
   - Look for API errors or rate limits

3. **Verify Scan Has Results:**
   - Insights require completed scan results
   - Ensure scan has finished processing

### Environment Variable Validation Errors

**Symptoms:**
- App fails to start
- Console shows configuration errors
- "Supabase configuration is missing or invalid"

**Solutions:**
1. **Create .env File:**
   ```bash
   cp .env.example .env
   ```

2. **Fill Required Variables:**
   - `VITE_SUPABASE_URL` - Required
   - `VITE_SUPABASE_PUBLISHABLE_KEY` - Required
   - `VITE_MEETING_BOOKING_URL` - Optional

3. **Restart Dev Server:**
   ```bash
   npm run dev
   ```

4. **Check Format:**
   - URLs must start with `https://`
   - No trailing slashes
   - No quotes around values

### Build Errors

**Symptoms:**
- `npm run build` fails
- TypeScript errors
- Import errors

**Solutions:**
1. **Clear Build Cache:**
   ```bash
   rm -rf node_modules .vite dist
   npm install
   ```

2. **Check TypeScript:**
   ```bash
   npm run lint
   ```

3. **Verify Dependencies:**
   ```bash
   npm install
   ```

## 📄 License

Private - AdFixus Internal Use
