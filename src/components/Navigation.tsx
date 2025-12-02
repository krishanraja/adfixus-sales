import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Home, Calculator, FileText } from 'lucide-react';
import type { StepType } from '@/types';

interface NavigationProps {
  currentStep: StepType;
  onReset: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentStep, onReset }) => {
  const steps = [
    { id: 'hero', label: 'Home', icon: Home },
    { id: 'quiz', label: 'Identity Health', icon: FileText },
    { id: 'calculator', label: 'Revenue Calculator', icon: Calculator },
    { id: 'results', label: 'Results', icon: BarChart3 }
  ];

  return (
    <nav className="bg-transparent border-b border-border/30 sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-12">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div 
                  key={step.id} 
                  className={`w-2 h-2 rounded-full transition-all ${
                    isActive 
                      ? 'bg-primary w-6' 
                      : isCompleted 
                        ? 'bg-primary/60' 
                        : 'bg-muted-foreground/30'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
