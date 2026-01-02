import { User, Transaction } from '../types';

const APPSCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL || '';

if (!APPSCRIPT_URL) {
  console.warn('VITE_APPSCRIPT_URL not configured. Please set it in .env file.');
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 15000; // 15 seconds timeout
const MAX_RETRIES = 2;

let usersCache: CacheEntry<User[]> | null = null;
let transactionsCache: CacheEntry<Transaction[]> | null = null;

// Fetch with timeout and retry logic
const fetchWithTimeout = async (url: string, options?: RequestInit, timeout = REQUEST_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const fetchWithRetry = async <T>(
  url: string, 
  options?: RequestInit, 
  retries = MAX_RETRIES
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Fetch attempt ${attempt + 1}/${retries + 1} failed:`, error);
      
      // Don't retry on abort (timeout) for POST requests
      if (options?.method === 'POST' && (error as Error).name === 'AbortError') {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
};

export const storageService = {
  getUsers: async (forceRefresh = false): Promise<User[]> => {
    if (!forceRefresh && usersCache && Date.now() - usersCache.timestamp < CACHE_TTL) {
      return usersCache.data;
    }

    try {
      const users = await fetchWithRetry<User[]>(`${APPSCRIPT_URL}?action=getUsers`);
      
      usersCache = {
        data: users,
        timestamp: Date.now()
      };
      
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      if (usersCache) return usersCache.data;
      return [];
    }
  },

  getTransactions: async (forceRefresh = false): Promise<Transaction[]> => {
    if (!forceRefresh && transactionsCache && Date.now() - transactionsCache.timestamp < CACHE_TTL) {
      return transactionsCache.data;
    }

    try {
      const transactions = await fetchWithRetry<Transaction[]>(`${APPSCRIPT_URL}?action=getTransactions`);
      
      transactionsCache = {
        data: transactions,
        timestamp: Date.now()
      };
      
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (transactionsCache) return transactionsCache.data;
      return [];
    }
  },

  saveUser: async (user: User): Promise<void> => {
    try {
      const result = await fetchWithRetry<{ success: boolean; error?: string }>(
        `${APPSCRIPT_URL}?action=saveUser`,
        {
          method: 'POST',
          body: JSON.stringify(user)
        },
        1 // Only 1 retry for writes
      );
      
      if (result.success) {
        usersCache = null;
      } else {
        console.error('Error saving user:', result.error);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  },

  saveTransaction: async (transaction: Transaction): Promise<void> => {
    try {
      const result = await fetchWithRetry<{ success: boolean; error?: string }>(
        `${APPSCRIPT_URL}?action=saveTransaction`,
        {
          method: 'POST',
          body: JSON.stringify(transaction)
        },
        1 // Only 1 retry for writes
      );
      
      if (result.success) {
        transactionsCache = null;
        usersCache = null;
      } else {
        console.error('Error saving transaction:', result.error);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  },

  findUserByPhone: async (phone: string): Promise<User | undefined> => {
    const users = await storageService.getUsers();
    return users.find(u => u.phoneNumber === phone);
  },

  findUserById: async (id: string): Promise<User | undefined> => {
    const users = await storageService.getUsers();
    return users.find(u => String(u.id) === String(id));
  },

  clearCache: () => {
    usersCache = null;
    transactionsCache = null;
  }
};
