import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, TrendingUp } from 'lucide-react';
import { formatNumberWithCommas } from '@/utils/formatting';
import { useCalculatorState } from '@/hooks/useCalculatorState';
import type { QuizResults, CalculatorInputs as CalculatorInputsType } from '@/types';

interface CalculatorInputsProps {
  formData: CalculatorInputsType;
  onInputChange: (field: keyof CalculatorInputsType, value: number) => void;
  quizResults?: QuizResults;
}

export const CalculatorInputs: React.FC<CalculatorInputsProps> = ({ 
  formData, 
  onInputChange,
  quizResults 
}) => {
  const handlePageviewsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    const numValue = parseInt(value) || 0;
    onInputChange('monthlyPageviews', numValue);
  };

  // Calculate Safari/Firefox share automatically
  const safariFirefoxShare = 100 - formData.chromeShare;

  return (
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
            onValueChange={([value]) => onInputChange('chromeShare', value)}
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
              onValueChange={([value]) => onInputChange('webDisplayCPM', value)}
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
              onValueChange={([value]) => onInputChange('webVideoCPM', value)}
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
  );
};