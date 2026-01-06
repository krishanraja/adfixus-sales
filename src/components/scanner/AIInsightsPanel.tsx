import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Brain, Lightbulb, Target, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DomainResult, PublisherContext } from '@/types/scanner';
import { supabase } from '@/integrations/supabase/client';

interface AIInsightsPanelProps {
  results: DomainResult[];
  context?: PublisherContext;
  scanId: string;
}

interface AIInsights {
  executiveSummary: string;
  topRecommendations: string[];
  riskAssessment: string;
  competitorPositioning: string;
  ninetyDayRoadmap: string;
}

export function AIInsightsPanel({ results, context, scanId }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayedText, setDisplayedText] = useState('');

  const generateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setDisplayedText('');

    try {
      const response = await supabase.functions.invoke('generate-insights', {
        body: {
          results: results.map(r => ({
            domain: r.domain,
            addressability_gap_pct: r.addressability_gap_pct,
            competitive_positioning: r.competitive_positioning,
            privacy_risk_level: r.privacy_risk_level,
            has_conversion_api: r.has_conversion_api,
            has_ppid: r.has_ppid,
            tranco_rank: r.tranco_rank,
            rank_trend: r.rank_trend,
            estimated_monthly_impressions: r.estimated_monthly_impressions,
            id_bloat_severity: r.id_bloat_severity,
          })),
          context,
          scanId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate insights');
      }

      setInsights(response.data);
      
      // Typing animation for executive summary
      if (response.data?.executiveSummary) {
        const text = response.data.executiveSummary;
        let index = 0;
        const typeInterval = setInterval(() => {
          if (index < text.length) {
            setDisplayedText(text.slice(0, index + 1));
            index++;
          } else {
            clearInterval(typeInterval);
          }
        }, 15);
      }
    } catch (err) {
      console.error('AI insights error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (results.length > 0 && !insights && !isLoading) {
      generateInsights();
    }
  }, [results.length]);

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card className="glass-card border-primary/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          
          <CardHeader className="relative cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 animate-pulse-slow">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground flex items-center gap-2">
                    AI Strategic Analysis
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      GPT-4o
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Personalized recommendations for your portfolio
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    generateInsights();
                  }}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                </Button>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
          
          {isExpanded && (
            <CardContent className="relative space-y-6">
              {isLoading && !insights && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <img 
                      src="/adfixus%20icon.png" 
                      alt="AdFixus" 
                      className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain" 
                    />
                  </div>
                  <p className="mt-4 text-muted-foreground animate-pulse">
                    AI is analyzing your portfolio...
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Analysis Error</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={generateInsights} className="ml-auto">
                    Retry
                  </Button>
                </div>
              )}

              {insights && (
                <>
                  {/* Executive Summary */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      Executive Summary
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {displayedText || insights.executiveSummary}
                      {isLoading && displayedText && <span className="animate-pulse">|</span>}
                    </p>
                  </div>

                  {/* Top Recommendations */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Target className="h-4 w-4 text-success" />
                      Top Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {insights.topRecommendations.map((rec, i) => (
                        <li 
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Two Column Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Risk Assessment */}
                    <div className="space-y-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Risk Assessment
                      </h3>
                      <p className="text-sm text-muted-foreground">{insights.riskAssessment}</p>
                    </div>

                    {/* Competitor Positioning */}
                    <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Competitive Position
                      </h3>
                      <p className="text-sm text-muted-foreground">{insights.competitorPositioning}</p>
                    </div>
                  </div>

                  {/* 90-Day Roadmap */}
                  <div className="space-y-3 p-4 rounded-lg bg-success/5 border border-success/20">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-success" />
                      90-Day Roadmap
                    </h3>
                    <p className="text-sm text-muted-foreground">{insights.ninetyDayRoadmap}</p>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </section>
  );
}
