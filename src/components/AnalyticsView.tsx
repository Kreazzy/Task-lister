import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  Printer,
  Mail,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useHistory } from '../context/HistoryContext';
import { useAuth } from '../context/AuthContext';
import { SlaManagerModal } from './modals/SlaManagerModal';

interface AnalyticsViewProps {
  onOpenEmailModal: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onOpenEmailModal }) => {
  const { sectionsConfig, tasksMaster, slaMilestones } = useTasks();
  const { viewingDateStr, historyDB, getOverallStats, getSectionStats } = useHistory();
  const { isAdmin } = useAuth();

  const [isSlaModalOpen, setIsSlaModalOpen] = useState(false);

  const dayRecord = historyDB[viewingDateStr] || {};
  const overall = getOverallStats();

  // Calculate Maker-Checker signature compliance
  let signedCount = 0;
  let unsignedCount = 0;

  sectionsConfig.forEach(sec => {
    const tasks = tasksMaster[sec.key] || [];
    tasks.forEach(t => {
      const id = `${sec.key}-${t.sr}`;
      const rec = dayRecord[id];
      if (rec?.checked) {
        if (rec.init) {
          signedCount++;
        }
      } else {
        unsignedCount++;
      }
    });
  });

  // Calculate SLA compliance
  const totalSlas = slaMilestones.length;
  const passedSlas = slaMilestones.filter(m => dayRecord[m.taskKey]?.checked).length;
  const isShiftPassed = overall.total > 0 && overall.completed === overall.total;
  const isShiftNearlyDone = overall.percentage >= 80;

  return (
    <div className="space-y-6">
      {/* Shift Pass/Fail Executive Summary Banner */}
      <div
        className={`p-6 rounded-xl border shadow-xs transition-all ${
          isShiftPassed
            ? 'bg-gradient-to-r from-emerald-900 to-slate-900 text-white border-emerald-700'
            : isShiftNearlyDone
            ? 'bg-gradient-to-r from-blue-900 to-slate-900 text-white border-blue-700'
            : 'bg-gradient-to-r from-slate-900 to-slate-950 text-white border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-300">
                Shift Audit Status
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-sky-300">{viewingDateStr}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
              {isShiftPassed ? (
                <>
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  <span>SHIFT STATUS: CERTIFIED PASS</span>
                </>
              ) : (
                <>
                  <Clock className="w-7 h-7 text-amber-400" />
                  <span>
                    SHIFT STATUS: {overall.completed}/{overall.total} TASKS COMPLETED (
                    {overall.percentage}%)
                  </span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isShiftPassed
                ? 'All mandatory daily banking SOP items have been completed and verified. System handoff is cleared for the incoming operational shift.'
                : `${overall.total - overall.completed} tasks remain pending execution or sign-off before shift handover certification.`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenEmailModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs"
            >
              <Mail className="w-4 h-4" />
              Email Report
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Audit Sheet
            </button>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-700/80">
          <div className="flex items-center justify-between text-xs font-mono mb-2 text-slate-300">
            <span>Overall Execution Progress</span>
            <span className="font-bold text-white tabular-nums">{overall.percentage}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-500 ${
                isShiftPassed
                  ? 'bg-emerald-500'
                  : overall.percentage > 50
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${overall.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 High-Level KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Executed Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Executed Tasks
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {overall.completed}{' '}
            <span className="text-sm font-normal text-slate-500">/ {overall.total}</span>
          </div>
          <p className="text-xs text-slate-500">
            {overall.total - overall.completed === 0
              ? 'All daily operational checklist items finished.'
              : `${overall.total - overall.completed} tasks still awaiting execution.`}
          </p>
        </div>

        {/* Card 2: SLA Cutoff Compliance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              SLA Cutoff Compliance
            </span>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {passedSlas} / {totalSlas}{' '}
            <span className="text-sm font-normal text-slate-500">Milestones Passed</span>
          </div>
          <p className="text-xs text-slate-500">
            {passedSlas === totalSlas
              ? 'All critical core banking cutoff deadlines met.'
              : `${totalSlas - passedSlas} cutoff milestones pending or overdue.`}
          </p>
        </div>

        {/* Card 3: Shift Pass SLA */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Shift SLA Integrity
            </span>
            {isShiftPassed ? (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {isShiftPassed ? '100% On-Track' : `${overall.percentage}% SLA Score`}
          </div>
          <p className="text-xs text-slate-500">
            Compliant with Soneri Bank Central Core Banking operational guidelines.
          </p>
        </div>
      </div>

      {/* Dynamic Core Banking SLA Milestones Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Critical Core Banking & Cutoff Milestones ({slaMilestones.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              Mandatory Shift SLA checkpoints
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsSlaModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 rounded-md transition-colors"
                title="Configure and customize shift SLA deadlines"
              >
                <Settings className="w-3.5 h-3.5" />
                Configure SLAs
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {slaMilestones.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No SLA milestones configured. Click &quot;Configure SLAs&quot; to define cutoff deadlines.
            </div>
          ) : (
            slaMilestones.map(m => {
              const isDone = !!dayRecord[m.taskKey]?.checked;
              const execTime = dayRecord[m.taskKey]?.time;
              const init = dayRecord[m.taskKey]?.init;
              const auth = dayRecord[m.taskKey]?.auth;

              return (
                <div
                  key={m.id}
                  className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : '—'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{m.label}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Target Cutoff: {m.targetTime}
                        {m.isMandatory && ' · Mandatory'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {isDone ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                          Logged: {execTime || 'Recorded'}
                        </span>
                        {init && (
                          <span className="font-bold text-slate-700">Init: {init}</span>
                        )}
                        {auth && (
                          <span className="font-bold text-purple-700">Auth: {auth}</span>
                        )}
                        <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm">
                          Passed
                        </span>
                      </div>
                    ) : (
                      <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">
                        Pending Action
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section-by-Section Health Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Shift Category Health Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionsConfig.map(sec => {
            const stats = getSectionStats(sec.key);
            const isComplete = stats.total > 0 && stats.completed === stats.total;

            return (
              <div
                key={sec.key}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{sec.title}</span>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-sm ${
                      isComplete
                        ? 'bg-emerald-100 text-emerald-800'
                        : stats.completed > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {stats.percentage}% ({stats.completed}/{stats.total})
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${
                      isComplete ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{stats.total - stats.completed} tasks remaining</span>
                  <span>{isComplete ? 'Category Passed' : 'In Progress'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SLA Configuration Modal */}
      <SlaManagerModal
        isOpen={isSlaModalOpen}
        onClose={() => setIsSlaModalOpen(false)}
      />
    </div>
  );
};
