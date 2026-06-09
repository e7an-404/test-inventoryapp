import React, { useState, useMemo } from 'react';
import { Transaction, InventoryItem, formatRupiah } from '../types';
import { 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  Clock, 
  Download, 
  Trash,
  Zap,
  Wrench,
  Shield,
  FileSpreadsheet,
  FileText,
  MapPin,
  X,
  Info,
  Boxes,
  ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// Dynamic category item visualizer module representing product pictures
const FlaskConical = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={props.size || 24} 
    height={props.size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={props.className}
  >
    <path d="M10 2v7.51L4.39 17.62a2.1 2.1 0 0 0-.17 1.7 2.1 2.1 0 0 0 1.54 1.48L18.42 22a2.12 2.12 0 0 0 1.25-.26 2.1 2.1 0 0 0 .95-1.16l4.49-11.07a2.11 2.11 0 0 0-.32-2l-3-4.14A2.11 2.11 0 0 0 20 2H10z" />
    <path d="M10 9h4" />
  </svg>
);

interface TransactionHistoryProps {
  transactions: Transaction[];
  items?: InventoryItem[];
  onClearHistory?: () => void;
  onUpdateTransaction?: (updatedTx: Transaction, adjustStock: boolean, oldTx: Transaction) => void;
  onToggleIgnoreTransaction?: (txId: string) => void;
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

// Helper to safely format local date strings
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

export default function TransactionHistory({ 
  transactions, 
  items = [], 
  onClearHistory, 
  onUpdateTransaction,
  onToggleIgnoreTransaction,
  theme = 'light',
  periodFilter,
  setPeriodFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedMonth,
  setSelectedMonth
}: TransactionHistoryProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'IN' | 'OUT'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Edit fields states
  const [activeDetailsTab, setActiveDetailsTab] = useState<'info' | 'edit'>('info');
  const [editType, setEditType] = useState<'IN' | 'OUT' | 'SET'>('IN');
  const [editQty, setEditQty] = useState<number>(0);
  const [editOperator, setEditOperator] = useState('');
  const [editTimestamp, setEditTimestamp] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAdjustStock, setEditAdjustStock] = useState(true);

  // Helper for timezone offset-aware datetime-local value
  const toDatetimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const tzOffset = d.getTimezoneOffset() * 60000; // in milliseconds
    const localTime = new Date(d.getTime() - tzOffset);
    return localTime.toISOString().slice(0, 16);
  };

  // Re-sync states whenever modal selected transaction changes
  React.useEffect(() => {
    if (selectedTx) {
      setEditType(selectedTx.type);
      setEditQty(selectedTx.quantity);
      setEditOperator(selectedTx.operator);
      setEditTimestamp(selectedTx.timestamp);
      setEditNotes(selectedTx.notes || '');
      setEditAdjustStock(true);
      setActiveDetailsTab('info');
    }
  }, [selectedTx]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editQty <= 0) {
      alert('Kuantitas kuantitas terdaftar harus bernilai positif.');
      return;
    }
    if (!editOperator.trim()) {
      alert('Nama operator tidak boleh kosong.');
      return;
    }
    if (!onUpdateTransaction || !selectedTx) return;

    const updatedTx: Transaction = {
      ...selectedTx,
      type: editType,
      quantity: editQty,
      operator: editOperator.trim(),
      timestamp: editTimestamp ? new Date(editTimestamp).toISOString() : selectedTx.timestamp,
      notes: editNotes.trim()
    };

    onUpdateTransaction(updatedTx, editAdjustStock, selectedTx);
    setSelectedTx(null);
  };

  const matchedItem = useMemo(() => {
    if (!selectedTx) return null;
    return items.find(item => item.id === selectedTx.itemId || item.sku === selectedTx.sku) || null;
  }, [selectedTx, items]);

  const activeItemTransactions = useMemo(() => {
    if (!selectedTx) return [];
    return transactions.filter(t => t.itemId === selectedTx.itemId || t.sku === selectedTx.sku);
  }, [selectedTx, transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = tx.itemName.toLowerCase().includes(search.toLowerCase()) || 
                          tx.sku.toLowerCase().includes(search.toLowerCase()) ||
                          tx.operator.toLowerCase().includes(search.toLowerCase()) ||
                          (tx.notes && tx.notes.toLowerCase().includes(search.toLowerCase())) ||
                          tx.id.toLowerCase().includes(search.toLowerCase());
                            
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      
      let matchPeriod = true;
      if (periodFilter === 'daily') {
        const txDate = getLocalDayString(new Date(tx.timestamp));
        if (startDate && txDate < startDate) matchPeriod = false;
        if (endDate && txDate > endDate) matchPeriod = false;
      } else if (periodFilter === 'monthly') {
        if (selectedMonth) {
          const txMonth = getLocalMonthString(new Date(tx.timestamp));
          matchPeriod = txMonth === selectedMonth;
        }
      }
      
      return matchSearch && matchType && matchPeriod;
    });
  }, [transactions, search, typeFilter, periodFilter, startDate, endDate, selectedMonth]);

  // Sorting state for Transaction History Table
  const [sortField, setSortField] = useState<keyof Transaction>('timestamp');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const sortedTransactions = useMemo(() => {
    const list = [...filteredTransactions];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle undefined/nulls
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (sortField === 'timestamp') {
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = String(bVal).toLowerCase();
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' 
          ? (aVal as number) - (bVal as number) 
          : (bVal as number) - (aVal as number);
      }
    });
    return list;
  }, [filteredTransactions, sortField, sortDirection]);

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: keyof Transaction) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} className="inline opacity-30 ml-1.5 align-middle" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUpDown size={11} className="inline text-indigo-550 dark:text-indigo-400 ml-1.5 align-middle rotate-180 transition-transform" />
      : <ArrowUpDown size={11} className="inline text-indigo-550 dark:text-indigo-400 ml-1.5 align-middle transition-transform" />;
  };

  const exportToCSV = () => {
    if (sortedTransactions.length === 0) return;
    
    // Header translated
    const headers = ['ID Transaksi', 'ID Barang', 'SKU', 'Nama Produk', 'Tipe Tindakan', 'Jumlah', 'Waktu', 'Operator', 'Catatan', 'Status Perhitungan'];
    const rows = sortedTransactions.map(tx => [
      tx.id,
      tx.itemId,
      tx.sku,
      `"${tx.itemName.replace(/"/g, '""')}"`,
      tx.type === 'IN' ? 'MASUK' : tx.type === 'OUT' ? 'KELUAR' : 'SET',
      tx.quantity,
      tx.timestamp,
      `"${tx.operator.replace(/"/g, '""')}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
      tx.ignored ? 'DIABAIKAN (HUMAN ERROR)' : 'AKTIF'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `riwayat_audit_inventaris_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // NATIVE XLSX EXPORT WITH STYLISH COLUMNS
  const handleExportXLSX = () => {
    if (sortedTransactions.length === 0) {
      alert('Tidak ada data transaksi yang dapat diekspor.');
      return;
    }
    const data = sortedTransactions.map(tx => ({
      'ID Transaksi': tx.id,
      'ID Barang': tx.itemId,
      'SKU': tx.sku,
      'Nama Produk': tx.itemName,
      'Tipe Tindakan': tx.type === 'IN' ? 'MASUK' : tx.type === 'OUT' ? 'KELUAR' : 'SET',
      'Jumlah Kuantitas': tx.quantity,
      'Waktu Operasional': new Date(tx.timestamp).toLocaleString('id-ID'),
      'Operator Pengaju': tx.operator,
      'Status Perhitungan': tx.ignored ? 'DIABAIKAN (HUMAN ERROR)' : 'AKTIF',
      'Catatan Penjelasan': tx.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Transaksi');
    XLSX.writeFile(workbook, `Riwayat_Transaksi_Inventaris_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // NATIVE PDF REPORT GENERATION WITH BEAUTIFUL TABLE
  const handleExportPDF = () => {
    if (sortedTransactions.length === 0) {
      alert('Tidak ada data transaksi yang dapat diekspor.');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('LAPORAN RIWAYAT AKTIVITAS TRANSAKSI GUDANG', 15, 20);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total Transaksi: ${sortedTransactions.length} baris`, 15, 27);

    let y = 35;
    // Drawn Table Header Box
    doc.setFillColor(79, 70, 229); // Modern Indigo
    doc.rect(15, y, 267, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    
    doc.text('Waktu Operasional', 18, y + 6);
    doc.text('ID Audit Tx', 60, y + 6);
    doc.text('Nama Produk', 95, y + 6);
    doc.text('SKU', 170, y + 6);
    doc.text('Tipe Aliran', 205, y + 6);
    doc.text('Qty', 232, y + 6);
    doc.text('Operator', 248, y + 6);

    y += 9;
    doc.setFont('Helvetica', 'normal');
    
    sortedTransactions.forEach((tx, index) => {
      // Check for page overflow
      if (y > 185) {
        doc.addPage();
        y = 20;
        doc.setFillColor(79, 70, 229);
        doc.rect(15, y, 267, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.text('Waktu Operasional', 18, y + 6);
        doc.text('ID Audit Tx', 60, y + 6);
        doc.text('Nama Produk', 95, y + 6);
        doc.text('SKU', 170, y + 6);
        doc.text('Tipe Aliran', 205, y + 6);
        doc.text('Qty', 232, y + 6);
        doc.text('Operator', 248, y + 6);
        y += 9;
        doc.setFont('Helvetica', 'normal');
      }

      // Zebra stripes background
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 267, 7.5, 'F');
      }

      doc.setTextColor(71, 85, 105);
      doc.setFont('Helvetica', 'normal');
      const dateStr = new Date(tx.timestamp).toLocaleString('id-ID');
      doc.text(dateStr, 18, y + 5);
      doc.text(tx.id.substring(0, 10).toUpperCase(), 60, y + 5);
      
      doc.setTextColor(15, 23, 42);
      doc.text(String(tx.itemName || '').substring(0, 36), 95, y + 5);
      
      doc.setTextColor(71, 85, 105);
      doc.text(String(tx.sku || '-'), 170, y + 5);

      const isGain = tx.type === 'IN';
      const isSet = tx.type === 'SET';
      
      if (isGain) {
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text('MASUK', 205, y + 5);
      } else if (isSet) {
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // slate-400
        doc.text('PENYESUAIAN', 205, y + 5);
      } else {
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(239, 68, 68); // rose-500
        doc.text('KELUAR', 205, y + 5);
      }

      doc.setFont('Helvetica', 'bold');
      doc.text(`${isGain ? '+' : isSet ? '' : '-'}${tx.quantity}`, 232, y + 5);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(String(tx.operator || '').substring(0, 18), 248, y + 5);

      y += 7.5;
    });

    const totalIn = filteredTransactions.filter(t => t.type === 'IN' && !t.ignored).reduce((acc, t) => acc + t.quantity, 0);
    const totalOut = filteredTransactions.filter(t => t.type === 'OUT' && !t.ignored).reduce((acc, t) => acc + t.quantity, 0);

    // Summary line
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y + 2, 267, 10, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 2, 282, y + 2);
    
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`RINGKASAN TOTAL ALIRAN:`, 18, y + 8.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`Mencapai Masuk: +${totalIn} unit`, 90, y + 8.5);
    doc.setTextColor(239, 68, 68);
    doc.text(`Mencapai Keluar: -${totalOut} unit`, 160, y + 8.5);

    doc.save(`Riwayat_Transaksi_Inventaris_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const itemCategoryIcon = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('electr')) return <Zap size={40} className="text-amber-400" />;
    if (cat.includes('tool') || cat.includes('hardw')) return <Wrench size={40} className="text-indigo-400" />;
    if (cat.includes('safe')) return <Shield size={40} className="text-emerald-400" />;
    if (cat.includes('chem') || cat.includes('adhes')) return <FlaskConical size={40} className="text-cyan-400" />;
    return <Boxes size={40} className="text-gray-400" />;
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      
      {/* Sub Toolbar Row */}
      <div className={`rounded-2xl border p-5 flex flex-col gap-4 shadow-3xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 w-full">
          {/* Left Side: Dynamic Query Filters */}
          <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-3 gap-3">
            
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan ID, SKU, produk atau operator..."
                className={`w-full pl-9 pr-3 py-2 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={() => setTypeFilter('all')}
                className={`flex-1 border text-[10px] font-black uppercase tracking-widest py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  typeFilter === 'all' 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : isDark 
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Semua
              </button>
              <button 
                onClick={() => setTypeFilter('IN')}
                className={`flex-1 border text-[10px] font-black uppercase tracking-widest py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  typeFilter === 'IN' 
                    ? 'bg-emerald-500/20 text-emerald-450 border-emerald-500 font-bold' 
                    : isDark 
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Masuk
              </button>
              <button 
                onClick={() => setTypeFilter('OUT')}
                className={`flex-1 border text-[10px] font-black uppercase tracking-widest py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  typeFilter === 'OUT' 
                    ? 'bg-rose-500/20 text-rose-450 border-rose-500 font-bold' 
                    : isDark 
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Keluar
              </button>
            </div>
          </div>

          {/* Right Side Actions for Excel (XLSX), PDF */}
          <div className="shrink-0 w-full lg:w-auto flex flex-wrap gap-2 justify-end">
            <button 
              onClick={handleExportXLSX}
              disabled={transactions.length === 0}
              className={`flex-1 sm:flex-none border font-black text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-800 disabled:opacity-30' 
                  : 'bg-white border-slate-200 text-emerald-650 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300'
              }`}
            >
              <FileSpreadsheet size={13} className="text-emerald-500" /> Excel
            </button>

            <button 
              onClick={handleExportPDF}
              disabled={transactions.length === 0}
              className={`flex-1 sm:flex-none border font-black text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-800 disabled:opacity-30' 
                  : 'bg-white border-slate-200 text-rose-650 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300'
              }`}
            >
              <FileText size={13} className="text-rose-500" /> PDF Report
            </button>
          </div>
        </div>

        {/* Row 2: Periodic Filters & Date range selectors */}
        <div className={`border-t pt-4 flex flex-col md:flex-row items-stretch md:items-center gap-4 text-xs ${
          isDark ? 'border-slate-800/60' : 'border-slate-100'
        }`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-black-400">Periode Aliran:</span>
            <div className={`inline-flex rounded-lg border p-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  periodFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-indigo-400'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('daily')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  periodFilter === 'daily'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-indigo-400'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('monthly')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  periodFilter === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-indigo-400'
                }`}
              >
                Bulanan
              </button>
            </div>
          </div>

          {/* Conditional Date Selection Input */}
          {periodFilter === 'daily' && (
            <div className="flex flex-wrap items-center gap-3 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-black-400">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ colorScheme: isDark ? 'dark' : 'light' }}
                  className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-black-400">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ colorScheme: isDark ? 'dark' : 'light' }}
                  className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>
          )}

          {periodFilter === 'monthly' && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-[10px] font-black uppercase tracking-widest text-black-400">Periode:</span>
              <div className="flex items-center gap-2">
                {/* Month Dropdown */}
                <select
                  value={selectedMonth.split('-')[1] || '06'}
                  onChange={(e) => {
                    const parsedYear = selectedMonth.split('-')[0] || '2026';
                    setSelectedMonth(`${parsedYear}-${e.target.value}`);
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
                  value={selectedMonth.split('-')[0] || '2026'}
                  onChange={(e) => {
                    const parsedMonth = selectedMonth.split('-')[1] || '06';
                    setSelectedMonth(`${e.target.value}-${parsedMonth}`);
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

          <div className="md:ml-auto text-[9px] font-mono text-slate-600 font-bold uppercase tracking-widest text-right">
            Menampilkan: <span className="text-indigo-550 font-black text-indigo-500">{filteredTransactions.length}</span> dari <span className="text-slate-500">{transactions.length}</span> aktivitas
          </div>
        </div>
      </div>

      {/* Audit Data Table Container */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-slate-600 font-black text-[12px] uppercase tracking-widest [&>th]:cursor-pointer [&>th]:select-none [&>th]:transition hover:[&>th]:text-indigo-550 ${
                isDark ? 'bg-slate-950/20 border-slate-800 hover:[&>th]:text-indigo-400' : 'bg-slate-50/50 border-slate-100'
              }`}>
                <th className="py-4 px-5" onClick={() => handleSort('timestamp')}>
                  Waktu Operasional {renderSortIndicator('timestamp')}
                </th>
                <th className="py-4 px-5" onClick={() => handleSort('id')}>
                  ID Audit Tx {renderSortIndicator('id')}
                </th>
                <th className="py-4 px-5" onClick={() => handleSort('itemName')}>
                  Nama Produk / Sku {renderSortIndicator('itemName')}
                </th>
                <th className="py-4 px-5 text-center" onClick={() => handleSort('type')}>
                  Tipe Aliran {renderSortIndicator('type')}
                </th>
                <th className="py-4 px-5 text-center font-bold" onClick={() => handleSort('quantity')}>
                  Qty {renderSortIndicator('quantity')}
                </th>
                <th className="py-4 px-5" onClick={() => handleSort('operator')}>
                  Operator Pengaju {renderSortIndicator('operator')}
                </th>
                <th className="py-4 px-5" onClick={() => handleSort('notes')}>
                  Catatan Penjelasan {renderSortIndicator('notes')}
                </th>
                <th className="py-4 px-5 text-center cursor-default hover:text-slate-400">Status / Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                    <Calendar className="mx-auto text-slate-300 animate-pulse" size={36} />
                    <p className="text-sm font-medium">Tidak ada log aktivitas transaksi terekam.</p>
                    <p className="text-xs">Ubah parameter pencarian atau lakukan pengisian stok untuk membuat aktivitas terekam.</p>
                  </td>
                </tr>
              ) : (
                sortedTransactions.map(tx => {
                  const isGain = tx.type === 'IN';
                  const isSet = tx.type === 'SET';
                  const dateStr = new Date(tx.timestamp).toLocaleString('id-ID');
                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      title="Klik untuk melihat peninjauan rincian detail audit transaksi dan info produk"
                      className={`text-xs transition duration-150 cursor-pointer ${
                        tx.ignored
                          ? isDark 
                            ? 'bg-slate-950/50 text-slate-500 line-through' 
                            : 'bg-slate-100/60 text-slate-400 line-through'
                          : isDark 
                            ? 'hover:bg-slate-950/70 text-slate-300 hover:text-white border-slate-800' 
                            : 'hover:bg-indigo-50/45'
                      }`}
                    >
                      
                      {/* Timestamp Info */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-slate-400 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-500" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
 
                      {/* Log ID */}
                      <td className="py-3.5 px-5 font-mono text-slate-500 font-bold uppercase select-all">
                        {tx.id.substring(0, 10)}
                      </td>
 
                      {/* Product details */}
                      <td className="py-3.5 px-5">
                        <span className={`font-bold block ${isDark ? 'text-slate-100' : 'text-slate-900'} ${tx.ignored ? 'opacity-65' : ''}`}>{tx.itemName}</span>
                        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block uppercase tracking-wider ${
                          isDark ? 'bg-slate-950 border border-slate-850 text-slate-400 animate-fade-in' : 'bg-slate-50 border border-slate-100 text-slate-500'
                        }`}>{tx.sku}</span>
                      </td>
 
                      {/* Action Type Badge */}
                      <td className="py-3.5 px-5 text-center">
                        {isGain ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold border ${
                            tx.ignored
                              ? 'bg-slate-500/10 border-slate-500/20 text-slate-500'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}>
                            <ArrowDownLeft size={10} /> MASUK {tx.ignored && '(ABAI)'}
                          </span>
                        ) : isSet ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-slate-500/10 border border-slate-500/30 text-slate-400">
                            PENYESUAIAN
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold border ${
                            tx.ignored
                              ? 'bg-slate-500/10 border-slate-500/20 text-slate-500'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-450'
                          }`}>
                            <ArrowUpRight size={10} /> KELUAR {tx.ignored && '(ABAI)'}
                          </span>
                        )}
                      </td>
 
                      {/* Quantity Tag */}
                      <td className="py-3.5 px-5 text-center font-extrabold font-mono text-xs">
                        <span className={tx.ignored ? 'text-slate-500 line-through' : isGain ? 'text-emerald-500' : isSet ? 'text-slate-400' : 'text-red-400'}>
                          {isGain ? '+' : isSet ? '' : '-'}{tx.quantity}
                        </span>
                      </td>
 
                      {/* Operator Person */}
                      <td className={`py-3.5 px-5 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} ${tx.ignored ? 'opacity-65' : ''}`}>
                        {tx.operator}
                      </td>
 
                      {/* Log notes */}
                      <td className="py-3.5 px-5 text-slate-400 max-w-[220px] truncate" title={tx.notes || ''}>
                        {tx.ignored ? <span className="italic text-rose-500/80 font-bold">[DIABAIKAN: Kesalahan Input]</span> : (tx.notes || '--')}
                      </td>

                      {/* Ignore Action button */}
                      <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                        {onToggleIgnoreTransaction ? (
                          <button
                            type="button"
                            onClick={() => onToggleIgnoreTransaction(tx.id)}
                            className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition ${
                              tx.ignored
                                ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20'
                                : 'bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/20'
                            }`}
                            title={tx.ignored ? 'Pulihkan log transaksi ini' : 'Abaikan log ini dalam perhitungan statistik & stok'}
                          >
                            {tx.ignored ? 'Pulihkan' : 'Abaikan'}
                          </button>
                        ) : (
                          <span className="text-slate-500">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED INTERACTIVE TRANSACTION & CORRELATED PRODUCT DETAILS MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className={`rounded-xl border shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all duration-350 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`px-6 py-4 flex justify-between items-center text-white ${
              isDark ? 'bg-slate-950' : 'bg-slate-900'
            }`}>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Riwayat Lembar Audit Transaksi</span>
                <h3 className="font-extrabold text-sm tracking-tight font-display">Log Kontrol: {selectedTx.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab selection bar inside Details modal */}
            <div className={`px-6 pt-3 flex border-b gap-1.5 shrink-0 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setActiveDetailsTab('info')}
                className={`py-2.5 px-4 text-[10px] font-black uppercase tracking-wider border-b-2 transition cursor-pointer -mb-[1px] ${
                  activeDetailsTab === 'info'
                    ? 'border-indigo-500 text-indigo-500 font-extrabold bg-transparent'
                    : `border-transparent text-slate-400 ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-700'} bg-transparent`
                }`}
              >
                👁️ Rincian Audit
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailsTab('edit')}
                className={`py-2.5 px-4 text-[10px] font-black uppercase tracking-wider border-b-2 transition cursor-pointer -mb-[1px] ${
                  activeDetailsTab === 'edit'
                    ? 'border-indigo-500 text-indigo-500 font-extrabold bg-transparent'
                    : `border-transparent text-slate-400 ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-700'} bg-transparent`
                }`}
              >
                ✏️ Edit Transaksi
              </button>
            </div>

            {activeDetailsTab === 'edit' ? (
              <form onSubmit={handleEditSubmit}>
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  
                  {/* Warning Note */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                    isDark ? 'bg-indigo-950/20 border-indigo-900/35 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-950'
                  }`}>
                    <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Pemberitahuan Koreksi Transaksi</span>
                      Anda sedang memodifikasi lembar data audit transaksi historis. Seluruh aktivitas edit disaring dan disimpan ke dalam database.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Tipe Tindakan Aliran Persediaan</label>
                      <select 
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as any)}
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-bold leading-tight ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="IN">IN - Tambah Stok Masuk (+)</option>
                        <option value="OUT">OUT - Catat Pengeluaran Barang (-)</option>
                        <option value="SET">SET - Override Paksa Hitungan Stok (=)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Jumlah Kuantitas Unit *</label>
                      <input 
                        type="number" 
                        value={editQty}
                        onChange={(e) => setEditQty(Math.max(1, Number(e.target.value)))}
                        min="1"
                        required
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-bold font-mono ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Operator Pengaju *</label>
                      <input 
                        type="text" 
                        value={editOperator}
                        onChange={(e) => setEditOperator(e.target.value)}
                        required
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Tanggal/Waktu Transaksi</label>
                      <input 
                        type="datetime-local" 
                        value={toDatetimeLocal(editTimestamp)}
                        onChange={(e) => setEditTimestamp(e.target.value ? new Date(e.target.value).toISOString() : editTimestamp)}
                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-bold font-mono focus:outline-none ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Catatan / Alasan Aliran *</label>
                    <textarea 
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      required
                      rows={3}
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-bold leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <label className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer select-none transition ${
                    isDark ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-950' : 'bg-slate-50 border-slate-150 hover:bg-slate-100/50'
                  }`}>
                    <input 
                      type="checkbox" 
                      checked={editAdjustStock}
                      onChange={(e) => setEditAdjustStock(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <div>
                      <span className={`block text-xs font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        Dampak Otomatis Pada Kuantitas Stok Barang
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                        Jika diaktifkan, sisa stok barang terkait ("{matchedItem?.name || selectedTx.itemName}") akan disinkronkan berdasarkan selisih koreksi transaksi ini.
                      </span>
                    </div>
                  </label>

                </div>
                <div className={`px-6 py-4 flex justify-end gap-2 border-t ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <button 
                    type="button"
                    onClick={() => setActiveDetailsTab('info')}
                    className={`font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-lg transition-all cursor-pointer ${
                      isDark ? 'bg-slate-800 text-slate-350 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-150/35"
                  >
                    Simpan Koreksi
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  
                  {/* Top Split Visual Container */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Visual Digital Asset representation for "photo" */}
                    <div className={`relative group overflow-hidden rounded-xl bg-gradient-to-br border flex flex-col items-center justify-center p-6 h-52 text-center transition ${
                      isDark 
                        ? 'from-indigo-950/40 via-slate-950/90 to-indigo-950/40 border-indigo-900/40' 
                        : 'from-indigo-50/50 via-white to-slate-100/70 border-indigo-100'
                    }`}>
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase bg-indigo-600 text-white select-none">
                        Asset Visual
                      </div>
                      
                      {/* Visual category representation with dynamic transaction emblem */}
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs mb-3 transform transition group-hover:scale-105 ${
                          isDark ? 'bg-slate-950 border border-slate-800' : 'bg-white border border-slate-200'
                        }`}>
                          {itemCategoryIcon(matchedItem?.category || 'Hardware')}
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
                        {matchedItem?.sku || selectedTx.sku}
                      </p>
                      <p className={`font-black text-xs px-2 truncate max-w-full mt-1.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {matchedItem?.name || selectedTx.itemName}
                      </p>
                      <span className="text-[9px] text-slate-400 block uppercase font-black tracking-widest mt-1">
                        Kategori: {matchedItem?.category || 'Umum'}
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
                        isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-650'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Tipe Transaksi:</span>
                          {selectedTx.type === 'IN' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              <ArrowDownLeft size={10} /> MASUK (+)
                            </span>
                          ) : selectedTx.type === 'SET' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-500/10 border border-slate-500/30 text-slate-400">
                              PENYESUAIAN (=)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-450">
                              <ArrowUpRight size={10} /> KELUAR (-)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800/10 pt-2">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Jumlah Kuantitas:</span>
                          <span className={`text-sm font-black font-mono ${
                            selectedTx.type === 'IN' ? 'text-emerald-500' : selectedTx.type === 'OUT' ? 'text-rose-500' : 'text-slate-400'
                          }`}>
                            {selectedTx.type === 'IN' ? '+' : selectedTx.type === 'OUT' ? '-' : ''}{selectedTx.quantity} {matchedItem?.unit || 'Pcs'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800/10 pt-2">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Operator Pengaju:</span>
                          <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{selectedTx.operator}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800/10 pt-2">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Waktu Pencatatan:</span>
                          <span className="font-mono text-[10px] text-slate-450 text-slate-400">{new Date(selectedTx.timestamp).toLocaleString('id-ID')}</span>
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

                    {matchedItem ? (
                      <div className={`rounded-xl border p-4 text-xs space-y-4 font-sans ${
                        isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50/50 border-slate-150'
                      }`}>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-150'}`}>
                            <span className="text-slate-400 font-bold uppercase text-[8px] block">Kode SKU</span>
                            <span className="font-mono text-xs font-black text-indigo-500 uppercase block mt-1">{matchedItem.sku}</span>
                          </div>
                          <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-150'}`}>
                            <span className="text-slate-400 font-bold uppercase text-[8px] block">Stok Katalog Saat Ini</span>
                            <span className={`text-xs font-black block mt-1 ${matchedItem.quantity <= matchedItem.minStock ? 'text-rose-500' : 'text-slate-400'}`}>
                              {matchedItem.quantity} {matchedItem.unit || 'Pcs'}
                            </span>
                          </div>
                          <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-150'}`}>
                            <span className="text-slate-400 font-bold uppercase text-[8px] block">Harga Satuan</span>
                            <span className="font-semibold text-xs text-indigo-500 block mt-1">{formatRupiah(matchedItem.unitPrice)}</span>
                          </div>
                          <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-150'}`}>
                            <span className="text-slate-400 font-bold uppercase text-[8px] block">Lokasi Unit</span>
                            <span className="font-mono text-[10px] font-bold block truncate mt-1 text-slate-400" title={matchedItem.location}>
                              <MapPin size={10} className="inline mr-0.5 text-indigo-400" /> {matchedItem.location || '--'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/15 pt-3.5">
                          <div>
                            <span className="text-slate-400 font-bold uppercase text-[9px] block">Deskripsi Barang</span>
                            <p className="text-xs text-slate-500 leading-normal mt-1">{matchedItem.notes || '--'}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold uppercase text-[9px] block">Ambang Batas Minimum</span>
                            <p className="text-xs text-slate-500 leading-normal mt-1">{matchedItem.minStock} {matchedItem.unit || 'Pcs'}</p>
                          </div>
                        </div>

                        <div className="border-t border-slate-800/15 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Valuasi Saat Ini: <b>{formatRupiah(matchedItem.quantity * matchedItem.unitPrice)}</b></span>
                          <span>Terakhir Diperbarui: <b>{new Date(matchedItem.lastUpdated).toLocaleDateString('id-ID')}</b></span>
                        </div>

                      </div>
                    ) : (
                      <div className={`rounded-xl border p-5 text-center text-xs space-y-1 ${
                        isDark ? 'bg-slate-950/20 border-slate-850 text-slate-450 text-slate-400' : 'bg-slate-50/50 border-slate-150 text-slate-550'
                      }`}>
                        <AlertTriangle className="mx-auto text-amber-500 mb-1" size={18} />
                        <p className="font-bold text-slate-400">Produk ini telah dihapus dari katalog utama.</p>
                        <p className="text-[10px] text-slate-500">Hanya rekaman transaksi historis yang tersedia untuk keperluan audit.</p>
                      </div>
                    )}
                  </div>

                  {/* Connected chronological flow history of this product */}
                  {activeItemTransactions.length > 1 && (
                    <div className="space-y-3">
                      <h4 className={`text-xs font-black tracking-widest uppercase flex items-center gap-1.5 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        <Clock size={14} className="text-indigo-400" /> Riwayat Transaksi Lainnya untuk {selectedTx.itemName}
                      </h4>

                      <div className={`rounded-xl border p-4 max-h-[160px] overflow-y-auto space-y-2.5 text-xs ${
                        isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-150'
                      }`}>
                        {activeItemTransactions
                          .filter(t => t.id !== selectedTx.id)
                          .slice(0, 5)
                          .map(t => {
                            const isG = t.type === 'IN';
                            const isS = t.type === 'SET';
                            return (
                              <div key={t.id} className="flex justify-between items-start border-b border-slate-800/5 pb-2 last:border-0 last:pb-0 font-sans">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                      isG ? 'bg-emerald-500/10 text-emerald-400' : isS ? 'bg-slate-500/10 text-slate-400' : 'bg-rose-500/10 text-rose-450'
                                    }`}>
                                      {isG ? 'MASUK' : isS ? 'SET' : 'KELUAR'}
                                    </span>
                                    <span className="font-bold text-[10px] text-slate-400">{new Date(t.timestamp).toLocaleDateString('id-ID')}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 italic mt-0.5" title={t.notes}>"{t.notes || '--'}"</p>
                                </div>
                                <span className={`font-mono font-bold font-xs ${isG ? 'text-emerald-500' : isS ? 'text-slate-400' : 'text-rose-500'}`}>
                                  {isG ? '+' : isS ? '' : '-'}{t.quantity}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                </div>

                <div className={`px-6 py-4 flex justify-end gap-2 border-t ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <button 
                    onClick={() => setSelectedTx(null)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-150/35 font-sans"
                  >
                    Tutup Review
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Simple warning box fallback icon helper
const AlertTriangle = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={props.size || 24} 
    height={props.size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={props.className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
