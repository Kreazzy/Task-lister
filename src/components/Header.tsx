import React from 'react';
import {
  Calendar,
  Clock,
  RotateCcw,
  Printer,
  Mail,
  FileJson,
  Layers,
  BarChart3,
  CheckSquare,
  Users,
  LogOut,
  Sliders,
  Moon,
  Sun,
  Shield,
  Building,
} from 'lucide-react';
import { ViewTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { useSettings } from '../context/SettingsContext';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenEmailModal: () => void;
  onOpenBackupModal: () => void;
  onOpenAuthModal: () => void;
  onOpenPortalSettings: () => void;
  onRequestResetDay: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenEmailModal,
  onOpenBackupModal,
  onOpenAuthModal,
  onOpenPortalSettings,
  onRequestResetDay,
}) => {
  const { currentUser, isAdmin, logout, canViewAnalytics } = useAuth();
  const { settings, toggleDarkMode } = useSettings();
  const {
    todayDateStr,
    viewingDateStr,
    availableDates,
    setViewingDate,
    lastSaveTime,
    getOverallStats,
  } = useHistory();

  const isBrowsingHistory = viewingDateStr !== todayDateStr;
  const overall = getOverallStats();

  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Dynamic theme accent border and button classes
  const getThemeAccentClass = () => {
    if (settings.theme === 'custom') return '';
    switch (settings.theme) {
      case 'islamic-emerald':
        return 'border-emerald-600';
      case 'royal-indigo':
        return 'border-indigo-600';
      case 'corporate-amber':
        return 'border-amber-600';
      case 'crimson-ruby':
        return 'border-rose-600';
      case 'midnight-dark':
        return 'border-slate-500';
      case 'bank-blue':
      default:
        return 'border-blue-600';
    }
  };

  const getThemeBadgeBg = () => {
    if (settings.theme === 'custom') return '';
    switch (settings.theme) {
      case 'islamic-emerald':
        return 'bg-emerald-600';
      case 'royal-indigo':
        return 'bg-indigo-600';
      case 'corporate-amber':
        return 'bg-amber-600';
      case 'crimson-ruby':
        return 'bg-rose-600';
      case 'midnight-dark':
        return 'bg-slate-700';
      case 'bank-blue':
      default:
        return 'bg-blue-600';
    }
  };

  const getActiveTabClass = () => {
    if (settings.theme === 'custom') return 'bg-blue-600 text-white shadow-xs';
    switch (settings.theme) {
      case 'islamic-emerald':
        return 'bg-emerald-600 text-white shadow-xs';
      case 'royal-indigo':
        return 'bg-indigo-600 text-white shadow-xs';
      case 'corporate-amber':
        return 'bg-amber-600 text-white shadow-xs';
      case 'crimson-ruby':
        return 'bg-rose-600 text-white shadow-xs';
      case 'midnight-dark':
        return 'bg-slate-700 text-white shadow-xs';
      case 'bank-blue':
      default:
        return 'bg-blue-600 text-white shadow-xs';
    }
  };

  return (
    <header
      className={`bg-slate-900 text-white rounded-xl shadow-lg border-t-4 ${getThemeAccentClass()} mb-6 overflow-hidden transition-all`}
      style={settings.theme === 'custom' && settings.customColor ? { borderTopColor: settings.customColor } : {}}
    >
      {/* PRINT-ONLY COMPACT EXECUTIVE HEADER (1-Line Print Header) */}
      <div className="hidden print:block p-2 text-black border-b border-black text-xs">
        <div className="flex items-center justify-between font-bold">
          <div className="text-sm uppercase tracking-wide">
            {settings.portalTitle || 'Soneri Bank Limited'} · {settings.branchName || 'IT Operations'}
          </div>
          <div className="font-mono">
            Date: {viewingDateStr} | Shift Certified: {overall.percentage}% ({overall.completed}/{overall.total})
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-700 mt-0.5">
          <span>{settings.portalSubtitle || 'Core Banking Shift Execution SOP'}</span>
          <span>Printed on: {new Date().toLocaleString()} · System Standard V5.2</span>
        </div>
      </div>

      {/* Screen Top Bar: Brand & Logo | Navigation Tabs | Actions & Version on Right */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between px-6 py-4 border-b border-slate-800 gap-4 print:hidden">
        {/* Brand & Logo Zone */}
        <div className="flex items-center gap-3 shrink-0">
          {settings.logoType === 'custom' && settings.logoUrl ? (
            <div className="h-10 px-2 rounded-lg bg-white/95 flex items-center justify-center shadow-sm">
              <img src={settings.logoUrl} alt="Bank Logo" className="h-7 w-auto max-w-[120px] object-contain" />
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-xl ${getThemeBadgeBg()} flex items-center justify-center font-black text-white text-lg tracking-wider shadow-sm`}
              style={settings.theme === 'custom' && settings.customColor ? { backgroundColor: settings.customColor } : {}}
            >
              SB
            </div>
          )}

          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              {settings.portalTitle || 'Soneri Bank Limited'}
            </h1>
            <p className="text-xs text-slate-400">
              {settings.portalSubtitle || 'Core Banking Operations & Handover Portal'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Available based on permissions) */}
        {isAdmin || canViewAnalytics ? (
          <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => onSelectTab('checklist')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                currentTab === 'checklist'
                  ? getActiveTabClass()
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Checklist
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                currentTab === 'analytics'
                  ? getActiveTabClass()
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Shift Analytics & Graphs
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => onSelectTab('categories')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  currentTab === 'categories'
                    ? getActiveTabClass()
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Categories & SOP
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => onSelectTab('users')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  currentTab === 'users'
                    ? getActiveTabClass()
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Staff & Roles
              </button>
            )}
          </nav>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-white">Daily Operational Task List</span>
            <span className="text-slate-400 text-[11px]">· Operation Officer Mode</span>
          </div>
        )}

        {/* User Account, Controls & Version on Right */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {/* Active User Badge / Switcher */}
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
            title="Click to switch active user or verify credentials"
          >
            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
              {currentUser?.initials || 'SB'}
            </div>
            <span className="font-medium truncate max-w-[110px]">{currentUser?.name || 'Staff User'}</span>
            <span
              className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-xs ${
                currentUser?.role === 'admin'
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                  : currentUser?.role === 'supervisor'
                  ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                  : currentUser?.role === 'auditor'
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                  : currentUser?.role === 'manager'
                  ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                  : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
              }`}
            >
              {currentUser?.role || 'Operator'}
            </span>
          </button>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-1.5">
            {/* Dark Mode Quick Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors cursor-pointer"
              title={settings.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {settings.darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Admin Appearance / Format Settings */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenPortalSettings}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Portal Controls: Theme Colors, Layout & Branding (Admin)"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenEmailModal}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Generate Email / Excel Summary"
            >
              <Mail className="w-4 h-4 text-sky-400" />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={onOpenBackupModal}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="JSON Backup & Restore (Admin)"
              >
                <FileJson className="w-4 h-4 text-blue-400" />
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Print Optimized Checklist (Compact 1-2 pages)"
            >
              <Printer className="w-4 h-4 text-slate-300" />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={onRequestResetDay}
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                title="Reset Day Progress (Admin)"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
              </button>
            )}

            {/* Logout / Lock Session */}
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors ml-1 cursor-pointer"
              title="Lock & Log Out Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Software Version Badge Moved to Right Side as Requested */}
          {settings.showVersionOnRight && (
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap">
                IT Ops V5.2
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Meta Bar: Date Switcher, Auto-Save Status & Progress */}
      <div className="px-6 py-3 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          {/* Live Today Badge */}
          <div className="flex items-center gap-2 text-sky-400 font-medium">
            <Calendar className="w-4 h-4" />
            <span>Today: {formattedToday}</span>
          </div>

          {/* Viewing Date Switcher */}
          <div className="flex items-center gap-2 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700">
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              Viewing Shift:
            </span>
            <select
              value={viewingDateStr}
              onChange={e => setViewingDate(e.target.value)}
              className="bg-slate-900 text-amber-300 font-mono text-xs px-2 py-0.5 rounded-sm border border-amber-900/80 focus:outline-hidden"
            >
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {date === todayDateStr ? `${date} (Live Today)` : date}
                </option>
              ))}
            </select>

            {isBrowsingHistory && (
              <button
                type="button"
                onClick={() => setViewingDate(todayDateStr)}
                className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 underline ml-1 cursor-pointer"
              >
                Back to Today
              </button>
            )}
          </div>

          {/* Storage Auto-Saved */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300">{lastSaveTime}</span>
          </div>
        </div>

        {/* Overall Completion Metric (Displaying completed / total, and max Sr) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-slate-400">Shift Completion: </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {overall.percentage}% ({overall.completed}/{overall.total})
            </span>
            {overall.maxSr > overall.total && (
              <span className="text-[10px] font-mono text-slate-400 block">
                Tasks range through #{overall.maxSr}
              </span>
            )}
          </div>
          <div className="w-32 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-300 ${
                overall.percentage === 100
                  ? 'bg-emerald-500'
                  : overall.percentage > 50
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${overall.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Amber Historical Alert Banner */}
      {isBrowsingHistory && (
        <div className="px-6 py-2 bg-amber-950/80 border-t border-amber-800 text-amber-200 text-xs flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold">Notice:</span>
            <span>
              You are currently viewing and editing the shift history for{' '}
              <strong className="font-mono text-amber-100">{viewingDateStr}</strong>. Changes made
              here update that past record, not today&apos;s live shift.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setViewingDate(todayDateStr)}
            className="px-2.5 py-1 text-xs font-semibold bg-amber-900 hover:bg-amber-800 text-amber-100 rounded-md transition-colors cursor-pointer"
          >
            Switch to Live Shift
          </button>
        </div>
      )}
    </header>
  );
};
