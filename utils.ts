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

// Generate a reliable unique ID
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Debounce function for preventing rapid API calls
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
};
