import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, ChevronRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { UserProfile } from '../types';

export const LoginScreen: React.FC = () => {
  const { users, roles, login, getRoleDefinition } = useAuth();
  const { settings, toggleDarkMode } = useSettings();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const activeUsers = users.filter(u => u.active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pin.trim()) {
      setErrorMsg('Please enter your security PIN / Password.');
      return;
    }

    const res = login(pin, selectedUser?.id);
    if (!res.success) {
      setErrorMsg(res.message || 'Incorrect PIN. Please try again.');
    }
  };

  const getRoleBadgeClasses = (roleId: string) => {
    const roleDef = getRoleDefinition(roleId);
    const color = roleDef?.color || 'blue';
    switch (color) {
      case 'purple':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'amber':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'cyan':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'rose':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'slate':
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 transition-colors duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Bank Security Banner */}
        <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md">
              SB
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Soneri Bank Limited</h1>
              <p className="text-xs text-slate-400">IT Operations Directorate · Secure Shift Access</p>
            </div>
          </div>

          {/* Quick Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors cursor-pointer"
            title={settings.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {settings.darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Login Body */}
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Restricted Operations Authentication</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your registered staff profile and enter your PIN to access shift checklists.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* User selector cards */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Staff Profile
            </label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {activeUsers.map(u => {
                const isSelected = selectedUser?.id === u.id;
                const roleDef = getRoleDefinition(u.role);
                const roleBadgeClass = getRoleBadgeClasses(u.role);

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(u);
                      setErrorMsg('');
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-slate-900 dark:text-white ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-200">
                        {u.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{u.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {u.email || `Staff ID: ${u.initials}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs border ${roleBadgeClass}`}>
                        {roleDef?.name ? roleDef.name.split(' ')[0] : u.role}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {selectedUser ? `Enter PIN for ${selectedUser.name}` : 'Enter Staff PIN / Password'}
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (e.g. 1234 or admin123)"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 font-mono"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <span>Authenticate & Enter Portal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Default Staff Credentials:</div>
            <div>• Administrator: PIN <code className="font-mono text-slate-800 dark:text-slate-200 font-bold">admin123</code></div>
            <div>• Operations Team: PIN <code className="font-mono text-slate-800 dark:text-slate-200 font-bold">1234</code></div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Soneri Bank IT Operations · Authorized Banking Personnel Only
        </div>
      </div>
    </div>
  );
};

