import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Compass,
  Navigation,
  MapPin,
  Sparkles,
  CheckCircle2,
  RotateCw,
  AlertCircle,
  HelpCircle,
  LocateFixed,
  Smartphone,
  Info,
} from 'lucide-react';
import { LocationConfig } from '../utils/prayerTimes';
import { calculateQiblaDirection, formatDistance, KAABA_COORDINATES } from '../utils/geoUtils';

interface QiblaCompassCardProps {
  selectedCity: LocationConfig;
}

export const QiblaCompassCard: React.FC<QiblaCompassCardProps> = ({ selectedCity }) => {
  // Current active coordinates (default to selected city from Kemenag)
  const [coords, setCoords] = useState<{ lat: number; lng: number; label: string }>({
    lat: selectedCity.latitude,
    lng: selectedCity.longitude,
    label: selectedCity.name,
  });

  // Calculate Qibla angle and distance based on coordinates
  const qiblaData = useMemo(() => {
    return calculateQiblaDirection(coords.lat, coords.lng);
  }, [coords.lat, coords.lng]);

  // Compass heading state (0 to 360 degrees from North)
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [sensorPermission, setSensorPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showTips, setShowTips] = useState<boolean>(false);

  // Manual interactive rotation if on desktop or sensor is off
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  const lastVibrationTime = useRef<number>(0);

  // Update coords when selectedCity changes (if not using GPS override)
  useEffect(() => {
    if (!coords.label.includes('GPS')) {
      setCoords({
        lat: selectedCity.latitude,
        lng: selectedCity.longitude,
        label: selectedCity.name,
      });
    }
  }, [selectedCity]);

  // Handle device orientation sensors
  useEffect(() => {
    let mounted = true;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!mounted) return;

      let heading: number | null = null;

      // iOS Safari webkitCompassHeading (0 to 360 clockwise from magnetic/true North)
      const webkitHeading = (event as any).webkitCompassHeading;
      if (typeof webkitHeading === 'number' && !isNaN(webkitHeading)) {
        heading = webkitHeading;
      } else if (event.alpha !== null && typeof event.alpha === 'number') {
        // Android / Standard W3C
        // alpha: rotation around z axis. For absolute heading:
        heading = (360 - event.alpha) % 360;
      }

      if (heading !== null && !isNaN(heading)) {
        setHasCompassSensor(true);
        setSensorPermission('granted');
        setDeviceHeading(Math.round(heading));
      }
    };

    // Try absolute orientation first (Chrome / Android)
    const win = window as any;
    if ('ondeviceorientationabsolute' in win) {
      win.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else if ('ondeviceorientation' in win) {
      win.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      mounted = false;
      if ('ondeviceorientationabsolute' in win) {
        win.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      }
      if ('ondeviceorientation' in win) {
        win.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // Request iOS 13+ DeviceOrientation permission
  const requestIosPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setSensorPermission('granted');
          setHasCompassSensor(true);
        } else {
          setSensorPermission('denied');
        }
      } catch (e) {
        console.warn('Sensor permission error', e);
        setSensorPermission('denied');
      }
    }
  };

  // Get User's Real-time GPS Position
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser Anda tidak mendukung geolokasi');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: `GPS Presisi (${position.coords.latitude.toFixed(4)}°, ${position.coords.longitude.toFixed(4)}°)`,
        });
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        setGpsError('Gagal mendapatkan lokasi GPS. Menggunakan kota ' + selectedCity.name);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Active heading: sensor heading or manual simulator
  const activeHeading = isManualMode ? manualHeading : hasCompassSensor ? deviceHeading : manualHeading;

  // Calculate difference between active heading and Qibla bearing
  // diff = 0 means device is pointing directly towards Qibla
  const rawDiff = (activeHeading - qiblaData.bearing + 540) % 360 - 180; // range [-180, 180]
  const absDiff = Math.abs(rawDiff);
  const isAligned = absDiff <= 3; // within 3 degrees tolerance

  // Haptic feedback when aligned
  useEffect(() => {
    if (isAligned && navigator.vibrate) {
      const now = Date.now();
      if (now - lastVibrationTime.current > 3000) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch (e) {
          // ignore
        }
        lastVibrationTime.current = now;
      }
    }
  }, [isAligned]);

  // Turn dial rotation angle: we rotate the dial counter-clockwise by activeHeading
  // so North is up when heading is 0, and the dial rotates as device turns
  const dialRotation = -activeHeading;

  // Degree ticks on compass dial (every 30 degrees)
  const ticks = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  return (
    <div
      id="qibla-compass-section"
      className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden transition-all"
    >
      {/* Header Banner */}
      <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-wrap items-center justify-between gap-4 bg-stone-50/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-900/10">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                Arah Kiblat & Kompas Digital
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Presisi Makkah
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Menentukan sudut derajat kiblat menuju Ka'bah berdasarkan orientasi kompas
            </p>
          </div>
        </div>

        {/* GPS Location & Sensor Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGetGpsLocation}
            disabled={gpsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 active:bg-stone-100 border border-stone-200 rounded-xl shadow-2xs transition-all disabled:opacity-50"
            title="Gunakan koordinat GPS perangkat Anda untuk akurasi tertinggi"
          >
            <LocateFixed className={`w-3.5 h-3.5 text-emerald-700 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Mencari GPS...' : 'Gunakan GPS HP'}</span>
          </button>

          <button
            onClick={() => setShowTips(!showTips)}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors"
            title="Petunjuk Kalibrasi Kompas"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GPS Notification if any */}
      {gpsError && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Guide & Calibration Card */}
      {showTips && (
        <div className="mx-5 sm:mx-6 mt-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5 animate-in fade-in duration-200">
          <div className="font-bold flex items-center gap-1.5 text-emerald-800">
            <Info className="w-4 h-4" />
            <span>Panduan Kalibrasi Kompas:</span>
          </div>
          <p className="text-stone-600 leading-relaxed">
            1. Posisikan perangkat smartphone Anda dalam keadaan datar (horizontal) di telapak tangan atau meja.
          </p>
          <p className="text-stone-600 leading-relaxed">
            2. Jauhkan dari benda logam tebal, speaker, casing magnetik, atau laptop yang dapat mengganggu sensor medan magnet.
          </p>
          <p className="text-stone-600 leading-relaxed">
            3. Jika kompas belum stabil, gerakkan smartphone Anda membentuk pola angka 8 (delapan) di udara selama 3-5 detik untuk mengkalibrasi sensor giroskop & magnetometer.
          </p>
        </div>
      )}

      {/* Main Compass Interactive Display Area */}
      <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* The Visual Compass Disc */}
        <div className="flex flex-col items-center">
          {/* Top Heading Reference Indicator Needle */}
          <div className="flex flex-col items-center mb-2">
            <div
              className={`w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-[14px] transition-colors ${
                isAligned ? 'border-t-emerald-600 animate-bounce' : 'border-t-stone-700'
              }`}
            />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">
              Depan HP
            </span>
          </div>

          {/* Compass Dial Outer Frame */}
          <div
            className={`relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-xl ${
              isAligned
                ? 'border-emerald-500 ring-8 ring-emerald-500/20 bg-emerald-50/40'
                : 'border-stone-300 bg-stone-50/80'
            }`}
          >
            {/* Compass Dial Face (Rotates with Device Orientation) */}
            <div
              className="absolute inset-2 rounded-full border border-stone-200/80 bg-white transition-transform duration-100 ease-out flex items-center justify-center select-none"
              style={{
                transform: `rotate(${dialRotation}deg)`,
              }}
            >
              {/* Degree Ticks */}
              {ticks.map((deg) => (
                <div
                  key={deg}
                  className="absolute inset-0 flex flex-col items-center justify-start pt-1.5"
                  style={{ transform: `rotate(${deg}deg)` }}
                >
                  <div
                    className={`w-0.5 ${
                      deg % 90 === 0 ? 'h-3 bg-stone-800' : 'h-1.5 bg-stone-300'
                    }`}
                  />
                  <span
                    className={`text-[9px] font-bold mt-1 ${
                      deg === 0 ? 'text-rose-600' : 'text-stone-400'
                    }`}
                    style={{ transform: `rotate(-${deg}deg)` }}
                  >
                    {deg === 0 ? '0°' : `${deg}°`}
                  </span>
                </div>
              ))}

              {/* Cardinal Labels: U (Utara), T (Timur), S (Selatan), B (Barat) */}
              {/* Utara (North) */}
              <div className="absolute top-7 text-xs font-black text-rose-600 tracking-wider">
                U
              </div>
              {/* Timur (East) */}
              <div className="absolute right-7 text-xs font-black text-stone-700 tracking-wider">
                T
              </div>
              {/* Selatan (South) */}
              <div className="absolute bottom-7 text-xs font-black text-stone-700 tracking-wider">
                S
              </div>
              {/* Barat (West) */}
              <div className="absolute left-7 text-xs font-black text-stone-700 tracking-wider">
                B
              </div>

              {/* Sub-cardinals */}
              <div className="absolute top-12 right-12 text-[9px] font-semibold text-stone-400">
                TL
              </div>
              <div className="absolute bottom-12 right-12 text-[9px] font-semibold text-stone-400">
                TG
              </div>
              <div className="absolute bottom-12 left-12 text-[9px] font-semibold text-stone-400">
                BD
              </div>
              <div className="absolute top-12 left-12 text-[9px] font-semibold text-stone-400">
                BL
              </div>

              {/* Special Qibla Needle & Kaaba Pointer on the Dial */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-start pointer-events-none"
                style={{ transform: `rotate(${qiblaData.bearing}deg)` }}
              >
                {/* Kaaba Marker Badge at the rim */}
                <div className="relative -top-3.5 flex flex-col items-center group">
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md transition-all ${
                      isAligned
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-110'
                        : 'bg-emerald-800 text-white'
                    }`}
                  >
                    {/* Miniature Kaaba Silhouette */}
                    <span className="text-[11px] leading-none">🕋</span>
                    <span>KIBLAT</span>
                  </div>
                  {/* Pointer arrow pointing outwards towards Kaaba */}
                  <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-6 border-b-emerald-800" />
                </div>

                {/* Line from center towards Kaaba marker */}
                <div
                  className={`w-0.5 h-20 sm:h-24 ${
                    isAligned ? 'bg-emerald-500 shadow-sm' : 'bg-emerald-700/80'
                  }`}
                />
              </div>

              {/* Center Pivot of the Compass */}
              <div className="relative z-10 w-9 h-9 rounded-full bg-stone-900 border-2 border-white shadow-md flex items-center justify-center text-white">
                <Navigation
                  className={`w-4 h-4 transition-transform ${
                    isAligned ? 'text-emerald-400 scale-110' : 'text-stone-300'
                  }`}
                  style={{ transform: `rotate(${qiblaData.bearing - activeHeading}deg)` }}
                />
              </div>
            </div>

            {/* Inner Ring Glow when aligned */}
            {isAligned && (
              <div className="absolute inset-4 rounded-full border-2 border-emerald-400/50 animate-ping pointer-events-none" />
            )}
          </div>

          {/* Compass Alignment Status Feedback Banner */}
          <div className="mt-4 text-center">
            {isAligned ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs sm:text-sm border border-emerald-300 shadow-xs animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Alhamdulillah! Tepat Menghadap Kiblat</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 font-semibold text-xs border border-stone-200">
                <RotateCw className="w-3.5 h-3.5 text-stone-500" />
                <span>
                  {rawDiff > 0
                    ? `Putar perangkat ${Math.round(absDiff)}° ke KIRI`
                    : `Putar perangkat ${Math.round(absDiff)}° ke KANAN`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Informative Stats & Controls Panel */}
        <div className="flex-1 max-w-md w-full space-y-4">
          {/* Main Bearing Metric Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium border-b border-stone-200/80 pb-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Lokasi Acuan</span>
              </span>
              <span className="font-bold text-stone-800 truncate max-w-[180px]">
                {coords.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Target Qibla Bearing */}
              <div className="p-3 bg-white rounded-xl border border-stone-200/70 shadow-2xs">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Sudut Kiblat
                </div>
                <div className="text-2xl font-black text-emerald-800 mt-0.5">
                  {qiblaData.bearing}°
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 mt-0.5 truncate">
                  {qiblaData.cardinalName}
                </div>
              </div>

              {/* Current Device Compass Heading */}
              <div className="p-3 bg-white rounded-xl border border-stone-200/70 shadow-2xs">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Arah Kompas HP
                </div>
                <div className="text-2xl font-black text-stone-800 mt-0.5">
                  {Math.round(activeHeading)}°
                </div>
                <div className="text-[11px] font-medium text-stone-500 mt-0.5 truncate">
                  {hasCompassSensor && !isManualMode ? 'Sensor Otomatis' : 'Mode Interaktif'}
                </div>
              </div>
            </div>

            {/* Distance to Kaaba */}
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/80 rounded-xl border border-emerald-200/80 text-xs">
              <span className="text-emerald-800 font-medium">Jarak lurus ke Ka'bah:</span>
              <span className="font-extrabold text-emerald-950">
                {formatDistance(qiblaData.distanceKm)}
              </span>
            </div>
          </div>

          {/* Sensor Permission / Simulator Controls */}
          <div className="space-y-2">
            {typeof DeviceOrientationEvent !== 'undefined' &&
              typeof (DeviceOrientationEvent as any).requestPermission === 'function' &&
              sensorPermission !== 'granted' && (
                <button
                  onClick={requestIosPermission}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Aktifkan Sensor Kompas iPhone / iPad</span>
                </button>
              )}

            {/* Manual Rotation Dial Slider for Desktop or Testing */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-stone-700">
                <span className="font-bold flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-stone-500" />
                  <span>Simulasi Putaran Kompas (Desktop)</span>
                </span>
                <button
                  onClick={() => {
                    setIsManualMode(!isManualMode);
                    if (!isManualMode) setManualHeading(qiblaData.bearing);
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  {isManualMode ? 'Gunakan Sensor' : 'Coba Putar Manual'}
                </button>
              </div>

              {isManualMode && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={manualHeading}
                      onChange={(e) => setManualHeading(Number(e.target.value))}
                      className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                    />
                    <span className="font-mono font-bold text-stone-800 w-12 text-right">
                      {manualHeading}°
                    </span>
                  </div>

                  {/* Quick align button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setManualHeading(Math.round(qiblaData.bearing))}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors"
                    >
                      Posisikan Pas Kiblat ({qiblaData.bearing}°)
                    </button>
                    <button
                      onClick={() => setManualHeading(0)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors"
                    >
                      Reset ke Utara (0°)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Note on Sensor Accuracy */}
            <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/60 text-[11px] text-stone-500 space-y-1">
              <div className="font-semibold text-stone-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-700" />
                <span>Kaidah Syariat Arah Kiblat</span>
              </div>
              <p className="leading-relaxed">
                Bagi yang jauh dari Ka'bah (seperti di Indonesia), menghadap ke arah kiblat (*jihatul Ka'bah*)
                sudah sah secara fiqih dengan toleransi sudut wajar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
