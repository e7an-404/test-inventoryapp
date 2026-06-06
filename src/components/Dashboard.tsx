import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, Transaction, formatRupiah, User } from '../types';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  Plus,
  MapPin,
  X,
  Info,
  Boxes,
  Wrench,
  Shield,
  Zap,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

const getItemCategoryVisual = (category?: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('electr') || cat.includes('listr')) {
    return (
      <svg className="text-amber-400 w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (cat.includes('tool') || cat.includes('hardw') || cat.includes('alat') || cat.includes('mesin') || cat.includes('peralatan')) {
    return (
      <svg className="text-indigo-400 w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (cat.includes('safe') || cat.includes('aman') || cat.includes('pelind') || cat.includes('safety') || cat.includes('lindung')) {
    return (
      <svg className="text-emerald-400 w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  }
  if (cat.includes('chem') || cat.includes('bahan') || cat.includes('cair') || cat.includes('kimia') || cat.includes('medis')) {
    return (
      <svg className="text-cyan-400 w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    );
  }
  // Default general storage packages boxes
  return (
    <svg className="text-indigo-400 w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
};

interface DashboardProps {
  items: InventoryItem[];
  transactions: Transaction[];
  onQuickRestock: (itemId: string, qty: number, operator: string, notes: string) => void;
  onSaveItem?: (item: InventoryItem, transaction?: Transaction) => void;
  currentUser: User | null;
  theme?: 'light' | 'dark';
  periodFilter: 'all' | 'daily' | 'monthly';
  setPeriodFilter: (filter: 'all' | 'daily' | 'monthly') => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export default function Dashboard({ 
  items, 
  transactions, 
  onQuickRestock, 
  onSaveItem, 
  currentUser, 
  theme = 'light',
  periodFilter,
  setPeriodFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedMonth,
  setSelectedMonth
}: DashboardProps) {
  // Timezone-safe local date formatting helpers
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

  // Map global state props to local aliases for seamless backward compatibility
  const txPeriodFilter = periodFilter;
  const setTxPeriodFilter = setPeriodFilter;
  const txStartDate = startDate;
  const setTxStartDate = setStartDate;
  const txEndDate = endDate;
  const setTxEndDate = setEndDate;
  const txSelectedMonth = selectedMonth;
  const setTxSelectedMonth = setSelectedMonth;

  // Stats calculations using baseItems updated based on global filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (tx.ignored) return false;
      let matchPeriod = true;
      if (txPeriodFilter === 'daily') {
        const txDate = getLocalDayString(tx.timestamp);
        if (txStartDate && txDate < txStartDate) matchPeriod = false;
        if (txEndDate && txDate > txEndDate) matchPeriod = false;
      } else if (txPeriodFilter === 'monthly') {
        const txMonth = getLocalMonthString(tx.timestamp);
        if (txSelectedMonth && txMonth !== txSelectedMonth) matchPeriod = false;
      }
      return matchPeriod;
    });
  }, [transactions, txPeriodFilter, txStartDate, txEndDate, txSelectedMonth]);

  const baseItems = useMemo(() => {
    if (txPeriodFilter === 'all') return items;
    // Get item IDs active in this period
    const activeIds = new Set(filteredTransactions.map(tx => tx.itemId));
    return items.filter(item => activeIds.has(item.id));
  }, [items, filteredTransactions, txPeriodFilter]);

  const totalItems = useMemo(() => baseItems.length, [baseItems]);
  
  const lowStockItems = useMemo(() => {
    return baseItems.filter(item => item.quantity <= item.minStock);
  }, [baseItems]);

  const totalValue = useMemo(() => {
    return baseItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  }, [baseItems]);

  const totalStockCount = useMemo(() => {
    return baseItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [baseItems]);

  // Category summary array
  const categorySummary = React.useMemo(() => {
    const summary: { [key: string]: { count: number; value: number } } = {};
    baseItems.forEach(item => {
      const cat = item.category || 'Umum';
      if (!summary[cat]) {
        summary[cat] = { count: 0, value: 0 };
      }
      summary[cat].count += item.quantity;
      summary[cat].value += item.quantity * item.unitPrice;
    });

    return Object.entries(summary).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [baseItems, totalValue]);

  const [restockQty, setRestockQty] = useState<{ [key: string]: number }>({});
  const [operatorName, setOperatorName] = useState(currentUser?.name || 'Operator Gudang');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Selected Item Mode & Edit / Adjustment state variables
  const [selectedItemMode, setSelectedItemMode] = useState<'view' | 'edit' | 'adjust'>('view');
  
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editMinStock, setEditMinStock] = useState<number>(0);
  const [editUnit, setEditUnit] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');

  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustOperator, setAdjustOperator] = useState(currentUser?.name || 'Operator Gudang');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Handle initialization when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setEditName(selectedItem.name);
      setEditSku(selectedItem.sku);
      setEditCategory(selectedItem.category || 'Umum');
      setEditLocation(selectedItem.location || '');
      setEditMinStock(selectedItem.minStock);
      setEditUnit(selectedItem.unit || 'Pcs');
      setEditUnitPrice(selectedItem.unitPrice || 0);
      setEditNotes(selectedItem.notes || '');
      
      setAdjustType('IN');
      const missing = selectedItem.minStock - selectedItem.quantity;
      setAdjustQty(missing > 0 ? missing : 10);
      setAdjustOperator(currentUser?.name || 'Operator Gudang');
      setAdjustNotes('');
      setSelectedItemMode('view');
    }
  }, [selectedItem, currentUser]);

  const handleSaveEdit = () => {
    if (!selectedItem || !onSaveItem) return;
    
    const updatedItem: InventoryItem = {
      ...selectedItem,
      name: editName,
      sku: editSku,
      category: editCategory,
      location: editLocation,
      minStock: Number(editMinStock) || 0,
      unit: editUnit,
      unitPrice: Number(editUnitPrice) || 0,
      notes: editNotes,
      lastUpdated: new Date().toISOString()
    };
    
    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      itemId: selectedItem.id,
      sku: editSku,
      itemName: editName,
      type: 'SET',
      quantity: 0,
      timestamp: new Date().toISOString(),
      operator: currentUser?.name || 'Sistem',
      notes: `Ubah detail barang: SKU=${editSku}, MinStok=${editMinStock}, Unit=${editUnit}`
    };
    
    onSaveItem(updatedItem, tx);
    setSelectedItem(updatedItem); // update selection to stay in modal
    setSelectedItemMode('view');
  };

  const handleSaveAdjustment = (typeOverride?: 'IN' | 'OUT', qtyOverride?: number, notesOverride?: string) => {
    if (!selectedItem || !onSaveItem) return;
    
    const type = typeOverride || adjustType;
    const qty = qtyOverride !== undefined ? qtyOverride : Number(adjustQty) || 0;
    const notes = notesOverride || adjustNotes || (type === 'IN' ? 'Barang masuk melalui Dashboard review' : 'Barang keluar melalui Dashboard review');
    const operator = adjustOperator || currentUser?.name || 'Operator Gudang';
    
    if (qty <= 0) return;
    
    if (type === 'OUT' && qty > selectedItem.quantity) {
      alert(`Pengeluaran unit (${qty}) melebihi stok yang tersedia (${selectedItem.quantity})!`);
      return;
    }
    
    const newQty = type === 'IN' 
      ? selectedItem.quantity + qty 
      : selectedItem.quantity - qty;
      
    const updatedItem: InventoryItem = {
      ...selectedItem,
      quantity: newQty,
      lastUpdated: new Date().toISOString()
    };
    
    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      itemId: selectedItem.id,
      sku: selectedItem.sku,
      itemName: selectedItem.name,
      type: type,
      quantity: qty,
      timestamp: new Date().toISOString(),
      operator: operator,
      notes: notes
    };
    
    onSaveItem(updatedItem, tx);
    setSelectedItem(updatedItem); // update selection to stay in modal
    setSelectedItemMode('view');
  };

  const matchedItemForTx = useMemo(() => {
    if (!selectedTx) return null;
    return items.find(item => item.id === selectedTx.itemId || item.sku === selectedTx.sku) || null;
  }, [selectedTx, items]);

  const activeItemTransactionsForTx = useMemo(() => {
    if (!selectedTx) return [];
    return transactions.filter(t => (t.itemId === selectedTx.itemId || t.sku === selectedTx.sku) && !t.ignored);
  }, [selectedTx, transactions]);

  useEffect(() => {
    if (currentUser?.name) {
      setOperatorName(currentUser.name);
    }
  }, [currentUser]);

  const handleRestock = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // Avoid triggering dashboard selection view
    const qty = restockQty[itemId] || 10;
    onQuickRestock(itemId, qty, operatorName, 'Penambahan stok cepat langsung dari panel dasbor');
    setRestockQty(prev => ({ ...prev, [itemId]: 10 }));
  };

  const isDark = theme === 'dark';

  // Log transactions list for active modal item
  const selectedItemTransactions = useMemo(() => {
    if (!selectedItem) return [];
    return transactions.filter(tx => (tx.itemId === selectedItem.id || tx.sku === selectedItem.sku) && !tx.ignored);
  }, [selectedItem, transactions]);

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-tab-panel">
      
      {/* GLOBAL PERIOD FILTER CONTROLS */}
      <div className={`p-5 rounded-2xl border shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`} id="dashboard-global-filter-bar">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Clock size={16} />
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Filter Rentang Waktu Global</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Saring seluruh metrik audit log riwayat berdasarkan kategori periode terpilih</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Periode Audit:</span>
            <div className={`inline-flex rounded-lg border p-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setTxPeriodFilter('all')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  txPeriodFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-indigo-400'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTxPeriodFilter('daily')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  txPeriodFilter === 'daily'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-indigo-400'
                }`}
              >
                Harian (Rentang)
              </button>
              <button
                type="button"
                onClick={() => setTxPeriodFilter('monthly')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  txPeriodFilter === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-indigo-400'
                }`}
              >
                Bulanan (Pilih Bulan)
              </button>
            </div>
          </div>

          {txPeriodFilter === 'daily' && (
            <div className="flex flex-wrap items-center gap-3 animate-fade-in md:pl-2 md:border-l border-slate-700/20">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase text-slate-400">Dari:</span>
                <input
                  type="date"
                  value={txStartDate}
                  onChange={(e) => setTxStartDate(e.target.value)}
                  style={{ colorScheme: isDark ? 'dark' : 'light' }}
                  className={`px-2 py-1 text-xs font-bold font-mono rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase text-slate-400">Sampai:</span>
                <input
                  type="date"
                  value={txEndDate}
                  onChange={(e) => setTxEndDate(e.target.value)}
                  style={{ colorScheme: isDark ? 'dark' : 'light' }}
                  className={`px-2 py-1 text-xs font-bold font-mono rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>
          )}

          {txPeriodFilter === 'monthly' && (
            <div className="flex flex-wrap items-center gap-2 animate-fade-in md:pl-2 md:border-l border-slate-700/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Periode:</span>
              <div className="flex items-center gap-2">
                {/* Month Dropdown */}
                <select
                  value={txSelectedMonth.split('-')[1] || '06'}
                  onChange={(e) => {
                    const parsedYear = txSelectedMonth.split('-')[0] || '2026';
                    setTxSelectedMonth(`${parsedYear}-${e.target.value}`);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>

                {/* Year Dropdown */}
                <select
                  value={txSelectedMonth.split('-')[0] || '2026'}
                  onChange={(e) => {
                    const parsedMonth = txSelectedMonth.split('-')[1] || '06';
                    setTxSelectedMonth(`${e.target.value}-${parsedMonth}`);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4-Box Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" id="dashboard-metrics-grid">
        
        {/* Total Stock Items */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between shadow-xs transition-colors duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Ragam Barang Terdaftar</p>
            <h2 className={`text-3xl sm:text-4xl lg:text-3xl xl:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalItems}
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-3 w-full truncate">{totalStockCount.toLocaleString('id-ID')} unit teragregasi</p>
        </div>

        {/* Low Stock Alerts */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between shadow-xs transition-colors duration-200 ${
          isDark 
            ? lowStockItems.length > 0 ? 'bg-rose-950/15 border-rose-900/40' : 'bg-slate-900 border-slate-800'
            : lowStockItems.length > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${lowStockItems.length > 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>Peringatan Kritis</p>
            <h2 className={`text-3xl sm:text-4xl lg:text-3xl xl:text-4xl font-black tracking-tight ${lowStockItems.length > 0 ? 'text-rose-500 animate-pulse' : isDark ? 'text-white' : 'text-slate-900'}`}>
              {String(lowStockItems.length).padStart(2, '0')}
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-3 w-full truncate">
            {lowStockItems.length > 0 ? 'Butuh restok segera!' : 'Persediaan katalog optimal'}
          </p>
        </div>

        {/* Assets Value */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between shadow-xs transition-colors duration-200 ${
          isDark ? 'bg-slate-900 border-indigo-900/40' : 'bg-indigo-50/30 border-indigo-100/60'
        }`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-550 text-indigo-500 mb-1">Total Nilai Valuasi Aset</p>
            <h2 className="text-xl sm:text-2xl lg:text-base xl:text-xl 2xl:text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 break-all select-all leading-snug" title={formatRupiah(totalValue)}>
              {formatRupiah(totalValue)}
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-3 w-full truncate">Dihitung dari harga satuan produk</p>
        </div>

        {/* Activity Feed Counter */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between shadow-xs transition-colors duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Entri Log Riwayat</p>
            <h2 className={`text-3xl sm:text-4xl lg:text-3xl xl:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {filteredTransactions.length}
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-3 w-full truncate">Operasi terfilter dalam periode</p>
        </div>
      </div>

      {/* Main Stats Splitter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Low Stock Restock Panel */}
        <div className={`lg:col-span-2 rounded-2xl border p-6 flex flex-col justify-between shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Peringatan Batas Minimum Stok</h3>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">Daftar item kritis yang perlu diisi kembali</p>
              </div>
              {lowStockItems.length > 0 && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-full shrink-0 flex items-center gap-1 border border-amber-500/20 animate-pulse">
                  <AlertTriangle size={10} /> {lowStockItems.length} Menipis
                </span>
              )}
            </div>

            {lowStockItems.length === 0 ? (
              <div className={`border border-dashed rounded-xl py-12 text-center text-slate-400 space-y-2 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <Package className="mx-auto text-slate-500" size={36} />
                <p className="text-sm font-bold text-slate-350">Optimal! Tidak ada peringatan stok.</p>
                <p className="text-xs max-w-sm mx-auto text-slate-400">Seluruh persediaan unit produk aman di atas batas pemicu minimum.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className={`border-b text-slate-400 font-black text-[10px] uppercase tracking-widest ${
                      isDark ? 'bg-slate-950/20 border-slate-850' : 'bg-slate-50/50 border-slate-100'
                    }`}>
                      <th className="py-3 px-4">Nama Produk</th>
                      <th className="py-3 px-4 text-center">Stok</th>
                      <th className="py-3 px-4 text-center">Minimum</th>
                      <th className="py-3 px-4 text-right">Harga Satuan</th>
                      {currentUser?.role === 'admin' && <th className="py-3 px-4 text-center">Isi Ulang Cepat</th>}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-850' : 'divide-slate-100'}`}>
                    {lowStockItems.map(item => (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedItem(item)}
                        title="Klik untuk meninjau rincian detail kartu stok"
                        className={`text-xs transition cursor-pointer ${isDark ? 'hover:bg-slate-850/50' : 'hover:bg-indigo-50/45'}`}
                      >
                        <td className="py-4 px-4 font-bold">
                          <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{item.name}</p>
                          <p className="text-[10px] text-slate-450 text-slate-500 font-mono mt-0.5">{item.sku} | {item.category || 'Umum'}</p>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <span className="text-xs font-extrabold text-red-500 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded">
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-slate-500 whitespace-nowrap">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-slate-400 font-bold">
                          {formatRupiah(item.unitPrice)}
                        </td>
                        {currentUser?.role === 'admin' && (
                          <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <input 
                                type="number" 
                                min="1" 
                                value={restockQty[item.id] !== undefined ? restockQty[item.id] : 15}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setRestockQty(prev => ({ ...prev, [item.id]: val }));
                                }}
                                className={`w-14 h-8 text-center border rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                                }`}
                              />
                              <button 
                                onClick={(e) => handleRestock(e, item.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition flex items-center gap-1 shadow-md shadow-indigo-150/30"
                              >
                                <Plus size={11} /> Isi Stok
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {lowStockItems.length > 0 && currentUser?.role === 'admin' && (
            <div className={`mt-6 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border ${
              isDark ? 'border-slate-800 bg-slate-950/20' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Aktivitas Sebagai:</span>
                <input 
                  type="text" 
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Nama Operator"
                  className={`border rounded px-2.5 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <p className="text-[10px] text-slate-450 font-bold">Aktivitas restok kilat direkam otomatis</p>
            </div>
          )}
        </div>

        {/* Right Side: Category Distributions value chart */}
        <div className={`rounded-2xl border p-6 shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Nilai Aset Kategori</h3>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-5">Distribusi Finansial Tertanam</p>

          <div className="space-y-5">
            {categorySummary.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-12">Belum ada aset barang yang dikategorikan.</p>
            ) : (
              categorySummary.slice(0, 5).map(cat => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-extrabold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{cat.name} <span className="text-[10px] text-slate-450 font-normal">({cat.count} item)</span></span>
                    <span className={`font-bold font-mono text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {formatRupiah(cat.value)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">({cat.percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  {/* Visual Bar */}
                  <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(1.5, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
            
            {categorySummary.length > 5 && (
              <p className="text-[10.5px] text-slate-500 text-center font-bold pt-2 uppercase tracking-wide">
                + {categorySummary.length - 5} Departemen Kategori Lainnya
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Snapshot Line */}
      <div className={`rounded-2xl border p-6 shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Aktivitas Terakhir Operasional Gudang</h3>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-404 text-slate-400 mt-1">Audit log historis masuk & keluar secara real-time</p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1 self-start sm:self-auto">
            <Clock size={12} /> {filteredTransactions.length} Log Terfilter
          </p>
        </div>

        {/* Info Message that Global Filter is Active */}
        <div className={`mb-4 px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
          isDark ? 'bg-slate-950/45 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-500'
        }`}>
          <span>
            📌 Menampilkan data log tersaring berdasarkan "Filter Rentang Waktu Global" di bagian atas halaman
          </span>
          <span className="font-mono text-[9px] text-indigo-500 font-black shrink-0">
            {txPeriodFilter === 'all' 
              ? 'SEMUA PERIODE' 
              : txPeriodFilter === 'daily' 
                ? `HARIAN (${txStartDate} s/d ${txEndDate})` 
                : `BULANAN (${txSelectedMonth})`}
          </span>
        </div>

        <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-slate-500 font-bold italic">Belum ada aktivitas transaksi yang cocok dengan kriteria filter.</p>
            </div>
          ) : (
            [...filteredTransactions]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map(tx => {
                const isGain = tx.type === 'IN';
                const isSet = tx.type === 'SET';
                
                // Try to locate corresponding product for interactive dialog audit lookup
                const matchedItem = items.find(item => item.id === tx.itemId || item.sku === tx.sku);
                
                const handleTxRowClick = () => {
                  setSelectedTx(tx);
                };

                return (
                  <div 
                    key={tx.id} 
                    onClick={handleTxRowClick}
                    title="Klik untuk meninjau rincian detail kartu stok"
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                      isDark 
                        ? 'bg-slate-950/20 border-slate-850 hover:bg-slate-950/45 hover:border-indigo-900/60' 
                        : 'bg-white border-slate-100 hover:bg-indigo-50/25 hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-8 w-8 rounded flex items-center justify-center text-[10px] font-black tracking-widest shrink-0 ${
                        isGain ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isSet ? 'bg-slate-500/10 text-slate-400' : 'bg-rose-500/10 text-rose-455'
                      }`}>
                        {tx.type === 'IN' ? 'IN' : tx.type === 'OUT' ? 'OUT' : 'SET'}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-850'}`}>{tx.itemName}</p>
                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400 mt-1 font-mono">
                          <span className="font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{tx.sku}</span>
                          <span>•</span>
                          <span>Operator: {tx.operator}</span>
                          <span>•</span>
                          <span>{new Date(tx.timestamp).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className={`text-base font-black tracking-tighter ${isGain ? 'text-emerald-500' : isSet ? 'text-slate-450' : 'text-red-400'}`}>
                          {isGain ? '+' : isSet ? '' : '-'}{tx.quantity} unit
                        </p>
                        <p className="text-[10px] text-slate-500 italic max-w-xs">{tx.notes || 'Tanpa deskripsi tambahan'}</p>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Stock Review Modal like InventoryList */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop blur with dark slate translucent overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity" 
            onClick={() => setSelectedItem(null)} 
            aria-hidden="true"
          />
          
          <div className={`relative w-full max-w-4xl rounded-2xl border shadow-2xl p-0 overflow-hidden transform transition-all my-8 ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-white shadow-indigo-950/35' 
              : 'bg-white border-slate-150 text-slate-850'
          }`}>
            <div className={`px-6 py-4 flex justify-between items-center text-white ${
              isDark ? 'bg-slate-950' : 'bg-slate-900'
            }`}>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
                  Lembar Tinjau Kartu & Operasional Stok
                </span>
                <h3 className="font-extrabold text-xs sm:text-sm tracking-tight font-display">
                  {selectedItem.name} ({selectedItem.sku})
                </h3>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Product info cards overview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Visual / Graphic column (5 Cols) */}
                <div className="md:col-span-12 lg:col-span-12 xl:col-span-5 flex flex-col space-y-3">
                  <div className={`relative group overflow-hidden rounded-2xl bg-gradient-to-br border flex flex-col items-center justify-center p-6 h-56 text-center shadow-xs transition duration-200 ${
                    isDark 
                      ? 'from-indigo-950/40 via-slate-950/90 to-indigo-950/40 border-indigo-900/40' 
                      : 'from-indigo-50/40 via-white to-slate-100/60 border-indigo-100'
                  }`}>
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase bg-indigo-600 text-white select-none">
                      Visual Preview
                    </div>
                    
                    {/* Visual representation */}
                    <div className={`w-18 h-18 rounded-2xl flex items-center justify-center shadow-sm mb-3.5 transform transition duration-300 group-hover:scale-110 ${
                      isDark ? 'bg-slate-950 border border-slate-800' : 'bg-white border border-slate-200'
                    }`}>
                      {getItemCategoryVisual(selectedItem.category || 'Umum')}
                    </div>
                    
                    <p className="font-mono text-[10px] font-extrabold text-indigo-500 tracking-wider">
                      {selectedItem.sku}
                    </p>
                    <p className={`font-black text-sm px-2 truncate max-w-full mt-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {selectedItem.name}
                    </p>
                    <span className="text-[9px] text-slate-400 block uppercase font-black tracking-widest mt-1">
                      Kategori: {selectedItem.category || 'Umum'}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded-xl border text-center text-xs font-bold font-sans ${
                    isDark ? 'bg-slate-950/40 border-slate-850 text-slate-400' : 'bg-slate-50/50 border-slate-150 text-slate-500'
                  }`}>
                    Lokasi Rak: <span className="font-mono text-indigo-500 font-extrabold">{selectedItem.location || 'Belum diatur'}</span>
                  </div>
                </div>

                {/* Info and statistics (7 Cols) */}
                <div className="md:col-span-12 lg:col-span-12 xl:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                      isDark ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">SKU Kode</span>
                      <span className="font-mono text-xs font-bold uppercase mt-1 text-indigo-500">{selectedItem.sku}</span>
                    </div>
                    
                    <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                      isDark ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Kategori</span>
                      <span className="text-xs font-black uppercase mt-1">{selectedItem.category || 'Umum'}</span>
                    </div>

                    <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                      selectedItem.quantity <= selectedItem.minStock 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        : isDark ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Sisa Unit Stok</span>
                      <span className="text-sm font-extrabold mt-1">{selectedItem.quantity} {selectedItem.unit || 'Pcs'}</span>
                    </div>

                    <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                      isDark ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Valuasi Aset</span>
                      <span className="text-sm font-extrabold text-indigo-500 mt-1">{formatRupiah(selectedItem.quantity * selectedItem.unitPrice)}</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border text-xs space-y-3 font-sans ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50/50 border-slate-100 text-slate-650'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Harga Satuan Beli</span>
                      <span className="font-mono font-bold text-xs">{formatRupiah(selectedItem.unitPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800/10 pt-2">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Ambang Batas Minimum</span>
                      <span className="font-bold text-xs">{selectedItem.minStock} {selectedItem.unit || 'Pcs'}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800/10 pt-2">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Tanggal Update</span>
                      <span className="font-mono text-[10px] text-slate-400">{new Date(selectedItem.lastUpdated || Date.now()).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

              </div>

              {selectedItem.notes && (
                <div className={`p-4 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-600'
                }`}>
                  <span className="text-slate-400 font-bold uppercase text-[9px] block mb-1">Catatan/Keterangan</span>
                  <p className="italic leading-relaxed text-slate-500">{selectedItem.notes}</p>
                </div>
              )}

              {/* MENU ISI ULANG CEPAT */}
              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-indigo-950/20 border-indigo-900/40 text-slate-200' : 'bg-indigo-50/20 border-indigo-100 text-slate-700'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b pb-3 border-slate-500/10">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-[9px] tracking-wider uppercase">
                      ⚡ ISI ULANG CEPAT
                    </span>
                    <h4 className="text-xs font-black tracking-tight uppercase">Menu Restok Cepat Batas Ambang</h4>
                  </div>
                  {selectedItem.quantity <= selectedItem.minStock && (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 animate-pulse">
                      Butuh minimal: {selectedItem.minStock - selectedItem.quantity} {selectedItem.unit || 'Pcs'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Jumlah Unit Restock Tambahan</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                          className={`w-full px-3 py-2 text-xs font-extrabold font-mono border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                        <span className={`px-4 py-2 text-xs font-bold font-mono border rounded-lg flex items-center justify-center ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          {selectedItem.unit || 'Pcs'}
                        </span>
                      </div>
                      
                      {/* Presets and buffer recommendations */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {[5, 10, 15, 25, 50, 100].map(pQty => (
                          <button
                            key={pQty}
                            type="button"
                            onClick={() => setAdjustQty(pQty)}
                            className={`px-2.5 py-1 text-[10px] font-bold font-mono border rounded-md transition duration-150 cursor-pointer ${
                              adjustQty === pQty
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                : isDark ? 'border-slate-800 hover:bg-slate-850 text-slate-400' : 'border-slate-250 hover:bg-slate-55 text-slate-650'
                            }`}
                          >
                            +{pQty}
                          </button>
                        ))}
                        {selectedItem.quantity <= selectedItem.minStock && (
                          <button
                            key="set-restock-safe"
                            type="button"
                            onClick={() => {
                              const diff = selectedItem.minStock - selectedItem.quantity;
                              setAdjustQty(diff > 0 ? diff : 10);
                            }}
                            className="px-2.5 py-1 text-[10px] font-black border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-md transition cursor-pointer hover:bg-emerald-500/20"
                          >
                            Isi Ke Batas Aman (+{selectedItem.minStock - selectedItem.quantity})
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col justify-center ${
                      isDark ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50/60 border-slate-150'
                    }`}>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">ESTIMASI STOK BARU TERHITUNG</span>
                      <div className="flex justify-between items-center font-extrabold text-xs">
                        <span className="text-slate-400">Total Unit Setelah Diisi Ulang:</span>
                        <span className="text-base font-extrabold text-emerald-500 font-mono">
                          {selectedItem.quantity + (Number(adjustQty) || 0)} {selectedItem.unit || 'Pcs'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col justify-between">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Petugas / Operator Pelaksana</label>
                      <input
                        type="text"
                        value={adjustOperator}
                        onChange={(e) => setAdjustOperator(e.target.value)}
                        placeholder="Nama operator yang memproses..."
                        className={`w-full px-3 py-2 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Catatan Keterangan Tambahan</label>
                      <textarea
                        value={adjustNotes}
                        onChange={(e) => setAdjustNotes(e.target.value)}
                        placeholder="Keterangan penunjang restock..."
                        rows={2}
                        className={`w-full px-3 py-2 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleSaveAdjustment('IN')}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                      >
                        ⚡ EKSEKUSI ISI ULANG SEKARANG
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${
              isDark ? 'border-slate-850 bg-slate-950/30' : 'border-slate-100 bg-slate-50'
            }`}>
              <button 
                onClick={() => setSelectedItem(null)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg border transition cursor-pointer ${
                  isDark 
                    ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' 
                    : 'border-slate-250 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                Tutup Detail Barang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details modal aligned exactly as TransactionHistory */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className={`rounded-xl border shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all duration-350 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`px-6 py-4 flex justify-between items-center text-white ${
              isDark ? 'bg-slate-950' : 'bg-slate-900'
            }`}>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Riwayat Lembar Audit Transaksi (Dasbor)</span>
                <h3 className="font-extrabold text-xs sm:text-sm tracking-tight font-display">Log Kontrol: {selectedTx.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Top Split Visual Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Visual Digital Asset representation for "photo" */}
                <div className={`relative group overflow-hidden rounded-xl bg-gradient-to-br border flex flex-col items-center justify-center p-5 h-52 text-center transition ${
                  isDark 
                    ? 'from-indigo-950/40 via-slate-950/90 to-indigo-950/40 border-indigo-900/40' 
                    : 'from-indigo-50/50 via-white to-slate-100/70 border-indigo-100'
                }`}>
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase bg-indigo-600 text-white select-none">
                    Asset Visual
                  </div>
                  
                  {/* Visual category representation with dynamic transaction emblem */}
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs mb-3 transform transition group-hover:scale-105 overflow-hidden ${
                      isDark ? 'bg-slate-950 border border-slate-800' : 'bg-white border border-slate-200'
                    }`}>
                      {matchedItemForTx?.imageUrl ? (
                        <img 
                          src={matchedItemForTx.imageUrl} 
                          alt={matchedItemForTx.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover animate-fade-in" 
                        />
                      ) : (
                        getItemCategoryVisual(matchedItemForTx?.category || 'Hardware')
                      )}
                    </div>
                    {/* Floating prominent IN / OUT logo badge for easier viewing */}
                    <div className={`absolute -bottom-1 -right-1 h-7.5 w-7.5 rounded-full flex items-center justify-center border-2 shadow-sm ${
                      selectedTx.type === 'IN' 
                        ? 'bg-emerald-500 border-white text-white dark:border-slate-900' 
                        : selectedTx.type === 'OUT' 
                          ? 'bg-rose-500 border-white text-white dark:border-slate-900' 
                          : 'bg-indigo-500 border-white text-white dark:border-slate-900'
                    }`}>
                      {selectedTx.type === 'IN' ? (
                        <ArrowDownLeft size={14} className="stroke-[3]" />
                      ) : selectedTx.type === 'OUT' ? (
                        <ArrowUpRight size={14} className="stroke-[3]" />
                      ) : (
                        <Clock size={13} className="stroke-[3]" />
                      )}
                    </div>
                  </div>
                  
                  <p className="font-mono text-[10px] font-extrabold text-indigo-500 tracking-wider">
                    {matchedItemForTx?.sku || selectedTx.sku}
                  </p>
                  <p className={`font-black text-xs px-2 truncate max-w-full mt-1.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {matchedItemForTx?.name || selectedTx.itemName}
                  </p>
                  <span className="text-[9px] text-slate-400 block uppercase font-black tracking-widest mt-1">
                    Kategori: {matchedItemForTx?.category || 'Umum'}
                  </span>
                </div>

                {/* Audit Core Detail Column */}
                <div className="space-y-3">
                  <h4 className={`text-xs font-black tracking-widest uppercase flex items-center gap-1.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Info size={14} className="text-indigo-400" /> Lembar Audit Aliran
                  </h4>

                  <div className={`p-4 rounded-xl border text-xs space-y-3 font-sans ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-655'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Tipe Transaksi:</span>
                      {selectedTx.type === 'IN' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-sans">
                          MASUK (+)
                        </span>
                      ) : selectedTx.type === 'SET' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-500/10 border border-slate-500/30 text-slate-400 font-sans">
                          PENYESUAIAN (=)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400 font-sans">
                          KELUAR (-)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/10 pt-2">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Jumlah Kuantitas:</span>
                      <span className={`text-sm font-black font-mono ${
                        selectedTx.type === 'IN' ? 'text-emerald-500' : selectedTx.type === 'OUT' ? 'text-rose-500' : 'text-slate-400'
                      }`}>
                        {selectedTx.type === 'IN' ? '+' : selectedTx.type === 'OUT' ? '-' : ''}{selectedTx.quantity} {matchedItemForTx?.unit || 'Pcs'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/10 pt-2">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Operator Pengaju:</span>
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{selectedTx.operator}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/10 pt-2">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Waktu Pencatatan:</span>
                      <span className="font-mono text-[10px] text-slate-400">{new Date(selectedTx.timestamp).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction specific notes explanations */}
              <div className={`p-4 rounded-xl border text-xs ${
                isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-150'
              }`}>
                <span className="text-slate-400 font-bold uppercase text-[9px] block mb-1">Catatan/Keterangan Transaksi</span>
                <p className={`italic font-medium leading-relaxed ${isDark ? 'text-indigo-200' : 'text-indigo-950'}`}>
                  "{selectedTx.notes || 'Tidak ada catatan penjelasan terekam.'}"
                </p>
              </div>

              {/* Matched Product Catalog Details Cards */}
              <div className="space-y-3">
                <h4 className={`text-xs font-black tracking-widest uppercase flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <Boxes size={14} className="text-indigo-400" /> Informasi Produk Saat Ini di Katalog
                </h4>

                {matchedItemForTx ? (
                  <div className={`rounded-xl border p-4 text-xs space-y-4 font-sans ${
                    isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50/50 border-slate-150'
                  }`}>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-sans">
                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-150'}`}>
                        <span className="text-slate-400 font-bold uppercase text-[8px] block">Kode SKU</span>
                        <span className="font-mono text-xs font-black text-indigo-500 uppercase block mt-1">{matchedItemForTx.sku}</span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-150'}`}>
                        <span className="text-slate-400 font-bold uppercase text-[8px] block">Stok Katalog Saat Ini</span>
                        <span className={`text-xs font-black block mt-1 ${matchedItemForTx.quantity <= matchedItemForTx.minStock ? 'text-rose-500' : 'text-slate-400'}`}>
                          {matchedItemForTx.quantity} {matchedItemForTx.unit || 'Pcs'}
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-150'}`}>
                        <span className="text-slate-400 font-bold uppercase text-[8px] block">Harga Satuan</span>
                        <span className="font-semibold text-xs text-indigo-500 block mt-1">{formatRupiah(matchedItemForTx.unitPrice)}</span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-150'}`}>
                        <span className="text-slate-400 font-bold uppercase text-[8px] block">Lokasi Unit</span>
                        <span className="font-mono text-[10px] font-bold block truncate mt-1 text-slate-400" title={matchedItemForTx.location}>
                          <MapPin size={10} className="inline mr-0.5 text-indigo-400" /> {matchedItemForTx.location || '--'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/15 pt-3.5">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Deskripsi Barang</span>
                        <p className="text-xs text-slate-500 leading-normal mt-1">{matchedItemForTx.notes || '--'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Ambang Batas Minimum</span>
                        <p className="text-xs text-slate-500 leading-normal mt-1">{matchedItemForTx.minStock} {matchedItemForTx.unit || 'Pcs'}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/15 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Valuasi Saat Ini: <b>{formatRupiah(matchedItemForTx.quantity * matchedItemForTx.unitPrice)}</b></span>
                      <span>Terakhir Diperbarui: <b>{new Date(matchedItemForTx.lastUpdated).toLocaleDateString('id-ID')}</b></span>
                    </div>

                  </div>
                ) : (
                  <div className={`rounded-xl border p-5 text-center text-xs space-y-1 ${
                    isDark ? 'bg-slate-950/20 border-slate-850 text-slate-400' : 'bg-slate-50/50 border-slate-150 text-slate-500'
                  }`}>
                    <AlertTriangle className="mx-auto text-amber-500 mb-1" size={18} />
                    <p className="font-bold text-slate-400">Produk ini telah dihapus dari katalog utama.</p>
                    <p className="text-[10px] text-slate-500 font-mono">Hanya rekaman transaksi historis yang tersedia untuk keperluan audit.</p>
                  </div>
                )}
              </div>

              {/* Connected chronological flow history of this product */}
              {activeItemTransactionsForTx.length > 1 && (
                <div className="space-y-3 font-sans">
                  <h4 className={`text-xs font-black tracking-widest uppercase flex items-center gap-1.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Clock size={14} className="text-indigo-400" /> Riwayat Transaksi Lainnya untuk {selectedTx.itemName}
                  </h4>

                  <div className={`rounded-xl border p-4 max-h-[160px] overflow-y-auto space-y-2.5 text-xs ${
                    isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-150'
                  }`}>
                    {activeItemTransactionsForTx
                      .filter(t => t.id !== selectedTx.id)
                      .slice(0, 5)
                      .map(t => {
                        const isG = t.type === 'IN';
                        const isS = t.type === 'SET';
                        return (
                          <div key={t.id} className="flex justify-between items-start border-b border-slate-800/5 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-start gap-2.5">
                              {/* In Out logo indicator for each transaction */}
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center border shrink-0 ${
                                isG 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                  : isS 
                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' 
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                              }`}>
                                {isG ? (
                                  <ArrowDownLeft size={13} className="stroke-[2.5]" />
                                ) : isS ? (
                                  <Clock size={12} />
                                ) : (
                                  <ArrowUpRight size={13} className="stroke-[2.5]" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                    isG ? 'bg-emerald-500/10 text-emerald-400' : isS ? 'bg-slate-500/10 text-slate-400' : 'bg-rose-500/10 text-rose-400'
                                  }`}>
                                    {isG ? 'MASUK' : isS ? 'SET' : 'KELUAR'}
                                  </span>
                                  <span className="font-bold text-[10px] text-slate-400">{new Date(t.timestamp).toLocaleDateString('id-ID')}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 italic mt-0.5" title={t.notes}>"{t.notes || '--'}"</p>
                              </div>
                            </div>
                            <span className={`font-mono font-bold text-xs ${isG ? 'text-emerald-500' : isS ? 'text-slate-400' : 'text-rose-500'}`}>
                              {isG ? '+' : isS ? '' : '-'}{t.quantity}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${
              isDark ? 'border-slate-850 bg-slate-950/30' : 'border-slate-100 bg-slate-50'
            }`}>
              <button 
                onClick={() => setSelectedTx(null)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg border transition cursor-pointer ${
                  isDark 
                    ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' 
                    : 'border-slate-250 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                Tutup Detail Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
