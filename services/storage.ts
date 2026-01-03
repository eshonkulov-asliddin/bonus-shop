import { User, Transaction } from '../types';

const APPSCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL || '';

if (!APPSCRIPT_URL) {
  console.warn('VITE_APPSCRIPT_URL not configured. Please set it in .env file.');
}

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes memory cache
const REQUEST_TIMEOUT = 20000; // 20 seconds timeout

let usersCache: CacheEntry<User[]> | null = null;
let transactionsCache: CacheEntry<Transaction[]> | null = null;

// Background fetch tracking to avoid duplicate requests
let usersFetchPromise: Promise<User[]> | null = null;
let transactionsFetchPromise: Promise<Transaction[]> | null = null;

// Simple fetch with timeout - no retries to avoid long waits
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Helper to safely get from localStorage
function getLocalData<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      // Accept data up to 24 hours old for instant load
      if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.data as T;
      }
    }
  } catch (e) {
    // Silent fail
  }
  return null;
}

// Helper to safely save to localStorage
function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    // Silent fail (storage full, etc)
  }
}

// Get cached data immediately (memory or localStorage)
function getCachedUsers(): User[] | null {
  if (usersCache) return usersCache.data;
  return getLocalData<User[]>('cashback_users');
}

function getCachedTransactions(): Transaction[] | null {
  if (transactionsCache) return transactionsCache.data;
  return getLocalData<Transaction[]>('cashback_transactions');
}

// Individual fetch functions (not part of the object to avoid circular refs)
async function fetchUsers(): Promise<User[]> {
  const data = await fetchJSON<User[]>(`${APPSCRIPT_URL}?action=getUsers`);
  if (!Array.isArray(data)) {
    throw new Error('Invalid users response');
  }
  return data;
}

async function fetchTransactions(): Promise<Transaction[]> {
  const data = await fetchJSON<Transaction[]>(`${APPSCRIPT_URL}?action=getTransactions`);
  if (!Array.isArray(data)) {
    throw new Error('Invalid transactions response');
  }
  return data;
}

// Background refresh - doesn't block, updates cache when done
function refreshInBackground(): void {
  // Avoid duplicate fetches
  if (!usersFetchPromise) {
    usersFetchPromise = fetchUsers()
      .then(users => {
        usersCache = { data: users, timestamp: Date.now() };
        setLocalData('cashback_users', users);
        return users;
      })
      .catch(err => {
        console.warn('Background users refresh failed:', err);
        return getCachedUsers() || [];
      })
      .finally(() => { usersFetchPromise = null; });
  }
  
  if (!transactionsFetchPromise) {
    transactionsFetchPromise = fetchTransactions()
      .then(txs => {
        transactionsCache = { data: txs, timestamp: Date.now() };
        setLocalData('cashback_transactions', txs);
        return txs;
      })
      .catch(err => {
        console.warn('Background transactions refresh failed:', err);
        return getCachedTransactions() || [];
      })
      .finally(() => { transactionsFetchPromise = null; });
  }
}

export const storageService = {
  // INSTANT: Get cached data immediately, refresh in background
  // This is the fastest method - returns cached data within milliseconds
  getAllDataFast: (): { users: User[]; transactions: Transaction[]; isStale: boolean } => {
    const users = getCachedUsers() || [];
    const transactions = getCachedTransactions() || [];
    const isStale = !usersCache || !transactionsCache || 
                    Date.now() - (usersCache?.timestamp || 0) > CACHE_TTL;
    
    // Trigger background refresh if stale
    if (isStale) {
      refreshInBackground();
    }
    
    return { users, transactions, isStale };
  },

  getUsers: async (forceRefresh = false): Promise<User[]> => {
    // Return valid memory cache
    if (!forceRefresh && usersCache && Date.now() - usersCache.timestamp < CACHE_TTL) {
      return usersCache.data;
    }

    try {
      const users = await fetchUsers();
      usersCache = { data: users, timestamp: Date.now() };
      setLocalData('cashback_users', users);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback 1: expired memory cache
      if (usersCache) return usersCache.data;
      // Fallback 2: localStorage
      const local = getLocalData<User[]>('cashback_users');
      if (local) return local;
      // No data
      return [];
    }
  },

  getTransactions: async (forceRefresh = false): Promise<Transaction[]> => {
    // Return valid memory cache
    if (!forceRefresh && transactionsCache && Date.now() - transactionsCache.timestamp < CACHE_TTL) {
      return transactionsCache.data;
    }

    try {
      const transactions = await fetchTransactions();
      transactionsCache = { data: transactions, timestamp: Date.now() };
      setLocalData('cashback_transactions', transactions);
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Fallback 1: expired memory cache
      if (transactionsCache) return transactionsCache.data;
      // Fallback 2: localStorage
      const local = getLocalData<Transaction[]>('cashback_transactions');
      if (local) return local;
      // No data
      return [];
    }
  },

  // Fetch both in parallel - waits for network
  getAllData: async (forceRefresh = false): Promise<{ users: User[]; transactions: Transaction[] }> => {
    // Return valid memory cache
    if (!forceRefresh && usersCache && transactionsCache && 
        Date.now() - usersCache.timestamp < CACHE_TTL) {
      return { users: usersCache.data, transactions: transactionsCache.data };
    }

    // Fetch in parallel using Promise.allSettled to handle partial failures
    const [usersResult, txResult] = await Promise.allSettled([
      fetchUsers(),
      fetchTransactions()
    ]);

    let users: User[];
    let transactions: Transaction[];

    // Handle users result
    if (usersResult.status === 'fulfilled') {
      users = usersResult.value;
      usersCache = { data: users, timestamp: Date.now() };
      setLocalData('cashback_users', users);
    } else {
      console.error('Failed to fetch users:', usersResult.reason);
      users = usersCache?.data || getLocalData<User[]>('cashback_users') || [];
    }

    // Handle transactions result
    if (txResult.status === 'fulfilled') {
      transactions = txResult.value;
      transactionsCache = { data: transactions, timestamp: Date.now() };
      setLocalData('cashback_transactions', transactions);
    } else {
      console.error('Failed to fetch transactions:', txResult.reason);
      transactions = transactionsCache?.data || getLocalData<Transaction[]>('cashback_transactions') || [];
    }

    return { users, transactions };
  },

  saveUser: async (user: User): Promise<void> => {
    const result = await fetchJSON<{ success: boolean; error?: string }>(
      `${APPSCRIPT_URL}?action=saveUser`,
      { method: 'POST', body: JSON.stringify(user) }
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save user');
    }
    
    // Invalidate cache
    usersCache = null;
  },

  saveTransaction: async (transaction: Transaction): Promise<void> => {
    const result = await fetchJSON<{ success: boolean; error?: string }>(
      `${APPSCRIPT_URL}?action=saveTransaction`,
      { method: 'POST', body: JSON.stringify(transaction) }
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save transaction');
    }
    
    // Invalidate caches
    transactionsCache = null;
    usersCache = null; // Balance may have changed
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
    try {
      localStorage.removeItem('cashback_users');
      localStorage.removeItem('cashback_transactions');
    } catch {}
  }
};
