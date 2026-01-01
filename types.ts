
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  role: UserRole;
  balance: number;
  qrData: string;
  createdAt: string;
}

export enum TransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM'
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Transaction total
  cashbackAmount: number; // The actual cashback added or deducted
  type: TransactionType;
  timestamp: string;
  adminId: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  transactions: Transaction[];
}
