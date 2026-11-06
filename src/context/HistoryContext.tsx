import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { HistoryDB, TaskExecution } from '../types';
import { useTasks } from './TaskContext';

interface HistoryContextType {
  todayDateStr: string;
  viewingDateStr: string;
  historyDB: HistoryDB;
  lastSaveTime: string;
  availableDates: string[];
  setViewingDate: (date: string) => void;
  toggleTaskCheck: (
    sectionKey: string,
    sr: number,
    isChecked: boolean,
    defaultInitials?: string,
    userId?: string
  ) => void;
  updateTaskMeta: (
    sectionKey: string,
    sr: number,
    field: 'time' | 'init' | 'auth',
    value: string
  ) => void;
  quickSignInit: (sectionKey: string, sr: number, initials: string, userId?: string) => void;
  quickSignAuth: (sectionKey: string, sr: number, initials: string, userId?: string) => void;
  resetDay: (dateStr: string) => void;
  importHistory: (history: HistoryDB) => void;
  remapTaskKeys: (sectionKey: string, srMapping: Record<number, number>) => void;
  getDayExecution: (sectionKey: string, sr: number) => TaskExecution;
  getOverallStats: () => { total: number; completed: number; percentage: number; maxSr: number };
  getSectionStats: (sectionKey: string) => { total: number; completed: number; percentage: number };
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { sectionsConfig, tasksMaster } = useTasks();
  const [todayDateStr] = useState<string>(getTodayString);
  const [viewingDateStr, setViewingDateStr] = useState<string>(getTodayString);
  const [lastSaveTime, setLastSaveTime] = useState<string>('Saved just now');

