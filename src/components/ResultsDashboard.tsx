
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Download, Calendar } from 'lucide-react';

interface ResultsDashboardProps {
  quizResults: any;
  calculatorResults: any;
  onReset: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
  quizResults, 
  calculatorResults, 
  onReset 
}) => {
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
      'browser': 'Browser Resilience'
    };
    return names[category] || category;
  };

  // Prepare data for charts
  const inventoryData = [
    {
      name: 'Addressable Inventory',
      value: calculatorResults.inputs.monthlyPageviews - calculatorResults.darkInventory.impressions,
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

  const monthlyProjectionData = Array.from({ length: 12 }, (_, i) => ({
    month: `Month ${i + 1}`,
    current: calculatorResults.currentRevenue,
    withAdFixus: calculatorResults.currentRevenue + calculatorResults.uplift.totalMonthlyUplift,
    uplift: calculatorResults.uplift.totalMonthlyUplift
  }));

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
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Identity ROI Analysis</h2>
        <p className="text-xl text-gray-600">
          Complete assessment of your identity setup and revenue opportunity
        </p>
      </div>

      {/* Identity Health Scorecard */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-blue-600" />
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

            {/* Category Grades */}
            {Object.entries(quizResults.scores).map(([category, data]: [string, any]) => (
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

          {/* Recommendations */}
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Key Recommendations</h4>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  {quizResults.overallScore < 3.0 && (
                    <li>• Consider implementing a comprehensive identity resolution strategy</li>
                  )}
                  {quizResults.scores['browser']?.score < 2.5 && (
                    <li>• Optimize for Safari and privacy-focused browsers</li>
                  )}
                  {quizResults.scores['cross-domain']?.score < 2.5 && (
                    <li>• Improve cross-domain identity resolution capabilities</li>
                  )}
                  {quizResults.scores['privacy']?.score < 3.0 && (
                    <li>• Strengthen privacy compliance and consent management</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Uplift Potential</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculatorResults.uplift.totalMonthlyUplift)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              +{calculatorResults.uplift.percentageImprovement.toFixed(1)}% revenue increase
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Annual Opportunity</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculatorResults.uplift.totalAnnualUplift)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
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
                <p className="text-sm text-gray-600">Match Rate Improvement</p>
                <p className="text-2xl font-bold text-purple-600">
                  +{calculatorResults.breakdown.matchRateImprovement}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              From {calculatorResults.inputs.currentMatchRate}% to 85%
            </p>
          </CardContent>
        </Card>
      </div>

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
                <Tooltip formatter={(value) => formatNumber(value)} />
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

        {/* Revenue Comparison */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Revenue Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
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
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
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
      <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Unlock Your Revenue Potential?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            You're potentially leaving <strong>{formatCurrency(calculatorResults.uplift.totalAnnualUplift)}</strong> on the table annually. 
            Let's discuss how AdFixus can help you capture this opportunity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              Book a Demo
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              <Download className="w-4 h-4 mr-2" />
              Export Report
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
