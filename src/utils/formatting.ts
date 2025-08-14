// Shared formatting utilities

export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '$0';
  const num = Number(amount);
  
  if (num < 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  } else if (num < 1000000) {
    const kValue = num / 1000;
    return `$${kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1)}K`;
  } else {
    const mValue = num / 1000000;
    return `$${mValue % 1 === 0 ? mValue.toFixed(0) : mValue.toFixed(1)}M`;
  }
};

export const formatNumber = (num: number | undefined | null): string => {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  const value = Number(num);
  
  if (value < 1000) {
    return new Intl.NumberFormat('en-US').format(value);
  } else if (value < 1000000) {
    const kValue = value / 1000;
    return `${kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1)}K`;
  } else {
    const mValue = value / 1000000;
    return `${mValue % 1 === 0 ? mValue.toFixed(0) : mValue.toFixed(1)}M`;
  }
};

export const formatPercentage = (num: number | undefined | null, decimals: number = 0): string => {
  if (num === null || num === undefined || isNaN(Number(num))) return '0%';
  const rounded = Number(num).toFixed(decimals);
  return `${rounded.endsWith('.0') && decimals > 0 ? rounded.slice(0, -2) : rounded}%`;
};

export const formatNumberWithCommas = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};