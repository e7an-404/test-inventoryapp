import React, { useState } from 'react';
import { User } from '../types';
import { UserPlus, Shield, Users, BadgeCheck, Edit2, X } from 'lucide-react';

interface UserRegistryProps {
  currentUser: User;
  users: User[];
  onRegisterUser: (userId: string, username: string, name: string, role: 'admin' | 'operator', passwordPlain: string) => string | null;
  onUpdateUser: (userId: string, updatedFields: Partial<User>, newPasswordPlain?: string) => string | null;
  theme?: 'light' | 'dark';
}

export default function UserRegistry({ currentUser, users, onRegisterUser, onUpdateUser, theme = 'light' }: UserRegistryProps) {
  const [customUserId, setCustomUserId] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'operator'>('operator');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (!customUserId) {
      const rand = Math.floor(100 + Math.random() * 900);
      setCustomUserId(`usr_opt_${rand}`);
    }
  }, [users]);

  // Edit sub-states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'operator'>('operator');
  const [editPassword, setEditPassword] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Simple validation
    if (!customUserId.trim() || !username.trim() || !name.trim() || !password.trim()) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    if (customUserId.length < 3) {
      setErrorMsg('User ID (Primary Key) minimal harus 3 karakter.');
      return;
    }

    if (username.length < 3) {
      setErrorMsg('Username minimal harus 3 karakter.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('Password minimal harus 4 karakter.');
      return;
    }

    const cleanId = customUserId.trim().toLowerCase().replace(/\s+/g, '');
    const formattedUsername = username.trim().toLowerCase().replace(/\s+/g, '');

    const error = onRegisterUser(cleanId, formattedUsername, name.trim(), role, password.trim());
    
    if (error) {
      setErrorMsg(error === 'Username is already taken by another account.' ? 'Username sudah digunakan oleh akun lain.' : error);
    } else {
      setSuccessMsg(`Berhasil mendaftarkan pengguna baru: "${name}" (${role.toUpperCase()})`);
      // Reset inputs & auto-suggest next User ID
      setUsername('');
      setName('');
      setPassword('');
      setRole('operator');
      const rand = Math.floor(100 + Math.random() * 900);
      setCustomUserId(`usr_opt_${rand}`);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditUserId(user.id);
    setEditUsername(user.username);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword('');
    setEditErrorMsg(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMsg(null);

    if (!editUsername.trim() || !editName.trim()) {
      setEditErrorMsg('Nama dan Username wajib diisi.');
      return;
    }

    if (editUsername.length < 3) {
      setEditErrorMsg('Username minimal harus 3 karakter.');
      return;
    }

    if (editPassword.trim() && editPassword.trim().length < 4) {
      setEditErrorMsg('Password baru minimal harus 4 karakter.');
      return;
    }

    const formattedUsername = editUsername.trim().toLowerCase().replace(/\s+/g, '');

    const error = onUpdateUser(
      editUserId,
      {
        name: editName.trim(),
        username: formattedUsername,
        role: editRole
      },
      editPassword.trim() ? editPassword.trim() : undefined
    );

    if (error) {
      setEditErrorMsg(error === 'Username is already taken by another account.' ? 'Username sudah digunakan oleh akun lain.' : error);
    } else {
      setIsEditModalOpen(false);
      setSuccessMsg(`Berhasil memperbarui parameter untuk pengguna: "${editName.trim()}"`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const isDark = theme === 'dark';

  if (currentUser.role !== 'admin') {
    return (
      <div className={`border rounded-2xl p-6 text-center space-y-3 ${
        isDark ? 'bg-rose-950/20 border-rose-905/30 text-rose-300' : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <Shield className="mx-auto text-red-500" size={40} />
        <h3 className="font-extrabold text-xs uppercase tracking-widest">Akses Dibatasi</h3>
        <p className="text-sm font-medium">Hanya pengguna dengan peran Administrator yang diizinkan untuk mengakses modul Daftar Pengguna.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="user-registry-panel">
      
      {/* List of Current Accounts */}
      <div className={`lg:col-span-7 rounded-2xl border p-6 space-y-6 shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h3 className={`text-lg font-black tracking-tight flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <Users size={18} className="text-slate-550" /> Akun Sistem Aktif
          </h3>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">Direktori personil berwenang</p>
        </div>

        <div className={`border rounded-xl overflow-x-auto ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className={`border-b text-slate-400 font-black text-[10px] uppercase tracking-widest ${
                isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'
              }`}>
                <th className="py-3.5 px-4 font-mono text-[9px] text-indigo-500">User ID (PK)</th>
                <th className="py-3.5 px-4">Nama Operator</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4 text-center">Tingkat Akses</th>
                <th className="py-3.5 px-4 text-right">Dibuat Pada</th>
                <th className="py-3.5 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {users.map(u => {
                const isAdmin = u.role === 'admin';
                return (
                  <tr key={u.id} className={`transition ${isDark ? 'hover:bg-slate-850/50' : 'hover:bg-slate-50/30'}`}>
                    <td className="py-3.5 px-4 font-mono font-black text-[10px] text-indigo-550 text-indigo-550 bg-indigo-50/10 rounded">
                      {u.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${
                        isAdmin ? 'bg-indigo-100 text-indigo-705' : 'bg-slate-100 text-slate-705'
                      }`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{u.name}</div>
                        {u.id === currentUser.id && (
                          <span className="text-[8px] font-black tracking-widest text-indigo-600 bg-indigo-50 px-1.5 py-0.5 border border-indigo-100 rounded uppercase">Anda</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 lowercase">
                      @{u.username}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black bg-indigo-50 border border-indigo-200 text-indigo-700 uppercase tracking-wider">
                          <Shield size={10} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black bg-slate-50 border border-slate-200 text-slate-600 uppercase tracking-wider">
                          Operator
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                      {new Date(u.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(u)}
                        title="Ubah Kredensial Pengguna"
                        className={`h-8 px-2.5 rounded-lg inline-flex items-center justify-center border transition duration-150 active:scale-95 cursor-pointer text-[10px] uppercase tracking-widest font-black gap-1 ${
                          isDark 
                            ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700' 
                            : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200 hover:border-indigo-100'
                        }`}
                      >
                        <Edit2 size={11} /> Ubah
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New User Form */}
      <div className={`lg:col-span-5 rounded-2xl border p-6 flex flex-col justify-between shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className={`text-lg font-black tracking-tight flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <UserPlus size={18} className="text-indigo-500" /> Daftar Pengguna Baru
            </h3>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">Buat kredensial login akses sistem</p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">User ID (Primary Key) *</label>
                {customUserId.trim() && (
                  users.some(u => u.id.toLowerCase() === customUserId.trim().toLowerCase().replace(/\s+/g, '')) ? (
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-tight animate-pulse">× Terpakai</span>
                  ) : (
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tight animate-fade-in">✓ Tersedia</span>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={customUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                  placeholder="cth: usr_budi"
                  required
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono lowercase ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const rand = Math.floor(100 + Math.random() * 900);
                    setCustomUserId(`usr_opt_${rand}`);
                  }}
                  className={`px-3 border rounded-lg hover:bg-slate-50 active:scale-95 text-[10px] font-black uppercase tracking-wider transition shrink-0 cursor-pointer ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-350 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Acak ID Pengguna baru"
                >
                  Acak
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Nama Lengkap Operator *</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: Budi Santoso"
                required
                className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Username Unik *</label>
                {username.trim() && (
                  users.some(u => u.username.toLowerCase() === username.trim().toLowerCase().replace(/\s+/g, '')) ? (
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-tight animate-pulse">× Terpakai</span>
                  ) : (
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tight animate-fade-in">✓ Tersedia</span>
                  )
                )}
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cth: budisantoso (huruf kecil, tanpa spasi)"
                required
                className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono lowercase ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Password Sistem *</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Peran Hak Akses Otorisasi *</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'operator')}
                className={`w-full border rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-850'
                }`}
              >
                <option value="operator">Operator (Penyesuaian Stok & Transaksi)</option>
                <option value="admin">Administrator (Akses Sistem Penuh & Daftar Akun)</option>
              </select>
            </div>
          </div>

          {errorMsg !== null && (
            <div className={`border rounded-lg p-3 text-xs font-bold font-mono ${
              isDark ? 'bg-rose-950/30 border-rose-900/45 text-rose-300' : 'bg-rose-50 border-rose-150 text-rose-700'
            }`}>
              ⚠ {errorMsg}
            </div>
          )}

          {successMsg !== null && (
            <div className={`border rounded-lg p-3 text-xs font-bold flex items-center gap-1.5 font-mono ${
              isDark ? 'bg-emerald-950/30 border-emerald-900/45 text-emerald-300' : 'bg-emerald-50 border-emerald-150 text-emerald-800'
            }`}>
              <BadgeCheck size={16} className="text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-705 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest py-3.5 rounded-lg transition cursor-pointer shadow-md shadow-indigo-150/35"
            >
              Daftarkan & Rilis Akun
            </button>
          </div>
        </form>
      </div>

      {/* Edit User Modal Overlay */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl border shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`px-6 py-4 flex justify-between items-center text-white ${
              isDark ? 'bg-slate-950' : 'bg-slate-900'
            }`}>
              <h3 className="font-extrabold text-xs tracking-widest uppercase font-display">Ubah Parameter Pengguna</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 font-sans">
              {editErrorMsg && (
                <div className={`border rounded-lg p-3 text-xs font-bold font-mono ${
                  isDark ? 'bg-rose-950/30 border-rose-900 text-rose-300' : 'bg-rose-50 border-rose-150 text-rose-700'
                }`}>
                  ⚠ {editErrorMsg}
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Nama Lengkap Operator *</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    placeholder="cth: Budi Santoso"
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Username Unik *</label>
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    placeholder="cth: budisantoso"
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono lowercase ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Password Baru (kosongkan jika tidak diubah)</label>
                  <input 
                    type="password" 
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Hak Otentikasi Peran *</label>
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'admin' | 'operator')}
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'
                    }`}
                  >
                    <option value="operator">Operator (Penyesuaian Stok & Transaksi)</option>
                    <option value="admin">Administrator (Akses Sistem Penuh & Daftar Akun)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className={`px-5 py-2.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition cursor-pointer ${
                    isDark 
                      ? 'border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-300' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-lg transition cursor-pointer shadow-md shadow-indigo-100"
                >
                  Simpan Parameter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
