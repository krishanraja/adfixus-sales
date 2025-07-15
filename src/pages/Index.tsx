
import React, { useState } from 'react';
import { IdentityHealthQuiz } from '../components/IdentityHealthQuiz';
import { RevenueCalculator } from '../components/RevenueCalculator';
import { ResultsDashboard } from '../components/ResultsDashboard';
import { Navigation } from '../components/Navigation';
import { Hero } from '../components/Hero';
import { LeadCaptureForm } from '../components/LeadCaptureForm';

const Index = () => {
  const [currentStep, setCurrentStep] = useState('hero'); // hero, leadCapture, quiz, calculator, results
  const [quizResults, setQuizResults] = useState(null);
  const [calculatorResults, setCalculatorResults] = useState(null);
  const [leadData, setLeadData] = useState(null);

  const handleLeadCapture = (data) => {
    console.log('Lead captured:', data);
    setLeadData(data);
    setCurrentStep('quiz');
  };

  const handleQuizComplete = (results) => {
    console.log('Quiz completed:', results);
    setQuizResults(results);
    setCurrentStep('calculator');
  };

  const handleCalculatorComplete = (results) => {
    console.log('Calculator completed:', results);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <Navigation currentStep={currentStep} onReset={resetSimulation} />
      
      <div className="container mx-auto px-4 py-8">
        {currentStep === 'hero' && (
          <Hero onStartQuiz={() => setCurrentStep('leadCapture')} />
        )}
        
        {currentStep === 'leadCapture' && (
          <LeadCaptureForm onSubmitSuccess={handleLeadCapture} />
        )}
        
        {currentStep === 'quiz' && (
          <IdentityHealthQuiz onComplete={handleQuizComplete} />
        )}
        
        {currentStep === 'calculator' && (
          <RevenueCalculator onComplete={handleCalculatorComplete} quizResults={quizResults} />
        )}
        
        {currentStep === 'results' && (
          <ResultsDashboard 
            quizResults={quizResults}
            calculatorResults={calculatorResults}
            leadData={leadData}
            onReset={resetSimulation}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
