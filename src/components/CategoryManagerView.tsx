import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  GripVertical,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useHistory } from '../context/HistoryContext';
import { useAuth } from '../context/AuthContext';
import { TaskItem, SectionConfig } from '../types';

interface CategoryManagerViewProps {
  onOpenAddTaskModal: (sectionKey?: string) => void;
  onOpenEditTaskModal: (sectionKey: string, index: number, task: TaskItem) => void;
  onRequestDeleteTask: (sectionKey: string, index: number, task: TaskItem) => void;
  onRequestDeleteSection: (key: string, title: string) => void;
  onRequestResetMaster: () => void;
  onSuccessNotice?: (msg: string) => void;
}

export const CategoryManagerView: React.FC<CategoryManagerViewProps> = ({
  onOpenAddTaskModal,
  onOpenEditTaskModal,
  onRequestDeleteTask,
  onRequestDeleteSection,
  onRequestResetMaster,
  onSuccessNotice,
}) => {
  const { sectionsConfig, tasksMaster, addSection, reorderSections, reorderTasks } = useTasks();
  const { remapTaskKeys } = useHistory();
  const { isAdmin } = useAuth();

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>(
    sectionsConfig[0]?.key || 'morn'
  );

  // Drag and drop states for tasks
  const [draggedTaskIdx, setDraggedTaskIdx] = useState<number | null>(null);
  const [dragOverTaskIdx, setDragOverTaskIdx] = useState<number | null>(null);

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newKey = addSection(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setSelectedSectionKey(newKey);
    if (onSuccessNotice) {
      onSuccessNotice(`New section "${newTitle}" created successfully. You can now add SOP tasks.`);
    }
  };

  const handleMoveSectionUp = (index: number) => {
    if (index === 0) return;
    const copy = [...sectionsConfig];
    const temp = copy[index];
    copy[index] = copy[index - 1];
    copy[index - 1] = temp;
    reorderSections(copy);
  };

  const handleMoveSectionDown = (index: number) => {
    if (index === sectionsConfig.length - 1) return;
    const copy = [...sectionsConfig];
    const temp = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = temp;
    reorderSections(copy);
  };

  const handleReorderTask = (fromIdx: number, toIdx: number) => {
    const res = reorderTasks(selectedSectionKey, fromIdx, toIdx, srMapping => {
      remapTaskKeys(selectedSectionKey, srMapping);
    });
    if (res.success && onSuccessNotice) {
      const movedTask = (tasksMaster[selectedSectionKey] || [])[toIdx];
      if (movedTask) {
        onSuccessNotice(`Task moved to position ${toIdx + 1} and automatically assigned Sr# ${movedTask.sr}.`);
      }
    }
  };

  const currentSectionTasks = tasksMaster[selectedSectionKey] || [];
  const currentSection = sectionsConfig.find(s => s.key === selectedSectionKey) || sectionsConfig[0];

  return (
    <div className="space-y-6">
      {/* Overview & Admin Guidance Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Operational Categories & SOP Task Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure banking shifts, recurring checklist sections, and standard operating procedures (SOP).
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onRequestResetMaster}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            title="Reset master SOP to standard factory banking defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Bank Defaults
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Manage Sections / Shift Categories */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Shift Categories ({sectionsConfig.length})</h3>

            <div className="space-y-2">
              {sectionsConfig.map((sec, idx) => {
                const count = (tasksMaster[sec.key] || []).length;
                const isSelected = sec.key === selectedSectionKey;

                return (
                  <div
                    key={sec.key}
                    onClick={() => setSelectedSectionKey(sec.key)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 text-slate-900 shadow-2xs ring-1 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-semibold">{sec.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {count} tasks · Key: {sec.key}
                      </div>
                    </div>

                    {isAdmin && (
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleMoveSectionUp(idx)}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSectionDown(idx)}
                          disabled={idx === sectionsConfig.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteSection(sec.key, sec.title)}
                          disabled={sectionsConfig.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 ml-1"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Create New Section Form (Admin only) */}
            {isAdmin && (
              <form onSubmit={handleCreateSection} className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Add Custom Shift Category
                </h4>
                <div>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Quarterly Compliance Routines"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Category
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Master Tasks for Selected Category */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tasks in &quot;{currentSection?.title}&quot;
                </h3>
                <p className="text-xs text-slate-500">
                  {currentSectionTasks.length} standard SOP tasks registered. Drag tasks or use arrows to reorder; numbers will auto-update.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onOpenAddTaskModal(selectedSectionKey)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add SOP Task
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {currentSectionTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No tasks currently in this category. Click &quot;Add SOP Task&quot; above to create one.
                </div>
              ) : (
                currentSectionTasks.map((t, idx) => {
                  const isBeingDragged = draggedTaskIdx === idx;
                  const isTarget = dragOverTaskIdx === idx;

                  return (
                    <div
                      key={t.sr}
                      draggable={isAdmin}
                      onDragStart={e => {
                        if (!isAdmin) return;
                        e.dataTransfer.setData('text/plain', String(idx));
                        setDraggedTaskIdx(idx);
                      }}
                      onDragOver={e => {
                        if (isAdmin && draggedTaskIdx !== null) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }
                      }}
                      onDragEnter={() => {
                        if (isAdmin && draggedTaskIdx !== null) {
                          setDragOverTaskIdx(idx);
                        }
                      }}
                      onDrop={e => {
                        if (!isAdmin) return;
                        e.preventDefault();
                        if (draggedTaskIdx !== null) {
                          handleReorderTask(draggedTaskIdx, idx);
                        }
                        setDraggedTaskIdx(null);
                        setDragOverTaskIdx(null);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskIdx(null);
                        setDragOverTaskIdx(null);
                      }}
                      className={`p-3.5 flex items-center justify-between gap-4 transition-all hover:bg-slate-50/70 ${
                        isBeingDragged ? 'opacity-40 bg-slate-100' : ''
                      } ${isTarget ? 'border-t-2 border-blue-500 bg-blue-50/60' : ''}`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Drag Handle */}
                        {isAdmin && (
                          <div
                            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 self-center"
                            title="Drag to reorder task"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}

                        {/* Serial Number */}
                        <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-700 shrink-0">
                          #{t.sr}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{t.task}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                              {t.profile}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                            <span>Freq: {t.nature || '-'}</span>
                            <span>·</span>
                            <span>Cutoff Time: {t.time || '-'}</span>
                            {t.note && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-sky-600 truncate max-w-xs">{t.note}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleReorderTask(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded-md transition-colors"
                            title="Move Up (renumbers automatically)"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderTask(idx, idx + 1)}
                            disabled={idx === currentSectionTasks.length - 1}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded-md transition-colors"
                            title="Move Down (renumbers automatically)"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEditTaskModal(selectedSectionKey, idx, t)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Task"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDeleteTask(selectedSectionKey, idx, t)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
