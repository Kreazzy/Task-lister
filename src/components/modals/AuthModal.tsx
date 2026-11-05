import React, { useState } from 'react';
import { KeyRound, UserCheck, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotice?: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessNotice }) => {
  const { users, currentUser, switchUser, loginWithPin } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) return;

    // Check PIN (or master override)
    if (targetUser.pin === pin || pin === 'admin123') {
      loginWithPin(targetUser.id, pin);
      setPin('');
      onClose();
      if (onSuccessNotice) {
        onSuccessNotice(`Logged in as ${targetUser.name} (${targetUser.role.toUpperCase()})`);
      }
    } else {
      setErrorMsg('Incorrect PIN. (Default Admin PIN: admin123, Operator PIN: 1234)');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === 'admin') {
      return <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-purple-100 text-purple-800">Admin</span>;
    }
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">Operation Officer</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold">User Authentication & Role Switch</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
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
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                      selectedUserId === u.id
                        ? 'border-blue-500 bg-blue-50/70 text-slate-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                        {u.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email || 'No email registered'}</div>
                      </div>
                    </div>
                    {getRoleBadge(u.role)}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Enter User PIN / Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter PIN (e.g. 1234 or admin123)"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            {errorMsg && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errorMsg}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Demo defaults: Admin: <code className="font-mono text-slate-700">admin123</code> | Operators: <code className="font-mono text-slate-700">1234</code>
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500"
            >
              Authenticate & Switch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
