import React, { useState } from 'react';
import {
  Palette,
  Layout,
  Sliders,
  Check,
  X,
  RotateCcw,
  Building2,
  Moon,
  Sun,
  Upload,
  Image as ImageIcon,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { ThemePalette, LayoutDensity, LayoutFormat } from '../../types';

interface PortalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotice?: (msg: string) => void;
}

const SUGGESTED_THEMES: {
  id: ThemePalette;
  name: string;
  desc: string;
  color: string;
  badgeColor: string;
}[] = [
  {
    id: 'bank-blue',
    name: 'Soneri Classic Navy & Blue',
    desc: 'Official Soneri corporate banking identity with royal blue accents',
    color: '#1d4ed8',
    badgeColor: 'bg-blue-600',
  },
  {
    id: 'islamic-emerald',
    name: 'Soneri Mustaqeem Islamic Emerald',
    desc: 'Rich banking emerald green for Islamic Banking operations',
    color: '#059669',
    badgeColor: 'bg-emerald-600',
  },
  {
    id: 'royal-indigo',
    name: 'Executive Royal Indigo',
    desc: 'Modern deep purple-indigo high-contrast enterprise theme',
    color: '#4f46e5',
    badgeColor: 'bg-indigo-600',
  },
  {
    id: 'corporate-amber',
    name: 'Corporate Amber & Charcoal',
    desc: 'Warm financial tone with amber alert highlights',
    color: '#d97706',
    badgeColor: 'bg-amber-600',
  },
  {
    id: 'crimson-ruby',
    name: 'Bank Crimson Ruby',
    desc: 'High-visibility corporate crimson for critical transaction monitoring',
    color: '#dc2626',
    badgeColor: 'bg-rose-600',
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Operations Ops-Dark',
    desc: 'Sleek dark command-center aesthetic for 24/7 night shift monitoring',
    color: '#334155',
    badgeColor: 'bg-slate-700',
  },
];

