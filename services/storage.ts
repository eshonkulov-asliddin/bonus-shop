import { User, Transaction, UserRole } from '../types';

const USERS_KEY = 'loyalty_plus_users';
const TRANSACTIONS_KEY = 'loyalty_plus_transactions';

// Initial Mock Admin
const MOCK_ADMIN: User = {
  id: 'admin_1',
  phoneNumber: '000',
  name: 'Store Manager',
  role: UserRole.ADMIN,
  balance: 0,
  qrData: 'ADMIN_KEY',
  createdAt: new Date().toISOString()
};

export const storageService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    const users = data ? JSON.parse(data) : [];
    if (!users.find((u: User) => u.role === UserRole.ADMIN)) {
      users.push(MOCK_ADMIN);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    return users;
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index > -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  saveTransaction: (transaction: Transaction) => {
    const transactions = storageService.getTransactions();
    transactions.unshift(transaction); // Add to beginning
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

    // Update user balance in "Sheet"
    const users = storageService.getUsers();
    const user = users.find(u => u.id === transaction.userId);
    if (user) {
      if (transaction.type === 'EARN') {
        user.balance += transaction.cashbackAmount;
      } else {
        user.balance -= transaction.cashbackAmount;
      }
      // Save the entire users array to persist the updated balance
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },

  findUserByPhone: (phone: string): User | undefined => {
    return storageService.getUsers().find(u => u.phoneNumber === phone);
  },

  findUserById: (id: string): User | undefined => {
    return storageService.getUsers().find(u => u.id === id);
  }
};
