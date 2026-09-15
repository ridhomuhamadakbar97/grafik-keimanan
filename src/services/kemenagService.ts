import { KemenagCityItem, KemenagJadwalDay, PrayerTimeItem } from '../types';

export const DEFAULT_KEMENAG_CITIES: KemenagCityItem[] = [
  { id: '1301', name: 'Kota Jakarta', daerah: 'DKI JAKARTA', timezoneOffset: 7, latitude: -6.2088, longitude: 106.8456 },
  { id: '1219', name: 'Kota Bandung', daerah: 'JAWA BARAT', timezoneOffset: 7, latitude: -6.9175, longitude: 107.6191 },
  { id: '1638', name: 'Kota Surabaya', daerah: 'JAWA TIMUR', timezoneOffset: 7, latitude: -7.2575, longitude: 112.7521 },
  { id: '1433', name: 'Kota Semarang', daerah: 'JAWA TENGAH', timezoneOffset: 7, latitude: -6.9667, longitude: 110.4167 },
  { id: '1505', name: 'Kota Yogyakarta', daerah: 'D.I. YOGYAKARTA', timezoneOffset: 7, latitude: -7.7956, longitude: 110.3695 },
  { id: '0228', name: 'Kota Medan', daerah: 'SUMATERA UTARA', timezoneOffset: 7, latitude: 3.5952, longitude: 98.6722 },
  { id: '2622', name: 'Kota Makassar', daerah: 'SULAWESI SELATAN', timezoneOffset: 8, latitude: -5.1477, longitude: 119.4327 },
  { id: '1709', name: 'Kota Denpasar', daerah: 'BALI', timezoneOffset: 8, latitude: -8.6705, longitude: 115.2126 },
  { id: '2113', name: 'Kota Banjarmasin', daerah: 'KALIMANTAN SELATAN', timezoneOffset: 8, latitude: -3.3167, longitude: 114.5833 },
  { id: '2310', name: 'Kota Samarinda', daerah: 'KALIMANTAN TIMUR', timezoneOffset: 8, latitude: -0.5022, longitude: 117.1536 },
  { id: '2308', name: 'Kota Balikpapan', daerah: 'KALIMANTAN TIMUR', timezoneOffset: 8, latitude: -1.2379, longitude: 116.8529 },
  { id: '1810', name: 'Kota Mataram', daerah: 'NUSA TENGGARA BARAT', timezoneOffset: 8, latitude: -8.5833, longitude: 116.1167 },
  { id: '2914', name: 'Kota Manado', daerah: 'SULAWESI UTARA', timezoneOffset: 8, latitude: 1.4748, longitude: 124.8428 },
  { id: '3329', name: 'Kota Jayapura', daerah: 'PAPUA', timezoneOffset: 9, latitude: -2.5337, longitude: 140.7181 },
  { id: '3110', name: 'Kota Ambon', daerah: 'MALUKU', timezoneOffset: 9, latitude: -3.6547, longitude: 128.1906 },
  { id: '0119', name: 'Kota Banda Aceh', daerah: 'ACEH', timezoneOffset: 7, latitude: 5.5483, longitude: 95.3238 },
  { id: '0816', name: 'Kota Palembang', daerah: 'SUMATERA SELATAN', timezoneOffset: 7, latitude: -2.9761, longitude: 104.7754 },
  { id: '0314', name: 'Kota Padang', daerah: 'SUMATERA BARAT', timezoneOffset: 7, latitude: -0.9471, longitude: 100.4172 },
  { id: '0412', name: 'Kota Pekanbaru', daerah: 'RIAU', timezoneOffset: 7, latitude: 0.5071, longitude: 101.4478 },
  { id: '0506', name: 'Kota Batam', daerah: 'KEPULAUAN RIAU', timezoneOffset: 7, latitude: 1.1301, longitude: 104.0529 },
  { id: '1222', name: 'Kota Bogor', daerah: 'JAWA BARAT', timezoneOffset: 7, latitude: -6.5971, longitude: 106.806 },
  { id: '1221', name: 'Kota Bekasi', daerah: 'JAWA BARAT', timezoneOffset: 7, latitude: -6.2383, longitude: 106.9756 },
  { id: '1225', name: 'Kota Depok', daerah: 'JAWA BARAT', timezoneOffset: 7, latitude: -6.4025, longitude: 106.7942 },
  { id: '1107', name: 'Kota Tangerang', daerah: 'BANTEN', timezoneOffset: 7, latitude: -6.1783, longitude: 106.6319 },
  { id: '1108', name: 'Kota Tangerang Selatan', daerah: 'BANTEN', timezoneOffset: 7, latitude: -6.2888, longitude: 106.7179 },
  { id: '1173', name: 'Kota Serang', daerah: 'BANTEN', timezoneOffset: 7, latitude: -6.1200, longitude: 106.1503 },
  { id: '1434', name: 'Kota Surakarta (Solo)', daerah: 'JAWA TENGAH', timezoneOffset: 7, latitude: -7.5755, longitude: 110.8243 },
  { id: '1634', name: 'Kota Malang', daerah: 'JAWA TIMUR', timezoneOffset: 7, latitude: -7.9666, longitude: 112.6326 },
  { id: '1912', name: 'Kota Pontianak', daerah: 'KALIMANTAN BARAT', timezoneOffset: 7, latitude: -0.0263, longitude: 109.3425 },
];

