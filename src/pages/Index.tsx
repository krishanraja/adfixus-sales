
import React, { useState, lazy, Suspense } from 'react';
import { IdentityHealthQuiz } from '../components/IdentityHealthQuiz';
import { RevenueCalculator } from '../components/RevenueCalculator';
import { Navigation } from '../components/Navigation';
import { Hero } from '../components/Hero';
import type { StepType, QuizResults, CalculatorResults, LeadData } from '@/types';

// Lazy load ResultsDashboard (contains recharts - heavy library)
const ResultsDashboard = lazy(() => import('../components/ResultsDashboard').then(module => ({ default: module.ResultsDashboard })));

const Index = () => {
  const [currentStep, setCurrentStep] = useState<StepType>('hero');
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [calculatorResults, setCalculatorResults] = useState<CalculatorResults | null>(null);
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  const handleLeadCapture = (data: LeadData) => {
    setLeadData(data);
    setCurrentStep('results');
  };

  const handleQuizComplete = (results: QuizResults) => {
    setQuizResults(results);
    setCurrentStep('calculator');
  };

  const handleCalculatorComplete = (results: CalculatorResults) => {
    setCalculatorResults(results);
    setCurrentStep('results');
  };

  const resetSimulation = () => {
    setCurrentStep('hero');
    setQuizResults(null);
    setCalculatorResults(null);
    setLeadData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentStep={currentStep} onReset={resetSimulation} />
      
      <div className="container mx-auto px-4 py-8">
        {currentStep === 'hero' && (
          <Hero onStartQuiz={() => setCurrentStep('quiz')} />
        )}
        
        
        {currentStep === 'quiz' && (
          <IdentityHealthQuiz onComplete={handleQuizComplete} />
        )}
        
        {currentStep === 'calculator' && (
          <RevenueCalculator 
            onComplete={handleCalculatorComplete} 
            quizResults={quizResults}
            onLeadCapture={handleLeadCapture}
          />
        )}
        
        {currentStep === 'results' && (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-muted-foreground">Loading results...</div></div>}>
            <ResultsDashboard 
              quizResults={quizResults}
              calculatorResults={calculatorResults}
              leadData={leadData}
              onReset={resetSimulation}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default Index;
