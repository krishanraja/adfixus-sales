import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RankTrend } from '@/types/scanner';
import { formatRankChange } from '@/utils/trafficEstimation';

interface RankTrendBadgeProps {
  trend: RankTrend | null | undefined;
  change?: number | null;
  showChange?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RankTrendBadge({
  trend,
  change = 0,
  showChange = true,
  size = 'md',
  className,
}: RankTrendBadgeProps) {
  if (!trend) return null;

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  const getConfig = () => {
    switch (trend) {
      case 'growing':
        return {
          icon: TrendingUp,
          colorClass: 'bg-success/20 text-success border-success/30',
          label: 'Growing',
        };
      case 'declining':
        return {
          icon: TrendingDown,
          colorClass: 'bg-destructive/20 text-destructive border-destructive/30',
          label: 'Declining',
        };
      case 'stable':
        return {
          icon: Minus,
          colorClass: 'bg-muted text-muted-foreground border-border',
          label: 'Stable',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium transition-all duration-300',
        config.colorClass,
        textSize,
        className
      )}
    >
      <Icon className={cn(iconSize, 'animate-fade-in')} />
      {showChange && change !== null && change !== 0 ? (
        <span>{formatRankChange(change)}</span>
      ) : (
        <span>{config.label}</span>
      )}
    </Badge>
  );
}
