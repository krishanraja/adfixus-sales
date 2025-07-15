
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { HelpCircle, Calculator } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LeadCaptureModal } from './LeadCaptureModal';

interface RevenueCalculatorProps {
  onComplete: (results: any) => void;
  quizResults?: any;
  onLeadCapture: (data: any) => void;
}

export const RevenueCalculator: React.FC<RevenueCalculatorProps> = ({ onComplete, quizResults, onLeadCapture }) => {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [formData, setFormData] = useState({
    monthlyPageviews: 5000000,
    adImpressionsPerPage: 3.2, // Average ad impressions per page view
    webDisplayCPM: 4.50,
    webVideoCPM: 12.00,
    displayVideoSplit: 80, // % of inventory that is display (remainder is video)
    chromeShare: 70, // % of traffic from Chrome (addressable)
    numDomains: 1
  });

  // Estimate default values based on quiz results
  useEffect(() => {
    if (quizResults) {
      let estimatedChrome = 70;
      
      // Adjust based on browser strategy answers
      if (quizResults.answers?.['safari-strategy'] === 'struggling') {
        estimatedChrome = 60; // Lower Chrome if struggling with Safari/Firefox
      } else if (quizResults.answers?.['safari-strategy'] === 'optimized') {
        estimatedChrome = 75; // Higher Chrome if well optimized for other browsers
      }
      
      setFormData(prev => ({
        ...prev,
        chromeShare: estimatedChrome
      }));
    }
  }, [quizResults]);

  // Get sales mix from quiz results
  const getSalesMix = () => {
    if (quizResults?.scores?.['sales-mix']?.breakdown) {
      return quizResults.scores['sales-mix'].breakdown;
    }
    return { direct: 40, dealIds: 35, openExchange: 25 };
  };

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
      adImpressionsPerPage,
      webDisplayCPM,
      webVideoCPM,
      displayVideoSplit,
      chromeShare,
      numDomains
    } = formData;

    const salesMix = getSalesMix();

    // Calculate total ad impressions from page views
    const totalAdImpressions = monthlyPageviews * adImpressionsPerPage;
    
    // Split inventory into display and video
    const displayImpressions = totalAdImpressions * (displayVideoSplit / 100);
    const videoImpressions = totalAdImpressions * ((100 - displayVideoSplit) / 100);

    // Calculate addressability based on browser strategy
    let currentAddressability = chromeShare;
    const safariStrategy = quizResults?.answers?.['safari-strategy'];
    
    // If fully optimized for privacy browsers, treat Safari/Firefox as addressable
    if (safariStrategy === 'optimized') {
      currentAddressability = 100; // All traffic is addressable
    } else {
      // Only Chrome traffic is addressable for struggling/basic users
      currentAddressability = chromeShare;
    }
    
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
    
    // Revenue calculations - based on addressable inventory only
    const currentDisplayRevenue = (addressableDisplay / 1000) * webDisplayCPM;
    const currentVideoRevenue = (addressableVideo / 1000) * webVideoCPM;
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
      darkInventory: {
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
    setShowLeadModal(true);
    // Store results temporarily to use after lead capture
    (window as any)._tempCalculatorResults = results;
  };

  const handleLeadSubmit = (leadData: any) => {
    const results = (window as any)._tempCalculatorResults;
    setShowLeadModal(false);
    onLeadCapture(leadData);
    onComplete(results);
    // Clean up temp storage
    delete (window as any)._tempCalculatorResults;
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

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Traffic & Monetization Inputs */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Traffic & Monetization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Label htmlFor="pageviews">Monthly Pageviews</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total monthly page views (not ad impressions)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                <Label>Ad Impressions per Page: {formData.adImpressionsPerPage.toFixed(1)}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Average number of ad impressions per page view</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider
                value={[formData.adImpressionsPerPage]}
                onValueChange={([value]) => handleInputChange('adImpressionsPerPage', value)}
                min={1}
                max={10}
                step={0.1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1.0</span>
                <span>10.0</span>
              </div>
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
                min={5}
                max={100}
                step={0.50}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$5.00</span>
                <span>$100.00</span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Label>Chrome Traffic Share: {formData.chromeShare}%</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>% of your traffic from Chrome browsers</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider
                value={[formData.chromeShare]}
                onValueChange={([value]) => handleInputChange('chromeShare', value)}
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
          </CardContent>
        </Card>

        {/* Browser Strategy & Settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Browser Strategy & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Browser Strategy Display */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Browser Optimization Status</h4>
              <p className="text-sm text-blue-700">
                {quizResults?.answers?.['safari-strategy'] === 'optimized' 
                  ? 'Fully optimized for privacy-focused browsers - all traffic is addressable'
                  : quizResults?.answers?.['safari-strategy'] === 'struggling'
                  ? 'Struggling with Safari/Firefox monetization - only Chrome traffic is addressable'
                  : 'Basic Safari/Firefox approach - only Chrome traffic is addressable'
                }
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Label htmlFor="domains">Number of Domains/Subdomains</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many different domains/subdomains you operate</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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

      {/* Sales Mix from Quiz Results */}
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle>Sales Mix Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">{getSalesMix().direct}%</div>
              <div className="text-sm text-blue-600">Direct Sales</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-800">{getSalesMix().dealIds}%</div>
              <div className="text-sm text-green-600">Deal IDs</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-800">{getSalesMix().openExchange}%</div>
              <div className="text-sm text-purple-600">Open Exchange</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center mt-4">
            Sales mix data from your Identity Health Assessment
          </p>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Button 
          onClick={handleSubmit}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold"
        >
          Calculate Revenue Impact
        </Button>
      </div>

      <LeadCaptureModal 
        open={showLeadModal}
        onSubmitSuccess={handleLeadSubmit}
      />
    </div>
  );
};
