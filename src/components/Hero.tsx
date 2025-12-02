
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
    <div className="max-w-2xl mx-auto mt-16 text-center animate-fade-in">
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
        Identity ROI Calculator
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
        See your revenue opportunity in 2 minutes
      </p>
      <Button 
        onClick={onStartQuiz}
        size="lg"
        className="px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
      >
        Start Assessment
      </Button>
      <p className="text-sm text-muted-foreground mt-4">Takes 2 minutes</p>
    </div>
  );
};
