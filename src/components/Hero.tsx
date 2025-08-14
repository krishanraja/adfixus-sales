
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Shield, Globe, TrendingUp } from 'lucide-react';

interface HeroProps {
  onStartQuiz: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartQuiz }) => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-8">
          <BarChart3 className="w-16 h-16 text-cyan-600 mx-auto mb-4" />
          <h1 className="text-5xl font-black text-gray-900 mb-4 whitespace-nowrap">
            ID Simulator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover how much revenue you're losing to non-addressable inventory and ID durability gaps. 
            Get your Identity Health Score and calculate your potential uplift.
          </p>
        </div>
        
        <Button 
          onClick={onStartQuiz}
          size="lg"
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Start Your ROI Analysis
        </Button>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-teal-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Identity Health Quiz
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Evaluate your current identity setup across durability, compliance, 
              and cross-domain visibility with our expert scorecard.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 text-center">
            <Globe className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Revenue Impact Calculator
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Input your traffic data and see exactly how much revenue 
              you're leaving on the table due to ID durability gaps.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 text-cyan-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Actionable Insights
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Get detailed recommendations and see your potential uplift 
              with AdFixus's ID durability technology.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Industry Benchmarks
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">35%</div>
            <div className="text-gray-600 text-sm">Safari Traffic Average</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">70%</div>
            <div className="text-gray-600 text-sm">Unauthenticated Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">45%</div>
            <div className="text-gray-600 text-sm">Typical Match Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">25%</div>
            <div className="text-gray-600 text-sm">Average Yield Uplift</div>
          </div>
        </div>
        <p className="text-xs italic text-gray-500 mt-6 text-center">
          *Sources: StatCounter (Safari share, Jul 2025); Piano "Subscription Performance Benchmarks 2024"; Clearcode; PubMatic; Amazon Publisher Services.
        </p>
      </div>
    </div>
  );
};
