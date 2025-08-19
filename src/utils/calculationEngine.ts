import type { CalculatorInputs, CalculatorResults, QuizResults } from '@/types';
import { 
  INDUSTRY_BENCHMARKS, 
  DEFAULT_SALES_MIX, 
  ID_MULTIPLICATION_FACTORS,
  RAMP_UP_SCHEDULE 
} from '@/constants';

export class CalculationEngine {
  static calculateRevenue(
    inputs: CalculatorInputs,
    quizResults?: QuizResults
  ): CalculatorResults {
    const {
      monthlyPageviews,
      adImpressionsPerPage,
      webDisplayCPM,
      webVideoCPM,
      displayVideoSplit,
      chromeShare,
      numDomains
    } = inputs;

    const salesMix = this.getSalesMix(quizResults);
    const totalAdImpressions = monthlyPageviews * adImpressionsPerPage;
    
    // Split inventory into display and video
    const displayImpressions = totalAdImpressions * (displayVideoSplit / 100);
    const videoImpressions = totalAdImpressions * ((100 - displayVideoSplit) / 100);

    // Calculate addressability based on browser strategy
    const currentAddressability = this.calculateCurrentAddressability(chromeShare, quizResults);
    const addressableImpressions = totalAdImpressions * (currentAddressability / 100);
    const unaddressableImpressions = totalAdImpressions * ((100 - currentAddressability) / 100);
    
    // Split addressable/unaddressable inventory by display/video
    const addressableDisplay = addressableImpressions * (displayVideoSplit / 100);
    const addressableVideo = addressableImpressions * ((100 - displayVideoSplit) / 100);
    const unaddressableDisplay = unaddressableImpressions * (displayVideoSplit / 100);
    const unaddressableVideo = unaddressableImpressions * ((100 - displayVideoSplit) / 100);
    
    // With AdFixus assumptions - 100% addressability achieved
    const adFixusAddressability = 100;
    const newlyAddressable = totalAdImpressions * ((adFixusAddressability - currentAddressability) / 100);
    const newlyAddressableDisplay = newlyAddressable * (displayVideoSplit / 100);
    const newlyAddressableVideo = newlyAddressable * ((100 - displayVideoSplit) / 100);
    
    // Revenue calculations
    const currentDisplayRevenue = (addressableDisplay / 1000) * webDisplayCPM;
    const currentVideoRevenue = (addressableVideo / 1000) * webVideoCPM;
    const currentRevenue = currentDisplayRevenue + currentVideoRevenue;
    
    const lostDisplayRevenue = (unaddressableDisplay / 1000) * webDisplayCPM;
    const lostVideoRevenue = (unaddressableVideo / 1000) * webVideoCPM;
    const lostRevenue = lostDisplayRevenue + lostVideoRevenue;
    
    const potentialDisplayUplift = (newlyAddressableDisplay / 1000) * webDisplayCPM;
    const potentialVideoUplift = (newlyAddressableVideo / 1000) * webVideoCPM;
    const potentialUplift = potentialDisplayUplift + potentialVideoUplift;
    
    // CPM improvement for newly addressable inventory
    const improvedDisplayCPM = webDisplayCPM * INDUSTRY_BENCHMARKS.CPM_IMPROVEMENT_FACTOR;
    const improvedVideoCPM = webVideoCPM * INDUSTRY_BENCHMARKS.CPM_IMPROVEMENT_FACTOR;
    const displayCpmUplift = (newlyAddressableDisplay / 1000) * (improvedDisplayCPM - webDisplayCPM);
    const videoCpmUplift = (newlyAddressableVideo / 1000) * (improvedVideoCPM - webVideoCPM);
    const cpmUplift = displayCpmUplift + videoCpmUplift;
    
    const totalMonthlyUplift = potentialUplift + cpmUplift;
    const totalAnnualUplift = totalMonthlyUplift * 12;

    // ID Bloat Reduction Calculations
    const idBloatReduction = this.calculateIdBloatReduction(
      monthlyPageviews, 
      numDomains, 
      quizResults
    );

    return {
      inputs,
      currentRevenue,
      breakdown: {
        display: {
          impressions: displayImpressions,
          addressableImpressions: addressableDisplay,
          currentRevenue: currentDisplayRevenue,
          cpm: webDisplayCPM,
          newlyAddressable: newlyAddressableDisplay,
          uplift: potentialDisplayUplift + displayCpmUplift
        },
        video: {
          impressions: videoImpressions,
          addressableImpressions: addressableVideo,
          currentRevenue: currentVideoRevenue,
          cpm: webVideoCPM,
          newlyAddressable: newlyAddressableVideo,
          uplift: potentialVideoUplift + videoCpmUplift
        },
        totalAdImpressions,
        chromeShare,
        currentAddressability,
        addressabilityImprovement: adFixusAddressability - currentAddressability,
        salesMix
      },
      unaddressableInventory: {
        impressions: unaddressableImpressions,
        percentage: (unaddressableImpressions / totalAdImpressions) * 100,
        lostRevenue,
        display: {
          impressions: unaddressableDisplay,
          lostRevenue: lostDisplayRevenue
        },
        video: {
          impressions: unaddressableVideo,
          lostRevenue: lostVideoRevenue
        }
      },
      idBloatReduction,
      uplift: {
        newlyAddressableImpressions: newlyAddressable,
        monthlyRevenue: potentialUplift,
        cpmImprovement: cpmUplift,
        totalMonthlyUplift,
        totalAnnualUplift,
        percentageImprovement: (totalMonthlyUplift / currentRevenue) * 100,
        display: {
          monthlyUplift: potentialDisplayUplift + displayCpmUplift,
          annualUplift: (potentialDisplayUplift + displayCpmUplift) * 12
        },
        video: {
          monthlyUplift: potentialVideoUplift + videoCpmUplift,
          annualUplift: (potentialVideoUplift + videoCpmUplift) * 12
        }
      }
    };
  }

