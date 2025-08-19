
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Shield, Globe, TrendingUp } from 'lucide-react';
import { INDUSTRY_BENCHMARKS } from '@/constants';

interface HeroProps {
  onStartQuiz: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartQuiz }) => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-8">
          <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-5xl font-black text-foreground mb-4 whitespace-nowrap">
            ID Simulator
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover how much revenue you're losing to non-addressable inventory and ID durability gaps. 
            Get your Identity Health Score and calculate your potential uplift.
          </p>
        </div>
        
        <Button 
          onClick={onStartQuiz}
          size="lg"
          className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Start Your ROI Analysis
        </Button>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Identity Health Quiz
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Evaluate your current identity setup across durability, compliance, 
              and cross-domain visibility with our expert scorecard.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 text-center">
            <Globe className="w-12 h-12 text-brand-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Revenue Impact Calculator
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Input your traffic data and see exactly how much revenue 
              you're leaving on the table due to ID durability gaps.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Actionable Insights
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Get detailed recommendations and see your potential uplift 
              with AdFixus's ID durability technology.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="bg-card rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-foreground mb-8">
          Industry Benchmarks
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-revenue-loss mb-2">{INDUSTRY_BENCHMARKS.SAFARI_TRAFFIC_AVERAGE}%</div>
            <div className="text-muted-foreground text-sm">Safari Traffic Average</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning mb-2">{INDUSTRY_BENCHMARKS.UNAUTHENTICATED_USERS}%</div>
            <div className="text-muted-foreground text-sm">Unauthenticated Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning mb-2">{INDUSTRY_BENCHMARKS.TYPICAL_MATCH_RATE}%</div>
            <div className="text-muted-foreground text-sm">Typical Match Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-revenue-gain mb-2">{INDUSTRY_BENCHMARKS.AVERAGE_YIELD_UPLIFT}%</div>
            <div className="text-muted-foreground text-sm">Average Yield Uplift</div>
          </div>
        </div>
        <p className="text-xs italic text-muted-foreground mt-6 text-center">
          *Sources: StatCounter (Safari share, Jul 2025); Piano "Subscription Performance Benchmarks 2024"; Clearcode; PubMatic; Amazon Publisher Services.
        </p>
      </div>
    </div>
  );
};
