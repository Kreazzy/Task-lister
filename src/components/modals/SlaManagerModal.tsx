import React, { useState } from 'react';
import { Clock, Plus, Trash2, Edit2, X, RotateCcw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { SlaMilestone } from '../../types';

interface SlaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotice?: (msg: string) => void;
}

export const SlaManagerModal: React.FC<SlaManagerModalProps> = ({
  isOpen,
  onClose,
  onSuccessNotice,
}) => {
  const { sectionsConfig, tasksMaster, slaMilestones, addSla, updateSla, deleteSla, resetSlas } = useTasks();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [label, setLabel] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [taskKey, setTaskKey] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Compile all available tasks across all sections for easy dropdown selection
  const allTasksList: { key: string; label: string }[] = [];
  sectionsConfig.forEach(sec => {
    const list = tasksMaster[sec.key] || [];
    list.forEach(t => {
      allTasksList.push({
        key: `${sec.key}-${t.sr}`,
        label: `[${sec.title.split(' ')[0]}] #${t.sr} - ${t.task} (${t.time || 'N/A'})`,
      });
    });
  });

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setLabel('');
    setTargetTime('5:00 PM');
    setTaskKey(allTasksList[0]?.key || '');
    setIsMandatory(true);
    setErrorMsg('');
  };

  const handleStartEdit = (sla: SlaMilestone) => {
    setIsAdding(false);
    setEditingId(sla.id);
    setLabel(sla.label);
    setTargetTime(sla.targetTime);
    setTaskKey(sla.taskKey);
    setIsMandatory(sla.isMandatory !== false);
    setErrorMsg('');
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setErrorMsg('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setErrorMsg('Milestone description is required.');
      return;
    }
    if (!targetTime.trim()) {
      setErrorMsg('Target cutoff time is required.');
      return;
    }
    if (!taskKey.trim()) {
      setErrorMsg('Associated SOP task selection is required.');
      return;
    }

    if (editingId) {
      updateSla(editingId, {
        label: label.trim(),
        targetTime: targetTime.trim(),
        taskKey: taskKey.trim(),
        isMandatory,
      });
      setEditingId(null);
      if (onSuccessNotice) onSuccessNotice(`SLA milestone "${label}" updated.`);
    } else {
      addSla({
        label: label.trim(),
        targetTime: targetTime.trim(),
        taskKey: taskKey.trim(),
        isMandatory,
      });
      setIsAdding(false);
      if (onSuccessNotice) onSuccessNotice(`New SLA milestone "${label}" created.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold">Service Level Agreement (SLA) & Cutoff Manager</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Configure cutoff checkpoints and critical operational SLAs tracked during shift execution.
            </p>
            {!isAdding && !editingId && (
              <button
                type="button"
                onClick={handleStartAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Milestone
              </button>
            )}
          </div>

          {/* Form */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSave} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">
                  {editingId ? 'Edit SLA Milestone' : 'New SLA Cutoff Milestone'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              {errorMsg && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Milestone Label
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="e.g. CUTOFF EMAIL Dispatch"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Target Cutoff Time
                  </label>
                  <input
                    type="text"
                    value={targetTime}
                    onChange={e => setTargetTime(e.target.value)}
                    placeholder="e.g. 5:00 PM, 8:30 AM, Pre COB"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Linked Checklist SOP Task
                </label>
                <select
                  value={taskKey}
                  onChange={e => setTaskKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  {allTasksList.map(item => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <span className="block mt-1 text-[10px] text-slate-500">
                  When this task is checked off on the shift checklist, the milestone is recorded.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={e => setIsMandatory(e.target.checked)}
                    className="rounded-sm text-blue-600"
                  />
                  Mandatory for Shift Pass Certification
                </label>

                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  {editingId ? 'Update Milestone' : 'Create Milestone'}
                </button>
              </div>
            </form>
          )}

          {/* List of Current SLA Milestones */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {slaMilestones.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No SLA milestones configured. Click &quot;Add Milestone&quot; to define one.
              </div>
            ) : (
              slaMilestones.map(m => {
                const linkedTask = allTasksList.find(t => t.key === m.taskKey);

                return (
                  <div
                    key={m.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{m.label}</span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200">
                          Cutoff: {m.targetTime}
                        </span>
                        {m.isMandatory && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-xs bg-amber-50 text-amber-700 border border-amber-200">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 truncate">
                        Linked Task:{' '}
                        <span className="font-mono text-slate-700">
                          {linkedTask ? linkedTask.label : m.taskKey}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(m)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit SLA"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSla(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete SLA"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              resetSlas();
              if (onSuccessNotice) onSuccessNotice('Reset SLA milestones to standard banking defaults.');
            }}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Bank Defaults
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
