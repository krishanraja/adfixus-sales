# Revenue Calculation Fix Report
## Date: January 15, 2026 (Updated)

## Executive Summary

Fixed revenue calculations to use **incremental opportunity** (not total loss) with realistic caps, preventing unrealistic numbers like $79M for NBC News. Also added comprehensive SSP/DSP/Universal ID detection patterns.

---

## Changes Made

### 1. Updated Revenue Calculation Formula

**Problem**: Previous formula calculated total loss at ~$79M for large publishers, which is unrealistic.

**Solution**: New formula calculates **incremental opportunity** (the additional revenue from improving Safari addressability by 20%), capped at 7% of total revenue.

**Updated Constants** (`src/utils/revenueImpactScoring.ts`):
| Constant | Old Value | New Value | Rationale |
|----------|-----------|-----------|-----------|
| `safariMarketShare` | 0.52 | 0.35 | Safari only (not combined with Firefox) |
| `baselineAddressability` | N/A | 0.65 | 65% already addressable |
| `targetSafariImprovement` | N/A | 0.20 | 20% improvement target |
| `cpmUpliftAddressable` | 0.45 | 0.25 | 25% CPM lift (not 45%) |
| `maxRealisticLossPercent` | N/A | 0.07 | Cap at 7% of total revenue |

**New Formula**:
```typescript
// Safari impressions that become newly addressable
const safariImpressions = monthlyImpressions * 0.35;
const newlyAddressable = safariImpressions * 0.20; // 20% improvement

// Base revenue + CPM uplift
const baseRevenue = (newlyAddressable / 1000) * cpm;
const cpmUplift = baseRevenue * 0.25;

// Cap at 7% of total revenue
const totalRevenue = (monthlyImpressions / 1000) * cpm;
return Math.min(baseRevenue + cpmUplift, totalRevenue * 0.07);
```

**Example - NBC News (2.5B monthly impressions)**:
| Metric | Old (Broken) | New (Fixed) |
|--------|--------------|-------------|
| Annual Loss | $79M | ~$8.5M |
| % of Revenue | 50%+ | 7% (capped) |

---

### 2. Enhanced Vendor Detection

Added comprehensive detection for 30+ AdTech vendors from the vendor analysis PDF:

**SSPs Added**: Magnite, PubMatic, OpenX, TripleLift, Index Exchange, Sharethrough, Sovrn, GumGum, Yieldmo, Unruly, Google Ad Manager

**DSPs Added**: AppNexus/Xandr, The Trade Desk, Criteo, MediaMath, DV360, Beeswax, Amobee, Amazon DSP

**Universal IDs Added**: LiveRamp ATS, ID5, UID2/EUID, 33Across, Zeotap, Lotame Panorama, Shared ID, Fabrick ID, Merkle ID, NetID

Detection uses both:
- Cookie name pattern matching
- Third-party domain detection

---

### 3. Fixed Build Errors (8 total)

| File | Error | Fix |
|------|-------|-----|
| `scanner-client.ts:90` | Type mismatch | Use `any` type for singleton |
| `ScannerResults.tsx:378` | Invalid `'completed'` comparison | Remove `'completed'` check |
| `scannerApi.ts:455-459` | Missing `.data` property | Add type assertion |
| `scan-domain/index.ts:1023` | Invalid `'compliant'` value | Change to `'low'` |
| `scan-domain/index.ts:230` | Supabase client type | Add `as any` cast |
| `scan-domain/index.ts:373` | Invalid `'compliant'` value | Change to `'low'` |
| `monitor-domain-changes/index.ts:173` | Missing `id` on type | Add `id` to interface |
| `scanner.ts:6` | Inconsistent type union | Reorder type values |

---

## Files Modified

1. `src/utils/revenueImpactScoring.ts` - Updated constants and formula
2. `src/integrations/supabase/scanner-client.ts` - Fixed type error
3. `src/pages/scanner/ScannerResults.tsx` - Fixed status comparison
4. `src/utils/scannerApi.ts` - Fixed response type handling
5. `supabase/functions/scan-domain/index.ts` - Added vendor patterns, fixed types
6. `supabase/functions/monitor-domain-changes/index.ts` - Fixed interface
7. `src/types/scanner.ts` - Fixed PrivacyRiskLevel type

---

## Verification

### Expected Behavior After Fix:
- NBC News (~2.5B impressions): ~$8-10M annual opportunity (not $79M)
- TheVerge (~200M impressions): ~$600K-800K annual opportunity
- All three dashboard values (headline, portfolio summary, pain points) consistent
- Enhanced vendor detection for SSPs, DSPs, and Universal IDs
