import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { TaskItem, ProfileCategory } from '../../types';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionKey?: string;
  taskIndex?: number;
  taskToEdit?: TaskItem;
  onSuccessNotice?: (msg: string) => void;
}

const PROFILE_OPTIONS: ProfileCategory[] = [
  'Utility',
  'Browser',
  'Prod Server',
  'Server',
  'EMAIL',
  'Validation',
  'Process',
  'DB Server',
  'Service',
  'Other',
];

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  sectionKey,
  taskIndex,
  taskToEdit,
  onSuccessNotice,
}) => {
  const { sectionsConfig, getNextGlobalSr, addTask, editTask } = useTasks();

  const [selectedSection, setSelectedSection] = useState<string>(
    sectionKey || sectionsConfig[0]?.key || 'daily'
  );
  const [sr, setSr] = useState<number>(0);
  const [nature, setNature] = useState<string>('Daily');
  const [time, setTime] = useState<string>('-');
  const [taskName, setTaskName] = useState<string>('');
  const [profile, setProfile] = useState<ProfileCategory>('Utility');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isEditing = taskIndex !== undefined && taskIndex >= 0 && !!taskToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && taskToEdit) {
        setSelectedSection(sectionKey || sectionsConfig[0]?.key || 'daily');
        setSr(taskToEdit.sr);
        setNature(taskToEdit.nature || 'Daily');
        setTime(taskToEdit.time || '-');
        setTaskName(taskToEdit.task || '');
        setProfile((taskToEdit.profile as ProfileCategory) || 'Utility');
        setNote(taskToEdit.note || '');
      } else {
        setSelectedSection(sectionKey || sectionsConfig[0]?.key || 'daily');
        setSr(getNextGlobalSr());
        setNature('Daily');
        setTime('-');
        setTaskName('');
        setProfile('Utility');
        setNote('');
      }
      setErrorMsg('');
    }
  }, [isOpen, isEditing, taskToEdit, sectionKey, sectionsConfig, getNextGlobalSr]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      setErrorMsg('Task description cannot be empty.');
      return;
    }

    if (isEditing && sectionKey && taskIndex !== undefined) {
      const res = editTask(selectedSection, taskIndex, {
        sr,
        nature,
        time,
        task: taskName,
        profile,
        note,
      });

      onClose();
      if (onSuccessNotice) {
        onSuccessNotice(
          res.wasCorrected
            ? `Task updated. Note: Sr# was occupied, so it was assigned Sr# ${res.sr} automatically.`
            : `Task (Sr# ${res.sr}) updated successfully.`
        );
      }
    } else {
      const res = addTask(selectedSection, {
        sr,
        nature,
        time,
        task: taskName,
        profile,
        note,
      });

      onClose();
      if (onSuccessNotice) {
        onSuccessNotice(
          res.wasCorrected
            ? `Task added with next available Sr# ${res.sr} (avoiding overlap).`
            : `Task (Sr# ${res.sr}) created successfully.`
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <h3 className="text-base font-semibold">
            {isEditing ? 'Edit Operational Task' : 'Add New Operational Task'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Target Section / Shift Category
            </label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {sectionsConfig.map(sec => (
                <option key={sec.key} value={sec.key}>
                  {sec.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sr# (Serial Number)
              </label>
              <input
                type="number"
                value={sr || ''}
                onChange={e => setSr(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="block mt-1 text-[11px] text-slate-500">
                Auto-assigned next free number.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nature / Frequency
              </label>
              <input
                type="text"
                value={nature}
                onChange={e => setNature(e.target.value)}
                placeholder="e.g. Daily, Mon/Wed/Fri"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Scheduled Time / Cutoff
              </label>
              <input
                type="text"
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="e.g. 8:30am, 5:00PM, Pre COB"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Profile Category
              </label>
              <select
                value={profile}
                onChange={e => setProfile(e.target.value as ProfileCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {PROFILE_OPTIONS.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Description
            </label>
            <input
              type="text"
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              placeholder="e.g. Pre COB DB BACKUP (Option 7)"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Command / Routine Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. SBL.M.PROF.ACCT.TAX.COB or /scripts/EBEODERROR.sh"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500"
            >
              {isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
