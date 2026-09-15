import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppAccount, DailyIbadahRecord } from '../types';
import { INITIAL_RECORD, calculateFaithScore } from '../utils/faithScoring';
import { formatLocalDateKey } from '../utils/dateUtils';

const ACCOUNTS_STORAGE_KEY = 'faith_accounts_list_v2';
const ACTIVE_ACCOUNT_KEY = 'faith_active_account_id_v2';
const LEGACY_STORAGE_KEY = 'daily_faith_records_v1';

export const AVATAR_COLORS = [
  { id: 'emerald', name: 'Zamrud', bg: 'bg-emerald-700', text: 'text-white', border: 'border-emerald-600' },
  { id: 'teal', name: 'Toska', bg: 'bg-teal-700', text: 'text-white', border: 'border-teal-600' },
  { id: 'indigo', name: 'Nila', bg: 'bg-indigo-700', text: 'text-white', border: 'border-indigo-600' },
  { id: 'amber', name: 'Kuning Jingga', bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-500' },
  { id: 'rose', name: 'Mawar', bg: 'bg-rose-700', text: 'text-white', border: 'border-rose-600' },
  { id: 'sky', name: 'Langit', bg: 'bg-sky-600', text: 'text-white', border: 'border-sky-500' },
];

export const ROLE_PRESETS = [
  'Utama',
  'Ayah',
  'Ibu',
  'Anak',
  'Kakak',
  'Adik',
  'Kakek',
  'Nenek',
  'Santri',
  'Pribadi',
];

/**
 * Service to manage multiple user accounts and profiles within one application
 */
export class AccountService {
  /**
   * Get all registered accounts/profiles
   */
  static getAccounts(): AppAccount[] {
    try {
      const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading accounts from localStorage', e);
    }

    // Default initial account
    const defaultAccount: AppAccount = {
      id: 'profile_default',
      type: 'local_profile',
      name: 'Akun Utama',
      roleTag: 'Utama',
      avatarColor: 'emerald',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([defaultAccount]));
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, defaultAccount.id);
    } catch (e) {
      // ignore
    }

    return [defaultAccount];
  }

  /**
   * Get the current active account ID
   */
  static getActiveAccountId(): string {
    const savedId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    const accounts = this.getAccounts();
    if (savedId && accounts.some((a) => a.id === savedId)) {
      return savedId;
    }
    return accounts[0].id;
  }

  /**
   * Get the active account object
   */
  static getActiveAccount(): AppAccount {
    const accounts = this.getAccounts();
    const activeId = this.getActiveAccountId();
    return accounts.find((a) => a.id === activeId) || accounts[0];
  }

  /**
   * Switch the active account
   */
  static switchAccount(accountId: string): AppAccount {
    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      throw new Error(`Akun dengan ID ${accountId} tidak ditemukan.`);
    }

    target.lastActive = new Date().toISOString();
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, target.id);
    this.saveAccounts(accounts);
    return target;
  }

  /**
   * Add a new local/family profile
   */
  static createLocalProfile(name: string, roleTag: string = 'Keluarga', avatarColor: string = 'emerald'): AppAccount {
    const accounts = this.getAccounts();
    const id = `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAccount: AppAccount = {
      id,
      type: 'local_profile',
      name: name.trim() || 'Profil Anggota',
      roleTag: roleTag || 'Keluarga',
      avatarColor: avatarColor || 'emerald',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    accounts.push(newAccount);
    this.saveAccounts(accounts);
    this.switchAccount(newAccount.id);
    return newAccount;
  }

  /**
   * Register or update a Google authenticated account in the multi-account registry
   */
  static async registerGoogleAccount(user: User): Promise<AppAccount> {
    const accounts = this.getAccounts();
    let account = accounts.find((a) => a.id === user.uid);

    if (account) {
      // Update existing Google account
      account.name = user.displayName || account.name;
      account.email = user.email || account.email;
      account.photoURL = user.photoURL || account.photoURL;
      account.lastActive = new Date().toISOString();
    } else {
      // New Google account
      account = {
        id: user.uid,
        type: 'google',
        name: user.displayName || user.email || 'Pengguna Google',
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        avatarColor: 'teal',
        roleTag: 'Google',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      accounts.push(account);
    }

    this.saveAccounts(accounts);
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, account.id);

    // Save profile to Firestore
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          name: account.name,
          email: account.email || '',
          photoURL: account.photoURL || '',
          roleTag: account.roleTag,
          avatarColor: account.avatarColor,
          lastActive: account.lastActive,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Could not sync user profile to Firestore:', e);
    }

    return account;
  }

  /**
   * Update account information
   */
  static updateAccount(accountId: string, updates: Partial<AppAccount>): AppAccount {
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.id === accountId);
    if (index === -1) {
      throw new Error('Akun tidak ditemukan');
    }

    accounts[index] = {
      ...accounts[index],
      ...updates,
      lastActive: new Date().toISOString(),
    };

    this.saveAccounts(accounts);
    return accounts[index];
  }

  /**
   * Delete an account and its local data
   */
  static deleteAccount(accountId: string): { remaining: AppAccount[]; newActive: AppAccount } {
    let accounts = this.getAccounts();
    if (accounts.length <= 1) {
      throw new Error('Tidak dapat menghapus satu-satunya akun aktif.');
    }

    accounts = accounts.filter((a) => a.id !== accountId);
    // Remove scoped records
    try {
      localStorage.removeItem(`faith_records_${accountId}`);
    } catch (e) {
      // ignore
    }

    const currentActiveId = this.getActiveAccountId();
    let newActive: AppAccount;
    if (currentActiveId === accountId) {
      newActive = accounts[0];
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, newActive.id);
    } else {
      newActive = accounts.find((a) => a.id === currentActiveId) || accounts[0];
    }

    this.saveAccounts(accounts);
    return { remaining: accounts, newActive };
  }

  /**
   * Save accounts list to localStorage
   */
  private static saveAccounts(accounts: AppAccount[]) {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Error saving accounts to localStorage', e);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Scoped Records Management Per Account                                      */
  /* -------------------------------------------------------------------------- */

  /**
   * Get storage key for an account's records
   */
  private static getRecordsStorageKey(accountId: string): string {
    return `faith_records_${accountId}`;
  }

  /**
   * Load daily worship records for a specific account
   */
  static loadRecordsForAccount(accountId: string): Record<string, DailyIbadahRecord> {
    const key = this.getRecordsStorageKey(accountId);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading scoped records', e);
    }

    // If this is default profile and legacy storage exists, migrate it!
    if (accountId === 'profile_default') {
      try {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          const parsedLegacy = JSON.parse(legacy);
          if (typeof parsedLegacy === 'object' && parsedLegacy !== null) {
            localStorage.setItem(key, legacy);
            return parsedLegacy;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // Return initial today's record using local date
    const todayStr = formatLocalDateKey(new Date());
    const initial = {
      [todayStr]: INITIAL_RECORD(todayStr),
    };

    try {
      localStorage.setItem(key, JSON.stringify(initial));
    } catch (e) {
      // ignore
    }

    return initial;
  }

  /**
   * Save a single record for a specific account
   */
  static async saveRecordForAccount(accountId: string, record: DailyIbadahRecord): Promise<void> {
    const key = this.getRecordsStorageKey(accountId);
    let allRecords = this.loadRecordsForAccount(accountId);
    allRecords[record.date] = record;

    try {
      localStorage.setItem(key, JSON.stringify(allRecords));
    } catch (e) {
      console.warn('Error saving scoped record to localStorage', e);
    }

    // If account is Google account, sync to Firestore
    const account = this.getAccounts().find((a) => a.id === accountId);
    if (account?.type === 'google') {
      try {
        await setDoc(
          doc(db, 'users', accountId, 'records', record.date),
          {
            date: record.date,
            faithScore: record.faithScore,
            fardhu: record.fardhu,
            sunnah: record.sunnah,
            quran: record.quran,
            dzikir: record.dzikir,
            amal: record.amal,
            notes: record.notes || '',
            syncedToCalendar: !!record.syncedToCalendar,
            updatedAt: record.updatedAt || new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Could not sync record to Firestore:', err);
      }
    }
  }

  /**
   * Sync records from Firestore for a Google account
   */
  static async syncRecordsFromFirestore(accountId: string): Promise<Record<string, DailyIbadahRecord> | null> {
    try {
      const recordsRef = collection(db, 'users', accountId, 'records');
      const snapshot = await getDocs(recordsRef);
      if (snapshot.empty) return null;

      const localRecords = this.loadRecordsForAccount(accountId);
      let hasUpdates = false;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DailyIbadahRecord;
        if (data.date) {
          localRecords[data.date] = data;
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        localStorage.setItem(this.getRecordsStorageKey(accountId), JSON.stringify(localRecords));
        return localRecords;
      }
    } catch (e) {
      console.warn('Firestore sync failed, using local records', e);
    }
    return null;
  }
}
