import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AddressSettings, AttendanceSettings, Holiday, GmcPolicySettings, PerfiosApiSettings, SurepassApiSettings, AuthbridgeApiSettings, OtpSettings, NotificationSettings } from '../types';

interface SettingsState {
  demoMode: boolean;
  address: AddressSettings;
  attendance: AttendanceSettings;
  holidays: Holiday[];
  gmcPolicy: GmcPolicySettings;
  perfiosApi: PerfiosApiSettings;
  surepassApi: SurepassApiSettings;
  authbridgeApi: AuthbridgeApiSettings;
  otp: OtpSettings;
  notifications: NotificationSettings;
  toggleDemoMode: () => void;
  updateAddressSettings: (settings: Partial<AddressSettings>) => void;
  updateAttendanceSettings: (settings: Partial<AttendanceSettings>) => void;
  updateGmcPolicySettings: (settings: Partial<GmcPolicySettings>) => void;
  updatePerfiosApiSettings: (settings: Partial<PerfiosApiSettings>) => void;
  updateSurepassApiSettings: (settings: Partial<SurepassApiSettings>) => void;
  updateAuthbridgeApiSettings: (settings: Partial<AuthbridgeApiSettings>) => void;
  updateOtpSettings: (settings: Partial<OtpSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  addHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  removeHoliday: (id: string) => void;
}

const initialAddress: AddressSettings = {
    enablePincodeVerification: true,
};

const initialAttendance: AttendanceSettings = {
    minimumHoursFullDay: 8,
    minimumHoursHalfDay: 4,
    annualEarnedLeaves: 5,
    annualSickLeaves: 12,
    monthlyFloatingLeaves: 1,
    enableAttendanceNotifications: false,
};

const initialHolidays: Holiday[] = [
    { id: 'hol_1', date: '2024-08-15', name: 'Independence Day' },
    { id: 'hol_2', date: '2024-10-02', name: 'Gandhi Jayanti' },
    { id: 'hol_3', date: '2024-12-25', name: 'Christmas' },
];

const initialGmcPolicy: GmcPolicySettings = {
  applicability: 'Optional - Opt-in Default',
  optInDisclaimer: 'Please note that currently the GMC facility covers only spouse and two children. If you would like to continue, please select below relationships and submit.',
  coverageDetails: 'Spouse and two children',
  optOutDisclaimer: 'Please note that you are opting out of the GMC Facility. You will have to submit a declaration to the company towards the same along with proof of your existing insurance.',
  requireAlternateInsurance: true,
  collectProvider: true,
  collectStartDate: true,
  collectEndDate: true,
  collectExtentOfCover: true,
};

const initialPerfiosApi: PerfiosApiSettings = {
    enabled: true,
    endpoint: 'https://api.perfios.com/v1/verify',
    apiKey: 'xxxxxxxxxxxxxxxxxxxx',
    clientSecret: 'yyyyyyyyyyyyyyyyyyyy',
};

const initialSurepassApi: SurepassApiSettings = {
    enabled: false,
    endpoint: 'https://api.surepass.io/v1/',
    apiKey: '',
    token: '',
};

const initialAuthbridgeApi: AuthbridgeApiSettings = {
    enabled: false,
    endpoint: 'https://api.authbridge.com/v1/',
    username: '',
    password: '',
};

const initialOtp: OtpSettings = {
    enabled: true,
};

const initialNotifications: NotificationSettings = {
    email: {
        enabled: false,
    }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      demoMode: true,
      address: initialAddress,
      attendance: initialAttendance,
      holidays: initialHolidays,
      gmcPolicy: initialGmcPolicy,
      perfiosApi: initialPerfiosApi,
      surepassApi: initialSurepassApi,
      authbridgeApi: initialAuthbridgeApi,
      otp: initialOtp,
      notifications: initialNotifications,
      toggleDemoMode: () => set((state) => ({ demoMode: !state.demoMode })),
      updateAddressSettings: (settings) => set((state) => ({
        address: { ...state.address, ...settings }
      })),
      updateAttendanceSettings: (settings) => set((state) => ({
          attendance: { ...state.attendance, ...settings }
      })),
      updateGmcPolicySettings: (settings) => set((state) => ({
          gmcPolicy: { ...state.gmcPolicy, ...settings }
      })),
      updatePerfiosApiSettings: (settings) => set((state) => ({
          perfiosApi: { ...state.perfiosApi, ...settings }
      })),
      updateSurepassApiSettings: (settings) => set((state) => ({
        surepassApi: { ...state.surepassApi, ...settings }
      })),
      updateAuthbridgeApiSettings: (settings) => set((state) => ({
          authbridgeApi: { ...state.authbridgeApi, ...settings }
      })),
      updateOtpSettings: (settings) => set((state) => ({
        otp: { ...state.otp, ...settings }
      })),
      updateNotificationSettings: (settings) => set((state) => ({
        notifications: { 
            ...state.notifications, 
            ...settings,
            email: { ...state.notifications.email, ...settings.email }
        }
      })),
      addHoliday: (holiday) => set((state) => ({
          holidays: [...state.holidays, { ...holiday, id: `hol_${Date.now()}` }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      })),
      removeHoliday: (id) => set((state) => ({
          holidays: state.holidays.filter(h => h.id !== id)
      })),
    }),
    {
      name: 'paradigm_app_settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);