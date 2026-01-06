import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScannerAuth } from '@/hooks/useScannerAuth';
import { useDomainScan } from '@/hooks/useDomainScan';
import { generateRevenueImpact } from '@/utils/revenueImpactScoring';
import { generateScannerPdf, generateCsvExport } from '@/utils/scannerPdfGenerator';
import { formatTrafficNumber } from '@/utils/trafficEstimation';
import { BenchmarkComparison } from '@/components/scanner/BenchmarkComparison';
import { PortfolioTrafficSummary } from '@/components/scanner/PortfolioTrafficSummary';
import { AIInsightsPanel } from '@/components/scanner/AIInsightsPanel';
import { ChangeDetectionPanel } from '@/components/scanner/ChangeDetectionPanel';
import { RankTrendBadge } from '@/components/scanner/RankTrendBadge';
import { TrafficSparkline } from '@/components/scanner/TrafficSparkline';
import { AnimatedCounter } from '@/components/scanner/AnimatedCounter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
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
  BarChart3,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { DomainResult, CompetitivePosition, PublisherContext } from '@/types/scanner';
import adfixusLogo from '@/assets/adfixus-logo-scanner.png';

const MEETING_URL = 'https://outlook.office.com/book/SalesTeambooking@adfixus.com';

export default function ScannerResults() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useScannerAuth();
  const { scan, results, isLoading, error, loadScan } = useDomainScan();
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  
  // CRITICAL FIX: Track if we've already loaded this scan to prevent duplicate calls
  const loadedScanIdRef = useRef<string | null>(null);
  const hasNavigatedAwayRef = useRef(false);

  // Handle auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      hasNavigatedAwayRef.current = true;
      navigate('/');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load scan data - separate effect to avoid dependency issues
  useEffect(() => {
    // Don't load if auth is still loading or user isn't authenticated
    if (authLoading || !isAuthenticated || hasNavigatedAwayRef.current) {
      return;
    }

    // Don't reload if we already loaded this scan ID
    if (!scanId || loadedScanIdRef.current === scanId) {
      return;
    }

    console.log('[ScannerResults] Loading scan:', scanId);
    loadedScanIdRef.current = scanId;
    loadScan(scanId);
  }, [scanId, authLoading, isAuthenticated, loadScan]);

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

  const publisherContext: PublisherContext | undefined = scan ? {
    monthlyImpressions: scan.monthly_impressions ?? undefined,
    publisherVertical: scan.publisher_vertical as 'news' | 'entertainment' | 'auto' | 'finance' | 'lifestyle' | 'other' | undefined,
    ownedDomainsCount: scan.owned_domains_count ?? undefined,
  } : undefined;

  const revenueImpact = results.length > 0 
    ? generateRevenueImpact(results, publisherContext)
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

  // Define view states clearly - only ONE state can be active at a time
  const isProcessing = scan?.status === 'processing' || scan?.status === 'pending';
  const isCompleted = scan?.status === 'completed';
  const isFailed = scan?.status === 'failed';
  const progress = scan ? Math.min((scan.completed_domains / Math.max(scan.total_domains, 1)) * 100, 100) : 0;

  // Determine the current view state (mutually exclusive)
  type ViewState = 'auth_loading' | 'initial_loading' | 'processing' | 'error' | 'no_results' | 'results';
  
  const getViewState = (): ViewState => {
    if (authLoading) return 'auth_loading';
    if (error) return 'error';
    if (isLoading && !scan) return 'initial_loading';
    if (isProcessing) return 'processing';
    if (isCompleted && results.length === 0) return 'no_results';
    if (isCompleted && results.length > 0) return 'results';
    // Fallback to initial loading if scan exists but not completed
    if (scan && !isCompleted && !isProcessing) return 'processing';
    return 'initial_loading';
  };

  const viewState = getViewState();

  // UNIFIED LOADING SCREEN - Beautiful, single loading experience
  if (viewState === 'auth_loading' || viewState === 'initial_loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 hero-gradient pointer-events-none opacity-60" />
        
        <div className="relative text-center px-6">
          {/* Animated logo container */}
          <div className="relative mx-auto mb-8 w-32 h-32">
            {/* Outer ring - slow rotation */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[spin_8s_linear_infinite]" />
            
            {/* Middle ring - medium rotation */}
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-primary/30 animate-[spin_4s_linear_infinite_reverse]" />
            
            {/* Inner ring - fast rotation */}
            <div className="absolute inset-4 rounded-full border-4 border-primary/40 border-t-primary animate-spin" />
            
            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/adfixus%20icon.png" 
                alt="AdFixus" 
                className="h-12 w-12 object-contain animate-pulse" 
              />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {viewState === 'auth_loading' ? 'Authenticating...' : 'Loading Analysis'}
          </h2>
          
          <p className="text-muted-foreground max-w-sm mx-auto">
            {viewState === 'auth_loading' 
              ? 'Verifying your credentials'
              : 'Retrieving your scan results'
            }
          </p>
          
          {/* Subtle loading dots */}
          <div className="flex justify-center gap-1.5 mt-6">
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE - Clean error display
  if (viewState === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {/* Ambient background */}
        <div className="absolute inset-0 hero-gradient pointer-events-none opacity-40" />
        
        <Card className="relative max-w-md w-full glass-card border-destructive/30 overflow-hidden">
          {/* Error accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive/50 via-destructive to-destructive/50" />
          
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Error Loading Scan</h2>
            <p className="text-muted-foreground mb-8 whitespace-pre-wrap">{error}</p>
            <Button 
              onClick={() => navigate('/scanner/input')} 
              variant="outline"
              className="border-border/50 hover:bg-secondary/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scanner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPositionColor = (position: CompetitivePosition) => {
    switch (position) {
      case 'walled-garden-parity': return 'bg-success/20 text-success border-success/30';
      case 'middle-pack': return 'bg-warning/20 text-warning border-warning/30';
      case 'at-risk': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'commoditized': return 'bg-destructive/20 text-destructive border-destructive/30';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-primary';
    if (grade.startsWith('C')) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/scanner/input')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <span className="text-border hidden sm:inline">|</span>
            <img src={adfixusLogo} alt="AdFixus" className="h-6 object-contain hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border/50 hidden sm:flex"
              onClick={handleExportCsv}
              disabled={results.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border/50 hidden sm:flex"
              onClick={handleExportPdf}
              disabled={!revenueImpact}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button size="sm" className="btn-gradient" asChild>
              <a href={MEETING_URL} target="_blank" rel="noopener noreferrer">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Book Strategy Call</span>
                <span className="sm:hidden">Book Call</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* PROCESSING STATE - Beautiful scan progress UI */}
      {viewState === 'processing' && (
        <section className="relative py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <Card className="glass-card border-primary/20 overflow-hidden">
              {/* Top accent gradient */}
              <div className="h-1.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
              
              <CardContent className="pt-10 pb-10">
                {/* Animated scanner visual */}
                <div className="text-center mb-10">
                  <div className="relative mx-auto w-28 h-28 mb-8">
                    {/* Pulse effect */}
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30" />
                    
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[spin_6s_linear_infinite]" />
                    
                    {/* Progress ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-primary/20"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${progress * 3.14} 314`}
                        className="text-primary transition-all duration-500 ease-out"
                      />
                    </svg>
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-foreground mb-3">
                    AI Analysis in Progress
                  </h2>
                  
                  <p className="text-lg text-muted-foreground">
                    Scanning <span className="text-primary font-semibold">{scan?.completed_domains || 0}</span> of{' '}
                    <span className="text-foreground font-semibold">{scan?.total_domains || 0}</span> domains
                  </p>
                </div>
                
                {/* Progress bar */}
                <div className="mb-8">
                  <Progress value={progress} className="h-3" />
                </div>
                
                {/* Scan steps indicator */}
                <div className="flex justify-center gap-6 text-sm text-muted-foreground mb-8">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Analyzing cookies
                  </span>
                  <span className="text-border">•</span>
                  <span>Detecting vendors</span>
                  <span className="text-border">•</span>
                  <span>Calculating revenue impact</span>
                </div>
                
                {/* Domain results list */}
                {results.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Completed Scans
                    </h3>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                      {results.map((result, index) => (
                        <div 
                          key={result.id} 
                          className="flex items-center justify-between text-sm px-4 py-3 bg-secondary/30 rounded-lg border border-border/50 animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground font-medium">{result.domain}</span>
                          </div>
                          {result.status === 'success' || result.status === 'completed' ? (
                            <Badge className="bg-success/20 text-success border-success/30">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* NO RESULTS STATE - Clean empty state */}
      {viewState === 'no_results' && (
        <section className="relative py-16 px-4">
          <div className="container mx-auto max-w-md">
            <Card className="glass-card border-warning/30 overflow-hidden">
              {/* Warning accent bar */}
              <div className="h-1 bg-gradient-to-r from-warning/30 via-warning to-warning/30" />
              
              <CardContent className="pt-10 pb-10 text-center">
                <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-10 w-10 text-warning" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">No Results Found</h2>
                <p className="text-muted-foreground mb-8">
                  The scan completed but no domain results were found. This may indicate all domains failed to scan or were unreachable.
                </p>
                <Button 
                  onClick={() => navigate('/scanner/input')} 
                  variant="outline"
                  className="border-border/50 hover:bg-secondary/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Start New Scan
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* RESULTS CONTENT - Main results display */}
      {viewState === 'results' && revenueImpact && (
        <>
          {/* Executive Summary */}
          <section className="relative py-10 px-4 border-b border-border/50">
            <div className="container mx-auto max-w-6xl">
              <Card className="glass-card border-primary/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
                <CardContent className="relative pt-8 pb-8">
                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Headline */}
                    <div className="md:col-span-2 space-y-4">
                      <Badge className="bg-primary/10 text-primary border-primary/30">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Analysis Complete
                      </Badge>
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                        {revenueImpact.headline}
                      </h1>
                      <div className="flex flex-wrap gap-3">
                        <Badge className={getPositionColor(revenueImpact.strategicPosition)}>
                          {revenueImpact.strategicPosition.replace(/-/g, ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="border-border/50">
                          {results.length} Domains Scanned
                        </Badge>
                        {(() => {
                          const totalImpressions = results.reduce(
                            (sum, r) => sum + (r.estimated_monthly_impressions || 0), 
                            0
                          );
                          return totalImpressions > 0 ? (
                            <Badge className="bg-primary/10 text-primary border-primary/30">
                              <BarChart3 className="h-3 w-3 mr-1" />
                              {formatTrafficNumber(totalImpressions)} impressions/mo
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    {/* Grade */}
                    <div className="text-center md:text-right flex flex-col justify-center">
                      <p className="text-sm text-muted-foreground mb-2">2026 Readiness</p>
                      <div className={`text-7xl font-bold ${getGradeColor(revenueImpact.readinessGrade)} glow-effect`}>
                        {revenueImpact.readinessGrade}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Portfolio Traffic Summary */}
          <PortfolioTrafficSummary results={results} context={publisherContext} />

          {/* AI Insights Panel */}
          {scanId && (
            <AIInsightsPanel 
              results={results} 
              context={publisherContext} 
              scanId={scanId}
            />
          )}

          {/* Key Pain Points */}
          <section className="relative py-8 px-4">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                Critical Revenue Leaks
              </h2>
              <div className="grid md:grid-cols-3 gap-4 stagger-fade">
                {revenueImpact.painPoints.slice(0, 3).map((pain) => (
                  <Card key={pain.id} className="glass-card border-l-4 border-l-destructive border-destructive/20 scanner-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-foreground">{pain.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{pain.description}</p>
                      {pain.estimatedLoss && (
                        <div className="text-2xl font-bold text-destructive">
                          <AnimatedCounter 
                            value={pain.estimatedLoss} 
                            prefix="-$" 
                            suffix="/year"
                            format="currency"
                          />
                        </div>
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
          <section className="relative py-8 px-4 bg-card/30">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                Revenue Opportunities
              </h2>
              <div className="space-y-4 stagger-fade">
                {revenueImpact.opportunities.map((opp, index) => (
                  <Card key={opp.id} className="glass-card border-border/50 scanner-card">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                              {index + 1}
                            </span>
                            <h3 className="text-lg font-semibold text-foreground">{opp.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 ml-12">{opp.description}</p>
                          <div className="ml-12 flex flex-wrap gap-3 text-sm">
                            <Badge variant="outline" className="border-border/50 text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {opp.timeline}
                            </Badge>
                            <Badge className="bg-primary/10 text-primary border-primary/30">
                              {opp.adfixusProduct}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          {opp.estimatedGain > 0 && (
                            <div className="text-2xl font-bold text-success">
                              <AnimatedCounter 
                                value={opp.estimatedGain} 
                                prefix="+$"
                                format="currency"
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{opp.roi}</p>
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
          <section className="relative py-8 px-4">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                Domain Analysis
              </h2>
              <div className="space-y-3 stagger-fade">
                {results.map((result) => (
                  <Card key={result.id} className="glass-card border-border/50 overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-all"
                      onClick={() => toggleDomain(result.domain)}
                    >
                      <div className="flex items-center gap-4">
                        {result.status === 'success' ? (
                          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-success" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-destructive" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-foreground">{result.domain}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline"
                              className={
                                result.competitive_positioning === 'walled-garden-parity' ? 'text-success border-success/30 text-xs' :
                                result.competitive_positioning === 'middle-pack' ? 'text-warning border-warning/30 text-xs' :
                                result.competitive_positioning === 'at-risk' ? 'text-orange-400 border-orange-500/30 text-xs' :
                                'text-destructive border-destructive/30 text-xs'
                              }
                            >
                              {result.competitive_positioning?.replace(/-/g, ' ')}
                            </Badge>
                            <RankTrendBadge trend={result.rank_trend} change={result.rank_change_30d} size="sm" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <span className="text-sm font-medium text-foreground">
                            {Math.round(result.addressability_gap_pct)}% gap
                          </span>
                          {result.estimated_monthly_impressions && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1 justify-end mt-1">
                              <BarChart3 className="h-3 w-3" />
                              {formatTrafficNumber(result.estimated_monthly_impressions)}/mo
                            </span>
                          )}
                        </div>
                        {expandedDomains.has(result.domain) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    {expandedDomains.has(result.domain) && (
                      <div className="border-t border-border/50 p-5 bg-secondary/20">
                        <div className="grid md:grid-cols-4 gap-6">
                          {/* Traffic Volume & Trend */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-primary" />
                              Traffic Volume
                            </h4>
                            {result.tranco_rank ? (
                              <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Tranco Rank</span>
                                  <span className="text-foreground font-medium">#{result.tranco_rank.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Est. Impressions</span>
                                  <span className="text-foreground">
                                    {result.estimated_monthly_impressions 
                                      ? formatTrafficNumber(result.estimated_monthly_impressions) 
                                      : 'N/A'}/mo
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">30d Trend</span>
                                  <RankTrendBadge trend={result.rank_trend} change={result.rank_change_30d} size="sm" />
                                </div>
                                {result.tranco_rank_history && (
                                  <div className="mt-3 p-2 bg-background/50 rounded-lg">
                                    <TrafficSparkline 
                                      history={result.tranco_rank_history} 
                                      trend={result.rank_trend}
                                      height={50}
                                    />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No traffic data available</p>
                            )}
                          </div>
                          
                          {/* Cookie Analysis */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
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
                                <span className="text-destructive font-medium">{result.safari_blocked_cookies}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">ID Bloat</span>
                                <Badge 
                                  variant="outline"
                                  className={
                                    result.id_bloat_severity === 'critical' ? 'text-destructive border-destructive/30' :
                                    result.id_bloat_severity === 'high' ? 'text-orange-400 border-orange-500/30' :
                                    result.id_bloat_severity === 'medium' ? 'text-warning border-warning/30' :
                                    'text-success border-success/30'
                                  }
                                >
                                  {result.id_bloat_severity}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Vendors Detected */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                              <Eye className="h-4 w-4 text-primary" />
                              Vendors Detected
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {result.has_google_analytics && <Badge variant="secondary" className="text-xs">GA4</Badge>}
                              {result.has_gtm && <Badge variant="secondary" className="text-xs">GTM</Badge>}
                              {result.has_gcm && <Badge variant="secondary" className="text-xs">Consent Mode</Badge>}
                              {result.has_meta_pixel && <Badge variant="secondary" className="text-xs">Meta Pixel</Badge>}
                              {result.has_meta_capi && <Badge variant="secondary" className="text-xs">Meta Conversions API</Badge>}
                              {result.has_ttd && <Badge variant="secondary" className="text-xs">TTD</Badge>}
                              {result.has_liveramp && <Badge variant="secondary" className="text-xs">LiveRamp</Badge>}
                              {result.has_id5 && <Badge variant="secondary" className="text-xs">ID5</Badge>}
                              {result.has_criteo && <Badge variant="secondary" className="text-xs">Criteo</Badge>}
                              {result.has_prebid && <Badge variant="secondary" className="text-xs">Prebid</Badge>}
                              {result.has_ppid && <Badge variant="secondary" className="text-xs">Publisher 1P ID</Badge>}
                              {result.cmp_vendor && <Badge variant="outline" className="text-xs">{result.cmp_vendor}</Badge>}
                            </div>
                          </div>

                          {/* Privacy & Compliance */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              Privacy & Compliance
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Risk Level</span>
                                <Badge 
                                  variant="outline"
                                  className={
                                    result.privacy_risk_level === 'high-risk' ? 'text-destructive border-destructive/30' :
                                    result.privacy_risk_level === 'moderate' ? 'text-warning border-warning/30' :
                                    'text-success border-success/30'
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
                                  <span className="text-muted-foreground block mb-2">SSPs:</span>
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
                        
                        {/* Change Detection Panel */}
                        <div className="mt-4">
                          <ChangeDetectionPanel scanId={scanId || ''} domain={result.domain} />
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative py-16 px-4 border-t border-border/50">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 pointer-events-none" />
            <div className="container mx-auto max-w-4xl text-center relative">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Ready to Transform Your Revenue?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Let's Recover Your Lost Revenue
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
                Schedule a strategy call to discuss your personalized roadmap for 
                closing addressability gaps and unlocking performance budgets.
              </p>
              <Button size="lg" className="btn-gradient px-10 py-6 text-lg" asChild>
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
