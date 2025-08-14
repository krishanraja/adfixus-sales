import { useState } from 'react';
import type { CalculatorInputs, CalculatorResults, QuizResults } from '@/types';

export const useCalculatorState = (quizResults?: QuizResults) => {
  const [formData, setFormData] = useState<CalculatorInputs>({
    monthlyPageviews: 5000000,
    adImpressionsPerPage: 3.2,
    webDisplayCPM: 4.50,
    webVideoCPM: 12.00,
    displayVideoSplit: 80,
    chromeShare: 50.63,
    numDomains: 1
  });

  const [calculationResults, setCalculationResults] = useState<CalculatorResults | null>(null);

  const handleInputChange = (field: keyof CalculatorInputs, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSalesMix = () => {
    if (quizResults?.scores?.['sales-mix']?.breakdown) {
      return quizResults.scores['sales-mix'].breakdown;
    }
    return { direct: 40, dealIds: 35, openExchange: 25 };
  };

  return {
    formData,
    calculationResults,
    setCalculationResults,
    handleInputChange,
    getSalesMix,
  };
};