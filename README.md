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

```bash
VITE_SUPABASE_URL=https://ojtfnhzqhfsprebvpmvx.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_MEETING_BOOKING_URL=https://outlook.office.com/book/SalesTeambooking@adfixus.com
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

### "ERR_NAME_NOT_RESOLVED"
**Cause**: Edge function not deployed
**Fix**: Force redeploy by updating version comment in function file

### "Multiple GoTrueClient instances"
**Cause**: Stale deployment cache
**Fix**: Hard refresh + wait for new deployment

### Scanner results not appearing
**Cause**: Real-time subscription failed
**Fix**: Check `SCANNER_SUPABASE_URL` secret is set correctly

### AI insights not generating
**Cause**: Missing or invalid `OPENAI_API_KEY`
**Fix**: Verify secret in Lovable Cloud settings

## 📄 License

Private - AdFixus Internal Use
