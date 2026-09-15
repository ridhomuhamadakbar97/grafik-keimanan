import { getAccessToken } from '../lib/firebase';
import { CalendarSyncEvent, DailyIbadahRecord, PrayerTimeItem } from '../types';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export class GoogleCalendarService {
  /**
   * Check if token is available
   */
  static async hasValidToken(): Promise<boolean> {
    const token = await getAccessToken();
    return !!token;
  }

  /**
   * Fetch recent worship events created by this application
   */
  static async listRecentEvents(): Promise<any[]> {
    const token = await getAccessToken();
    if (!token) throw new Error('Akses Google Calendar belum aktif. Silakan masuk terlebih dahulu.');

    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events?q=Ibadah&timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Gagal mengambil jadwal dari Google Calendar');
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Create a single event in user's primary calendar
   */
  static async createEvent(event: CalendarSyncEvent): Promise<any> {
    const token = await getAccessToken();
    if (!token) throw new Error('Akses Google Calendar belum aktif. Silakan masuk terlebih dahulu.');

    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Gagal menambahkan acara ke Google Calendar');
    }

    return await response.json();
  }

  /**
   * Delete an event from user's primary calendar
   */
  static async deleteEvent(eventId: string): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) throw new Error('Akses Google Calendar belum aktif.');

    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error('Gagal menghapus acara dari Google Calendar');
    }

    return true;
  }

  /**
   * Synchronize completed daily worship record as a calendar summary log
   */
  static async logDailyWorshipSummary(record: DailyIbadahRecord, timezoneOffset = 7): Promise<any> {
    const tzSign = timezoneOffset >= 0 ? '+' : '-';
    const tzFormatted = `${tzSign}${String(Math.abs(timezoneOffset)).padStart(2, '0')}:00`;

    const dateStr = record.date;
    const startDateTime = `${dateStr}T20:30:00${tzFormatted}`;
    const endDateTime = `${dateStr}T21:00:00${tzFormatted}`;

    const fardhuCount = Object.values(record.fardhu).filter(f => f.completed).length;
    const sunnahCount = Object.values(record.sunnah).filter(Boolean).length;

    const summary = `🕌 Catatan Ibadah: Skor Keimanan ${record.faithScore}%`;
    const description = `Ringkasan Catatan Ibadah Harian (${record.date}):
- Skor Keimanan: ${record.faithScore}%
- Sholat Fardhu: ${fardhuCount}/5 terlaksana
- Sholat Sunnah: ${sunnahCount} diamalkan
- Tilawah Al-Qur'an: ${record.quran.read ? `${record.quran.pages} lembar` : 'Belum'}
- Dzikir: Pagi (${record.dzikir.pagi ? '✓' : '✗'}), Petang (${record.dzikir.petang ? '✓' : '✗'})
- Sedekah: ${record.amal.sedekah ? 'Alhamdulillah' : '-'}
- Puasa: ${record.amal.puasa ? 'Berpuasa' : '-'}
${record.notes ? `\nCatatan Muhasabah:\n"${record.notes}"` : ''}

Dibuat otomatis oleh Aplikasi Grafik Keimanan Harian.`;

    return await this.createEvent({
      summary,
      description,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 10 }],
      },
    });
  }

  /**
   * Sync prayer schedule for the day with reminders
   */
  static async syncDayPrayerReminders(
    dateStr: string,
    prayers: PrayerTimeItem[],
    timezoneOffset = 7,
    cityName = ''
  ): Promise<number> {
    const tzSign = timezoneOffset >= 0 ? '+' : '-';
    const tzFormatted = `${tzSign}${String(Math.abs(timezoneOffset)).padStart(2, '0')}:00`;

    let createdCount = 0;
    // Filter to only fardhu prayers (Subuh, Dzuhur, Ashar, Maghrib, Isya)
    const targetPrayers = prayers.filter(p => p.isFardhu || (!['imsak', 'syuruq', 'dhuha'].includes(p.id)));

    for (const prayer of targetPrayers) {
      const startTime = `${dateStr}T${prayer.time}:00${tzFormatted}`;
      // Sholat event duration 25 minutes
      const [hours, mins] = prayer.time.split(':').map(Number);
      const endHour = (hours + Math.floor((mins + 25) / 60)) % 24;
      const endMinute = (mins + 25) % 60;
      const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
      const endDateTime = `${dateStr}T${endTimeStr}:00${tzFormatted}`;

      await this.createEvent({
        summary: `🕋 Waktu Sholat ${prayer.name} (${cityName || 'Kemenag RI'})`,
        description: `Waktu sholat ${prayer.name} (${prayer.time}) telah masuk berdasarkan database resmi Kementerian Agama Republik Indonesia (Bimas Islam). Segerakan mendirikan sholat berjamaah di masjid untuk meraih keutamaan dan menjaga grafik keimanan harian.`,
        start: { dateTime: startTime },
        end: { dateTime: endDateTime },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
            { method: 'popup', minutes: 0 },
          ],
        },
      });
      createdCount++;
    }
    return createdCount;
  }
}
