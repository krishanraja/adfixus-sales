
import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Home, Calculator, FileText } from 'lucide-react';

interface NavigationProps {
  currentStep: string;
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
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              AdFixus Identity ROI Simulator
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : isCompleted 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span>{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReset}
            className="text-gray-600 hover:text-gray-900"
          >
            Reset
          </Button>
        </div>
      </div>
    </nav>
  );
};
