import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  LogIn,
  User as UserIcon,
} from 'lucide-react';
import { AppAccount } from '../types';
import { AVATAR_COLORS, ROLE_PRESETS } from '../services/accountService';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AppAccount[];
  activeAccount: AppAccount;
  onSelectAccount: (accountId: string) => void;
  onCreateLocalProfile: (name: string, roleTag: string, avatarColor: string) => void;
  onSignInWithGoogle: () => Promise<void>;
  onDeleteAccount: (accountId: string) => void;
  onUpdateAccount: (accountId: string, updates: Partial<AppAccount>) => void;
  isLoggingIn: boolean;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccount,
  onSelectAccount,
  onCreateLocalProfile,
  onSignInWithGoogle,
  onDeleteAccount,
  onUpdateAccount,
  isLoggingIn,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add_profile'>('list');

  // New Profile Form State
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRole, setNewProfileRole] = useState('Keluarga');
  const [newProfileColor, setNewProfileColor] = useState('emerald');

  // Editing Profile State
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (account: AppAccount) => {
    setEditingAccountId(account.id);
    setEditName(account.name);
    setEditRole(account.roleTag || 'Keluarga');
  };

  const handleSaveEdit = (accountId: string) => {
    if (!editName.trim()) return;
    onUpdateAccount(accountId, {
      name: editName.trim(),
      roleTag: editRole,
    });
    setEditingAccountId(null);
  };

  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    onCreateLocalProfile(newProfileName.trim(), newProfileRole, newProfileColor);
    setNewProfileName('');
    setActiveTab('list');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-900/10">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <span>Kelola & Beralih Akun</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {accounts.length} Akun
                </span>
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Setiap akun memiliki catatan ibadah & grafik keimanannya sendiri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-100/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Daftar Akun</span>
          </button>
          <button
            onClick={() => setActiveTab('add_profile')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'add_profile'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Profil Baru</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {/* Account Cards */}
              {accounts.map((account) => {
                const isActive = account.id === activeAccount.id;
                const isEditing = editingAccountId === account.id;
                const colorConfig =
                  AVATAR_COLORS.find((c) => c.id === account.avatarColor) || AVATAR_COLORS[0];

                return (
                  <div
                    key={account.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-stone-50/50 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {account.photoURL ? (
                          <img
                            src={account.photoURL}
                            alt={account.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-2xl object-cover border border-stone-300 shadow-2xs"
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-2xl ${colorConfig.bg} ${colorConfig.text} font-bold text-base flex items-center justify-center shadow-2xs`}
                          >
                            {account.name[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        {isActive && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] border-2 border-white shadow-xs">
                            ✓
                          </span>
                        )}
                      </div>

                      {/* Info / Edit Input */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2.5 py-1 text-xs font-semibold border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              placeholder="Nama akun"
                            />
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-stone-300 rounded-lg"
                            >
                              {ROLE_PRESETS.map((r) => (
                                <option key={r} value={r}>
                                  Peran: {r}
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleSaveEdit(account.id)}
                                className="px-2.5 py-1 bg-emerald-700 text-white text-[11px] font-bold rounded-md"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setEditingAccountId(null)}
                                className="px-2 py-1 bg-stone-200 text-stone-700 text-[11px] rounded-md"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-stone-900 truncate">
                                {account.name}
                              </h4>
                              {account.roleTag && (
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-stone-200/80 text-stone-700 border border-stone-300/60">
                                  {account.roleTag}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                              {account.type === 'google' ? (
                                <span className="flex items-center gap-1 text-emerald-800 font-medium">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>{account.email || 'Akun Google'}</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-stone-500">
                                  <UserIcon className="w-3 h-3 text-stone-400" />
                                  <span>Profil Lokal</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive ? (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="hidden sm:inline">Aktif</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                onSelectAccount(account.id);
                                onClose();
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors shadow-2xs active:scale-95"
                            >
                              Ganti
                            </button>
                          )}

                          {account.type === 'local_profile' && (
                            <button
                              onClick={() => handleStartEdit(account)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
                              title="Edit Profil"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {accounts.length > 1 && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Hapus profil ${account.name}? Catatan ibadah profil ini akan dihapus.`
                                  )
                                ) {
                                  onDeleteAccount(account.id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Quick Add Google Account Option */}
              <div className="pt-2">
                <button
                  onClick={async () => {
                    await onSignInWithGoogle();
                    onClose();
                  }}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 text-xs sm:text-sm font-bold transition-all shadow-2xs disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>
                    {isLoggingIn ? 'Menghubungkan...' : 'Masuk / Tambah Akun Google Lain'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Add Profile Form */
            <form onSubmit={handleCreateProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Nama Profil / Anggota
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ayah, Ibu, Aisyah, Kakak..."
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Peran / Label Keluarga
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PRESETS.map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setNewProfileRole(role)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        newProfileRole === role
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Warna Avatar
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((col) => (
                    <button
                      type="button"
                      key={col.id}
                      onClick={() => setNewProfileColor(col.id)}
                      className={`w-8 h-8 rounded-full ${col.bg} border-2 flex items-center justify-center text-white transition-transform ${
                        newProfileColor === col.id
                          ? 'scale-110 ring-2 ring-emerald-500 ring-offset-2'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      title={col.name}
                    >
                      {newProfileColor === col.id && '✓'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Catatan Ibadah Mandiri</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Profil baru ini akan memiliki grafik keimanan, checklist sholat, dan histori sendiri
                  tanpa mempengaruhi catatan akun lainnya.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
                >
                  Buat & Beralih ke Profil Ini
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
