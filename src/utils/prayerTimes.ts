import { PrayerTimeItem, KemenagCityItem } from '../types';
import { DEFAULT_KEMENAG_CITIES, KemenagPrayerService } from '../services/kemenagService';

export type LocationConfig = KemenagCityItem;

export const INDONESIAN_CITIES: LocationConfig[] = DEFAULT_KEMENAG_CITIES;

/**
 * Calculates prayer times using official Kemenag RI astronomical formula
 * (Fajr angle 20°, Isha angle 18° + 2 minutes ihtiyat standard Kemenag RI).
 */
export function calculatePrayerTimes(date: Date, location: LocationConfig = INDONESIAN_CITIES[0]): PrayerTimeItem[] {
  return KemenagPrayerService.calculateKemenagStandard(date, location);
}

/**
 * Determine which prayer is next based on current time
 */
export function getNextPrayer(prayers: PrayerTimeItem[], now: Date): {
  currentPrayer: PrayerTimeItem | null;
  nextPrayer: PrayerTimeItem;
  minutesRemaining: number;
  secondsRemaining: number;
} {
  // Focus on Fardhu prayers + Syuruq for adzan/sholat countdown
  const relevantPrayers = prayers.filter((p) => p.isFardhu || p.id === 'syuruq');
  const targetPrayers = relevantPrayers.length > 0 ? relevantPrayers : prayers;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  const toMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Find next
  for (let i = 0; i < targetPrayers.length; i++) {
    const pMinutes = toMinutes(targetPrayers[i].time);
    if (pMinutes > currentMinutes || (pMinutes === currentMinutes && currentSeconds === 0)) {
      const diffSecTotal = (pMinutes - currentMinutes) * 60 - currentSeconds;
      return {
        currentPrayer: i > 0 ? targetPrayers[i - 1] : targetPrayers[targetPrayers.length - 1],
        nextPrayer: targetPrayers[i],
        minutesRemaining: Math.floor(diffSecTotal / 60),
        secondsRemaining: diffSecTotal % 60,
      };
    }
  }

  // After Isya -> Next is Subuh tomorrow
  const subuhPrayer = targetPrayers.find((p) => p.id === 'subuh') || targetPrayers[0];
  const subuhMinTomorrow = toMinutes(subuhPrayer.time) + 24 * 60;
  const diffSec = (subuhMinTomorrow - currentMinutes) * 60 - currentSeconds;
  return {
    currentPrayer: targetPrayers[targetPrayers.length - 1],
    nextPrayer: subuhPrayer,
    minutesRemaining: Math.floor(diffSec / 60),
    secondsRemaining: diffSec % 60,
  };
}

/**
 * Format Gregorian Date in Indonesian
 */
export function formatIndonesianDate(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Approximate Hijri date
 */
export function getApproxHijriDate(date: Date): string {
  // Kuwati algorithm approximation for Hijri calendar
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  let m = month + 1;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }

  let a = Math.floor(y / 100);
  let b = 2 - a + Math.floor(a / 4);
  if (y < 1583) b = 0;
  if (y === 1582) {
    if (m > 10) b = -10;
    if (m === 10) {
      b = 0;
      if (day > 4) b = -10;
    }
  }

  let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
  b = 0;
  if (jd > 2299160) {
    a = Math.floor((jd - 1867216.25) / 36524.25);
    b = 1 + a - Math.floor(a / 4);
  }
  let bb = jd + b + 1524;
  let cc = Math.floor((bb - 122.1) / 365.25);
  let dd = Math.floor(365.25 * cc);
  let ee = Math.floor((bb - dd) / 30.6001);
  day;

  let epoch = 1948439.5;
  let z = jd - epoch;
  let cyc = Math.floor(z / 10631);
  let z_rem = z - 10631 * cyc;
  let jyear = Math.floor((z_rem - 0.5) / 354.36667);
  let hy = 30 * cyc + jyear + 1;
  let z_rem2 = z_rem - Math.floor(jyear * 354.36667 + 0.5);
  let hm = Math.min(12, Math.ceil((z_rem2 - 28.5) / 29.5));
  if (hm <= 0) hm = 1;
  let hd = Math.floor(z_rem2 - Math.floor((hm - 1) * 29.5) - 28.5);
  if (hd <= 0) hd = 29 + hd;

  const hijriMonths = [
    'Muharram', 'Safar', "Rabi'ul Awwal", "Rabi'ul Akhir",
    'Jumadil Ula', 'Jumadil Akhir', 'Rajab', "Sya'ban",
    'Ramadhan', 'Syawwal', "Dzulqa'dah", 'Dzulhijjah'
  ];

  const hMonthName = hijriMonths[(hm - 1) % 12] || "Rabi'ul Awwal";
  return `${Math.max(1, hd)} ${hMonthName} ${hy} H`;
}
