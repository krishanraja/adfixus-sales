import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScannerAuth } from '@/hooks/useScannerAuth';
import { useDomainScan } from '@/hooks/useDomainScan';
import { generateRevenueImpact } from '@/utils/revenueImpactScoring';
import { generateScannerPdf, generateCsvExport } from '@/utils/scannerPdfGenerator';
import { BenchmarkComparison } from '@/components/scanner/BenchmarkComparison';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Shield,
  Eye,
  Cookie,
  Globe,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  FileSpreadsheet,
  BarChart3
} from 'lucide-react';
import type { DomainResult, CompetitivePosition } from '@/types/scanner';
import { formatTrafficNumber } from '@/utils/trafficEstimation';
import adfixusLogo from '@/assets/adfixus-logo-scanner.png';

const MEETING_URL = 'https://outlook.office.com/book/SalesTeambooking@adfixus.com';

export default function ScannerResults() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useScannerAuth();
  const { scan, results, isLoading, error, loadScan } = useDomainScan();
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
      return;
    }

    if (scanId && isAuthenticated) {
      loadScan(scanId);
    }
  }, [scanId, authLoading, isAuthenticated, navigate, loadScan]);

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  const revenueImpact = results.length > 0 
    ? generateRevenueImpact(results, {
        monthlyImpressions: scan?.monthly_impressions ?? undefined,
        publisherVertical: scan?.publisher_vertical as 'news' | 'entertainment' | 'auto' | 'finance' | 'lifestyle' | 'other' | undefined,
        ownedDomainsCount: scan?.owned_domains_count ?? undefined,
      })
    : null;

  const handleExportPdf = () => {
    if (revenueImpact && results.length > 0) {
      generateScannerPdf(results, revenueImpact);
    }
  };

  const handleExportCsv = () => {
    if (results.length > 0) {
      generateCsvExport(results);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card border-border">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Scan</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/scanner/input')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scanner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProcessing = scan?.status === 'processing' || scan?.status === 'pending';
  const progress = scan ? (scan.completed_domains / scan.total_domains) * 100 : 0;

  const getPositionColor = (position: CompetitivePosition) => {
    switch (position) {
      case 'walled-garden-parity': return 'bg-success text-success-foreground';
      case 'middle-pack': return 'bg-warning text-warning-foreground';
      case 'at-risk': return 'bg-orange-500 text-white';
      case 'commoditized': return 'bg-destructive text-destructive-foreground';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-primary';
    if (grade.startsWith('C')) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/scanner/input')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <span className="text-muted-foreground">|</span>
            <img src={adfixusLogo} alt="AdFixus" className="h-6 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border"
              onClick={handleExportCsv}
              disabled={results.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border"
              onClick={handleExportPdf}
              disabled={!revenueImpact}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button size="sm" className="btn-gradient" asChild>
              <a href={MEETING_URL} target="_blank" rel="noopener noreferrer">
                <Calendar className="h-4 w-4 mr-2" />
                Book Strategy Call
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Processing State */}
      {isProcessing && (
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-foreground">Analyzing Domains...</h2>
                  <p className="text-muted-foreground mt-2">
                    Scanning {scan?.completed_domains || 0} of {scan?.total_domains || 0} domains
                  </p>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="mt-6 grid gap-2">
                  {results.map((result) => (
                    <div key={result.id} className="flex items-center justify-between text-sm px-3 py-2 bg-secondary rounded">
                      <span className="text-foreground">{result.domain}</span>
                      {result.status === 'success' ? (
                        <Badge variant="outline" className="text-success border-success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive border-destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Results Content */}
      {!isProcessing && revenueImpact && (
        <>
          {/* Executive Summary */}
          <section className="py-8 px-4 border-b border-border">
            <div className="container mx-auto max-w-6xl">
              <Card className="bg-gradient-to-br from-card to-card/80 border-primary/20">
                <CardContent className="pt-8 pb-6">
                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Headline */}
                    <div className="md:col-span-2">
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        {revenueImpact.headline}
                      </h1>
                      <div className="flex flex-wrap gap-3">
                        <Badge className={getPositionColor(revenueImpact.strategicPosition)}>
                          {revenueImpact.strategicPosition.replace(/-/g, ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="border-border">
                          {results.length} Domains Scanned
                        </Badge>
                        {(() => {
                          const totalImpressions = results.reduce(
                            (sum, r) => sum + (r.estimated_monthly_impressions || 0), 
                            0
                          );
                          return totalImpressions > 0 ? (
                            <Badge variant="outline" className="border-primary text-primary">
                              <BarChart3 className="h-3 w-3 mr-1" />
                              {formatTrafficNumber(totalImpressions)} impressions/mo
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    {/* Grade */}
                    <div className="text-center md:text-right">
                      <p className="text-sm text-muted-foreground mb-2">2026 Readiness</p>
                      <div className={`text-6xl font-bold ${getGradeColor(revenueImpact.readinessGrade)}`}>
                        {revenueImpact.readinessGrade}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Key Pain Points */}
          <section className="py-8 px-4">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                Critical Revenue Leaks
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {revenueImpact.painPoints.slice(0, 3).map((pain) => (
                  <Card key={pain.id} className="bg-card border-border border-l-4 border-l-destructive">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-foreground">{pain.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{pain.description}</p>
                      {pain.estimatedLoss && (
                        <p className="text-2xl font-bold text-destructive">
                          ${pain.estimatedLoss.toLocaleString()}/year
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Affects {pain.affectedDomains.length} domain{pain.affectedDomains.length !== 1 ? 's' : ''}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Revenue Opportunities */}
          <section className="py-8 px-4 bg-card/30">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-success" />
                Revenue Opportunities
              </h2>
              <div className="space-y-4">
                {revenueImpact.opportunities.map((opp, index) => (
                  <Card key={opp.id} className="bg-card border-border">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                              {index + 1}
                            </span>
                            <h3 className="text-lg font-semibold text-foreground">{opp.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 ml-11">{opp.description}</p>
                          <div className="ml-11 flex flex-wrap gap-4 text-sm">
                            <span className="text-muted-foreground">
                              <Clock className="h-4 w-4 inline mr-1" />
                              {opp.timeline}
                            </span>
                            <Badge variant="outline" className="border-primary text-primary">
                              {opp.adfixusProduct}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          {opp.estimatedGain > 0 && (
                            <p className="text-2xl font-bold text-success">
                              +${opp.estimatedGain.toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">{opp.roi}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Benchmark Comparison */}
          <BenchmarkComparison results={results} />

          {/* Domain-by-Domain Results */}
          <section className="py-8 px-4">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                Domain Analysis
              </h2>
              <div className="space-y-2">
                {results.map((result) => (
                  <Card key={result.id} className="bg-card border-border">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => toggleDomain(result.domain)}
                    >
                      <div className="flex items-center gap-4">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-medium text-foreground">{result.domain}</span>
                        <Badge 
                          variant="outline" 
                          className={
                            result.competitive_positioning === 'walled-garden-parity' ? 'text-success border-success' :
                            result.competitive_positioning === 'middle-pack' ? 'text-warning border-warning' :
                            result.competitive_positioning === 'at-risk' ? 'text-orange-500 border-orange-500' :
                            'text-destructive border-destructive'
                          }
                        >
                          {result.competitive_positioning?.replace(/-/g, ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {Math.round(result.addressability_gap_pct)}% gap
                        </span>
                        {result.estimated_monthly_impressions && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {formatTrafficNumber(result.estimated_monthly_impressions)}/mo
                          </span>
                        )}
                        {expandedDomains.has(result.domain) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    {expandedDomains.has(result.domain) && (
                      <div className="border-t border-border p-4 bg-secondary/30">
                        <div className="grid md:grid-cols-4 gap-6">
                          {/* Traffic Estimation */}
                          {result.tranco_rank && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Traffic Volume
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Tranco Rank</span>
                                  <span className="text-foreground">#{result.tranco_rank.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Est. Pageviews</span>
                                  <span className="text-foreground">
                                    {result.estimated_monthly_pageviews 
                                      ? formatTrafficNumber(result.estimated_monthly_pageviews) 
                                      : 'N/A'}/mo
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Est. Impressions</span>
                                  <span className="text-foreground">
                                    {result.estimated_monthly_impressions 
                                      ? formatTrafficNumber(result.estimated_monthly_impressions) 
                                      : 'N/A'}/mo
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Confidence</span>
                                  <Badge 
                                    variant="outline"
                                    className={
                                      result.traffic_confidence === 'high' ? 'text-success border-success' :
                                      result.traffic_confidence === 'medium' ? 'text-warning border-warning' :
                                      'text-muted-foreground border-muted-foreground'
                                    }
                                  >
                                    {result.traffic_confidence || 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Cookie Analysis */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                              <Cookie className="h-4 w-4 text-primary" />
                              Cookie Analysis
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Cookies</span>
                                <span className="text-foreground">{result.total_cookies}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">First-Party</span>
                                <span className="text-foreground">{result.first_party_cookies}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Third-Party</span>
                                <span className="text-foreground">{result.third_party_cookies}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Safari Blocked</span>
                                <span className="text-destructive">{result.safari_blocked_cookies}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ID Bloat</span>
                                <Badge 
                                  variant="outline"
                                  className={
                                    result.id_bloat_severity === 'critical' ? 'text-destructive border-destructive' :
                                    result.id_bloat_severity === 'high' ? 'text-orange-500 border-orange-500' :
                                    result.id_bloat_severity === 'medium' ? 'text-warning border-warning' :
                                    'text-success border-success'
                                  }
                                >
                                  {result.id_bloat_severity}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Vendors Detected */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                              <Eye className="h-4 w-4 text-primary" />
                              Vendors Detected
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {result.has_google_analytics && <Badge variant="secondary">GA4</Badge>}
                              {result.has_gtm && <Badge variant="secondary">GTM</Badge>}
                              {result.has_gcm && <Badge variant="secondary">GCM</Badge>}
                              {result.has_meta_pixel && <Badge variant="secondary">Meta Pixel</Badge>}
                              {result.has_meta_capi && <Badge className="bg-success">CAPI</Badge>}
                              {result.has_ttd && <Badge variant="secondary">TTD</Badge>}
                              {result.has_liveramp && <Badge variant="secondary">LiveRamp</Badge>}
                              {result.has_id5 && <Badge variant="secondary">ID5</Badge>}
                              {result.has_criteo && <Badge variant="secondary">Criteo</Badge>}
                              {result.has_prebid && <Badge variant="secondary">Prebid</Badge>}
                              {result.has_ppid && <Badge className="bg-success">PPID</Badge>}
                              {result.cmp_vendor && <Badge variant="outline">{result.cmp_vendor}</Badge>}
                            </div>
                          </div>

                          {/* Privacy & Compliance */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              Privacy & Compliance
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Risk Level</span>
                                <Badge 
                                  variant="outline"
                                  className={
                                    result.privacy_risk_level === 'high-risk' ? 'text-destructive border-destructive' :
                                    result.privacy_risk_level === 'moderate' ? 'text-warning border-warning' :
                                    'text-success border-success'
                                  }
                                >
                                  {result.privacy_risk_level}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">TCF 2.0</span>
                                <span className={result.tcf_compliant ? 'text-success' : 'text-destructive'}>
                                  {result.tcf_compliant ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Pre-consent Tracking</span>
                                <span className={result.loads_pre_consent ? 'text-destructive' : 'text-success'}>
                                  {result.loads_pre_consent ? 'Yes ⚠️' : 'No'}
                                </span>
                              </div>
                              {result.detected_ssps && result.detected_ssps.length > 0 && (
                                <div className="pt-2">
                                  <span className="text-muted-foreground block mb-1">SSPs:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {result.detected_ssps.map((ssp, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {ssp}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-12 px-4 bg-gradient-to-r from-primary/10 to-primary/5 border-t border-border">
            <div className="container mx-auto max-w-4xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Ready to Recover Your Lost Revenue?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Schedule a strategy call to discuss your personalized roadmap for 
                closing addressability gaps and unlocking performance budgets.
              </p>
              <Button size="lg" className="btn-gradient px-8" asChild>
                <a href={MEETING_URL} target="_blank" rel="noopener noreferrer">
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Strategy Call
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
