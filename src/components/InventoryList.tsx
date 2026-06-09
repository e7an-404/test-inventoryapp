import React, { useState, useMemo } from 'react';
import { InventoryItem, Transaction, formatRupiah, User } from '../types';
import { ProductPhotoSelector } from './ProductPhotoSelector';
import { 
  Search, 
  MapPin, 
  AlertTriangle, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Check, 
  PlusCircle,
  FileSpreadsheet,
  FileText,
  X,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Info,
  Calendar,
  Grid,
  ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

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

interface InventoryListProps {
  items: InventoryItem[];
  onSaveItem: (item: InventoryItem, tx?: Transaction) => void;
  onDeleteItem: (itemId: string) => void;
  syncConnected: boolean;
  currentUser: User | null;
  transactions?: Transaction[];
  theme?: 'light' | 'dark';
}

export default function InventoryList({ 
  items, 
  onSaveItem, 
  onDeleteItem, 
  syncConnected, 
  currentUser,
  transactions = [],
  theme = 'light'
}: InventoryListProps) {
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'sufficient'>('all');
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);

  // Adjustment form state
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT' | 'SET'>('IN');
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustOperator, setAdjustOperator] = useState(currentUser?.name || '');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Item form state
  const [formId, setFormId] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formQuantity, setFormQuantity] = useState(0);
  const [formUnit, setFormUnit] = useState('Pcs');
  const [formUnitPrice, setFormUnitPrice] = useState(0);
  const [formMinStock, setFormMinStock] = useState(10);
  const [formNotes, setFormNotes] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Input history states for forms (5 rows or more)
  const [skuHistory, setSkuHistory] = useState<string[]>([]);
  const [categoryHistory, setCategoryHistory] = useState<string[]>([]);
  const [nameHistory, setNameHistory] = useState<string[]>([]);
  const [unitHistory, setUnitHistory] = useState<string[]>([]);
  const [locationHistory, setLocationHistory] = useState<string[]>([]);
  const [notesHistory, setNotesHistory] = useState<string[]>([]);

  React.useEffect(() => {
    const loadSavedHistory = (key: string, backupValues: string[]) => {
      try {
        const val = localStorage.getItem(`history_${key}`);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        // ignore fallback to backup
      }
      return backupValues;
    };

    // Seed history with unique values from the current inventory list matching user's assets
    const fallbackSkus = Array.from(new Set(items.map(i => i.sku).filter(Boolean))).slice(0, 10);
    const fallbackCats = Array.from(new Set(items.map(i => i.category).filter(Boolean))).slice(0, 10);
    const fallbackNames = Array.from(new Set(items.map(i => i.name).filter(Boolean))).slice(0, 10);
    const fallbackUnits = Array.from(new Set(items.map(i => i.unit).filter(Boolean))).slice(0, 10);
    const fallbackLocs = Array.from(new Set(items.map(i => i.location).filter(Boolean))).slice(0, 10);
    const fallbackNotes = Array.from(new Set(items.map(i => i.notes).filter(Boolean))).slice(0, 10);

    setSkuHistory(loadSavedHistory('sku', fallbackSkus));
    setCategoryHistory(loadSavedHistory('category', fallbackCats));
    setNameHistory(loadSavedHistory('name', fallbackNames));
    setUnitHistory(loadSavedHistory('unit', fallbackUnits));
    setLocationHistory(loadSavedHistory('location', fallbackLocs));
    setNotesHistory(loadSavedHistory('notes', fallbackNotes));
  }, [items]);

  const updateFieldHistory = (key: string, value: string, currentHistory: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const cleanList = currentHistory.filter(h => h.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...cleanList].slice(0, 12);
    setter(updated);
    try {
      localStorage.setItem(`history_${key}`, JSON.stringify(updated));
    } catch (e) {
      // safe write fallback
    }
  };

  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    items.forEach(item => {
      if (item.category) list.add(item.category);
    });
    return Array.from(list).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase()) ||
                          (item.location && item.location.toLowerCase().includes(search.toLowerCase())) ||
                          (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()));
                          
      const matchCat = selectedCategory === '' || item.category === selectedCategory;
      const isLow = item.quantity <= item.minStock;
      const matchStatus = statusFilter === 'all' || 
                          (statusFilter === 'low' && isLow) || 
                          (statusFilter === 'sufficient' && !isLow);

      return matchSearch && matchCat && matchStatus;
    });
  }, [items, search, selectedCategory, statusFilter]);

  // Sorting state for Inventory Items Table
  const [sortField, setSortField] = useState<keyof InventoryItem | 'valuation'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    list.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === 'valuation') {
        aVal = a.quantity * a.unitPrice;
        bVal = b.quantity * b.unitPrice;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }

      // Handle undefined/nulls
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

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
  }, [filteredItems, sortField, sortDirection]);

  const handleSort = (field: keyof InventoryItem | 'valuation') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: keyof InventoryItem | 'valuation') => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} className="inline opacity-30 ml-1.5 align-middle" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUpDown size={11} className="inline text-indigo-550 dark:text-indigo-400 ml-1.5 align-middle rotate-180 transition-transform" />
      : <ArrowUpDown size={11} className="inline text-indigo-550 dark:text-indigo-400 ml-1.5 align-middle transition-transform" />;
  };

  const openNewItemDialog = () => {
    setFormId('');
    setFormSku('');
    setFormName('');
    setFormCategory('Umum');
    setFormLocation('');
    setFormQuantity(0);
    setFormUnit('Pcs');
    setFormUnitPrice(0);
    setFormMinStock(5);
    setFormNotes('');
    setFormImageUrl('');
    setActiveItem(null);
    setIsItemModalOpen(true);
  };

  const openEditItemDialog = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation(); // Avoid triggering row details click
    setFormId(item.id);
    setFormSku(item.sku);
    setFormName(item.name);
    setFormCategory(item.category || 'Umum');
    setFormLocation(item.location || '');
    setFormQuantity(item.quantity);
    setFormUnit(item.unit || 'Pcs');
    setFormUnitPrice(item.unitPrice);
    setFormMinStock(item.minStock);
    setFormNotes(item.notes || '');
    setFormImageUrl(item.imageUrl || '');
    setActiveItem(item);
    setIsItemModalOpen(true);
  };

  const openAdjustDialog = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation(); // Avoid triggering row details click
    setActiveItem(item);
    setAdjustmentType('IN');
    setAdjustQty(10);
    setAdjustOperator(currentUser?.name || '');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const [detailsActiveTab, setDetailsActiveTab] = useState<'info' | 'transaksi' | 'edit'>('info');

  const openDetailsDialog = (item: InventoryItem) => {
    setActiveItem(item);
    setDetailsActiveTab('info');

    // Initialize Adjustment state defaults
    setAdjustmentType('IN');
    setAdjustQty(10);
    setAdjustOperator(currentUser?.name || '');
    setAdjustNotes('');

    // Initialize Edit state defaults
    setFormId(item.id);
    setFormSku(item.sku);
    setFormName(item.name);
    setFormCategory(item.category || 'Umum');
    setFormLocation(item.location || '');
    setFormQuantity(item.quantity);
    setFormUnit(item.unit || 'Pcs');
    setFormUnitPrice(item.unitPrice);
    setFormMinStock(item.minStock);
    setFormNotes(item.notes || '');
    setFormImageUrl(item.imageUrl || '');

    setIsDetailsModalOpen(true);
  };

  const handleInlinePostAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    if (adjustQty <= 0) {
      alert('Kuantitas penyesuaian harus bernilai bilangan bulat positif.');
      return;
    }

    let finalQty = activeItem.quantity;
    if (adjustmentType === 'IN') {
      finalQty += adjustQty;
    } else if (adjustmentType === 'OUT') {
      if (activeItem.quantity < adjustQty) {
        alert(`Gagal! Stok tidak cukup. Jumlah pengeluaran melebihi sisa stok saat ini yaitu ${activeItem.quantity} ${activeItem.unit}.`);
        return;
      }
      finalQty -= adjustQty;
    } else if (adjustmentType === 'SET') {
      finalQty = adjustQty;
    }

    const updatedItem: InventoryItem = {
      ...activeItem,
      quantity: finalQty,
      lastUpdated: new Date().toISOString()
    };

    const transactionRecord: Transaction = {
      id: `tx_${Date.now()}`,
      itemId: activeItem.id,
      sku: activeItem.sku,
      itemName: activeItem.name,
      type: adjustmentType === 'SET' ? (finalQty >= activeItem.quantity ? 'IN' : 'OUT') : adjustmentType,
      quantity: adjustmentType === 'SET' ? Math.abs(finalQty - activeItem.quantity) : adjustQty,
      timestamp: new Date().toISOString(),
      operator: adjustOperator || currentUser?.name || 'Petugas Gudang',
      notes: adjustNotes || 'Penyesuaian stok manual melalui panel review katalog'
    };

    onSaveItem(updatedItem, transactionRecord);
    setActiveItem(updatedItem); // Update local details modal views immediately
    
    // Sync the edit form state quantity
    setFormQuantity(finalQty);
    
    // Reset/clear temporary input fields
    setAdjustQty(10);
    setAdjustNotes('');
  };

  const handleInlineSaveItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formName.trim()) {
      alert('Sila isi kolom wajib SKU dan Nama Produk.');
      return;
    }

    const itemToSubmit: InventoryItem = {
      id: formId || `item_${Date.now()}`,
      sku: formSku.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory || 'Umum',
      quantity: Number(formQuantity) || 0,
      unit: formUnit || 'Pcs',
      unitPrice: Number(formUnitPrice) || 0,
      minStock: Number(formMinStock) || 0,
      location: formLocation || '',
      notes: formNotes || '',
      lastUpdated: new Date().toISOString(),
      imageUrl: formImageUrl || ''
    };

    let logTx: Transaction | undefined;
    if (activeItem) {
      const difference = itemToSubmit.quantity - activeItem.quantity;
      if (difference !== 0) {
        logTx = {
          id: `tx_${Date.now()}`,
          itemId: itemToSubmit.id,
          sku: itemToSubmit.sku,
          itemName: itemToSubmit.name,
          type: difference > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(difference),
          timestamp: new Date().toISOString(),
          operator: currentUser?.name || 'Pembaruan Audit',
          notes: 'Kuantitas persediaan barang ditimpa manual melalui formulir penyesuaian detail review.'
        };
      }
    }

    onSaveItem(itemToSubmit, logTx);
    setActiveItem(itemToSubmit); // Update local details modal views immediately
    setDetailsActiveTab('info'); // Switch back to info tab to show updated stats and timeline

    // Save inputs to history
    updateFieldHistory('sku', itemToSubmit.sku, skuHistory, setSkuHistory);
    updateFieldHistory('category', itemToSubmit.category, categoryHistory, setCategoryHistory);
    updateFieldHistory('name', itemToSubmit.name, nameHistory, setNameHistory);
    updateFieldHistory('unit', itemToSubmit.unit, unitHistory, setUnitHistory);
    updateFieldHistory('location', itemToSubmit.location || '', locationHistory, setLocationHistory);
    updateFieldHistory('notes', itemToSubmit.notes || '', notesHistory, setNotesHistory);
  };

  const handleSaveItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formName.trim()) {
      alert('Sila isi kolom wajib SKU dan Nama Produk.');
      return;
    }

    const itemToSubmit: InventoryItem = {
      id: formId || `item_${Date.now()}`,
      sku: formSku.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory || 'Umum',
      quantity: Number(formQuantity) || 0,
      unit: formUnit || 'Pcs',
      unitPrice: Number(formUnitPrice) || 0,
      minStock: Number(formMinStock) || 0,
      location: formLocation || '',
      notes: formNotes || '',
      lastUpdated: new Date().toISOString(),
      imageUrl: formImageUrl || ''
    };

    let logTx: Transaction | undefined;
    
    // Create audit log for starting balance if new item with positive qty
    if (!formId && itemToSubmit.quantity > 0) {
      logTx = {
        id: `tx_${Date.now()}`,
        itemId: itemToSubmit.id,
        sku: itemToSubmit.sku,
        itemName: itemToSubmit.name,
        type: 'IN',
        quantity: itemToSubmit.quantity,
        timestamp: new Date().toISOString(),
        operator: currentUser?.name || 'Inisialisasi Sistem',
        notes: 'Pencatatan alokasi saldo awal persediaan barang baru'
      };
    } else if (formId && activeItem) {
      const difference = itemToSubmit.quantity - activeItem.quantity;
      if (difference !== 0) {
        logTx = {
          id: `tx_${Date.now()}`,
          itemId: itemToSubmit.id,
          sku: itemToSubmit.sku,
          itemName: itemToSubmit.name,
          type: difference > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(difference),
          timestamp: new Date().toISOString(),
          operator: currentUser?.name || 'Pembaruan Audit',
          notes: 'Kuantitas persediaan barang ditimpa manual melalui formulir properti.'
        };
      }
    }

    onSaveItem(itemToSubmit, logTx);
    setIsItemModalOpen(false);

    // Save inputs to history
    updateFieldHistory('sku', itemToSubmit.sku, skuHistory, setSkuHistory);
    updateFieldHistory('category', itemToSubmit.category, categoryHistory, setCategoryHistory);
    updateFieldHistory('name', itemToSubmit.name, nameHistory, setNameHistory);
    updateFieldHistory('unit', itemToSubmit.unit, unitHistory, setUnitHistory);
    updateFieldHistory('location', itemToSubmit.location || '', locationHistory, setLocationHistory);
    updateFieldHistory('notes', itemToSubmit.notes || '', notesHistory, setNotesHistory);
  };

  const handlePostAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    if (adjustQty <= 0) {
      alert('Kuantitas penyesuaian harus bernilai bilangan bulat positif.');
      return;
    }

    let finalQty = activeItem.quantity;
    if (adjustmentType === 'IN') {
      finalQty += adjustQty;
    } else if (adjustmentType === 'OUT') {
      if (activeItem.quantity < adjustQty) {
        alert(`Gagal! Stok tidak cukup. Jumlah pengeluaran melebihi sisa stok saat ini yaitu ${activeItem.quantity} ${activeItem.unit}.`);
        return;
      }
      finalQty -= adjustQty;
    } else if (adjustmentType === 'SET') {
      finalQty = adjustQty;
    }

    const updatedItem: InventoryItem = {
      ...activeItem,
      quantity: finalQty,
      lastUpdated: new Date().toISOString()
    };

    const transactionRecord: Transaction = {
      id: `tx_${Date.now()}`,
      itemId: activeItem.id,
      sku: activeItem.sku,
      itemName: activeItem.name,
      type: adjustmentType === 'SET' ? (finalQty >= activeItem.quantity ? 'IN' : 'OUT') : adjustmentType,
      quantity: adjustmentType === 'SET' ? Math.abs(finalQty - activeItem.quantity) : adjustQty,
      timestamp: new Date().toISOString(),
      operator: adjustOperator || currentUser?.name || 'Petugas Gudang',
      notes: adjustNotes || 'Penyesuaian stok manual melalui formulir kontrol modal'
    };

    onSaveItem(updatedItem, transactionRecord);
    setIsAdjustModalOpen(false);
  };

  const handleQuickRestockExecute = () => {
    if (!activeItem) return;
    if (adjustQty <= 0) {
      alert('Kuantitas penyesuaian harus bernilai bilangan bulat positif.');
      return;
    }

    const finalQty = activeItem.quantity + adjustQty;

    const updatedItem: InventoryItem = {
      ...activeItem,
      quantity: finalQty,
      lastUpdated: new Date().toISOString()
    };

    const transactionRecord: Transaction = {
      id: `tx_${Date.now()}`,
      itemId: activeItem.id,
      sku: activeItem.sku,
      itemName: activeItem.name,
      type: 'IN',
      quantity: adjustQty,
      timestamp: new Date().toISOString(),
      operator: adjustOperator || currentUser?.name || 'Petugas Gudang',
      notes: adjustNotes || 'Isi ulang cepat dipicu langsung dari modal review katalog'
    };

    onSaveItem(updatedItem, transactionRecord);
    setActiveItem(updatedItem); // Update local active item so visuals update immediately
    setAdjustNotes(''); // Reset notes
  };

  const triggerDelete = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation(); // Avoid triggering row details click
    if (window.confirm(`Apakah Anda benar-benar yakin ingin menghapus produk SKU "${item.sku}" (${item.name})? Tindakan ini tidak dapat dibatalkan.`)) {
      onDeleteItem(item.id);
    }
  };

  // NATIVE XLSX EXPORT WITH STYLISH COLUMNS
  const handleExportXLSX = () => {
    if (sortedItems.length === 0) {
      alert('Tidak ada data produk yang dapat diekspor.');
      return;
    }
    const data = sortedItems.map(item => ({
      'SKU': item.sku,
      'Nama Barang': item.name,
      'Kategori': item.category || 'Umum',
      'Lokasi': item.location || 'Utama',
      'Stok Terkini': item.quantity,
      'Satuan': item.unit || 'Pcs',
      'Harga Satuan (Rp)': item.unitPrice,
      'Total Nilai Valuasi (Rp)': item.quantity * item.unitPrice,
      'Batas Stok Minimum': item.minStock,
      'Keterangan Catatan': item.notes || '',
      'Tanggal Diperbarui': new Date(item.lastUpdated).toLocaleString('id-ID')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Persediaan');
    XLSX.writeFile(workbook, `Katalog_Stok_Inventaris_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // NATIVE PDF REPORT GENERATION WITH BEAUTIFUL TABLE
  const handleExportPDF = () => {
    if (sortedItems.length === 0) {
      alert('Tidak ada data produk yang dapat diekspor.');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('LAPORAN PERSIDIAAN BARANG DAN NILAI INVENTARIS', 15, 20);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total Ragam Produk: ${sortedItems.length} baris`, 15, 27);

    let y = 35;
    // Drawn Table Header Box
    doc.setFillColor(79, 70, 229); // Modern Indigo
    doc.rect(15, y, 267, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    
    doc.text('SKU', 18, y + 6);
    doc.text('Nama Barang', 45, y + 6);
    doc.text('Kategori', 115, y + 6);
    doc.text('Lokasi', 150, y + 6);
    doc.text('Stok', 185, y + 6);
    doc.text('Harga Satuan', 210, y + 6);
    doc.text('Total Valuasi', 242, y + 6);

    y += 9;
    doc.setFont('Helvetica', 'normal');
    
    sortedItems.forEach((item, index) => {
      // Check for page overflow
      if (y > 185) {
        doc.addPage();
        y = 20;
        doc.setFillColor(79, 70, 229);
        doc.rect(15, y, 267, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.text('SKU', 18, y + 6);
        doc.text('Nama Barang', 45, y + 6);
        doc.text('Kategori', 115, y + 6);
        doc.text('Lokasi', 150, y + 6);
        doc.text('Stok', 185, y + 6);
        doc.text('Harga Satuan', 210, y + 6);
        doc.text('Total Valuasi', 242, y + 6);
        y += 9;
        doc.setFont('Helvetica', 'normal');
      }

      // Zebra stripes background
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 267, 7.5, 'F');
      }

      doc.setTextColor(71, 85, 105);
      doc.text(String(item.sku || '-'), 18, y + 5);
      
      doc.setTextColor(15, 23, 42);
      doc.text(String(item.name || '').substring(0, 38), 45, y + 5);
      
      doc.setTextColor(71, 85, 105);
      doc.text(String(item.category || 'Umum').substring(0, 16), 115, y + 5);
      doc.text(String(item.location || 'Utama').substring(0, 16), 150, y + 5);
      
      // Highlight low stock item count in PDF with bold
      const isLow = item.quantity <= item.minStock;
      if (isLow) {
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
      } else {
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
      }
      doc.text(`${item.quantity} ${item.unit || 'Pcs'}`, 185, y + 5);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Rp ' + Math.round(item.unitPrice).toLocaleString('id-ID'), 210, y + 5);
      doc.text('Rp ' + Math.round(item.quantity * item.unitPrice).toLocaleString('id-ID'), 242, y + 5);

      y += 7.5;
    });

    const totalValAll = sortedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    
    // Summary line in landscape bottom
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y + 2, 267, 10, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 2, 282, y + 2);
    
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('TOTAL SELURUH VALUASI CADANGAN ASET:', 18, y + 8.5);
    doc.setTextColor(79, 70, 229);
    doc.text('Rp ' + Math.round(totalValAll).toLocaleString('id-ID'), 242, y + 8.5);

    doc.save(`Katalog_Stok_Inventaris_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Calculate flow of in and out for activeItem
  const activeItemTransactions = useMemo(() => {
    if (!activeItem) return [];
    return transactions.filter(tx => tx.itemId === activeItem.id || tx.sku === activeItem.sku);
  }, [activeItem, transactions]);

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search filters and triggers bar */}
      <div className={`rounded-2xl border p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs transition duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Left Side: Search fields */}
        <div className="flex-grow w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-450 pointer-events-none">
              <Search size={15} />
            </span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari barang berdasarkan SKU, nama, lokasi..."
              className={`w-full pl-9 pr-3 py-2 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            />
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full px-3 py-2 text-xs font-bold border rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-850'
              }`}
            >
              <option value="">Semua Kategori</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
              <ChevronDown size={14} />
            </span>
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`w-full px-3 py-2 text-xs font-bold border rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-850'
              }`}
            >
              <option value="all">Semua Persediaan (Cukup & Tipis)</option>
              <option value="low">⚠️ Stok Menipis (Di Bawah Batas)</option>
              <option value="sufficient">✓ Stok Cukup Saja</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
              <ChevronDown size={14} />
            </span>
          </div>
        </div>

        {/* Right side: Export buttons & trigger */}
        <div className="w-full md:w-auto shrink-0 flex flex-wrap gap-2.5">
          <button 
            onClick={handleExportXLSX}
            title="Semburan Laporan ke Excel (.xlsx)"
            className={`px-3.5 py-2.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer shadow-3xs ${
              isDark 
                ? 'bg-slate-950 hover:bg-slate-800 text-emerald-400 border-slate-850' 
                : 'bg-white hover:bg-emerald-50 text-emerald-700 border-slate-200 hover:border-emerald-200'
            }`}
          >
            <FileSpreadsheet size={13} /> Excel (XLSX)
          </button>

          <button 
            onClick={handleExportPDF}
            title="Cetak Laporan PDF (.pdf)"
            className={`px-3.5 py-2.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer shadow-3xs ${
              isDark 
                ? 'bg-slate-950 hover:bg-slate-800 text-rose-400 border-slate-855 border-slate-800' 
                : 'bg-white hover:bg-rose-50 text-rose-600 border-slate-200 hover:border-rose-200'
            }`}
          >
            <FileText size={13} /> PDF
          </button>

          {currentUser?.role === 'admin' && (
            <button 
              onClick={openNewItemDialog}
              className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-150/30 cursor-pointer"
            >
              Tambah Produk
            </button>
          )}
        </div>
      </div>

      {/* Main Stock Inventory Table Grid */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800 font-sans' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-slate-600 font-black text-[12px] uppercase tracking-widest [&>th]:cursor-pointer [&>th]:select-none [&>th]:transition hover:[&>th]:text-indigo-500 ${
                isDark ? 'bg-slate-950/20 border-slate-850 hover:[&>th]:text-indigo-400' : 'bg-slate-50/50 border-slate-100'
              }`}>
                <th className="py-4 px-5" onClick={() => handleSort('name')}>
                  Spesifikasi SKU & Produk {renderSortIndicator('name')}
                </th>
                <th className="py-4 px-5" onClick={() => handleSort('category')}>
                  Kategori {renderSortIndicator('category')}
                </th>
                <th className="py-4 px-5 text-center font-bold" onClick={() => handleSort('quantity')}>
                  Stok Persediaan {renderSortIndicator('quantity')}
                </th>
                <th className="py-4 px-5 text-right font-bold" onClick={() => handleSort('unitPrice')}>
                  Harga Beli {renderSortIndicator('unitPrice')}
                </th>
                <th className="py-4 px-5 text-right font-bold font-sans" onClick={() => handleSort('valuation')}>
                  Harga Total Aset {renderSortIndicator('valuation')}
                </th>
                <th className="py-4 px-5" onClick={() => handleSort('location')}>
                  Lokasi Simpan {renderSortIndicator('location')}
                </th>
                {currentUser?.role === 'admin' && <th className="py-4 px-5 text-right cursor-default hover:text-slate-400">Opsi Pengaturan</th>}
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={currentUser?.role === 'admin' ? 7 : 6} className="py-12 text-center text-slate-400 space-y-2">
                    <Grid className="mx-auto text-slate-300" size={36} />
                    <p className="text-sm font-bold">Tidak ada item yang sesuai ditemukan.</p>
                    <p className="text-xs">Ubah filter pencarian atau buat produk baru.</p>
                  </td>
                </tr>
              ) : (
                sortedItems.map(item => {
                  const itemValue = item.quantity * item.unitPrice;
                  const isLow = item.quantity <= item.minStock;
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => openDetailsDialog(item)}
                      title="Klik baris untuk meninjau riwayat transaksi keluar-masuk"
                      className={`group transition duration-150 cursor-pointer ${
                        isDark ? 'hover:bg-slate-950/40 text-slate-300' : 'hover:bg-slate-100/10 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Name & SKU */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shrink-0" 
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}>
                              {getItemCategoryVisual(item.category || 'Umum')}
                            </div>
                          )}
                          <div>
                            <span className="font-mono text-[9px] font-semibold text-slate-500 block tracking-wider uppercase">{item.sku}</span>
                            <div className={`font-bold mt-1 text-sm group-hover:text-indigo-500 transition duration-150 ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>{item.name}</div>
                            {item.notes && (
                               <div className="text-slate-400 text-[11px] mt-1 italic max-w-sm truncate" title={item.notes}>{item.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wide border ${
                          isDark 
                            ? 'bg-slate-950 border-slate-850 text-slate-400' 
                            : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}>
                          {item.category || 'Umum'}
                        </span>
                      </td>

                      {/* Stock units + Status Indicator */}
                      <td className="py-4 px-5 text-center">
                        <div className={`font-extrabold text-sm ${isLow ? 'text-amber-500' : isDark ? 'text-slate-200' : 'text-slate-850'}`}>
                          {item.quantity} <span className="text-[10px] font-normal text-slate-500">{item.unit || 'Pcs'}</span>
                        </div>
                        
                        <div className="mt-1.5">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase">
                              <AlertTriangle size={10} /> Stok Tipis ({item.minStock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                              <Check size={10} /> Aman
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className={`py-4 px-5 text-right font-mono font-medium ${isDark ? 'text-slate-350' : 'text-slate-600'}`}>
                        {formatRupiah(item.unitPrice)}
                      </td>

                      {/* Total Inventory Value */}
                      <td className={`py-4 px-5 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatRupiah(itemValue)}
                      </td>

                      {/* Storage cell placement */}
                      <td className="py-4 px-5">
                        <div className="text-slate-450 text-xs flex items-center gap-1 font-medium font-sans">
                          <MapPin size={12} className="text-slate-500 shrink-0" />
                          <span>{item.location || '--'}</span>
                        </div>
                      </td>

                      {/* Quick triggers action buttons */}
                      {currentUser?.role === 'admin' && (
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex gap-1.5 font-bold">
                            <button 
                              onClick={(e) => openAdjustDialog(e, item)}
                              title="Setel Masuk / Keluar Stok"
                              className={`h-8 w-8 rounded-lg flex items-center justify-center border transition active:scale-95 cursor-pointer ${
                                isDark 
                                  ? 'bg-slate-950 hover:bg-cyan-950/20 text-cyan-400 border-slate-850 hover:border-cyan-500/30' 
                                  : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-100'
                              }`}
                            >
                              <PlusCircle size={15} />
                            </button>
                            
                            <button 
                              onClick={(e) => openEditItemDialog(e, item)}
                              title="Edit Data Detail Produk"
                              className={`h-8 w-8 rounded-lg flex items-center justify-center border transition active:scale-95 cursor-pointer ${
                                isDark 
                                  ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-850' 
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <Edit2 size={13} />
                            </button>

                            <button 
                              onClick={(e) => triggerDelete(e, item)}
                              title="Hapus Kolom Aset"
                              className={`h-8 w-8 rounded-lg flex items-center justify-center border transition active:scale-95 cursor-pointer ${
                                isDark 
                                  ? 'bg-slate-950 hover:bg-rose-950/20 text-rose-450 border-slate-850 hover:border-rose-500/20' 
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100'
                              }`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED INTERACTIVE PRODUCT DETAILS MODAL (TIMELINE & INLINE CONTROLS) */}
      {isDetailsModalOpen && activeItem && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className={`rounded-xl border shadow-2xl max-w-4xl w-full overflow-hidden transform transition-all duration-350 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`px-6 py-4 flex justify-between items-center text-white ${
              isDark ? 'bg-slate-950' : 'bg-slate-900'
            }`}>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Rincian & Pengaturan Aliran Produk</span>
                <h3 className="font-extrabold text-sm tracking-tight font-display">{activeItem.name}</h3>
              </div>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab selection bar inside Details modal */}
            <div className={`px-6 pt-3 flex border-b gap-1.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setDetailsActiveTab('info')}
                className={`py-2.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer -mb-[1px] ${
                  detailsActiveTab === 'info'
                    ? 'border-indigo-500 text-indigo-500 font-extrabold'
                    : `border-transparent text-slate-400 ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-705 text-slate-500 hover:text-slate-700'}`
                }`}
              >
                👁️ Tinjau & Riwayat
              </button>
              {currentUser?.role === 'admin' && (
                <>
                  <button
                    type="button"
                    onClick={() => setDetailsActiveTab('transaksi')}
                    className={`py-2.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer -mb-[1px] ${
                      detailsActiveTab === 'transaksi'
                        ? 'border-indigo-500 text-indigo-500 font-extrabold'
                        : `border-transparent text-slate-400 ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-705 text-slate-500 hover:text-slate-700'}`
                    }`}
                  >
                    ⚡ Atur Transaksi Stok
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailsActiveTab('edit')}
                    className={`py-2.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer -mb-[1px] ${
                      detailsActiveTab === 'edit'
                        ? 'border-indigo-500 text-indigo-500 font-extrabold'
                        : `border-transparent text-slate-400 ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-705 text-slate-500 hover:text-slate-700'}`
                    }`}
                  >
                    ✏️ Edit Detail Produk
                  </button>
                </>
              )}
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Tab 1: Info and timeline flows */}
              {detailsActiveTab === 'info' && (
                <div className="space-y-6">
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
                        <div className={`w-18 h-18 rounded-2xl flex items-center justify-center shadow-sm mb-3.5 transform transition duration-300 group-hover:scale-110 overflow-hidden ${
                          isDark ? 'bg-slate-950 border border-slate-800' : 'bg-white border text-center border-slate-200'
                        }`}>
                          {activeItem.imageUrl ? (
                            <img 
                              src={activeItem.imageUrl} 
                              alt={activeItem.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            getItemCategoryVisual(activeItem.category || 'Umum')
                          )}
                        </div>
                        
                        <p className="font-mono text-[10px] font-extrabold text-indigo-500 tracking-wider">
                          {activeItem.sku}
                        </p>
                        <p className={`font-black text-sm px-2 truncate max-w-full mt-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {activeItem.name}
                        </p>
                        <span className="text-[9px] text-slate-400 block uppercase font-black tracking-widest mt-1">
                          Kategori: {activeItem.category || 'Umum'}
                        </span>
                      </div>
                      
                      <div className={`p-3 rounded-xl border text-center text-xs font-bold font-sans ${
                        isDark ? 'bg-slate-950/40 border-slate-850 text-slate-400' : 'bg-slate-50/50 border-slate-150 text-slate-500'
                      }`}>
                        Lokasi Rak: <span className="font-mono text-indigo-500 font-extrabold">{activeItem.location || 'Belum diatur'}</span>
                      </div>
                    </div>

                    {/* Info and statistics (7 Cols) */}
                    <div className="md:col-span-12 lg:col-span-12 xl:col-span-7 flex flex-col justify-between space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                          isDark ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-150'
                        }`}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">SKU Kode</span>
                          <span className="font-mono text-xs font-bold uppercase mt-1 text-indigo-500">{activeItem.sku}</span>
                        </div>
                        
                        <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                          isDark ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-150'
                        }`}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Kategori</span>
                          <span className="text-xs font-black uppercase mt-1">{activeItem.category || 'Umum'}</span>
                        </div>

                        <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                          activeItem.quantity <= activeItem.minStock 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            : isDark ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-150'
                        }`}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Sisa Unit Stok</span>
                          <span className="text-sm font-extrabold mt-1">{activeItem.quantity} {activeItem.unit || 'Pcs'}</span>
                        </div>

                        <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                          isDark ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-150'
                        }`}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Valuasi Aset</span>
                          <span className="text-sm font-extrabold text-indigo-500 mt-1">{formatRupiah(activeItem.quantity * activeItem.unitPrice)}</span>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl border text-xs space-y-3 font-sans ${
                        isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50/50 border-slate-100 text-slate-650'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Harga Satuan Beli</span>
                          <span className="font-mono font-bold text-xs">{formatRupiah(activeItem.unitPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-800/10 pt-2">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Ambang Batas Minimum</span>
                          <span className="font-bold text-xs">{activeItem.minStock} {activeItem.unit || 'Pcs'}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-800/10 pt-2">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Tanggal Update</span>
                          <span className="font-mono text-[10px] text-slate-400">{new Date(activeItem.lastUpdated || Date.now()).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeItem.notes && (
                    <div className={`p-4 rounded-xl border text-xs ${
                      isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-600'
                    }`}>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block mb-1">Catatan/Keterangan</span>
                      <p className="italic leading-relaxed text-slate-500">{activeItem.notes}</p>
                    </div>
                  )}

                  {/* TIMELINE RIWAYAT TRANSAKSI PRODUK */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-indigo-505 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        <Clock size={14} />
                      </div>
                      <h4 className={`text-xs font-black tracking-widest uppercase ${isDark ? 'text-white' : 'text-slate-850'}`}>Riwayat Aliran Alokasi Stok ({activeItemTransactions.length} Log)</h4>
                    </div>

                    <div className={`rounded-xl border p-4 max-h-[220px] overflow-y-auto space-y-3.5 ${
                      isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50/50 border-slate-150'
                    }`}>
                      {activeItemTransactions.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 font-bold text-xs uppercase">Belum ada riwayat transaksi tercatat untuk produk ini.</p>
                      ) : (
                        <div className="space-y-3 font-sans text-xs">
                          {activeItemTransactions.map((tx) => (
                            <div key={tx.id} className={`flex items-center justify-between p-3 rounded-lg border leading-tight ${
                              tx.type === 'IN' 
                                ? 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10' 
                                : tx.type === 'OUT' 
                                  ? 'bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10' 
                                  : 'bg-indigo-500/5 border-indigo-500/10 hover:bg-indigo-500/10'
                            } transition`}>
                              <div className="flex items-center gap-3">
                                {/* In Out logo for each riwayat row for easy to watch */}
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center border shrink-0 ${
                                  tx.type === 'IN' 
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                    : tx.type === 'OUT' 
                                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' 
                                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500'
                                }`}>
                                  {tx.type === 'IN' ? (
                                    <ArrowDownLeft size={16} className="stroke-[2.5]" />
                                  ) : tx.type === 'OUT' ? (
                                    <ArrowUpRight size={16} className="stroke-[2.5]" />
                                  ) : (
                                    <Clock size={15} />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`font-black tracking-wide text-[9px] uppercase px-1.5 py-0.5 rounded ${
                                      tx.type === 'IN' 
                                        ? 'bg-emerald-500/15 text-emerald-450 text-emerald-400' 
                                        : tx.type === 'OUT' 
                                          ? 'bg-rose-500/15 text-rose-450' 
                                          : 'bg-indigo-500/15 text-indigo-400'
                                    }`}>
                                      {tx.type === 'IN' ? 'MASUK' : tx.type === 'OUT' ? 'KELUAR' : 'SETEL'}
                                    </span>
                                    <span className={`font-mono text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                      {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : '='}
                                      {tx.quantity} {activeItem.unit || 'Pcs'}
                                    </span>
                                  </div>
                                  <div className={`text-[10px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Oleh: <span className="font-bold text-slate-350 dark:text-slate-200">{tx.operator}</span> • <span className="font-mono">{new Date(tx.timestamp).toLocaleString('id-ID')}</span>
                                  </div>
                                  {tx.notes && (
                                    <p className={`text-[10px] italic mt-1.5 pl-1.5 border-l ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'}`}>"{tx.notes}"</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Stock adjustments (IN, OUT, SET) */}
              {detailsActiveTab === 'transaksi' && (
                <form onSubmit={handleInlinePostAdjustment} className="space-y-5">
                  <div className={`p-4 rounded-xl border flex items-center gap-2.5 ${
                    isDark ? 'bg-indigo-950/15 border-indigo-900/30' : 'bg-indigo-50/20 border-indigo-100'
                  }`}>
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                      <PlusCircle size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-tight uppercase">Sesuaikan Kuantitas Stok</h4>
                      <p className="text-[10px] text-slate-400">Pilih tipe penyesuaian (IN/OUT/SET) untuk mengubah kuantitas persediaan di gudang.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-4">
                      {/* Adjustment Type Button Group Selector */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Pilih Tipe Penyesuaian</label>
                        <div className={`grid grid-cols-3 rounded-lg border p-1 text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <button
                            type="button"
                            onClick={() => setAdjustmentType('IN')}
                            className={`py-2 text-[10px] font-black uppercase tracking-wide rounded-md transition cursor-pointer select-none ${
                              adjustmentType === 'IN'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-emerald-500'
                            }`}
                          >
                            Masuk (+)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustmentType('OUT')}
                            className={`py-2 text-[10px] font-black uppercase tracking-wide rounded-md transition cursor-pointer select-none ${
                              adjustmentType === 'OUT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-rose-500'
                            }`}
                          >
                            Keluar (-)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustmentType('SET')}
                            className={`py-2 text-[10px] font-black uppercase tracking-wide rounded-md transition cursor-pointer select-none ${
                              adjustmentType === 'SET'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-blue-500'
                            }`}
                          >
                            Setel (=)
                          </button>
                        </div>
                      </div>

                      {/* Adjust Quantity Input */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Kuantitas Unit</label>
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
                            {activeItem.unit || 'Pcs'}
                          </span>
                        </div>

                        {/* Presets Grid */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {[5, 10, 20, 50, 100].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setAdjustQty(amt)}
                              className={`px-2.5 py-1 text-[10px] font-bold font-mono border rounded-md transition duration-150 cursor-pointer ${
                                adjustQty === amt
                                  ? 'bg-indigo-650 bg-indigo-600 border-indigo-650 border-indigo-600 text-white shadow-xs'
                                  : isDark ? 'border-slate-800 hover:bg-slate-850 text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                              }`}
                            >
                              +{amt}
                            </button>
                          ))}
                          {activeItem.quantity <= activeItem.minStock && (
                            <button
                              type="button"
                              onClick={() => {
                                const diff = activeItem.minStock - activeItem.quantity;
                                setAdjustQty(diff > 0 ? diff : 10);
                              }}
                              className="px-2.5 py-1 text-[10px] font-black border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 rounded-md transition cursor-pointer hover:bg-emerald-500/20"
                            >
                              Isi Ke Batas Aman (+{activeItem.minStock - activeItem.quantity})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Evaluation Indicator */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-center ${
                        isDark ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50/60 border-slate-150'
                      }`}>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">ESTIMASI KELUARAN STOK BARU</span>
                        <div className="flex justify-between items-center font-extrabold text-xs">
                          <span className="text-slate-400">Total Stok Baru Selesai Transaksi:</span>
                          <span className={`text-base font-extrabold font-mono ${
                            adjustmentType === 'IN' 
                              ? 'text-emerald-500' 
                              : adjustmentType === 'OUT' 
                                ? 'text-rose-500' 
                                : 'text-blue-500'
                          }`}>
                            {adjustmentType === 'IN' 
                              ? activeItem.quantity + (Number(adjustQty) || 0)
                              : adjustmentType === 'OUT'
                                ? Math.max(0, activeItem.quantity - (Number(adjustQty) || 0))
                                : (Number(adjustQty) || 0)
                            } {activeItem.unit || 'Pcs'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Nama Petugas Penanggung Jawab</label>
                        <input
                          type="text"
                          value={adjustOperator}
                          onChange={(e) => setAdjustOperator(e.target.value)}
                          placeholder="Nama lengkap operator gudang..."
                          required
                          className={`w-full px-3 py-2 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Catatan Alasan / Penjelasan Transaksi</label>
                        <textarea
                          value={adjustNotes}
                          onChange={(e) => setAdjustNotes(e.target.value)}
                          placeholder="Masukkan rincian singkat seperti nama supplier, alasan pengeluaran barang rusak dll..."
                          rows={3}
                          className={`w-full px-3 py-2 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-805'
                          }`}
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-black uppercase tracking-widest transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                        >
                          ⚡ SIMPAN & PROSES TRANSAKSI SEKARANG
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Tab 3: Detailed property edits */}
              {detailsActiveTab === 'edit' && (
                <form onSubmit={handleInlineSaveItemSubmit} className="space-y-4">
                  <div className={`p-4 rounded-xl border flex items-center gap-2.5 ${
                    isDark ? 'bg-teal-950/10 border-teal-900/30' : 'bg-emerald-50/20 border-emerald-100'
                  }`}>
                    <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500">
                      <Edit2 size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-tight uppercase">Amandemen Detail Metadata Produk</h4>
                      <p className="text-[10px] text-slate-400">Mengubah SKU, Penamaan, Kategori, Harga & Lokasi rak penyimpanan di sini.</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Kode SKU Produk *</label>
                        <input 
                          type="text" 
                          value={formSku}
                          onChange={(e) => setFormSku(e.target.value)}
                          required
                          list="skuHistoryList"
                          placeholder="cth: SKU-3892"
                          className={`w-full border rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Kategori Barang *</label>
                        <input 
                          type="text" 
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          required
                          list="categoryHistoryList"
                          placeholder="cth: Elektronik"
                          className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Nama Lengkap Barang *</label>
                      <input 
                        type="text" 
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                        list="nameHistoryList"
                        placeholder="cth: Suku Cadang Mesin A-5"
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Jumlah Stok (Gunakan Tab Transaksi)</label>
                        <input 
                          type="number" 
                          value={formQuantity}
                          disabled
                          className="w-full border rounded-lg px-3 py-2 text-xs font-mono font-bold bg-slate-500/10 border-slate-500/10 text-slate-400 dark:bg-slate-850 dark:border-slate-800 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Kode Simbol Unit / Satuan</label>
                        <input 
                          type="text" 
                          value={formUnit}
                          onChange={(e) => setFormUnit(e.target.value)}
                          list="unitHistoryList"
                          placeholder="cth: Pcs, Box, Pack"
                          className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Ambang Stok Minimum (Peringatan)</label>
                        <input 
                          type="number" 
                          value={formMinStock}
                          onChange={(e) => setFormMinStock(Number(e.target.value))}
                          min="1"
                          className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Harga Beli Satuan (Unit Price)</label>
                        <input 
                          type="number" 
                          value={formUnitPrice}
                          onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                          min="0"
                          className={`w-full border rounded-lg px-3 py-2 text-xs font-mono font-bold ${
                            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Lokasi Simpan Rak / Ruangan</label>
                        <input 
                          type="text" 
                          value={formLocation}
                          onChange={(e) => setFormLocation(e.target.value)}
                          list="locationHistoryList"
                          placeholder="cth: Rak-D8"
                          className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Catatan Keterangan Barang</label>
                      <textarea 
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        rows={2}
                        list="notesHistoryList"
                        placeholder="Masukkan catatan spesifikasi atau detil lainnya..."
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-850'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Foto Produk</label>
                      <ProductPhotoSelector 
                        value={formImageUrl}
                        onChange={setFormImageUrl}
                        isDark={isDark}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-black uppercase tracking-widest transition cursor-pointer shadow-sm"
                    >
                      💾 UPDATE PROPERTI PRODUK NATIVELIKER
                    </button>
                  </div>
                </form>
              )}

            </div>

            <div className={`px-6 py-4 flex justify-end gap-2 border-t ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="bg-indigo-605 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-lg transition-all cursor-pointer shadow-md font-sans"
              >
                Tutup Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / AMEND PRODUCT DIALOG OVERLAY */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className={`rounded-2xl border shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`px-6 py-4 flex justify-between items-center text-white ${
              isDark ? 'bg-slate-950' : 'bg-slate-900'
            }`}>
              <h3 className="font-extrabold text-xs tracking-widest uppercase font-display">
                {formId ? 'Ubah Parameter Properti Produk' : 'Daftarkan Kolom Produk Baru'}
              </h3>
              <button 
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveItemSubmit} className="p-6 space-y-4">
              
              <div className="space-y-3.5 text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Kode SKU Produk *</label>
                    <input 
                      type="text" 
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      required
                      list="skuHistoryList"
                      placeholder="cth: SKU-010"
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Kategori Barang *</label>
                    <input 
                      type="text" 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      list="categoryHistoryList"
                      placeholder="cth: Logistik"
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Nama Lengkap Barang *</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    list="nameHistoryList"
                    placeholder="cth: Laptop Thinkpad T14"
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Kuantitas Stok</label>
                    <input 
                      type="number" 
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(Number(e.target.value))}
                      min="0"
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-850'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Satuan Paket</label>
                    <input 
                      type="text" 
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      list="unitHistoryList"
                      placeholder="cth: Pcs"
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Batas Minimum</label>
                    <input 
                      type="number" 
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(Number(e.target.value))}
                      min="1"
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-850'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Harga Beli Satuan (Rp)</label>
                    <input 
                      type="number" 
                      value={formUnitPrice}
                      onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                      min="0"
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-850'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Lokasi Penyimpanan</label>
                    <input 
                      type="text" 
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      list="locationHistoryList"
                      placeholder="cth: Rak A-02"
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Keterangan / Catatan Tambahan</label>
                  <textarea 
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    list="notesHistoryList"
                    placeholder="Spesifikasi tambahan..."
                    rows={2}
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Foto Produk</label>
                  <ProductPhotoSelector 
                    value={formImageUrl}
                    onChange={setFormImageUrl}
                    isDark={isDark}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setIsItemModalOpen(false)}
                  className={`px-5 py-2.5 border rounded-lg font-bold uppercase text-[10px] tracking-widest cursor-pointer ${
                    isDark 
                      ? 'border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-300' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-150/35"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST QUANTITIES DIALOG OVERLAY (IN / OUT / SET) */}
      {isAdjustModalOpen && activeItem && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className={`rounded-2xl border shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`px-6 py-4 flex justify-between items-center text-white ${
              isDark ? 'bg-slate-950' : 'bg-slate-900'
            }`}>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-450 text-slate-400 block mb-0.5">FORM PENYESUAIAN STOK</span>
                <h3 className="font-extrabold text-sm tracking-tight font-display">{activeItem.name}</h3>
              </div>
              <button 
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePostAdjustment} className="p-6 space-y-4">
              
              <div className="space-y-4 text-xs font-sans">
                
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-xl flex items-center justify-between font-bold">
                  <span>Stok Persediaan Saat Ini:</span>
                  <span className="text-sm font-black text-white bg-indigo-500 px-2 py-0.5 rounded-md">{activeItem.quantity} {activeItem.unit || 'Pcs'}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Tipe Tindakan Aliran Persediaan *</label>
                  <select 
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as any)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-black uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-850 text-white animate-fade-in' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="IN">IN - Tambah Stok Masuk (+)</option>
                    <option value="OUT">OUT - Catat Pengeluaran Barang (-)</option>
                    <option value="SET">SET - Override Paksa Hitungan Stok (=)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Jumlah Unit Terlibat *</label>
                    <input 
                      type="number" 
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(Number(e.target.value))}
                      min="1"
                      required
                      className={`w-full border rounded-lg px-3 py-2.5 text-xs font-bold font-mono ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Operator Peneliti *</label>
                    <input 
                      type="text" 
                      value={adjustOperator}
                      onChange={(e) => setAdjustOperator(e.target.value)}
                      required
                      placeholder="Nama Operator"
                      className={`w-full border rounded-lg px-3 py-2.5 text-xs font-bold ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Keterangan / Alasan Aliran *</label>
                  <input 
                    type="text" 
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    required
                    placeholder="cth: Pengiriman barang pesanan pelanggan #2938"
                    className={`w-full border rounded-lg px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-850'
                    }`}
                  />
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setIsAdjustModalOpen(false)}
                  className={`px-5 py-2.5 border rounded-lg font-extrabold uppercase text-[10px] tracking-widest cursor-pointer ${
                    isDark 
                      ? 'border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-300' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-150/35"
                >
                  Buat Log Alur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global input suggestions datalists for all catalog inputs (5+ rows history tracking) */}
      <datalist id="skuHistoryList">
        {skuHistory.map((val, i) => (
          <option key={i} value={val} />
        ))}
      </datalist>
      <datalist id="categoryHistoryList">
        {categoryHistory.map((val, i) => (
          <option key={i} value={val} />
        ))}
      </datalist>
      <datalist id="nameHistoryList">
        {nameHistory.map((val, i) => (
          <option key={i} value={val} />
        ))}
      </datalist>
      <datalist id="unitHistoryList">
        {unitHistory.map((val, i) => (
          <option key={i} value={val} />
        ))}
      </datalist>
      <datalist id="locationHistoryList">
        {locationHistory.map((val, i) => (
          <option key={i} value={val} />
        ))}
      </datalist>
      <datalist id="notesHistoryList">
        {notesHistory.map((val, i) => (
          <option key={i} value={val} />
        ))}
      </datalist>

    </div>
  );
}
