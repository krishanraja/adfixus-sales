import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import type { CalculatorInputs } from '@/types';

interface AdvancedSettingsProps {
  formData: CalculatorInputs;
  onInputChange: (field: keyof CalculatorInputs, value: number) => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ 
  formData, 
  onInputChange 
}) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Label className="font-semibold">
              Ad Impressions per Page View: {formData.adImpressionsPerPage.toFixed(1)}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Average number of ad impressions generated per page view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            value={[formData.adImpressionsPerPage]}
            onValueChange={([value]) => onInputChange('adImpressionsPerPage', value)}
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
            <Label className="font-semibold">
              Display vs Video Split: {formData.displayVideoSplit}% Display
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentage of inventory that is display advertising (remainder is video)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            value={[formData.displayVideoSplit]}
            onValueChange={([value]) => onInputChange('displayVideoSplit', value)}
            min={10}
            max={95}
            step={5}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>10% Display</span>
            <span>95% Display</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Video: {100 - formData.displayVideoSplit}%
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Label className="font-semibold">Number of Domains</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of different domains/subdomains you monetize</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="number"
            value={formData.numDomains}
            onChange={(e) => onInputChange('numDomains', parseInt(e.target.value) || 1)}
            min={1}
            max={50}
            className="w-24"
          />
        </div>
      </CardContent>
    </Card>
  );
};