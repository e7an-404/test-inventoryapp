import React, { useState } from 'react';
import { Lock, User as UserIcon, ShieldAlert, ArrowRight, Sun, Moon } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, passwordPlain: string) => string | null;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export default function LoginPage({ onLogin, theme = 'light', onToggleTheme }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Silakan isi seluruh kolom kredensial keamanan.');
      return;
    }

    const cleanedUsername = username.trim().toLowerCase();
    const errorResult = onLogin(cleanedUsername, password.trim());
    if (errorResult) {
      // Translate typical error messages
      if (errorResult.includes('username') || errorResult.includes('found')) {
        setError('Username tidak ditemukan dalam sistem.');
      } else if (errorResult.includes('Password') || errorResult.includes('password')) {
        setError('Password sistem yang Anda masukkan salah.');
      } else {
        setError(errorResult);
      }
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-4 antialiased font-sans transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      
      {/* Floating Theme Toggle Switch in LoginPage */}
      <div className="absolute top-4 right-4 animate-fade-in">
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-850' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}
      </div>

      {/* Centered Login Portal Box */}
      <div className={`w-full max-w-md rounded-2xl border p-8 space-y-6 shadow-2xl transition duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Top Header Branding Block */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-indigo-600 flex flex-col items-center justify-center rounded-xl text-white font-black tracking-tighter text-sm shadow-md shadow-indigo-200">
            <span className="text-base leading-none">SAS</span>
            {/*<span className="text-[7.5px] tracking-widest font-mono text-indigo-200 leading-none mt-1">SEJAHTERA</span> */}
          </div>
          <h2 className={`text-xl font-black uppercase tracking-tight font-display ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Sastech Abadi Sejahtera
          </h2>
          <p className="text-[10px] text-indigo-500 font-mono uppercase tracking-widest leading-relaxed">
            Sistem Portal Inventaris Gudang
          </p>
        </div>

        {/* Security Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Form Field: Username */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Username ID Keamanan
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <UserIcon size={14} />
              </span>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cth: admin"
                className={`w-full pl-9 pr-3 py-2.5 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono lowercase ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Form Field: Password */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Kata Sandi Sistem
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock size={14} />
              </span>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3 py-2.5 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error Callout */}
          {error !== null && (
            <div className={`border rounded-lg p-3 text-xs font-bold font-mono flex items-start gap-1.5 ${
              isDark ? 'bg-rose-950/30 border-rose-900/50 text-rose-300' : 'bg-rose-50 border-rose-150 text-rose-700'
            }`}>
              <ShieldAlert size={14} className="shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Trigger Actions */}
          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest py-3.5 rounded-lg transition-all duration-155 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-150/30"
          >
            Autentikasi Kredensial <ArrowRight size={12} />
          </button>

        </form>

      </div>

      {/* Subtle Bottom Credit Line */}
      <span className="text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest text-center">
        © 2026 PT Sastech Abadi Sejahtera — Pengelolaan Inventaris Terpusat
      </span>

    </div>
  );
}