  const [historyDB, setHistoryDB] = useState<HistoryDB>(() => {
    try {
      const saved = localStorage.getItem('sbl_history_db_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const today = getTodayString();
          if (!parsed[today]) parsed[today] = {};
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    const initial: HistoryDB = {};
    initial[getTodayString()] = {};
    return initial;
  });

  // Save history on change
  useEffect(() => {
    try {
      localStorage.setItem('sbl_history_db_v4', JSON.stringify(historyDB));
      const now = new Date();
      setLastSaveTime(`Saved at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
    } catch (e) {
      console.warn('Could not save historyDB to localStorage', e);
      setLastSaveTime('Storage limit warning');
    }
  }, [historyDB]);

  const availableDates = Object.keys(historyDB).sort().reverse();
  if (!availableDates.includes(todayDateStr)) {
    availableDates.unshift(todayDateStr);
  }

  const setViewingDate = (date: string) => {
    setViewingDateStr(date);
    if (!historyDB[date]) {
      setHistoryDB(prev => ({
        ...prev,
        [date]: {},
      }));
    }
  };

  const getDayExecution = (sectionKey: string, sr: number): TaskExecution => {
    const dayRecord = historyDB[viewingDateStr] || {};
    const taskId = `${sectionKey}-${sr}`;
    return dayRecord[taskId] || { checked: false, time: '', init: '', auth: '' };
  };

  const toggleTaskCheck = (
    sectionKey: string,
    sr: number,
    isChecked: boolean,
    defaultInitials?: string,
    userId?: string
  ) => {
    const taskId = `${sectionKey}-${sr}`;
    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setHistoryDB(prev => {
      const currentDay = { ...(prev[viewingDateStr] || {}) };
      const currentTask = currentDay[taskId] || { checked: false, time: '', init: '', auth: '' };

      const updatedTask: TaskExecution = {
        ...currentTask,
        checked: isChecked,
        time: isChecked ? (currentTask.time || currentTimeStr) : currentTask.time,
        init: isChecked && !currentTask.init && defaultInitials ? defaultInitials : currentTask.init,
        completedAt: isChecked ? now.toISOString() : undefined,
        completedByUserId: isChecked ? (userId || currentTask.completedByUserId) : undefined,
      };

      currentDay[taskId] = updatedTask;
      return {
        ...prev,
        [viewingDateStr]: currentDay,
      };
    });
  };

  const updateTaskMeta = (
    sectionKey: string,
    sr: number,
    field: 'time' | 'init' | 'auth',
    value: string
  ) => {
    const taskId = `${sectionKey}-${sr}`;
    setHistoryDB(prev => {
      const currentDay = { ...(prev[viewingDateStr] || {}) };
      const currentTask = currentDay[taskId] || { checked: false, time: '', init: '', auth: '' };

      currentDay[taskId] = {
        ...currentTask,
        [field]: value.trim(),
      };

      return {
        ...prev,
        [viewingDateStr]: currentDay,
      };
    });
  };

  const quickSignInit = (sectionKey: string, sr: number, initials: string, userId?: string) => {
    const taskId = `${sectionKey}-${sr}`;
    setHistoryDB(prev => {
      const currentDay = { ...(prev[viewingDateStr] || {}) };
      const currentTask = currentDay[taskId] || { checked: false, time: '', init: '', auth: '' };

      currentDay[taskId] = {
        ...currentTask,
        init: initials,
        completedByUserId: userId || currentTask.completedByUserId,
      };

      return {
        ...prev,
        [viewingDateStr]: currentDay,
      };
    });
  };

  const quickSignAuth = (sectionKey: string, sr: number, initials: string, userId?: string) => {
    const taskId = `${sectionKey}-${sr}`;
    setHistoryDB(prev => {
      const currentDay = { ...(prev[viewingDateStr] || {}) };
      const currentTask = currentDay[taskId] || { checked: false, time: '', init: '', auth: '' };

      currentDay[taskId] = {
        ...currentTask,
        auth: initials,
        verifiedByUserId: userId || currentTask.verifiedByUserId,
      };

      return {
        ...prev,
        [viewingDateStr]: currentDay,
      };
    });
  };

  const resetDay = (dateStr: string) => {
    setHistoryDB(prev => ({
      ...prev,
      [dateStr]: {},
    }));
  };

  const importHistory = (history: HistoryDB) => {
    if (history && typeof history === 'object') {
      const merged = { ...historyDB, ...history };
      if (!merged[todayDateStr]) merged[todayDateStr] = {};
      setHistoryDB(merged);
    }
  };

  const remapTaskKeys = (sectionKey: string, srMapping: Record<number, number>) => {
    setHistoryDB(prev => {
      const updatedHistory = { ...prev };
      Object.keys(updatedHistory).forEach(date => {
        const dayRecord = { ...(updatedHistory[date] || {}) };
        let changed = false;
        const remappedEntries: { newKey: string; data: TaskExecution }[] = [];
        const keysToDelete: string[] = [];

        Object.entries(srMapping).forEach(([oldSrStr, newSr]) => {
          const oldKey = `${sectionKey}-${oldSrStr}`;
          const newKey = `${sectionKey}-${newSr}`;
          if (dayRecord[oldKey]) {
            remappedEntries.push({ newKey, data: dayRecord[oldKey] });
            keysToDelete.push(oldKey);
            changed = true;
          }
        });

        if (changed) {
          keysToDelete.forEach(k => delete dayRecord[k]);
          remappedEntries.forEach(({ newKey, data }) => {
            dayRecord[newKey] = data;
          });
          updatedHistory[date] = dayRecord;
        }
      });
      return updatedHistory;
    });
  };

  const getSectionStats = (sectionKey: string) => {
    const tasks = tasksMaster[sectionKey] || [];
    const dayRecord = historyDB[viewingDateStr] || {};
    let completed = 0;
    tasks.forEach(t => {
      const id = `${sectionKey}-${t.sr}`;
      if (dayRecord[id]?.checked) completed++;
    });
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const getOverallStats = () => {
    let total = 0;
    let completed = 0;
    let maxSr = 0;
    const dayRecord = historyDB[viewingDateStr] || {};

    sectionsConfig.forEach(sec => {
      const tasks = tasksMaster[sec.key] || [];
      tasks.forEach(t => {
        total++;
        if (typeof t.sr === 'number' && t.sr > maxSr) {
          maxSr = t.sr;
        }
        const id = `${sec.key}-${t.sr}`;
        if (dayRecord[id]?.checked) completed++;
      });
    });

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage, maxSr };
  };

  return (
    <HistoryContext.Provider
      value={{
        todayDateStr,
        viewingDateStr,
        historyDB,
        lastSaveTime,
        availableDates,
        setViewingDate,
        toggleTaskCheck,
        updateTaskMeta,
        quickSignInit,
        quickSignAuth,
        resetDay,
        importHistory,
        remapTaskKeys,
        getDayExecution,
        getOverallStats,
        getSectionStats,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
