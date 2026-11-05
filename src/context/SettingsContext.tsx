import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppSettings, ThemePalette, LayoutDensity, LayoutFormat } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'bank-blue',
  density: 'comfortable',
  layoutFormat: 'sections',
  portalTitle: 'Soneri Bank Limited',
  portalSubtitle: 'IT Operation Task List - Operational Dashboard',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('sbl_app_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_APP_SETTINGS, ...parsed };
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_APP_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('sbl_app_settings_v1', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      // Broadcast/sync to server in background if available
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appSettings: next }),
      }).catch(() => {
        // standalone/offline fallback
      });
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_APP_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
