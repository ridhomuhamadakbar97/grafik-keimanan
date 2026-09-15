import { DailyIbadahRecord, FaithChartDataPoint, FardhuKey, SunnahKey } from '../types';
import { formatLocalDateKey } from './dateUtils';

export const INITIAL_RECORD = (dateStr: string): DailyIbadahRecord => ({
  date: dateStr,
  fardhu: {
    subuh: { completed: false, status: 'belum' },
    dzuhur: { completed: false, status: 'belum' },
    ashar: { completed: false, status: 'belum' },
    maghrib: { completed: false, status: 'belum' },
    isya: { completed: false, status: 'belum' },
  },
  sunnah: {
    tahajjud: false,
    witir: false,
    dhuha: false,
    rawatib: false,
  },
  quran: {
    read: false,
    pages: 0,
    surahName: '',
  },
  dzikir: {
    pagi: false,
    petang: false,
    istighfarCount: 0,
    sholawatCount: 0,
  },
  amal: {
    sedekah: false,
    puasa: false,
    menuntutIlmu: false,
    silaturahim: false,
  },
  notes: '',
  faithScore: 0,
  updatedAt: new Date().toISOString(),
});

/**
 * Computes faith score (0 - 100) and breakdown
 */
export function calculateFaithScore(record: DailyIbadahRecord): {
  totalScore: number;
  fardhuScore: number;
  sunnahScore: number;
  quranScore: number;
  dzikirScore: number;
  amalScore: number;
} {
  // 1. Fardhu: max 45 points (9 pts per prayer)
  let fardhuScore = 0;
  const fardhuKeys: FardhuKey[] = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  fardhuKeys.forEach((key) => {
    const item = record.fardhu[key];
    if (item.completed) {
      if (item.status === 'jamaah_masjid') fardhuScore += 9;
      else if (item.status === 'jamaah_rumah') fardhuScore += 8;
      else if (item.status === 'munfarid') fardhuScore += 7;
      else if (item.status === 'terlambat') fardhuScore += 4;
      else fardhuScore += 7; // default completed
    }
  });

  // 2. Sunnah: max 20 points
  let sunnahScore = 0;
  if (record.sunnah.tahajjud) sunnahScore += 7;
  if (record.sunnah.witir) sunnahScore += 4;
  if (record.sunnah.dhuha) sunnahScore += 5;
  if (record.sunnah.rawatib) sunnahScore += 4;

  // 3. Quran: max 15 points
  let quranScore = 0;
  if (record.quran.read) {
    quranScore += 5; // base reading
    const pageBonus = Math.min(10, Math.floor(record.quran.pages * 2));
    quranScore += pageBonus;
  }

  // 4. Dzikir: max 10 points
  let dzikirScore = 0;
  if (record.dzikir.pagi) dzikirScore += 3;
  if (record.dzikir.petang) dzikirScore += 3;
  if (record.dzikir.istighfarCount >= 33) dzikirScore += 2;
  if (record.dzikir.sholawatCount >= 33) dzikirScore += 2;

  // 5. Amal & Akhlak: max 10 points
  let amalScore = 0;
  if (record.amal.sedekah) amalScore += 4;
  if (record.amal.puasa) amalScore += 4;
  if (record.amal.menuntutIlmu) amalScore += 1;
  if (record.amal.silaturahim) amalScore += 1;

  const totalScore = Math.min(100, Math.round(fardhuScore + sunnahScore + quranScore + dzikirScore + amalScore));

  return {
    totalScore,
    fardhuScore: Math.round(fardhuScore),
    sunnahScore: Math.round(sunnahScore),
    quranScore: Math.round(quranScore),
    dzikirScore: Math.round(dzikirScore),
    amalScore: Math.round(amalScore),
  };
}

