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

### Lovable Cloud Secrets (Edge Functions)

| Secret | Description | Required For |
|--------|-------------|--------------|
| `SCANNER_SUPABASE_URL` | External scanner database URL | scan-domain |
| `SCANNER_SUPABASE_SERVICE_KEY` | External scanner DB service key | scan-domain |
| `BROWSERLESS_API_KEY` | Browserless.io API key | scan-domain |
| `OPENAI_API_KEY` | OpenAI API key | generate-insights |
| `RESEND_API_KEY` | Resend email API key | send-pdf-email |

### Frontend Environment (.env)

**Required Variables:**

```bash
# Main Supabase project (Lovable Cloud) - Used for edge function calls
VITE_SUPABASE_URL=https://ojtfnhzqhfsprebvpmvx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

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
- Never commit `.env` to version control (it's in `.gitignore`)
- Environment variables are validated at runtime
- Missing required variables will show clear error messages
- See `.env.example` for template

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

### Edge Function Development

Edge functions deploy automatically when you push code. To force redeployment:
1. Add a version comment at the top of the function file
2. Push changes
3. Wait for build to complete

```typescript
// Version: X.X.X - Force redeploy YYYY-MM-DD
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
```

### Debugging

1. **Console logs**: Check browser DevTools
2. **Network tab**: Verify API calls to edge functions
3. **Edge function logs**: View in Lovable Cloud dashboard
4. **Real-time subscriptions**: Look for `[scannerApi]` prefixed logs

## ⚠️ Common Issues & Solutions

### "ERR_NAME_NOT_RESOLVED" or "Failed to send a request to the Edge Function"

**Symptoms:**
- Console shows `ERR_NAME_NOT_RESOLVED` error
- Scanner shows "Scanner Service Unavailable"
- Health check fails

**Root Causes:**
1. `VITE_SUPABASE_URL` is missing or incorrect
2. Edge function not deployed
3. Network/DNS issues

**Solutions:**
1. **Check Environment Variables:**
   ```bash
   # Verify .env file exists and has correct values
   cat .env
   
   # Should contain:
   # VITE_SUPABASE_URL=https://ojtfnhzqhfsprebvpmvx.supabase.co
   # VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
   ```

2. **Verify Supabase URL:**
   - Should be: `https://ojtfnhzqhfsprebvpmvx.supabase.co`
   - Must start with `https://`
   - Must include `.supabase.co`

3. **Check Edge Function Deployment:**
   - Go to Lovable Cloud dashboard
   - Verify `scan-domain` function is deployed
   - Check function logs for errors
   - Force redeploy by updating version comment in `supabase/functions/scan-domain/index.ts`

4. **Network Issues:**
   - Check internet connection
   - Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
   - Clear browser cache
   - Check browser console for CORS errors

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
