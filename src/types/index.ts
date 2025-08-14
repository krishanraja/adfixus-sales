// Shared TypeScript interfaces and types

export interface QuizResults {
  overallScore: number;
  overallGrade: string;
  scores: Record<string, {
    score: number;
    grade: string;
    breakdown?: Record<string, number>;
  }>;
  answers: Record<string, string>;
}

export interface CalculatorInputs {
  monthlyPageviews: number;
  adImpressionsPerPage: number;
  webDisplayCPM: number;
  webVideoCPM: number;
  displayVideoSplit: number;
  chromeShare: number;
  numDomains: number;
}

export interface CalculatorResults {
  inputs: CalculatorInputs;
  currentRevenue: number;
  breakdown: {
    display: {
      impressions: number;
      addressableImpressions: number;
      currentRevenue: number;
      cpm: number;
      newlyAddressable: number;
      uplift: number;
    };
    video: {
      impressions: number;
      addressableImpressions: number;
      currentRevenue: number;
      cpm: number;
      newlyAddressable: number;
      uplift: number;
    };
    totalAdImpressions: number;
    chromeShare: number;
    currentAddressability: number;
    addressabilityImprovement: number;
    salesMix: {
      direct: number;
      dealIds: number;
      openExchange: number;
    };
  };
  unaddressableInventory: {
    impressions: number;
    percentage: number;
    lostRevenue: number;
    display: {
      impressions: number;
      lostRevenue: number;
    };
    video: {
      impressions: number;
      lostRevenue: number;
    };
  };
  uplift: {
    newlyAddressableImpressions: number;
    monthlyRevenue: number;
    cpmImprovement: number;
    totalMonthlyUplift: number;
    totalAnnualUplift: number;
    percentageImprovement: number;
    display: {
      monthlyUplift: number;
      annualUplift: number;
    };
    video: {
      monthlyUplift: number;
      annualUplift: number;
    };
  };
}

export interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
}

export type StepType = 'hero' | 'quiz' | 'calculator' | 'results';