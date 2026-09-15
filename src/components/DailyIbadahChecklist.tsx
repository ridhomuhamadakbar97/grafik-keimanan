import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Calendar,
  Send,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle2,
  HeartHandshake,
  Sun,
  Moon,
  Clock,
  Radio,
  AlertCircle,
} from 'lucide-react';
import { DailyIbadahRecord, FardhuKey, FardhuRecord, PrayerStatus, SunnahKey } from '../types';
import { calculateFaithScore, getFaithStatus } from '../utils/faithScoring';
import {
  formatIndonesianFullDate,
  shiftDateKey,
  formatLocalDateKey,
} from '../utils/dateUtils';

interface DailyIbadahChecklistProps {
  currentRecord: DailyIbadahRecord;
  onUpdateRecord: (updated: DailyIbadahRecord) => void;
  selectedDate: string;
  onChangeDate: (dateStr: string, isRealTimeIntent?: boolean) => void;
  onSyncRecordToCalendar?: () => void;
  isCalendarConnected: boolean;
  todayDateStr?: string;
  isRealTimeMode?: boolean;
  onToggleRealTimeMode?: (enabled: boolean) => void;
  currentTime?: Date;
  timezoneLabel?: string;
}

const FARDHU_LIST: Array<{ id: FardhuKey; name: string; arabic: string }> = [
  { id: 'subuh', name: 'Sholat Subuh', arabic: 'الفجر' },
  { id: 'dzuhur', name: 'Sholat Dzuhur', arabic: 'الظهر' },
  { id: 'ashar', name: 'Sholat Ashar', arabic: 'العصر' },
  { id: 'maghrib', name: 'Sholat Maghrib', arabic: 'المغرب' },
  { id: 'isya', name: 'Sholat Isya', arabic: 'العشاء' },
];

const SUNNAH_LIST: Array<{ id: SunnahKey; name: string; desc: string }> = [
  { id: 'tahajjud', name: 'Tahajjud / Qiyamul Lail', desc: 'Sepertiga malam terakhir' },
  { id: 'witir', name: 'Sholat Witir', desc: 'Penutup sholat malam' },
  { id: 'dhuha', name: 'Sholat Dhuha', desc: 'Waktu dhuha (pagi menuju siang)' },
  { id: 'rawatib', name: 'Sholat Rawatib', desc: 'Qobliyah & Ba\'diyah fardhu' },
];

