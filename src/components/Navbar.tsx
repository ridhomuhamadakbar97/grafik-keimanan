import React from 'react';
import { User } from 'firebase/auth';
import { Calendar, Clock, MapPin, LogOut, Sparkles, Users, ChevronDown, ShieldCheck } from 'lucide-react';
import { LocationConfig, formatIndonesianDate, getApproxHijriDate } from '../utils/prayerTimes';
import { AppAccount } from '../types';
import { AVATAR_COLORS } from '../services/accountService';

interface NavbarProps {
  currentTime: Date;
  selectedCity: LocationConfig;
  onSelectCity: (city: LocationConfig) => void;
  onOpenCitySelector: () => void;
  user: User | null;
  activeAccount: AppAccount;
  accountsCount: number;
  onOpenAccountSwitcher: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenCalendarModal: () => void;
  isLoggingIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTime,
  selectedCity,
  onSelectCity,
  onOpenCitySelector,
  user,
  activeAccount,
  accountsCount,
  onOpenAccountSwitcher,
  onSignIn,
  onSignOut,
  onOpenCalendarModal,
  isLoggingIn,
}) => {
  const timeString = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const colorConfig =
    AVATAR_COLORS.find((c) => c.id === activeAccount.avatarColor) || AVATAR_COLORS[0];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center shadow-md shadow-emerald-900/10">
              <span className="font-arabic text-2xl select-none">☪</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-stone-900 tracking-tight">
                  Grafik Keimanan
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Harian
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Pencatat Ibadah & Evaluasi Diri
              </p>
            </div>
          </div>

          {/* Real-time Clock & Hijri Date */}
          <div className="hidden md:flex items-center gap-4 bg-stone-100/80 px-4 py-2 rounded-2xl border border-stone-200/80">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span className="font-mono text-base font-bold text-stone-800 tabular-nums">
                {timeString}
              </span>
            </div>
            <div className="h-4 w-px bg-stone-300" />
            <div className="text-left">
              <div className="text-xs font-semibold text-stone-700">
                {formatIndonesianDate(currentTime)}
              </div>
              <div className="text-[11px] font-medium text-emerald-800">
                {getApproxHijriDate(currentTime)}
              </div>
            </div>
          </div>

          {/* Location & Google Workspace Auth Actions */}
          <div className="flex items-center gap-3">
            {/* City Selector Button (Kemenag Database) */}
            <button
              onClick={onOpenCitySelector}
              className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200/80 active:bg-stone-300/60 border border-stone-200 rounded-xl transition-all shadow-2xs group"
              title="Pilih Kota dari Database Kemenag RI"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
              <span className="max-w-[110px] sm:max-w-[150px] truncate">{selectedCity.name}</span>
              <span className="hidden sm:inline text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                Kemenag
              </span>
            </button>

            {/* Google Calendar status button if user logged in */}
            {user && (
              <button
                onClick={onOpenCalendarModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
                title="Kelola Google Calendar"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Google Calendar</span>
              </button>
            )}

            {/* Multi-Account Switcher Trigger Button */}
            <button
              onClick={onOpenAccountSwitcher}
              className="flex items-center gap-2 pl-2 pr-2.5 sm:pr-3 py-1.5 rounded-2xl bg-white hover:bg-stone-50 active:bg-stone-100 border border-stone-200/90 shadow-2xs transition-all group"
              title="Ganti Akun atau Kelola Profil"
            >
              {/* Avatar */}
              {activeAccount.photoURL ? (
                <img
                  src={activeAccount.photoURL}
                  alt={activeAccount.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-xl object-cover border border-stone-300 shadow-2xs"
                />
              ) : (
                <div
                  className={`w-7 h-7 rounded-xl ${colorConfig.bg} ${colorConfig.text} text-xs font-bold flex items-center justify-center shadow-2xs`}
                >
                  {activeAccount.name[0]?.toUpperCase() || 'U'}
                </div>
              )}

              {/* Account Name & Role */}
              <div className="text-left leading-tight hidden sm:block max-w-[120px]">
                <div className="text-xs font-bold text-stone-900 truncate">
                  {activeAccount.name}
                </div>
                <div className="text-[10px] text-stone-500 font-medium flex items-center gap-1">
                  <span>{activeAccount.roleTag || (activeAccount.type === 'google' ? 'Google' : 'Profil')}</span>
                  {accountsCount > 1 && (
                    <span className="text-emerald-700 font-bold">({accountsCount})</span>
                  )}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
            </button>
          </div>
        </div>

        {/* Mobile Real-time ticker */}
        <div className="md:hidden py-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-mono font-bold text-stone-800">{timeString}</span>
          </div>
          <div className="text-[11px] font-medium text-stone-500">
            {formatIndonesianDate(currentTime)} • {getApproxHijriDate(currentTime)}
          </div>
        </div>
      </div>
    </header>
  );
};