  private static getSalesMix(quizResults?: QuizResults) {
    if (quizResults?.scores?.['sales-mix']?.breakdown) {
      return quizResults.scores['sales-mix'].breakdown as { direct: number; dealIds: number; openExchange: number };
    }
    return { ...DEFAULT_SALES_MIX };
  }

  private static calculateCurrentAddressability(chromeShare: number, quizResults?: QuizResults): number {
    const safariStrategy = quizResults?.answers?.['safari-strategy'];
    
    // If fully optimized for privacy browsers, treat Safari/Firefox as addressable
    if (safariStrategy === 'optimized') {
      return 100; // All traffic is addressable
    }
    
    // Only Chrome traffic is addressable for struggling/basic users
    return chromeShare;
  }

  private static calculateIdBloatReduction(
    monthlyPageviews: number,
    numDomains: number,
    quizResults?: QuizResults
  ) {
    // Estimate unique users from pageviews
    const estimatedMonthlyUsers = monthlyPageviews / INDUSTRY_BENCHMARKS.PAGES_PER_SESSION;
    
    // Calculate ID multiplication factor based on current strategy
    let idMultiplierFactor = 1;
    
    // Base multiplication from cross-domain fragmentation
    if (numDomains > 1) {
      idMultiplierFactor += (numDomains - 1) * ID_MULTIPLICATION_FACTORS.ADDITIONAL_DOMAIN_FACTOR;
    }
    
    // Additional multiplication from browser fragmentation
    const safariStrategy = quizResults?.answers?.['safari-strategy'];
    if (safariStrategy !== 'optimized') {
      // Use default Chrome share if not optimized
      const chromeShare = INDUSTRY_BENCHMARKS.US_CHROME_MARKET_SHARE;
      idMultiplierFactor += (100 - chromeShare) / 100 * ID_MULTIPLICATION_FACTORS.BROWSER_FRAGMENTATION_FACTOR;
    }
    
    // Sales mix complexity adds to ID bloat
    const salesMix = this.getSalesMix(quizResults);
    const salesComplexity = (salesMix.direct + salesMix.dealIds) / 100;
    idMultiplierFactor += salesComplexity * ID_MULTIPLICATION_FACTORS.SALES_COMPLEXITY_FACTOR;
    
    const currentMonthlyIds = Math.round(estimatedMonthlyUsers * idMultiplierFactor);
    const idsReduced = Math.round(currentMonthlyIds * (INDUSTRY_BENCHMARKS.ID_BLOAT_REDUCTION_PERCENTAGE / 100));
    const optimizedMonthlyIds = currentMonthlyIds - idsReduced;
    
    // CDP cost savings
    const monthlyCdpSavings = idsReduced * INDUSTRY_BENCHMARKS.COST_PER_ID_REDUCTION;
    const annualCdpSavings = monthlyCdpSavings * 12;

    return {
      currentMonthlyIds,
      optimizedMonthlyIds,
      idsReduced,
      costPerIdReduction: INDUSTRY_BENCHMARKS.COST_PER_ID_REDUCTION,
      monthlyCdpSavings,
      annualCdpSavings,
      reductionPercentage: INDUSTRY_BENCHMARKS.ID_BLOAT_REDUCTION_PERCENTAGE
    };
  }

  static generateMonthlyProjection(calculatorResults: CalculatorResults): Array<{
    month: string;
    current: number;
    withAdFixus: number;
    uplift: number;
  }> {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const baseCurrentRevenue = calculatorResults.currentRevenue;
      const maxUplift = calculatorResults.uplift.totalMonthlyUplift;
      
      let rampFactor;
      if (month === 1) {
        rampFactor = RAMP_UP_SCHEDULE.MONTH_1_FACTOR;
      } else if (month === 2) {
        rampFactor = RAMP_UP_SCHEDULE.MONTH_2_FACTOR;
      } else {
        rampFactor = RAMP_UP_SCHEDULE.MONTH_3_PLUS_FACTOR;
      }
      
      const fluctuationSeed = Math.sin(month * 0.8) * 0.05;
      const currentFluctuation = 1 + (fluctuationSeed * 0.5);
      const adFixusFluctuation = 1 + fluctuationSeed;
      
      const currentRevenue = baseCurrentRevenue * currentFluctuation;
      const upliftAmount = maxUplift * rampFactor * adFixusFluctuation;
      
      return {
        month: `Month ${month}`,
        current: Math.round(currentRevenue),
        withAdFixus: Math.round(currentRevenue + upliftAmount),
        uplift: Math.round(upliftAmount)
      };
    });
  }
}