export const DailyIbadahChecklist: React.FC<DailyIbadahChecklistProps> = ({
  currentRecord,
  onUpdateRecord,
  selectedDate,
  onChangeDate,
  onSyncRecordToCalendar,
  isCalendarConnected,
  todayDateStr,
  isRealTimeMode = true,
  onToggleRealTimeMode,
  currentTime,
  timezoneLabel = 'WIB',
}) => {
  const [activeTab, setActiveTab] = useState<'sholat' | 'quran_dzikir' | 'amal'>('sholat');
  const [saveToast, setSaveToast] = useState(false);

  // Active today string (defaults to local formatted date)
  const activeToday = todayDateStr || formatLocalDateKey(currentTime || new Date());
  const isToday = selectedDate === activeToday;

  const scores = calculateFaithScore(currentRecord);
  const status = getFaithStatus(scores.totalScore);

  const handleDateShift = (direction: 'prev' | 'next') => {
    const nextDate = shiftDateKey(selectedDate, direction === 'prev' ? -1 : 1);
    onChangeDate(nextDate, nextDate === activeToday);
  };

  const handleSetToday = () => {
    onChangeDate(activeToday, true);
    if (onToggleRealTimeMode) {
      onToggleRealTimeMode(true);
    }
  };

  const updateField = (updater: (draft: DailyIbadahRecord) => void) => {
    const draft = JSON.parse(JSON.stringify(currentRecord));
    updater(draft);
    const newScores = calculateFaithScore(draft);
    draft.faithScore = newScores.totalScore;
    draft.updatedAt = new Date().toISOString();
    onUpdateRecord(draft);
  };

  // Quick action: Mark all 5 fardhu done at mosque
  const handleMarkAllFardhuMosque = () => {
    updateField((draft) => {
      FARDHU_LIST.forEach(({ id }) => {
        draft.fardhu[id].completed = true;
        draft.fardhu[id].status = 'jamaah_masjid';
      });
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#047857', '#10b981', '#f59e0b'],
    });

    showFeedback();
  };

  const showFeedback = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2200);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-6">
      {/* Date Header & Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-stone-900">
              Pencatatan Ibadah Harian
            </h2>
            {isToday ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Real-Time Hari Ini</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Mode Riwayat Lampau</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 mt-1">
            <span className="font-bold text-stone-800">
              {formatIndonesianFullDate(selectedDate)}
            </span>
            {isToday && currentTime && (
              <>
                <span className="text-stone-300">•</span>
                <span className="font-mono text-emerald-800 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {timezoneLabel}
                  </span>
                </span>
              </>
            )}
            <span className="text-stone-300">•</span>
            <span>Evaluasi diri & grafik keimanan</span>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Real-time sync badge or trigger button */}
          {isRealTimeMode && isToday ? (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl select-none"
              title="Checklist otomatis mengikuti tanggal real-time saat hari berganti"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Auto Real-Time ON</span>
            </div>
          ) : (
            <button
              onClick={handleSetToday}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 border border-emerald-700 rounded-xl shadow-xs transition-all"
              title="Kembalikan checklist ke tanggal real-time hari ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ikuti Tanggal Real-Time</span>
            </button>
          )}

          {/* Stepper buttons & Native Date Picker */}
          <div className="flex items-center gap-1 bg-stone-50 p-1 border border-stone-200 rounded-2xl">
            <button
              onClick={() => handleDateShift('prev')}
              className="p-1.5 text-stone-600 hover:bg-stone-200/60 rounded-xl transition-colors"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  onChangeDate(val, val === activeToday);
                }
              }}
              className="px-2.5 py-1 text-xs font-bold text-stone-800 bg-white border border-stone-200 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />

            <button
              onClick={() => handleDateShift('next')}
              className="p-1.5 text-stone-600 hover:bg-stone-200/60 rounded-xl transition-colors"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alert banner if user is viewing historical / past dates */}
      {!isToday && (
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Anda sedang membuka catatan tanggal lampau (<strong>{formatIndonesianFullDate(selectedDate)}</strong>).
            </span>
          </div>
          <button
            onClick={handleSetToday}
            className="px-3 py-1 font-bold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl shadow-2xs transition-colors shrink-0"
          >
            Beralih ke Tanggal Real-Time Hari Ini →
          </button>
        </div>
      )}

      {/* Progress & Live Score Indicator for Selected Date */}
      <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-stone-700">Skor Keimanan ({selectedDate})</span>
            <span className="text-emerald-800 font-bold">{scores.totalScore}%</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-700 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${scores.totalScore}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span className="font-semibold text-emerald-800">{status.title}:</span>
            <span className="truncate">{status.description}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleMarkAllFardhuMosque}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fardhu Berjamaah</span>
          </button>

          {isCalendarConnected && onSyncRecordToCalendar && (
            <button
              onClick={onSyncRecordToCalendar}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Kirim ke Google Calendar</span>
            </button>
          )}
        </div>
      </div>

      {/* Checklist Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('sholat')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'sholat'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Sholat Fardhu & Sunnah</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
            {(Object.values(currentRecord.fardhu) as FardhuRecord[]).filter((f) => f.completed).length}/5
          </span>
        </button>

        <button
          onClick={() => setActiveTab('quran_dzikir')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'quran_dzikir'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Tilawah & Dzikir</span>
          {currentRecord.quran.read && (
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('amal')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'amal'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Amal & Muhasabah</span>
          {currentRecord.amal.sedekah && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
      </div>

      {/* Tab 1: Sholat */}
      {activeTab === 'sholat' && (
        <div className="space-y-6">
          {/* Sholat Fardhu Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Sholat Fardhu 5 Waktu
              </h3>
              <span className="text-xs text-stone-500 font-medium">
                Bobot Paling Utama (45 Poin)
              </span>
            </div>

            <div className="space-y-2.5">
              {FARDHU_LIST.map(({ id, name, arabic }) => {
                const item = currentRecord.fardhu[id];
                return (
                  <div
                    key={id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.completed
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`fardhu-${id}`}
                        checked={item.completed}
                        onChange={(e) => {
                          updateField((draft) => {
                            draft.fardhu[id].completed = e.target.checked;
                            if (e.target.checked && draft.fardhu[id].status === 'belum') {
                              draft.fardhu[id].status = 'jamaah_masjid';
                            }
                          });
                          showFeedback();
                        }}
                        className="w-5 h-5 rounded-lg text-emerald-700 focus:ring-emerald-600 border-stone-300 cursor-pointer accent-emerald-700"
                      />
                      <label
                        htmlFor={`fardhu-${id}`}
                        className="cursor-pointer select-none flex items-baseline gap-2"
                      >
                        <span
                          className={`text-sm font-bold ${
                            item.completed ? 'text-emerald-950 line-through/none' : 'text-stone-800'
                          }`}
                        >
                          {name}
                        </span>
                        <span className="font-arabic text-sm text-stone-400">
                          {arabic}
                        </span>
                      </label>
                    </div>

                    {item.completed && (
                      <div className="flex items-center gap-1.5 pl-8 sm:pl-0">
                        <span className="text-[11px] text-stone-500 mr-1 hidden sm:inline">
                          Pelaksanaan:
                        </span>
                        <select
                          value={item.status}
                          onChange={(e) => {
                            updateField((draft) => {
                              draft.fardhu[id].status = e.target.value as PrayerStatus;
                            });
                          }}
                          className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                        >
                          <option value="jamaah_masjid">Berjamaah di Masjid (+9)</option>
                          <option value="jamaah_rumah">Berjamaah di Rumah (+8)</option>
                          <option value="munfarid">Munfarid / Sendiri Tepat Waktu (+7)</option>
                          <option value="terlambat">Munfarid Di Akhir Waktu (+4)</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sholat Sunnah Section */}
          <div className="pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                Sholat Sunnah Mu'akkadah
              </h3>
              <span className="text-xs text-stone-500 font-medium">
                Penyempurna Ibadah (20 Poin)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUNNAH_LIST.map(({ id, name, desc }) => {
                const isChecked = currentRecord.sunnah[id];
                return (
                  <div
                    key={id}
                    onClick={() => {
                      updateField((draft) => {
                        draft.sunnah[id] = !draft.sunnah[id];
                      });
                      showFeedback();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'bg-teal-50/60 border-teal-200'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                        isChecked
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div
                        className={`text-xs sm:text-sm font-bold ${
                          isChecked ? 'text-teal-950' : 'text-stone-800'
                        }`}
                      >
                        {name}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tilawah & Dzikir */}
      {activeTab === 'quran_dzikir' && (
        <div className="space-y-6">
          {/* Tilawah Al-Qur'an */}
          <div className="bg-sky-50/50 rounded-2xl p-4 sm:p-5 border border-sky-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-700" />
                <h3 className="text-sm font-bold text-stone-900">Tilawah Al-Qur'an</h3>
              </div>
              <input
                type="checkbox"
                id="quran-read"
                checked={currentRecord.quran.read}
                onChange={(e) => {
                  updateField((draft) => {
                    draft.quran.read = e.target.checked;
                    if (e.target.checked && draft.quran.pages === 0) {
                      draft.quran.pages = 2;
                    }
                  });
                  showFeedback();
                }}
                className="w-5 h-5 rounded-lg text-sky-600 focus:ring-sky-500 border-stone-300 cursor-pointer accent-sky-700"
              />
            </div>

            {currentRecord.quran.read && (
              <div className="mt-4 pt-4 border-t border-sky-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Jumlah Lembar / Halaman Dibaca
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentRecord.quran.pages > 1) {
                          updateField((d) => {
                            d.quran.pages -= 1;
                          });
                        }
                      }}
                      className="p-1.5 bg-white border border-sky-200 rounded-lg text-sky-800 hover:bg-sky-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-base font-bold text-stone-900 w-12 text-center">
                      {currentRecord.quran.pages}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateField((d) => {
                          d.quran.pages += 1;
                        });
                      }}
                      className="p-1.5 bg-white border border-sky-200 rounded-lg text-sky-800 hover:bg-sky-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-stone-500 ml-1">halaman</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Surat / Juz (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="misal: Al-Baqarah 1-50, Juz 1"
                    value={currentRecord.quran.surahName || ''}
                    onChange={(e) => {
                      updateField((d) => {
                        d.quran.surahName = e.target.value;
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dzikir Pagi & Petang */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Dzikir Al-Ma'tsurat / Rutin
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => {
                  updateField((d) => {
                    d.dzikir.pagi = !d.dzikir.pagi;
                  });
                  showFeedback();
                }}
                className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                  currentRecord.dzikir.pagi
                    ? 'bg-amber-50/60 border-amber-300'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-stone-900">
                      Dzikir Pagi
                    </div>
                    <div className="text-[11px] text-stone-500">Ba'da Subuh hingga Terbit</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                    currentRecord.dzikir.pagi
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-stone-300 bg-white'
                  }`}
                >
                  {currentRecord.dzikir.pagi && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div
                onClick={() => {
                  updateField((d) => {
                    d.dzikir.petang = !d.dzikir.petang;
                  });
                  showFeedback();
                }}
                className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                  currentRecord.dzikir.petang
                    ? 'bg-indigo-50/60 border-indigo-300'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-stone-900">
                      Dzikir Petang
                    </div>
                    <div className="text-[11px] text-stone-500">Ba'da Ashar hingga Maghrib</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                    currentRecord.dzikir.petang
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-stone-300 bg-white'
                  }`}
                >
                  {currentRecord.dzikir.petang && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* Digital Tasbih (Istighfar & Sholawat) */}
          <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/80">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
              Tasbih Digital Harian (Target 33 - 100x)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Istighfar Counter */}
              <div className="bg-white rounded-xl p-3.5 border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-arabic text-base text-stone-800">أَسْتَغْفِرُ اللَّهَ</div>
                  <div className="text-xs font-bold text-stone-700">Istighfar</div>
                  <div className="text-[11px] text-stone-500">
                    {currentRecord.dzikir.istighfarCount}x terbaca
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateField((d) => {
                        d.dzikir.istighfarCount = 0;
                      });
                    }}
                    title="Reset"
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      updateField((d) => {
                        d.dzikir.istighfarCount = (d.dzikir.istighfarCount || 0) + 1;
                      });
                      if ((currentRecord.dzikir.istighfarCount + 1) === 33 || (currentRecord.dzikir.istighfarCount + 1) === 100) {
                        confetti({ particleCount: 25, spread: 40 });
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 shadow-xs hover:bg-emerald-800 transition-all"
                  >
                    +1 Baca
                  </button>
                </div>
              </div>

              {/* Sholawat Counter */}
              <div className="bg-white rounded-xl p-3.5 border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-arabic text-base text-stone-800">اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ</div>
                  <div className="text-xs font-bold text-stone-700">Sholawat Nabi</div>
                  <div className="text-[11px] text-stone-500">
                    {currentRecord.dzikir.sholawatCount}x terbaca
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateField((d) => {
                        d.dzikir.sholawatCount = 0;
                      });
                    }}
                    title="Reset"
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      updateField((d) => {
                        d.dzikir.sholawatCount = (d.dzikir.sholawatCount || 0) + 1;
                      });
                      if ((currentRecord.dzikir.sholawatCount + 1) === 33 || (currentRecord.dzikir.sholawatCount + 1) === 100) {
                        confetti({ particleCount: 25, spread: 40 });
                      }
                    }}
                    className="px-3 py-1.5 bg-teal-700 text-white text-xs font-bold rounded-xl active:scale-95 shadow-xs hover:bg-teal-800 transition-all"
                  >
                    +1 Baca
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Amal & Muhasabah */}
      {activeTab === 'amal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sedekah */}
            <div
              onClick={() => {
                updateField((d) => {
                  d.amal.sedekah = !d.amal.sedekah;
                });
                showFeedback();
              }}
              className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                currentRecord.amal.sedekah
                  ? 'bg-rose-50/60 border-rose-200'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <HeartHandshake className="w-5 h-5 text-rose-600" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-stone-900">
                    Sedekah Subuh / Harian
                  </div>
                  <div className="text-[11px] text-stone-500">Membuka pintu rezeki & keberkahan</div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                  currentRecord.amal.sedekah
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'border-stone-300 bg-white'
                }`}
              >
                {currentRecord.amal.sedekah && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Puasa */}
            <div
              onClick={() => {
                updateField((d) => {
                  d.amal.puasa = !d.amal.puasa;
                });
                showFeedback();
              }}
              className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                currentRecord.amal.puasa
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-700" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-stone-900">
                    Puasa Sunnah / Wajib
                  </div>
                  <div className="text-[11px] text-stone-500">Senin-Kamis, Daud, atau qadha</div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                  currentRecord.amal.puasa
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'border-stone-300 bg-white'
                }`}
              >
                {currentRecord.amal.puasa && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Menuntut Ilmu */}
            <div
              onClick={() => {
                updateField((d) => {
                  d.amal.menuntutIlmu = !d.amal.menuntutIlmu;
                });
                showFeedback();
              }}
              className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                currentRecord.amal.menuntutIlmu
                  ? 'bg-teal-50/60 border-teal-200'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-teal-700" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-stone-900">
                    Menuntut Ilmu / Kajian
                  </div>
                  <div className="text-[11px] text-stone-500">Membaca buku islami / menyimak tausiyah</div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                  currentRecord.amal.menuntutIlmu
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'border-stone-300 bg-white'
                }`}
              >
                {currentRecord.amal.menuntutIlmu && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Silaturahim */}
            <div
              onClick={() => {
                updateField((d) => {
                  d.amal.silaturahim = !d.amal.silaturahim;
                });
                showFeedback();
              }}
              className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                currentRecord.amal.silaturahim
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <HeartHandshake className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-stone-900">
                    Silaturahim & Berbakti
                  </div>
                  <div className="text-[11px] text-stone-500">Menyapa orang tua / kerabat & teman</div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                  currentRecord.amal.silaturahim
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'border-stone-300 bg-white'
                }`}
              >
                {currentRecord.amal.silaturahim && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Notes / Muhasabah */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Muhasabah & Evaluasi Hati Hari Ini
            </label>
            <textarea
              rows={3}
              placeholder="Catat muhasabah Anda hari ini: kekhilafan yang perlu diistighfari, nikmat yang disyukuri, atau azam perbaikan esok hari..."
              value={currentRecord.notes}
              onChange={(e) => {
                updateField((d) => {
                  d.notes = e.target.value;
                });
              }}
              className="w-full p-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-800 placeholder:text-stone-400"
            />
          </div>
        </div>
      )}

      {/* Save indicator toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Catatan ibadah tersimpan otomatis!</span>
        </div>
      )}
    </div>
  );
};
