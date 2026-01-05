# Developer Handoff Guide

> **For Junior Engineers**: This document explains everything you need to understand and modify this codebase. Read this first!

---

## 📚 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [Key Concepts](#key-concepts)
4. [File-by-File Guide](#file-by-file-guide)
5. [Common Tasks](#common-tasks)
6. [Debugging Guide](#debugging-guide)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 📝 Project Overview

This is a **dual-purpose application**:

### 1. Identity ROI Calculator (Main Site)
- **Path**: `/`
- **Purpose**: Help publishers understand revenue lost due to poor identity resolution
- **Flow**: Quiz → Calculator → Results → PDF Export
- **Backend**: None required (client-side only)

### 2. Domain Scanner (Protected Tool)
- **Path**: `/scanner/*`
- **Purpose**: Scan domains to detect tracking infrastructure, cookies, and revenue opportunities
- **Flow**: Login → Input Domains → View Results → AI Insights
- **Backend**: Requires Supabase Edge Functions + External Database

---

## 🏗️ Architecture Deep Dive

### Frontend Architecture

```
App.tsx (Router)
├── / → Index.tsx → Hero, Quiz, Calculator, Results
├── /scanner → ScannerLogin.tsx
├── /scanner/input → ScannerInput.tsx
└── /scanner/results/:scanId → ScannerResults.tsx
```

### State Management

We use **React hooks** for all state. No Redux, Zustand, or other state libraries.

| Hook | File | Purpose |
|------|------|---------|
| `useDomainScan` | `src/hooks/useDomainScan.ts` | Manages scan state, results, subscriptions |
| `useScannerAuth` | `src/hooks/useScannerAuth.ts` | Simple password authentication |
| `useCalculatorState` | `src/hooks/useCalculatorState.ts` | Calculator inputs and calculations |
| `useLeadCapture` | `src/hooks/useLeadCapture.ts` | Lead form submission |

### Backend Architecture

```
Lovable Cloud (Project: ojtfnhzqhfsprebvpmvx)
├── Edge Functions (deployed automatically)
│   ├── scan-domain      → Orchestrates domain scanning
│   ├── generate-insights → AI-powered analysis
│   └── send-pdf-email   → Email delivery
└── Internal DB (not used by scanner)

External Scanner Database (separate Supabase project)
├── domain_scans table → Scan metadata
└── domain_results table → Per-domain results
```

### Why Two Databases?

The scanner uses a **separate external database** to:
1. Keep scanner data isolated from main app data
2. Allow the scanner to be shared across multiple frontends
3. Enable service-key access for write operations

The frontend **reads** from the external DB via `scannerSupabase` client.
Edge functions **write** to it using the service key.

---

## 🔑 Key Concepts

### 1. Supabase Clients

We have **two** Supabase clients:

```typescript
// src/integrations/supabase/client.ts
// Used for: Calling edge functions, Lovable Cloud features
import { supabase } from '@/integrations/supabase/client';

// src/integrations/supabase/scanner-client.ts  
// Used for: Reading scan data, real-time subscriptions
import { scannerSupabase } from '@/integrations/supabase/scanner-client';
```

### 2. Edge Function Invocation

Always use the Supabase client to call edge functions:

```typescript
// ✅ CORRECT
const { data, error } = await supabase.functions.invoke('scan-domain', {
  body: { domains, context }
});

// ❌ WRONG - Never use raw fetch for Supabase functions
const response = await fetch('/functions/v1/scan-domain');
```

### 3. Real-Time Subscriptions

The scanner uses Postgres real-time to show live updates:

```typescript
// Subscribe to scan progress
scannerSupabase
  .channel(`scan-${scanId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'domain_scans',
    filter: `id=eq.${scanId}`,
  }, (payload) => {
    // Handle update
  })
  .subscribe();
```

### 4. Type Safety

All scanner types are in `src/types/scanner.ts`. Key types:

```typescript
interface DomainScan {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_domains: number;
  completed_domains: number;
  // ...
}

interface DomainResult {
  domain: string;
  total_cookies: number;
  addressability_gap_pct: number;
  tranco_rank: number;
  // ... 50+ fields
}
```

### 5. Design System

All colors use **HSL semantic tokens** defined in `src/index.css`:

```css
/* ✅ CORRECT - Use semantic tokens */
.my-class {
  color: hsl(var(--foreground));
  background: hsl(var(--primary));
}

/* ❌ WRONG - Never use raw colors */
.my-class {
  color: #ffffff;
  background: blue;
}
```

---

## 📂 File-by-File Guide

### Core Scanner Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/utils/scannerApi.ts` | API layer for scanner | `createScan()`, `getScanResults()`, `checkEdgeFunctionHealth()` |
| `src/hooks/useDomainScan.ts` | State management | `startScan()`, `loadScan()`, real-time subscriptions |
| `src/pages/scanner/ScannerInput.tsx` | Domain input UI | File upload, validation, context form |
| `src/pages/scanner/ScannerResults.tsx` | Results UI | Charts, tables, AI insights |
| `supabase/functions/scan-domain/index.ts` | Scanning logic | Browserless integration, vendor detection |
| `supabase/functions/generate-insights/index.ts` | AI analysis | OpenAI integration |

### Core Calculator Files

| File | Purpose |
|------|---------|
| `src/components/IdentityHealthQuiz.tsx` | Quiz flow with scoring |
| `src/components/RevenueCalculator.tsx` | Interactive calculator |
| `src/components/ResultsDashboard.tsx` | Results with charts |
| `src/utils/calculationEngine.ts` | Revenue calculation logic |
| `src/utils/pdfGenerator.ts` | PDF export |

### Configuration Files

| File | Purpose |
|------|---------|
| `src/index.css` | Design tokens (colors, animations) |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `supabase/config.toml` | Edge function configuration |

---

## 🔧 Common Tasks

### Adding a New Vendor Detection

1. Open `supabase/functions/scan-domain/index.ts`
2. Find the `VENDOR_PATTERNS` object (around line 20)
3. Add your pattern:

```typescript
const VENDOR_PATTERNS = {
  // ... existing patterns
  myNewVendor: /my-vendor-script\.js|my-vendor\.com\/sdk/i,
};
```

4. Update the `analyzeResults()` function to use it
5. Add the field to `src/types/scanner.ts` if needed

### Modifying Revenue Calculations

1. Open `src/utils/revenueImpactScoring.ts`
2. Find the relevant calculation function
3. Update the formula

```typescript
// Example: Change addressability gap calculation
export function calculateAddressabilityGap(result: DomainResult): number {
  // Your new formula here
}
```

### Adding a New Scanner Metric

1. **Add to types** (`src/types/scanner.ts`):
```typescript
interface DomainResult {
  // ... existing fields
  my_new_metric: number;
}
```

2. **Calculate in edge function** (`supabase/functions/scan-domain/index.ts`):
```typescript
// In analyzeResults()
const my_new_metric = calculateMyNewMetric(html, cookies);
```

3. **Display in UI** (`src/pages/scanner/ScannerResults.tsx`):
```tsx
<Card>
  <CardTitle>My New Metric</CardTitle>
  <CardContent>{result.my_new_metric}</CardContent>
</Card>
```

### Changing the Scanner Password

1. Open `src/hooks/useScannerAuth.ts`
2. Find the password check (around line 15)
3. Update the hardcoded value or implement proper auth

```typescript
// Current (simple password)
const isValid = password === 'your-new-password';

// Better: Use environment variable or Supabase Auth
```

---

## 🐛 Debugging Guide

### Console Log Prefixes

All scanner logs use prefixes for easy filtering:

| Prefix | Location |
|--------|----------|
| `[scannerApi]` | API calls in `scannerApi.ts` |
| `[useDomainScan]` | Hook state in `useDomainScan.ts` |
| `[ScannerInput]` | Input page events |
| `[ScannerResults]` | Results page events |

### Debugging Checklist

1. **Function not deploying?**
   - Check `supabase/config.toml` syntax
   - Add version comment to force redeploy
   - Check Lovable Cloud logs

2. **Real-time not working?**
   - Verify `SCANNER_SUPABASE_URL` is correct
   - Check browser console for subscription errors
   - Ensure RLS policies allow reads

3. **Scans failing?**
   - Check `BROWSERLESS_API_KEY` is set
   - Look for errors in edge function logs
   - Verify domain is accessible

4. **AI insights empty?**
   - Verify `OPENAI_API_KEY` is set
   - Check for API errors in logs
   - Ensure scan has completed results

### Viewing Edge Function Logs

1. Go to Lovable Cloud dashboard
2. Navigate to Edge Functions
3. Select the function
4. View real-time logs

---

## 🚀 Deployment

### Frontend

Frontend deploys automatically when you push to main branch.

**Manual steps:**
1. Make code changes
2. Preview in Lovable
3. Click "Publish" to deploy

### Edge Functions

Edge functions deploy automatically with every build.

**Force redeploy:**
```typescript
// Add/update this comment at top of function file
// Version: 2.1.0 - Force redeploy 2026-01-05
```

### Secrets

Secrets are managed in Lovable Cloud:

1. Go to Project Settings → Secrets
2. Add/update secret value
3. Functions automatically use new values on next call

---

## 🔥 Troubleshooting

### Error: "ERR_NAME_NOT_RESOLVED"

**Cause**: Edge function endpoint doesn't exist
**Solution**:
1. Check `supabase/config.toml` has correct function entries
2. Force redeploy by adding version comment
3. Wait 1-2 minutes for deployment

### Error: "Multiple GoTrueClient instances"

**Cause**: Stale code in browser cache
**Solution**:
1. Hard refresh (Cmd+Shift+R)
2. Clear site data
3. Wait for fresh deployment

### Error: "Failed to send a request to the Edge Function"

**Cause**: Network or deployment issue
**Solution**:
1. Check internet connection
2. Verify function is deployed (check Lovable Cloud)
3. Check for CORS errors in console

### Scanner shows "temporarily unavailable"

**Cause**: Health check failed
**Solution**:
1. Check if functions are deployed
2. Verify all required secrets are set
3. Check edge function logs for errors

### Results not appearing in real-time

**Cause**: Subscription not connecting
**Solution**:
1. Verify `SCANNER_SUPABASE_URL` secret
2. Check RLS policies on external database
3. Look for subscription errors in console

---

## 📞 Getting Help

1. **Check logs first** - Console + Edge Function logs
2. **Search codebase** - Many patterns are repeated
3. **Read type definitions** - `src/types/scanner.ts` is comprehensive
4. **Check this document** - Most issues are covered here

---

## 🎯 Quick Reference

### Key URLs

| Environment | URL |
|-------------|-----|
| Preview | Check Lovable editor |
| Production | Check published URL |
| Edge Functions | `https://ojtfnhzqhfsprebvpmvx.supabase.co/functions/v1/` |

### Key Files to Know

```
src/utils/scannerApi.ts      → All API calls
src/hooks/useDomainScan.ts   → Scanner state
src/types/scanner.ts         → All types
supabase/functions/scan-domain/index.ts → Main scanning logic
src/index.css                → Design tokens
```

### Key Patterns

```typescript
// Calling edge functions
await supabase.functions.invoke('function-name', { body: { ... } });

// Reading from scanner DB
await scannerSupabase.from('table').select('*');

// Real-time subscription
scannerSupabase.channel('name').on('postgres_changes', ...).subscribe();
```
