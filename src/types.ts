export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  minStock: number;
  location: string;
  notes: string;
  lastUpdated: string;
  imageUrl?: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'SET';
  quantity: number;
  timestamp: string;
  operator: string;
  notes: string;
  ignored?: boolean;
}

export interface SyncConfig {
  webAppUrl: string;
  authToken: string;
  sheetName: string;
  autoSync: boolean;
}

export interface SyncStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastSynced?: string;
  errorMessage?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'operator';
  name: string;
  createdAt: string;
}

export function formatRupiah(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}
