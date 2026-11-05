import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  UserX,
  UserCheck,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { UserProfile, UserRole } from '../types';

interface UserManagerViewProps {
  onSuccessNotice?: (msg: string) => void;
  onRequestDeleteUser: (userId: string, userName: string) => void;
}

export const UserManagerView: React.FC<UserManagerViewProps> = ({
  onSuccessNotice,
  onRequestDeleteUser,
}) => {
  const { users, currentUser, isAdmin, addUser, updateUser, toggleUserStatus, switchUser } = useAuth();
  const { viewingDateStr, historyDB } = useHistory();

  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const dayRecord = historyDB[viewingDateStr] || {};

  // Calculate task contribution counts for today's shift
  const userStats = users.map(u => {
    let inputCount = 0;
    let authCount = 0;

    Object.values(dayRecord).forEach(rec => {
      if (rec.init && rec.init.toUpperCase() === u.initials.toUpperCase()) {
        inputCount++;
      }
      if (rec.auth && rec.auth.toUpperCase() === u.initials.toUpperCase()) {
        authCount++;
      }
    });

    return {
      ...u,
      inputCount,
      authCount,
    };
  });

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingUserId(null);
    setName('');
    setInitials('');
    setRole('operator');
    setPin('1234');
    setEmail('');
    setErrorMsg('');
  };

  const handleStartEdit = (user: UserProfile) => {
    setIsAdding(false);
    setEditingUserId(user.id);
    setName(user.name);
    setInitials(user.initials);
    setRole(user.role);
    setPin(user.pin);
    setEmail(user.email || '');
    setErrorMsg('');
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingUserId(null);
    setErrorMsg('');
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!initials.trim()) {
      setErrorMsg('Staff initials are required (e.g. WA, AR).');
      return;
    }
    if (!pin.trim()) {
      setErrorMsg('PIN / password is required.');
      return;
    }

    if (editingUserId) {
      updateUser(editingUserId, {
        name,
        initials,
        role,
        pin,
        email,
      });
      setEditingUserId(null);
      if (onSuccessNotice) onSuccessNotice(`Profile for ${name} updated successfully.`);
    } else {
      addUser({
        name,
        initials,
        role,
        pin,
        email,
      });
      setIsAdding(false);
      if (onSuccessNotice) onSuccessNotice(`New staff member ${name} (${initials}) created successfully.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            IT Operations Team & Access Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage operator accounts, verification permissions (Maker-Checker), and security PINs.
          </p>
        </div>

        {isAdmin && !isAdding && !editingUserId && (
          <button
            type="button"
            onClick={handleStartAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </button>
        )}
      </div>

      {/* Add / Edit User Form Card */}
      {(isAdding || editingUserId) && (
        <div className="bg-white p-6 rounded-xl border-2 border-blue-500/40 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              {editingUserId ? 'Edit Staff Profile' : 'Register New IT Operations Staff Member'}
            </h3>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveUser} className="space-y-4">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Waqar Ahmed"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Initials (Sign-off code)
                </label>
                <input
                  type="text"
                  value={initials}
                  maxLength={5}
                  onChange={e => setInitials(e.target.value.toUpperCase())}
                  placeholder="e.g. WA"
                  className="w-full px-3 py-2 text-xs font-bold uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white font-medium"
                >
                  <option value="operator">Operation Officer (Operator)</option>
                  <option value="admin">Administrator (Admin)</option>
                </select>
                <span className="block mt-1 text-[11px] text-slate-500">
                  {role === 'operator' && 'Can view the operational task list and fill out shift items.'}
                  {role === 'admin' && 'Full administrator access to all views, SLAs, and settings.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  PIN / Access Code
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <span className="block mt-1 text-[11px] text-slate-500">
                  Used to authenticate and switch active profiles.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Bank Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@soneri.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingUserId ? 'Save Profile Updates' : 'Add Staff Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userStats.map(user => {
          const isCurrent = user.id === currentUser?.id;

          return (
            <div
              key={user.id}
              className={`p-5 rounded-xl border bg-white shadow-xs transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              } ${!user.active ? 'opacity-60 bg-slate-50/70' : ''}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                      {user.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {user.name}
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200">
                            Active Session
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {user.email || 'No email registered'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-sm uppercase tracking-wider ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {user.role === 'admin' ? 'Admin' : 'Operation Officer'}
                  </span>
                </div>

                {/* Shift Activity Metrics */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Tasks Executed:</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {user.inputCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Verifications Signed:</span>
                    <span className="font-mono font-bold text-purple-700 text-sm">
                      {user.authCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!isCurrent && user.active && (
                    <button
                      type="button"
                      onClick={() => switchUser(user.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 rounded-md transition-colors"
                    >
                      Switch To
                    </button>
                  )}
                  <span className="text-[11px] text-slate-400">
                    Status: {user.active ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(user)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit staff profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(user.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          user.active
                            ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={user.active ? 'Deactivate staff account' : 'Reactivate staff account'}
                      >
                        {user.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => onRequestDeleteUser(user.id, user.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete staff account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
