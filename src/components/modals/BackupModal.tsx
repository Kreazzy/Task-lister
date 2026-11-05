import React, { useState } from 'react';
import { Download, Upload, X, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useHistory } from '../../context/HistoryContext';
import { useAuth } from '../../context/AuthContext';
import { SectionConfig, TaskItem } from '../../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotice?: (title: string, msg: string) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onSuccessNotice,
}) => {
  const { sectionsConfig, tasksMaster, slaMilestones, importMasterData } = useTasks();
  const { historyDB, todayDateStr, importHistory } = useHistory();
  const { users, importUsers } = useAuth();

  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const backupData = {
      sectionsConfig,
      masterTasks: tasksMaster,
      slaMilestones,
      historyDB,
      usersDB: users,
      version: '5.1-React',
      exportedAt: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Soneri_IT_Tasks_${todayDateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onSuccessNotice) {
      onSuccessNotice('Backup Created', 'Complete JSON backup downloaded to your computer.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content);

        // Extract master tasks with backwards compatibility
        let importedMaster: Record<string, TaskItem[]> | null =
          imported.masterTasks || imported.tasksMaster || imported.tasks || null;
        const importedHistory = imported.historyDB || imported.history || null;
        const importedSections: SectionConfig[] | null = Array.isArray(imported.sectionsConfig)
          ? imported.sectionsConfig
          : null;
        const importedUsers = Array.isArray(imported.usersDB) ? imported.usersDB : null;
        const importedSlas = Array.isArray(imported.slaMilestones)
          ? imported.slaMilestones
          : Array.isArray(imported.slas)
          ? imported.slas
          : null;

        if (!importedMaster && !importedHistory) {
          setImportStatus({
            type: 'error',
            message: 'Unrecognized backup structure. No valid task or history records found in this file.',
          });
          return;
        }

        let taskCount = 0;
        if (importedMaster) {
          // Normalize alias keys if from legacy file
          const normalizedMaster: Record<string, TaskItem[]> = {};
          const aliasMap: Record<string, string> = {
            morning: 'morn',
            morningshift: 'morn',
            day: 'daily',
            dayshift: 'daily',
            evening: 'night',
            nightshift: 'night',
            week: 'weekly',
            month: 'monthly',
          };

          Object.entries(importedMaster).forEach(([k, list]) => {
            const canonicalKey = aliasMap[k.toLowerCase()] || k;
            normalizedMaster[canonicalKey] = list;
            taskCount += Array.isArray(list) ? list.length : 0;
          });

          importMasterData(importedSections || undefined, normalizedMaster, importedSlas || undefined);
        } else if (importedSlas) {
          importMasterData(undefined, undefined, importedSlas);
        }

        if (importedHistory) {
          importHistory(importedHistory);
        }

        if (importedUsers) {
          importUsers(importedUsers);
        }

        setImportStatus({
          type: 'success',
          message: `Backup restored successfully! (${taskCount} tasks verified and loaded into database).`,
        });

        if (onSuccessNotice) {
          onSuccessNotice('Restore Complete', `Successfully loaded backup data with ${taskCount} operational tasks.`);
        }
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: `Failed to parse backup JSON: ${(err as Error).message}`,
        });
      }
    };
    reader.onerror = () => {
      setImportStatus({
        type: 'error',
        message: 'Could not read the selected file.',
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-semibold">Data Backup & Migration</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {importStatus.type && (
            <div
              className={`p-3 rounded-lg flex items-start gap-2.5 text-xs ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{importStatus.message}</span>
            </div>
          )}

          {/* Download section */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Export Backup File</span>
              <Download className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Downloads a unified JSON backup containing all SOP task templates, custom categories, user accounts, and complete shift history.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Download JSON Backup
            </button>
          </div>

          {/* Import section */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Restore from File</span>
              <Upload className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload a previously exported <code className="font-mono text-slate-700">.json</code> file to restore historical checks and customized task catalogs.
            </p>
            <label className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" /> Select Backup JSON
              <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
