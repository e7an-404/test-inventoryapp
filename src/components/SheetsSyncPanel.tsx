import React, { useState } from 'react';
import { SyncConfig, SyncStatus } from '../types';
import { GAS_CODE_GS, GAS_INDEX_HTML } from '../utils/gasTemplates';
import { 
  Database, 
  Settings, 
  Copy, 
  Check, 
  ArrowDown, 
  ArrowUp, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  Info, 
  Code, 
  FileText,
  Clock
} from 'lucide-react';

interface SheetsSyncPanelProps {
  config: SyncConfig;
  status: SyncStatus;
  onChangeConfig: (newConfig: SyncConfig) => void;
  onTestConnection: () => void;
  onPullData: () => Promise<void>;
  onPushData: () => Promise<void>;
  itemsCount: number;
  transactionsCount: number;
  theme?: 'light' | 'dark';
}

export default function SheetsSyncPanel({
  config,
  status,
  onChangeConfig,
  onTestConnection,
  onPullData,
  onPushData,
  itemsCount,
  transactionsCount,
  theme = 'light'
}: SheetsSyncPanelProps) {

  const [activeCodeTab, setActiveCodeTab] = useState<'gs' | 'html'>('gs');
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [showHelper, setShowHelper] = useState(true);

  const [syncingPull, setSyncingPull] = useState(false);
  const [syncingPush, setSyncingPush] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleCopyGs = () => {
    navigator.clipboard.writeText(GAS_CODE_GS);
    setCopiedGs(true);
    setTimeout(() => setCopiedGs(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(GAS_INDEX_HTML);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2050);
  };

  const executePull = async () => {
    if (!config.webAppUrl) {
      alert('Silakan konfigurasikan URL Web App Google Apps Script Anda terlebih dahulu.');
      return;
    }
    setSyncingPull(true);
    setSyncMessage('Menghubungi Web App Google Apps Script...');
    try {
      await onPullData();
      setSyncMessage('Katalog data inventaris berhasil diunduh dan disinkronkan!');
      setTimeout(() => setSyncMessage(''), 4000);
    } catch (e: any) {
      setSyncMessage(`Galat Tarik: ${e.message || 'Gagal melakukan sinkronisasi data'}`);
    } finally {
      setSyncingPull(false);
    }
  };

  const executePush = async () => {
    if (!config.webAppUrl) {
      alert('Silakan konfigurasikan URL Web App Google Apps Script Anda terlebih dahulu.');
      return;
    }
    const confirmBackup = window.confirm(
      'Apakah Anda yakin ingin MENCADANGKAN (PUSH) seluruh database lokal Anda (termasuk semua data Produk, Transaksi, dan Pengguna) ke Google Sheets?\n\nTindakan ini akan MENIMPA data di spreadsheet Anda.'
    );
    if (!confirmBackup) return;

    setSyncingPush(true);
    setSyncMessage('Mencadangkan database lokal ke Google Sheets...');
    try {
      await onPushData();
      setSyncMessage('Seluruh data lokal berhasil diunggah/dicadangkan ke Google Sheets!');
      setTimeout(() => setSyncMessage(''), 4000);
    } catch (e: any) {
      setSyncMessage(`Galat Unggah (Push): ${e.message || 'Gagal mengunggah data'}`);
    } finally {
      setSyncingPush(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* UPDATE APPS SCRIPT NOTE / NOTICE */}
      {/*<div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center gap-4 animate-fade-in ${
        isDark 
          ? 'bg-indigo-950/25 border-indigo-900/50 text-indigo-300' 
          : 'bg-indigo-50 border-indigo-100 text-indigo-900'
      }`}>
        <div className={`p-2.5 rounded-xl shrink-0 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100/50'}`}>
          <AlertCircle size={22} className="text-indigo-500 stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500">
            Catatan Perubahan Apps Script (Penting!)
          </p>
          <p className="text-xs leading-relaxed opacity-90 font-medium">
            Skrip <b>Apps Script</b> telah kami perbarui untuk mendukung sinkronisasi data <b>Daftarkan Pengguna (User Registry)</b> secara otomatis ke Google Sheets pada tab sheet baru bernama <b>"Users"</b>. Silakan salin isi tab <b>Code.gs</b> di sebelah kanan, lalu terapkan kembali <i>(re-deploy)</i> di penyunting skrip spreadsheet Anda agar pendaftaran petugas operator/admin baru tersimpan aman di cloud.
          </p>
        </div>
      </div>*/}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Controls & Sync Engine (Lg-span 5) */}
      <div className="lg:col-span-5 space-y-5">
        
        {/* Connection Status Indicator */}
        <div className={`rounded-2xl border p-5 shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`text-xs font-black tracking-widest uppercase font-display flex items-center gap-2 mb-3.5 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <Wifi size={16} className="text-indigo-500" /> Koneksi Node Database
          </h3>

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
          } flex items-center justify-between`}>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Status Sinkronisasi</span>
              
              {status.status === 'connected' && (
                <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>TERHUBUNG (ONLINE)</span>
                </div>
              )}
              {status.status === 'connecting' && (
                <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>MENGHUBUNGKAN...</span>
                </div>
              )}
              {status.status === 'disconnected' && (
                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <WifiOff size={14} className="text-slate-500" />
                  <span>PLAYBACK LOKAL (OFFLINE)</span>
                </div>
              )}
              {status.status === 'error' && (
                <div className="flex items-center gap-1.5 text-rose-500 font-black text-xs uppercase tracking-wider">
                  <AlertCircle size={14} />
                  <span>SINKRONISASI GALAT</span>
                </div>
              )}
            </div>

            <button
              onClick={onTestConnection}
              disabled={status.status === 'connecting' || !config.webAppUrl}
              className={`font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-lg transition shadow-xs disabled:opacity-50 cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800' 
                  : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50'
              }`}
            >
              Uji Koneksi
            </button>
          </div>

          {status.errorMessage && (
            <div className={`mt-3 p-3 rounded-xl text-xs space-y-1 font-mono border ${
              isDark ? 'bg-rose-950/20 border-rose-900/50 text-rose-300' : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}>
              <p className="font-bold font-sans">Detail logs kesalahan:</p>
              <p className="text-[11px] leading-relaxed break-all">{status.errorMessage}</p>
            </div>
          )}

          {/* Sync Time Label requested by user */}
          <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between font-mono ${
            status.lastSynced 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
              : isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400'
          }`}>
            <span className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} /> WAKTU SINKRONISASI TERAKHIR:
            </span>
            <span className="text-xs font-black">
              {status.lastSynced 
                ? new Date(status.lastSynced).toLocaleTimeString('id-ID') 
                : 'Belum Sinkron'}
            </span>
          </div>
        </div>

        {/* Configurations Parameters Box */}
        <div className={`rounded-2xl border p-5 shadow-xs space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`text-xs font-black tracking-widest uppercase font-display flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <Settings size={16} className="text-slate-500" /> Input Gerbang Spreadsheet
          </h3>

          <div className="space-y-3.5 text-xs font-sans">
            
            {/* Field: Webapp URL */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                URL Deployment Apps Script (Web App URL) *
              </label>
              <input 
                type="text" 
                value={config.webAppUrl}
                onChange={(e) => onChangeConfig({ ...config, webAppUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className={`w-full border rounded-lg px-3 py-2.5 font-mono text-[11px] focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>

            {/* Field: Passcode Token */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Token Keamanan Kustom (Handshake Token)
              </label>
              <input 
                type="password" 
                value={config.authToken}
                onChange={(e) => onChangeConfig({ ...config, authToken: e.target.value })}
                placeholder="inventory_secret_123"
                className={`w-full border rounded-lg px-3 py-2.5 font-mono text-[11px] focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
              <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">Keamanan tambahan untuk mencegah pengiriman liar. Harus cocok dengan token di Code.gs.</span>
            </div>

            {/* Field: Sync All toggle on change */}
            <div className={`pt-3.5 flex items-center justify-between border-t mt-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="space-y-0.5 max-w-xs">
                <span className={`font-extrabold block text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Sinkronisasi Otomatis Terus-menerus</span>
                <span className="text-[10px] text-slate-400 leading-normal block">Kirim penyesuaian diskrit langsung ke Google Sheets tanpa tunda.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={config.autoSync}
                  onChange={(e) => onChangeConfig({ ...config, autoSync: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

          </div>
        </div>

        {/* Master Commands buttons */}
        <div className={`rounded-2xl border p-5 shadow-xs space-y-3.5 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`text-xs font-black tracking-widest uppercase font-display flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <Database size={16} className="text-slate-500" /> Sinkronisasi Lembar Kerja
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">Menghubungkan, menarik, dan menimpa katalog lokal Anda dengan nilai database global online.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={executePull}
              disabled={syncingPull || syncingPush || !config.webAppUrl}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-[11px] uppercase tracking-widest p-4 rounded-xl transition flex flex-col items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-150/30 font-sans"
              title="Tarik & sinkronkan data dari Google Sheets ke penyimpanan lokal perangkat"
            >
              <ArrowDown size={20} className="text-white animate-bounce" />
              <span>SINKRONISASIKAN (PULL)</span>
            </button>

            <button
              onClick={executePush}
              disabled={syncingPull || syncingPush || !config.webAppUrl}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-[11px] uppercase tracking-widest p-4 rounded-xl transition flex flex-col items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-150/30 font-sans"
              title="Unggah & cadangkan data lokal Anda ke Google Sheets secara penuh"
            >
              <ArrowUp size={20} className="text-white animate-bounce" style={{ animationDelay: '200ms' }} />
              <span>CADANGKAN DATA (PUSH)</span>
            </button>
          </div>

          {syncMessage && (
            <div className={`mt-3 p-3 border rounded-xl text-xs font-bold text-center font-mono ${
              isDark ? 'bg-indigo-950/30 border-indigo-905/30 text-indigo-300' : 'bg-indigo-50 border-indigo-150 text-indigo-900'
            }`}>
              {syncMessage}
            </div>
          )}

          <div className={`text-[10px] p-2 text-center rounded-lg font-mono ${
            isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'
          }`}>
            Total data lokal: <b>{itemsCount} Produk</b> | <b>{transactionsCount} Riwayat Log</b>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Code generators & Walkthrough (Lg-span 7) */}
      <div className="lg:col-span-7 space-y-5">
        
        {/* Step-by-step Setup Manual */}
        <div className={`rounded-2xl border p-5 shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`flex justify-between items-center mb-4 border-b pb-3 ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <h3 className={`text-xs font-black tracking-widest uppercase font-display ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Panduan Integrasi Spreadsheet Google
            </h3>
            <button 
              onClick={() => setShowHelper(!showHelper)}
              className="text-[10.5px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 cursor-pointer"
            >
              {showHelper ? 'Sembunyikan Panduan' : 'Tampilkan Panduan'}
            </button>
          </div>

          {showHelper && (
            <div className="space-y-4 text-xs text-slate-400 leading-relaxed font-sans">
              <div className="relative pl-7">
                <span className="absolute left-0 top-0.5 h-4.5 w-4.5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">1</span>
                <p className={`font-extrabold uppercase text-[10px] tracking-wide ${isDark ? 'text-slate-350' : 'text-slate-900'}`}>Buat Dokumen Spreadsheet & Tab</p>
                <p className="mt-0.5">Buka dokumen Google Sheets baru. Ubah nama tab (sheet name) aktif menjadi tepat <b className="font-mono text-slate-300 font-bold bg-slate-950 border border-slate-850 px-1 py-0.5 rounded">Inventory</b>. Aplikasi akan menulis kolom data secara terstruktur.</p>
              </div>

              <div className="relative pl-7">
                <span className="absolute left-0 top-0.5 h-4.5 w-4.5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">2</span>
                <p className={`font-extrabold uppercase text-[10px] tracking-wide ${isDark ? 'text-slate-355' : 'text-slate-990'}`}>Masuk ke Menu Ekstensi</p>
                <p className="mt-0.5">Pada bagian menu bar atas di spreadsheet Anda, pilih <b className="font-bold text-indigo-500">Ekstensi &gt; Apps Script</b>. Ini akan membuka penyunting naskah skrip visual.</p>
              </div>

              <div className="relative pl-7">
                <span className="absolute left-0 top-0.5 h-4.5 w-4.5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">3</span>
                <p className={`font-extrabold uppercase text-[10px] tracking-wide ${isDark ? 'text-slate-350' : 'text-slate-900'}`}>Sematkan Kode Handshake</p>
                <p className="mt-0.5">Timpa semua isi di naskah bawaan <b className="font-mono text-indigo-400 font-bold">Code.gs</b> dengan isi Panel Kode A di bawah. Klik tombol (+) untuk membuat file HTML baru, beri nama tepat <b className="font-mono text-indigo-400 font-bold">Index.html</b>, lalu tempelkan kode di Panel Kode B.</p>
              </div>

              <div className="relative pl-7 mr-2">
                <span className="absolute left-0 top-0.5 h-4.5 w-4.5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">4</span>
                <p className={`font-extrabold uppercase text-[10px] tracking-wide ${isDark ? 'text-slate-350' : 'text-slate-900'}`}>Deploy sebagai Aplikasi Web (Web App)</p>
                <p className="mt-0.5">Klik tombol biru <b className="font-bold text-sky-500">Terapkan (Deploy) &gt; Penerapan Baru (New Deployment)</b> di bagian kanan atas. Pilih jenis penerapan: <b>Aplikasi Web (Web App)</b>. Setel akses: <b className="text-red-500 font-bold block mt-0.5">Siapa yang memiliki akses &gt; "Siapa Saja (Everyone)"</b>. Klik Terapkan, berikan otoritas izin Google Sheets Anda, lalu salin URL Aplikasi Web yang diberikan ke dalam kotak isian di kiri!</p>
              </div>
            </div>
          )}
        </div>

        {/* Code Blocks Copy Panes */}
        <div className={`rounded-2xl border p-5 shadow-xs space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCodeTab('gs')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1 cursor-pointer ${
                  activeCodeTab === 'gs' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Code size={13} /> Code.gs
              </button>

              <button
                onClick={() => setActiveCodeTab('html')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1 cursor-pointer ${
                  activeCodeTab === 'html' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <FileText size={13} /> Index.html
              </button>
            </div>

            {/* Copy button */}
            {activeCodeTab === 'gs' ? (
              <button
                onClick={handleCopyGs}
                className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1 cursor-pointer"
              >
                {copiedGs ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copiedGs ? 'Tersalin' : 'Salin'}
              </button>
            ) : (
              <button
                onClick={handleCopyHtml}
                className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1 cursor-pointer"
              >
                {copiedHtml ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copiedHtml ? 'Tersalin' : 'Salin'}
              </button>
            )}
          </div>

          {/* Text block viewer */}
          <div className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-[11px] max-h-[380px] overflow-y-auto leading-relaxed border border-slate-850 scrollbar-thin scrollbar-thumb-slate-700">
            {activeCodeTab === 'gs' ? (
              <pre className="whitespace-pre-wrap select-all">{GAS_CODE_GS}</pre>
            ) : (
              <pre className="whitespace-pre-wrap select-all">{GAS_INDEX_HTML}</pre>
            )}
          </div>

          <div className={`p-3 border rounded-xl flex items-start gap-2 text-xs font-sans ${
            isDark ? 'bg-slate-950 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
          }`}>
            <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">Struktur kode kustom cerdas di atas memungkinkan penarikan tangkas langsung oleh database React dan berfungsi ganda sebagai portal inventori lokal responsif di dalam iframe penampil dokumen spreadsheet Anda!</p>
          </div>

        </div>

      </div>
    </div>
  </div>
  );
}
