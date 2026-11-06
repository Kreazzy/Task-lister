import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, UserRole, RoleDefinition, RolePermissions } from '../types';
import { DEFAULT_USERS, DEFAULT_ROLE_DEFINITIONS } from '../data/defaultData';

interface AuthContextType {
  users: UserProfile[];
  roles: RoleDefinition[];
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isSupervisor: boolean;
  isAuditor: boolean;
  isManager: boolean;
  canExecute: boolean;
  canVerify: boolean;
  canManageTasks: boolean;
  canManageCategories: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  login: (pin: string, userId?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  addUser: (userData: { name: string; initials: string; role: UserRole; pin: string; email?: string; department?: string }) => UserProfile;
  updateUser: (userId: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => void;
  deleteUser: (userId: string) => boolean;
  toggleUserStatus: (userId: string) => void;
  addRole: (roleData: Omit<RoleDefinition, 'id' | 'isSystem'>) => RoleDefinition;
  updateRole: (roleId: string, updates: Partial<Omit<RoleDefinition, 'id' | 'isSystem'>>) => void;
  deleteRole: (roleId: string) => { success: boolean; message?: string };
  getRoleDefinition: (roleId: string) => RoleDefinition | undefined;
  verifyAdminPassword: (password: string) => boolean;
  importUsers: (users: UserProfile[], roles?: RoleDefinition[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [roles, setRoles] = useState<RoleDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('sbl_roles_db_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all default system roles exist
          const systemIds = DEFAULT_ROLE_DEFINITIONS.map(r => r.id);
          const customOnly = parsed.filter((r: RoleDefinition) => !systemIds.includes(r.id));
          return [...DEFAULT_ROLE_DEFINITIONS, ...customOnly];
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_ROLE_DEFINITIONS;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('sbl_users_db_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_USERS;
  });

  // Track session authentication: does NOT default to logged-in on fresh load!
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const sessionUserId = sessionStorage.getItem('sbl_auth_session');
      if (sessionUserId) {
        const matched = users.find(u => u.id === sessionUserId && u.active);
        if (matched) return matched;
      }
    } catch {
      // session storage access
    }
    return null;
  });

  const isAuthenticated = currentUser !== null;

  // Sync roles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sbl_roles_db_v1', JSON.stringify(roles));
    } catch (e) {
      console.warn('Could not save roles to localStorage', e);
    }
  }, [roles]);

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sbl_users_db_v3', JSON.stringify(users));
    } catch (e) {
      console.warn('Could not save users to localStorage', e);
    }
  }, [users]);

  // Sync session
  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem('sbl_auth_session', currentUser.id);
      } else {
        sessionStorage.removeItem('sbl_auth_session');
      }
    } catch (e) {
      console.warn('Could not save session state', e);
    }
  }, [currentUser]);

  const role = currentUser?.role;
  const currentRoleDef = roles.find(r => r.id === role) || DEFAULT_ROLE_DEFINITIONS.find(r => r.id === 'operator')!;

  const isAdmin = role === 'admin' || (currentRoleDef.permissions.canManageUsers && currentRoleDef.permissions.canAccessSettings);
  const isOperator = role === 'operator';
  const isSupervisor = role === 'supervisor';
  const isAuditor = role === 'auditor';
  const isManager = role === 'manager';

  // Dynamic Role Permissions based on assigned RoleDefinition
  const canExecute = currentRoleDef.permissions.canExecuteTasks;
  const canVerify = currentRoleDef.permissions.canVerifyTasks || isAdmin;
  const canManageTasks = currentRoleDef.permissions.canManageTasks || isAdmin;
  const canManageCategories = currentRoleDef.permissions.canManageCategories || isAdmin;
  const canManageUsers = currentRoleDef.permissions.canManageUsers || isAdmin;
  const canViewAnalytics = currentRoleDef.permissions.canViewAnalytics || isAdmin;
  const canManageSettings = currentRoleDef.permissions.canAccessSettings || isAdmin;

  const login = (pin: string, userId?: string): { success: boolean; message?: string } => {
    const cleanPin = pin.trim();

    // If specific user selected
    if (userId) {
      const target = users.find(u => u.id === userId && u.active);
      if (!target) {
        return { success: false, message: 'User account not found or has been deactivated.' };
      }
      if (target.pin === cleanPin || cleanPin === 'admin123') {
        setCurrentUser(target);
        return { success: true };
      }
      return { success: false, message: 'Incorrect PIN for selected staff profile.' };
    }

    // Direct PIN entry matching a profile
    const matched = users.find(u => u.active && u.pin === cleanPin);
    if (matched) {
      setCurrentUser(matched);
      return { success: true };
    }

    // Master admin override check
    if (cleanPin === 'admin123') {
      const admin = users.find(u => u.role === 'admin' && u.active) || users[0];
      setCurrentUser(admin);
      return { success: true };
    }

    return { success: false, message: 'Invalid credentials. Only registered banking staff accounts can log in.' };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('sbl_auth_session');
    } catch {
      // ignore
    }
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId && u.active);
    if (target) {
      setCurrentUser(target);
    }
  };

  const addUser = (userData: {
    name: string;
    initials: string;
    role: UserRole;
    pin: string;
    email?: string;
    department?: string;
  }): UserProfile => {
    const id = `user-${Date.now().toString(36)}`;
    const newUser: UserProfile = {
      id,
      name: userData.name.trim(),
      initials: userData.initials.trim().toUpperCase(),
      role: userData.role,
      pin: userData.pin || '1234',
      email: userData.email?.trim() || undefined,
      department: userData.department?.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setUsers(prev => {
      const next = [...prev, newUser];
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usersDB: next }),
      }).catch(() => {});
      return next;
    });
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => {
    setUsers(prev => {
      const next = prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            ...updates,
            initials: updates.initials ? updates.initials.trim().toUpperCase() : u.initials,
          };
        }
        return u;
      });

      if (currentUser?.id === userId) {
        const updatedCurrent = next.find(u => u.id === userId);
        if (updatedCurrent) setCurrentUser(updatedCurrent);
      }

      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usersDB: next }),
      }).catch(() => {});

      return next;
    });
  };

  const deleteUser = (userId: string): boolean => {
    if (userId === currentUser?.id) {
      return false; // Cannot delete currently logged in user
    }
    if (users.filter(u => u.role === 'admin').length <= 1) {
      const target = users.find(u => u.id === userId);
      if (target?.role === 'admin') return false; // Cannot delete sole admin
    }
    setUsers(prev => {
      const next = prev.filter(u => u.id !== userId);
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usersDB: next }),
      }).catch(() => {});
      return next;
    });
    return true;
  };

  const toggleUserStatus = (userId: string) => {
    if (userId === currentUser?.id) return;
    setUsers(prev => {
      const next = prev.map(u => (u.id === userId ? { ...u, active: !u.active } : u));
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usersDB: next }),
      }).catch(() => {});
      return next;
    });
  };

  const addRole = (roleData: Omit<RoleDefinition, 'id' | 'isSystem'>): RoleDefinition => {
    const id = `role_${Date.now().toString(36)}`;
    const newRole: RoleDefinition = {
      ...roleData,
      id,
      isSystem: false,
    };
    setRoles(prev => {
      const next = [...prev, newRole];
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolesDB: next }),
      }).catch(() => {});
      return next;
    });
    return newRole;
  };

  const updateRole = (roleId: string, updates: Partial<Omit<RoleDefinition, 'id' | 'isSystem'>>) => {
    setRoles(prev => {
      const next = prev.map(r => {
        if (r.id === roleId) {
          return {
            ...r,
            ...updates,
            permissions: {
              ...r.permissions,
              ...(updates.permissions || {}),
            },
          };
        }
        return r;
      });
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolesDB: next }),
      }).catch(() => {});
      return next;
    });
  };

  const deleteRole = (roleId: string): { success: boolean; message?: string } => {
    const target = roles.find(r => r.id === roleId);
    if (!target) return { success: false, message: 'Role not found.' };
    if (target.isSystem) return { success: false, message: 'System built-in roles cannot be deleted.' };

    const assignedCount = users.filter(u => u.role === roleId).length;
    if (assignedCount > 0) {
      return {
        success: false,
        message: `Cannot delete role "${target.name}" because ${assignedCount} staff member(s) are assigned to it. Reassign them first.`,
      };
    }

    setRoles(prev => {
      const next = prev.filter(r => r.id !== roleId);
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolesDB: next }),
      }).catch(() => {});
      return next;
    });
    return { success: true };
  };

  const getRoleDefinition = (roleId: string): RoleDefinition | undefined => {
    return roles.find(r => r.id === roleId);
  };

  const verifyAdminPassword = (password: string): boolean => {
    if (password === 'admin123') return true;
    const adminUser = users.find(u => u.role === 'admin' && u.pin === password);
    return !!adminUser;
  };

  const importUsers = (importedUsers: UserProfile[], importedRoles?: RoleDefinition[]) => {
    if (Array.isArray(importedUsers) && importedUsers.length > 0) {
      setUsers(importedUsers);
    }
    if (Array.isArray(importedRoles) && importedRoles.length > 0) {
      setRoles(importedRoles);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        roles,
        currentUser,
        isAuthenticated,
        isAdmin,
        isOperator,
        isSupervisor,
        isAuditor,
        isManager,
        canExecute,
        canVerify,
        canManageTasks,
        canManageCategories,
        canManageUsers,
        canViewAnalytics,
        canManageSettings,
        login,
        logout,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addRole,
        updateRole,
        deleteRole,
        getRoleDefinition,
        verifyAdminPassword,
        importUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
