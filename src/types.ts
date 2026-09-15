export type FardhuKey = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';
export type PrayerTimeKey = FardhuKey | 'imsak' | 'syuruq' | 'dhuha';
export type PrayerStatus = 'jamaah_masjid' | 'jamaah_rumah' | 'munfarid' | 'terlambat' | 'belum';

export interface FardhuRecord {
  completed: boolean;
  status: PrayerStatus;
}

export type SunnahKey = 'tahajjud' | 'witir' | 'dhuha' | 'rawatib';

export interface DailyIbadahRecord {
  date: string; // YYYY-MM-DD
  fardhu: Record<FardhuKey, FardhuRecord>;
  sunnah: Record<SunnahKey, boolean>;
  quran: {
    read: boolean;
    pages: number;
    surahName?: string;
  };
  dzikir: {
    pagi: boolean;
    petang: boolean;
    istighfarCount: number;
    sholawatCount: number;
  };
  amal: {
    sedekah: boolean;
    sedekahAmount?: number;
    puasa: boolean;
    puasaType?: 'senin_kamis' | 'daud' | 'ayyamul_bidh' | 'wajib' | 'lainnya';
    menuntutIlmu: boolean;
    silaturahim: boolean;
  };
  notes: string;
  faithScore: number; // 0 to 100
  syncedToCalendar?: boolean;
  calendarEventId?: string;
  updatedAt: string;
}

export interface FaithChartDataPoint {
  date: string;
  formattedDate: string;
  dayName: string;
  score: number;
  fardhu: number;
  sunnah: number;
  quran: number;
  dzikir: number;
  amal: number;
}

export interface PrayerTimeItem {
  id: PrayerTimeKey;
  name: string;
  arabicName: string;
  time: string; // "04:45"
  isNext?: boolean;
  isPassed?: boolean;
  isFardhu?: boolean;
}

export interface KemenagCityItem {
  id: string; // e.g., "1301"
  name: string;
  daerah?: string;
  timezoneOffset: number; // 7, 8, or 9
  latitude?: number;
  longitude?: number;
}

export interface KemenagJadwalDay {
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  date: string;
  tanggal?: string;
}

export interface CalendarSyncEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

export interface MosquePlaceItem {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  distanceKm?: number;
  rating?: number;
  userRatingCount?: number;
  googleMapsURI?: string;
  websiteURI?: string;
  isOpenNow?: boolean;
  type?: 'masjid' | 'mushola' | 'place_of_worship';
}

export type AccountType = 'google' | 'local_profile';

export interface AppAccount {
  id: string; // Firebase UID or local profile uuid e.g. "profile_123"
  type: AccountType;
  name: string;
  email?: string;
  photoURL?: string;
  avatarColor?: string; // e.g. emerald, teal, indigo, rose, amber, violet
  roleTag?: string; // e.g. "Utama", "Ayah", "Ibu", "Anak", "Keluarga"
  createdAt: string;
  lastActive: string;
}


