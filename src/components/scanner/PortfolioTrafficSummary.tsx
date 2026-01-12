import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3, DollarSign, AlertTriangle, Sparkles } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { ConfidenceBreakdown } from './ConfidenceBreakdown';
import type { DomainResult, PublisherContext } from '@/types/scanner';
import { VERTICAL_CPMS, calculateMonthlyRevenueLoss } from '@/utils/revenueImpactScoring';

interface PortfolioTrafficSummaryProps {
  results: DomainResult[];
  context?: PublisherContext;
}

export function PortfolioTrafficSummary({ results, context }: PortfolioTrafficSummaryProps) {
  // Calculate totals
  const totalMonthlyImpressions = results.reduce(
    (sum, r) => sum + (r.estimated_monthly_impressions || 0),
    0
  );
  
  // Calculate average addressability gap - exclude failed domains
  const validResults = results.filter(r => 
    r.status === 'success' && 
    r.addressability_gap_pct !== null && 
    r.addressability_gap_pct !== undefined
  );
  const avgAddressabilityGap = validResults.length > 0
    ? validResults.reduce((sum, r) => sum + (r.addressability_gap_pct || 0), 0) / validResults.length
    : 0;
  
  const cpm = context?.publisherVertical
    ? VERTICAL_CPMS[context.publisherVertical]
    : VERTICAL_CPMS.other;
  
  const estimatedMonthlyRevenue = Math.round((totalMonthlyImpressions / 1000) * cpm);
  
  // Use the same calculation as pain points (with CPM penalty)
  const monthlyLoss = totalMonthlyImpressions > 0 && avgAddressabilityGap > 0
    ? calculateMonthlyRevenueLoss(totalMonthlyImpressions, avgAddressabilityGap, cpm)
    : 0;
  const estimatedAnnualLoss = Math.round(monthlyLoss * 12);
  
  // Trend breakdown
  const growingDomains = results.filter(r => r.rank_trend === 'growing').length;
  const decliningDomains = results.filter(r => r.rank_trend === 'declining').length;
  const stableDomains = results.filter(r => r.rank_trend === 'stable').length;
  
  // Average Tranco rank (only for ranked domains)
  const rankedResults = results.filter(r => r.tranco_rank);
  const avgRank = rankedResults.length > 0
    ? Math.round(rankedResults.reduce((sum, r) => sum + (r.tranco_rank || 0), 0) / rankedResults.length)
    : null;

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Portfolio Traffic Intelligence</h2>
            <p className="text-sm text-muted-foreground">AI-powered traffic analysis across your domains</p>
          </div>
          <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by AI
          </Badge>
        </div>
        
        <Card className="glass-card border-primary/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
          <CardContent className="relative pt-6">
            <div className="grid md:grid-cols-4 gap-6">
              {/* Total Impressions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <BarChart3 className="h-4 w-4" />
                  Monthly Impressions
                </div>
                <div className="text-3xl font-bold text-foreground">
                  <AnimatedCounter 
                    value={totalMonthlyImpressions} 
                    format="abbreviated"
                    className="gradient-text"
                  />
                </div>
                {avgRank && (
                  <p className="text-xs text-muted-foreground">
                    Avg. rank #{avgRank.toLocaleString()}
                  </p>
                )}
              </div>
              
              {/* Estimated Revenue */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <DollarSign className="h-4 w-4" />
                  Est. Monthly Revenue
                </div>
                <div className="text-3xl font-bold text-success">
                  <AnimatedCounter 
                    value={estimatedMonthlyRevenue} 
                    prefix="$"
                    format="currency"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  @ ${cpm.toFixed(2)} CPM
                </p>
              </div>
              
              {/* Annual Loss */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Annual Revenue at Risk
                </div>
                <div className="text-3xl font-bold text-destructive">
                  <AnimatedCounter 
                    value={estimatedAnnualLoss} 
                    prefix="-$"
                    format="currency"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(avgAddressabilityGap)}% addressability gap
                </p>
              </div>
              
              {/* Confidence Breakdown */}
              <div className="flex flex-col items-center justify-center">
                <ConfidenceBreakdown results={results} size={100} />
                <p className="text-xs text-muted-foreground mt-2">Traffic Confidence</p>
              </div>
            </div>
            
            {/* Portfolio Momentum */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Portfolio Momentum (30d)</span>
                <div className="flex items-center gap-4">
                  {growingDomains > 0 && (
                    <Badge className="bg-success/20 text-success border-success/30">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {growingDomains} Growing
                    </Badge>
                  )}
                  {stableDomains > 0 && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Minus className="h-3 w-3 mr-1" />
                      {stableDomains} Stable
                    </Badge>
                  )}
                  {decliningDomains > 0 && (
                    <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {decliningDomains} Declining
                    </Badge>
                  )}
                  {growingDomains === 0 && stableDomains === 0 && decliningDomains === 0 && (
                    <span className="text-muted-foreground text-sm">No trend data available</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
