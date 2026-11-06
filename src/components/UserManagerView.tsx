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
  Search,
  Filter,
  Briefcase,
  Shield,
  Check,
  Plus,
  Lock,
  Layers,
  Settings,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { UserProfile, UserRole, RoleDefinition, RolePermissions } from '../types';

interface UserManagerViewProps {
  onSuccessNotice?: (msg: string) => void;
  onRequestDeleteUser: (userId: string, userName: string) => void;
}

const COLOR_OPTIONS: { id: RoleDefinition['color']; label: string; bgClass: string; textClass: string; borderClass: string }[] = [
  { id: 'purple', label: 'Purple', bgClass: 'bg-purple-100 dark:bg-purple-900/40', textClass: 'text-purple-800 dark:text-purple-300', borderClass: 'border-purple-200 dark:border-purple-800' },
  { id: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-100 dark:bg-emerald-900/40', textClass: 'text-emerald-800 dark:text-emerald-300', borderClass: 'border-emerald-200 dark:border-emerald-800' },
  { id: 'blue', label: 'Blue', bgClass: 'bg-blue-100 dark:bg-blue-900/40', textClass: 'text-blue-800 dark:text-blue-300', borderClass: 'border-blue-200 dark:border-blue-800' },
  { id: 'amber', label: 'Amber', bgClass: 'bg-amber-100 dark:bg-amber-900/40', textClass: 'text-amber-800 dark:text-amber-300', borderClass: 'border-amber-200 dark:border-amber-800' },
  { id: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-100 dark:bg-indigo-900/40', textClass: 'text-indigo-800 dark:text-indigo-300', borderClass: 'border-indigo-200 dark:border-indigo-800' },
  { id: 'cyan', label: 'Cyan', bgClass: 'bg-cyan-100 dark:bg-cyan-900/40', textClass: 'text-cyan-800 dark:text-cyan-300', borderClass: 'border-cyan-200 dark:border-cyan-800' },
  { id: 'rose', label: 'Rose', bgClass: 'bg-rose-100 dark:bg-rose-900/40', textClass: 'text-rose-800 dark:text-rose-300', borderClass: 'border-rose-200 dark:border-rose-800' },
  { id: 'slate', label: 'Slate', bgClass: 'bg-slate-100 dark:bg-slate-800', textClass: 'text-slate-800 dark:text-slate-200', borderClass: 'border-slate-200 dark:border-slate-700' },
];

export const UserManagerView: React.FC<UserManagerViewProps> = ({
  onSuccessNotice,
  onRequestDeleteUser,
}) => {
  const {
    users,
    roles,
    currentUser,
    isAdmin,
    addUser,
    updateUser,
    toggleUserStatus,
    switchUser,
    addRole,
    updateRole,
    deleteRole,
    getRoleDefinition,
  } = useAuth();
  const { viewingDateStr, historyDB } = useHistory();

  const [activeSubTab, setActiveSubTab] = useState<'staff' | 'roles'>('staff');

  // Staff Form states
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [userPin, setUserPin] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userDepartment, setUserDepartment] = useState('');
  const [userFormError, setUserFormError] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Role Form states (Custom Roles)
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleColor, setRoleColor] = useState<RoleDefinition['color']>('indigo');
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({
    canViewChecklist: true,
    canExecuteTasks: true,
    canVerifyTasks: false,
    canManageTasks: false,
    canManageCategories: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canAccessSettings: false,
  });
  const [roleFormError, setRoleFormError] = useState('');

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
      const roleDef = getRoleDefinition(u.role);
      const roleDisplayName = roleDef ? roleDef.name.toLowerCase() : u.role.toLowerCase();

      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.initials.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        roleDisplayName.includes(q) ||
        u.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [userStats, searchQuery, roleFilter, getRoleDefinition]);

  // Helpers for role styles
  const getBadgeClasses = (colorName: RoleDefinition['color']) => {
    const matched = COLOR_OPTIONS.find(c => c.id === colorName) || COLOR_OPTIONS[2];
    return `${matched.bgClass} ${matched.textClass} border ${matched.borderClass}`;
  };

  // Staff Form Handlers
  const handleStartAddUser = () => {
    setIsAddingUser(true);
    setEditingUserId(null);
    setUserName('');
    setUserInitials('');
    setUserRole(roles[1]?.id || 'operator');
    setUserPin('1234');
    setUserEmail('');
    setUserDepartment('Core Banking Shift A');
    setUserFormError('');
  };

  const handleStartEditUser = (user: UserProfile) => {
    setIsAddingUser(false);
    setEditingUserId(user.id);
    setUserName(user.name);
    setUserInitials(user.initials);
    setUserRole(user.role);
    setUserPin(user.pin);
    setUserEmail(user.email || '');
    setUserDepartment(user.department || '');
    setUserFormError('');
  };

  const handleCancelUserForm = () => {
    setIsAddingUser(false);
    setEditingUserId(null);
    setUserFormError('');
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setUserFormError('Full name is required.');
      return;
    }
    if (!userInitials.trim()) {
      setUserFormError('Staff initials are required (e.g. WA, AR).');
      return;
    }
    if (!userPin.trim()) {
      setUserFormError('PIN / password is required.');
      return;
    }

    if (editingUserId) {
      updateUser(editingUserId, {
        name: userName,
        initials: userInitials,
        role: userRole,
        pin: userPin,
        email: userEmail,
        department: userDepartment,
      });
      setEditingUserId(null);
      if (onSuccessNotice) onSuccessNotice(`Profile for ${userName} updated successfully.`);
    } else {
      addUser({
        name: userName,
        initials: userInitials,
        role: userRole,
        pin: userPin,
        email: userEmail,
        department: userDepartment,
      });
      setIsAddingUser(false);
      if (onSuccessNotice) onSuccessNotice(`New staff profile ${userName} (${userInitials}) registered.`);
    }
  };

  // Role Form Handlers (Custom Roles)
  const handleStartAddRole = () => {
    setIsAddingRole(true);
    setEditingRoleId(null);
    setRoleName('');
    setRoleDescription('');
    setRoleColor('indigo');
    setRolePermissions({
      canViewChecklist: true,
      canExecuteTasks: true,
      canVerifyTasks: false,
      canManageTasks: false,
      canManageCategories: false,
      canManageUsers: false,
      canViewAnalytics: false,
      canAccessSettings: false,
    });
    setRoleFormError('');
  };

  const handleStartEditRole = (roleItem: RoleDefinition) => {
    setIsAddingRole(false);
    setEditingRoleId(roleItem.id);
    setRoleName(roleItem.name);
    setRoleDescription(roleItem.description);
    setRoleColor(roleItem.color);
    setRolePermissions({ ...roleItem.permissions });
    setRoleFormError('');
  };

  const handleCancelRoleForm = () => {
    setIsAddingRole(false);
    setEditingRoleId(null);
    setRoleFormError('');
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setRoleFormError('Role Title / Name is required.');
      return;
    }

    if (editingRoleId) {
      updateRole(editingRoleId, {
        name: roleName.trim(),
        description: roleDescription.trim(),
        color: roleColor,
        permissions: rolePermissions,
      });
      setEditingRoleId(null);
      if (onSuccessNotice) onSuccessNotice(`Custom role "${roleName}" updated successfully.`);
    } else {
      addRole({
        name: roleName.trim(),
        description: roleDescription.trim() || 'Custom operational banking role with specialized shift permissions.',
        color: roleColor,
        permissions: rolePermissions,
      });
      setIsAddingRole(false);
      if (onSuccessNotice) onSuccessNotice(`New custom role "${roleName}" created successfully.`);
    }
  };

  const handleDeleteRole = (roleItem: RoleDefinition) => {
    const res = deleteRole(roleItem.id);
    if (!res.success) {
      if (onSuccessNotice) onSuccessNotice(`Cannot delete role: ${res.message}`);
    } else {
      if (onSuccessNotice) onSuccessNotice(`Role "${roleItem.name}" deleted.`);
    }
  };

  const togglePermission = (key: keyof RolePermissions) => {
    setRolePermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tabs */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            IT Operations Personnel & Custom Role Governance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure staff profiles, assign multi-tier responsibilities, and create bespoke operational roles.
          </p>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('staff');
              handleCancelRoleForm();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'staff'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Roster ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('roles');
              handleCancelUserForm();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'roles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Custom Roles & Permissions ({roles.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: STAFF ROSTER
         ========================================================================= */}
      {activeSubTab === 'staff' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
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
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {isAdmin && !isAddingUser && !editingUserId && (
                <button
                  type="button"
                  onClick={handleStartAddUser}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Staff Member
                </button>
              )}
            </div>
          </div>

          {/* Add / Edit User Form Card */}
          {(isAddingUser || editingUserId) && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-blue-500/40 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {editingUserId ? 'Edit Staff Profile' : 'Register New Banking Operations Staff Member'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelUserForm}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                {userFormError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-md">
                    {userFormError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="e.g. Waqar Ahmed"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Staff Initials (Sign-off Code) *
                    </label>
                    <input
                      type="text"
                      value={userInitials}
                      maxLength={5}
                      onChange={e => setUserInitials(e.target.value.toUpperCase())}
                      placeholder="e.g. WA"
                      className="w-full px-3 py-2 text-xs font-bold uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Department / Shift Branch
                    </label>
                    <input
                      type="text"
                      value={userDepartment}
                      onChange={e => setUserDepartment(e.target.value)}
                      placeholder="e.g. Core Banking Shift A"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Assigned Role (Built-in or Custom) *
                    </label>
                    <select
                      value={userRole}
                      onChange={e => setUserRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-semibold"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} {!r.isSystem ? '(Custom Role)' : ''}
                        </option>
                      ))}
                    </select>
                    <span className="block mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {getRoleDefinition(userRole)?.description}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Security PIN / Password *
                    </label>
                    <input
                      type="password"
                      value={userPin}
                      onChange={e => setUserPin(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    <span className="block mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Used by staff to log in and stamp shift routines.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Bank Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={e => setUserEmail(e.target.value)}
                      placeholder="name@soneri.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelUserForm}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {editingUserId ? 'Save Profile Updates' : 'Register Staff Member'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Staff Roster Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => {
              const isCurrent = user.id === currentUser?.id;
              const roleDef = getRoleDefinition(user.role);
              const badgeClass = getBadgeClasses(roleDef?.color || 'slate');

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
                                Current
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shrink-0 ${badgeClass}`}
                      >
                        {roleDef?.name || user.role}
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
                          onClick={() => handleStartEditUser(user)}
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
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: CUSTOM ROLES & PERMISSIONS GOVERNANCE
         ========================================================================= */}
      {activeSubTab === 'roles' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Custom Role Definitions & Access Rights
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define custom roles with custom badges and fine-grained permissions for specialized banking operations.
              </p>
            </div>

            {isAdmin && !isAddingRole && !editingRoleId && (
              <button
                type="button"
                onClick={handleStartAddRole}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Custom Role
              </button>
            )}
          </div>

          {/* Add / Edit Role Form Card */}
          {(isAddingRole || editingRoleId) && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-indigo-500/40 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {editingRoleId ? 'Edit Role Configuration' : 'Create New Custom Operational Banking Role'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelRoleForm}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRole} className="space-y-4">
                {roleFormError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-md">
                    {roleFormError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Role Title / Name *
                    </label>
                    <input
                      type="text"
                      value={roleName}
                      onChange={e => setRoleName(e.target.value)}
                      placeholder="e.g. Lead Database Administrator, Network Operations Officer, DR Coordinator"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Badge Color Theme
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_OPTIONS.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setRoleColor(c.id)}
                          className={`flex items-center justify-center p-1.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                            roleColor === c.id
                              ? `${c.bgClass} ${c.textClass} ring-2 ring-blue-500 border-blue-600`
                              : `${c.bgClass} ${c.textClass} opacity-70 hover:opacity-100`
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Role Description & Operational Scope
                  </label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={e => setRoleDescription(e.target.value)}
                    placeholder="e.g. Oversees core database backups, tape archiving and COB exception resolution."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Granular Permissions Checkboxes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Granular Access Permissions (Check All That Apply)
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rolePermissions.canViewChecklist}
                        onChange={() => togglePermission('canViewChecklist')}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">View Shift Checklist</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Can view the daily operational SOP task list and shift history.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rolePermissions.canExecuteTasks}
                        onChange={() => togglePermission('canExecuteTasks')}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Execute Tasks & Input Initials</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Can check off items, stamp execution timestamps, and record initials.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rolePermissions.canVerifyTasks}
                        onChange={() => togglePermission('canVerifyTasks')}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Authorize & Dual-Verify (4-Eyes Principle)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Can sign off as Auth/Supervisor on completed operational tasks.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rolePermissions.canManageTasks}
                        onChange={() => togglePermission('canManageTasks')}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Manage Master Tasks & SLAs</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Can add, edit, reorder, delete SOP tasks and modify cutoff SLA targets.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rolePermissions.canManageCategories}
                        onChange={() => togglePermission('canManageCategories')}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Manage Shift Categories</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Can create, rename, and edit short descriptions of shift sections.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rolePermissions.canManageUsers}
                        onChange={() => togglePermission('canManageUsers')}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Manage Personnel & Custom Roles</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Can register staff accounts, set passwords, and create custom roles.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rolePermissions.canViewAnalytics}
                        onChange={() => togglePermission('canViewAnalytics')}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Shift Analytics & Audit Reports</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Can view 7-day trend graphs, team breakdown, and export reports.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rolePermissions.canAccessSettings}
                        onChange={() => togglePermission('canAccessSettings')}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Portal Theming & Branding Controls</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Can configure themes, custom hex colors, logo uploads, and branch details.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelRoleForm}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {editingRoleId ? 'Save Role Changes' : 'Create Role'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Roles Roster List */}
          <div className="space-y-3">
            {roles.map(r => {
              const assignedCount = users.filter(u => u.role === r.id).length;
              const badgeClass = getBadgeClasses(r.color);

              return (
                <div
                  key={r.id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-sm uppercase tracking-wide ${badgeClass}`}>
                        {r.name}
                      </span>
                      {r.isSystem ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          Built-in System Role
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Custom Role
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        {assignedCount} staff member{assignedCount === 1 ? '' : 's'} assigned
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl">
                      {r.description}
                    </p>

                    {/* Permissions summary pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {r.permissions.canViewChecklist && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Checklist View
                        </span>
                      )}
                      {r.permissions.canExecuteTasks && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Execute Tasks
                        </span>
                      )}
                      {r.permissions.canVerifyTasks && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Dual Verification
                        </span>
                      )}
                      {r.permissions.canManageTasks && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Manage SOPs
                        </span>
                      )}
                      {r.permissions.canManageCategories && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Manage Categories
                        </span>
                      )}
                      {r.permissions.canManageUsers && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Manage Staff
                        </span>
                      )}
                      {r.permissions.canViewAnalytics && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Check className="w-3 h-3 text-sky-600 dark:text-sky-400" /> Shift Analytics
                        </span>
                      )}
                      {r.permissions.canAccessSettings && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Portal Controls
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Actions */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditRole(r)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit role permissions"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {!r.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(r)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors cursor-pointer"
                          title="Delete custom role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
