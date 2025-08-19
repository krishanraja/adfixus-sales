import type { CalculatorResults } from '@/types';

export const generateKeyRecommendations = (calculatorResults: CalculatorResults): string[] => {
  const recommendations: string[] = [];
  
  if (calculatorResults.unaddressableInventory.percentage > 20) {
    recommendations.push('• Implement comprehensive identity resolution to address significant unaddressable inventory');
  } else if (calculatorResults.unaddressableInventory.percentage > 10) {
    recommendations.push('• Optimize identity resolution to capture remaining unaddressable inventory');
  } else {
    recommendations.push('• Fine-tune identity resolution for maximum addressability rates');
  }

  // Calculate Safari/Firefox share from Chrome share
  const safariFirefoxShare = 100 - calculatorResults.inputs.chromeShare;
  if (safariFirefoxShare > 25) {
    recommendations.push('• Implement Safari/Firefox-specific optimization strategies');
  }
  
  if (calculatorResults.breakdown.currentAddressability < 70) {
    recommendations.push('• Priority focus on improving overall addressability rates');
  }
  
  if (calculatorResults.breakdown.salesMix) {
    const { direct, dealIds, openExchange } = calculatorResults.breakdown.salesMix;
    if (openExchange > 50) {
      recommendations.push('• Consider increasing direct sales and deal ID usage to improve margins');
    }
    if (direct < 30) {
      recommendations.push('• Explore opportunities to grow direct sales relationships');
    }
  }
  
  if (calculatorResults.inputs.displayVideoSplit < 20) {
    recommendations.push('• Optimize video inventory monetization strategies');
  } else if (calculatorResults.inputs.displayVideoSplit > 90) {
    recommendations.push('• Consider expanding video inventory opportunities');
  }
  
  if (calculatorResults.inputs.numDomains > 3) {
    recommendations.push('• Implement cross-domain identity resolution for multi-domain operations');
  }
  
  if (recommendations.length < 3) {
    recommendations.push('• Leverage privacy-compliant targeting to maximize CPMs');
    if (recommendations.length < 3) {
      recommendations.push('• Implement real-time optimization for inventory management');
    }
  }
  
  return recommendations.slice(0, 6);
};