import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Download, Calendar, Database } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatting';
import type { QuizResults, CalculatorResults, LeadData } from '@/types';

interface PDFGenerationResult {
  pdfBase64: string;
  emailSent?: boolean;
  emailError?: string;
}

interface ResultsDashboardProps {
  quizResults: QuizResults;
  calculatorResults: CalculatorResults;
  leadData?: LeadData;
  onReset: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
  quizResults, 
  calculatorResults,
  leadData,
  onReset 
}) => {
  const { toast } = useToast();

  // Show welcome message when component mounts
  React.useEffect(() => {
    toast({
      title: "Analysis Complete",
      description: "Your identity health report is ready. Download the PDF below or book a consultation.",
    });
  }, [toast]);

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Generating PDF Report...",
        description: "Your report is being prepared. Our team will receive a copy for follow-up.",
      });

      console.log('Starting PDF generation with lead data:', leadData);
      
      // Generate the PDF (pdfmake handles download automatically and sends email to AdFixus team)
      const result = await generatePDF(quizResults, calculatorResults, leadData) as PDFGenerationResult;
      
      if (result.emailSent) {
        toast({
          title: "PDF Downloaded",
          description: "Your report has been downloaded and sent to the AdFixus team for follow-up.",
        });
      } else {
        toast({
          title: "PDF Downloaded",
          description: "Your report has been downloaded successfully.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('PDF generation failed:', error);
      toast({
        title: "PDF Generation Failed",
        description: `Failed to generate PDF: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const getGradeColor = (grade: string) => {
    const colors = {
      'A+': 'bg-success/20 text-success border-success/30',
      'A': 'bg-success/20 text-success border-success/30',
      'B': 'bg-primary/20 text-primary border-primary/30',
      'C': 'bg-warning/20 text-warning border-warning/30',
      'D': 'bg-warning/30 text-warning border-warning/40',
      'F': 'bg-error/20 text-error border-error/30'
    };
    return colors[grade] || colors['F'];
  };

  const getCategoryName = (category: string) => {
    const names = {
      'durability': 'Identity Durability',
      'cross-domain': 'Cross-Domain Visibility',
      'privacy': 'Privacy & Compliance',
      'browser': 'Browser Resilience',
      'sales-mix': 'Sales Mix'
    };
    return names[category] || category;
  };

  const generateKeyRecommendations = () => {
    const recommendations = [];
    
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

  const totalAdImpressions = calculatorResults.breakdown.totalAdImpressions;
  const inventoryData = [
    {
      name: 'Addressable Inventory',
      value: totalAdImpressions - calculatorResults.unaddressableInventory.impressions,
      color: '#22c55e'
    },
    {
      name: 'Unaddressable Inventory',
      value: calculatorResults.unaddressableInventory.impressions,
      color: '#ef4444'
    }
  ];

  const revenueComparisonData = [
    {
      name: 'Current Revenue',
      current: calculatorResults.currentRevenue,
      withAdFixus: calculatorResults.currentRevenue + calculatorResults.uplift.totalMonthlyUplift
    }
  ];

  const monthlyProjectionData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const baseCurrentRevenue = calculatorResults.currentRevenue;
    const maxUplift = calculatorResults.uplift.totalMonthlyUplift;
    
    let rampFactor;
    if (month === 1) {
      rampFactor = 0.15;
    } else if (month === 2) {
      rampFactor = 0.35;
    } else {
      rampFactor = 1.0;
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


  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Your ROI Analysis
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Identity health assessment and revenue optimization opportunity
        </p>
      </div>

      {/* Key Metrics - 3 Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Annual Opportunity</p>
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary mb-1">
              {formatCurrency(calculatorResults.uplift.totalAnnualUplift + calculatorResults.idBloatReduction.annualCdpSavings)}
            </p>
            <p className="text-xs text-muted-foreground">
              Revenue uplift + CDP savings
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-revenue-loss">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Monthly Revenue Loss</p>
              <TrendingDown className="w-6 h-6 text-revenue-loss" />
            </div>
            <p className="text-3xl font-bold text-revenue-loss mb-1">
              {formatCurrency(calculatorResults.unaddressableInventory.lostRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(calculatorResults.unaddressableInventory.percentage)} unaddressable
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-accent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Identity Health</p>
              <CheckCircle className="w-6 h-6 text-accent" />
            </div>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold border-2 ${getGradeColor(quizResults.overallGrade)}`}>
              {quizResults.overallGrade}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Overall score: {Math.round(quizResults.overallScore)}/4
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Identity Health Breakdown */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Identity Health Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(quizResults.scores)
              .filter(([category]) => category !== 'sales-mix')
              .map(([category, data]: [string, any]) => (
              <div key={category} className="text-center p-3 bg-muted/30 rounded-lg">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold border-2 mb-2 ${getGradeColor(data.grade)}`}>
                  {data.grade}
                </div>
                <p className="text-xs text-foreground font-medium">
                  {getCategoryName(category)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ID Bloat - Single Line Summary */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground text-center">
          <strong className="text-foreground">ID Bloat Reduction:</strong> Save {formatCurrency(calculatorResults.idBloatReduction.annualCdpSavings)}/year by reducing {formatNumber(calculatorResults.idBloatReduction.idsReduced)} duplicate IDs
        </p>
      </div>

      {/* 12-Month Revenue Projection - Single Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>12-Month Revenue Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyProjectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={formatCurrency} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))' 
                }}
              />
              <Line 
                type="monotone" 
                dataKey="current" 
                stroke="hsl(var(--muted-foreground))" 
                name="Current Revenue"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="withAdFixus" 
                stroke="hsl(var(--primary))" 
                name="With AdFixus"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* CTA Section - Simplified */}
      <Card className="shadow-lg bg-muted/30">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-3">
            Ready to unlock this opportunity?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            You're potentially leaving <strong className="text-primary">{formatCurrency(calculatorResults.uplift.totalAnnualUplift + calculatorResults.idBloatReduction.annualCdpSavings)}</strong> on the table annually.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="px-10 py-6 text-lg font-semibold"
              onClick={() => {
                const url = import.meta.env.VITE_MEETING_BOOKING_URL || 'https://outlook.office.com/book/SalesTeambooking@adfixus.com';
                // Use top-level window to avoid iframe restrictions with Microsoft Bookings
                const targetWindow = window.top || window.parent || window;
                targetWindow.open(url, '_blank');
              }}
            >
              Book a Demo
            </Button>
            <button 
              onClick={handleDownloadPDF}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Download PDF Report
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