const API_BASE = 'https://api.myquran.com/v2/sholat';

// In-memory cache to avoid duplicate network calls in session
const memoryMonthCache = new Map<string, Record<string, KemenagJadwalDay>>();

export class KemenagPrayerService {
  /**
   * Search cities / regencies across the 500+ official Kemenag database
   */
  static async searchCities(keyword: string): Promise<KemenagCityItem[]> {
    const term = keyword.trim().toLowerCase();
    if (!term) return DEFAULT_KEMENAG_CITIES;

    // First, filter local known list
    const localMatches = DEFAULT_KEMENAG_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.daerah && c.daerah.toLowerCase().includes(term))
    );

    try {
      const response = await fetch(`${API_BASE}/kota/cari/${encodeURIComponent(term)}`);
      if (!response.ok) return localMatches;

      const json = await response.json();
      if (json.status && Array.isArray(json.data)) {
        const remoteList: KemenagCityItem[] = json.data.map((item: any) => {
          // Guess timezone from province / location if not specified
          const lokasi = item.lokasi || '';
          let tz = 7;
          if (
            lokasi.includes('BALI') ||
            lokasi.includes('NUSA TENGGARA') ||
            lokasi.includes('SULAWESI') ||
            lokasi.includes('KALIMANTAN')
          ) {
            tz = 8;
          } else if (lokasi.includes('PAPUA') || lokasi.includes('MALUKU')) {
            tz = 9;
          }

          // Check if already in curated list to retain exact timezone
          const known = DEFAULT_KEMENAG_CITIES.find((k) => k.id === String(item.id));
          return {
            id: String(item.id),
            name: item.lokasi,
            daerah: known?.daerah || item.lokasi,
            timezoneOffset: known ? known.timezoneOffset : tz,
          };
        });

        // Merge and deduplicate by ID
        const map = new Map<string, KemenagCityItem>();
        localMatches.forEach((m) => map.set(m.id, m));
        remoteList.forEach((r) => {
          if (!map.has(r.id)) map.set(r.id, r);
        });

        return Array.from(map.values());
      }
    } catch (e) {
      console.warn('Gagal mencari kota dari Kemenag API, menggunakan daftar lokal', e);
    }

    return localMatches;
  }

  /**
   * Fetch full month schedule from Kemenag database with persistent caching
   */
  static async getMonthSchedule(
    cityId: string,
    year: number,
    month: number
  ): Promise<Record<string, KemenagJadwalDay> | null> {
    const monthStr = String(month).padStart(2, '0');
    const cacheKey = `kemenag_jadwal_${cityId}_${year}_${monthStr}`;

    // 1. Check in-memory cache
    if (memoryMonthCache.has(cacheKey)) {
      return memoryMonthCache.get(cacheKey)!;
    }

    // 2. Check localStorage cache
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryMonthCache.set(cacheKey, parsed);
        return parsed;
      }
    } catch {
      // LocalStorage access might fail in private browsing; safely continue
    }

    // 3. Fetch from Kemenag API (monthly endpoint)
    try {
      const url = `${API_BASE}/jadwal/${cityId}/${year}/${monthStr}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.status && data.data?.jadwal) {
        const dayMap: Record<string, KemenagJadwalDay> = {};

        if (Array.isArray(data.data.jadwal)) {
          for (const item of data.data.jadwal) {
            if (item.date) {
              dayMap[item.date] = item;
            }
          }
        } else if (typeof data.data.jadwal === 'object' && data.data.jadwal.date) {
          dayMap[data.data.jadwal.date] = data.data.jadwal;
        }

        // Save to in-memory cache
        memoryMonthCache.set(cacheKey, dayMap);

        // Save to localStorage
        try {
          localStorage.setItem(cacheKey, JSON.stringify(dayMap));
        } catch (storageErr) {
          console.warn('LocalStorage penuh, data disimpan dalam memori saja', storageErr);
        }

        return dayMap;
      }
    } catch (err) {
      console.warn(`Gagal memuat jadwal Kemenag untuk kota ${cityId}`, err);
    }

    return null;
  }

  /**
   * Get Prayer Times for a specific date and Kemenag City
   */
  static async getPrayerTimes(
    city: KemenagCityItem,
    date: Date
  ): Promise<{
    prayers: PrayerTimeItem[];
    source: 'kemenag_api' | 'kemenag_calc';
    sourceName: string;
    rawJadwal?: KemenagJadwalDay;
  }> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const dateStr = date.toISOString().split('T')[0];

    const monthData = await this.getMonthSchedule(city.id, year, month);
    const dayData = monthData ? monthData[dateStr] : null;

    if (dayData) {
      return {
        prayers: this.mapJadwalToItems(dayData),
        source: 'kemenag_api',
        sourceName: 'Database Resmi Bimas Islam Kemenag RI',
        rawJadwal: dayData,
      };
    }

    // Fallback: Accurate astronomical calculation calibrated strictly to Kemenag RI standard
    const fallbackItems = this.calculateKemenagStandard(date, city);
    return {
      prayers: fallbackItems,
      source: 'kemenag_calc',
      sourceName: 'Kalkulasi Standar Kemenag RI (Subuh -20°, Isya -18° + Ihtiyat 2m)',
    };
  }

  /**
   * Convert Kemenag official schedule object into PrayerTimeItem list
   */
  static mapJadwalToItems(jadwal: KemenagJadwalDay): PrayerTimeItem[] {
    return [
      { id: 'imsak', name: 'Imsak', arabicName: 'الإمساك', time: jadwal.imsak, isFardhu: false },
      { id: 'subuh', name: 'Subuh', arabicName: 'الفجر', time: jadwal.subuh, isFardhu: true },
      { id: 'syuruq', name: 'Terbit', arabicName: 'الشروq', time: jadwal.terbit, isFardhu: false },
      { id: 'dhuha', name: 'Dhuha', arabicName: 'الضحى', time: jadwal.dhuha, isFardhu: false },
      { id: 'dzuhur', name: 'Dzuhur', arabicName: 'الظهر', time: jadwal.dzuhur, isFardhu: true },
      { id: 'ashar', name: 'Ashar', arabicName: 'العصر', time: jadwal.ashar, isFardhu: true },
      { id: 'maghrib', name: 'Maghrib', arabicName: 'المغرب', time: jadwal.maghrib, isFardhu: true },
      { id: 'isya', name: 'Isya', arabicName: 'العشاء', time: jadwal.isya, isFardhu: true },
    ];
  }

  /**
   * Fallback: Pure astronomical calculation adhering precisely to Kemenag RI Ephemeris standard:
   * - Subuh angle: -20.0°
   * - Isya angle: -18.0°
   * - Ihtiyat (safety margin): +2 minutes
   * - Imsak: Subuh - 10 minutes
   * - Dhuha: Sunrise + 28 minutes
   */
  static calculateKemenagStandard(date: Date, city: KemenagCityItem): PrayerTimeItem[] {
    const lat = city.latitude ?? -6.2088;
    const lng = city.longitude ?? 106.8456;
    const tz = city.timezoneOffset ?? 7;

    const rad = (d: number) => (d * Math.PI) / 180;
    const deg = (r: number) => (r * 180) / Math.PI;

    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
    );

    const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
    const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    const declination = 23.45 * Math.sin(rad((360 / 365) * (dayOfYear - 81)));

    // Solar noon (Dzuhur) in minutes + 2 mins ihtiyat
    const noonMinutes = 12 * 60 + 4 * (tz * 15 - lng) - eot;
    const dzuhurMinutes = noonMinutes + 2;

    const phi = rad(lat);
    const delta = rad(declination);

    const getHourAngle = (altDeg: number) => {
      const altRad = rad(altDeg);
      const cosHA = (Math.sin(altRad) - Math.sin(phi) * Math.sin(delta)) / (Math.cos(phi) * Math.cos(delta));
      if (cosHA > 1 || cosHA < -1) return null;
      return deg(Math.acos(cosHA));
    };

    // Subuh: sun altitude -20° (Kemenag standard)
    const subuhHA = getHourAngle(-20);
    const subuhMinutes = subuhHA !== null ? dzuhurMinutes - (subuhHA / 15) * 60 : dzuhurMinutes - 4.5 * 60;

    // Terbit (Sunrise): sun altitude -0.833° - 1° atmospheric refraction
    const syuruqHA = getHourAngle(-1.833) ?? getHourAngle(-0.833);
    const syuruqMinutes = syuruqHA !== null ? dzuhurMinutes - (syuruqHA / 15) * 60 : dzuhurMinutes - 3.75 * 60;

    // Ashar: Shafi'i shadow length (1 + tan(|lat - dec|)) + 2m ihtiyat
    const asharAltRad = Math.atan(1 / (1 + Math.tan(Math.abs(phi - delta))));
    const asharHA = getHourAngle(deg(asharAltRad));
    const asharMinutes = asharHA !== null ? dzuhurMinutes + (asharHA / 15) * 60 : dzuhurMinutes + 3 * 60;

    // Maghrib: sunset -0.833° + 2m ihtiyat
    const maghribHA = syuruqHA;
    const maghribMinutes = maghribHA !== null ? dzuhurMinutes + (maghribHA / 15) * 60 + 2 : dzuhurMinutes + 3.8 * 60;

    // Isya: sun altitude -18° (Kemenag standard) + 2m ihtiyat
    const isyaHA = getHourAngle(-18);
    const isyaMinutes = isyaHA !== null ? dzuhurMinutes + (isyaHA / 15) * 60 + 2 : dzuhurMinutes + 5 * 60;

    // Imsak: Subuh - 10 minutes
    const imsakMinutes = subuhMinutes - 10;

    // Dhuha: Terbit + 28 minutes
    const dhuhaMinutes = syuruqMinutes + 28;

    const format = (m: number) => {
      let totalM = Math.round(m);
      if (totalM < 0) totalM += 24 * 60;
      totalM = totalM % (24 * 60);
      const hours = Math.floor(totalM / 60);
      const mins = totalM % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    return [
      { id: 'imsak', name: 'Imsak', arabicName: 'الإمساك', time: format(imsakMinutes), isFardhu: false },
      { id: 'subuh', name: 'Subuh', arabicName: 'الفجر', time: format(subuhMinutes), isFardhu: true },
      { id: 'syuruq', name: 'Terbit', arabicName: 'الشروق', time: format(syuruqMinutes), isFardhu: false },
      { id: 'dhuha', name: 'Dhuha', arabicName: 'الضحى', time: format(dhuhaMinutes), isFardhu: false },
      { id: 'dzuhur', name: 'Dzuhur', arabicName: 'الظهر', time: format(dzuhurMinutes), isFardhu: true },
      { id: 'ashar', name: 'Ashar', arabicName: 'العصر', time: format(asharMinutes), isFardhu: true },
      { id: 'maghrib', name: 'Maghrib', arabicName: 'المغرب', time: format(maghribMinutes), isFardhu: true },
      { id: 'isya', name: 'Isya', arabicName: 'العشاء', time: format(isyaMinutes), isFardhu: true },
    ];
  }
}
