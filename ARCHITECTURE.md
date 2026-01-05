# Architecture Reference

> Quick reference for understanding how the codebase is organized.

---

## 📊 System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  FRONTEND                                    │
│                           React + Vite + TypeScript                         │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           PAGES                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────────┐ │   │
│  │  │   Index     │  │  Scanner    │  │      ScannerResults          │ │   │
│  │  │  (Quiz +    │  │   Login     │  │  (Charts, Tables, Insights)  │ │   │
│  │  │ Calculator) │  │   Input     │  │                              │ │   │
│  │  └─────────────┘  └─────────────┘  └──────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           HOOKS                                      │   │
│  │  useDomainScan │ useScannerAuth │ useCalculatorState │ useLeadCapture│  │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           UTILS                                      │   │
│  │  scannerApi │ calculationEngine │ pdfGenerator │ revenueImpactScoring│  │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SUPABASE CLIENTS                                │   │
│  │    ┌────────────────────┐      ┌────────────────────────────────┐   │   │
│  │    │  supabase (main)   │      │  scannerSupabase (external DB) │   │   │
│  │    │  - Edge functions  │      │  - Real-time subscriptions     │   │   │
│  │    │  - Lovable Cloud   │      │  - Read scan results           │   │   │
│  │    └────────────────────┘      └────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    supabase.functions.invoke()
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LOVABLE CLOUD                                      │
│                        Edge Functions (Deno)                                │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  scan-domain                                                        │    │
│  │  ├── Create scan record in external DB                             │    │
│  │  ├── For each domain:                                              │    │
│  │  │   ├── Fetch Tranco traffic data                                │    │
│  │  │   ├── Scan with Browserless (headless Chrome)                  │    │
│  │  │   ├── Detect vendors (GA, GTM, Meta, etc.)                     │    │
│  │  │   ├── Analyze cookies (1P, 3P, Safari ITP)                     │    │
│  │  │   ├── Calculate scores (addressability, privacy, etc.)         │    │
│  │  │   └── Insert result to external DB                             │    │
│  │  └── Update scan status to completed                              │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  generate-insights                                                  │    │
│  │  ├── Receive scan results                                          │    │
│  │  ├── Build prompt with domain data                                 │    │
│  │  ├── Call OpenAI API                                               │    │
│  │  └── Return strategic insights JSON                                │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  send-pdf-email                                                     │    │
│  │  ├── Generate PDF from results                                     │    │
│  │  ├── Upload to storage                                             │    │
│  │  └── Send via Resend API                                           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                          Service Key Authentication
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SCANNER DATABASE                             │
│                          (Separate Supabase Project)                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  domain_scans                                                       │    │
│  │  ├── id (uuid, PK)                                                 │    │
│  │  ├── created_at (timestamp)                                        │    │
│  │  ├── created_by (text)                                             │    │
│  │  ├── status (pending | processing | completed | failed)           │    │
│  │  ├── total_domains (int)                                           │    │
│  │  ├── completed_domains (int)                                       │    │
│  │  ├── monthly_impressions (bigint, optional)                        │    │
│  │  ├── publisher_vertical (text, optional)                           │    │
│  │  └── owned_domains_count (int, optional)                           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  domain_results                                                     │    │
│  │  ├── id (uuid, PK)                                                 │    │
│  │  ├── scan_id (uuid, FK → domain_scans)                             │    │
│  │  ├── domain (text)                                                 │    │
│  │  ├── scanned_at (timestamp)                                        │    │
│  │  ├── status (success | failed | timeout | blocked)                │    │
│  │  ├── total_cookies, first_party_cookies, third_party_cookies      │    │
│  │  ├── has_google_analytics, has_gtm, has_meta_pixel, ...           │    │
│  │  ├── tranco_rank, estimated_monthly_pageviews                      │    │
│  │  ├── addressability_gap_pct, id_bloat_severity                    │    │
│  │  ├── privacy_risk_level, competitive_positioning                  │    │
│  │  └── ... (50+ columns, see src/types/scanner.ts)                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Domain Scan

```
1. User enters domains on /scanner/input
   │
   ├─► parseDomains() validates and cleans input
   │
   ├─► useDomainScan.startScan() called
   │   │
   │   ├─► createScan() in scannerApi.ts
   │   │   │
   │   │   └─► supabase.functions.invoke('scan-domain')
   │   │       │
   │   │       └─► Edge Function creates scan record
   │   │           └─► Returns scanId
   │   │
   │   └─► Navigate to /scanner/results/:scanId
   │
   └─► useDomainScan sets up real-time subscriptions
       │
       ├─► subscribeScanUpdates() - listen for scan status
       │
       └─► subscribeResultUpdates() - listen for new results

2. Edge Function processes domains (async)
   │
   ├─► For each domain:
   │   │
   │   ├─► fetchTrancoData(domain) - traffic estimation
   │   │
   │   ├─► scanDomain(domain)
   │   │   ├─► scanWithBrowserless() - headless Chrome
   │   │   └─► OR scanWithFetch() - fallback
   │   │
   │   ├─► analyzeResults(html, cookies)
   │   │   ├─► Detect vendors (GA, GTM, Meta, etc.)
   │   │   ├─► Analyze cookies (1P, 3P, Safari ITP)
   │   │   └─► Calculate scores
   │   │
   │   └─► INSERT into domain_results
   │       └─► Real-time: Frontend receives new result
   │
   └─► UPDATE domain_scans status = 'completed'
       └─► Real-time: Frontend receives scan complete

3. Frontend displays results
   │
   ├─► PortfolioTrafficSummary - aggregate stats
   │
   ├─► Domain cards with sparklines, badges
   │
   ├─► AIInsightsPanel - strategic recommendations
   │   │
   │   └─► supabase.functions.invoke('generate-insights')
   │       └─► OpenAI API call
   │
   └─► PDF export button
       └─► Client-side generation with pdfmake
```

