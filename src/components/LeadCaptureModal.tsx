import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BaseLeadCaptureForm } from './shared/BaseLeadCaptureForm';
import type { LeadData } from '@/types';

interface LeadCaptureModalProps {
  open: boolean;
  onSubmitSuccess: (data: LeadData) => void;
  onOpenChange: (open: boolean) => void;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ open, onSubmitSuccess, onOpenChange }) => {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">Access Your Report</DialogTitle>
          <DialogDescription>
            Please provide your information to receive your personalized identity health report
          </DialogDescription>
        </DialogHeader>
        
        <BaseLeadCaptureForm 
          onSubmitSuccess={onSubmitSuccess} 
          buttonText="Access My Report"
        />
      </DialogContent>
    </Dialog>
  );
};