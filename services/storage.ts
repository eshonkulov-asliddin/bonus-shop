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
let usersCache: CacheEntry<User[]> | null = null;
let transactionsCache: CacheEntry<Transaction[]> | null = null;

export const storageService = {
  getUsers: async (forceRefresh = false): Promise<User[]> => {
    if (!forceRefresh && usersCache && Date.now() - usersCache.timestamp < CACHE_TTL) {
      return usersCache.data;
    }

    try {
      const response = await fetch(`${APPSCRIPT_URL}?action=getUsers`);
      const users = await response.json();
      
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
      const response = await fetch(`${APPSCRIPT_URL}?action=getTransactions`);
      const transactions = await response.json();
      
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
      const response = await fetch(`${APPSCRIPT_URL}?action=saveUser`, {
        method: 'POST',
        body: JSON.stringify(user)
      });
      
      const result = await response.json();
      
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
      const response = await fetch(`${APPSCRIPT_URL}?action=saveTransaction`, {
        method: 'POST',
        body: JSON.stringify(transaction)
      });
      
      const result = await response.json();
      
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

