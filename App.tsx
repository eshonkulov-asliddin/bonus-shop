import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Transaction, TransactionType } from './types';
import { storageService } from './services/storage';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { Scanner } from './components/Scanner';
import { TelegramSignIn } from './components/TelegramSignIn';
import { formatPrice } from './utils'; // Utility for formatting prices

// --- Shared Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' }> = ({ children, className = '', variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100',
    secondary: 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-100',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-100'
  };
  return (
    <button 
      className={`px-4 md:px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode, title?: string, className?: string, headerAction?: React.ReactNode }> = ({ children, title, className = '', headerAction }) => (
  <div className={`bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 p-4 md:p-6 ${className}`}>
    {(title || headerAction) && (
      <div className="flex flex-row justify-between items-center mb-4 md:mb-5 gap-2">
        {title && <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight truncate">{title}</h3>}
        {headerAction}
      </div>
    )}
    {children}
  </div>
);

// --- Pages ---

const AuthPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (phoneNumber === '000') {
        const admin = storageService.findUserByPhone('000');
        if (admin) onLogin(admin);
        return;
    }

    if (isSignUp) {
      if (!name || !phoneNumber) return setError('Please fill all fields');
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        phoneNumber,
        name,
        role: UserRole.USER,
        balance: 0,
        qrData: `user_${phoneNumber}_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      storageService.saveUser(newUser);
      onLogin(newUser);
    } else {
      const user = storageService.findUserByPhone(phoneNumber);
      if (user) {
        onLogin(user);
      } else {
        setError('User not found. Please sign up.');
      }
    }
  };

  // Handle Telegram auth
  const handleTelegramAuth = (tgUser: any) => {
    // Map Telegram user to your User type
    const user: User = {
      id: tgUser.id.toString(),
      phoneNumber: '', // Telegram does not provide phone
      name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
      role: UserRole.USER,
      balance: 0,
      qrData: tgUser.id.toString(),
      createdAt: new Date().toISOString(),
    };
    storageService.saveUser(user); // Save Telegram user to local storage
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-[#f8fafc]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 text-white rounded-[1.8rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Bonus</h1>
          <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-[0.2em]">The Local Shop Network</p>
        </div>

        <Card>
          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800" 
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
              <input 
                type="tel" 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800" 
                placeholder="e.g. 555-0199"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl text-center">{error}</div>}

            <Button type="submit" className="w-full h-14">
              {isSignUp ? 'Join Program' : 'Welcome Back'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-slate-500 text-sm font-semibold hover:text-indigo-600 transition"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
          </div>

          <div className="flex justify-center mt-8">
            <TelegramSignIn onAuth={handleTelegramAuth} />
          </div>
        </Card>
      </div>
    </div>
  );
};

const UserDashboard: React.FC<{ user: User, transactions: Transaction[], onLogout: () => void }> = ({ user, transactions, onLogout }) => {
  const [showQR, setShowQR] = useState(false);
  const userTransactions = transactions.filter(t => t.userId === user.id);
  
  const stats = useMemo(() => {
    const totalEarned = userTransactions
      .filter(t => t.type === TransactionType.EARN)
      .reduce((sum, t) => sum + t.cashbackAmount, 0);
    
    let tier = 'Bronze';
    let tierColor = 'text-orange-600 bg-orange-50';
    if (totalEarned > 50) { tier = 'Gold'; tierColor = 'text-amber-600 bg-amber-50'; }
    else if (totalEarned > 20) { tier = 'Silver'; tierColor = 'text-slate-600 bg-slate-100'; }

    return { totalEarned, tier, tierColor };
  }, [userTransactions]);

  return (
    <div className="w-full max-w-md mx-auto p-4 md:p-6 space-y-6 md:space-y-8 pb-24">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">My Account</p>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">{user.name}</h2>
          <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${stats.tierColor}`}>
            {stats.tier} Status
          </span>
        </div>
        <button onClick={onLogout} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <div className="relative overflow-hidden bg-indigo-600 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-indigo-200">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8 md:mb-10">
            <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Digital Member Card</p>
          </div>
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Available Rewards</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-black tabular-nums tracking-tight">{formatPrice(user.balance)}</span>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="flex flex-col gap-4">
        <Button 
          className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-between px-6"
          onClick={() => setShowQR(true)}
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
            </div>
            <div>
                <p className="text-sm font-black">Pay or Reward</p>
                <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Tap to Scan</p>
            </div>
          </div>
          <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Recent Activity</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total: {formatPrice(stats.totalEarned)}</span>
        </div>
        {userTransactions.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-10 text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold text-sm">No activity yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {userTransactions.slice(0, 10).map(t => (
              <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === TransactionType.EARN ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === TransactionType.EARN ? '+' : '-'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm leading-none">{t.type === TransactionType.EARN ? 'Reward' : 'Used'}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase mt-1">{new Date(t.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-800">{formatPrice(t.cashbackAmount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-white rounded-[3rem] p-8 text-center space-y-6 shadow-2xl scale-in-95 animate-in slide-in-from-bottom-10">
                <div className="flex flex-col items-center">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-4">My Personal ID</p>
                    <QRCodeDisplay value={user.qrData} size={240} />
                    <h4 className="mt-6 text-xl font-black text-slate-900">{user.name}</h4>
                    <p className="text-slate-400 text-xs font-bold">{user.phoneNumber}</p>
                </div>
                <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-900" onClick={() => setShowQR(false)}>
                    Close Scanner Pass
                </Button>
            </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard: React.FC<{ admin: User, onLogout: () => void }> = ({ admin, onLogout }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<TransactionType | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [insights, setInsights] = useState('Terminal syncing...');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = () => {
      const txs = storageService.getTransactions();
      const usrs = storageService.getUsers();
      setAllTransactions(txs);
      setAllUsers(usrs);
      
      if (txs.length > 0) {
        // Removed the unused `getInsights` import.
        setInsights("System ready for first scan.");
      } else {
        setInsights("System ready for first scan.");
      }
    };
    fetchData();
  }, [selectedUser]);

  const launchScanner = (mode: TransactionType) => {
    setScanMode(mode);
    setShowScanner(true);
  };

  const handleScan = (qrData: string) => {
    // Debug: log all users and their qrData
    const users = storageService.getUsers();
    console.log('All users:', users.map(u => ({ id: u.id, name: u.name, qrData: u.qrData })));
    console.log('Scanned qrData:', qrData);
    const found = users.find(u => String(u.qrData) === String(qrData));
    if (found) {
      setSelectedUser(found);
      setShowScanner(false);
    } else {
      alert("Unknown User QR\nScanned: " + qrData + "\nKnown: " + users.map(u => u.qrData).join(", "));
      setScanMode(null);
    }
  };

  const processTransaction = () => {
        if (!selectedUser || !amount || parseFloat(amount) <= 0 || !scanMode) return;

        const transAmount = parseFloat(amount);
        let cashback = 0;

        if (scanMode === TransactionType.EARN) {
            cashback = transAmount * 0.01;
        } else {
            // In REDEEM mode, the "amount" is exactly what is deducted
            cashback = transAmount;
        }

        const newTx: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            userId: selectedUser.id,
            amount: transAmount,
            cashbackAmount: cashback,
            type: scanMode,
            timestamp: new Date().toISOString(),
            adminId: admin.id
        };

        storageService.saveTransaction(newTx);
        setSelectedUser(null); // Always reset after transaction
        setScanMode(null);    // Always reset after transaction
        setAmount('');
        window.location.reload(); // Redirect to main page
    };

  const currentAmount = parseFloat(amount || '0');
  const potentialReward = scanMode === TransactionType.EARN ? (currentAmount * 0.01) : 0;
  const potentialDeduction = scanMode === TransactionType.REDEEM ? currentAmount : 0;
  const isInvalidRedeem = scanMode === TransactionType.REDEEM && (selectedUser && currentAmount > selectedUser.balance);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-24">
      {/* Merchant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-100 shadow-lg">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Terminal Hub</p>
            <h2 className="text-xl font-black text-slate-900 leading-tight">Merchant Access</h2>
          </div>
        </div>
        <button onClick={onLogout} className="w-full sm:w-auto px-5 py-2.5 bg-slate-50 hover:bg-rose-50 rounded-xl text-slate-500 hover:text-rose-600 font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
          Lock Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Interface */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
            
            {/* Action Choice Phase */}
            {!selectedUser && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={() => launchScanner(TransactionType.EARN)}
                        className="group flex flex-col items-center text-center bg-emerald-500 hover:bg-emerald-600 p-8 rounded-[2rem] text-white shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]"
                    >
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </div>
                        <h3 className="text-xl font-black mb-2">1. Give Reward</h3>
                        <p className="text-emerald-100/70 text-xs font-bold leading-relaxed max-w-[160px]">Reward a purchase. System calculates 1% bonus.</p>
                        <div className="mt-6 px-4 py-2 bg-black/10 rounded-full text-[10px] font-black uppercase tracking-widest">Tap to Scan</div>
                    </button>

                    <button 
                        onClick={() => launchScanner(TransactionType.REDEEM)}
                        className="group flex flex-col items-center text-center bg-indigo-600 hover:bg-indigo-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
                    >
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-black mb-2">2. Use Balance</h3>
                        <p className="text-indigo-100/70 text-xs font-bold leading-relaxed max-w-[160px]">Redeem existing points to pay for a bill.</p>
                        <div className="mt-6 px-4 py-2 bg-black/10 rounded-full text-[10px] font-black uppercase tracking-widest">Tap to Scan</div>
                    </button>
                </div>
            )}

            {/* Price Entry Phase (Post-Scan) */}
            {selectedUser && (
              <div className="animate-in zoom-in-95 duration-300">
                <Card className={`border-4 ${scanMode === TransactionType.EARN ? 'border-emerald-100 ring-emerald-50' : 'border-indigo-100 ring-indigo-50'} ring-2 shadow-2xl`}>
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-50">
                            <div>
                                <span className={`text-[9px] font-black uppercase ${scanMode === TransactionType.EARN ? 'text-emerald-500' : 'text-indigo-500'} tracking-widest bg-slate-50 px-2 py-0.5 rounded`}>
                                    Customer ID: {selectedUser.phoneNumber}
                                </span>
                                <h4 className="text-2xl font-black text-slate-900 mt-1">{selectedUser.name}</h4>
                            </div>
                            <div className={`${scanMode === TransactionType.EARN ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} px-5 py-3 rounded-2xl text-right w-full sm:w-auto`}>
                                <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mb-1">Current Balance</p>
                                <p className="text-2xl font-black tabular-nums">{formatPrice(selectedUser.balance)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    {scanMode === TransactionType.EARN ? 'Total Bill Price' : 'Price to Deduct'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">UZS</span>
                                    <input
                                        type="text"
                                        className={`w-full pl-20 pr-8 py-7 text-4xl font-black bg-slate-50 border-none rounded-[2rem] focus:ring-4 ${scanMode === TransactionType.EARN ? 'focus:ring-emerald-100' : 'focus:ring-indigo-100'} outline-none transition text-slate-800 placeholder:text-slate-200`}
                                        placeholder="0.00"
                                        autoFocus
                                        value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                        onChange={(e) => setAmount(e.target.value.replace(/\./g, ''))}
                                    />
                                </div>
                            </div>

                            {/* Live Calculation Preview */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Balance Prediction</p>
                                    <p className={`text-lg font-black ${isInvalidRedeem ? 'text-rose-500' : 'text-slate-800'}`}>
                                        {formatPrice(selectedUser.balance + (scanMode === TransactionType.EARN ? potentialReward : -potentialDeduction))}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Impact</p>
                                    <p className={`text-lg font-black ${scanMode === TransactionType.EARN ? 'text-emerald-500' : 'text-indigo-600'}`}>
                                        {scanMode === TransactionType.EARN ? '+' : '-'}{formatPrice(scanMode === TransactionType.EARN ? potentialReward : potentialDeduction)}
                                    </p>
                                </div>
                            </div>

                            {isInvalidRedeem && (
                                <div className="p-3 bg-rose-50 rounded-xl text-rose-600 text-[10px] font-black uppercase text-center tracking-widest animate-pulse">
                                    Error: Insufficient Customer Balance
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button 
                                className="flex-1 h-20 rounded-3xl text-lg shadow-xl" 
                                variant={scanMode === TransactionType.EARN ? 'success' : 'primary'} 
                                onClick={processTransaction} 
                                disabled={!amount || parseFloat(amount) <= 0 || isInvalidRedeem}
                            >
                                {scanMode === TransactionType.EARN ? `Reward +${formatPrice(potentialReward)}` : `Deduct -${formatPrice(potentialDeduction)}`}
                            </Button>
                            <Button variant="ghost" className="h-20 sm:w-32" onClick={() => { setSelectedUser(null); setScanMode(null); setAmount(''); }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Card>
              </div>
            )}

            <Card title="Latest Transactions" className="px-0 md:px-6">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[480px]">
                        <thead className="text-[9px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                            <tr>
                                <th className="p-4 md:p-6">Customer</th>
                                <th className="p-4 md:p-6">Type</th>
                                <th className="p-4 md:p-6">Adjustment</th>
                                <th className="p-4 md:p-6 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] md:text-xs">
                            {allTransactions.slice(0, 10).map(t => {
                                const customer = allUsers.find(u => u.id === t.userId);
                                return (
                                    <tr key={t.id} className="border-b last:border-0 border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 md:p-6">
                                            <p className="font-bold text-slate-800">{customer?.name || 'Deleted User'}</p>
                                            <p className="text-[9px] text-slate-400">{customer?.phoneNumber}</p>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${t.type === TransactionType.EARN ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="p-4 md:p-6 font-black tabular-nums">
                                            {t.type === TransactionType.EARN ? '+' : '-'}{formatPrice(t.cashbackAmount)}
                                        </td>
                                        <td className="p-4 md:p-6 text-slate-400 text-[10px] text-right">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>

        {/* Intelligence & Stats Sidebar */}
        <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
            <Card className="bg-slate-900 border-none text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Terminal IQ</span>
                    </div>
                    <p className="text-sm md:text-base font-bold leading-relaxed mb-8 text-slate-100">
                        "{insights}"
                    </p>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                            <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">Registered Members</span>
                            <span className="font-black text-sm">{allUsers.length - 1}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5">
                            <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">Total Shop Volume</span>
                            <span className="font-black text-sm text-indigo-400">${allTransactions.reduce((s,t) => s + t.amount, 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Active Protection</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Encrypted Sessions</p>
                </div>
            </div>
        </div>
      </div>

      {showScanner && <Scanner onScan={handleScan} onClose={() => { setShowScanner(false); setScanMode(null); }} />}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const session = localStorage.getItem('loyalty_session');
    if (session) {
      const storedUser = JSON.parse(session);
      const freshUser = storageService.findUserByPhone(storedUser.phoneNumber);
      if (freshUser) setUser(freshUser);
    }
    setTransactions(storageService.getTransactions());
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('loyalty_session', JSON.stringify(u));
    setTransactions(storageService.getTransactions());
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('loyalty_session');
  };

  useEffect(() => {
    // Always refresh user from storage after transactions or login
    if (user) {
      // Try to find by id first
      let freshUser = storageService.getUsers().find(u => u.id === user.id);
      // If not found (e.g. Telegram user with empty phone), try by phoneNumber if available
      if (!freshUser && user.phoneNumber) {
        freshUser = storageService.getUsers().find(u => u.phoneNumber === user.phoneNumber);
      }
      if (freshUser) setUser(freshUser);
    }
  }, [transactions]);

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-inter antialiased overflow-x-hidden selection:bg-indigo-100">
      <main className="container mx-auto">
        {user.role === UserRole.ADMIN ? (
          <AdminDashboard admin={user} onLogout={handleLogout} />
        ) : (
          <UserDashboard user={user} transactions={transactions} onLogout={handleLogout} />
        )}
      </main>

      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-auto flex items-center justify-center md:justify-end gap-3 bg-white/80 backdrop-blur-xl border border-white/50 px-4 py-2.5 rounded-full shadow-2xl z-[60] pointer-events-none ring-1 ring-slate-900/5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
            {user.role} TERMINAL • LIVE SYNC
        </p>
      </div>
    </div>
  );
}
