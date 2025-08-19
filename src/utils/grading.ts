import { GRADE_THRESHOLDS } from '@/constants';

export const getGrade = (score: number): string => {
  if (score >= GRADE_THRESHOLDS.A_PLUS) return 'A+';
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  if (score >= GRADE_THRESHOLDS.D) return 'D';
  return 'F';
};

export const getGradeColor = (grade: string): string => {
  const colors = {
    'A+': 'bg-success/20 text-success border-success/30',
    'A': 'bg-success/15 text-success border-success/25',
    'B': 'bg-primary/20 text-primary border-primary/30',
    'C': 'bg-warning/20 text-warning border-warning/30',
    'D': 'bg-warning/15 text-warning border-warning/25',
    'F': 'bg-error/20 text-error border-error/30'
  };
  return colors[grade] || colors['F'];
};

export const getCategoryName = (category: string): string => {
  const names = {
    'durability': 'Identity Durability',
    'cross-domain': 'Cross-Domain Visibility',
    'privacy': 'Privacy & Compliance',
    'browser': 'Browser Resilience',
    'sales-mix': 'Sales Mix'
  };
  return names[category] || category;
};