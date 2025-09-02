import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Download, Calendar, Database } from 'lucide-react';
import { generatePDF, sendPDFByEmail } from '../utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatting';
import type { QuizResults, CalculatorResults, LeadData } from '@/types';

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

  // Auto-send comprehensive results email when component mounts
  React.useEffect(() => {
    const sendResultsEmail = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('send-results-email', {
          body: {
            quizResults,
            calculatorResults,
            leadData
          }
        });

        if (error) throw error;
        
        if (result.success) {
          toast({
            title: "Complete Report Sent",
            description: "Your comprehensive assessment report with all inputs and results has been sent for AI analysis.",
          });
        } else {
          toast({
            title: "Email Issue",
            description: `Report delivery failed: ${result.error}`,
            variant: "destructive",
          });
        }
        
      } catch (error) {
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

      // Generate the PDF (pdfmake handles download automatically)
      await generatePDF(quizResults, calculatorResults, leadData);
      
      toast({
        title: "Complete PDF Downloaded",
        description: "Your comprehensive Identity ROI Analysis report with all user inputs has been downloaded successfully.",
      });
    } catch (error) {
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
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Your Complete Identity ROI Analysis Results
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive analysis with all user inputs, identity health assessment, and revenue optimization opportunities
        </p>
      </div>

      {/* Revenue Impact Overview */}
      <div className="grid md:grid-cols-5 gap-6">
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

        <Card className="shadow-lg border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly CDP Savings</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(calculatorResults.idBloatReduction.monthlyCdpSavings)}
                </p>
              </div>
              <Database className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formatPercentage(calculatorResults.idBloatReduction.reductionPercentage)}% ID bloat reduction
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

      {/* ID Bloat Reduction Analysis */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-emerald-600" />
            <span>ID Bloat Reduction & CDP Cost Savings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Current State: Identity Fragmentation</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Monthly Unique Users:</span>
                  <span className="font-medium">{formatNumber(calculatorResults.inputs.monthlyPageviews / 2.5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Monthly ID Count:</span>
                  <span className="font-medium text-red-600">{formatNumber(calculatorResults.idBloatReduction.currentMonthlyIds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID Multiplication Factor:</span>
                  <span className="font-medium text-orange-600">
                    {(calculatorResults.idBloatReduction.currentMonthlyIds / (calculatorResults.inputs.monthlyPageviews / 2.5)).toFixed(2)}x
                  </span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Problem:</strong> Cross-browser fragmentation and poor identity resolution creates 
                  duplicate IDs that must be manually stitched together, inflating CDP costs.
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">With AdFixus: Unified Identity</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Optimized Monthly ID Count:</span>
                  <span className="font-medium text-green-600">{formatNumber(calculatorResults.idBloatReduction.optimizedMonthlyIds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IDs Eliminated:</span>
                  <span className="font-medium text-emerald-600">
                    -{formatNumber(calculatorResults.idBloatReduction.idsReduced)} ({formatPercentage(calculatorResults.idBloatReduction.reductionPercentage)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly CDP Savings:</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    {formatCurrency(calculatorResults.idBloatReduction.monthlyCdpSavings)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual CDP Savings:</span>
                  <span className="font-bold text-emerald-600 text-xl">
                    {formatCurrency(calculatorResults.idBloatReduction.annualCdpSavings)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-700">
                  <strong>Solution:</strong> AdFixus reduces computational ID bloat by ~20%, 
                  saving ${calculatorResults.idBloatReduction.costPerIdReduction} per eliminated ID while improving data quality.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg">
            <div className="text-center">
              <h4 className="font-bold text-emerald-800 text-lg mb-2">Total Combined ROI Impact</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-emerald-700 font-medium">Revenue Uplift (Annual)</p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {formatCurrency(calculatorResults.uplift.totalAnnualUplift)}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-700 font-medium">CDP Cost Savings (Annual)</p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {formatCurrency(calculatorResults.idBloatReduction.annualCdpSavings)}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-700 font-medium">Total Annual Value</p>
                  <p className="text-3xl font-bold text-emerald-900">
                    {formatCurrency(calculatorResults.uplift.totalAnnualUplift + calculatorResults.idBloatReduction.annualCdpSavings)}
                  </p>
                </div>
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
                <YAxis tickFormatter={formatCurrency} />
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
              <YAxis tickFormatter={formatCurrency} />
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
            You're potentially leaving <strong>{formatCurrency(calculatorResults.uplift.totalAnnualUplift + calculatorResults.idBloatReduction.annualCdpSavings)}</strong> on the table annually. 
            This includes <strong>{formatCurrency(calculatorResults.uplift.totalAnnualUplift)}</strong> in revenue uplift and <strong>{formatCurrency(calculatorResults.idBloatReduction.annualCdpSavings)}</strong> in CDP cost savings.
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
