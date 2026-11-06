import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppSettings, ThemePalette, LayoutDensity, LayoutFormat } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  toggleDarkMode: () => void;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'bank-blue',
  customColor: '#1d4ed8', // Soneri Blue default
  darkMode: false,
  logoType: 'default',
  logoUrl: '',
  density: 'comfortable',
  layoutFormat: 'sections',
  portalTitle: 'Soneri Bank Limited',
  portalSubtitle: 'IT Operation Task List - Operational Dashboard',
  branchName: 'Head Office IT Operations (Central Data Center)',
  customFooterText: 'Soneri Bank Limited · Information Technology Operations Directorate · 24/7 Core Operations',
  showVersionOnRight: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('sbl_app_settings_v2');
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

  // Sync to HTML element for Dark Mode and theme variables
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set custom color CSS variable
    const activeColor = settings.theme === 'custom' && settings.customColor
      ? settings.customColor
      : settings.theme === 'islamic-emerald'
      ? '#059669'
      : settings.theme === 'royal-indigo'
      ? '#4f46e5'
      : settings.theme === 'corporate-amber'
      ? '#d97706'
      : settings.theme === 'crimson-ruby'
      ? '#dc2626'
      : settings.theme === 'midnight-dark'
      ? '#334155'
      : '#1d4ed8'; // default bank blue

    root.style.setProperty('--primary-color', activeColor);
  }, [settings.darkMode, settings.theme, settings.customColor]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sbl_app_settings_v2', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appSettings: next }),
      }).catch(() => {});
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_APP_SETTINGS);
  };

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        toggleDarkMode,
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
