import React, { useState, useMemo } from 'react';
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
  Search,
  Filter,
  Briefcase,
  Shield,
  HelpCircle,
  Eye,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { UserProfile, UserRole } from '../types';

interface UserManagerViewProps {
  onSuccessNotice?: (msg: string) => void;
  onRequestDeleteUser: (userId: string, userName: string) => void;
}

const ROLE_INFO: Record<
  UserRole,
  {
    name: string;
    badgeClass: string;
    desc: string;
    permissions: string[];
  }
> = {
  admin: {
    name: 'Administrator',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    desc: 'Full administrative control over portal settings, users, categories, master SOPs, and system backups.',
    permissions: ['Manage SOP Tasks & Categories', 'Manage Users & Permissions', 'Configure Portal Appearance & SLAs', 'Maker & Checker Sign-off', 'Access All Analytics & Reports', 'Export & Reset Day Data'],
  },
  operator: {
    name: 'Operation Officer',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    desc: 'Shift execution officer who executes core routines, checks tasks, and signs off as Inputer.',
    permissions: ['View Daily Checklist', 'Mark Tasks Complete', 'Log Execution Times', 'Sign as Inputer (Initials)'],
  },
  supervisor: {
    name: 'Shift Supervisor',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    desc: 'Operational supervisor responsible for double verification (Verifier / Auth), SLA monitoring, and handover verification.',
    permissions: ['Dual Verification / Auth Sign-off', 'Shift Progress Monitoring', 'View Analytics & Audit Reports', 'SLA Cutoff Inspection', 'Print Handover Summaries'],
  },
  auditor: {
    name: 'Audit & Compliance Officer',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    desc: 'Compliance and internal audit personnel with read-only inspection access to shift archives and audit reports.',
    permissions: ['Read-Only Audit Review', 'Historical Shift Inspection', 'Export Audit Reports & Excel', 'SLA Breach Analysis'],
  },
  manager: {
    name: 'Operations Manager',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
    desc: 'Senior management overseeing 24/7 bank operations, productivity trends, pass/fail status, and shift handovers.',
    permissions: ['Executive Dashboard Review', 'Dual Auth / Verifier Sign-off', 'Team Productivity Analytics', 'Export Formal Shift Audits', 'View All Shift Categories'],
  },
};

export const UserManagerView: React.FC<UserManagerViewProps> = ({
  onSuccessNotice,
  onRequestDeleteUser,
}) => {
  const { users, currentUser, isAdmin, addUser, updateUser, toggleUserStatus, switchUser } = useAuth();
  const { viewingDateStr, historyDB } = useHistory();

  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const dayRecord = historyDB[viewingDateStr] || {};

  // Calculate task contribution counts for today's shift
  const userStats = useMemo(() => {
    return users.map(u => {
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
  }, [users, dayRecord]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return userStats.filter(u => {
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.initials.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [userStats, searchQuery, roleFilter]);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingUserId(null);
    setName('');
    setInitials('');
    setRole('operator');
    setPin('1234');
    setEmail('');
    setDepartment('IT Operations');
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
    setDepartment(user.department || '');
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
        department,
      });
      setEditingUserId(null);
      if (onSuccessNotice) onSuccessNotice(`Profile for ${name} (${ROLE_INFO[role]?.name}) updated successfully.`);
    } else {
      addUser({
        name,
        initials,
        role,
        pin,
        email,
        department,
      });
      setIsAdding(false);
      if (onSuccessNotice) onSuccessNotice(`New staff profile ${name} (${initials}) created successfully.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            IT Operations Team & Role Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage multi-tier access: Administrator, Operation Officer, Shift Supervisor, Auditor, and Operations Manager.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMatrixModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
            title="View Role Permissions Matrix"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Permissions Matrix
          </button>

          {isAdmin && !isAdding && !editingUserId && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff Member
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, initials, email, role, or department..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Roles ({userStats.length})</option>
            <option value="admin">Administrators</option>
            <option value="operator">Operation Officers</option>
            <option value="supervisor">Shift Supervisors</option>
            <option value="auditor">Auditors & Compliance</option>
            <option value="manager">Operations Managers</option>
          </select>
        </div>
      </div>

      {/* Add / Edit User Form Card */}
      {(isAdding || editingUserId) && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-blue-500/40 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {editingUserId ? 'Edit Staff Profile' : 'Register New Banking Operations Staff Member'}
            </h3>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveUser} className="space-y-4">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-md">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Waqar Ahmed"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Staff Initials (Sign-off Code)
                </label>
                <input
                  type="text"
                  value={initials}
                  maxLength={5}
                  onChange={e => setInitials(e.target.value.toUpperCase())}
                  placeholder="e.g. WA"
                  className="w-full px-3 py-2 text-xs font-bold uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Department / Branch
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Core Banking Shift A"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Assigned Banking Role
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="operator">Operation Officer (Inputer)</option>
                  <option value="supervisor">Shift Supervisor (Verifier)</option>
                  <option value="manager">Operations Manager</option>
                  <option value="auditor">Audit & Compliance Officer</option>
                  <option value="admin">System Administrator</option>
                </select>
                <span className="block mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {ROLE_INFO[role]?.desc}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Security PIN / Password
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <span className="block mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Used by staff to log in and sign routines.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Bank Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@soneri.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                {editingUserId ? 'Save Profile Updates' : 'Add Staff Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const isCurrent = user.id === currentUser?.id;
          const info = ROLE_INFO[user.role] || ROLE_INFO.operator;

          return (
            <div
              key={user.id}
              className={`p-5 rounded-xl border bg-white dark:bg-slate-800 shadow-xs transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              } ${!user.active ? 'opacity-60 bg-slate-50/70 dark:bg-slate-800/50' : ''}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                      {user.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {user.name}
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {user.email || `Staff ID: ${user.initials}`}
                      </div>
                      {user.department && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3" />
                          <span>{user.department}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shrink-0 ${info.badgeClass}`}
                  >
                    {info.name}
                  </span>
                </div>

                {/* Shift Activity Metrics */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Executed as Inputer:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {user.inputCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Verified as Auth:</span>
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-300 text-sm">
                      {user.authCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!isCurrent && user.active && (
                    <button
                      type="button"
                      onClick={() => switchUser(user.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 border border-blue-200 dark:border-blue-800 rounded-md transition-colors cursor-pointer"
                    >
                      Switch To
                    </button>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {user.active ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(user)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors cursor-pointer"
                      title="Edit staff profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(user.id)}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          user.active
                            ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
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
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors cursor-pointer"
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

      {/* Role Permissions Matrix Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Banking Role Permissions Matrix</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Role-based access control (RBAC) configured for IT Operations shift security and regulatory compliance:
              </p>

              <div className="space-y-3">
                {(Object.entries(ROLE_INFO) as [UserRole, typeof ROLE_INFO[UserRole]][]).map(([roleKey, data]) => (
                  <div
                    key={roleKey}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide ${data.badgeClass}`}>
                          {data.name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Role ID: {roleKey}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{data.desc}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {data.permissions.map((perm, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md"
                        >
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
