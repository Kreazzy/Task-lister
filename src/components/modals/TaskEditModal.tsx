import React, { useState, useEffect } from 'react';
import { X, ArrowUpDown } from 'lucide-react';
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
  const { sectionsConfig, tasksMaster, getNextGlobalSr, addTask, editTask } = useTasks();

  const [selectedSection, setSelectedSection] = useState<string>(
    sectionKey || sectionsConfig[0]?.key || 'daily'
  );
  const [sr, setSr] = useState<number>(0);
  const [nature, setNature] = useState<string>('Daily');
  const [time, setTime] = useState<string>('-');
  const [taskName, setTaskName] = useState<string>('');
  const [profile, setProfile] = useState<ProfileCategory>('Utility');
  const [note, setNote] = useState<string>('');
  const [positionIndex, setPositionIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isEditing = taskIndex !== undefined && taskIndex >= 0 && !!taskToEdit;
  const currentSectionTasks = tasksMaster[selectedSection] || [];

  useEffect(() => {
    if (isOpen) {
      const activeSectionKey = sectionKey || sectionsConfig[0]?.key || 'daily';
      setSelectedSection(activeSectionKey);

      if (isEditing && taskToEdit) {
        setSr(taskToEdit.sr);
        setNature(taskToEdit.nature || 'Daily');
        setTime(taskToEdit.time || '-');
        setTaskName(taskToEdit.task || '');
        setProfile((taskToEdit.profile as ProfileCategory) || 'Utility');
        setNote(taskToEdit.note || '');
        setPositionIndex(taskIndex ?? 0);
      } else {
        const list = tasksMaster[activeSectionKey] || [];
        setSr(getNextGlobalSr());
        setNature('Daily');
        setTime('-');
        setTaskName('');
        setProfile('Utility');
        setNote('');
        // Default new tasks to the end of the category
        setPositionIndex(list.length);
      }
      setErrorMsg('');
    }
  }, [isOpen, isEditing, taskToEdit, taskIndex, sectionKey, sectionsConfig, getNextGlobalSr, tasksMaster]);

  // When selected section changes during add mode, adjust default position to end of that section
  const handleSectionChange = (newSecKey: string) => {
    setSelectedSection(newSecKey);
    if (!isEditing) {
      const list = tasksMaster[newSecKey] || [];
      setPositionIndex(list.length);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      setErrorMsg('Task description cannot be empty.');
      return;
    }

    if (isEditing && sectionKey && taskIndex !== undefined) {
      const res = editTask(
        selectedSection,
        taskIndex,
        {
          sr,
          nature,
          time,
          task: taskName,
          profile,
          note,
        },
        positionIndex
      );

      onClose();
      if (onSuccessNotice) {
        onSuccessNotice(`Task updated successfully. Set to Position #${positionIndex + 1} (Sr# ${res.sr}).`);
      }
    } else {
      const res = addTask(
        selectedSection,
        {
          sr,
          nature,
          time,
          task: taskName,
          profile,
          note,
        },
        positionIndex
      );

      onClose();
      if (onSuccessNotice) {
        onSuccessNotice(`Task created at Position #${positionIndex + 1} (Sr# ${res.sr}) successfully.`);
      }
    }
  };

  // Generate selectable positions list
  const totalSlots = isEditing ? currentSectionTasks.length : currentSectionTasks.length + 1;
  const positionOptions = Array.from({ length: totalSlots }, (_, i) => {
    if (i === 0) return { index: 0, label: 'Position 1 (Top of list)' };
    if (!isEditing && i === totalSlots - 1) return { index: i, label: `Position ${i + 1} (At End of category)` };
    return { index: i, label: `Position ${i + 1}` };
  });

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

          {/* Section Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Target Section / Shift Category
            </label>
            <select
              value={selectedSection}
              onChange={e => handleSectionChange(e.target.value)}
              disabled={isEditing}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {sectionsConfig.map(sec => (
                <option key={sec.key} value={sec.key}>
                  {sec.title}
                </option>
              ))}
            </select>
          </div>

          {/* Position in Category */}
          <div className="bg-blue-50/70 p-3.5 rounded-lg border border-blue-200">
            <label className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Position / Location in Category</span>
            </label>
            <select
              value={positionIndex}
              onChange={e => setPositionIndex(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {positionOptions.map(opt => (
                <option key={opt.index} value={opt.index}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="block mt-1 text-[11px] text-blue-700">
              When created or moved, serial numbers auto-update sequentially matching this position.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sr# (Reference)
              </label>
              <input
                type="number"
                value={sr || ''}
                onChange={e => setSr(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="block mt-1 text-[11px] text-slate-500">
                Auto-assigned based on position.
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
