import React, { useState } from 'react';
import { KeyRound, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotice?: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessNotice }) => {
  const { users, currentUser, login, getRoleDefinition } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser?.id || users[0]?.id || ''
  );
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) return;

    const res = login(pin, targetUser.id);
    if (res.success) {
      setPin('');
      onClose();
      if (onSuccessNotice) {
        onSuccessNotice(`Logged in as ${targetUser.name}`);
      }
    } else {
      setErrorMsg(res.message || 'Incorrect PIN. (Default Admin PIN: admin123, Operator PIN: 1234)');
    }
  };

  const getRoleBadge = (roleId: UserRole) => {
    const roleDef = getRoleDefinition(roleId);
    return (
      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
        {roleDef?.name ? roleDef.name.split(' ')[0] : roleId}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold">User Authentication & Role Switch</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Operator / Staff Profile
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {users
                .filter(u => u.active)
                .map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setErrorMsg('');
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedUserId === u.id
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 text-slate-900 dark:text-white ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                        {u.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email || `Staff ID: ${u.initials}`}</div>
                      </div>
                    </div>
                    {getRoleBadge(u.role)}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Enter User PIN / Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter PIN (e.g. 1234 or admin123)"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            {errorMsg && (
              <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{errorMsg}</p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Staff credentials: Admin: <code className="font-mono text-slate-700 dark:text-slate-300">admin123</code> | Operators: <code className="font-mono text-slate-700 dark:text-slate-300">1234</code>
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              Authenticate & Switch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