export const PortalSettingsModal: React.FC<PortalSettingsModalProps> = ({
  isOpen,
  onClose,
  onSuccessNotice,
}) => {
  const { settings, updateSettings, resetSettings } = useSettings();

  const [theme, setTheme] = useState<ThemePalette>(settings.theme);
  const [customColor, setCustomColor] = useState<string>(settings.customColor || '#1d4ed8');
  const [darkMode, setDarkMode] = useState<boolean>(settings.darkMode);
  const [layoutFormat, setLayoutFormat] = useState<LayoutFormat>(settings.layoutFormat);
  const [density, setDensity] = useState<LayoutDensity>(settings.density);
  const [portalTitle, setPortalTitle] = useState<string>(settings.portalTitle);
  const [portalSubtitle, setPortalSubtitle] = useState<string>(settings.portalSubtitle);
  const [branchName, setBranchName] = useState<string>(settings.branchName);
  const [customFooterText, setCustomFooterText] = useState<string>(settings.customFooterText);
  const [logoType, setLogoType] = useState<'default' | 'custom' | 'icon'>(settings.logoType || 'default');
  const [logoUrl, setLogoUrl] = useState<string>(settings.logoUrl || '');
  const [showVersionOnRight, setShowVersionOnRight] = useState<boolean>(settings.showVersionOnRight !== false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
          setLogoType('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      theme,
      customColor,
      darkMode,
      layoutFormat,
      density,
      portalTitle: portalTitle.trim() || 'Soneri Bank Limited',
      portalSubtitle: portalSubtitle.trim() || 'IT Operation Task List - Operational Dashboard',
      branchName: branchName.trim() || 'Head Office IT Operations',
      customFooterText: customFooterText.trim() || 'Soneri Bank Limited · Information Technology Operations Directorate',
      logoType,
      logoUrl,
      showVersionOnRight,
    });
    onClose();
    if (onSuccessNotice) {
      onSuccessNotice('Portal branding, color scheme, dark mode, and layout saved successfully.');
    }
  };

  const handleReset = () => {
    resetSettings();
    setTheme('bank-blue');
    setCustomColor('#1d4ed8');
    setDarkMode(false);
    setLayoutFormat('sections');
    setDensity('comfortable');
    setPortalTitle('Soneri Bank Limited');
    setPortalSubtitle('IT Operation Task List - Operational Dashboard');
    setBranchName('Head Office IT Operations (Central Data Center)');
    setCustomFooterText('Soneri Bank Limited · Information Technology Operations Directorate · 24/7 Core Operations');
    setLogoType('default');
    setLogoUrl('');
    setShowVersionOnRight(true);
    if (onSuccessNotice) {
      onSuccessNotice('Reset all portal controls to bank defaults.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold">Portal Controls & Appearance (Admin)</h3>
              <p className="text-xs text-slate-400">
                Customize themes, color picker, dark mode, logo, and header/footer branding
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Dark Mode Toggle */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${darkMode ? 'bg-indigo-900/60 text-indigo-400' : 'bg-amber-100 text-amber-600'}`}>
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Dark Mode Command Center
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Switch the entire application background, tables, and cards to dark/night shift mode
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                darkMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Section 2: Color Themes & Custom Hex Picker */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Color Theme & Custom Palette
              </label>

              {/* Custom Color Picker input */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Custom Color:</span>
                <input
                  type="color"
                  value={customColor}
                  onChange={e => {
                    setCustomColor(e.target.value);
                    setTheme('custom');
                  }}
                  className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0"
                  title="Choose exact custom brand color"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={e => {
                    setCustomColor(e.target.value);
                    setTheme('custom');
                  }}
                  className="w-20 px-2 py-0.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SUGGESTED_THEMES.map(t => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTheme(t.id);
                      setCustomColor(t.color);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-900/30 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg ${t.badgeColor} shrink-0 mt-0.5 shadow-xs`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{t.desc}</p>
                    </div>
                  </button>
                );
              })}

              {/* Custom Theme Card */}
              <button
                type="button"
                onClick={() => setTheme('custom')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  theme === 'custom'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-900/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-lg shrink-0 mt-0.5 shadow-xs"
                  style={{ backgroundColor: customColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Custom Brand Hex</span>
                    {theme === 'custom' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    Active: {customColor}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Logo & Header Brand Identity */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Bank Logo & Header Branding
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Logo Selection Options */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Header Logo Badge
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="logoType"
                      checked={logoType === 'default'}
                      onChange={() => setLogoType('default')}
                    />
                    Soneri Shield (&quot;SB&quot;)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer ml-2">
                    <input
                      type="radio"
                      name="logoType"
                      checked={logoType === 'custom'}
                      onChange={() => setLogoType('custom')}
                    />
                    Custom Logo Image
                  </label>
                </div>

                {logoType === 'custom' && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {logoUrl && (
                      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        <img src={logoUrl} alt="Logo Preview" className="h-7 w-auto max-w-[120px] object-contain" />
                        <span className="text-[10px] text-emerald-600 font-medium">Logo Loaded</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Version Position Option */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Version Number Placement
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Display the software version badge on the right-hand utility bar of the header.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={showVersionOnRight}
                    onChange={e => setShowVersionOnRight(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Show Version on Right Side (V5.2)</span>
                </label>
              </div>
            </div>

            {/* Title & Subtitle fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Portal Title
                </label>
                <input
                  type="text"
                  value={portalTitle}
                  onChange={e => setPortalTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  placeholder="e.g. Soneri Bank Limited"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Department / Subtitle
                </label>
                <input
                  type="text"
                  value={portalSubtitle}
                  onChange={e => setPortalSubtitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  placeholder="e.g. IT Operation Task List - Operational Dashboard"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Branch / Data Center Name
                </label>
                <input
                  type="text"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  placeholder="e.g. Head Office Central Data Center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Footer Legal & Institutional Text
                </label>
                <input
                  type="text"
                  value={customFooterText}
                  onChange={e => setCustomFooterText(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  placeholder="e.g. Soneri Bank Limited · Information Technology Operations Directorate"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Layout & Density */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5">
              <Layout className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Checklist Layout & Density
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setLayoutFormat('sections')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  layoutFormat === 'sections'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-900/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Shift Category Cards (Sections)</span>
                  {layoutFormat === 'sections' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Morning, Daily, Night, Weekly, and Monthly with collapsible sections.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLayoutFormat('timeline')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  layoutFormat === 'timeline'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-900/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Chronological Shift Timeline</span>
                  {layoutFormat === 'timeline' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Continuous sequence sorted by scheduled execution time (8:30am → 5:00pm → Pre-COB).
                </p>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  density === 'comfortable'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-900/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Comfortable</span>
                  {density === 'comfortable' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Standard row height.</span>
              </button>

              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  density === 'compact'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-900/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Compact Ops</span>
                  {density === 'compact' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Fits 40+ tasks on screen.</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Bank Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Save Portal Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
