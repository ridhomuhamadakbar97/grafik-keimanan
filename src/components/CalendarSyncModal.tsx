import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Trash2,
  CheckCircle2,
  X,
  ExternalLink,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { DailyIbadahRecord, PrayerTimeItem } from '../types';
import { LocationConfig } from '../utils/prayerTimes';
import { GoogleCalendarService } from '../services/calendarService';
import { ConfirmationModal } from './ConfirmationModal';
import { formatIndonesianFullDate } from '../utils/dateUtils';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayers: PrayerTimeItem[];
  selectedDate: string;
  selectedCity: LocationConfig;
  currentRecord: DailyIbadahRecord;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  prayers,
  selectedDate,
  selectedCity,
  currentRecord,
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: false,
    onConfirm: async () => {},
  });

  const loadEvents = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const items = await GoogleCalendarService.listRecentEvents();
      setEvents(items);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat acara Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sync Prayer Reminders with confirmation
  const handleSchedulePrayers = () => {
    setConfirmConfig({
      isOpen: true,
      title: `Jadwalkan Waktu Sholat Kemenag RI (${selectedCity.name})?`,
      message: `Aplikasi akan menambahkan pengingat jadwal sholat fardhu (Subuh, Dzuhur, Ashar, Maghrib, Isya) berdasarkan database resmi Kementerian Agama RI untuk ${selectedCity.name} pada ${formatIndonesianFullDate(selectedDate)} ke Google Calendar utama Anda, lengkap dengan notifikasi sebelum adzan.`,
      isDestructive: false,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          const count = await GoogleCalendarService.syncDayPrayerReminders(
            selectedDate,
            prayers,
            selectedCity.timezoneOffset,
            selectedCity.name
          );
          setActionSuccess(`Berhasil menambahkan ${count} jadwal sholat Kemenag RI ke Google Calendar!`);
          await loadEvents();
        } catch (e: any) {
          setErrorMsg(e.message || 'Gagal menjadwalkan ke Google Calendar');
        } finally {
          setIsLoading(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Log worship score to calendar with confirmation
  const handleLogWorshipSummary = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Simpan Catatan Ibadah ke Google Calendar?',
      message: `Aplikasi akan membuat satu acara catatan ringkasan ibadah untuk tanggal ${selectedDate} dengan Skor Keimanan ${currentRecord.faithScore}% ke Google Calendar Anda.`,
      isDestructive: false,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await GoogleCalendarService.logDailyWorshipSummary(currentRecord, selectedCity.timezoneOffset);
          setActionSuccess('Catatan keimanan harian berhasil dicatat di Google Calendar!');
          await loadEvents();
        } catch (e: any) {
          setErrorMsg(e.message || 'Gagal mencatat ke Google Calendar');
        } finally {
          setIsLoading(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Delete event with confirmation
  const handleDeleteEvent = (eventId: string, summary: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Acara dari Google Calendar?',
      message: `Apakah Anda yakin ingin menghapus "${summary}" dari Google Calendar Anda? Tindakan ini tidak dapat dibatalkan.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await GoogleCalendarService.deleteEvent(eventId);
          setActionSuccess(`Acara "${summary}" berhasil dihapus.`);
          await loadEvents();
        } catch (e: any) {
          setErrorMsg(e.message || 'Gagal menghapus acara');
        } finally {
          setIsLoading(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Integrasi Google Calendar
                </h3>
                <p className="text-xs text-stone-500">
                  Sinkronkan pengingat waktu sholat & catatan keimanan harian
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

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Feedback Banners */}
            {actionSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
                <button
                  onClick={() => setActionSuccess(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs"
                >
                  Tutup
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
                <span>{errorMsg}</span>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="text-rose-700 hover:text-rose-900 text-xs"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleSchedulePrayers}
                disabled={isLoading}
                className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Jadwal Sholat 5 Waktu
                  </span>
                  <PlusCircle className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="mt-2 text-sm font-extrabold text-stone-900">
                  Sinkronkan Pengingat Sholat
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Tambahkan jadwal sholat {selectedDate} ke kalender dengan alarm sebelum adzan.
                </p>
              </button>

              <button
                onClick={handleLogWorshipSummary}
                disabled={isLoading}
                className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                    Jurnal Keimanan
                  </span>
                  <PlusCircle className="w-4 h-4 text-teal-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="mt-2 text-sm font-extrabold text-stone-900">
                  Catat Evaluasi Hari Ini
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Simpan ringkasan ibadah (skor: {currentRecord.faithScore}%) sebagai jurnal spiritual di Google Calendar.
                </p>
              </button>
            </div>

            {/* Recent Events List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Acara Ibadah di Google Calendar
                </h4>
                <button
                  onClick={loadEvents}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Segarkan</span>
                </button>
              </div>

              {isLoading && events.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  Memuat acara kalender...
                </div>
              ) : events.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50">
                  <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-stone-500">
                    Belum ada jadwal ibadah yang disinkronkan ke Google Calendar.
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Gunakan tombol di atas untuk menyinkronkan pengingat sholat.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  {events.map((evt) => {
                    const startRaw = evt.start?.dateTime || evt.start?.date;
                    const startDate = startRaw ? new Date(startRaw) : null;
                    return (
                      <div
                        key={evt.id}
                        className="p-3.5 hover:bg-stone-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-stone-900 truncate">
                            {evt.summary}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>
                              {startDate
                                ? startDate.toLocaleDateString('id-ID', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {evt.htmlLink && (
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              title="Buka di Google Calendar"
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.summary)}
                            title="Hapus acara"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-400">
              Sinkronisasi aman menggunakan OAuth token in-memory
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-100"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
        isLoading={isLoading}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
