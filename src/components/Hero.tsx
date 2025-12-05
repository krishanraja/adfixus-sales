
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
    <div className="max-w-2xl mx-auto flex-1 flex flex-col justify-center text-center animate-fade-in py-8">
      <Button 
        onClick={onStartQuiz}
        size="lg"
        className="px-8 md:px-10 py-5 md:py-6 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
      >
        Start Assessment
      </Button>
      <p className="text-xs md:text-sm text-muted-foreground mt-3 md:mt-4">Takes 2 minutes</p>
    </div>
  );
};
