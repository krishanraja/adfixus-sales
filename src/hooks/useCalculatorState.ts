import { useState } from 'react';
import type { CalculatorInputs, CalculatorResults, QuizResults } from '@/types';
import { DEFAULT_CALCULATOR_VALUES, INDUSTRY_BENCHMARKS, DEFAULT_SALES_MIX } from '@/constants';

export const useCalculatorState = (quizResults?: QuizResults) => {
  const [formData, setFormData] = useState<CalculatorInputs>({
    monthlyPageviews: DEFAULT_CALCULATOR_VALUES.MONTHLY_PAGEVIEWS,
    adImpressionsPerPage: DEFAULT_CALCULATOR_VALUES.AD_IMPRESSIONS_PER_PAGE,
    webDisplayCPM: DEFAULT_CALCULATOR_VALUES.WEB_DISPLAY_CPM,
    webVideoCPM: DEFAULT_CALCULATOR_VALUES.WEB_VIDEO_CPM,
    displayVideoSplit: DEFAULT_CALCULATOR_VALUES.DISPLAY_VIDEO_SPLIT,
    chromeShare: INDUSTRY_BENCHMARKS.US_CHROME_MARKET_SHARE,
    numDomains: DEFAULT_CALCULATOR_VALUES.NUM_DOMAINS
  });

  const [calculationResults, setCalculationResults] = useState<CalculatorResults | null>(null);

  const handleInputChange = (field: keyof CalculatorInputs, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSalesMix = () => {
    if (quizResults?.scores?.['sales-mix']?.breakdown) {
      return quizResults.scores['sales-mix'].breakdown;
    }
    return { ...DEFAULT_SALES_MIX };
  };

  return {
    formData,
    calculationResults,
    setCalculationResults,
    handleInputChange,
    getSalesMix,
  };
};