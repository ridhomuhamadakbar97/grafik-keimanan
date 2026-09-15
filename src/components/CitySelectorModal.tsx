import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, X, Check, Globe2, Building2, Loader2, Sparkles } from 'lucide-react';
import { KemenagCityItem } from '../types';
import { DEFAULT_KEMENAG_CITIES, KemenagPrayerService } from '../services/kemenagService';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: KemenagCityItem;
  onSelectCity: (city: KemenagCityItem) => void;
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<KemenagCityItem[]>(DEFAULT_KEMENAG_CITIES);
  const [isSearching, setIsSearching] = useState(false);
  const [activeRegionFilter, setActiveRegionFilter] = useState<'all' | 'wib' | 'wita' | 'wit'>('all');

  // Search debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(DEFAULT_KEMENAG_CITIES);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await KemenagPrayerService.searchCities(searchTerm);
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching cities:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredResults = useMemo(() => {
    if (activeRegionFilter === 'all') return searchResults;
    const targetOffset = activeRegionFilter === 'wib' ? 7 : activeRegionFilter === 'wita' ? 8 : 9;
    return searchResults.filter((c) => c.timezoneOffset === targetOffset);
  }, [searchResults, activeRegionFilter]);

  if (!isOpen) return null;

  const getTimezoneBadge = (offset: number) => {
    if (offset === 7) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">WIB</span>;
    if (offset === 8) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">WITA</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">WIT</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>Pilih Kota / Kabupaten</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-full">
                    Kemenag RI
                  </span>
                </h3>
                <p className="text-xs text-stone-500">
                  Database resmi Direktorat Jenderal Bimas Islam Republik Indonesia
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik nama kota / kabupaten (contoh: Jakarta, Sleman, Makassar...)"
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs sm:text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all shadow-2xs"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Timezone Filter Tabs */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveRegionFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeRegionFilter === 'all'
                  ? 'bg-stone-800 text-white shadow-2xs'
                  : 'bg-white text-stone-600 hover:bg-stone-200/60 border border-stone-200'
              }`}
            >
              Semua Zona
            </button>
            <button
              onClick={() => setActiveRegionFilter('wib')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeRegionFilter === 'wib'
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'bg-white text-sky-800 hover:bg-sky-50 border border-sky-200'
              }`}
            >
              WIB (UTC+7)
            </button>
            <button
              onClick={() => setActiveRegionFilter('wita')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeRegionFilter === 'wita'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              WITA (UTC+8)
            </button>
            <button
              onClick={() => setActiveRegionFilter('wit')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeRegionFilter === 'wit'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              WIT (UTC+9)
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-1 divide-y divide-stone-100">
          {isSearching ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-stone-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
              <p className="text-xs font-medium">Mencari di database Kementerian Agama RI...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-medium text-stone-600">Kota atau kabupaten tidak ditemukan.</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Coba ketik kata kunci lain seperti "Bandung", "Surabaya", atau nama kabupaten.
              </p>
            </div>
          ) : (
            filteredResults.map((city) => {
              const isSelected = selectedCity.id === city.id || selectedCity.name === city.name;
              return (
                <button
                  key={city.id || city.name}
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl text-left flex items-center justify-between gap-3 transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                      : 'hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold truncate flex items-center gap-2">
                        <span>{city.name}</span>
                        {getTimezoneBadge(city.timezoneOffset)}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span>ID Kemenag: {city.id}</span>
                        {city.daerah && (
                          <>
                            <span>•</span>
                            <span className="truncate">{city.daerah}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="p-1 rounded-full bg-emerald-600 text-white shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Jadwal sinkron langsung dengan bimasislam.kemenag.go.id
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
