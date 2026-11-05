import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SectionConfig, TaskItem, SlaMilestone } from '../types';
import { DEFAULT_SECTIONS_CONFIG, DEFAULT_MASTER_TASKS, DEFAULT_SLA_MILESTONES } from '../data/defaultData';

interface TaskContextType {
  sectionsConfig: SectionConfig[];
  tasksMaster: Record<string, TaskItem[]>;
  slaMilestones: SlaMilestone[];
  getNextGlobalSr: () => number;
  isSrTaken: (sr: number, excludeSectionKey?: string, excludeIndex?: number) => boolean;
  addSection: (title: string, description?: string) => string;
  deleteSection: (key: string) => boolean;
  reorderSections: (newSections: SectionConfig[]) => void;
  addTask: (
    sectionKey: string,
    taskData: Omit<TaskItem, 'sr'> & { sr?: number },
    insertPosition?: number
  ) => { success: boolean; sr: number; wasCorrected: boolean };
  editTask: (
    sectionKey: string,
    index: number,
    updated: TaskItem,
    newPosition?: number
  ) => { success: boolean; sr: number; wasCorrected: boolean };
  deleteTask: (sectionKey: string, index: number) => void;
  reorderTasks: (
    sectionKey: string,
    fromIndex: number,
    toIndex: number,
    onSrRemapped?: (srMapping: Record<number, number>) => void
  ) => { success: boolean; srMapping: Record<number, number> };
  addSla: (slaData: Omit<SlaMilestone, 'id'>) => SlaMilestone;
  updateSla: (id: string, updates: Partial<Omit<SlaMilestone, 'id'>>) => void;
  deleteSla: (id: string) => void;
  resetSlas: () => void;
  importMasterData: (
    sections?: SectionConfig[],
    tasks?: Record<string, TaskItem[]>,
    slas?: SlaMilestone[]
  ) => void;
  resetMasterData: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

function slugify(text: string, existingKeys: string[]): string {
  let base = text.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
  if (!base) base = 'section';
  let candidate = base;
  let counter = 2;
  while (existingKeys.includes(candidate)) {
    candidate = `${base}-${counter}`;
    counter++;
  }
  return candidate;
}

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sectionsConfig, setSectionsConfig] = useState<SectionConfig[]>(() => {
    try {
      const saved = localStorage.getItem('sbl_sections_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_SECTIONS_CONFIG;
  });

  const [tasksMaster, setTasksMaster] = useState<Record<string, TaskItem[]>>(() => {
    try {
      const saved = localStorage.getItem('sbl_master_tasks_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_MASTER_TASKS;
  });

  const [slaMilestones, setSlaMilestones] = useState<SlaMilestone[]>(() => {
    try {
      const saved = localStorage.getItem('sbl_sla_milestones_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_SLA_MILESTONES;
  });

  // Save to localStorage on change and sync to server if available
  useEffect(() => {
    try {
      localStorage.setItem('sbl_sections_config_v1', JSON.stringify(sectionsConfig));
    } catch (e) {
      console.warn('Could not save sectionsConfig to localStorage', e);
    }
  }, [sectionsConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('sbl_master_tasks_v4', JSON.stringify(tasksMaster));
    } catch (e) {
      console.warn('Could not save tasksMaster to localStorage', e);
    }
  }, [tasksMaster]);

  useEffect(() => {
    try {
      localStorage.setItem('sbl_sla_milestones_v1', JSON.stringify(slaMilestones));
    } catch (e) {
      console.warn('Could not save slaMilestones to localStorage', e);
    }
  }, [slaMilestones]);

  const getNextGlobalSr = (): number => {
    let maxSr = 0;
    Object.values(tasksMaster).forEach(list => {
      (list || []).forEach(t => {
        if (typeof t.sr === 'number' && t.sr > maxSr) {
          maxSr = t.sr;
        }
      });
    });
    return maxSr + 1;
  };

  const isSrTaken = (sr: number, excludeSectionKey?: string, excludeIndex?: number): boolean => {
    let taken = false;
    Object.entries(tasksMaster).forEach(([sectionKey, list]) => {
      (list || []).forEach((t, idx) => {
        if (sectionKey === excludeSectionKey && idx === excludeIndex) return;
        if (t.sr === sr) taken = true;
      });
    });
    return taken;
  };

  const addSection = (title: string, description?: string): string => {
    const key = slugify(title, sectionsConfig.map(s => s.key));
    const newSection: SectionConfig = {
      key,
      title: title.trim(),
      description: description?.trim() || undefined,
    };
    const nextSections = [...sectionsConfig, newSection];
    const nextTasks = { ...tasksMaster, [key]: [] };

    setSectionsConfig(nextSections);
    setTasksMaster(nextTasks);

    // Sync to backend
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionsConfig: nextSections, tasksMaster: nextTasks }),
    }).catch(() => {});

    return key;
  };

  const deleteSection = (key: string): boolean => {
    if (sectionsConfig.length <= 1) {
      return false;
    }
    const nextSections = sectionsConfig.filter(s => s.key !== key);
    const nextTasks = { ...tasksMaster };
    delete nextTasks[key];

    setSectionsConfig(nextSections);
    setTasksMaster(nextTasks);

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionsConfig: nextSections, tasksMaster: nextTasks }),
    }).catch(() => {});

    return true;
  };

  const reorderSections = (newSections: SectionConfig[]) => {
    setSectionsConfig(newSections);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionsConfig: newSections }),
    }).catch(() => {});
  };

  const addTask = (
    sectionKey: string,
    taskData: Omit<TaskItem, 'sr'> & { sr?: number },
    insertPosition?: number
  ): { success: boolean; sr: number; wasCorrected: boolean } => {
    const currentList = tasksMaster[sectionKey] ? [...tasksMaster[sectionKey]] : [];

    // Calculate base serial number for this category
    const baseSr = currentList.length > 0
      ? Math.min(...currentList.map(t => t.sr))
      : getNextGlobalSr();

    let targetSr = taskData.sr;
    let wasCorrected = false;

    if (!targetSr || isSrTaken(targetSr)) {
      targetSr = getNextGlobalSr();
      wasCorrected = true;
    }

    const newTask: TaskItem = {
      sr: targetSr,
      nature: taskData.nature.trim() || 'Daily',
      time: taskData.time.trim() || '-',
      task: taskData.task.trim(),
      profile: taskData.profile || 'Other',
      note: taskData.note?.trim() || undefined,
    };

    // Determine target index: 0-indexed position
    let insertIdx = currentList.length;
    if (typeof insertPosition === 'number' && insertPosition >= 0 && insertPosition <= currentList.length) {
      insertIdx = insertPosition;
    }

    currentList.splice(insertIdx, 0, newTask);

    // Sequentially assign serial numbers so order matches visual placement
    const updatedList = currentList.map((item, idx) => ({
      ...item,
      sr: baseSr + idx,
    }));

    const finalAssignedSr = updatedList[insertIdx]?.sr || targetSr;

    const nextTasksMaster = {
      ...tasksMaster,
      [sectionKey]: updatedList,
    };

    setTasksMaster(nextTasksMaster);

    // Sync to backend
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasksMaster: nextTasksMaster }),
    }).catch(() => {});

    return { success: true, sr: finalAssignedSr, wasCorrected };
  };

  const editTask = (
    sectionKey: string,
    index: number,
    updated: TaskItem,
    newPosition?: number
  ): { success: boolean; sr: number; wasCorrected: boolean } => {
    const currentList = tasksMaster[sectionKey] ? [...tasksMaster[sectionKey]] : [];
    if (index < 0 || index >= currentList.length) {
      return { success: false, sr: updated.sr, wasCorrected: false };
    }

    const baseSr = Math.min(...currentList.map(t => t.sr));

    const updatedTask: TaskItem = {
      ...updated,
      nature: updated.nature.trim() || 'Daily',
      time: updated.time.trim() || '-',
      task: updated.task.trim(),
      profile: updated.profile || 'Other',
      note: updated.note?.trim() || undefined,
    };

    // Replace item
    currentList[index] = updatedTask;

    // If new position requested and different from current index
    if (typeof newPosition === 'number' && newPosition >= 0 && newPosition < currentList.length && newPosition !== index) {
      const [moved] = currentList.splice(index, 1);
      currentList.splice(newPosition, 0, moved);
    }

    // Renumber sequentially
    const updatedList = currentList.map((item, idx) => ({
      ...item,
      sr: baseSr + idx,
    }));

    const nextTasksMaster = {
      ...tasksMaster,
      [sectionKey]: updatedList,
    };

    setTasksMaster(nextTasksMaster);

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasksMaster: nextTasksMaster }),
    }).catch(() => {});

    const targetIndex = typeof newPosition === 'number' ? newPosition : index;
    return { success: true, sr: updatedList[targetIndex]?.sr || updated.sr, wasCorrected: false };
  };

  const deleteTask = (sectionKey: string, index: number) => {
    const currentList = tasksMaster[sectionKey] ? [...tasksMaster[sectionKey]] : [];
    if (index < 0 || index >= currentList.length) return;

    const baseSr = Math.min(...currentList.map(t => t.sr));
    currentList.splice(index, 1);

    // Renumber remaining tasks
    const updatedList = currentList.map((item, idx) => ({
      ...item,
      sr: baseSr + idx,
    }));

    const nextTasksMaster = {
      ...tasksMaster,
      [sectionKey]: updatedList,
    };

    setTasksMaster(nextTasksMaster);

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasksMaster: nextTasksMaster }),
    }).catch(() => {});
  };

  const reorderTasks = (
    sectionKey: string,
    fromIndex: number,
    toIndex: number,
    onSrRemapped?: (srMapping: Record<number, number>) => void
  ): { success: boolean; srMapping: Record<number, number> } => {
    if (fromIndex === toIndex) return { success: false, srMapping: {} };
    const currentList = tasksMaster[sectionKey] ? [...tasksMaster[sectionKey]] : [];
    if (
      fromIndex < 0 ||
      fromIndex >= currentList.length ||
      toIndex < 0 ||
      toIndex >= currentList.length
    ) {
      return { success: false, srMapping: {} };
    }

    // Move task in array
    const [movedTask] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, movedTask);

    // Calculate base Sr for this section (e.g. 1 for morn, 18 for daily, etc.)
    const allSrs = (tasksMaster[sectionKey] || []).map(t => t.sr);
    const baseSr = allSrs.length > 0 ? Math.min(...allSrs) : 1;

    // Renumber sequentially matching the new visual order
    const srMapping: Record<number, number> = {};
    const updatedList = currentList.map((item, idx) => {
      const newSr = baseSr + idx;
      if (item.sr !== newSr) {
        srMapping[item.sr] = newSr;
      }
      return {
        ...item,
        sr: newSr,
      };
    });

    const nextTasksMaster = {
      ...tasksMaster,
      [sectionKey]: updatedList,
    };

    setTasksMaster(nextTasksMaster);

    // Update SLA milestones if any taskKey changed
    if (Object.keys(srMapping).length > 0) {
      setSlaMilestones(prev =>
        prev.map(sla => {
          const prefix = `${sectionKey}-`;
          if (sla.taskKey.startsWith(prefix)) {
            const oldSrNum = parseInt(sla.taskKey.slice(prefix.length), 10);
            if (srMapping[oldSrNum]) {
              return {
                ...sla,
                taskKey: `${prefix}${srMapping[oldSrNum]}`,
              };
            }
          }
          return sla;
        })
      );

      if (onSrRemapped) {
        onSrRemapped(srMapping);
      }
    }

    // Inform server endpoint
    fetch('/api/tasks/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionKey, fromIndex, toIndex }),
    }).catch(() => {
      // Fallback direct sync
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasksMaster: nextTasksMaster }),
      }).catch(() => {});
    });

    return { success: true, srMapping };
  };

  const addSla = (slaData: Omit<SlaMilestone, 'id'>): SlaMilestone => {
    const newSla: SlaMilestone = {
      ...slaData,
      id: `sla-${Date.now().toString(36)}`,
    };
    const nextSlas = [...slaMilestones, newSla];
    setSlaMilestones(nextSlas);

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slaMilestones: nextSlas }),
    }).catch(() => {});

    return newSla;
  };

  const updateSla = (id: string, updates: Partial<Omit<SlaMilestone, 'id'>>) => {
    const nextSlas = slaMilestones.map(sla => (sla.id === id ? { ...sla, ...updates } : sla));
    setSlaMilestones(nextSlas);

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slaMilestones: nextSlas }),
    }).catch(() => {});
  };

  const deleteSla = (id: string) => {
    const nextSlas = slaMilestones.filter(sla => sla.id !== id);
    setSlaMilestones(nextSlas);

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slaMilestones: nextSlas }),
    }).catch(() => {});
  };

  const resetSlas = () => {
    setSlaMilestones(DEFAULT_SLA_MILESTONES);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slaMilestones: DEFAULT_SLA_MILESTONES }),
    }).catch(() => {});
  };

  const importMasterData = (
    importedSections?: SectionConfig[],
    importedTasks?: Record<string, TaskItem[]>,
    importedSlas?: SlaMilestone[]
  ) => {
    if (importedSections && Array.isArray(importedSections) && importedSections.length > 0) {
      setSectionsConfig(importedSections);
    }
    if (importedTasks && typeof importedTasks === 'object') {
      setTasksMaster(importedTasks);
    }
    if (importedSlas && Array.isArray(importedSlas) && importedSlas.length > 0) {
      setSlaMilestones(importedSlas);
    }
  };

  const resetMasterData = () => {
    setSectionsConfig(DEFAULT_SECTIONS_CONFIG);
    setTasksMaster(DEFAULT_MASTER_TASKS);
    setSlaMilestones(DEFAULT_SLA_MILESTONES);

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionsConfig: DEFAULT_SECTIONS_CONFIG,
        tasksMaster: DEFAULT_MASTER_TASKS,
        slaMilestones: DEFAULT_SLA_MILESTONES,
      }),
    }).catch(() => {});
  };

  return (
    <TaskContext.Provider
      value={{
        sectionsConfig,
        tasksMaster,
        slaMilestones,
        getNextGlobalSr,
        isSrTaken,
        addSection,
        deleteSection,
        reorderSections,
        addTask,
        editTask,
        deleteTask,
        reorderTasks,
        addSla,
        updateSla,
        deleteSla,
        resetSlas,
        importMasterData,
        resetMasterData,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
