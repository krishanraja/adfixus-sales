// Scanner Types

export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DomainStatus = 'success' | 'failed' | 'timeout' | 'blocked';
export type IdBloatSeverity = 'low' | 'medium' | 'high' | 'critical';
export type PrivacyRiskLevel = 'compliant' | 'moderate' | 'high-risk' | 'low' | 'high' | 'critical';
export type CompetitivePosition = 'walled-garden-parity' | 'middle-pack' | 'at-risk' | 'commoditized';
export type PublisherVertical = 'news' | 'entertainment' | 'auto' | 'finance' | 'lifestyle' | 'other';
export type RankTrend = 'growing' | 'stable' | 'declining';

export interface PublisherContext {
  monthlyImpressions?: number;
  publisherVertical?: PublisherVertical;
  ownedDomainsCount?: number;
}

export interface DomainScan {
  id: string;
  created_at: string;
  created_by: string;
  status: ScanStatus;
  total_domains: number;
  completed_domains: number;
  monthly_impressions?: number;
  publisher_vertical?: string;
  owned_domains_count?: number;
  results?: DomainScanSummary;
}

export interface DomainScanSummary {
  totalRevenueLoss: number;
  avgAddressabilityGap: number;
  avgIdBloatSeverity: IdBloatSeverity;
  overallPrivacyRisk: PrivacyRiskLevel;
  overallPosition: CompetitivePosition;
  readinessGrade: string;
  painPoints: PainPoint[];
  opportunities: Opportunity[];
  // Portfolio trend summary
  portfolioTrend?: PortfolioTrendSummary;
}

export interface PortfolioTrendSummary {
  growingDomains: number;
  stableDomains: number;
  decliningDomains: number;
  avgRankChange: number;
  totalMonthlyImpressions: number;
  estimatedMonthlyRevenue: number;
  estimatedAnnualLoss: number;
}

export interface RankHistoryEntry {
  date: string;
  rank: number;
}

export interface DomainResult {
  id: string;
  scan_id: string;
  domain: string;
  scanned_at: string;
  status: DomainStatus;
  error_message?: string;
  
  // Cookie data
  total_cookies: number;
  first_party_cookies: number;
  third_party_cookies: number;
  max_cookie_duration_days: number;
  session_cookies: number;
  persistent_cookies: number;
  safari_blocked_cookies: number;
  
  // Vendors detected
  has_google_analytics: boolean;
  has_gtm: boolean;
  has_gcm: boolean;
  has_meta_pixel: boolean;
  has_meta_capi: boolean;
  has_ttd: boolean;
  has_liveramp: boolean;
  has_id5: boolean;
  has_criteo: boolean;
  has_ppid: boolean;
  
  // Consent detection
  cmp_vendor?: string;
  tcf_compliant: boolean;
  loads_pre_consent: boolean;
  
  // Infrastructure
  has_prebid: boolean;
  has_header_bidding: boolean;
  has_conversion_api: boolean;
  detected_ssps: string[];
  
  // Revenue impact scores
  // Can be null for failed scans to prevent skewing portfolio calculations
  addressability_gap_pct: number | null;
  estimated_safari_loss_pct: number | null;
  id_bloat_severity: IdBloatSeverity;
  privacy_risk_level: PrivacyRiskLevel;
  competitive_positioning: CompetitivePosition;
  
  // Traffic estimation (from Tranco)
  tranco_rank?: number | null;
  estimated_monthly_pageviews?: number | null;
  estimated_monthly_impressions?: number | null;
  traffic_confidence?: 'high' | 'medium' | 'low' | null;
  
  // Trend analysis (30-day rank history)
  tranco_rank_history?: RankHistoryEntry[] | null;
  rank_trend?: RankTrend | null;
  rank_change_30d?: number | null;
  
  // Raw data
  cookies_raw?: CookieData[];
  vendors_raw?: VendorData;
  network_requests_summary?: NetworkSummary;
}

export interface CookieData {
  name: string;
  domain: string;
  value?: string;
  path: string;
  expires: number;
  size: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
  isFirstParty: boolean;
  isThirdParty: boolean;
  wouldBeBlockedInSafari: boolean;
}

export interface VendorData {
  googleAnalytics: boolean;
  gtm: boolean;
  gcm: boolean;
  metaPixel: boolean;
  metaCapi: boolean;
  ttd: boolean;
  liveramp: boolean;
  id5: boolean;
  criteo: boolean;
  ppid: boolean;
  prebid: boolean;
  headerBidding: boolean;
  conversionApi: boolean;
  detectedSsps: string[];
  cmpVendor?: string;
  tcfCompliant: boolean;
  loadsPreConsent: boolean;
}

export interface NetworkSummary {
  totalRequests?: number;
  thirdPartyRequests?: number;
  trackingRequests?: number;
  adRequests?: number;
  // New fields from v3.0.0
  total_requests?: number;
  third_party_domains?: number;
  ad_tech_requests?: number;
  total_vendors?: number;
}

export interface PainPoint {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  estimatedLoss?: number;
  affectedDomains: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedGain: number;
  timeline: string;
  roi: string;
  priority: number;
  adfixusProduct: string;
}

export interface RevenueImpact {
  headline: string;
  totalMonthlyLoss: number;
  painPoints: PainPoint[];
  opportunities: Opportunity[];
  strategicPosition: CompetitivePosition;
  readinessGrade: string;
}

export interface ScanRequest {
  domains: string[];
  context?: PublisherContext;
}

export interface BrowserlessResponse {
  cookies: BrowserlessCookie[];
  html: string;
  networkRequests: BrowserlessNetworkRequest[];
}

export interface BrowserlessCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  size: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
}

export interface BrowserlessNetworkRequest {
  url: string;
  method: string;
  resourceType: string;
  status?: number;
}
