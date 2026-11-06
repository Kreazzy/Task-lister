import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  GripVertical,
  X,
  Check,
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
  const { sectionsConfig, tasksMaster, addSection, editSection, reorderSections, reorderTasks, syncMasterCatalog } = useTasks();
  const { remapTaskKeys } = useHistory();
  const { isAdmin } = useAuth();

  const totalMasterCount = Object.values(tasksMaster).reduce((acc, list) => acc + (list || []).length, 0);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>(
    sectionsConfig[0]?.key || 'morn'
  );

  // Editing Section Modal state
  const [editingSection, setEditingSection] = useState<SectionConfig | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

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

  const handleStartEditSection = (sec: SectionConfig) => {
    setEditingSection(sec);
    setEditTitle(sec.title);
    setEditDesc(sec.description || '');
  };

  const handleSaveEditSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editTitle.trim()) return;

    editSection(editingSection.key, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });

    const updatedName = editTitle.trim();
    setEditingSection(null);
    if (onSuccessNotice) {
      onSuccessNotice(`Shift category "${updatedName}" updated successfully.`);
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
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Operational Categories & SOP Task Catalog
            </h2>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Total Master Tasks: {totalMasterCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure banking shifts, edit category titles & descriptions, and customize standard operating procedures (SOP).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                const res = syncMasterCatalog();
                if (onSuccessNotice) {
                  onSuccessNotice(
                    res.added > 0
                      ? `Successfully synchronized: Added ${res.added} missing standard tasks. Master catalog now contains all ${res.count} tasks (#1 through #100).`
                      : `Catalog Verified: All ${res.count} contiguous standard tasks are actively loaded (#1 through #100).`
                  );
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors cursor-pointer"
              title="Ensure all 100 contiguous banking SOP tasks (#1 to #100) are loaded in catalog"
            >
              <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Sync 100 Master Tasks
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={onRequestResetMaster}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer"
              title="Reset master SOP to standard factory banking defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Factory Defaults
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Manage Sections / Shift Categories */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Shift Categories ({sectionsConfig.length})</h3>

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
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/30 text-slate-900 dark:text-blue-200 shadow-2xs ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex-1 pr-2 min-w-0">
                      <div className="font-semibold truncate">{sec.title}</div>
                      {sec.description && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {sec.description}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {count} tasks · Key: {sec.key}
                      </div>
                    </div>

                    {isAdmin && (
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Edit Category Title & Short Description */}
                        <button
                          type="button"
                          onClick={() => handleStartEditSection(sec)}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-sm transition-colors cursor-pointer"
                          title="Edit category name and description"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSectionUp(idx)}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSectionDown(idx)}
                          disabled={idx === sectionsConfig.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteSection(sec.key, sec.title)}
                          disabled={sectionsConfig.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-20 ml-0.5 cursor-pointer"
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
              <form onSubmit={handleCreateSection} className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Add Custom Shift Category
                </h4>
                <div>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Quarterly Compliance Routines"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tasks in &quot;{currentSection?.title}&quot;
                  </h3>
                  {isAdmin && currentSection && (
                    <button
                      type="button"
                      onClick={() => handleStartEditSection(currentSection)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                      title="Edit this category title or description"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentSection?.description ? `${currentSection.description} · ` : ''}
                  {currentSectionTasks.length} standard SOP tasks registered.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onOpenAddTaskModal(selectedSectionKey)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add SOP Task
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
              {currentSectionTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
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
                      className={`p-3.5 flex items-center justify-between gap-4 transition-all hover:bg-slate-50/70 dark:hover:bg-slate-700/40 ${
                        isBeingDragged ? 'opacity-40 bg-slate-100 dark:bg-slate-700' : ''
                      } ${isTarget ? 'border-t-2 border-blue-500 bg-blue-50/60 dark:bg-blue-900/40' : ''}`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Drag Handle */}
                        {isAdmin && (
                          <div
                            className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 self-center"
                            title="Drag to reorder task"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}

                        {/* Serial Number */}
                        <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                          #{t.sr}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{t.task}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {t.profile}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                            <span>Freq: {t.nature || '-'}</span>
                            <span>·</span>
                            <span>Cutoff Time: {t.time || '-'}</span>
                            {t.note && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-sky-600 dark:text-sky-400 truncate max-w-xs">{t.note}</span>
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
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded-md transition-colors cursor-pointer"
                            title="Move Up (renumbers automatically)"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderTask(idx, idx + 1)}
                            disabled={idx === currentSectionTasks.length - 1}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded-md transition-colors cursor-pointer"
                            title="Move Down (renumbers automatically)"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEditTaskModal(selectedSectionKey, idx, t)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDeleteTask(selectedSectionKey, idx, t)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors cursor-pointer"
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

      {/* Edit Category Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold">Edit Shift Category Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSection} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Category Name / Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="e.g. Daily Operation Tasks (Morning)"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Short Description & Shift Scope
                </label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  placeholder="e.g. Morning initialization, rate downloads, system health & connectivity"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Category Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
