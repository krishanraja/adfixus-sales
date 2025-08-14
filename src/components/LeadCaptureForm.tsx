import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseLeadCaptureForm } from './shared/BaseLeadCaptureForm';
import type { LeadData } from '@/types';

interface LeadCaptureFormProps {
  onSubmitSuccess: (data: LeadData) => void;
}

export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({ onSubmitSuccess }) => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">AdFixus Identity ROI Analysis</CardTitle>
          <CardDescription>
            Please provide your information to access your personalized identity health report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BaseLeadCaptureForm 
            onSubmitSuccess={onSubmitSuccess} 
            buttonText="Access My Report"
          />
        </CardContent>
      </Card>
    </div>
  );
};