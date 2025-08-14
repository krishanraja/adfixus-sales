import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Download, Calendar } from 'lucide-react';
import { generatePDF, sendPDFByEmail } from '../utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface ResultsDashboardProps {
  quizResults: any;
  calculatorResults: any;
  leadData?: any;
  onReset: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
  quizResults, 
  calculatorResults,
  leadData,
  onReset 
}) => {
  const { toast } = useToast();

  // Auto-send comprehensive results email when component mounts
  React.useEffect(() => {
    const sendResultsEmail = async () => {
      try {
        console.log('Sending comprehensive results email with complete data:', {
          quizResults,
          calculatorResults,
          leadData,
          hasInputs: !!calculatorResults?.inputs,
          inputKeys: calculatorResults?.inputs ? Object.keys(calculatorResults.inputs) : []
        });

        const response = await fetch('https://ojtfnhzqhfsprebvpmvx.supabase.co/functions/v1/send-results-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdGZuaHpxaGZzcHJlYnZwbXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NDQwNDQsImV4cCI6MjA2ODEyMDA0NH0.4EQ-NFJWqu9v3VXzk21g_O-sEmNr7y6kDoYrgICc584`,
          },
          body: JSON.stringify({
            quizResults,
            calculatorResults,
            leadData
          }),
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response result:', result);
        
        if (result.success) {
          console.log('Comprehensive results email sent successfully to hello@krishraja.com');
          toast({
            title: "Complete Report Sent",
            description: "Your comprehensive assessment report with all inputs and results has been sent for AI analysis.",
          });
        } else {
          console.error('Failed to send comprehensive results email:', result.error);
          toast({
            title: "Email Issue",
            description: `Report delivery failed: ${result.error}`,
            variant: "destructive",
          });
        }
        
      } catch (error) {
        console.error('Error sending comprehensive results email:', error);
        toast({
          title: "Connection Error",
          description: "Unable to send comprehensive report. Please check console for details.",
          variant: "destructive",
        });
      }
    };

    sendResultsEmail();
  }, [quizResults, calculatorResults, leadData, toast]);

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Generating Comprehensive PDF...",
        description: "Please wait while we prepare your complete report with all inputs and results.",
      });

      const pdf = await generatePDF(quizResults, calculatorResults, leadData);
      
      // Download the PDF
      pdf.save('comprehensive-identity-roi-analysis-report.pdf');
      
      toast({
        title: "Complete PDF Downloaded",
        description: "Your comprehensive Identity ROI Analysis report with all user inputs has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating comprehensive PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate comprehensive PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getGradeColor = (grade: string) => {
    const colors = {
      'A+': 'bg-green-100 text-green-800 border-green-200',
      'A': 'bg-green-100 text-green-700 border-green-200',
      'B': 'bg-blue-100 text-blue-700 border-blue-200',
      'C': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'D': 'bg-orange-100 text-orange-700 border-orange-200',
      'F': 'bg-red-100 text-red-700 border-red-200'
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

    if (calculatorResults.inputs.safariShare > 25) {
      recommendations.push('• Implement Safari-specific optimization strategies');
    }
    if (calculatorResults.inputs.firefoxShare > 10) {
      recommendations.push('• Enhance Firefox browser compatibility');
    }
    
    if (calculatorResults.inputs.currentAddressability < 70) {
      recommendations.push('• Priority focus on improving overall addressability rates');
    }
    
    if (calculatorResults.breakdown.salesMix) {
      const { directSales, dealIds, openExchange } = calculatorResults.breakdown.salesMix;
      if (openExchange > 50) {
        recommendations.push('• Consider increasing direct sales and deal ID usage to improve margins');
      }
      if (directSales < 30) {
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

  const formatCurrency = (amount: number) => {
    if (amount < 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } else if (amount < 1000000) {
      const kValue = amount / 1000;
      return `$${kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1)}K`;
    } else {
      const mValue = amount / 1000000;
      return `$${mValue % 1 === 0 ? mValue.toFixed(0) : mValue.toFixed(1)}M`;
    }
  };

  const formatNumber = (num: number) => {
    if (num < 1000) {
      return new Intl.NumberFormat('en-US').format(num);
    } else if (num < 1000000) {
      const kValue = num / 1000;
      return `${kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1)}K`;
    } else {
      const mValue = num / 1000000;
      return `${mValue % 1 === 0 ? mValue.toFixed(0) : mValue.toFixed(1)}M`;
    }
  };

  const formatPercentage = (num: number, decimals: number = 0) => {
    const rounded = Number(num).toFixed(decimals);
    return rounded.endsWith('.0') && decimals > 0 ? rounded.slice(0, -2) : rounded;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Your Complete Identity ROI Analysis Results
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive analysis with all user inputs, identity health assessment, and revenue optimization opportunities
        </p>
      </div>

      {/* Revenue Impact Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue Loss</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(calculatorResults.unaddressableInventory.lostRevenue)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formatPercentage(calculatorResults.unaddressableInventory.percentage)}% unaddressable inventory
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-teal-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Uplift Potential</p>
                <p className="text-2xl font-bold text-teal-600">
                  {formatCurrency(calculatorResults.uplift.totalMonthlyUplift)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              +{formatPercentage(calculatorResults.uplift.percentageImprovement)}% revenue increase
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-cyan-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Annual Opportunity</p>
                <p className="text-2xl font-bold text-cyan-600">
                  {formatCurrency(calculatorResults.uplift.totalAnnualUplift)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-cyan-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              12-month projection
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Addressability Improvement</p>
                <p className="text-2xl font-bold text-purple-600">
                  +{formatPercentage(calculatorResults.breakdown.addressabilityImprovement)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              From {formatPercentage(calculatorResults.breakdown.currentAddressability)}% to 100%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Identity Health Scorecard */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-teal-50">
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-cyan-600" />
            <span>Identity Health Scorecard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-3xl font-bold border-2 ${getGradeColor(quizResults.overallGrade)}`}>
                {quizResults.overallGrade}
              </div>
              <h3 className="font-semibold text-gray-900 mt-2">Overall Grade</h3>
                <p className="text-sm text-gray-600">
                  Score: {formatPercentage(quizResults.overallScore)}/4.0
                </p>
            </div>

            {Object.entries(quizResults.scores)
              .filter(([category]) => category !== 'sales-mix')
              .map(([category, data]: [string, any]) => (
              <div key={category} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-xl font-bold border-2 ${getGradeColor(data.grade)}`}>
                  {data.grade}
                </div>
                <h4 className="font-medium text-gray-900 mt-2 text-sm">
                  {getCategoryName(category)}
                </h4>
                <p className="text-xs text-gray-600">
                  {formatPercentage(data.score)}/4.0
                </p>
              </div>
            ))}
          </div>

          {calculatorResults.breakdown.salesMix && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Sales Mix Breakdown</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {calculatorResults.breakdown.salesMix.direct}%
                  </p>
                  <p className="text-sm text-gray-600">Direct Sales</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {calculatorResults.breakdown.salesMix.dealIds}%
                  </p>
                  <p className="text-sm text-gray-600">Deal IDs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {calculatorResults.breakdown.salesMix.openExchange}%
                  </p>
                  <p className="text-sm text-gray-600">Open Exchange</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Key Recommendations</h4>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  {generateKeyRecommendations().map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Inventory Addressability</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${formatPercentage(percent * 100)}%`}
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="mr-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Addressable: {formatNumber(inventoryData[0].value)}
              </Badge>
              <Badge variant="secondary">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                Unaddressable: {formatNumber(inventoryData[1].value)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Revenue Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="current" fill="#6b7280" name="Current" />
                <Bar dataKey="withAdFixus" fill="#22c55e" name="With AdFixus" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>12-Month Revenue Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyProjectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line 
                type="monotone" 
                dataKey="current" 
                stroke="#6b7280" 
                name="Current Revenue"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="withAdFixus" 
                stroke="#22c55e" 
                name="With AdFixus"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-gradient-to-r from-cyan-50 to-teal-50 border-0">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Unlock Your Revenue Potential?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            You're potentially leaving <strong>{formatCurrency(calculatorResults.uplift.totalAnnualUplift)}</strong> on the table annually. 
            Let's discuss how AdFixus can help you capture this opportunity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-8"
              onClick={() => window.open('https://calendly.com/krish-raja', '_blank')}
            >
              Book a Demo
            </Button>
            <Button size="lg" variant="outline" onClick={handleDownloadPDF} className="px-8">
              <Download className="w-4 h-4 mr-2" />
              Download Complete PDF Report
            </Button>
            <Button size="lg" variant="outline" onClick={onReset} className="px-8">
              Run New Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
