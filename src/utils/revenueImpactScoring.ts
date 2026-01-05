// Revenue Impact Scoring Algorithm
// Converts technical scan results into executive-level pain points and opportunities

import type { 
  DomainResult, 
  IdBloatSeverity, 
  PrivacyRiskLevel, 
  CompetitivePosition,
  PainPoint,
  Opportunity,
  RevenueImpact,
  DomainScanSummary,
  PublisherContext
} from '@/types/scanner';

// Industry benchmarks (2026)
export const BENCHMARKS = {
  avgPublisherCookies: 47,
  avgThirdPartyRatio: 0.58,
  safariMarketShare: 0.52, // Safari + Firefox combined
  idSolutionAdoption: 0.62,
  cmpAdoption: 0.78,
  tcfCompliantRate: 0.34,
  cpmUpliftAddressable: 0.45, // 45% CPM lift for addressable vs contextual
  safariCpmPenalty: 0.30, // 30% lower CPM on unaddressable Safari traffic
  conversionApiBudgetCapture: 0.61, // Walled gardens capture 61% of spend via CAPI
  idGraphTechTax: 0.35, // 30-50% margin loss to middlemen
};

// CPM benchmarks by vertical
export const VERTICAL_CPMS: Record<string, number> = {
  news: 3.50,
  entertainment: 4.00,
  auto: 8.00,
  finance: 12.00,
  lifestyle: 5.00,
  other: 4.50,
};

export function calculateIdBloatSeverity(totalCookies: number): IdBloatSeverity {
  if (totalCookies > 100) return 'critical';
  if (totalCookies > 70) return 'high';
  if (totalCookies > 40) return 'medium';
  return 'low';
}

export function getIdBloatMessage(severity: IdBloatSeverity): string {
  switch (severity) {
    case 'critical':
      return 'Cookie bloat is inflating your CDP costs by 40-60%. Your tech stack is working against you.';
    case 'high':
      return 'ID bloat is costing you 25-40% more in CDP and analytics fees than necessary.';
    case 'medium':
      return 'Moderate cookie overhead detected. Optimization opportunity exists.';
    default:
      return 'Cookie footprint is within industry norms.';
  }
}

export function calculatePrivacyRiskLevel(
  loadsPreConsent: boolean,
  cmpVendor?: string,
  tcfCompliant?: boolean
): PrivacyRiskLevel {
  if (loadsPreConsent || !cmpVendor) return 'high-risk';
  if (!tcfCompliant) return 'moderate';
  return 'compliant';
}

export function getPrivacyRiskMessage(level: PrivacyRiskLevel): string {
  switch (level) {
    case 'high-risk':
      return 'This is a board-level risk. Pre-consent tracking exposes you to regulatory fines and advertiser blacklists.';
    case 'moderate':
      return 'CMP present but not fully compliant. Regulatory exposure exists.';
    default:
      return 'Privacy compliance in good standing.';
  }
}

export function calculateCompetitivePosition(
  hasConversionApi: boolean,
  hasPpid: boolean,
  hasIdGraph: boolean,
  thirdPartyRatio: number
): CompetitivePosition {
  // Best case: has conversion API and owned identity
  if (hasConversionApi && hasPpid) return 'walled-garden-parity';
  
  // Renting identity from graphs
  if (hasIdGraph && !hasPpid) return 'middle-pack';
  
  // Heavy third-party dependency without owned identity
  if (thirdPartyRatio > 0.6 && !hasPpid) return 'at-risk';
  
  // No identity solution at all
  if (!hasIdGraph && !hasPpid && !hasConversionApi) return 'commoditized';
  
  return 'middle-pack';
}

export function getCompetitivePositionMessage(position: CompetitivePosition): string {
  switch (position) {
    case 'walled-garden-parity':
      return 'Strong foundation with conversion API and owned identity. Positioned to compete for premium budgets.';
    case 'middle-pack':
      return 'Renting identity from ID graphs. Losing 30-50% margin to middlemen. Time to build your own moat.';
    case 'at-risk':
      return 'Your identity foundation is collapsing. 70%+ of your IDs are third-party cookies expiring in 2025.';
    case 'commoditized':
      return 'Contextual-only = middle-pack pricing. You\'re in a race to the bottom on open exchanges.';
  }
}

export function calculateSafariLossPct(
  safariBlockedCookies: number,
  totalCookies: number
): number {
  if (totalCookies === 0) return 0;
  const blockedPct = safariBlockedCookies / totalCookies;
  return blockedPct * BENCHMARKS.safariMarketShare * 100;
}

