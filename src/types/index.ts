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

export type BuiltInRole = 'admin' | 'operator' | 'supervisor' | 'auditor' | 'manager';
export type UserRole = BuiltInRole | string;

export interface RolePermissions {
  canViewChecklist: boolean;
  canExecuteTasks: boolean; // check off tasks & time
  canVerifyTasks: boolean; // dual-control auth sign-off
  canManageTasks: boolean; // add/edit/delete tasks & SLAs
  canManageCategories: boolean; // add/edit shift categories
  canManageUsers: boolean; // add/edit staff profiles and custom roles
  canViewAnalytics: boolean; // view charts and export reports
  canAccessSettings: boolean; // theme & branding control panel
}

export interface RoleDefinition {
  id: string; // e.g. "admin", "operator", "supervisor", "auditor", "manager", or custom "role_xyz"
  name: string; // Display Name, e.g. "Lead Database Administrator"
  description: string;
  isSystem?: boolean; // system built-in roles cannot be deleted
  color: 'purple' | 'emerald' | 'blue' | 'amber' | 'indigo' | 'cyan' | 'rose' | 'slate';
  permissions: RolePermissions;
}

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