export function getFaithStatus(score: number): {
  title: string;
  badgeClass: string;
  description: string;
} {
  if (score >= 85) {
    return {
      title: 'Mumtaz (Sangat Baik)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Grafik keimanan optimal! Ketaatan dan amalan sunnah terlaksana dengan istiqomah.',
    };
  } else if (score >= 70) {
    return {
      title: 'Jayyid (Baik & Konsisten)',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
      description: 'Ibadah fardhu terjaga dengan baik. Tambahkan sedikit tilawah dan dzikir harian.',
    };
  } else if (score >= 50) {
    return {
      title: 'Maqbul (Cukup)',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Sholat fardhu masih terlaksana, namun ada amalan yang perlu diperbaiki ketepatan waktunya.',
    };
  } else {
    return {
      title: 'Perlu Ditingkatkan',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      description: 'Iman sedang mengalami ujian kelelahan. Perbaharui wudhu, istighfar, dan segerakan sholat fardhu.',
    };
  }
}

export const FAITH_QUOTES = [
  {
    arabic: 'الْإِيمَانُ يَزِيدُ وَيَنْقُصُ، يَزِيدُ بِالطَّاعَةِ وَيَنْقُصُ بِالْمَعْصِيَةِ',
    indonesian: 'Iman itu bertambah dan berkurang; bertambah dengan ketaatan kepada Allah dan berkurang dengan kelalaian.',
    source: 'Atsar Sahabat & Ulama Salaf',
  },
  {
    arabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    indonesian: 'Amalan yang paling dicintai oleh Allah adalah amalan yang paling konsisten (istiqomah), walaupun sedikit.',
    source: 'HR. Bukhari No. 6464 & Muslim No. 783',
  },
  {
    arabic: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
    indonesian: 'Sungguh, shalat itu adalah fardhu yang ditentukan waktunya atas orang-orang yang beriman.',
    source: 'QS. An-Nisa: 103',
  },
  {
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    indonesian: 'Ingatlah, hanya dengan mengingat Allah (berdzikir) hati menjadi tentram.',
    source: 'QS. Ar-Ra\'d: 28',
  },
];

/**
 * Storage helpers
 */
const STORAGE_KEY = 'faith_tracker_records_v1';

export function loadAllRecords(): Record<string, DailyIbadahRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return seedDefaultHistory();
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load records from storage', e);
    return seedDefaultHistory();
  }
}

export function saveRecord(record: DailyIbadahRecord): void {
  try {
    const all = loadAllRecords();
    const scores = calculateFaithScore(record);
    record.faithScore = scores.totalScore;
    record.updatedAt = new Date().toISOString();
    all[record.date] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save record', e);
  }
}

/**
 * Seeds a rich, realistic history for the past 14 days if storage is empty
 */
