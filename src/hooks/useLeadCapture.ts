import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { LeadData } from '@/types';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().min(1, 'Company is required'),
});

export const useLeadCapture = (onSuccess: (data: LeadData) => void) => {
  const { toast } = useToast();
  
  const form = useForm<LeadData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
    },
  });

  const onSubmit = async (data: LeadData) => {
    try {
      // Store lead data in localStorage for PDF generation
      localStorage.setItem('leadData', JSON.stringify(data));

      toast({
        title: 'Information saved',
        description: 'Your details have been saved successfully.',
      });

      onSuccess(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save your information. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
  };
};