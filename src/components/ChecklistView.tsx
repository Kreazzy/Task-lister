import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Clock,
  Layers,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useHistory } from '../context/HistoryContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { TaskItem } from '../types';

interface ChecklistViewProps {
  onOpenAddTaskModal: (sectionKey?: string) => void;
  onOpenEditTaskModal: (sectionKey: string, index: number, task: TaskItem) => void;
  onRequestDeleteTask: (sectionKey: string, index: number, task: TaskItem) => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  onOpenAddTaskModal,
  onOpenEditTaskModal,
  onRequestDeleteTask,
}) => {
  const { sectionsConfig, tasksMaster, reorderTasks } = useTasks();
  const {
    viewingDateStr,
    historyDB,
    toggleTaskCheck,
    updateTaskMeta,
    quickSignInit,
    quickSignAuth,
    getSectionStats,
    remapTaskKeys,
  } = useHistory();
  const { currentUser, isAdmin } = useAuth();
  const { settings } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [profileFilter, setProfileFilter] = useState<string>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Drag and drop states
  const [draggedItem, setDraggedItem] = useState<{ sectionKey: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<{ sectionKey: string; index: number } | null>(null);

  const toggleSectionCollapse = (key: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const dayRecord = historyDB[viewingDateStr] || {};

  const getProfileBadgeStyle = (profile: string) => {
    const p = (profile || '').toLowerCase();
    if (p.includes('utility')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (p.includes('browser')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (p.includes('server') || p.includes('db')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (p.includes('email')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (p.includes('validation')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (p.includes('service') || p.includes('process')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Row padding based on density setting
  const rowCellPadding = settings.density === 'compact' ? 'py-1.5 px-2.5 text-xs' : 'py-2.5 px-3 text-xs';

  const filteredTasksBySection = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result: Record<string, { task: TaskItem; originalIndex: number }[]> = {};

    sectionsConfig.forEach(sec => {
      const tasks = tasksMaster[sec.key] || [];
      const matches: { task: TaskItem; originalIndex: number }[] = [];

      tasks.forEach((item, idx) => {
        const matchesQuery =
          !q ||
          item.task.toLowerCase().includes(q) ||
          item.profile.toLowerCase().includes(q) ||
          item.nature.toLowerCase().includes(q) ||
          item.time.toLowerCase().includes(q) ||
          String(item.sr).includes(q) ||
          (item.note && item.note.toLowerCase().includes(q));

        const matchesProfile =
          profileFilter === 'all' ||
          item.profile.toLowerCase() === profileFilter.toLowerCase();

        if (matchesQuery && matchesProfile) {
          matches.push({ task: item, originalIndex: idx });
        }
      });

      result[sec.key] = matches;
    });

    return result;
  }, [sectionsConfig, tasksMaster, searchQuery, profileFilter]);

  // Unified chronological timeline of tasks across all sections
  const timelineTasks = useMemo(() => {
    const list: { task: TaskItem; sectionKey: string; sectionTitle: string; originalIndex: number }[] = [];
    const q = searchQuery.toLowerCase().trim();

    sectionsConfig.forEach(sec => {
      const tasks = tasksMaster[sec.key] || [];
      tasks.forEach((item, idx) => {
        const matchesQuery =
          !q ||
          item.task.toLowerCase().includes(q) ||
          item.profile.toLowerCase().includes(q) ||
          item.nature.toLowerCase().includes(q) ||
          item.time.toLowerCase().includes(q) ||
          String(item.sr).includes(q) ||
          (item.note && item.note.toLowerCase().includes(q));

        const matchesProfile =
          profileFilter === 'all' ||
          item.profile.toLowerCase() === profileFilter.toLowerCase();

        if (matchesQuery && matchesProfile) {
          list.push({
            task: item,
            sectionKey: sec.key,
            sectionTitle: sec.title,
            originalIndex: idx,
          });
        }
      });
    });

    return list;
  }, [sectionsConfig, tasksMaster, searchQuery, profileFilter]);

  const handleReorder = (sectionKey: string, fromIdx: number, toIdx: number) => {
    reorderTasks(sectionKey, fromIdx, toIdx, srMapping => {
      remapTaskKeys(sectionKey, srMapping);
    });
  };

  const isDragEnabled = isAdmin && !searchQuery && profileFilter === 'all';

  return (
    <div className="space-y-6">
      {/* Search and Quick Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by task name, Sr#, nature, profile, or routine command..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={profileFilter}
            onChange={e => setProfileFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Profiles</option>
            <option value="Prod Server">Prod Server</option>
            <option value="Server">Server</option>
            <option value="DB Server">DB Server</option>
            <option value="Utility">Utility</option>
            <option value="Browser">Browser</option>
            <option value="Validation">Validation</option>
            <option value="EMAIL">EMAIL</option>
            <option value="Service">Service</option>
          </select>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onOpenAddTaskModal()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Render Format Option 1: Chronological Shift Timeline */}
      {settings.layoutFormat === 'timeline' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Unified Chronological Shift Schedule ({timelineTasks.length} tasks)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Timeline View</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                  <th className={`${rowCellPadding} text-center w-12 font-mono`}>Sr#</th>
                  <th className={`${rowCellPadding} w-32 whitespace-nowrap`}>Shift Category</th>
                  <th className={`${rowCellPadding} w-28 whitespace-nowrap`}>Scheduled Time</th>
                  <th className={`${rowCellPadding}`}>Task Description</th>
                  <th className={`${rowCellPadding} w-28 whitespace-nowrap`}>Profile</th>
                  <th className={`${rowCellPadding} text-center w-16`}>Status</th>
                  <th className={`${rowCellPadding} w-28`}>Exec Time</th>
                  <th className={`${rowCellPadding} w-28`}>Inputer</th>
                  <th className={`${rowCellPadding} w-28`}>Verifier</th>
                  {isAdmin && <th className={`${rowCellPadding} text-center w-20`}>Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timelineTasks.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 9} className="py-8 text-center text-xs text-slate-400 italic">
                      No operational tasks found matching your search.
                    </td>
                  </tr>
                ) : (
                  timelineTasks.map(({ task: item, sectionKey, sectionTitle, originalIndex }) => {
                    const taskId = `${sectionKey}-${item.sr}`;
                    const saved = dayRecord[taskId] || { checked: false, time: '', init: '', auth: '' };
                    const isDone = !!saved.checked;

                    return (
                      <tr
                        key={taskId}
                        className={`transition-colors hover:bg-slate-50/70 ${isDone ? 'bg-emerald-50/40' : ''}`}
                      >
                        <td className={`${rowCellPadding} text-center font-mono font-bold text-slate-500`}>
                          #{item.sr}
                        </td>
                        <td className={`${rowCellPadding} text-slate-600 whitespace-nowrap`}>
                          <span className="px-2 py-0.5 rounded-sm bg-slate-100 font-medium text-[11px] text-slate-700">
                            {sectionTitle.split(' ')[0]}
                          </span>
                        </td>
                        <td className={`${rowCellPadding} font-mono font-bold text-blue-700 whitespace-nowrap`}>
                          {item.time || '-'}
                        </td>
                        <td className={rowCellPadding}>
                          <div className={`font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {item.task}
                          </div>
                          {item.note && (
                            <div className="font-mono text-[11px] text-sky-600 mt-0.5">{item.note}</div>
                          )}
                        </td>
                        <td className={rowCellPadding}>
                          <span className={`inline-block px-2 py-0.5 rounded-sm border text-[11px] font-semibold tracking-wide whitespace-nowrap ${getProfileBadgeStyle(item.profile)}`}>
                            {item.profile || 'Other'}
                          </span>
                        </td>
                        <td className={`${rowCellPadding} text-center`}>
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={e =>
                              toggleTaskCheck(
                                sectionKey,
                                item.sr,
                                e.target.checked,
                                currentUser?.initials,
                                currentUser?.id
                              )
                            }
                            className="w-4 h-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                          />
                        </td>
                        <td className={rowCellPadding}>
                          <input
                            type="text"
                            value={saved.time || ''}
                            onChange={e => updateTaskMeta(sectionKey, item.sr, 'time', e.target.value)}
                            placeholder="--:--"
                            className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-200 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className={rowCellPadding}>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={saved.init || ''}
                              maxLength={8}
                              onChange={e => updateTaskMeta(sectionKey, item.sr, 'init', e.target.value)}
                              placeholder="Init"
                              className="w-16 px-1.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-sm uppercase focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                            {!saved.init && currentUser && (
                              <button
                                type="button"
                                onClick={() => quickSignInit(sectionKey, item.sr, currentUser.initials, currentUser.id)}
                                className="px-1.5 py-1 text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 rounded-sm transition-colors cursor-pointer"
                                title={`Sign with ${currentUser.initials}`}
                              >
                                {currentUser.initials}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className={rowCellPadding}>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={saved.auth || ''}
                              maxLength={8}
                              onChange={e => updateTaskMeta(sectionKey, item.sr, 'auth', e.target.value)}
                              placeholder="Auth"
                              className="w-16 px-1.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-sm uppercase focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                            {!saved.auth && isAdmin && currentUser && (
                              <button
                                type="button"
                                onClick={() => quickSignAuth(sectionKey, item.sr, currentUser.initials, currentUser.id)}
                                className="px-1.5 py-1 text-[10px] font-bold text-purple-600 hover:text-white hover:bg-purple-600 border border-purple-200 rounded-sm transition-colors cursor-pointer"
                                title={`Verify as ${currentUser.initials}`}
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className={`${rowCellPadding} text-center`}>
                            <button
                              type="button"
                              onClick={() => onOpenEditTaskModal(sectionKey, originalIndex, item)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors cursor-pointer"
                              title="Edit Task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Render Format Option 2: Grouped Category Cards (Standard Sections) */
        <div className="space-y-6">
          {sectionsConfig.map(sec => {
            const matchedItems = filteredTasksBySection[sec.key] || [];
            const stats = getSectionStats(sec.key);
            const isCollapsed = !!collapsedSections[sec.key];
            const totalTasksCount = (tasksMaster[sec.key] || []).length;

            return (
              <div
                key={sec.key}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSectionCollapse(sec.key)}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      title={isCollapsed ? 'Expand section' : 'Collapse section'}
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        {sec.title}
                        {isDragEnabled && (
                          <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                            Drag rows or use arrows to reorder
                          </span>
                        )}
                      </h2>
                      {sec.description && <p className="text-xs text-slate-500">{sec.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                      {stats.percentage}% Complete ({stats.completed}/{stats.total})
                    </span>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onOpenAddTaskModal(sec.key)}
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                        title="Add task to this section"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Task Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                          {isAdmin && <th className={`${rowCellPadding} w-8 text-center`} />}
                          <th className={`${rowCellPadding} text-center w-12 font-mono`}>Sr#</th>
                          <th className={`${rowCellPadding} w-28 whitespace-nowrap`}>Nature</th>
                          <th className={`${rowCellPadding} w-28 whitespace-nowrap`}>Time</th>
                          <th className={`${rowCellPadding}`}>Task Description</th>
                          <th className={`${rowCellPadding} w-28 whitespace-nowrap`}>Profile</th>
                          <th className={`${rowCellPadding} text-center w-16`}>Status</th>
                          <th className={`${rowCellPadding} w-28`}>Exec Time</th>
                          <th className={`${rowCellPadding} w-28`}>Inputer</th>
                          <th className={`${rowCellPadding} w-28`}>Verifier</th>
                          {isAdmin && <th className={`${rowCellPadding} text-center w-28`}>Admin</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {matchedItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={isAdmin ? 11 : 9}
                              className="py-6 text-center text-xs text-slate-400 italic"
                            >
                              No operational tasks found matching your search.
                            </td>
                          </tr>
                        ) : (
                          matchedItems.map(({ task: item, originalIndex }) => {
                            const taskId = `${sec.key}-${item.sr}`;
                            const saved = dayRecord[taskId] || {
                              checked: false,
                              time: '',
                              init: '',
                              auth: '',
                            };
                            const isDone = !!saved.checked;
                            const isBeingDragged =
                              draggedItem?.sectionKey === sec.key &&
                              draggedItem?.index === originalIndex;
                            const isTargetOfDrag =
                              dragOverIndex?.sectionKey === sec.key &&
                              dragOverIndex?.index === originalIndex;

                            return (
                              <tr
                                key={item.sr}
                                draggable={isDragEnabled}
                                onDragStart={e => {
                                  if (!isDragEnabled) return;
                                  e.dataTransfer.setData('text/plain', String(originalIndex));
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDraggedItem({ sectionKey: sec.key, index: originalIndex });
                                }}
                                onDragOver={e => {
                                  if (isDragEnabled && draggedItem?.sectionKey === sec.key) {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                  }
                                }}
                                onDragEnter={() => {
                                  if (isDragEnabled && draggedItem?.sectionKey === sec.key) {
                                    setDragOverIndex({ sectionKey: sec.key, index: originalIndex });
                                  }
                                }}
                                onDrop={e => {
                                  if (!isDragEnabled) return;
                                  e.preventDefault();
                                  if (draggedItem && draggedItem.sectionKey === sec.key) {
                                    handleReorder(sec.key, draggedItem.index, originalIndex);
                                  }
                                  setDraggedItem(null);
                                  setDragOverIndex(null);
                                }}
                                onDragEnd={() => {
                                  setDraggedItem(null);
                                  setDragOverIndex(null);
                                }}
                                className={`transition-colors hover:bg-slate-50/70 ${
                                  isDone ? 'bg-emerald-50/40' : ''
                                } ${isBeingDragged ? 'opacity-40 bg-slate-100' : ''} ${
                                  isTargetOfDrag ? 'border-t-2 border-blue-500 bg-blue-50/60' : ''
                                }`}
                              >
                                {/* Drag Handle Column for Admins */}
                                {isAdmin && (
                                  <td className={`${rowCellPadding} text-center text-slate-300 hover:text-slate-600`}>
                                    {isDragEnabled ? (
                                      <span
                                        className="cursor-grab active:cursor-grabbing inline-block"
                                        title="Drag row to move position (number auto-updates)"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </span>
                                    ) : null}
                                  </td>
                                )}

                                {/* Serial Number (auto-updates with position) */}
                                <td className={`${rowCellPadding} text-center font-mono font-bold text-slate-500`}>
                                  #{item.sr}
                                </td>

                                {/* Nature */}
                                <td className={`${rowCellPadding} text-slate-600 whitespace-nowrap`}>
                                  {item.nature || '-'}
                                </td>

                                {/* Time */}
                                <td className={`${rowCellPadding} font-mono text-slate-600 whitespace-nowrap`}>
                                  {item.time || '-'}
                                </td>

                                {/* Task Description */}
                                <td className={rowCellPadding}>
                                  <div
                                    className={`font-medium ${
                                      isDone ? 'line-through text-slate-400' : 'text-slate-900'
                                    }`}
                                  >
                                    {item.task}
                                  </div>
                                  {item.note && (
                                    <div className="font-mono text-[11px] text-sky-600 mt-0.5">
                                      {item.note}
                                    </div>
                                  )}
                                </td>

                                {/* Profile Category Badge */}
                                <td className={rowCellPadding}>
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-sm border text-[11px] font-semibold tracking-wide whitespace-nowrap ${getProfileBadgeStyle(
                                      item.profile
                                    )}`}
                                  >
                                    {item.profile || 'Other'}
                                  </span>
                                </td>

                                {/* Completion Checkbox */}
                                <td className={`${rowCellPadding} text-center`}>
                                  <input
                                    type="checkbox"
                                    checked={isDone}
                                    onChange={e =>
                                      toggleTaskCheck(
                                        sec.key,
                                        item.sr,
                                        e.target.checked,
                                        currentUser?.initials,
                                        currentUser?.id
                                      )
                                    }
                                    className="w-4 h-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                                  />
                                </td>

                                {/* Executed Time */}
                                <td className={rowCellPadding}>
                                  <input
                                    type="text"
                                    value={saved.time || ''}
                                    onChange={e =>
                                      updateTaskMeta(sec.key, item.sr, 'time', e.target.value)
                                    }
                                    placeholder="--:--"
                                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-200 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>

                                {/* Inputer Initials */}
                                <td className={rowCellPadding}>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={saved.init || ''}
                                      maxLength={8}
                                      onChange={e =>
                                        updateTaskMeta(sec.key, item.sr, 'init', e.target.value)
                                      }
                                      placeholder="Init"
                                      className="w-16 px-1.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-sm uppercase focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                    />
                                    {!saved.init && currentUser && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          quickSignInit(
                                            sec.key,
                                            item.sr,
                                            currentUser.initials,
                                            currentUser.id
                                          )
                                        }
                                        className="px-1.5 py-1 text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 rounded-sm transition-colors cursor-pointer"
                                        title={`Sign with ${currentUser.initials}`}
                                      >
                                        {currentUser.initials}
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Verifier Initials */}
                                <td className={rowCellPadding}>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={saved.auth || ''}
                                      maxLength={8}
                                      onChange={e =>
                                        updateTaskMeta(sec.key, item.sr, 'auth', e.target.value)
                                      }
                                      placeholder="Auth"
                                      className="w-16 px-1.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-sm uppercase focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                    />
                                    {!saved.auth && isAdmin && currentUser && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          quickSignAuth(
                                            sec.key,
                                            item.sr,
                                            currentUser.initials,
                                            currentUser.id
                                          )
                                        }
                                        className="px-1.5 py-1 text-[10px] font-bold text-purple-600 hover:text-white hover:bg-purple-600 border border-purple-200 rounded-sm transition-colors cursor-pointer"
                                        title={`Verify as ${currentUser.initials}`}
                                      >
                                        Verify
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Admin Actions (Move Up / Down, Edit, Delete) */}
                                {isAdmin && (
                                  <td className={`${rowCellPadding} text-center`}>
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleReorder(sec.key, originalIndex, originalIndex - 1)
                                        }
                                        disabled={originalIndex === 0}
                                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded-sm transition-colors cursor-pointer"
                                        title="Move Up (renumbers position automatically)"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleReorder(sec.key, originalIndex, originalIndex + 1)
                                        }
                                        disabled={originalIndex === totalTasksCount - 1}
                                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded-sm transition-colors cursor-pointer"
                                        title="Move Down (renumbers position automatically)"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onOpenEditTaskModal(sec.key, originalIndex, item)
                                        }
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors cursor-pointer"
                                        title="Edit Task"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onRequestDeleteTask(sec.key, originalIndex, item)
                                        }
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors cursor-pointer"
                                        title="Delete Task"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Monthly Footnote */}
                {sec.key === 'monthly' && (
                  <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
                    * EOM = End of Month &nbsp;|&nbsp; * SOM = Start of Month &nbsp;|&nbsp; Dual
                    approval required for all tax and interest routines.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
