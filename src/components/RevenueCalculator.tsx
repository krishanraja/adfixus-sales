
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { HelpCircle, Calculator } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RevenueCalculatorProps {
  onComplete: (results: any) => void;
}

export const RevenueCalculator: React.FC<RevenueCalculatorProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    monthlyPageviews: 50000000,
    avgCPM: 4.50,
    safariShare: 35,
    firefoxShare: 5,
    unauthenticatedShare: 75,
    numDomains: 1,
    sessionFrequency: 3.2,
    currentAddressability: 65
  });

  const handleInputChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateRevenue = () => {
    const {
      monthlyPageviews,
      avgCPM,
      safariShare,
      firefoxShare,
      unauthenticatedShare,
      currentAddressability
    } = formData;

    // Calculate dark inventory (Safari + Firefox unauthenticated traffic with poor addressability)
    const safariTraffic = monthlyPageviews * (safariShare / 100);
    const firefoxTraffic = monthlyPageviews * (firefoxShare / 100);
    const restrictiveTraffic = safariTraffic + firefoxTraffic;
    
    const unauthenticatedRestrictiveTraffic = restrictiveTraffic * (unauthenticatedShare / 100);
    const currentlyUnaddressable = monthlyPageviews * (1 - currentAddressability / 100);
    
    // With AdFixus assumptions - 100% addressability
    const adFixusAddressability = 100;
    const newlyAddressable = monthlyPageviews * (adFixusAddressability / 100 - currentAddressability / 100);
    
    // Revenue calculations
    const currentRevenue = monthlyPageviews * (avgCPM / 1000);
    const lostRevenue = (currentlyUnaddressable / 1000) * avgCPM;
    const potentialUplift = (newlyAddressable / 1000) * avgCPM;
    const annualUplift = potentialUplift * 12;
    
    // CPM improvement for newly addressable inventory - 25% uplift
    const improvedCPM = avgCPM * 1.25;
    const cpmUplift = (newlyAddressable / 1000) * (improvedCPM - avgCPM);
    const totalMonthlyUplift = potentialUplift + cpmUplift;
    const totalAnnualUplift = totalMonthlyUplift * 12;

    return {
      inputs: formData,
      currentRevenue,
      darkInventory: {
        impressions: currentlyUnaddressable,
        percentage: (currentlyUnaddressable / monthlyPageviews) * 100,
        lostRevenue
      },
      uplift: {
        newlyAddressableImpressions: newlyAddressable,
        monthlyRevenue: potentialUplift,
        cpmImprovement: cpmUplift,
        totalMonthlyUplift,
        totalAnnualUplift,
        percentageImprovement: (totalMonthlyUplift / currentRevenue) * 100
      },
      breakdown: {
        safariTraffic,
        firefoxTraffic,
        restrictiveTraffic,
        unauthenticatedRestrictiveTraffic,
        addressabilityImprovement: adFixusAddressability - currentAddressability
      }
    };
  };

  const handleSubmit = () => {
    const results = calculateRevenue();
    console.log('Revenue calculation results:', results);
    onComplete(results);
  };

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <Calculator className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Revenue Impact Calculator</h2>
          <p className="text-gray-600">
            Input your traffic data to see how much revenue you're leaving on the table
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Traffic & Monetization Inputs */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Traffic & Monetization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label htmlFor="pageviews">Monthly Pageviews</Label>
                </div>
                <Input
                  id="pageviews"
                  type="number"
                  value={formData.monthlyPageviews}
                  onChange={(e) => handleInputChange('monthlyPageviews', Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label>Average CPM: ${formData.avgCPM.toFixed(2)}</Label>
                </div>
                <Slider
                  value={[formData.avgCPM]}
                  onValueChange={([value]) => handleInputChange('avgCPM', value)}
                  min={0.5}
                  max={15}
                  step={0.25}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$0.50</span>
                  <span>$15.00</span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label>Current Addressability: {formData.currentAddressability}%</Label>
                </div>
                <Slider
                  value={[formData.currentAddressability]}
                  onValueChange={([value]) => handleInputChange('currentAddressability', value)}
                  min={10}
                  max={90}
                  step={5}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>90%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Browser & User Behavior */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Browser & User Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label>Safari Traffic: {formData.safariShare}%</Label>
                </div>
                <Slider
                  value={[formData.safariShare]}
                  onValueChange={([value]) => handleInputChange('safariShare', value)}
                  min={20}
                  max={60}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>20%</span>
                  <span>60%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label>Firefox Traffic: {formData.firefoxShare}%</Label>
                </div>
                <Slider
                  value={[formData.firefoxShare]}
                  onValueChange={([value]) => handleInputChange('firefoxShare', value)}
                  min={2}
                  max={15}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2%</span>
                  <span>15%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label>Unauthenticated Users: {formData.unauthenticatedShare}%</Label>
                </div>
                <Slider
                  value={[formData.unauthenticatedShare]}
                  onValueChange={([value]) => handleInputChange('unauthenticatedShare', value)}
                  min={40}
                  max={95}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>40%</span>
                  <span>95%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label htmlFor="domains">Number of Domains/Subdomains</Label>
                </div>
                <Input
                  id="domains"
                  type="number"
                  value={formData.numDomains}
                  onChange={(e) => handleInputChange('numDomains', Number(e.target.value))}
                  min={1}
                  max={50}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={handleSubmit}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold"
          >
            Calculate Revenue Impact
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};
