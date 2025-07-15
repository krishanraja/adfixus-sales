
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

  // Auto-send PDF when component mounts
  React.useEffect(() => {
    const autoSendPDF = async () => {
      try {
        const pdf = await generatePDF(quizResults, calculatorResults, leadData);
        const pdfBlob = pdf.output('blob');
        
        const result = await sendPDFByEmail(pdfBlob);
        
        if (result.success) {
          console.log('PDF automatically sent to krish.raja@adfixus.com');
        } else {
          console.error('Failed to auto-send PDF:', result.message);
        }
      } catch (error) {
        console.error('Error in auto-send PDF:', error);
      }
    };

    autoSendPDF();
  }, [quizResults, calculatorResults]);

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we prepare your report.",
      });

      const pdf = await generatePDF(quizResults, calculatorResults, leadData);
      
      // Download the PDF
      pdf.save('identity-roi-analysis-report.pdf');
      
      toast({
        title: "PDF Downloaded",
        description: "Your Identity ROI Analysis report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
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

  // Generate comprehensive recommendations based on data
  const generateKeyRecommendations = () => {
    const recommendations = [];
    
    // Always include based on dark inventory percentage
    if (calculatorResults.darkInventory.percentage > 20) {
      recommendations.push('• Implement comprehensive identity resolution to address significant dark inventory');
    } else if (calculatorResults.darkInventory.percentage > 10) {
      recommendations.push('• Optimize identity resolution to capture remaining dark inventory');
    } else {
      recommendations.push('• Fine-tune identity resolution for maximum addressability rates');
    }

    // Browser-specific recommendations
    if (calculatorResults.inputs.safariShare > 25) {
      recommendations.push('• Implement Safari-specific optimization strategies');
    }
    if (calculatorResults.inputs.firefoxShare > 10) {
      recommendations.push('• Enhance Firefox browser compatibility');
    }
    
    // Addressability recommendations
    if (calculatorResults.inputs.currentAddressability < 70) {
      recommendations.push('• Priority focus on improving overall addressability rates');
    }
    
    // Sales mix recommendations
    if (calculatorResults.breakdown.salesMix) {
      const { directSales, dealIds, openExchange } = calculatorResults.breakdown.salesMix;
      if (openExchange > 50) {
        recommendations.push('• Consider increasing direct sales and deal ID usage to improve margins');
      }
      if (directSales < 30) {
        recommendations.push('• Explore opportunities to grow direct sales relationships');
      }
    }
    
    // Video vs display recommendations
    if (calculatorResults.inputs.displayVideoSplit < 20) {
      recommendations.push('• Optimize video inventory monetization strategies');
    } else if (calculatorResults.inputs.displayVideoSplit > 90) {
      recommendations.push('• Consider expanding video inventory opportunities');
    }
    
    // Cross-domain recommendations
    if (calculatorResults.inputs.numDomains > 3) {
      recommendations.push('• Implement cross-domain identity resolution for multi-domain operations');
    }
    
    // Ensure we always have at least 3 recommendations
    if (recommendations.length < 3) {
      recommendations.push('• Leverage privacy-compliant targeting to maximize CPMs');
      if (recommendations.length < 3) {
        recommendations.push('• Implement real-time optimization for inventory management');
      }
    }
    
    return recommendations.slice(0, 6); // Max 6 recommendations for readability
  };

  // Prepare data for charts
  const totalAdImpressions = calculatorResults.breakdown.totalAdImpressions;
  const inventoryData = [
    {
      name: 'Addressable Inventory',
      value: totalAdImpressions - calculatorResults.darkInventory.impressions,
      color: '#22c55e'
    },
    {
      name: 'Dark Inventory',
      value: calculatorResults.darkInventory.impressions,
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

  // Generate realistic 12-month projection with gradual ramp-up and fluctuations
  const monthlyProjectionData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const baseCurrentRevenue = calculatorResults.currentRevenue;
    const maxUplift = calculatorResults.uplift.totalMonthlyUplift;
    
    // Ramp-up factors: slow start, full effect by month 3
    let rampFactor;
    if (month === 1) {
      rampFactor = 0.15; // 15% of full uplift in month 1
    } else if (month === 2) {
      rampFactor = 0.35; // 35% of full uplift in month 2
    } else {
      rampFactor = 1.0; // Full uplift from month 3 onwards
    }
    
    // Add realistic monthly fluctuations (±5% variation)
    const fluctuationSeed = Math.sin(month * 0.8) * 0.05; // Deterministic fluctuation
    const currentFluctuation = 1 + (fluctuationSeed * 0.5); // ±2.5% for current
    const adFixusFluctuation = 1 + fluctuationSeed; // ±5% for AdFixus
    
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Your Identity ROI Analysis Results
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Complete analysis of your identity health and revenue optimization opportunities
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
                  {formatCurrency(calculatorResults.darkInventory.lostRevenue)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {calculatorResults.darkInventory.percentage.toFixed(1)}% dark inventory
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
              +{calculatorResults.uplift.percentageImprovement.toFixed(1)}% revenue increase
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
                  +{calculatorResults.breakdown.addressabilityImprovement}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              From {calculatorResults.breakdown.currentAddressability}% to 100%
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
            {/* Overall Grade */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-3xl font-bold border-2 ${getGradeColor(quizResults.overallGrade)}`}>
                {quizResults.overallGrade}
              </div>
              <h3 className="font-semibold text-gray-900 mt-2">Overall Grade</h3>
              <p className="text-sm text-gray-600">
                Score: {quizResults.overallScore.toFixed(1)}/4.0
              </p>
            </div>

            {/* Category Grades - exclude sales-mix from visual display */}
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
                  {data.score.toFixed(1)}/4.0
                </p>
              </div>
            ))}
          </div>

          {/* Sales Mix Display */}
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

          {/* Key Recommendations - Always Present */}
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
        {/* Inventory Breakdown */}
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
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
                Dark: {formatNumber(inventoryData[1].value)}
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

      {/* 12-Month Projection */}
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

      {/* Action Items */}
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
              Download PDF Report
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
