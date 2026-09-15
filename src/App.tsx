import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { PrayerTimeCard } from './components/PrayerTimeCard';
import { FaithCharts } from './components/FaithCharts';
import { DailyIbadahChecklist } from './components/DailyIbadahChecklist';
import { NearbyMosquesCard } from './components/NearbyMosquesCard';
import { QiblaCompassCard } from './components/QiblaCompassCard';
import { CalendarSyncModal } from './components/CalendarSyncModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { CitySelectorModal } from './components/CitySelectorModal';
import { AccountSwitcherModal } from './components/AccountSwitcherModal';
import {
  calculatePrayerTimes,
  getNextPrayer,
  INDONESIAN_CITIES,
  LocationConfig,
} from './utils/prayerTimes';
import { KemenagPrayerService } from './services/kemenagService';
import {
  INITIAL_RECORD,
  calculateFaithScore,
} from './utils/faithScoring';
import { formatLocalDateKey } from './utils/dateUtils';
import { AccountService } from './services/accountService';
import { AppAccount, DailyIbadahRecord, PrayerTimeItem } from './types';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/firebase';
import { GoogleCalendarService } from './services/calendarService';

export default function App() {
  // Real-time Clock State (Ticks every second)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Multi-Account Management State
  const [accounts, setAccounts] = useState<AppAccount[]>(() => AccountService.getAccounts());
  const [activeAccount, setActiveAccount] = useState<AppAccount>(() => AccountService.getActiveAccount());
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // City & Location from Kemenag database
  const [selectedCity, setSelectedCity] = useState<LocationConfig>(() => {
    const saved = localStorage.getItem('kemanag_selected_city');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INDONESIAN_CITIES[0];
  });

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // Selected date for viewing/editing records (Real-time synchronization)
  const todayStr = useMemo(
    () => formatLocalDateKey(currentTime, selectedCity.timezoneOffset),
    [currentTime, selectedCity.timezoneOffset]
  );
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatLocalDateKey(new Date(), selectedCity.timezoneOffset)
  );
  const [isRealTimeMode, setIsRealTimeMode] = useState<boolean>(true);

  // Timezone label (WIB, WITA, WIT)
  const timezoneLabel = useMemo(() => {
    if (selectedCity.timezoneOffset === 9) return 'WIT';
    if (selectedCity.timezoneOffset === 8) return 'WITA';
    return 'WIB';
  }, [selectedCity.timezoneOffset]);

  // When in real-time mode, auto-follow current real-time date (e.g. across midnight)
  useEffect(() => {
    if (isRealTimeMode && selectedDate !== todayStr) {
      setSelectedDate(todayStr);
    }
  }, [isRealTimeMode, todayStr, selectedDate]);

  const handleDateChange = useCallback(
    (newDate: string, isRealTimeIntent?: boolean) => {
      setSelectedDate(newDate);
      if (isRealTimeIntent !== undefined) {
        setIsRealTimeMode(isRealTimeIntent);
      } else {
        setIsRealTimeMode(newDate === todayStr);
      }
    },
    [todayStr]
  );

  // Prayer times state loaded from Kemenag
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeItem[]>(() =>
    calculatePrayerTimes(new Date(), selectedCity)
  );
  const [prayerSource, setPrayerSource] = useState<{ sourceName: string; isLive: boolean }>({
    sourceName: 'Database Resmi Bimas Islam Kemenag RI',
    isLive: true,
  });

  // Stored Records for active account
  const [records, setRecords] = useState<Record<string, DailyIbadahRecord>>(() =>
    AccountService.loadRecordsForAccount(AccountService.getActiveAccountId())
  );

  // Google Calendar & Firebase Auth
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Notification / Alert Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Confirmation modal state for quick calendar action
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

  // Real-time clock interval (1s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist selected city
  useEffect(() => {
    try {
      localStorage.setItem('kemanag_selected_city', JSON.stringify(selectedCity));
    } catch (e) {
      // ignore
    }
  }, [selectedCity]);

  // Load Kemenag Prayer Times when city or selectedDate changes
  useEffect(() => {
    let isCancelled = false;
    async function fetchKemenagSchedule() {
      const targetDate = new Date(selectedDate);
      try {
        const result = await KemenagPrayerService.getPrayerTimes(selectedCity, targetDate);
        if (!isCancelled) {
          setPrayerTimes(result.prayers);
          setPrayerSource({
            sourceName:
              result.source === 'kemenag_api'
                ? `Database Bimas Islam Kemenag RI (Jadwal ${selectedCity.name})`
                : `Kalkulasi Standar Ephemeris Kemenag RI (${selectedCity.name})`,
            isLive: result.source === 'kemenag_api',
          });
        }
      } catch (err) {
        if (!isCancelled) {
          const fallback = calculatePrayerTimes(targetDate, selectedCity);
          setPrayerTimes(fallback);
          setPrayerSource({
            sourceName: `Kalkulasi Standar Ephemeris Kemenag RI (${selectedCity.name})`,
            isLive: false,
          });
        }
      }
    }

    fetchKemenagSchedule();
    return () => {
      isCancelled = true;
    };
  }, [selectedDate, selectedCity]);

  // Firebase Auth listener with automatic multi-account registration
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authUser, token) => {
        setUser(authUser);
        setIsCalendarConnected(!!token);

        if (authUser) {
          try {
            const registered = await AccountService.registerGoogleAccount(authUser);
            setAccounts(AccountService.getAccounts());
            setActiveAccount(registered);

            // Attempt cloud sync for Google account
            const cloudRecords = await AccountService.syncRecordsFromFirestore(registered.id);
            if (cloudRecords) {
              setRecords(cloudRecords);
            } else {
              setRecords(AccountService.loadRecordsForAccount(registered.id));
            }
          } catch (e) {
            console.warn('Could not register Google user into multi-account system', e);
          }
        }
      },
      () => {
        setUser(null);
        setIsCalendarConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setIsCalendarConnected(true);
        const registered = await AccountService.registerGoogleAccount(result.user);
        setAccounts(AccountService.getAccounts());
        setActiveAccount(registered);

        const cloudRecords = await AccountService.syncRecordsFromFirestore(registered.id);
        if (cloudRecords) {
          setRecords(cloudRecords);
        } else {
          setRecords(AccountService.loadRecordsForAccount(registered.id));
        }

        setNotification({
          type: 'success',
          message: `Selamat datang, ${registered.name}. Akun Google berhasil terhubung!`,
        });
      }
    } catch (err: any) {
      console.error('Sign-in error', err);
      setNotification({
        type: 'error',
        message: err.message || 'Gagal masuk dengan akun Google',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Google Sign Out
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setIsCalendarConnected(false);

    // Switch to fallback local account if current was Google
    const accountsList = AccountService.getAccounts();
    const fallback = accountsList.find((a) => a.type === 'local_profile') || accountsList[0];
    if (fallback && fallback.id !== activeAccount.id) {
      handleSelectAccount(fallback.id);
    }

    setNotification({
      type: 'success',
      message: 'Anda telah keluar dari akun Google.',
    });
  };

  // Multi-Account: Switch active account
  const handleSelectAccount = async (accountId: string) => {
    try {
      const switched = AccountService.switchAccount(accountId);
      setActiveAccount(switched);
      const loaded = AccountService.loadRecordsForAccount(switched.id);
      setRecords(loaded);
      setNotification({
        type: 'success',
        message: `Beralih ke akun "${switched.name}". Catatan ibadah dimuat.`,
      });

      if (switched.type === 'google') {
        const cloud = await AccountService.syncRecordsFromFirestore(switched.id);
        if (cloud) setRecords(cloud);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal beralih akun',
      });
    }
  };

  // Multi-Account: Create new local profile (e.g. Ayah, Ibu, Anak)
  const handleCreateLocalProfile = (name: string, roleTag: string, avatarColor: string) => {
    const created = AccountService.createLocalProfile(name, roleTag, avatarColor);
    setAccounts(AccountService.getAccounts());
    setActiveAccount(created);
    setRecords(AccountService.loadRecordsForAccount(created.id));
    setNotification({
      type: 'success',
      message: `Profil baru "${created.name}" (${created.roleTag}) berhasil dibuat dan diaktifkan!`,
    });
  };

  // Multi-Account: Delete account
  const handleDeleteAccount = (accountId: string) => {
    try {
      const { remaining, newActive } = AccountService.deleteAccount(accountId);
      setAccounts(remaining);
      setActiveAccount(newActive);
      setRecords(AccountService.loadRecordsForAccount(newActive.id));
      setNotification({
        type: 'success',
        message: `Akun telah dihapus. Beralih ke akun "${newActive.name}".`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menghapus akun',
      });
    }
  };

  // Multi-Account: Update profile info
  const handleUpdateAccount = (accountId: string, updates: Partial<AppAccount>) => {
    try {
      const updated = AccountService.updateAccount(accountId, updates);
      setAccounts(AccountService.getAccounts());
      if (activeAccount.id === accountId) {
        setActiveAccount(updated);
      }
      setNotification({
        type: 'success',
        message: `Profil "${updated.name}" berhasil diperbarui.`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal memperbarui profil',
      });
    }
  };

  // Next prayer countdown
  const nextPrayerInfo = useMemo(() => {
    // Only calculate countdown for current day
    const isToday = selectedDate === todayStr;
    if (!isToday || prayerTimes.length === 0) return null;

    const next = getNextPrayer(prayerTimes, currentTime);
    return {
      prayer: next.nextPrayer,
      minutes: next.minutesRemaining,
      seconds: next.secondsRemaining,
    };
  }, [selectedDate, todayStr, currentTime, prayerTimes]);

  // Current selected record
  const currentRecord = useMemo(() => {
    return records[selectedDate] || INITIAL_RECORD(selectedDate);
  }, [records, selectedDate]);

  // Today's record for KPI stats
  const todayRecord = useMemo(() => {
    return records[todayStr] || INITIAL_RECORD(todayStr);
  }, [records, todayStr]);

  // Update Record Callback scoped to active account
  const handleUpdateRecord = useCallback((updated: DailyIbadahRecord) => {
    AccountService.saveRecordForAccount(activeAccount.id, updated);
    setRecords((prev) => ({
      ...prev,
      [updated.date]: updated,
    }));
  }, [activeAccount.id]);

  // Quick Action from Prayer Card
  const handleSyncPrayersFromCard = () => {
    if (!isCalendarConnected) {
      handleSignIn();
      return;
    }
    setIsCalendarModalOpen(true);
  };

  // Quick Action: Sync Record to Calendar with explicit confirmation
  const handleSyncRecordToCalendar = () => {
    if (!isCalendarConnected) {
      handleSignIn();
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Simpan Catatan Ibadah ke Google Calendar?',
      message: `Aplikasi akan mencatat ringkasan ibadah tanggal ${selectedDate} dengan Skor Keimanan ${currentRecord.faithScore}% ke Google Calendar Anda.`,
      isDestructive: false,
      onConfirm: async () => {
        try {
          await GoogleCalendarService.logDailyWorshipSummary(currentRecord, selectedCity.timezoneOffset);
          setNotification({
            type: 'success',
            message: `Catatan ibadah tanggal ${selectedDate} berhasil dikirim ke Google Calendar!`,
          });
        } catch (err: any) {
          setNotification({
            type: 'error',
            message: err.message || 'Gagal mengirim catatan ke Google Calendar',
          });
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-800 flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        currentTime={currentTime}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        onOpenCitySelector={() => setIsCityModalOpen(true)}
        user={user}
        activeAccount={activeAccount}
        accountsCount={accounts.length}
        onOpenAccountSwitcher={() => setIsAccountModalOpen(true)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        isLoggingIn={isLoggingIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 font-bold text-stone-500 hover:text-stone-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Real-time Prayer Time Banner & Countdown based on Kemenag */}
        <PrayerTimeCard
          prayers={prayerTimes}
          nextPrayer={nextPrayerInfo}
          selectedCity={selectedCity}
          onSyncToCalendar={handleSyncPrayersFromCard}
          isCalendarConnected={isCalendarConnected}
          onOpenCitySelector={() => setIsCityModalOpen(true)}
          sourceName={prayerSource.sourceName}
          isLiveApi={prayerSource.isLive}
        />

        {/* 2. Interactive Digital Qibla Compass (Arah Kiblat Berdasarkan Kompas) */}
        <QiblaCompassCard selectedCity={selectedCity} />

        {/* 3. Interactive Faith Charts (Grafik Keimanan) */}
        <FaithCharts
          records={records}
          todayRecord={todayRecord}
        />

        {/* 3. Nearby Mosques & Musholas (Google Maps Platform) */}
        <NearbyMosquesCard selectedCity={selectedCity} />

        {/* 4. Daily Ibadah Checklist Tracker (Real-Time Synchronized) */}
        <DailyIbadahChecklist
          currentRecord={currentRecord}
          onUpdateRecord={handleUpdateRecord}
          selectedDate={selectedDate}
          onChangeDate={handleDateChange}
          onSyncRecordToCalendar={handleSyncRecordToCalendar}
          isCalendarConnected={isCalendarConnected}
          todayDateStr={todayStr}
          isRealTimeMode={isRealTimeMode}
          onToggleRealTimeMode={setIsRealTimeMode}
          currentTime={currentTime}
          timezoneLabel={timezoneLabel}
        />
      </main>

      {/* City Selector Modal (Direct search in Kemenag Bimas Islam DB) */}
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          setSelectedCity(city);
          setNotification({
            type: 'success',
            message: `Kota berhasil diubah ke ${city.name} (${city.daerah || 'Kemenag RI'}). Jadwal sholat diperbarui.`,
          });
        }}
      />

      {/* Multi-Account Switcher & Profile Modal */}
      <AccountSwitcherModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectAccount={handleSelectAccount}
        onCreateLocalProfile={handleCreateLocalProfile}
        onSignInWithGoogle={handleSignIn}
        onDeleteAccount={handleDeleteAccount}
        onUpdateAccount={handleUpdateAccount}
        isLoggingIn={isLoggingIn}
      />

      {/* Google Calendar Management Modal */}
      <CalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        prayers={prayerTimes}
        selectedDate={selectedDate}
        selectedCity={selectedCity}
        currentRecord={currentRecord}
      />

      {/* Confirmation Modal for Quick Mutating Action */}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Subtle Spiritual Footer with Kemenag attribution */}
      <footer className="bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500 space-y-1">
        <p className="font-semibold text-stone-700">
          Grafik Keimanan Harian • Evaluasi Diri & Tazkiyatun Nafs
        </p>
        <p className="text-[11px] text-stone-400">
          Waktu sholat disinkronkan dengan database resmi Direktorat Jenderal Bimas Islam Kementerian Agama RI.
        </p>
      </footer>
    </div>
  );
}