export function calculateAddressabilityGapPct(
  safariBlockedCookies: number,
  totalCookies: number
): number {
  if (totalCookies === 0) return BENCHMARKS.safariMarketShare * 100;
  const blockedPct = safariBlockedCookies / totalCookies;
  return blockedPct * BENCHMARKS.safariMarketShare * 100;
}

export function calculateMonthlyRevenueLoss(
  monthlyImpressions: number,
  addressabilityGapPct: number,
  cpm: number
): number {
  const lostImpressions = monthlyImpressions * (addressabilityGapPct / 100);
  const revenueLoss = (lostImpressions / 1000) * cpm * BENCHMARKS.safariCpmPenalty;
  return Math.round(revenueLoss);
}

export function calculateReadinessGrade(
  position: CompetitivePosition,
  privacyRisk: PrivacyRiskLevel,
  hasConversionApi: boolean,
  hasPpid: boolean
): string {
  let score = 0;
  
  // Position scoring (0-40 points)
  switch (position) {
    case 'walled-garden-parity': score += 40; break;
    case 'middle-pack': score += 25; break;
    case 'at-risk': score += 10; break;
    case 'commoditized': score += 0; break;
  }
  
  // Privacy scoring (0-20 points)
  switch (privacyRisk) {
    case 'compliant': score += 20; break;
    case 'moderate': score += 10; break;
    case 'high-risk': score += 0; break;
  }
  
  // Conversion API (0-25 points)
  if (hasConversionApi) score += 25;
  
  // PPID (0-15 points)
  if (hasPpid) score += 15;
  
  // Convert to grade
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function generatePainPoints(
  results: DomainResult[],
  context?: PublisherContext
): PainPoint[] {
  const painPoints: PainPoint[] = [];
  const cpm = context?.publisherVertical 
    ? VERTICAL_CPMS[context.publisherVertical] 
    : VERTICAL_CPMS.other;
  
  // Calculate total estimated impressions from Tranco data if no user-provided impressions
  const totalEstimatedImpressions = results.reduce(
    (sum, r) => sum + (r.estimated_monthly_impressions || 0), 
    0
  );
  
  // Use user-provided impressions first, then fall back to Tranco estimates
  const effectiveImpressions = context?.monthlyImpressions || totalEstimatedImpressions;
  
  // Safari Blindness
  const safariAffected = results.filter(r => r.safari_blocked_cookies > 0);
  if (safariAffected.length > 0) {
    const avgGap = safariAffected.reduce((sum, r) => sum + r.addressability_gap_pct, 0) / safariAffected.length;
    const estimatedLoss = effectiveImpressions > 0
      ? calculateMonthlyRevenueLoss(effectiveImpressions, avgGap, cpm)
      : undefined;
    
    painPoints.push({
      id: 'safari-blindness',
      title: 'Safari/Firefox Blindness',
      description: `${Math.round(avgGap)}% of your inventory is invisible to advertisers on Safari & Firefox.`,
      severity: avgGap > 30 ? 'critical' : avgGap > 20 ? 'high' : 'medium',
      estimatedLoss,
      affectedDomains: safariAffected.map(r => r.domain),
    });
  }
  
  // No Conversion API
  const noCapiDomains = results.filter(r => !r.has_conversion_api);
  if (noCapiDomains.length > 0) {
    const estimatedTam = effectiveImpressions > 0
      ? Math.round((effectiveImpressions / 1000) * cpm * BENCHMARKS.conversionApiBudgetCapture * 12)
      : undefined;
    
    painPoints.push({
      id: 'no-capi',
      title: 'Locked Out of Performance Budgets',
      description: 'Without Conversion API, you can\'t compete for performance advertising budgets that Meta/Google capture.',
      severity: 'critical',
      estimatedLoss: estimatedTam,
      affectedDomains: noCapiDomains.map(r => r.domain),
    });
  }
  
  // ID Bloat
  const bloatedDomains = results.filter(r => r.id_bloat_severity === 'critical' || r.id_bloat_severity === 'high');
  if (bloatedDomains.length > 0) {
    painPoints.push({
      id: 'id-bloat',
      title: 'Cookie Bloat Tax',
      description: 'Excessive cookies are inflating CDP costs and crushing campaign performance.',
      severity: bloatedDomains.some(r => r.id_bloat_severity === 'critical') ? 'high' : 'medium',
      affectedDomains: bloatedDomains.map(r => r.domain),
    });
  }
  
  // Tech Tax (using ID graphs without owned identity)
  const rentingIdentity = results.filter(r => 
    (r.has_liveramp || r.has_id5 || r.has_ttd) && !r.has_ppid
  );
  if (rentingIdentity.length > 0) {
    const techTaxLoss = effectiveImpressions > 0
      ? Math.round((effectiveImpressions / 1000) * cpm * BENCHMARKS.idGraphTechTax * 12)
      : undefined;
    
    painPoints.push({
      id: 'tech-tax',
      title: 'Renting Identity = Margin Hemorrhage',
      description: 'You\'re losing 30-50% margin to ID graph middlemen instead of building your own moat.',
      severity: 'high',
      estimatedLoss: techTaxLoss,
      affectedDomains: rentingIdentity.map(r => r.domain),
    });
  }
  
  // Privacy Risk
  const highRiskDomains = results.filter(r => r.privacy_risk_level === 'high-risk');
  if (highRiskDomains.length > 0) {
    painPoints.push({
      id: 'privacy-risk',
      title: 'Board-Level Regulatory Exposure',
      description: 'Pre-consent tracking exposes you to regulatory fines and advertiser blacklists.',
      severity: 'critical',
      affectedDomains: highRiskDomains.map(r => r.domain),
    });
  }
  
  // Cross-domain deduplication
  if (context?.ownedDomainsCount && context.ownedDomainsCount > 1) {
    const noPpidDomains = results.filter(r => !r.has_ppid);
    if (noPpidDomains.length > 0) {
      painPoints.push({
        id: 'cross-domain',
        title: 'Cross-Domain Deduplication Impossible',
        description: 'You\'re overcounting reach across properties. Advertisers don\'t trust your numbers.',
        severity: 'high',
        affectedDomains: noPpidDomains.map(r => r.domain),
      });
    }
  }
  
  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return painPoints.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function generateOpportunities(
  results: DomainResult[],
  context?: PublisherContext
): Opportunity[] {
  const opportunities: Opportunity[] = [];
  const cpm = context?.publisherVertical 
    ? VERTICAL_CPMS[context.publisherVertical] 
    : VERTICAL_CPMS.other;
  
  // Calculate total estimated impressions from Tranco data
  const totalEstimatedImpressions = results.reduce(
    (sum, r) => sum + (r.estimated_monthly_impressions || 0), 
    0
  );
  
  // Use user-provided impressions first, then fall back to Tranco estimates
  const effectiveImpressions = context?.monthlyImpressions || totalEstimatedImpressions;
  
  // Safari Recovery
  const avgGap = results.reduce((sum, r) => sum + r.addressability_gap_pct, 0) / results.length;
  if (avgGap > 10 && effectiveImpressions > 0) {
    const monthlyGain = calculateMonthlyRevenueLoss(effectiveImpressions, avgGap, cpm);
    opportunities.push({
      id: 'safari-recovery',
      title: 'Recover Safari/Firefox Traffic',
      description: 'Deploy server-side first-party ID to make Safari/Firefox traffic addressable.',
      estimatedGain: monthlyGain * 12,
      timeline: '2 weeks to deployment, 60 days to full realization',
      roi: '140% lift from Safari addressability recovery',
      priority: 1,
      adfixusProduct: 'AFxID',
    });
  }
  
  // Conversion API
  const noCapiCount = results.filter(r => !r.has_conversion_api).length;
  if (noCapiCount > 0 && effectiveImpressions > 0) {
    const tam = Math.round((effectiveImpressions / 1000) * cpm * 0.25 * 12);
    opportunities.push({
      id: 'capi-unlock',
      title: 'Unlock Performance Budget Access',
      description: 'Implement Conversion API to compete for performance advertising budgets.',
      estimatedGain: tam,
      timeline: '4 weeks technical setup, 90 days to first retained deals',
      roi: '3x addressable impressions, 2x CTR vs contextual',
      priority: 2,
      adfixusProduct: 'AFxID Conversion Bridge',
    });
  }
  
  // Tech Tax Elimination
  const rentingCount = results.filter(r => (r.has_liveramp || r.has_id5 || r.has_ttd) && !r.has_ppid).length;
  if (rentingCount > 0 && effectiveImpressions > 0) {
    const annualSavings = Math.round((effectiveImpressions / 1000) * cpm * BENCHMARKS.idGraphTechTax * 12);
    opportunities.push({
      id: 'tech-tax-elimination',
      title: 'Eliminate Tech Tax',
      description: 'Replace rented ID graphs with owned PPID infrastructure.',
      estimatedGain: annualSavings,
      timeline: '6 weeks federated deployment',
      roi: `$${(annualSavings / 12).toLocaleString()}/month saved on ID graph fees`,
      priority: 3,
      adfixusProduct: 'AFxID Publisher Suite',
    });
  }
  
  // Cross-domain deduplication
  if (context?.ownedDomainsCount && context.ownedDomainsCount > 1) {
    opportunities.push({
      id: 'deduplication',
      title: 'Cross-Domain Deduplication',
      description: 'Deploy federated identity across owned properties for accurate reach metrics.',
      estimatedGain: effectiveImpressions > 0
        ? Math.round((effectiveImpressions / 1000) * cpm * 0.15 * 12)
        : 0,
      timeline: '4 weeks technical, immediate reach accuracy improvement',
      roi: 'Premium deal flow restoration from verified reach metrics',
      priority: 4,
      adfixusProduct: 'AFxID Federated',
    });
  }
  
  // Privacy compliance
  const highRiskCount = results.filter(r => r.privacy_risk_level === 'high-risk').length;
  if (highRiskCount > 0) {
    opportunities.push({
      id: 'privacy-fix',
      title: 'Regulatory Risk Mitigation',
      description: 'Fix pre-consent tracking and deploy TCF 2.0 compliant CMP.',
      estimatedGain: 0, // Risk reduction, not revenue
      timeline: '2 weeks compliance update',
      roi: 'Eliminates regulatory fines + advertiser blacklist exposure',
      priority: 5,
      adfixusProduct: 'AFxID Privacy-First',
    });
  }
  
  return opportunities.sort((a, b) => a.priority - b.priority);
}

export function generateScanSummary(
  results: DomainResult[],
  context?: PublisherContext
): DomainScanSummary {
  const painPoints = generatePainPoints(results, context);
  const opportunities = generateOpportunities(results, context);
  
  // Calculate averages
  const avgAddressabilityGap = results.reduce((sum, r) => sum + r.addressability_gap_pct, 0) / results.length;
  
  // Determine worst-case severity
  const severityOrder: IdBloatSeverity[] = ['low', 'medium', 'high', 'critical'];
  const worstBloat = results.reduce((worst, r) => {
    return severityOrder.indexOf(r.id_bloat_severity) > severityOrder.indexOf(worst) 
      ? r.id_bloat_severity 
      : worst;
  }, 'low' as IdBloatSeverity);
  
  // Determine worst privacy risk
  const riskOrder: PrivacyRiskLevel[] = ['compliant', 'moderate', 'high-risk'];
  const worstRisk = results.reduce((worst, r) => {
    return riskOrder.indexOf(r.privacy_risk_level) > riskOrder.indexOf(worst)
      ? r.privacy_risk_level
      : worst;
  }, 'compliant' as PrivacyRiskLevel);
  
  // Determine overall position (worst case)
  const positionOrder: CompetitivePosition[] = ['walled-garden-parity', 'middle-pack', 'at-risk', 'commoditized'];
  const worstPosition = results.reduce((worst, r) => {
    return positionOrder.indexOf(r.competitive_positioning) > positionOrder.indexOf(worst)
      ? r.competitive_positioning
      : worst;
  }, 'walled-garden-parity' as CompetitivePosition);
  
  // Calculate total revenue loss
  const totalRevenueLoss = painPoints.reduce((sum, p) => sum + (p.estimatedLoss || 0), 0);
  
  // Calculate readiness grade based on aggregate
  const hasAnyCapi = results.some(r => r.has_conversion_api);
  const hasAnyPpid = results.some(r => r.has_ppid);
  const readinessGrade = calculateReadinessGrade(worstPosition, worstRisk, hasAnyCapi, hasAnyPpid);
  
  return {
    totalRevenueLoss,
    avgAddressabilityGap,
    avgIdBloatSeverity: worstBloat,
    overallPrivacyRisk: worstRisk,
    overallPosition: worstPosition,
    readinessGrade,
    painPoints: painPoints.slice(0, 3), // Top 3 pain points
    opportunities,
  };
}

export function generateRevenueImpact(
  results: DomainResult[],
  context?: PublisherContext
): RevenueImpact {
  const summary = generateScanSummary(results, context);
  
  const headline = summary.totalRevenueLoss > 0
    ? `You're Leaving $${summary.totalRevenueLoss.toLocaleString()}/Year on the Table`
    : `Your 2026 Readiness Grade: ${summary.readinessGrade}`;
  
  return {
    headline,
    totalMonthlyLoss: Math.round(summary.totalRevenueLoss / 12),
    painPoints: summary.painPoints,
    opportunities: summary.opportunities,
    strategicPosition: summary.overallPosition,
    readinessGrade: summary.readinessGrade,
  };
}
