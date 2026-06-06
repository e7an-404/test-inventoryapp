import React, { useState, useEffect } from 'react';
import { InventoryItem, Transaction, SyncConfig, SyncStatus, User } from './types';
import { INITIAL_ITEMS, INITIAL_TRANSACTIONS } from './utils/dummyData';
import { 
  pingGasWebApp, 
  fetchFromGas, 
  pushAllToGas, 
  pushItemToGas, 
  deleteItemFromGas,
  pushUserToGas
} from './utils/gasClient';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import TransactionHistory from './components/TransactionHistory';
import SheetsSyncPanel from './components/SheetsSyncPanel';
import LoginPage from './components/LoginPage';
import UserRegistry from './components/UserRegistry';
import { 
  Boxes, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Logs,
  Users,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  // Navigation tabs list
  type ActiveTab = 'dashboard' | 'inventory' | 'history' | 'sheets' | 'users';
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return (localStorage.getItem('inv_active_tab') as ActiveTab) || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('inv_active_tab', activeTab);
  }, [activeTab]);

  // --- THEME STATE ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  // --- USER AUTHENTICATION STATES ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userPasswords, setUserPasswords] = useState<{[userId: string]: string}>({});

  // --- CORE SYSTEM STATES ---
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    webAppUrl: '',
    authToken: 'inventory_secret_123',
    sheetName: 'Inventory',
    autoSync: true
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'disconnected'
  });

  // --- LOCAL STORAGE CACHE HANDLERS ---
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- GLOBAL PERIOD FILTER STATES (SHARED) ---
  const getLocalDayString = (dateObj: Date | string | number) => {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalMonthString = (dateObj: Date | string | number) => {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [globalPeriodFilter, setGlobalPeriodFilter] = useState<'all' | 'daily' | 'monthly'>('all');
  const [globalStartDate, setGlobalStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDayString(d);
  });
  const [globalEndDate, setGlobalEndDate] = useState<string>(() => getLocalDayString(new Date()));
  const [globalSelectedMonth, setGlobalSelectedMonth] = useState<string>(() => getLocalMonthString(new Date()));

  useEffect(() => {
    // A. Seed default accounts if not exists or load.
    const defaultUsersList: User[] = [
      { id: 'usr_admin', username: 'admin', role: 'admin', name: 'Manajer Admin', createdAt: new Date().toISOString() },
      { id: 'usr_operator', username: 'operator', role: 'operator', name: 'Petugas Operator', createdAt: new Date().toISOString() }
    ];
    const defaultPasswordsMap = {
      'usr_admin': 'admin',
      'usr_operator': 'operator'
    };

    const cachedUsers = localStorage.getItem('inv_users_db');
    const cachedPasswords = localStorage.getItem('inv_user_passwords_db');
    if (cachedUsers && cachedPasswords) {
      try {
        setUsers(JSON.parse(cachedUsers));
        setUserPasswords(JSON.parse(cachedPasswords));
      } catch (err) {
        setUsers(defaultUsersList);
        setUserPasswords(defaultPasswordsMap);
      }
    } else {
      setUsers(defaultUsersList);
      setUserPasswords(defaultPasswordsMap);
      localStorage.setItem('inv_users_db', JSON.stringify(defaultUsersList));
      localStorage.setItem('inv_user_passwords_db', JSON.stringify(defaultPasswordsMap));
    }

    // B. Rehydrate session
    const cachedCurrentUser = localStorage.getItem('inv_current_user');
    if (cachedCurrentUser) {
      try {
        setCurrentUser(JSON.parse(cachedCurrentUser));
      } catch (e) {
        // Ignore
      }
    }

    // 1. Load Sync configuration
    const cachedConfig = localStorage.getItem('inv_sync_config');
    if (cachedConfig) {
      try {
        setSyncConfig(JSON.parse(cachedConfig));
      } catch (err) {
        console.error('Failed reading sync configuration cache', err);
      }
    }

    // 2. Load Inventory materials lists
    const cachedInv = localStorage.getItem('inv_items_db');
    if (cachedInv) {
      try {
        setInventory(JSON.parse(cachedInv));
      } catch (e) {
        setInventory(INITIAL_ITEMS);
      }
    } else {
      setInventory(INITIAL_ITEMS);
    }

    // 3. Load transactions logs ledger
    const cachedLogs = localStorage.getItem('inv_tx_logs_db');
    if (cachedLogs) {
      try {
        setTransactions(JSON.parse(cachedLogs));
      } catch (e) {
        setTransactions(INITIAL_TRANSACTIONS);
      }
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
    }

    setIsDataLoaded(true);
  }, []);

  // Save changes to localStorage whenever states modify
  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem('inv_items_db', JSON.stringify(inventory));
    }
  }, [inventory, isDataLoaded]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('inv_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('inv_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem('inv_tx_logs_db', JSON.stringify(transactions));
    }
  }, [transactions, isDataLoaded]);

  // Try auto-refreshing connection link status on startup if URL stands
  useEffect(() => {
    if (isDataLoaded && syncConfig.webAppUrl) {
      testSheetsPing();
    }
  }, [isDataLoaded, syncConfig.webAppUrl]);

  const saveSyncConfig = (newConfig: SyncConfig) => {
    setSyncConfig(newConfig);
    localStorage.setItem('inv_sync_config', JSON.stringify(newConfig));
  };

  // --- AUTH SECURITY HANDLERS ---

  const handleLogin = (username: string, passwordPlain: string): string | null => {
    const foundUser = users.find(u => u.username === username.trim().toLowerCase());
    if (!foundUser) {
      return 'Nama pengguna tidak terdaftar.';
    }

    const storedPassword = userPasswords[foundUser.id];
    if (storedPassword !== passwordPlain) {
      return 'Kata sandi salah. Silakan coba lagi.';
    }

    setCurrentUser(foundUser);
    setActiveTab('dashboard');
    return null;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('inv_active_tab');
    setActiveTab('dashboard');
  };

  const handleRegisterUser = (userId: string, username: string, name: string, role: 'admin' | 'operator', passwordPlain: string): string | null => {
    const cleanUserId = userId.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUserId) {
      return 'User ID tidak boleh kosong.';
    }
    const isIdDuplicate = users.some(u => u.id.toLowerCase() === cleanUserId);
    if (isIdDuplicate) {
      return 'User ID (Primary Key) sudah terdaftar oleh pengguna lain.';
    }

    const lowerUsername = username.trim().toLowerCase();
    const isDuplicate = users.some(u => u.username === lowerUsername);
    if (isDuplicate) {
      return 'Nama pengguna sudah digunakan oleh akun lain.';
    }

    const newUserId = cleanUserId;
    const newUserObj: User = {
      id: newUserId,
      username: lowerUsername,
      role,
      name,
      createdAt: new Date().toISOString()
    };

    const updatedUsersList = [...users, newUserObj];
    const updatedPasswordsMap = { ...userPasswords, [newUserId]: passwordPlain };

    setUsers(updatedUsersList);
    setUserPasswords(updatedPasswordsMap);

    localStorage.setItem('inv_users_db', JSON.stringify(updatedUsersList));
    localStorage.setItem('inv_user_passwords_db', JSON.stringify(updatedPasswordsMap));

    // Save single user to Google Sheets on registration if connected and autoSync is enabled
    if (syncConfig.webAppUrl && syncConfig.autoSync && syncStatus.status === 'connected') {
      pushUserToGas(syncConfig, newUserObj, passwordPlain).catch(err => {
        console.warn('Gagal menyimpan pengguna baru ke Google Sheets:', err);
      });
    }

    return null;
  };

  const handleUpdateUser = (userId: string, updatedFields: Partial<User>, newPasswordPlain?: string): string | null => {
    if (updatedFields.username) {
      const lowerUsername = updatedFields.username.trim().toLowerCase();
      const isDuplicate = users.some(u => u.id !== userId && u.username === lowerUsername);
      if (isDuplicate) {
        return 'Nama pengguna sudah digunakan oleh akun lain.';
      }
    }

    let targetUser: User | null = null;
    const updatedUsersList = users.map(u => {
      if (u.id === userId) {
        const revised = {
          ...u,
          ...updatedFields,
          username: updatedFields.username ? updatedFields.username.trim().toLowerCase() : u.username
        };
        targetUser = revised;
        return revised;
      }
      return u;
    });

    const updatedPasswordsMap = { ...userPasswords };
    if (newPasswordPlain !== undefined && newPasswordPlain.trim() !== '') {
      updatedPasswordsMap[userId] = newPasswordPlain.trim();
    }

    setUsers(updatedUsersList);
    setUserPasswords(updatedPasswordsMap);

    localStorage.setItem('inv_users_db', JSON.stringify(updatedUsersList));
    localStorage.setItem('inv_user_passwords_db', JSON.stringify(updatedPasswordsMap));

    if (currentUser && currentUser.id === userId) {
      const updatedSelf = updatedUsersList.find(u => u.id === userId);
      if (updatedSelf) {
        setCurrentUser(updatedSelf);
      }
    }

    // Update user in Google Sheets on update if connected and autoSync is enabled
    if (syncConfig.webAppUrl && syncConfig.autoSync && syncStatus.status === 'connected' && targetUser) {
      const finalPass = newPasswordPlain !== undefined && newPasswordPlain.trim() !== ''
        ? newPasswordPlain.trim()
        : (userPasswords[userId] || '');
      pushUserToGas(syncConfig, targetUser, finalPass).catch(err => {
        console.warn('Gagal memperbarui pengguna di Google Sheets:', err);
      });
    }

    return null;
  };

  // --- LIVE CONNECTION HOOKS AND OPERATIONS ---

  const testSheetsPing = async () => {
    if (!syncConfig.webAppUrl) {
      setSyncStatus({ status: 'disconnected' });
      return;
    }

    setSyncStatus({ status: 'connecting' });
    try {
      const pong = await pingGasWebApp(syncConfig.webAppUrl, syncConfig.authToken);
      if (pong) {
        setSyncStatus({ status: 'connected', lastSynced: new Date().toISOString() });
      } else {
        setSyncStatus({ 
          status: 'error', 
          errorMessage: 'Web app Apps Script tidak mengembalikan payload otorisasi yang valid. Periksa Token Handshake.' 
        });
      }
    } catch (err: any) {
      setSyncStatus({ 
        status: 'error', 
        errorMessage: err.message || 'Gagal terhubung ke Apps Script. Pastikan URL benar atau tidak diblokir CORS.' 
      });
    }
  };

  const handleFullPull = async () => {
    if (!syncConfig.webAppUrl) return;
    
    setSyncStatus({ status: 'connecting' });
    try {
      const liveData = await fetchFromGas(syncConfig);
      if (liveData) {
        setInventory(liveData.inventory);
        setTransactions(liveData.transactions);
        if (liveData.users && liveData.userPasswords) {
          setUsers(liveData.users);
          setUserPasswords(liveData.userPasswords);
          localStorage.setItem('inv_users_db', JSON.stringify(liveData.users));
          localStorage.setItem('inv_user_passwords_db', JSON.stringify(liveData.userPasswords));
        }
        setSyncStatus({ status: 'connected', lastSynced: new Date().toISOString() });
      } else {
        throw new Error('Menerima dataset kosong atau tidak valid dari API Apps Script.');
      }
    } catch (err: any) {
      setSyncStatus({ 
        status: 'error', 
        errorMessage: err.message || 'Gagal memuat dataset spreadsheet.' 
      });
      throw err;
    }
  };

  const handleFullPush = async () => {
    if (!syncConfig.webAppUrl) return;

    setSyncStatus({ status: 'connecting' });
    try {
      const success = await pushAllToGas(syncConfig, inventory, transactions, users, userPasswords);
      if (success) {
        setSyncStatus({ status: 'connected', lastSynced: new Date().toISOString() });
      } else {
        throw new Error('Proses push gagal dieksekusi di server Apps Script.');
      }
    } catch (err: any) {
      setSyncStatus({ 
        status: 'error', 
        errorMessage: err.message || 'Gagal mencadangkan database lokal ke Spreadsheet.' 
      });
      throw err;
    }
  };

  // --- CRUD AND DISPATCH OPERATIONS REACTION HOOKS ---

  const handleSaveItem = async (updatedItem: InventoryItem, logTransaction?: Transaction) => {
    const existingIndex = inventory.findIndex(x => x.id === updatedItem.id);
    let revisedInventory: InventoryItem[] = [];
    if (existingIndex !== -1) {
      revisedInventory = [...inventory];
      revisedInventory[existingIndex] = updatedItem;
    } else {
      revisedInventory = [updatedItem, ...inventory];
    }
    setInventory(revisedInventory);

    let revisedTransactions = transactions;
    if (logTransaction) {
      revisedTransactions = [logTransaction, ...transactions];
      setTransactions(revisedTransactions);
    }

    if (syncConfig.webAppUrl && syncConfig.autoSync && syncStatus.status === 'connected') {
      try {
        await pushItemToGas(syncConfig, updatedItem, logTransaction);
        setSyncStatus(prev => ({ ...prev, lastSynced: new Date().toISOString() }));
      } catch (err: any) {
        console.warn('Network autoSync write failed. State is cached in local browser memory.', err);
      }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const revisedInventory = inventory.filter(x => x.id !== itemId);
    setInventory(revisedInventory);

    if (syncConfig.webAppUrl && syncConfig.autoSync && syncStatus.status === 'connected') {
      try {
        await deleteItemFromGas(syncConfig, itemId);
        setSyncStatus(prev => ({ ...prev, lastSynced: new Date().toISOString() }));
      } catch (err) {
        console.warn('Network delete error. Saved locally.', err);
      }
    }
  };

  const handleDashboardQuickRestock = (itemId: string, restockQty: number, operator: string, notes: string) => {
    const targetItem = inventory.find(x => x.id === itemId);
    if (!targetItem) return;

    const updatedItem: InventoryItem = {
      ...targetItem,
      quantity: targetItem.quantity + restockQty,
      lastUpdated: new Date().toISOString()
    };

    const transactionRecord: Transaction = {
      id: `tx_${Date.now()}`,
      itemId: targetItem.id,
      sku: targetItem.sku,
      itemName: targetItem.name,
      type: 'IN',
      quantity: restockQty,
      timestamp: new Date().toISOString(),
      operator: currentUser?.name || operator || 'Dashboard Clerk',
      notes: notes || 'Penambahan kilat dipicu dari panel dasbor'
    };

    handleSaveItem(updatedItem, transactionRecord);
  };

  const handleUpdateTransaction = async (updatedTx: Transaction, adjustStock: boolean, oldTx: Transaction) => {
    const updatedTxs = transactions.map(t => t.id === updatedTx.id ? updatedTx : t);
    setTransactions(updatedTxs);

    if (adjustStock) {
      const matchItem = inventory.find(x => x.id === updatedTx.itemId || x.sku === updatedTx.sku);
      if (matchItem) {
        let stockDiff = 0;
        
        // Remove old impact of the transaction
        if (oldTx.type === 'IN') {
          stockDiff -= oldTx.quantity;
        } else if (oldTx.type === 'OUT') {
          stockDiff += oldTx.quantity;
        }
        
        // Add new impact of the transaction
        if (updatedTx.type === 'IN') {
          stockDiff += updatedTx.quantity;
        } else if (updatedTx.type === 'OUT') {
          stockDiff -= updatedTx.quantity;
        }
        
        if (stockDiff !== 0) {
          const finalQty = Math.max(0, matchItem.quantity + stockDiff);
          const updatedItem = {
            ...matchItem,
            quantity: finalQty,
            lastUpdated: new Date().toISOString()
          };
          
          setInventory(prev => prev.map(x => x.id === matchItem.id ? updatedItem : x));
          
          if (syncConfig.webAppUrl && syncConfig.autoSync && syncStatus.status === 'connected') {
            try {
              await pushItemToGas(syncConfig, updatedItem);
            } catch (e) {
              console.warn('Sync failed on transaction stock adjustment', e);
            }
          }
        }
      }
    }

    if (syncConfig.webAppUrl && syncConfig.autoSync && syncStatus.status === 'connected') {
      try {
        await pushAllToGas(syncConfig, inventory, updatedTxs, users, userPasswords);
        setSyncStatus(prev => ({ ...prev, lastSynced: new Date().toISOString() }));
      } catch (err) {
        console.warn('Network autoSync for update transaction failed.', err);
      }
    }
  };

  const handleToggleIgnoreTransaction = async (transactionId: string) => {
    const targetTx = transactions.find(t => t.id === transactionId);
    if (!targetTx) return;

    const isNowIgnored = !targetTx.ignored;
    const updatedTx: Transaction = {
      ...targetTx,
      ignored: isNowIgnored
    };

    const updatedTxs = transactions.map(t => t.id === transactionId ? updatedTx : t);
    setTransactions(updatedTxs);

    let revisedInventory = [...inventory];
    const matchItem = inventory.find(x => x.id === targetTx.itemId || x.sku === targetTx.sku);
    if (matchItem) {
      let qtyAdjust = 0;
      if (isNowIgnored) {
        if (targetTx.type === 'IN') {
          qtyAdjust = -targetTx.quantity;
        } else if (targetTx.type === 'OUT') {
          qtyAdjust = targetTx.quantity;
        }
      } else {
        if (targetTx.type === 'IN') {
          qtyAdjust = targetTx.quantity;
        } else if (targetTx.type === 'OUT') {
          qtyAdjust = -targetTx.quantity;
        }
      }

      if (qtyAdjust !== 0) {
        const finalQty = Math.max(0, matchItem.quantity + qtyAdjust);
        const updatedItem = {
          ...matchItem,
          quantity: finalQty,
          lastUpdated: new Date().toISOString()
        };
        
        revisedInventory = inventory.map(x => x.id === matchItem.id ? updatedItem : x);
        setInventory(revisedInventory);

        if (syncConfig.webAppUrl && syncConfig.autoSync && syncStatus.status === 'connected') {
          try {
            await pushItemToGas(syncConfig, updatedItem);
          } catch (e) {
            console.warn('Sync failed on target item inventory update', e);
          }
        }
      }
    }

    if (syncConfig.webAppUrl && syncConfig.autoSync && syncStatus.status === 'connected') {
      try {
        await pushAllToGas(syncConfig, revisedInventory, updatedTxs, users, userPasswords);
        setSyncStatus(prev => ({ ...prev, lastSynced: new Date().toISOString() }));
      } catch (err) {
        console.warn('Network autoSync for ignore-log toggle failed.', err);
      }
    }
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} theme={theme} />;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen antialiased flex flex-col justify-between font-sans transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      
      {/* Visual Top Branding Bar */}
      <header className={`border-b shrink-0 transition-colors duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 flex flex-col items-center justify-center rounded-lg text-white font-black tracking-tighter select-none shadow-sm">
              <span className="text-xs leading-none">SAS</span>
              <span className="text-[6px] tracking-widest leading-none mt-0.5">PT</span>
            </div>
            <div>
              <h1 className={`text-xl font-black tracking-tighter uppercase font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sastech Abadi Sejahtera
              </h1>
              <span className="text-[9px] text-indigo-500 font-mono tracking-widest font-black block mt-0.5 uppercase">Sistem Portal Kontrol Inventaris Gudang</span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-4 text-sm font-semibold shrink-0">
            
            {/* Theme switcher */}
            <button 
              onClick={toggleTheme}
              title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              className={`p-2 border rounded-lg transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-amber-450 text-amber-400 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Active User session info card */}
            <div className={`flex items-center gap-2.5 border px-3 py-1.5 rounded-lg shadow-2xs ${
              isDark ? 'bg-indigo-950/20 border-indigo-900/50' : 'bg-indigo-55 bg-indigo-50 border-indigo-100'
            }`}>
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black select-none">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left font-sans">
                <span className={`text-[10px] font-black tracking-tight block leading-none ${isDark ? 'text-indigo-200' : 'text-slate-800'}`}>{currentUser.name}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 block leading-none mt-1 font-mono">
                  {currentUser.role === 'admin' ? 'ADMINISTRATOR' : 'PETUGAS OPERATOR'}
                </span>
              </div>
            </div>

            <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                syncStatus.status === 'connected' ? 'bg-green-500 animate-pulse' :
                syncStatus.status === 'connecting' ? 'bg-amber-400 animate-spin' :
                syncStatus.status === 'error' ? 'bg-rose-500' : 'bg-slate-400'
              }`}></span>
              <span className="uppercase tracking-widest text-[10px] font-black text-slate-500 font-display">
                {syncStatus.status === 'connected' ? 'Sinkron Aktif' :
                 syncStatus.status === 'connecting' ? 'Menghubungkan...' :
                 syncStatus.status === 'error' ? 'Gagal Sinkron' : 'Mode Offline'}
              </span>
            </div>

            {/* Logout Trigger button */}
            <button 
              onClick={handleLogout}
              title="Keluar Sesi"
              className={`flex items-center justify-center gap-1.5 border px-3 py-1.5 rounded-lg transition text-[10px] uppercase font-black tracking-widest cursor-pointer shadow-3xs ${
                isDark 
                  ? 'bg-slate-950 border-slate-850 hover:bg-slate-800 text-slate-300' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LogOut size={12} /> Keluar
            </button>

          </div>

        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">

        {/* Global Standalone Info Warning Banner */}
        {!syncConfig.webAppUrl && currentUser.role === 'admin' && (
          <div className={`rounded-xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs ${
            isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-300' : 'bg-amber-55 bg-amber-50 border-amber-200 text-slate-900'
          }`}>
            <div className="flex items-start sm:items-center gap-3">
              <span className="text-amber-500 text-lg font-bold">💡</span>
              <div>
                <p className="font-black uppercase tracking-wider text-[10px] text-amber-500 mb-0.5">Berjalan dalam Mode Penyimpanan Mandiri (Luring)</p>
                <p className="font-bold leading-normal">Semua data saat ini dicadangkan di penyimpanan memori lokal penjelajah Anda. Hubungkan spreadsheet Anda di tab <b>"Hubungkan Spreadsheet"</b>.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('sheets')}
              className="px-6 py-2.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded uppercase text-[10px] tracking-widest transition shadow-xs cursor-pointer shrink-0"
            >
              Atur Sekarang
            </button>
          </div>
        )}

        {/* Dynamic Navigation Selectors */}
        <div className={`flex flex-wrap gap-2 p-1.5 border rounded-xl shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Dashboard is visible for operators to oversee logs and stock levels */}
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shrink-0 transition-all duration-150 cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-slate-105 bg-slate-950 border border-slate-800 text-white font-bold' 
                : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'
            }`}
          >
            <LayoutDashboard size={13} /> Dasbor Kontrol
          </button>

          {/* Stock catalog is hidden for operators */}
          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shrink-0 transition-all duration-150 cursor-pointer ${
                activeTab === 'inventory' 
                  ? 'bg-slate-950 border border-slate-800 text-white font-bold' 
                  : 'text-slate-400 hover:bg-slate-850'
              }`}
            >
              <Boxes size={13} /> Katalog Stok
            </button>
          )}

          {/* Operator can access transaction history to report actions */}
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shrink-0 transition-all duration-150 cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-slate-950 border border-slate-800 text-white font-bold' 
                : 'text-slate-400 hover:bg-slate-850'
            }`}
          >
            <Logs size={13} /> Riwayat Transaksi
          </button>

          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('sheets')}
              className={`px-5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shrink-0 transition-all duration-150 cursor-pointer ${
                activeTab === 'sheets' 
                  ? 'bg-slate-950 border border-slate-800 text-white font-bold' 
                  : 'text-slate-400 hover:bg-slate-850'
              }`}
            >
              <FileSpreadsheet size={13} /> Hubungkan Spreadsheet
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shrink-0 transition duration-150 cursor-pointer ml-auto ${
                activeTab === 'users' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-150/30' 
                  : 'text-slate-400 hover:bg-slate-850 hover:text-indigo-400'
              }`}
            >
              <Users size={13} /> Data Pengguna
            </button>
          )}
        </div>

        {/* Tab Selection Panels routers */}
        <div className="mt-4 transition-all duration-300">
          {activeTab === 'dashboard' && (
            <Dashboard 
              items={inventory} 
              transactions={transactions} 
              onQuickRestock={handleDashboardQuickRestock}
              onSaveItem={handleSaveItem}
              currentUser={currentUser}
              theme={theme}
              periodFilter={globalPeriodFilter}
              setPeriodFilter={setGlobalPeriodFilter}
              startDate={globalStartDate}
              setStartDate={setGlobalStartDate}
              endDate={globalEndDate}
              setEndDate={setGlobalEndDate}
              selectedMonth={globalSelectedMonth}
              setSelectedMonth={setGlobalSelectedMonth}
            />
          )}

          {activeTab === 'inventory' && currentUser.role === 'admin' && (
            <InventoryList 
              items={inventory} 
              onSaveItem={handleSaveItem} 
              onDeleteItem={handleDeleteItem}
              syncConnected={syncConfig.webAppUrl ? syncConfig.autoSync && syncStatus.status === 'connected' : false}
              currentUser={currentUser}
              transactions={transactions}
              theme={theme}
            />
          )}

          {activeTab === 'history' && (
            <TransactionHistory 
              transactions={transactions}
              items={inventory}
              onClearHistory={currentUser.role === 'admin' ? () => setTransactions([]) : undefined}
              onUpdateTransaction={handleUpdateTransaction}
              onToggleIgnoreTransaction={handleToggleIgnoreTransaction}
              theme={theme}
              periodFilter={globalPeriodFilter}
              setPeriodFilter={setGlobalPeriodFilter}
              startDate={globalStartDate}
              setStartDate={setGlobalStartDate}
              endDate={globalEndDate}
              setEndDate={setGlobalEndDate}
              selectedMonth={globalSelectedMonth}
              setSelectedMonth={setGlobalSelectedMonth}
            />
          )}

          {activeTab === 'sheets' && currentUser.role === 'admin' && (
            <SheetsSyncPanel 
              config={syncConfig}
              status={syncStatus}
              onChangeConfig={saveSyncConfig}
              onTestConnection={testSheetsPing}
              onPullData={handleFullPull}
              onPushData={handleFullPush}
              itemsCount={inventory.length}
              transactionsCount={transactions.length}
              theme={theme}
            />
          )}

          {activeTab === 'users' && currentUser.role === 'admin' && (
            <UserRegistry 
              currentUser={currentUser}
              users={users}
              onRegisterUser={handleRegisterUser}
              onUpdateUser={handleUpdateUser}
              theme={theme}
            />
          )}
        </div>

      </main>

      {/* Visual Terminal Footer */}
      <footer className="h-12 bg-slate-900 flex items-center justify-between px-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest gap-4 sm:gap-8 mt-16 shrink-0">
        <span>Sinkron Terakhir: {syncStatus.lastSynced ? new Date(syncStatus.lastSynced).toLocaleTimeString('id-ID') : 'Memori Lokal'}</span>
        <span className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${syncStatus.status === 'connected' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-500'}`}></div>
          Koneksi Jaringan: {syncStatus.status === 'connected' ? 'Terhubung (Online)' : 'Luring (Offline)'}
        </span>
        <span className="hidden md:inline ml-auto">© 2026 SISTEM MANAJEMEN INVENTARIS GUDANG</span>
      </footer>

    </div>
  );
}
