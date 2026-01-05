// Traffic Estimation Utilities
// Power-law formula from CrUX/Tranco research (R² = 0.992)

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
