import React, { useState } from 'react';
import { Palette, Layout, Sliders, Check, X, RotateCcw, Building2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { ThemePalette, LayoutDensity, LayoutFormat } from '../../types';

interface PortalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotice?: (msg: string) => void;
}

const THEMES: { id: ThemePalette; name: string; desc: string; badgeColor: string; primaryClass: string }[] = [
  {
    id: 'bank-blue',
    name: 'Soneri Classic Navy & Blue',
    desc: 'Official Soneri corporate banking identity with classic blue accents',
    badgeColor: 'bg-blue-600',
    primaryClass: 'border-blue-600 text-blue-700 bg-blue-50',
  },
  {
    id: 'islamic-emerald',
    name: 'Soneri Mustaqeem Islamic Emerald',
    desc: 'Rich banking emerald green with gold accents for Islamic Banking operations',
    badgeColor: 'bg-emerald-600',
    primaryClass: 'border-emerald-600 text-emerald-700 bg-emerald-50',
  },
  {
    id: 'royal-indigo',
    name: 'Executive Royal Indigo',
    desc: 'Modern deep purple-indigo high-contrast enterprise theme',
    badgeColor: 'bg-indigo-600',
    primaryClass: 'border-indigo-600 text-indigo-700 bg-indigo-50',
  },
  {
    id: 'corporate-amber',
    name: 'Corporate Amber & Charcoal',
    desc: 'Warm financial tone with amber alert highlights',
    badgeColor: 'bg-amber-600',
    primaryClass: 'border-amber-600 text-amber-700 bg-amber-50',
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Operations Ops-Dark',
    desc: 'Sleek dark command-center aesthetic for 24/7 night shift monitoring',
    badgeColor: 'bg-slate-800',
    primaryClass: 'border-slate-800 text-slate-800 bg-slate-100',
  },
];

export const PortalSettingsModal: React.FC<PortalSettingsModalProps> = ({
  isOpen,
  onClose,
  onSuccessNotice,
}) => {
  const { settings, updateSettings, resetSettings } = useSettings();

  const [theme, setTheme] = useState<ThemePalette>(settings.theme);
  const [layoutFormat, setLayoutFormat] = useState<LayoutFormat>(settings.layoutFormat);
  const [density, setDensity] = useState<LayoutDensity>(settings.density);
  const [portalTitle, setPortalTitle] = useState<string>(settings.portalTitle);
  const [portalSubtitle, setPortalSubtitle] = useState<string>(settings.portalSubtitle);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      theme,
      layoutFormat,
      density,
      portalTitle: portalTitle.trim() || 'Soneri Bank Limited',
      portalSubtitle: portalSubtitle.trim() || 'IT Operation Task List - Operational Dashboard',
    });
    onClose();
    if (onSuccessNotice) {
      onSuccessNotice('Portal appearance, format, and layout settings updated successfully.');
    }
  };

  const handleReset = () => {
    resetSettings();
    setTheme('bank-blue');
    setLayoutFormat('sections');
    setDensity('comfortable');
    setPortalTitle('Soneri Bank Limited');
    setPortalSubtitle('IT Operation Task List - Operational Dashboard');
    if (onSuccessNotice) {
      onSuccessNotice('Reset appearance settings to default.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold">Portal Controls & Appearance (Admin)</h3>
              <p className="text-xs text-slate-400">Customize portal theme palette, table format, and row density</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Color Themes */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              <Palette className="w-4 h-4 text-blue-600" />
              Theme & Color Palette
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEMES.map(t => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg ${t.badgeColor} shrink-0 mt-0.5 shadow-xs`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{t.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Layout Format */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              <Layout className="w-4 h-4 text-blue-600" />
              Checklist Layout & Presentation Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLayoutFormat('sections')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  layoutFormat === 'sections'
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Shift Category Cards (Sections)</span>
                  {layoutFormat === 'sections' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Tasks grouped by Morning, Daily, Post-COB/Night, Weekly, and Monthly with collapsible sections.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLayoutFormat('timeline')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  layoutFormat === 'timeline'
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Chronological Shift Timeline</span>
                  {layoutFormat === 'timeline' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Continuous sequence of tasks sorted by scheduled execution time (8:30am → 5:00pm → Pre-COB → Post-COB).
                </p>
              </button>
            </div>
          </div>

          {/* Section 3: Density */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Table Row Density
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  density === 'comfortable'
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Comfortable (Standard)</span>
                  {density === 'comfortable' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Spacious row padding for easy touchscreen or mouse navigation.</span>
              </button>

              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  density === 'compact'
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Compact (Ops Monitor)</span>
                  {density === 'compact' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">High density view fitting up to 30+ tasks on standard widescreen displays.</span>
              </button>
            </div>
          </div>

          {/* Section 4: Institution Branding */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-blue-600" />
              Institutional Header & Branding
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Portal Name</label>
                <input
                  type="text"
                  value={portalTitle}
                  onChange={e => setPortalTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. Soneri Bank Limited"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subtitle / Department</label>
                <input
                  type="text"
                  value={portalSubtitle}
                  onChange={e => setPortalSubtitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. IT Operation Task List - Operational Dashboard"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
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
