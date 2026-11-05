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
  addTask: (sectionKey: string, taskData: Omit<TaskItem, 'sr'> & { sr?: number }) => { success: boolean; sr: number; wasCorrected: boolean };
  editTask: (sectionKey: string, index: number, updated: TaskItem) => { success: boolean; sr: number; wasCorrected: boolean };
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

  // Save to localStorage on change
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
    setSectionsConfig(prev => [...prev, newSection]);
    setTasksMaster(prev => ({
      ...prev,
      [key]: [],
    }));
    return key;
  };

  const deleteSection = (key: string): boolean => {
    if (sectionsConfig.length <= 1) {
      return false;
    }
    setSectionsConfig(prev => prev.filter(s => s.key !== key));
    setTasksMaster(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    return true;
  };

  const reorderSections = (newSections: SectionConfig[]) => {
    setSectionsConfig(newSections);
  };

  const addTask = (
    sectionKey: string,
    taskData: Omit<TaskItem, 'sr'> & { sr?: number }
  ): { success: boolean; sr: number; wasCorrected: boolean } => {
    let sr = taskData.sr;
    let wasCorrected = false;

    if (!sr || isSrTaken(sr)) {
      sr = getNextGlobalSr();
      wasCorrected = true;
    }

    const newTask: TaskItem = {
      sr,
      nature: taskData.nature.trim() || 'Daily',
      time: taskData.time.trim() || '-',
      task: taskData.task.trim(),
      profile: taskData.profile || 'Other',
      note: taskData.note?.trim() || undefined,
    };

    setTasksMaster(prev => {
      const currentList = prev[sectionKey] ? [...prev[sectionKey]] : [];
      currentList.push(newTask);
      currentList.sort((a, b) => a.sr - b.sr);
      return {
        ...prev,
        [sectionKey]: currentList,
      };
    });

    return { success: true, sr, wasCorrected };
  };

  const editTask = (
    sectionKey: string,
    index: number,
    updated: TaskItem
  ): { success: boolean; sr: number; wasCorrected: boolean } => {
    let sr = updated.sr;
    let wasCorrected = false;

    if (isSrTaken(sr, sectionKey, index)) {
      sr = getNextGlobalSr();
      wasCorrected = true;
    }

    const updatedTask: TaskItem = {
      ...updated,
      sr,
      nature: updated.nature.trim() || 'Daily',
      time: updated.time.trim() || '-',
      task: updated.task.trim(),
      profile: updated.profile || 'Other',
      note: updated.note?.trim() || undefined,
    };

    setTasksMaster(prev => {
      const currentList = prev[sectionKey] ? [...prev[sectionKey]] : [];
      currentList[index] = updatedTask;
      currentList.sort((a, b) => a.sr - b.sr);
      return {
        ...prev,
        [sectionKey]: currentList,
      };
    });

    return { success: true, sr, wasCorrected };
  };

  const deleteTask = (sectionKey: string, index: number) => {
    setTasksMaster(prev => {
      const currentList = prev[sectionKey] ? [...prev[sectionKey]] : [];
      currentList.splice(index, 1);
      return {
        ...prev,
        [sectionKey]: currentList,
      };
    });
  };

  const reorderTasks = (
    sectionKey: string,
    fromIndex: number,
    toIndex: number,
    onSrRemapped?: (srMapping: Record<number, number>) => void
  ): { success: boolean; srMapping: Record<number, number> } => {
    if (fromIndex === toIndex) return { success: false, srMapping: {} };
    const currentList = tasksMaster[sectionKey] ? [...tasksMaster[sectionKey]] : [];
    if (fromIndex < 0 || fromIndex >= currentList.length || toIndex < 0 || toIndex >= currentList.length) {
      return { success: false, srMapping: {} };
    }

    // Move task in array
    const [movedTask] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, movedTask);

    // Existing Sr# numbers in ascending order for this section
    const sortedSrs = (tasksMaster[sectionKey] || []).map(t => t.sr).sort((a, b) => a - b);

    // Renumber sequentially matching the new visual order
    const srMapping: Record<number, number> = {};
    const updatedList = currentList.map((item, idx) => {
      const newSr = sortedSrs[idx] !== undefined ? sortedSrs[idx] : (idx + 1);
      if (item.sr !== newSr) {
        srMapping[item.sr] = newSr;
      }
      return {
        ...item,
        sr: newSr,
      };
    });

    setTasksMaster(prev => ({
      ...prev,
      [sectionKey]: updatedList,
    }));

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

    return { success: true, srMapping };
  };

  const addSla = (slaData: Omit<SlaMilestone, 'id'>): SlaMilestone => {
    const newSla: SlaMilestone = {
      ...slaData,
      id: `sla-${Date.now().toString(36)}`,
    };
    setSlaMilestones(prev => [...prev, newSla]);
    return newSla;
  };

  const updateSla = (id: string, updates: Partial<Omit<SlaMilestone, 'id'>>) => {
    setSlaMilestones(prev =>
      prev.map(sla => (sla.id === id ? { ...sla, ...updates } : sla))
    );
  };

  const deleteSla = (id: string) => {
    setSlaMilestones(prev => prev.filter(sla => sla.id !== id));
  };

  const resetSlas = () => {
    setSlaMilestones(DEFAULT_SLA_MILESTONES);
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
