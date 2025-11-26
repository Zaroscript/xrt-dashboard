import { loadCompanySettings } from "@/utils/settings";

export interface ProfileSettings {
  name: string;
  email: string;
  company: string;
  bio: string;
}

export interface CompanySettings {
  name: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
  taxId: string;
  website: string;
  logo: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  supportTickets: boolean;
  newUsers: boolean;
  payments: boolean;
  systemUpdates: boolean;
}

export interface Moderator {
  name: string;
  email: string;
  role: "moderator" | "user";
}

// State interface
export interface SettingsState {
  // State
  profileSettings: ProfileSettings;
  companySettings: CompanySettings;
  notificationSettings: NotificationSettings;
  moderators: Moderator[];
  newModerator: { name: string; email: string };
  saveStatus: { type: 'idle' | 'success' | 'error'; message: string };
  theme: 'light' | 'dark' | 'system';
  _hasHydrated: boolean;
}

// Actions interface
export interface SettingsActions {
  setProfileSettings: (settings: Partial<ProfileSettings>) => void;
  setCompanySettings: (settings: Partial<CompanySettings>) => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setNewModerator: (moderator: { name: string; email: string }) => void;
  addModerator: () => void;
  removeModerator: (email: string) => void;
  setSaveStatus: (status: { type: 'idle' | 'success' | 'error'; message: string }) => void;
  saveSettings: () => Promise<boolean>;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setHydrated: (state: boolean) => void;
}

// Combined store type
export interface SettingsStore extends SettingsState, SettingsActions {}

// Initial state
export const initialSettingsState: SettingsState = {
  profileSettings: {
    name: "Admin User",
    email: "admin@xrt-tech.com",
    company: "Xrt-tech Ltd",
    bio: "Administration platform for Xrt-tech products and services.",
  },
  companySettings: {
    name: "Xrt-tech Ltd",
    companyName: "Xrt-tech Ltd",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    email: "",
    phone: "",
    taxId: "",
    website: "",
    logo: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    currency: "USD",
    ...loadCompanySettings()
  },
  notificationSettings: {
    emailNotifications: true,
    pushNotifications: true,
    supportTickets: true,
    newUsers: true,
    payments: true,
    systemUpdates: true,
  },
  moderators: [],
  newModerator: { name: "", email: "" },
  saveStatus: { type: 'idle', message: '' },
  theme: 'system',
  _hasHydrated: false,
};

