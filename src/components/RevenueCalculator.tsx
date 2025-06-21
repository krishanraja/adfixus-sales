
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { HelpCircle, Calculator } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RevenueCalculatorProps {
  onComplete: (results: any) => void;
  quizResults?: any;
}

export const RevenueCalculator: React.FC<RevenueCalculatorProps> = ({ onComplete, quizResults }) => {
  const [formData, setFormData] = useState({
    monthlyPageviews: 5000000,
    webDisplayCPM: 4.50,
    webVideoCPM: 12.00,
    displayVideoSplit: 80, // % of inventory that is display (remainder is video)
    safariShare: 30,
    firefoxShare: 5,
    unauthenticatedShare: 75,
    numDomains: 1,
    sessionFrequency: 3.2,
    currentAddressability: 65
  });

  // Estimate default values based on quiz results
  useEffect(() => {
    if (quizResults) {
      let estimatedSafari = 30;
      let estimatedFirefox = 5;
      
      // Adjust based on browser strategy answers
      if (quizResults.answers?.['safari-strategy'] === 'struggling') {
        estimatedSafari = 40; // Higher Safari traffic if struggling to monetize
      } else if (quizResults.answers?.['safari-strategy'] === 'optimized') {
        estimatedSafari = 25; // Lower if well optimized
      }
      
      setFormData(prev => ({
        ...prev,
        safariShare: estimatedSafari,
        firefoxShare: estimatedFirefox
      }));
    }
  }, [quizResults]);

  const handleInputChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatNumberWithCommas = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handlePageviewsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    const numValue = parseInt(value) || 0;
    handleInputChange('monthlyPageviews', numValue);
  };

  const calculateRevenue = () => {
    const {
      monthlyPageviews,
      webDisplayCPM,
      webVideoCPM,
      displayVideoSplit,
      safariShare,
      firefoxShare,
      unauthenticatedShare,
      currentAddressability
    } = formData;

    // Split inventory into display and video
    const displayImpressions = monthlyPageviews * (displayVideoSplit / 100);
    const videoImpressions = monthlyPageviews * ((100 - displayVideoSplit) / 100);

    // Calculate dark inventory (Safari + Firefox unauthenticated traffic with poor addressability)
    const safariTraffic = monthlyPageviews * (safariShare / 100);
    const firefoxTraffic = monthlyPageviews * (firefoxShare / 100);
    const restrictiveTraffic = safariTraffic + firefoxTraffic;
    
    const unauthenticatedRestrictiveTraffic = restrictiveTraffic * (unauthenticatedShare / 100);
    const currentlyUnaddressable = monthlyPageviews * (1 - currentAddressability / 100);
    
    // Split unaddressable inventory by display/video
    const unaddressableDisplay = currentlyUnaddressable * (displayVideoSplit / 100);
    const unaddressableVideo = currentlyUnaddressable * ((100 - displayVideoSplit) / 100);
    
    // With AdFixus assumptions - 100% addressability
    const adFixusAddressability = 100;
    const newlyAddressable = monthlyPageviews * (adFixusAddressability / 100 - currentAddressability / 100);
    const newlyAddressableDisplay = newlyAddressable * (displayVideoSplit / 100);
    const newlyAddressableVideo = newlyAddressable * ((100 - displayVideoSplit) / 100);
    
    // Revenue calculations - separate for display and video
    const currentDisplayRevenue = displayImpressions * (webDisplayCPM / 1000);
    const currentVideoRevenue = videoImpressions * (webVideoCPM / 1000);
    const currentRevenue = currentDisplayRevenue + currentVideoRevenue;
    
    const lostDisplayRevenue = (unaddressableDisplay / 1000) * webDisplayCPM;
    const lostVideoRevenue = (unaddressableVideo / 1000) * webVideoCPM;
    const lostRevenue = lostDisplayRevenue + lostVideoRevenue;
    
    const potentialDisplayUplift = (newlyAddressableDisplay / 1000) * webDisplayCPM;
    const potentialVideoUplift = (newlyAddressableVideo / 1000) * webVideoCPM;
    const potentialUplift = potentialDisplayUplift + potentialVideoUplift;
    
    // CPM improvement for newly addressable inventory - 25% uplift
    const improvedDisplayCPM = webDisplayCPM * 1.25;
    const improvedVideoCPM = webVideoCPM * 1.25;
    const displayCpmUplift = (newlyAddressableDisplay / 1000) * (improvedDisplayCPM - webDisplayCPM);
    const videoCpmUplift = (newlyAddressableVideo / 1000) * (improvedVideoCPM - webVideoCPM);
    const cpmUplift = displayCpmUplift + videoCpmUplift;
    
    const totalMonthlyUplift = potentialUplift + cpmUplift;
    const totalAnnualUplift = totalMonthlyUplift * 12;

    return {
      inputs: formData,
      currentRevenue,
      breakdown: {
        display: {
          impressions: displayImpressions,
          currentRevenue: currentDisplayRevenue,
          cpm: webDisplayCPM,
          newlyAddressable: newlyAddressableDisplay,
          uplift: potentialDisplayUplift + displayCpmUplift
        },
        video: {
          impressions: videoImpressions,
          currentRevenue: currentVideoRevenue,
          cpm: webVideoCPM,
          newlyAddressable: newlyAddressableVideo,
          uplift: potentialVideoUplift + videoCpmUplift
        },
        safariTraffic,
        firefoxTraffic,
        restrictiveTraffic,
        unauthenticatedRestrictiveTraffic,
        addressabilityImprovement: adFixusAddressability - currentAddressability
      },
      darkInventory: {
        impressions: currentlyUnaddressable,
        percentage: (currentlyUnaddressable / monthlyPageviews) * 100,
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
  };

  const handleSubmit = () => {
    const results = calculateRevenue();
    console.log('Revenue calculation results:', results);
    onComplete(results);
  };

  return (
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
                type="text"
                value={formatNumberWithCommas(formData.monthlyPageviews)}
                onChange={handlePageviewsChange}
                className="text-lg"
              />
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Label>Display vs Video Split: {formData.displayVideoSplit}% Display / {100 - formData.displayVideoSplit}% Video</Label>
              </div>
              <Slider
                value={[formData.displayVideoSplit]}
                onValueChange={([value]) => handleInputChange('displayVideoSplit', value)}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0% Display</span>
                <span>100% Display</span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Label>Web Display CPM: ${formData.webDisplayCPM.toFixed(2)}</Label>
              </div>
              <Slider
                value={[formData.webDisplayCPM]}
                onValueChange={([value]) => handleInputChange('webDisplayCPM', value)}
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
                <Label>Web Video CPM: ${formData.webVideoCPM.toFixed(2)}</Label>
              </div>
              <Slider
                value={[formData.webVideoCPM]}
                onValueChange={([value]) => handleInputChange('webVideoCPM', value)}
                min={1}
                max={50}
                step={0.50}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$1.00</span>
                <span>$50.00</span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Label>Current Addressability: {formData.currentAddressability}%</Label>
              </div>
              <Slider
                value={[formData.currentAddressability]}
                onValueChange={([value]) => handleInputChange('currentAddressability', value)}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
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
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Label>Firefox Traffic: {formData.firefoxShare}%</Label>
              </div>
              <Slider
                value={[formData.firefoxShare]}
                onValueChange={([value]) => handleInputChange('firefoxShare', value)}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Label>Unauthenticated Users: {formData.unauthenticatedShare}%</Label>
              </div>
              <Slider
                value={[formData.unauthenticatedShare]}
                onValueChange={([value]) => handleInputChange('unauthenticatedShare', value)}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
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
  );
};
