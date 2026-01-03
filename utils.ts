export const formatPrice = (amount: number | undefined | null): string => {
  const safeAmount = amount ?? 0;
  return safeAmount
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

// Generate a secure random QR token that can't be guessed
// Format: "cb_" + 32 random hex characters (128-bit entropy)
export const generateSecureQrToken = (): string => {
  const prefix = 'cb_'; // cashback prefix to identify our QR codes
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Cryptographically secure random
    const array = new Uint8Array(16); // 128 bits
    crypto.getRandomValues(array);
    const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    return prefix + hex;
  }
  
  // Fallback (less secure but still random)
  let hex = '';
  for (let i = 0; i < 32; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return prefix + hex;
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
