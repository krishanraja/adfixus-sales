import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpCircle, Calculator, ChevronDown, TrendingUp, BarChart3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LeadCaptureModal } from './LeadCaptureModal';

interface RevenueCalculatorProps {
  onComplete: (results: any) => void;
  quizResults?: any;
  onLeadCapture: (data: any) => void;
}

export const RevenueCalculator: React.FC<RevenueCalculatorProps> = ({ onComplete, quizResults, onLeadCapture }) => {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [formData, setFormData] = useState({
    monthlyPageviews: 5000000,
    adImpressionsPerPage: 3.2, // Average ad impressions per page view
    webDisplayCPM: 4.50,
    webVideoCPM: 12.00,
    displayVideoSplit: 80, // % of inventory that is display (remainder is video)
    chromeShare: 50.63, // % of traffic from Chrome (US market share)
    numDomains: 1
  });

  // Calculate Safari/Firefox share automatically
  const safariFirefoxShare = 100 - formData.chromeShare;

  // Estimate default values based on quiz results
  useEffect(() => {
    if (quizResults) {
      let estimatedChrome = 50.63; // US market share
      
      // Adjust based on browser strategy answers
      if (quizResults.answers?.['safari-strategy'] === 'struggling') {
        estimatedChrome = 45; // Lower Chrome if struggling with Safari/Firefox
      } else if (quizResults.answers?.['safari-strategy'] === 'optimized') {
        estimatedChrome = 55; // Higher Chrome if well optimized for other browsers
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
    const safariStrategy = quizResults?.answers?.['safari-strategy'];
    let currentAddressability;
    
    // If fully optimized for privacy browsers, treat Safari/Firefox as addressable
    if (safariStrategy === 'optimized') {
      currentAddressability = 100; // All traffic is addressable
    } else {
      // Only Chrome traffic is addressable for struggling/basic users (browsers with 3rd party cookies)
      // We removed Edge from the calculation as per the plan
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

    // ID Bloat Reduction Calculations
    // Estimate unique users from pageviews (typical 2.5 pages per session)
    const estimatedMonthlyUsers = monthlyPageviews / 2.5;
    
    // Calculate ID multiplication factor based on current strategy
    let idMultiplierFactor = 1;
    
    // Base multiplication from cross-domain fragmentation
    if (numDomains > 1) {
      idMultiplierFactor += (numDomains - 1) * 0.3; // 30% more IDs per additional domain
    }
    
    // Additional multiplication from browser fragmentation
    if (safariStrategy !== 'optimized') {
      // Poor browser strategy leads to more ID fragmentation
      idMultiplierFactor += (100 - chromeShare) / 100 * 0.4; // 40% more IDs for non-Chrome traffic
    }
    
    // Sales mix complexity adds to ID bloat
    const salesComplexity = (salesMix.direct + salesMix.dealIds) / 100;
    idMultiplierFactor += salesComplexity * 0.2; // 20% more IDs for complex sales mix
    
    const currentMonthlyIds = Math.round(estimatedMonthlyUsers * idMultiplierFactor);
    const idReductionPercentage = 20; // 20% reduction as specified
    const idsReduced = Math.round(currentMonthlyIds * (idReductionPercentage / 100));
    const optimizedMonthlyIds = currentMonthlyIds - idsReduced;
    
    // CDP cost savings at $0.004 per ID reduced
    const costPerIdReduction = 0.004;
    const monthlyCdpSavings = idsReduced * costPerIdReduction;
    const annualCdpSavings = monthlyCdpSavings * 12;

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
      unaddressableInventory: {
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
      idBloatReduction: {
        currentMonthlyIds,
        optimizedMonthlyIds,
        idsReduced,
        costPerIdReduction,
        monthlyCdpSavings,
        annualCdpSavings,
        reductionPercentage: idReductionPercentage
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
    setShowLeadModal(true);
    // Store results in state instead of window
    setCalculationResults(results);
  };

  const handleLeadSubmit = (leadData: any) => {
    setShowLeadModal(false);
    onLeadCapture(leadData);
    onComplete(calculationResults!);
    setCalculationResults(null);
  };

  const handleModalClose = () => {
    setShowLeadModal(false);
    setCalculationResults(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <Calculator className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-foreground mb-2">Revenue Impact Calculator</h2>
        <p className="text-muted-foreground">
          Input your traffic data to see how much revenue you're leaving on the table
        </p>
      </div>

      <div className="space-y-6">
        {/* Primary Inputs - Always Visible */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Primary Traffic & Revenue Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monthly Pageviews - Large and prominent */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Label htmlFor="pageviews" className="text-lg font-semibold">Monthly Pageviews</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
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
                className="text-xl h-14 text-center"
                placeholder="5,000,000"
              />
            </div>

            {/* Chrome Traffic Share */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Label className="text-lg font-semibold">Chrome Traffic Share: {formData.chromeShare.toFixed(0)}%</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>% of your traffic from Chrome browsers (US average: 50.6%)</p>
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
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0%</span>
                <span>100%</span>
              </div>
              
              {/* Auto-calculated Safari/Firefox */}
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Auto-calculated from your Chrome traffic:</div>
                <div className="text-base font-medium text-foreground">
                  Safari/Firefox: {safariFirefoxShare.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {quizResults?.answers?.['safari-strategy'] === 'optimized' 
                    ? 'Currently addressable with your optimization'
                    : 'Currently non-addressable (requires AdFixus)'
                  }
                </div>
              </div>
            </div>

            {/* CPM Inputs - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label className="font-semibold">Web Display CPM: ${formData.webDisplayCPM.toFixed(2)}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Web display advertising only (excludes mobile app/CTV)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Slider
                  value={[formData.webDisplayCPM]}
                  onValueChange={([value]) => handleInputChange('webDisplayCPM', value)}
                  min={0.5}
                  max={15}
                  step={0.25}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$0.50</span>
                  <span>$15.00</span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label className="font-semibold">Web Video CPM: ${formData.webVideoCPM.toFixed(2)}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Web video advertising only (excludes CTV/mobile app inventory)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Slider
                  value={[formData.webVideoCPM]}
                  onValueChange={([value]) => handleInputChange('webVideoCPM', value)}
                  min={5}
                  max={100}
                  step={0.50}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$5.00</span>
                  <span>$100.00</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings - Collapsible */}
        <Collapsible open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Advanced Settings
              </span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} 
              />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label>Ad Impressions per Page: {formData.adImpressionsPerPage.toFixed(1)}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
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
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
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
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0% Display</span>
                    <span>100% Display</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label htmlFor="domains">Number of Domains</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How many different domains you operate</p>
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
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Sales Mix from Quiz Results */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sales Mix Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">From your Identity Health Assessment</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-brand">{getSalesMix().direct}%</div>
                <div className="text-sm text-muted-foreground">Direct Sales</div>
              </div>
              <div className="p-4 bg-secondary/10 rounded-lg">
                <div className="text-2xl font-bold text-secondary-foreground">{getSalesMix().dealIds}%</div>
                <div className="text-sm text-muted-foreground">Deal IDs</div>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg">
                <div className="text-2xl font-bold text-brand">{getSalesMix().openExchange}%</div>
                <div className="text-sm text-muted-foreground">Open Exchange</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculate Button */}
        <div className="text-center pt-4">
          <Button 
            onClick={handleSubmit}
            size="lg"
            className="px-12 py-6 text-lg font-semibold"
          >
            Calculate Revenue Impact
          </Button>
        </div>
      </div>

      <LeadCaptureModal
        open={showLeadModal}
        onSubmitSuccess={handleLeadSubmit}
        onOpenChange={handleModalClose}
      />
    </div>
  );
};