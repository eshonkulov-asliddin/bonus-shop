export const formatPrice = (amount: number): string => {
  return amount
    .toLocaleString('en-US', {
      style: 'currency',
      currency: 'UZS',
      currencyDisplay: 'symbol', // Display currency symbol
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replace(/,/g, '.'); // Replace commas with dots for better readability
};
