// Traffic Estimation Utilities
// Power-law formula from CrUX/Tranco research (R² = 0.992)

import type { RankHistoryEntry, RankTrend } from '@/types/scanner';

const PAGEVIEW_COEFFICIENT = 7.73e12;
const PAGEVIEW_EXPONENT = -1.06;

/**
 * Estimate annual pageviews from Tranco rank using power-law formula
 * Based on research: pageviews_annual = 7.73 × 10^12 × rank^(-1.06)
 */
export function estimateAnnualPageviews(trancoRank: number): number {
  if (trancoRank <= 0) return 0;
  return Math.round(PAGEVIEW_COEFFICIENT * Math.pow(trancoRank, PAGEVIEW_EXPONENT));
}

/**
 * Estimate monthly pageviews from Tranco rank
 */
export function estimateMonthlyPageviews(trancoRank: number): number {
  return Math.round(estimateAnnualPageviews(trancoRank) / 12);
}

/**
 * Estimate monthly impressions from pageviews
 * Default assumes 4 ad slots per page
 */
export function estimateMonthlyImpressions(
  monthlyPageviews: number, 
  adsPerPage: number = 4
): number {
  return monthlyPageviews * adsPerPage;
}

/**
 * Get traffic confidence level based on Tranco rank
 * - High: Top 100K (well-tracked, reliable data)
 * - Medium: 100K-1M (reasonable estimate)
 * - Low: Beyond 1M (extrapolated, less reliable)
 */
export function getTrafficConfidence(rank: number): 'high' | 'medium' | 'low' {
  if (rank <= 100000) return 'high';
  if (rank <= 1000000) return 'medium';
  return 'low';
}

/**
 * Format large numbers for display
 */
export function formatTrafficNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}

/**
 * Calculate rank trend from 30-day history
 * Positive change = improving (lower rank is better)
 * Negative change = declining
 */
export function calculateRankTrend(
  history: RankHistoryEntry[] | null | undefined
): { trend: RankTrend; change: number } {
  if (!history || history.length < 2) {
    return { trend: 'stable', change: 0 };
  }
  
  // History is ordered newest first
  const newestRank = history[0].rank;
  const oldestRank = history[history.length - 1].rank;
  const change = oldestRank - newestRank; // Positive = improved
  
  // Threshold: 1000 rank positions change is significant
  const threshold = 1000;
  
  if (change > threshold) return { trend: 'growing', change };
  if (change < -threshold) return { trend: 'declining', change };
  return { trend: 'stable', change };
}

/**
 * Format rank change for display
 */
export function formatRankChange(change: number): string {
  if (change === 0) return '—';
  const sign = change > 0 ? '+' : '';
  return `${sign}${Math.abs(change).toLocaleString()}`;
}

/**
 * Get human-readable trend message
 */
export function getTrafficTrendMessage(trend: RankTrend): string {
  switch (trend) {
    case 'growing':
      return 'Traffic is increasing - great momentum!';
    case 'declining':
      return 'Traffic declining - may need attention';
    case 'stable':
      return 'Traffic is stable over 30 days';
  }
}

/**
 * Get trend color class
 */
export function getTrendColorClass(trend: RankTrend): string {
  switch (trend) {
    case 'growing':
      return 'text-success';
    case 'declining':
      return 'text-destructive';
    case 'stable':
      return 'text-muted-foreground';
  }
}

/**
 * Get trend icon direction
 */
export function getTrendDirection(trend: RankTrend): 'up' | 'down' | 'horizontal' {
  switch (trend) {
    case 'growing':
      return 'up';
    case 'declining':
      return 'down';
    case 'stable':
      return 'horizontal';
  }
}
