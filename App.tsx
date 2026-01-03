import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserRole, Transaction, TransactionType } from './types';
import { storageService } from './services/storage';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { Scanner } from './components/Scanner';
import { TelegramSignIn } from './components/TelegramSignIn';
import { formatPrice, generateId, debounce } from './utils';
import { useI18n } from './services/i18n';
import { LanguageSelect } from './components/LanguageSelect';

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

const AuthPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const { t, lang, setLang } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin123';
  const TEST_USERNAME = 'test';
  const TEST_PASSWORD = 'test123';

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!username || !password) {
        setError(t('loginMissing'));
        setLoading(false);
        return;
      }

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const adminUser: User = {
          id: 'admin_' + Date.now(),
          phoneNumber: '',
          name: 'Administrator',
          role: UserRole.ADMIN,
          balance: 0,
          qrData: 'admin_' + Date.now(),
          createdAt: new Date().toISOString()
        };
        
        onLogin(adminUser);
        
        storageService.getUsers().then(existingUsers => {
          const backendAdmin = existingUsers.find(u => u.role === UserRole.ADMIN);
          if (backendAdmin) {
            localStorage.setItem('loyalty_session', JSON.stringify(backendAdmin));
          } else {
            storageService.saveUser(adminUser);
          }
        }).catch(err => console.error('Background admin sync error:', err));
      } 
      else if (username === TEST_USERNAME && password === TEST_PASSWORD) {
        const testUser: User = {
          id: 'test_user_1',
          phoneNumber: '+998901234567',
          name: 'Test User',
          role: UserRole.USER,
          balance: 0,
          qrData: 'test_user_1',
          createdAt: new Date().toISOString()
        };
        
        onLogin(testUser);
        
        storageService.getUsers().then(existingUsers => {
          const backendTest = existingUsers.find(u => u.id === 'test_user_1');
          if (backendTest) {
            localStorage.setItem('loyalty_session', JSON.stringify(backendTest));
          } else {
            storageService.saveUser(testUser);
          }
        }).catch(err => console.error('Background test user sync error:', err));
      } 
      else {
        setError(t('invalidCredentials'));
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (tgUser: any) => {
    setLoading(true);
    setError('');
    
    try {
      const telegramId = String(tgUser.id);
      const qrDataValue = 'tg_' + telegramId;
      
      // Check if user already exists in backend
      const existingUsers = await storageService.getUsers(true);
      let existingUser = existingUsers.find(u => String(u.id) === telegramId);
      
      if (existingUser) {
        // User exists - use their stored data (with updated balance)
        if (!existingUser.qrData || existingUser.qrData === '' || existingUser.qrData === telegramId) {
          existingUser.qrData = qrDataValue;
          storageService.saveUser(existingUser).catch(err => console.error('Background qrData update error:', err));
        }
        onLogin(existingUser);
      } else {
        // New user - create profile
        const user: User = {
          id: telegramId,
          phoneNumber: '',
          name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
          role: UserRole.USER,
          balance: 0,
          qrData: qrDataValue,
          createdAt: new Date().toISOString(),
        };
        
        onLogin(user);
        storageService.saveUser(user).catch(err => console.error('Background user save error:', err));
      }
      
    } catch (error) {
      console.error('Telegram auth error:', error);
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('appName')}</h1>
          <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-[0.2em]">{t('appTagline')}</p>
        </div>

        <Card>
          <div className="flex justify-end -mt-2 -mr-2 mb-4">
            <LanguageSelect />
          </div>
          {showAdminLogin ? (
            // Admin Login Form
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('usernameLabel')}</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800" 
                  placeholder={t('usernamePlaceholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('passwordLabel')}</label>
                <input 
                  type="password" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800" 
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl text-center">{error}</div>}

              <Button type="submit" className="w-full h-14" disabled={loading}>
                {loading ? t('signInLoading') : t('adminLogin')}
              </Button>
              
              <button 
                type="button"
                onClick={() => { setShowAdminLogin(false); setError(''); setUsername(''); setPassword(''); }}
                className="w-full text-slate-500 text-sm font-semibold hover:text-indigo-600 transition mt-4"
              >
                {t('backToUserLogin')}
              </button>
            </form>
          ) : (
            // User Login (Telegram Only)
            <div className="space-y-6">
              <div className="text-center py-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{t('userLogin')}</h3>
                <p className="text-slate-500 text-sm">{t('telegramPrompt')}</p>
              </div>

              {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl text-center">{error}</div>}

              <div className="flex justify-center">
                <TelegramSignIn onAuth={handleTelegramAuth} />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setShowAdminLogin(true)}
                  className="w-full text-slate-400 text-xs font-semibold hover:text-indigo-600 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t('adminLogin')}
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const UserDashboard: React.FC<{ user: User, transactions: Transaction[], onLogout: () => void }> = ({ user, transactions, onLogout }) => {
  const { t } = useI18n();
  const [showQR, setShowQR] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);
  
  useEffect(() => {
    if (showQR && 'wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').catch(() => {});
    }
  }, [showQR]);
  
  const userTransactions = useMemo(() => 
    transactions.filter(t => t.userId === user.id),
    [transactions, user.id]
  );
  
  const sortedUserTransactions = useMemo(() => 
    [...userTransactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [userTransactions]
  );
  
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
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('myAccount')}</p>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">{user.name}</h2>
          <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${stats.tierColor}`}>
            {t(stats.tier === 'Gold' ? 'tierGold' : stats.tier === 'Silver' ? 'tierSilver' : 'tierBronze')} {t('status')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelect />
          <button onClick={() => window.location.reload()} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition shadow-sm" title={t('refresh')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={onLogout} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden bg-indigo-600 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-indigo-200">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8 md:mb-10">
            <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">{t('memberCard')}</p>
          </div>
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">{t('availableRewards')}</p>
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
                <p className="text-sm font-black">{t('payOrReward')}</p>
                <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">{t('tapToScan')}</p>
            </div>
          </div>
          <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">{t('recentActivity')}</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('total')}: {formatPrice(stats.totalEarned)}</span>
        </div>
        {userTransactions.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-10 text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold text-sm">{t('noActivity')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedUserTransactions
              .slice(0, showAllTx ? undefined : 5)
              .map(tx => (
              <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === TransactionType.EARN ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {tx.type === TransactionType.EARN ? '+' : '-'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm leading-none">{tx.type === TransactionType.EARN ? t('reward') : t('used')}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase mt-1">
                      {new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-slate-800">{formatPrice(tx.cashbackAmount)}</span>
              </div>
            ))}
            {!showAllTx && userTransactions.length > 5 && (
              <button
                onClick={() => setShowAllTx(true)}
                className="w-full py-3 text-center text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-colors"
              >
                {t('viewAll')} ({userTransactions.length})
              </button>
            )}
            {showAllTx && userTransactions.length > 5 && (
              <button
                onClick={() => setShowAllTx(false)}
                className="w-full py-3 text-center text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors"
              >
                {t('showLess')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-sm text-center space-y-4 sm:space-y-6 py-4">
                <div className="flex flex-col items-center">
                    <p className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4">{t('showToSeller')}</p>
                    <QRCodeDisplay value={user.qrData} screenshotHint={t('screenshotHint')} />
                    <h4 className="mt-4 sm:mt-6 text-lg sm:text-xl font-black text-slate-900">{user.name}</h4>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => setShowQR(false)}>
                    {t('close')}
                </Button>
            </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard: React.FC<{ admin: User, onLogout: () => void }> = ({ admin, onLogout }) => {
  const { t, lang, setLang } = useI18n();
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<TransactionType | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [insights, setInsights] = useState(t('systemReady'));
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(false);
  
  // Smart loading: show limited items by default
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const INITIAL_TX_LIMIT = 5;
  const INITIAL_USER_LIMIT = 6;

  // Memoized computed data for performance
  const regularUsers = useMemo(() => 
    allUsers.filter(u => u.role !== UserRole.ADMIN),
    [allUsers]
  );

  const userMap = useMemo(() => 
    new Map(allUsers.map(u => [u.id, u])),
    [allUsers]
  );

  const sortedTransactions = useMemo(() => 
    [...allTransactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [allTransactions]
  );

  const sortedUsersByBalance = useMemo(() => 
    [...regularUsers].sort((a, b) => b.balance - a.balance),
    [regularUsers]
  );

  // Pre-computed user stats for fast lookup
  const userStatsMap = useMemo(() => {
    const statsMap = new Map<string, { earned: number; used: number }>();
    for (const tx of allTransactions) {
      const existing = statsMap.get(tx.userId) || { earned: 0, used: 0 };
      if (tx.type === TransactionType.EARN) {
        existing.earned += tx.cashbackAmount;
      } else {
        existing.used += tx.cashbackAmount;
      }
      statsMap.set(tx.userId, existing);
    }
    return statsMap;
  }, [allTransactions]);

  // Dashboard statistics
  const dashboardStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTxs = allTransactions.filter(tx => new Date(tx.timestamp) >= today);
    const todayEarned = todayTxs
      .filter(tx => tx.type === TransactionType.EARN)
      .reduce((sum, tx) => sum + tx.cashbackAmount, 0);
    const todayRedeemed = todayTxs
      .filter(tx => tx.type === TransactionType.REDEEM)
      .reduce((sum, tx) => sum + tx.cashbackAmount, 0);
    
    const totalBalance = regularUsers.reduce((sum, u) => sum + u.balance, 0);
    const avgBalance = regularUsers.length > 0 ? totalBalance / regularUsers.length : 0;

    return {
      totalUsers: regularUsers.length,
      totalTransactions: allTransactions.length,
      todayTransactions: todayTxs.length,
      todayVolume: todayEarned + todayRedeemed,
      avgBalance
    };
  }, [allTransactions, regularUsers]);

  // Filtered users for quick select (memoized)
  const filteredQuickSelectUsers = useMemo(() => {
    if (!searchQuery) {
      return regularUsers.slice(0, 4);
    }
    const q = searchQuery.toLowerCase();
    return regularUsers
      .filter(u => {
        const name = (u.name || '').toLowerCase();
        const phone = String(u.phoneNumber || '');
        return name.includes(q) || phone.includes(q);
      })
      .slice(0, 6);
  }, [regularUsers, searchQuery]);

  // Update insights text when language changes
  useEffect(() => {
    setInsights(t('systemReady'));
  }, [lang, t]);

  useEffect(() => {
    // FAST: Load cached data immediately (instant)
    const { users: cachedUsers, transactions: cachedTxs, isStale } = storageService.getAllDataFast();
    
    if (cachedUsers.length > 0 || cachedTxs.length > 0) {
      const uniqueTxs = Array.from(new Map(cachedTxs.map(tx => [tx.id, tx])).values());
      setAllUsers(cachedUsers);
      setAllTransactions(uniqueTxs);
      setIsLoadingData(false);
      setInsights(t('systemReady'));
    }

    // If stale or no cache, fetch fresh data in background
    if (isStale || cachedUsers.length === 0) {
      storageService.getAllData().then(({ users, transactions }) => {
        const uniqueTxs = Array.from(new Map(transactions.map(tx => [tx.id, tx])).values());
        setAllUsers(users);
        setAllTransactions(uniqueTxs);
        setInsights(t('systemReady'));
      }).catch(err => {
        console.error('Background refresh failed:', err);
        if (cachedUsers.length === 0) {
          setInsights(t('connectionErrorRetrying'));
        }
      }).finally(() => {
        setIsLoadingData(false);
      });
    }
  }, []);

  const launchScanner = (mode: TransactionType) => {
    setScanMode(mode);
    setShowScanner(true);
  };

  const selectUserManually = (user: User, mode: TransactionType) => {
    setScanMode(mode);
    setSelectedUser(user);
    setSearchQuery('');
  };

  const handleScan = async (qrData: string) => {
    const users = await storageService.getUsers(true);
    
    if (users.length === 0) {
      setShowScanner(false);
      setScanMode(null);
      alert(t('noUsersAlert'));
      return;
    }
    
    const found = users.find(u => {
      const userQrData = String(u.qrData).trim();
      const scannedData = String(qrData).trim();
      return userQrData === scannedData || String(u.id) === scannedData;
    });
    
    if (found) {
      setSelectedUser(found);
      setShowScanner(false);
    } else {
      setShowScanner(false);
      setScanMode(null);
      alert(t('unknownUserQR') + "\n" + "Scanned: '" + qrData + "'\nKnown QR codes: " + users.map(u => "'" + u.qrData + "'").join(", "));
    }
  };

  const processTransaction = async () => {
        if (!selectedUser || !amount || parseFloat(amount) <= 0 || !scanMode || isProcessing) return;

        setIsProcessing(true);
        
        try {
          const transAmount = parseFloat(amount);
          let cashback = 0;

          if (scanMode === TransactionType.EARN) {
              cashback = transAmount * 0.01;
          } else {
              cashback = transAmount;
          }

          const newTx: Transaction = {
              id: generateId(),
              userId: selectedUser.id,
              amount: transAmount,
              cashbackAmount: cashback,
              type: scanMode,
              timestamp: new Date().toISOString(),
              adminId: admin.id
          };

          const updatedUser = {
            ...selectedUser,
            balance: selectedUser.balance + (scanMode === TransactionType.EARN ? cashback : -cashback)
          };
          
          setAllTransactions(prev => [newTx, ...prev]);
          setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
          
          setSelectedUser(null);
          setScanMode(null);
          setAmount('');
          setIsProcessing(false);
          
          storageService.saveTransaction(newTx).then(() => {
            storageService.getTransactions(true).then(txs => {
              const uniqueTxs = Array.from(new Map(txs.map(t => [t.id, t])).values());
              setAllTransactions(uniqueTxs);
            });
            storageService.getUsers(true).then(usrs => {
              setAllUsers(usrs);
            });
          }).catch(error => {
            console.error('Error saving transaction:', error);
            setAllTransactions(prev => prev.filter(t => t.id !== newTx.id));
            setAllUsers(prev => prev.map(u => u.id === selectedUser.id ? selectedUser : u));
            alert(t('failedSaveTransaction'));
          });
          
        } catch (error) {
          console.error('Error processing transaction:', error);
          alert(t('failedProcessTransaction'));
          setIsProcessing(false);
        }
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
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('terminalHub')}</p>
            <h2 className="text-xl font-black text-slate-900 leading-tight">{t('merchantAccess')}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-2">
          <LanguageSelect />
          <button onClick={() => window.location.reload()} className="w-10 h-10 bg-slate-50 hover:bg-indigo-50 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center" title={t('refresh')}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={onLogout} className="w-full sm:w-auto px-5 py-2.5 bg-slate-50 hover:bg-rose-50 rounded-xl text-slate-500 hover:text-rose-600 font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
            {t('lockSession')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Interface */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
            
            {/* Stats Toggle Button */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-700">{t('viewStatistics')}</span>
                {dashboardStats.todayTransactions > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full">
                    {dashboardStats.todayTransactions} {t('today')}
                  </span>
                )}
              </div>
              <svg className={`w-5 h-5 text-slate-400 transition-transform ${showStats ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dashboard Statistics (Collapsible) */}
            {showStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200">
              {/* Total Users */}
              <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 relative overflow-hidden min-w-0">
                <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-[2rem]"></div>
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-slate-800 truncate">{dashboardStats.totalUsers}</p>
                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{t('totalUsers')}</p>
                </div>
              </div>

              {/* Total Transactions */}
              <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 relative overflow-hidden min-w-0">
                <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-[2rem]"></div>
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-slate-800 truncate">{dashboardStats.totalTransactions}</p>
                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{t('totalTransactions')}</p>
                </div>
              </div>

              {/* Today's Transactions */}
              <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 relative overflow-hidden min-w-0">
                <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-[2rem]"></div>
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-slate-800 truncate">{dashboardStats.todayTransactions}</p>
                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{t('todayTransactions')}</p>
                </div>
              </div>

              {/* Today's Volume */}
              <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 relative overflow-hidden min-w-0">
                <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-violet-50 to-transparent rounded-bl-[2rem]"></div>
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-violet-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-xl font-black text-slate-800 truncate">{formatPrice(dashboardStats.todayVolume)}</p>
                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{t('todayVolume')}</p>
                </div>
              </div>
            </div>
            )}

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
                        <h3 className="text-xl font-black mb-2">{t('giveReward')}</h3>
                        <p className="text-emerald-100/70 text-xs font-bold leading-relaxed max-w-[160px]">{t('giveRewardHint')}</p>
                        <div className="mt-6 px-4 py-2 bg-black/10 rounded-full text-[10px] font-black uppercase tracking-widest">{t('tapToScan')}</div>
                    </button>

                    <button 
                        onClick={() => launchScanner(TransactionType.REDEEM)}
                        className="group flex flex-col items-center text-center bg-indigo-600 hover:bg-indigo-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
                    >
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-black mb-2">{t('useBalance')}</h3>
                        <p className="text-indigo-100/70 text-xs font-bold leading-relaxed max-w-[160px]">{t('useBalanceHint')}</p>
                        <div className="mt-6 px-4 py-2 bg-black/10 rounded-full text-[10px] font-black uppercase tracking-widest">{t('tapToScan')}</div>
                    </button>
                </div>
            )}

            {/* Quick Select - Manual User Lookup (No Camera Needed) */}
            {!selectedUser && regularUsers.length > 0 && (
              <Card className="border-slate-100">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">{t('quickSelect')}</h3>
                    <span className="text-[10px] text-slate-400 font-medium">{t('orSelectUser')}</span>
                  </div>
                  <input
                    type="text"
                    placeholder={t('searchUser')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {filteredQuickSelectUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 text-sm truncate">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{formatPrice(user.balance)}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => selectUserManually(user, TransactionType.EARN)}
                              className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-colors"
                              title={t('giveReward')}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v12m6-6H6" /></svg>
                            </button>
                            <button
                              onClick={() => selectUserManually(user, TransactionType.REDEEM)}
                              className="w-8 h-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center justify-center transition-colors"
                              title={t('useBalance')}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M18 12H6" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Price Entry Phase (Post-Scan) */}
            {selectedUser && (
              <div className="animate-in zoom-in-95 duration-300">
                <Card className={`border-4 ${scanMode === TransactionType.EARN ? 'border-emerald-100 ring-emerald-50' : 'border-indigo-100 ring-indigo-50'} ring-2 shadow-2xl`}>
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-50">
                            <div>
                                <span className={`text-[9px] font-black uppercase ${scanMode === TransactionType.EARN ? 'text-emerald-500' : 'text-indigo-500'} tracking-widest bg-slate-50 px-2 py-0.5 rounded`}>
                                  {t('customerId')}: {selectedUser.phoneNumber}
                                </span>
                                <h4 className="text-2xl font-black text-slate-900 mt-1">{selectedUser.name}</h4>
                            </div>
                            <div className={`${scanMode === TransactionType.EARN ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} px-5 py-3 rounded-2xl text-right w-full sm:w-auto`}>
                                <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mb-1">{t('currentBalance')}</p>
                                <p className="text-2xl font-black tabular-nums">{formatPrice(selectedUser.balance)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    {scanMode === TransactionType.EARN ? t('totalBillPrice') : t('priceToDeduct')}
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
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('newBalancePrediction')}</p>
                                    <p className={`text-lg font-black ${isInvalidRedeem ? 'text-rose-500' : 'text-slate-800'}`}>
                                        {formatPrice(selectedUser.balance + (scanMode === TransactionType.EARN ? potentialReward : -potentialDeduction))}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('transactionImpact')}</p>
                                    <p className={`text-lg font-black ${scanMode === TransactionType.EARN ? 'text-emerald-500' : 'text-indigo-600'}`}>
                                        {scanMode === TransactionType.EARN ? '+' : '-'}{formatPrice(scanMode === TransactionType.EARN ? potentialReward : potentialDeduction)}
                                    </p>
                                </div>
                            </div>

                            {isInvalidRedeem && (
                              <div className="p-3 bg-rose-50 rounded-xl text-rose-600 text-[10px] font-black uppercase text-center tracking-widest animate-pulse">
                                {t('invalidRedeem')}
                              </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button 
                                className="flex-1 h-20 rounded-3xl text-lg shadow-xl" 
                                variant={scanMode === TransactionType.EARN ? 'success' : 'primary'} 
                                onClick={processTransaction} 
                                disabled={!amount || parseFloat(amount) <= 0 || isInvalidRedeem || isProcessing}
                            >
                                {isProcessing ? t('processing') : (scanMode === TransactionType.EARN ? `${t('rewardPlus')}${formatPrice(potentialReward)}` : `${t('deductMinus')}${formatPrice(potentialDeduction)}`)}
                            </Button>
                            <Button variant="ghost" className="h-20 sm:w-32" onClick={() => { setSelectedUser(null); setScanMode(null); setAmount(''); }} disabled={isProcessing}>
                                {t('cancel')}
                            </Button>
                        </div>
                    </div>
                </Card>
              </div>
            )}

            <Card title={t('latestTransactions')} headerAction={
                allTransactions.length > INITIAL_TX_LIMIT && (
                  <button 
                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider transition-colors"
                  >
                    {showAllTransactions ? t('showLess') : `${t('showAll')} (${allTransactions.length})`}
                  </button>
                )
            }>
                <div className="max-h-80 overflow-y-auto overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6">
                    <table className="w-full text-left min-w-[480px]">
                        <thead className="text-[9px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                            <tr>
                                <th className="p-4 md:p-6">{t('customer')}</th>
                                <th className="p-4 md:p-6">{t('type')}</th>
                                <th className="p-4 md:p-6">{t('adjustment')}</th>
                                <th className="p-4 md:p-6 text-right">{t('time')}</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] md:text-xs">
                            {sortedTransactions
                              .slice(0, showAllTransactions ? undefined : INITIAL_TX_LIMIT)
                              .map(tx => {
                                const customer = userMap.get(tx.userId);
                                return (
                                    <tr key={tx.id} className="border-b last:border-0 border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 md:p-6">
                                            <p className="font-bold text-slate-800">{customer?.name || t('deletedUser')}</p>
                                            <p className="text-[9px] text-slate-400">{customer?.phoneNumber || t('noPhone')}</p>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${tx.type === TransactionType.EARN ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="p-4 md:p-6 font-black tabular-nums">
                                            {tx.type === TransactionType.EARN ? '+' : '-'}{formatPrice(tx.cashbackAmount)}
                                        </td>
                                        <td className="p-4 md:p-6 text-slate-400 text-[10px] text-right">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card title={t('userCashbackOverview')} headerAction={
                regularUsers.length > INITIAL_USER_LIMIT && (
                  <button 
                    onClick={() => setShowAllUsers(!showAllUsers)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider transition-colors"
                  >
                    {showAllUsers ? t('showLess') : `${t('showAll')} (${regularUsers.length})`}
                  </button>
                )
            }>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sortedUsersByBalance
                        .slice(0, showAllUsers ? undefined : INITIAL_USER_LIMIT)
                        .map(u => {
                            const stats = userStatsMap.get(u.id) || { earned: 0, used: 0 };
                            
                            return (
                                <div key={u.id} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-100">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                                            <p className="text-[9px] text-slate-400 uppercase font-black">{u.phoneNumber || t('noPhone')}</p>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-black ${u.balance > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {formatPrice(u.balance)}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-[10px]">
                                        <div>
                                            <span className="text-slate-400 font-bold">{t('earned')}: </span>
                                            <span className="text-emerald-600 font-black">{formatPrice(stats.earned)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 font-bold">{t('used')}: </span>
                                            <span className="text-rose-600 font-black">{formatPrice(stats.used)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
              </div>
            </Card>
        </div>

        {/* Intelligence & Stats Sidebar */}
        <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
            <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 border-0 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="absolute -right-16 -top-16 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-white/90">{t('terminalIq')}</span>
                    </div>
                    <p className="text-base md:text-lg font-bold leading-relaxed mb-8 text-white/90">
                        {insights}
                    </p>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2.5 border-b border-white/20">
                            <span className="text-xs text-white/70 font-bold uppercase tracking-wider">{t('registeredMembers')}</span>
                            <span className="font-black text-lg text-white">{allUsers.length - 1}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5">
                            <span className="text-xs text-white/70 font-bold uppercase tracking-wider">{t('totalShopVolume')}</span>
                            <span className="font-black text-lg text-white">{formatPrice(allTransactions.reduce((s,t) => s + t.amount, 0))}</span>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{t('activeProtection')}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{t('encryptedSessions')}</p>
                </div>
            </div>
        </div>
      </div>

      {showScanner && <Scanner onScan={handleScan} onClose={() => { setShowScanner(false); setScanMode(null); }} />}
    </div>
  );
};

export default function App() {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const session = localStorage.getItem('loyalty_session');
      if (session) {
        try {
          const storedUser = JSON.parse(session);
          setUser(storedUser);
          setIsLoading(false);
          
          if (storedUser.role !== UserRole.ADMIN) {
            storageService.getTransactions().then(txs => {
              setTransactions(txs);
            }).catch(err => console.error('Error loading transactions:', err));
          }
          
          storageService.findUserById(storedUser.id).then(freshUser => {
            if (freshUser) {
              setUser(freshUser);
              localStorage.setItem('loyalty_session', JSON.stringify(freshUser));
            }
          }).catch(err => console.error('Error refreshing user:', err));
          
        } catch (error) {
          console.error('Error parsing session:', error);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const handleLogin = async (u: User) => {
    setUser(u);
    localStorage.setItem('loyalty_session', JSON.stringify(u));
    
    if (u.role !== UserRole.ADMIN) {
      storageService.getTransactions().then(txs => {
        setTransactions(txs);
      }).catch(err => console.error('Error loading transactions:', err));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('loyalty_session');
  };

  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN && transactions.length > 0) {
      storageService.findUserById(user.id).then(freshUser => {
        if (freshUser && freshUser.balance !== user.balance) {
          setUser(freshUser);
          localStorage.setItem('loyalty_session', JSON.stringify(freshUser));
        }
      }).catch(err => console.error('Error refreshing user:', err));
    }
  }, [transactions]);

  useEffect(() => {
    if (!user || user.role === UserRole.ADMIN) return;

    let intervalId: NodeJS.Timeout;
    
    const refreshData = () => {
      storageService.findUserById(user.id).then(freshUser => {
        if (freshUser && freshUser.balance !== user.balance) {
          setUser(freshUser);
          localStorage.setItem('loyalty_session', JSON.stringify(freshUser));
        }
      }).catch(err => console.error('Error auto-refreshing:', err));
      
      storageService.getTransactions(true).then(txs => {
        setTransactions(txs);
      }).catch(err => console.error('Error refreshing transactions:', err));
    };

    const debouncedRefresh = debounce(refreshData, 300);
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalId) clearInterval(intervalId);
      } else {
        debouncedRefresh();
        
        intervalId = setInterval(refreshData, 60000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    handleVisibilityChange();

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">{t('loading')}</p>
        </div>
      </div>
    );
  }

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