---

## 📁 File Organization

```
src/
├── components/
│   ├── ui/                    # Shadcn UI components (Button, Card, etc.)
│   ├── shared/                # Shared across features
│   │   └── BaseLeadCaptureForm.tsx
│   ├── calculator/            # ROI Calculator specific
│   │   ├── AdvancedSettings.tsx
│   │   └── CalculatorInputs.tsx
│   ├── scanner/               # Domain Scanner specific
│   │   ├── AIInsightsPanel.tsx
│   │   ├── AnimatedCounter.tsx
│   │   ├── BenchmarkComparison.tsx
│   │   ├── ConfidenceBreakdown.tsx
│   │   ├── PortfolioTrafficSummary.tsx
│   │   ├── RankTrendBadge.tsx
│   │   └── TrafficSparkline.tsx
│   ├── Hero.tsx               # Landing page hero section
│   ├── IdentityHealthQuiz.tsx # Quiz flow
│   ├── RevenueCalculator.tsx  # Calculator interface
│   ├── ResultsDashboard.tsx   # Results display
│   ├── LeadCaptureForm.tsx    # Lead capture form
│   ├── LeadCaptureModal.tsx   # Modal wrapper
│   └── Navigation.tsx         # Site navigation
│
├── pages/
│   ├── scanner/
│   │   ├── ScannerLogin.tsx   # Password entry
│   │   ├── ScannerInput.tsx   # Domain input form
│   │   └── ScannerResults.tsx # Results page
│   └── NotFound.tsx           # 404 page
│
├── hooks/
│   ├── useDomainScan.ts       # Scanner state & real-time
│   ├── useScannerAuth.ts      # Simple password auth
│   ├── useCalculatorState.ts  # Calculator state
│   ├── useLeadCapture.ts      # Lead form handling
│   ├── use-mobile.tsx         # Mobile detection
│   └── use-toast.ts           # Toast notifications
│
├── utils/
│   ├── scannerApi.ts          # Scanner API calls
│   ├── calculationEngine.ts   # Revenue calculations
│   ├── pdfGenerator.ts        # Calculator PDF
│   ├── scannerPdfGenerator.ts # Scanner PDF
│   ├── revenueImpactScoring.ts# Scoring algorithms
│   ├── trafficEstimation.ts   # Traffic calculations
│   ├── formatting.ts          # Number/currency formatting
│   ├── grading.ts             # A-F grading system
│   └── recommendations.ts     # Recommendation engine
│
├── types/
│   ├── scanner.ts             # All scanner types
│   ├── index.ts               # Calculator types
│   └── supabase.ts            # Database types
│
├── integrations/supabase/
│   ├── client.ts              # Main Supabase client
│   └── scanner-client.ts      # External DB client
│
├── constants/
│   └── index.ts               # App constants
│
├── lib/
│   └── utils.ts               # Utility functions (cn, etc.)
│
├── assets/                    # Static images
│   ├── adfixus-logo.png
│   ├── adfixus-logo-full.png
│   └── adfixus-logo-scanner.png
│
├── App.tsx                    # Router setup
├── App.css                    # App-level styles
├── index.css                  # Design tokens & globals
└── main.tsx                   # Entry point

supabase/
├── functions/
│   ├── scan-domain/
│   │   └── index.ts           # Domain scanning logic
│   ├── generate-insights/
│   │   └── index.ts           # AI insights generation
│   └── send-pdf-email/
│       └── index.ts           # Email delivery
└── config.toml                # Function configuration
```

---

## 🎨 Design System

### Color Tokens (HSL)

```css
/* Primary palette */
--primary: 207 89% 86%;        /* Cyan */
--primary-foreground: 207 89% 20%;

/* Neutral palette */
--background: 220 14% 10%;     /* Dark background */
--foreground: 210 40% 98%;     /* Light text */
--muted: 220 14% 20%;
--muted-foreground: 215 20% 65%;

/* Semantic colors */
--success: 142 76% 36%;        /* Green */
--warning: 38 92% 50%;         /* Orange */
--destructive: 0 84% 60%;      /* Red */
```

### Typography

```css
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Spacing Scale

Uses Tailwind's default spacing: 4px increments (p-1 = 4px, p-4 = 16px, etc.)

---

## 🔌 External Dependencies

| Service | Purpose | API Key Location |
|---------|---------|------------------|
| Browserless | Headless Chrome | `BROWSERLESS_API_KEY` secret |
| Tranco | Traffic rank data | No auth required |
| OpenAI | AI insights | `OPENAI_API_KEY` secret |
| Resend | Email delivery | `RESEND_API_KEY` secret |
| Supabase (external) | Scanner database | `SCANNER_SUPABASE_*` secrets |
