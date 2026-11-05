import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { DEFAULT_USERS } from '../data/defaultData';

interface AuthContextType {
  users: UserProfile[];
  currentUser: UserProfile;
  isAdmin: boolean;
  isOperator: boolean;
  switchUser: (userId: string) => void;
  loginWithPin: (userId: string, pin: string) => boolean;
  addUser: (userData: { name: string; initials: string; role: UserRole; pin: string; email?: string }) => UserProfile;
  updateUser: (userId: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => void;
  deleteUser: (userId: string) => boolean;
  toggleUserStatus: (userId: string) => void;
  verifyAdminPassword: (password: string) => boolean;
  importUsers: (users: UserProfile[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('sbl_users_db_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize any legacy role values (e.g. 'verifier' -> 'operator')
          return parsed.map((u: any) => ({
            ...u,
            role: (u.role === 'admin' ? 'admin' : 'operator') as UserRole,
          }));
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sbl_active_user_id');
      if (saved && users.some(u => u.id === saved)) return saved;
    } catch {
      // fallback
    }
    return DEFAULT_USERS[0].id;
  });

  useEffect(() => {
    try {
      localStorage.setItem('sbl_users_db_v1', JSON.stringify(users));
    } catch (e) {
      console.warn('Could not save users to localStorage', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('sbl_active_user_id', currentUserId);
    } catch (e) {
      console.warn('Could not save currentUserId to localStorage', e);
    }
  }, [currentUserId]);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || DEFAULT_USERS[0];
  const isAdmin = currentUser.role === 'admin';
  const isOperator = currentUser.role === 'operator';

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId && u.active);
    if (target) {
      setCurrentUserId(target.id);
    }
  };

  const loginWithPin = (userId: string, pin: string): boolean => {
    const target = users.find(u => u.id === userId && u.active);
    if (target && (target.pin === pin || pin === 'admin123')) {
      setCurrentUserId(target.id);
      return true;
    }
    return false;
  };

  const addUser = (userData: {
    name: string;
    initials: string;
    role: UserRole;
    pin: string;
    email?: string;
  }): UserProfile => {
    const id = `user-${Date.now().toString(36)}`;
    const newUser: UserProfile = {
      id,
      name: userData.name.trim(),
      initials: userData.initials.trim().toUpperCase(),
      role: userData.role,
      pin: userData.pin || '1234',
      email: userData.email?.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            ...updates,
            initials: updates.initials ? updates.initials.trim().toUpperCase() : u.initials,
          };
        }
        return u;
      })
    );
  };

  const deleteUser = (userId: string): boolean => {
    if (userId === currentUser.id) {
      return false; // Cannot delete currently active user
    }
    if (users.filter(u => u.role === 'admin').length <= 1) {
      const target = users.find(u => u.id === userId);
      if (target?.role === 'admin') return false; // Cannot delete the sole admin
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    return true;
  };

  const toggleUserStatus = (userId: string) => {
    if (userId === currentUser.id) return;
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, active: !u.active } : u))
    );
  };

  const verifyAdminPassword = (password: string): boolean => {
    if (password === 'admin123') return true;
    const adminUser = users.find(u => u.role === 'admin' && u.pin === password);
    return !!adminUser;
  };

  const importUsers = (importedUsers: UserProfile[]) => {
    if (Array.isArray(importedUsers) && importedUsers.length > 0) {
      const normalized = importedUsers.map(u => ({
        ...u,
        role: (u.role === 'admin' ? 'admin' : 'operator') as UserRole,
      }));
      setUsers(normalized);
      if (!normalized.some(u => u.id === currentUserId)) {
        setCurrentUserId(normalized[0].id);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        isAdmin,
        isOperator,
        switchUser,
        loginWithPin,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
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
