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
    <nav className="bg-card shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="hidden md:flex items-center space-x-6 flex-1">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                    isActive 
                      ? 'bg-[rgba(7,192,248,0.2)] text-primary font-medium' 
                      : isCompleted 
                        ? 'text-accent' 
                        : 'text-muted-foreground'
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span>{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${isCompleted ? 'bg-accent' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
