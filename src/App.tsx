/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HistoryProvider, useHistory } from './context/HistoryContext';
import { Header } from './components/Header';
import { ChecklistView } from './components/ChecklistView';
import { AnalyticsView } from './components/AnalyticsView';
import { CategoryManagerView } from './components/CategoryManagerView';
import { UserManagerView } from './components/UserManagerView';
import { EmailExportModal } from './components/modals/EmailExportModal';
import { BackupModal } from './components/modals/BackupModal';
import { TaskEditModal } from './components/modals/TaskEditModal';
import { AuthModal } from './components/modals/AuthModal';
import { NoticeModal } from './components/modals/NoticeModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { ViewTab, TaskItem } from './types';
import { Plus, Mail, FileJson, Printer, RotateCcw, ShieldCheck } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<ViewTab>('checklist');

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalSectionKey, setTaskModalSectionKey] = useState<string | undefined>();
  const [taskModalIndex, setTaskModalIndex] = useState<number | undefined>();
  const [taskModalItem, setTaskModalItem] = useState<TaskItem | undefined>();

  // Notice & Confirm modals
  const [notice, setNotice] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    isDestructive: false,
    onConfirm: () => {},
  });

  const { deleteTask, deleteSection, resetMasterData } = useTasks();
  const { viewingDateStr, resetDay } = useHistory();
  const { isAdmin, deleteUser } = useAuth();

  // Enforce operator role restriction: operators can only view and fill out the checklist
  React.useEffect(() => {
    if (!isAdmin && currentTab !== 'checklist') {
      setCurrentTab('checklist');
    }
  }, [isAdmin, currentTab]);

  const showNotice = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setNotice({ isOpen: true, title, message, type });
  };

  const handleOpenAddTask = (sectionKey?: string) => {
    setTaskModalSectionKey(sectionKey);
    setTaskModalIndex(undefined);
    setTaskModalItem(undefined);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (sectionKey: string, index: number, task: TaskItem) => {
    setTaskModalSectionKey(sectionKey);
    setTaskModalIndex(index);
    setTaskModalItem(task);
    setIsTaskModalOpen(true);
  };

  const handleRequestDeleteTask = (sectionKey: string, index: number, task: TaskItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Operational Task',
      message: `Are you sure you want to delete task #${task.sr}: "${task.task}"? This will remove it from the master catalog.`,
      confirmLabel: 'Delete Task',
      isDestructive: true,
      onConfirm: () => {
        deleteTask(sectionKey, index);
        showNotice('Task Deleted', `Task #${task.sr} removed from SOP catalog.`, 'success');
      },
    });
  };

  const handleRequestDeleteSection = (key: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Shift Category',
      message: `Delete the entire category "${title}" and all associated SOP tasks? This cannot be undone.`,
      confirmLabel: 'Delete Category',
      isDestructive: true,
      onConfirm: () => {
        const deleted = deleteSection(key);
        if (deleted) {
          showNotice('Category Deleted', `"${title}" has been deleted.`, 'success');
        } else {
          showNotice('Action Prohibited', 'At least one operational category must remain.', 'warning');
        }
      },
    });
  };

  const handleRequestResetDay = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Shift Progress',
      message: `Are you sure you want to clear all completed checks, timestamps, and initials for shift date ${viewingDateStr}? This will reset the checklist for a clean shift handover.`,
      confirmLabel: 'Clear Shift Progress',
      isDestructive: true,
      onConfirm: () => {
        resetDay(viewingDateStr);
        showNotice('Shift Cleared', `Progress for ${viewingDateStr} has been reset.`, 'success');
      },
    });
  };

  const handleRequestResetMaster = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset to Factory SOP Defaults',
      message: 'Restore all 5 default bank sections and original standard master tasks? Custom added tasks will be replaced.',
      confirmLabel: 'Restore Bank Defaults',
      isDestructive: true,
      onConfirm: () => {
        resetMasterData();
        showNotice('Defaults Restored', 'Standard Soneri Bank SOP catalog restored.', 'success');
      },
    });
  };

  const handleRequestDeleteUser = (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Staff Profile',
      message: `Remove "${userName}" from the IT Operations roster?`,
      confirmLabel: 'Delete Staff',
      isDestructive: true,
      onConfirm: () => {
        const deleted = deleteUser(userId);
        if (deleted) {
          showNotice('Staff Removed', `User "${userName}" has been removed.`, 'success');
        } else {
          showNotice('Cannot Delete User', 'You cannot delete the active session user or the sole remaining admin.', 'warning');
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* Portal Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenEmailModal={() => setIsEmailModalOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onRequestResetDay={handleRequestResetDay}
        />

        {/* Tab View Router */}
        <main className="transition-all duration-200">
          {currentTab === 'checklist' && (
            <ChecklistView
              onOpenAddTaskModal={handleOpenAddTask}
              onOpenEditTaskModal={handleOpenEditTask}
              onRequestDeleteTask={handleRequestDeleteTask}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView onOpenEmailModal={() => setIsEmailModalOpen(true)} />
          )}

          {currentTab === 'categories' && (
            <CategoryManagerView
              onOpenAddTaskModal={handleOpenAddTask}
              onOpenEditTaskModal={handleOpenEditTask}
              onRequestDeleteTask={handleRequestDeleteTask}
              onRequestDeleteSection={handleRequestDeleteSection}
              onRequestResetMaster={handleRequestResetMaster}
              onSuccessNotice={msg => showNotice('Notice', msg, 'success')}
            />
          )}

          {currentTab === 'users' && (
            <UserManagerView
              onSuccessNotice={msg => showNotice('User Notice', msg, 'success')}
              onRequestDeleteUser={handleRequestDeleteUser}
            />
          )}
        </main>

        {/* Quiet Credit & Institutional Footer */}
        <footer className="mt-12 text-center text-xs text-slate-500 py-4 border-t border-slate-200 space-y-1">
          <div>Soneri Bank Limited · Information Technology Operations Directorate</div>
          <div className="text-[11px] text-slate-400">
            Automated Shift Checklist & Handover Verification System · Standard V5.0
          </div>
        </footer>
      </div>

      {/* Floating Quick Action Bar (Right side on desktop, bottom on mobile) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-2 z-40 bg-white/95 p-2 rounded-xl shadow-lg border border-slate-200 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setIsEmailModalOpen(true)}
          className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-white hover:bg-sky-600 transition-colors"
          title="Email / Excel Formatted Export"
        >
          <Mail className="w-4 h-4 text-sky-600" />
          <span className="hidden group-hover:inline">Email Report</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-white hover:bg-blue-600 transition-colors"
            title="JSON Backup & Restore (Admin)"
          >
            <FileJson className="w-4 h-4 text-blue-600" />
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => handleOpenAddTask()}
            className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-white hover:bg-emerald-600 transition-colors"
            title="Add New SOP Task"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-white hover:bg-purple-600 transition-colors"
          title="User & Role Switch"
        >
          <ShieldCheck className="w-4 h-4 text-purple-600" />
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-white hover:bg-slate-700 transition-colors"
          title="Print Checklist Sheet"
        >
          <Printer className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Modals */}
      <EmailExportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSuccessNotice={msg => showNotice('Export Complete', msg, 'success')}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onSuccessNotice={(title, msg) => showNotice(title, msg, 'success')}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessNotice={msg => showNotice('Authentication', msg, 'success')}
      />

      <TaskEditModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        sectionKey={taskModalSectionKey}
        taskIndex={taskModalIndex}
        taskToEdit={taskModalItem}
        onSuccessNotice={msg => showNotice('Task Catalog', msg, 'success')}
      />

      <NoticeModal
        isOpen={notice.isOpen}
        title={notice.title}
        message={notice.message}
        type={notice.type}
        onClose={() => setNotice(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default function App() {
  return (
    <TaskProvider>
      <AuthProvider>
        <HistoryProvider>
          <DashboardContent />
        </HistoryProvider>
      </AuthProvider>
    </TaskProvider>
  );
}
