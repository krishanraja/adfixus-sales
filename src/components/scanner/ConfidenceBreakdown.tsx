import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { DomainResult } from '@/types/scanner';

interface ConfidenceBreakdownProps {
  results: DomainResult[];
  size?: number;
}

export function ConfidenceBreakdown({ results, size = 120 }: ConfidenceBreakdownProps) {
  const breakdown = {
    high: results.filter(r => r.traffic_confidence === 'high').length,
    medium: results.filter(r => r.traffic_confidence === 'medium').length,
    low: results.filter(r => r.traffic_confidence === 'low').length,
    unranked: results.filter(r => !r.traffic_confidence).length,
  };

  const data = [
    { name: 'High Confidence', value: breakdown.high, color: 'hsl(var(--success))' },
    { name: 'Medium Confidence', value: breakdown.medium, color: 'hsl(var(--warning))' },
    { name: 'Low Confidence', value: breakdown.low, color: 'hsl(var(--muted-foreground))' },
    { name: 'Unranked', value: breakdown.unranked, color: 'hsl(var(--border))' },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height: size }}>
        No data
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const data = payload[0].payload;
              return (
                <div className="glass-card px-3 py-2 text-sm rounded-lg shadow-xl border border-border">
                  <p className="font-semibold text-foreground">{data.name}</p>
                  <p className="text-muted-foreground">{data.value} domain{data.value !== 1 ? 's' : ''}</p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{results.length}</div>
          <div className="text-xs text-muted-foreground">domains</div>
        </div>
      </div>
    </div>
  );
}