function seedDefaultHistory(): Record<string, DailyIbadahRecord> {
  const records: Record<string, DailyIbadahRecord> = {};
  const today = new Date();

  // Pattern of faith fluctuations over past 14 days
  const patterns = [
    { fardhuDone: 5, masjid: 4, sunnahs: ['tahajjud', 'dhuha', 'rawatib'], qPages: 4, dzPagi: true, dzPetang: true, sedekah: true, puasa: false },
    { fardhuDone: 5, masjid: 3, sunnahs: ['dhuha', 'witir'], qPages: 2, dzPagi: true, dzPetang: false, sedekah: false, puasa: false },
    { fardhuDone: 5, masjid: 5, sunnahs: ['tahajjud', 'witir', 'dhuha', 'rawatib'], qPages: 8, dzPagi: true, dzPetang: true, sedekah: true, puasa: true }, // Senin puasa
    { fardhuDone: 4, masjid: 2, sunnahs: ['dhuha'], qPages: 1, dzPagi: true, dzPetang: false, sedekah: true, puasa: false },
    { fardhuDone: 5, masjid: 3, sunnahs: ['rawatib', 'witir'], qPages: 3, dzPagi: true, dzPetang: true, sedekah: false, puasa: false },
    { fardhuDone: 5, masjid: 4, sunnahs: ['tahajjud', 'dhuha'], qPages: 5, dzPagi: true, dzPetang: true, sedekah: true, puasa: false },
    { fardhuDone: 5, masjid: 5, sunnahs: ['tahajjud', 'witir', 'dhuha', 'rawatib'], qPages: 10, dzPagi: true, dzPetang: true, sedekah: true, puasa: true }, // Kamis puasa
    { fardhuDone: 4, masjid: 1, sunnahs: ['witir'], qPages: 2, dzPagi: false, dzPetang: true, sedekah: false, puasa: false },
    { fardhuDone: 5, masjid: 3, sunnahs: ['dhuha', 'rawatib'], qPages: 4, dzPagi: true, dzPetang: true, sedekah: true, puasa: false },
    { fardhuDone: 5, masjid: 4, sunnahs: ['tahajjud', 'witir'], qPages: 6, dzPagi: true, dzPetang: true, sedekah: true, puasa: false },
    { fardhuDone: 5, masjid: 2, sunnahs: ['dhuha'], qPages: 3, dzPagi: true, dzPetang: false, sedekah: false, puasa: false },
    { fardhuDone: 5, masjid: 4, sunnahs: ['tahajjud', 'dhuha', 'rawatib'], qPages: 5, dzPagi: true, dzPetang: true, sedekah: true, puasa: false },
    { fardhuDone: 5, masjid: 3, sunnahs: ['witir', 'rawatib'], qPages: 4, dzPagi: true, dzPetang: true, sedekah: true, puasa: false },
    { fardhuDone: 4, masjid: 3, sunnahs: ['dhuha'], qPages: 2, dzPagi: true, dzPetang: false, sedekah: false, puasa: false }, // Today so far
  ];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatLocalDateKey(d);

    const p = patterns[13 - i] || patterns[0];
    const rec = INITIAL_RECORD(dateStr);

    const fKeys: FardhuKey[] = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
    fKeys.forEach((k, idx) => {
      if (idx < p.fardhuDone) {
        rec.fardhu[k].completed = true;
        rec.fardhu[k].status = idx < p.masjid ? 'jamaah_masjid' : 'munfarid';
      }
    });

    p.sunnahs.forEach((s) => {
      if (s in rec.sunnah) {
        rec.sunnah[s as SunnahKey] = true;
      }
    });

    rec.quran.read = p.qPages > 0;
    rec.quran.pages = p.qPages;
    rec.dzikir.pagi = p.dzPagi;
    rec.dzikir.petang = p.dzPetang;
    rec.dzikir.istighfarCount = p.dzPagi ? 100 : 33;
    rec.dzikir.sholawatCount = p.dzPetang ? 100 : 33;

    rec.amal.sedekah = p.sedekah;
    rec.amal.puasa = p.puasa;
    rec.amal.menuntutIlmu = true;
    rec.amal.silaturahim = i % 3 === 0;

    const scores = calculateFaithScore(rec);
    rec.faithScore = scores.totalScore;
    records[dateStr] = rec;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    // ignore
  }

  return records;
}

/**
 * Converts records into data points for Recharts
 */
export function getChartData(
  records: Record<string, DailyIbadahRecord>,
  days: number = 7
): FaithChartDataPoint[] {
  const result: FaithChartDataPoint[] = [];
  const today = new Date();
  const daysShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatLocalDateKey(d);
    const rec = records[dateStr] || INITIAL_RECORD(dateStr);

    const scores = calculateFaithScore(rec);
    const dayName = daysShort[d.getDay()];
    const formattedDate = `${d.getDate()}/${d.getMonth() + 1}`;

    result.push({
      date: dateStr,
      formattedDate,
      dayName: `${dayName} (${formattedDate})`,
      score: scores.totalScore,
      fardhu: scores.fardhuScore,
      sunnah: scores.sunnahScore,
      quran: scores.quranScore,
      dzikir: scores.dzikirScore,
      amal: scores.amalScore,
    });
  }

  return result;
}
