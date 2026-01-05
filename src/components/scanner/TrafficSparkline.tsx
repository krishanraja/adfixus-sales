import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { RankHistoryEntry, RankTrend } from '@/types/scanner';

interface TrafficSparklineProps {
  history: RankHistoryEntry[] | null | undefined;
  trend?: RankTrend | null;
  height?: number;
  showTooltip?: boolean;
}

export function TrafficSparkline({
  history,
  trend,
  height = 40,
  showTooltip = true,
}: TrafficSparklineProps) {
  if (!history || history.length < 2) {
    return (
      <div 
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        No trend data
      </div>
    );
  }

  // Reverse to show oldest first (left to right timeline)
  // Lower rank = better, so we invert for the chart
  const chartData = [...history].reverse().map((entry) => ({
    date: entry.date,
    rank: entry.rank,
    // Invert rank for visual (lower rank = higher on chart = better)
    value: 1000000 - Math.min(entry.rank, 1000000),
  }));

  const getGradientColors = () => {
    switch (trend) {
      case 'growing':
        return { start: 'hsl(var(--success))', end: 'hsl(var(--success) / 0.1)' };
      case 'declining':
        return { start: 'hsl(var(--destructive))', end: 'hsl(var(--destructive) / 0.1)' };
      default:
        return { start: 'hsl(var(--primary))', end: 'hsl(var(--primary) / 0.1)' };
    }
  };

  const colors = getGradientColors();
  const strokeColor = trend === 'growing' 
    ? 'hsl(var(--success))' 
    : trend === 'declining' 
      ? 'hsl(var(--destructive))' 
      : 'hsl(var(--primary))';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={`sparklineGradient-${trend}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.start} stopOpacity={0.4} />
            <stop offset="100%" stopColor={colors.end} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showTooltip && (
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const data = payload[0].payload;
              return (
                <div className="glass-card px-2 py-1 text-xs rounded shadow-lg border border-border">
                  <p className="text-muted-foreground">{data.date}</p>
                  <p className="font-semibold text-foreground">Rank #{data.rank.toLocaleString()}</p>
                </div>
              );
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#sparklineGradient-${trend})`}
          isAnimationActive={true}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
