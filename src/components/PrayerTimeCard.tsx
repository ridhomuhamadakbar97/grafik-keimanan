import React from 'react';
import { Calendar, Bell, Building2, CheckCircle, RefreshCw, Compass } from 'lucide-react';
import { PrayerTimeItem } from '../types';
import { LocationConfig } from '../utils/prayerTimes';

interface PrayerTimeCardProps {
  prayers: PrayerTimeItem[];
  nextPrayer: {
    prayer: PrayerTimeItem;
    minutes: number;
    seconds: number;
  } | null;
  selectedCity: LocationConfig;
  onSyncToCalendar: () => void;
  isCalendarConnected: boolean;
  onOpenCitySelector: () => void;
  sourceName?: string;
  isLiveApi?: boolean;
}

export const PrayerTimeCard: React.FC<PrayerTimeCardProps> = ({
  prayers,
  nextPrayer,
  selectedCity,
  onSyncToCalendar,
  isCalendarConnected,
  onOpenCitySelector,
  sourceName = 'Database Resmi Bimas Islam Kemenag RI',
  isLiveApi = true,
}) => {
  return (
    <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-stone-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/20 relative overflow-hidden border border-emerald-800/40">
      {/* Subtle Islamic geometric pattern background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="islamic-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 20 10 L 10 20 L 0 10 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#islamic-grid)" />
        </svg>
      </div>

      {/* Official Kemenag Badge Strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-emerald-800/40 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-semibold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Kementerian Agama Republik Indonesia</span>
          </div>
          <span className="hidden sm:inline-block text-emerald-300/70 text-[11px]">
            {sourceName}
          </span>
        </div>

        <button
          onClick={onOpenCitySelector}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-xl text-emerald-100 text-xs font-semibold transition-all border border-white/10 group"
          title="Pilih atau cari kota di database Kemenag"
        >
          <Building2 className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
          <span>{selectedCity.name}</span>
          <span className="text-emerald-300/70 text-[10px] ml-0.5">Ubah</span>
        </button>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Next Prayer Countdown */}
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Waktu Sholat Berjalan • {selectedCity.name} {selectedCity.daerah ? `(${selectedCity.daerah})` : ''}</span>
          </div>

          {nextPrayer ? (
            <div className="mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
                <span>Menuju {nextPrayer.prayer.name}</span>
                <span className="font-arabic text-xl sm:text-2xl text-emerald-200">
                  {nextPrayer.prayer.arabicName}
                </span>
              </h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-mono font-black text-amber-300 tracking-tight">
                  {String(Math.floor(nextPrayer.minutes / 60)).padStart(2, '0')}:
                  {String(nextPrayer.minutes % 60).padStart(2, '0')}:
                  {String(nextPrayer.seconds).padStart(2, '0')}
                </span>
                <span className="text-xs text-emerald-200 font-medium">tersisa menuju waktu adzan</span>
              </div>
            </div>
          ) : (
            <h2 className="text-2xl font-bold text-white mt-2">Jadwal Sholat Hari Ini</h2>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <a
            href="#qibla-compass-section"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-emerald-100 rounded-2xl text-xs sm:text-sm font-semibold transition-all border border-white/15 shadow-2xs group"
          >
            <Compass className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform" />
            <span>Arah Kiblat</span>
          </a>

          <a
            href="#nearby-mosques-section"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-emerald-100 rounded-2xl text-xs sm:text-sm font-semibold transition-all border border-white/15 shadow-2xs group"
          >
            <Building2 className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            <span>Masjid Terdekat</span>
          </a>

          <button
            onClick={onSyncToCalendar}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-md group"
          >
            <Calendar className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span>
              {isCalendarConnected ? 'Sinkron ke Google Calendar' : 'Hubungkan Google Calendar'}
            </span>
          </button>
        </div>
      </div>

      {/* Prayer Times Grid - Official 8 points: Imsak, Subuh, Terbit, Dhuha, Dzuhur, Ashar, Maghrib, Isya */}
      <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5">
        {prayers.map((prayer) => {
          const isNext = nextPrayer?.prayer.id === prayer.id;
          return (
            <div
              key={prayer.id}
              className={`rounded-2xl p-3 sm:p-3.5 text-center transition-all ${
                isNext
                  ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 shadow-xl scale-102 font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-emerald-50 border border-white/10'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className={`text-[11px] font-semibold ${isNext ? 'text-stone-900 font-bold' : 'text-emerald-300'}`}>
                  {prayer.name}
                </span>
                {isNext && <Bell className="w-3 h-3 text-stone-950 animate-bounce" />}
              </div>
              <div
                className={`mt-1 font-mono text-base sm:text-lg ${
                  isNext ? 'font-black text-stone-950' : 'font-extrabold text-white'
                }`}
              >
                {prayer.time}
              </div>
              <div
                className={`text-[10px] font-arabic mt-0.5 ${
                  isNext ? 'text-stone-900 font-bold' : 'text-emerald-300/70'
                }`}
              >
                {prayer.arabicName}
              </div>
              <div className="mt-1">
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-md uppercase font-bold tracking-tighter ${
                    isNext
                      ? 'bg-stone-950 text-amber-300'
                      : prayer.isFardhu
                      ? 'bg-emerald-800/80 text-emerald-200'
                      : 'bg-white/10 text-stone-300'
                  }`}
                >
                  {prayer.isFardhu ? 'Fardhu' : 'Sunnah/Waktu'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

