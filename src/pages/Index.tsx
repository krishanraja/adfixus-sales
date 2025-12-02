
import React, { useState, lazy, Suspense } from 'react';
import { Navigation } from '../components/Navigation';
import { Hero } from '../components/Hero';
import type { StepType, QuizResults, CalculatorResults, LeadData } from '@/types';

// Lazy load all heavy components to reduce initial bundle
const IdentityHealthQuiz = lazy(() => import('../components/IdentityHealthQuiz').then(module => ({ default: module.IdentityHealthQuiz })));
const RevenueCalculator = lazy(() => import('../components/RevenueCalculator').then(module => ({ default: module.RevenueCalculator })));
const ResultsDashboard = lazy(() => import('../components/ResultsDashboard').then(module => ({ default: module.ResultsDashboard })));

// Lightweight loader for step transitions
const StepLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
  </div>
);

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
          <Suspense fallback={<StepLoader />}>
            <IdentityHealthQuiz onComplete={handleQuizComplete} />
          </Suspense>
        )}
        
        {currentStep === 'calculator' && (
          <Suspense fallback={<StepLoader />}>
            <RevenueCalculator 
              onComplete={handleCalculatorComplete} 
              quizResults={quizResults}
              onLeadCapture={handleLeadCapture}
            />
          </Suspense>
        )}
        
        {currentStep === 'results' && (
          <Suspense fallback={<StepLoader />}>
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
