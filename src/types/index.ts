export type ProfileCategory =
  | 'Utility'
  | 'Browser'
  | 'Prod Server'
  | 'Server'
  | 'EMAIL'
  | 'Validation'
  | 'Process'
  | 'DB Server'
  | 'Service'
  | 'Other';

export interface TaskItem {
  sr: number;
  nature: string;
  time: string;
  task: string;
  profile: ProfileCategory | string;
  note?: string;
  order?: number;
}

export interface SectionConfig {
  key: string;
  title: string;
  description?: string;
}

export interface TaskExecution {
  checked: boolean;
  time: string;
  init: string;
  auth: string;
  completedAt?: string;
  completedByUserId?: string;
  verifiedByUserId?: string;
}

// History DB format: { [dateStr: "YYYY-MM-DD"]: { [taskKey: `${sectionKey}-${sr}`]: TaskExecution } }
export type HistoryDB = Record<string, Record<string, TaskExecution>>;

export type UserRole = 'admin' | 'operator' | 'supervisor' | 'auditor' | 'manager';

export interface UserProfile {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  pin: string;
  email?: string;
  active: boolean;
  createdAt: string;
  department?: string;
}

export interface SlaMilestone {
  id: string;
  taskKey: string; // e.g. "morn-1" or "daily-19"
  label: string;
  targetTime: string;
  isMandatory: boolean;
}

export type ViewTab = 'checklist' | 'analytics' | 'categories' | 'users';

export type ThemePalette =
  | 'bank-blue'
  | 'islamic-emerald'
  | 'royal-indigo'
  | 'corporate-amber'
  | 'midnight-dark'
  | 'crimson-ruby'
  | 'custom';

export type LayoutDensity = 'comfortable' | 'compact' | 'ultra-compact';
export type LayoutFormat = 'sections' | 'timeline';

export interface AppSettings {
  theme: ThemePalette;
  customColor?: string; // hex code for custom theme
  darkMode: boolean;
  logoType: 'default' | 'custom' | 'icon';
  logoUrl?: string; // custom image url or data URL
  density: LayoutDensity;
  layoutFormat: LayoutFormat;
  portalTitle: string;
  portalSubtitle: string;
  branchName: string;
  customFooterText: string;
  showVersionOnRight: boolean;
}
