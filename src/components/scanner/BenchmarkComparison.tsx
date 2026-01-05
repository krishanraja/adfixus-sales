// Benchmark Comparison Component - Charts showing how scanned domains compare to industry averages

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { DomainResult } from '@/types/scanner';
import { BENCHMARKS } from '@/utils/revenueImpactScoring';

interface BenchmarkComparisonProps {
  results: DomainResult[];
}

interface BenchmarkMetric {
  label: string;
  yourValue: number;
  industryValue: number;
  format: 'percent' | 'number';
  lowerIsBetter?: boolean;
  description: string;
}

export function BenchmarkComparison({ results }: BenchmarkComparisonProps) {
  const successfulResults = results.filter(r => r.status === 'success');
  
  if (successfulResults.length === 0) {
    return null;
  }

  // Calculate your metrics
  const avgCookies = Math.round(
    successfulResults.reduce((sum, r) => sum + r.total_cookies, 0) / successfulResults.length
  );
  
  const avgThirdPartyRatio = successfulResults.reduce((sum, r) => {
    if (r.total_cookies === 0) return sum;
    return sum + (r.third_party_cookies / r.total_cookies);
  }, 0) / successfulResults.length;

  const cmpAdoptionRate = successfulResults.filter(r => r.cmp_vendor).length / successfulResults.length;
  
  const tcfComplianceRate = successfulResults.filter(r => r.tcf_compliant).length / successfulResults.length;
  
  const idSolutionRate = successfulResults.filter(r => 
    r.has_liveramp || r.has_id5 || r.has_ttd || r.has_ppid
  ).length / successfulResults.length;
  
  const conversionApiRate = successfulResults.filter(r => r.has_conversion_api).length / successfulResults.length;
  
  const avgAddressabilityGap = successfulResults.reduce((sum, r) => 
    sum + r.addressability_gap_pct, 0
  ) / successfulResults.length;

  const metrics: BenchmarkMetric[] = [
    {
      label: 'Cookies per Domain',
      yourValue: avgCookies,
      industryValue: BENCHMARKS.avgPublisherCookies,
      format: 'number',
      lowerIsBetter: true,
      description: 'Average cookies set on page load',
    },
    {
      label: 'Third-Party Cookie Ratio',
      yourValue: avgThirdPartyRatio * 100,
      industryValue: BENCHMARKS.avgThirdPartyRatio * 100,
      format: 'percent',
      lowerIsBetter: true,
      description: 'Percentage of cookies from third-party domains',
    },
    {
      label: 'CMP Adoption',
      yourValue: cmpAdoptionRate * 100,
      industryValue: BENCHMARKS.cmpAdoption * 100,
      format: 'percent',
      lowerIsBetter: false,
      description: 'Consent Management Platform presence',
    },
    {
      label: 'TCF 2.0 Compliance',
      yourValue: tcfComplianceRate * 100,
      industryValue: BENCHMARKS.tcfCompliantRate * 100,
      format: 'percent',
      lowerIsBetter: false,
      description: 'Full TCF 2.0 framework compliance',
    },
    {
      label: 'ID Solution Adoption',
      yourValue: idSolutionRate * 100,
      industryValue: BENCHMARKS.idSolutionAdoption * 100,
      format: 'percent',
      lowerIsBetter: false,
      description: 'Using identity solutions (LiveRamp, ID5, TTD, PPID)',
    },
    {
      label: 'Safari Addressability Gap',
      yourValue: avgAddressabilityGap,
      industryValue: BENCHMARKS.safariMarketShare * 100 * 0.5, // 50% of market share is typical gap
      format: 'percent',
      lowerIsBetter: true,
      description: 'Percentage of inventory unaddressable on Safari/Firefox',
    },
  ];

  const getTrendIcon = (metric: BenchmarkMetric) => {
    const diff = metric.yourValue - metric.industryValue;
    const isGood = metric.lowerIsBetter ? diff < 0 : diff > 0;
    const isNeutral = Math.abs(diff) < (metric.format === 'percent' ? 5 : 5);
    
    if (isNeutral) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    if (isGood) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    }
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const getTrendBadge = (metric: BenchmarkMetric) => {
    const diff = metric.yourValue - metric.industryValue;
    const pctDiff = Math.abs(diff / metric.industryValue * 100);
    const isGood = metric.lowerIsBetter ? diff < 0 : diff > 0;
    const isNeutral = Math.abs(diff) < (metric.format === 'percent' ? 5 : 5);
    
    if (isNeutral) {
      return <Badge variant="outline" className="border-border">On par</Badge>;
    }
    
    return (
      <Badge 
        variant="outline" 
        className={isGood ? 'text-success border-success' : 'text-destructive border-destructive'}
      >
        {isGood ? '+' : '-'}{Math.round(pctDiff)}% {isGood ? 'better' : 'worse'}
      </Badge>
    );
  };

  const formatValue = (value: number, format: 'percent' | 'number') => {
    if (format === 'percent') {
      return `${Math.round(value)}%`;
    }
    return Math.round(value).toString();
  };

  return (
    <section className="py-8 px-4 border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          How You Stack Up
        </h2>
        <p className="text-muted-foreground mb-6">
          Comparing your {successfulResults.length} scanned domain{successfulResults.length !== 1 ? 's' : ''} against industry benchmarks.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">
                    {metric.label}
                  </CardTitle>
                  {getTrendIcon(metric)}
                </div>
                <CardDescription className="text-xs">
                  {metric.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Your Value */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">You</span>
                      <span className="font-semibold text-foreground">
                        {formatValue(metric.yourValue, metric.format)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(metric.yourValue, 100)} 
                      className="h-2"
                    />
                  </div>
                  
                  {/* Industry Average */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Industry Avg</span>
                      <span className="text-muted-foreground">
                        {formatValue(metric.industryValue, metric.format)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(metric.industryValue, 100)} 
                      className="h-2 opacity-50"
                    />
                  </div>
                  
                  <div className="pt-2">
                    {getTrendBadge(metric)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
