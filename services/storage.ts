import { User, Transaction } from '../types';

// Replace this with your deployed Apps Script URL
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxBI40KwoVA7lo6mBwz0kI4ahIFX3k0zxIq7epR2U6HUT63p-562oIsaON3X3Rj84yfeQ/exec';

// Cache to reduce API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let usersCache: CacheEntry<User[]> | null = null;
let transactionsCache: CacheEntry<Transaction[]> | null = null;

export const storageService = {
  getUsers: async (forceRefresh = false): Promise<User[]> => {
    // Return cached data if valid
    if (!forceRefresh && usersCache && Date.now() - usersCache.timestamp < CACHE_TTL) {
      console.log('Returning cached users');
      return usersCache.data;
    }

    try {
      const response = await fetch(`${APPSCRIPT_URL}?action=getUsers`);
      const users = await response.json();
      
      // Update cache
      usersCache = {
        data: users,
        timestamp: Date.now()
      };
      
      console.log('Fetched users from Sheets:', users.length);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return cached data if available, even if expired
      if (usersCache) return usersCache.data;
      return [];
    }
  },

  getTransactions: async (forceRefresh = false): Promise<Transaction[]> => {
    // Return cached data if valid
    if (!forceRefresh && transactionsCache && Date.now() - transactionsCache.timestamp < CACHE_TTL) {
      console.log('Returning cached transactions');
      return transactionsCache.data;
    }

    try {
      const response = await fetch(`${APPSCRIPT_URL}?action=getTransactions`);
      const transactions = await response.json();
      
      // Update cache
      transactionsCache = {
        data: transactions,
        timestamp: Date.now()
      };
      
      console.log('Fetched transactions from Sheets:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Return cached data if available, even if expired
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
        // Invalidate cache
        usersCache = null;
        console.log('User saved successfully:', user.id);
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
        // Invalidate both caches
        transactionsCache = null;
        usersCache = null; // User balance changed
        console.log('Transaction saved successfully:', transaction.id);
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
    console.log('Cache cleared');
  }
};

