// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Compass,
  MapPin,
  Navigation,
  Search,
  ExternalLink,
  Star,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { LocationConfig } from '../utils/prayerTimes';
import { MosquePlaceItem } from '../types';
import { calculateDistanceKm, formatDistance } from '../utils/geoUtils';

interface NearbyMosquesCardProps {
  selectedCity: LocationConfig;
}

// Default fallback coordinates if city coordinates are missing (Monas, Jakarta)
const DEFAULT_FALLBACK_COORDS = { lat: -6.175392, lng: 106.827153 };

export const NearbyMosquesCard: React.FC<NearbyMosquesCardProps> = ({ selectedCity }) => {
  // API Key priority: Environment variable -> LocalStorage custom key -> empty
  const envApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('gmaps_user_api_key') || '';
  });
  const effectiveApiKey = customApiKey.trim() || envApiKey.trim();

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState(customApiKey);

  // Active Center Coordinates (GPS or City Center)
  const defaultCityCenter = useMemo(() => {
    return {
      lat: selectedCity.latitude || DEFAULT_FALLBACK_COORDS.lat,
      lng: selectedCity.longitude || DEFAULT_FALLBACK_COORDS.lng,
    };
  }, [selectedCity]);

  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number }>(defaultCityCenter);
  const [locationSource, setLocationSource] = useState<'city' | 'gps'>('city');
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Filter & Search Controls
  const [filterType, setFilterType] = useState<'all' | 'masjid' | 'mushola'>('all');
  const [radiusMeters, setRadiusMeters] = useState<number>(3000); // default 3 km
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Mosque Places state
  const [mosques, setMosques] = useState<MosquePlaceItem[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedMosque, setSelectedMosque] = useState<MosquePlaceItem | null>(null);

  // When selectedCity changes and we are in city mode, update coordinates
  useEffect(() => {
    if (locationSource === 'city') {
      setCurrentCenter(defaultCityCenter);
    }
  }, [defaultCityCenter, locationSource]);

  // Handle GPS location detection
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser Anda tidak mendukung deteksi lokasi (Geolocation).');
      return;
    }

    setIsLocatingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGps(false);
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentCenter(newCoords);
        setLocationSource('gps');
      },
      (error) => {
        setIsLocatingGps(false);
        console.warn('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Izin akses lokasi ditolak. Menggunakan koordinat kota Kemenag.');
        } else {
          setGpsError('Gagal mendeteksi lokasi GPS. Menggunakan koordinat kota Kemenag.');
        }
        setCurrentCenter(defaultCityCenter);
        setLocationSource('city');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleUseCity = () => {
    setLocationSource('city');
    setCurrentCenter(defaultCityCenter);
    setGpsError(null);
  };

  const handleSaveApiKey = () => {
    const trimmed = tempKeyInput.trim();
    setCustomApiKey(trimmed);
    localStorage.setItem('gmaps_user_api_key', trimmed);
    setShowKeyModal(false);
  };

  return (
    <section id="nearby-mosques-section" className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                Masjid & Mushola Terdekat
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Google Maps
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Temukan tempat ibadah sholat berjamaah terdekat dengan database Google Maps Platform
            </p>
          </div>
        </div>

        {/* Action button: GPS & API Key */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Location Mode Buttons */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200">
            <button
              onClick={handleUseCity}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                locationSource === 'city'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Kota: {selectedCity.name}
            </button>
            <button
              onClick={handleUseGps}
              disabled={isLocatingGps}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                locationSource === 'gps'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocatingGps ? 'animate-spin' : ''}`} />
              <span>{isLocatingGps ? 'Mencari...' : 'GPS Saya'}</span>
            </button>
          </div>

          {/* API Key settings button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors shadow-2xs"
            title="Konfigurasi Google Maps API Key"
          >
            <KeyRound className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">
              {effectiveApiKey ? 'API Key Terpasang' : 'Atur API Key'}
            </span>
          </button>
        </div>
      </div>

      {/* GPS Error Notification if any */}
      {gpsError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Keyword Search */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama masjid atau mushola tertentu..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            aria-label="Kategori tempat ibadah"
            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          >
            <option value="all">Semua (Masjid & Mushola)</option>
            <option value="masjid">Hanya Masjid Jami'</option>
            <option value="mushola">Hanya Mushola / Langgar</option>
          </select>
        </div>

        {/* Radius Filter */}
        <div className="sm:col-span-3">
          <select
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(Number(e.target.value))}
            aria-label="Radius jarak pencarian"
            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          >
            <option value={1000}>Radius 1 km</option>
            <option value={3000}>Radius 3 km</option>
            <option value={5000}>Radius 5 km</option>
            <option value={10000}>Radius 10 km</option>
          </select>
        </div>
      </div>

      {/* Main Map & Places Section */}
      {effectiveApiKey ? (
        <APIProvider apiKey={effectiveApiKey} libraries={['places', 'marker', 'maps', 'core', 'geometry']}>
          <MosquesInteractiveMap
            center={currentCenter}
            filterType={filterType}
            radiusMeters={radiusMeters}
            searchKeyword={searchKeyword}
            mosques={mosques}
            setMosques={setMosques}
            isLoading={isLoadingPlaces}
            setIsLoading={setIsLoadingPlaces}
            error={searchError}
            setError={setSearchError}
            selectedMosque={selectedMosque}
            setSelectedMosque={setSelectedMosque}
            locationSource={locationSource}
            selectedCityName={selectedCity.name}
          />
        </APIProvider>
      ) : (
        <NoApiKeyFallback
          center={currentCenter}
          selectedCityName={selectedCity.name}
          onOpenKeyModal={() => setShowKeyModal(true)}
        />
      )}

      {/* Legal & Attribution Footer */}
      <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-2">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-stone-400" />
          <span>Data tempat ibadah disediakan melalui Google Maps Platform</span>
        </div>
        <div className="font-semibold text-stone-500">Google Maps</div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">Google Maps API Key</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Untuk mengaktifkan peta interaktif dan memuat daftar masjid/mushola langsung dari basis data Google Maps, masukkan Google Maps API Key Anda atau gunakan <strong>Maps Demo Key</strong> (bebas biaya tanpa kartu kredit).
            </p>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="font-semibold text-stone-800">Cara mudah mendapatkan Maps Demo Key:</div>
              <ol className="list-decimal list-inside text-stone-600 space-y-1 pl-1">
                <li>Buka formulir resmi demo key Google Maps</li>
                <li>Masuk dengan akun Google (tidak memerlukan billing)</li>
                <li>Salin key dan tempelkan di bawah ini</li>
              </ol>
              <a
                href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold underline pt-1"
              >
                <span>Buka Google Maps Demo Key Quickstart</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                API Key (atau Demo Key)
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs font-mono text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
              >
                Simpan & Muat Ulang
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-component: Interactive Map & Places Loader                             */
/* -------------------------------------------------------------------------- */

interface MosquesInteractiveMapProps {
  center: { lat: number; lng: number };
  filterType: 'all' | 'masjid' | 'mushola';
  radiusMeters: number;
  searchKeyword: string;
  mosques: MosquePlaceItem[];
  setMosques: React.Dispatch<React.SetStateAction<MosquePlaceItem[]>>;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  error: string | null;
  setError: (val: string | null) => void;
  selectedMosque: MosquePlaceItem | null;
  setSelectedMosque: (val: MosquePlaceItem | null) => void;
  locationSource: 'city' | 'gps';
  selectedCityName: string;
}

const MosquesInteractiveMap: React.FC<MosquesInteractiveMapProps> = ({
  center,
  filterType,
  radiusMeters,
  searchKeyword,
  mosques,
  setMosques,
  isLoading,
  setIsLoading,
  error,
  setError,
  selectedMosque,
  setSelectedMosque,
  locationSource,
  selectedCityName,
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  // Search places using Google Maps Places API (New)
  const fetchNearbyMosques = useCallback(async () => {
    if (!placesLib) return;

    setIsLoading(true);
    setError(null);

    try {
      // @ts-ignore Places API (New) Place class
      const PlaceClass = placesLib.Place;

      let rawPlaces: any[] = [];

      // If search keyword is provided or filter is mushola/all, searchByText gives great results for Indonesian vernacular
      if (searchKeyword.trim() || filterType === 'mushola') {
        const query = searchKeyword.trim()
          ? `${searchKeyword.trim()} masjid mushola`
          : 'mushola langgar surau';

        const request = {
          textQuery: query,
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'googleMapsURI',
            'websiteURI',
            'regularOpeningHours',
          ],
          locationBias: {
            center: center,
            radius: radiusMeters,
          },
          maxResultCount: 20,
          language: 'id',
          region: 'id',
        };

        // @ts-ignore
        const response = await PlaceClass.searchByText(request);
        rawPlaces = response?.places || [];
      } else if (filterType === 'masjid') {
        // Use searchNearby with includedPrimaryTypes: ['mosque']
        const request = {
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'googleMapsURI',
            'websiteURI',
            'regularOpeningHours',
          ],
          locationRestriction: {
            center: center,
            radius: radiusMeters,
          },
          includedPrimaryTypes: ['mosque'],
          maxResultCount: 20,
          language: 'id',
          region: 'id',
        };

        // @ts-ignore
        const response = await PlaceClass.searchNearby(request);
        rawPlaces = response?.places || [];
      } else {
        // 'all' without keyword: Try searchByText with 'masjid mushola'
        const request = {
          textQuery: 'masjid mushola',
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'googleMapsURI',
            'websiteURI',
            'regularOpeningHours',
          ],
          locationBias: {
            center: center,
            radius: radiusMeters,
          },
          maxResultCount: 20,
          language: 'id',
          region: 'id',
        };

        // @ts-ignore
        const response = await PlaceClass.searchByText(request);
        rawPlaces = response?.places || [];
      }

      // Transform into MosquePlaceItem
      const items: MosquePlaceItem[] = rawPlaces.map((p) => {
        const pLat = typeof p.location?.lat === 'function' ? p.location.lat() : p.location?.lat;
        const pLng = typeof p.location?.lng === 'function' ? p.location.lng() : p.location?.lng;

        const distance =
          pLat !== undefined && pLng !== undefined
            ? calculateDistanceKm(center.lat, center.lng, pLat, pLng)
            : undefined;

        const name = typeof p.displayName === 'string' ? p.displayName : p.displayName || 'Masjid / Mushola';

        const isMushola = name.toLowerCase().includes('mushola') || name.toLowerCase().includes('surau');

        return {
          id: p.id || `${pLat}_${pLng}`,
          name: name,
          address: p.formattedAddress || 'Alamat tidak tersedia',
          location: { lat: pLat, lng: pLng },
          distanceKm: distance,
          rating: p.rating,
          userRatingCount: p.userRatingCount,
          googleMapsURI: p.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${p.id || ''}`,
          websiteURI: p.websiteURI,
          type: isMushola ? 'mushola' : 'masjid',
        };
      });

      // Sort ascending by distance
      items.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      setMosques(items);

      if (items.length === 0) {
        setError('Tidak ditemukan masjid atau mushola dalam radius yang dipilih. Coba perbesar radius pencarian.');
      }
    } catch (err: any) {
      console.error('Error fetching nearby mosques via Google Maps:', err);
      setError(
        err.message ||
          'Tidak dapat memuat tempat dari Google Maps Platform. Pastikan Places API (New) telah diaktifkan pada proyek Cloud Anda.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [placesLib, center, filterType, radiusMeters, searchKeyword, setMosques, setIsLoading, setError]);

  // Trigger search on parameter changes
  useEffect(() => {
    if (placesLib) {
      fetchNearbyMosques();
    }
  }, [placesLib, fetchNearbyMosques]);

  // Adjust map viewport to cover places
  useEffect(() => {
    if (!map || mosques.length === 0) return;

    try {
      const bounds = new google.maps.LatLngBounds();
      // Include current user/center position
      bounds.extend(center);
      mosques.slice(0, 10).forEach((m) => {
        if (m.location.lat && m.location.lng) {
          bounds.extend(m.location);
        }
      });
      map.fitBounds(bounds, 50);
    } catch (e) {
      // ignore
    }
  }, [map, mosques, center]);

  return (
    <div className="space-y-5">
      {/* Map Display (Height is strictly fixed for CF2 compliance) */}
      <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden border border-stone-200 shadow-inner bg-stone-100">
        <Map
          defaultCenter={center}
          center={center}
          defaultZoom={15}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          {/* User / Search Center Marker */}
          <AdvancedMarker position={center} title={locationSource === 'gps' ? 'Posisi Anda (GPS)' : `Pusat Kota (${selectedCityName})`}>
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
              <div className="relative w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs">
                <Navigation className="w-3.5 h-3.5" />
              </div>
            </div>
          </AdvancedMarker>

          {/* Mosque Markers */}
          {mosques.map((m) => (
            <AdvancedMarker
              key={m.id}
              position={m.location}
              title={m.name}
              onClick={() => setSelectedMosque(m)}
            >
              <div
                className={`relative cursor-pointer transition-transform hover:scale-110 ${
                  selectedMosque?.id === m.id ? 'scale-125 z-30' : 'z-10'
                }`}
              >
                <div className="w-8 h-8 rounded-2xl bg-emerald-700 text-white border-2 border-white shadow-md flex items-center justify-center">
                  <span className="font-arabic text-sm select-none">🕌</span>
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {/* Info Window */}
          {selectedMosque && (
            <InfoWindow
              position={selectedMosque.location}
              onCloseClick={() => setSelectedMosque(null)}
            >
              <div className="p-1 max-w-xs space-y-1.5 text-stone-800">
                <div className="font-bold text-sm text-stone-900 leading-snug">
                  {selectedMosque.name}
                </div>
                {selectedMosque.distanceKm !== undefined && (
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <span>Jarak: {formatDistance(selectedMosque.distanceKm)}</span>
                  </div>
                )}
                {selectedMosque.rating && (
                  <div className="flex items-center gap-1 text-xs text-amber-700 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{selectedMosque.rating}</span>
                    {selectedMosque.userRatingCount && (
                      <span className="text-stone-500 font-normal">
                        ({selectedMosque.userRatingCount} ulasan)
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs text-stone-600 line-clamp-2">
                  {selectedMosque.address}
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMosque.location.lat},${selectedMosque.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Rute</span>
                  </a>
                  {selectedMosque.googleMapsURI && (
                    <a
                      href={selectedMosque.googleMapsURI}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Google Maps</span>
                    </a>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border border-stone-200 text-xs font-semibold text-stone-700">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Memuat masjid dari Google Maps...</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchNearbyMosques}
            className="px-2.5 py-1 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg font-semibold text-xs text-rose-700 transition-colors shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Mosque List Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-600 px-1">
          <span>Daftar Tempat Ibadah ({mosques.length} ditemukan)</span>
          <a
            href={`https://www.google.com/maps/search/masjid+mushola+terdekat/@${center.lat},${center.lng},15z`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
          >
            <span>Buka Seluruh Hasil di Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {mosques.length === 0 && !isLoading && !error && (
          <div className="py-8 text-center bg-stone-50 rounded-2xl border border-stone-200/80 text-stone-500 text-xs space-y-2">
            <Building2 className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="font-semibold text-stone-700">Belum ada tempat ibadah ditemukan</p>
            <p>Cobalah memperbesar radius pencarian atau gunakan kata kunci lain.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mosques.map((mosque) => {
            const isSelected = selectedMosque?.id === mosque.id;
            return (
              <div
                key={mosque.id}
                onClick={() => setSelectedMosque(mosque)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-emerald-200 hover:bg-stone-50/60 shadow-2xs'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-stone-900 line-clamp-1">
                      {mosque.name}
                    </h4>
                    {mosque.distanceKm !== undefined && (
                      <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {formatDistance(mosque.distanceKm)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {mosque.address}
                  </p>

                  {mosque.rating && (
                    <div className="flex items-center gap-1 text-xs text-amber-700 font-semibold pt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{mosque.rating}</span>
                      {mosque.userRatingCount && (
                        <span className="text-stone-400 font-normal">
                          ({mosque.userRatingCount})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${mosque.location.lat},${mosque.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Petunjuk Arah</span>
                  </a>
                  {mosque.googleMapsURI && (
                    <a
                      href={mosque.googleMapsURI}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                      title="Lihat di Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-component: Fallback when API Key is not yet configured                  */
/* -------------------------------------------------------------------------- */

interface NoApiKeyFallbackProps {
  center: { lat: number; lng: number };
  selectedCityName: string;
  onOpenKeyModal: () => void;
}

const NoApiKeyFallback: React.FC<NoApiKeyFallbackProps> = ({
  center,
  selectedCityName,
  onOpenKeyModal,
}) => {
  const directMapsSearchUrl = `https://www.google.com/maps/search/masjid+mushola+terdekat/@${center.lat},${center.lng},15z`;

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-stone-50 to-emerald-50/40 border border-stone-200/90 text-center space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center text-emerald-700">
        <MapPin className="w-7 h-7" />
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-stone-900">
          Cari Masjid & Mushola di Google Maps
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Temukan masjid jami' dan mushola terdekat di sekitar <strong>{selectedCityName}</strong> langsung dari basis data resmi Google Maps.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <a
          href={directMapsSearchUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Compass className="w-4 h-4" />
          <span>Buka Pencarian di Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
        </a>

        <button
          onClick={onOpenKeyModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
        >
          <KeyRound className="w-4 h-4 text-stone-500" />
          <span>Aktifkan Peta Interaktif (Input Key)</span>
        </button>
      </div>

      <p className="text-[11px] text-stone-500 pt-2">
        Tersedia opsi <strong>Maps Demo Key</strong> tanpa kartu kredit untuk langsung menampilkan peta dan pin interaktif di dalam aplikasi.
      </p>
    </div>
  );
};
