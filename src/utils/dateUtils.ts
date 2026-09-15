/**
 * Indonesian Date & Real-Time Timezone Utilities
 * Ensures dates follow local time / Indonesian timezone without UTC offset bugs.
 */

export const INDONESIAN_DAY_NAMES = [
  'Ahad', // 0 = Sunday
  'Senin', // 1 = Monday
  'Selasa', // 2 = Tuesday
  'Rabu', // 3 = Wednesday
  'Kamis', // 4 = Thursday
  'Jum\'at', // 5 = Friday
  'Sabtu', // 6 = Saturday
];

export const INDONESIAN_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Format a Date object into a YYYY-MM-DD string without UTC day shift.
 * If timezoneOffsetHours is provided (e.g. 7 for WIB, 8 for WITA, 9 for WIT),
 * converts to that target timezone.
 */
export function formatLocalDateKey(date: Date = new Date(), timezoneOffsetHours?: number): string {
  let targetDate = date;

  if (typeof timezoneOffsetHours === 'number') {
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
    targetDate = new Date(utcMs + timezoneOffsetHours * 3600000);
  }

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string safely into local midnight Date object
 */
export function parseLocalDateKey(dateStr: string): Date {
  if (!dateStr || !dateStr.includes('-')) return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

/**
 * Add or subtract days from a YYYY-MM-DD string
 */
export function shiftDateKey(dateStr: string, deltaDays: number): string {
  const d = parseLocalDateKey(dateStr);
  d.setDate(d.getDate() + deltaDays);
  return formatLocalDateKey(d);
}

/**
 * Returns full Indonesian day name (e.g. "Senin")
 */
export function getIndonesianDayName(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDateKey(date) : date;
  return INDONESIAN_DAY_NAMES[d.getDay()] || 'Hari';
}

/**
 * Format full Indonesian date string: e.g. "Senin, 15 September 2026"
 */
export function formatIndonesianFullDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDateKey(date) : date;
  const dayName = INDONESIAN_DAY_NAMES[d.getDay()];
  const dayNum = d.getDate();
  const monthName = INDONESIAN_MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

/**
 * Format short Indonesian date: e.g. "15 Sep 2026"
 */
export function formatIndonesianShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDateKey(date) : date;
  const dayNum = d.getDate();
  const monthName = INDONESIAN_MONTH_NAMES[d.getMonth()]?.substring(0, 3);
  const year = d.getFullYear();

  return `${dayNum} ${monthName} ${year}`;
}

/**
 * Check if given date string matches today's real-time date
 */
export function isRealTimeToday(dateStr: string, timezoneOffsetHours?: number): boolean {
  const today = formatLocalDateKey(new Date(), timezoneOffsetHours);
  return dateStr === today;
}
