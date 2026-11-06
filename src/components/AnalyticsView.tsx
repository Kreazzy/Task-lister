import React, { useState, useMemo } from 'react';
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
  BarChart3,
  PieChart,
  Calendar,
  Activity,
  Layers,
  Check,
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
  const { viewingDateStr, historyDB, availableDates, getOverallStats, getSectionStats } = useHistory();
  const { isAdmin } = useAuth();

  const [isSlaModalOpen, setIsSlaModalOpen] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'trend' | 'phases' | 'profiles'>('trend');

  const dayRecord = historyDB[viewingDateStr] || {};
  const overall = getOverallStats();

  // Calculate Maker-Checker signature compliance
  let signedCount = 0;
  let authCount = 0;
  let unsignedCount = 0;

  sectionsConfig.forEach(sec => {
    const tasks = tasksMaster[sec.key] || [];
    tasks.forEach(t => {
      const id = `${sec.key}-${t.sr}`;
      const rec = dayRecord[id];
      if (rec?.checked) {
        if (rec.init) signedCount++;
        if (rec.auth) authCount++;
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

  // 1. 7-Day History Trend Data
  const recentDaysTrend = useMemo(() => {
    const dates = [...availableDates].slice(0, 7).reverse();
    return dates.map(d => {
      const rec = historyDB[d] || {};
      let total = 0;
      let completed = 0;
      sectionsConfig.forEach(sec => {
        const tasks = tasksMaster[sec.key] || [];
        tasks.forEach(t => {
          total++;
          if (rec[`${sec.key}-${t.sr}`]?.checked) completed++;
        });
      });
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        date: d,
        displayDate: d.slice(5),
        total,
        completed,
        pct,
        passed: total > 0 && completed === total,
      };
    });
  }, [availableDates, historyDB, sectionsConfig, tasksMaster]);

  // 2. Shift Execution by Phase / Timing
  const phaseBreakdown = useMemo(() => {
    const phases = [
      { name: 'Morning (8am-12pm)', keys: ['8:30am', '9am', '10:30am', '8:45am', '1pm'], total: 0, done: 0 },
      { name: 'Afternoon (12pm-5pm)', keys: ['1pm', '3pm', '4:00pm', '5:00PM', '5PM', '5:30PM', '6pm'], total: 0, done: 0 },
      { name: 'Pre-COB Cutoff', keys: ['Pre COB', 'Before Cutoff', 'After Cutoff', '7:00PM', '7:30PM'], total: 0, done: 0 },
      { name: 'During & Post COB', keys: ['During COB', 'Post COB', '8:00AM', '8:45 AM'], total: 0, done: 0 },
      { name: 'Scheduled / Other', keys: ['-', 'Saturday', 'Sunday', '*SOM', '*EOM'], total: 0, done: 0 },
    ];

    sectionsConfig.forEach(sec => {
      const tasks = tasksMaster[sec.key] || [];
      tasks.forEach(t => {
        const id = `${sec.key}-${t.sr}`;
        const isDone = !!dayRecord[id]?.checked;
        const timeStr = t.time || '-';

        let placed = false;
        for (const p of phases) {
          if (p.keys.some(k => timeStr.toLowerCase().includes(k.toLowerCase()))) {
            p.total++;
            if (isDone) p.done++;
            placed = true;
            break;
          }
        }
        if (!placed) {
          phases[4].total++;
          if (isDone) phases[4].done++;
        }
      });
    });

    return phases;
  }, [sectionsConfig, tasksMaster, dayRecord]);

  // 3. Profile Category Breakdown
  const profileDistribution = useMemo(() => {
    const counts: Record<string, { total: number; done: number; color: string }> = {
      'Prod Server': { total: 0, done: 0, color: 'bg-rose-500' },
      'Server': { total: 0, done: 0, color: 'bg-orange-500' },
      'DB Server': { total: 0, done: 0, color: 'bg-amber-500' },
      'Utility': { total: 0, done: 0, color: 'bg-emerald-500' },
      'Browser': { total: 0, done: 0, color: 'bg-blue-500' },
      'Validation': { total: 0, done: 0, color: 'bg-purple-500' },
      'EMAIL': { total: 0, done: 0, color: 'bg-sky-500' },
      'Service': { total: 0, done: 0, color: 'bg-cyan-500' },
      'Other': { total: 0, done: 0, color: 'bg-slate-500' },
    };

    sectionsConfig.forEach(sec => {
      const tasks = tasksMaster[sec.key] || [];
      tasks.forEach(t => {
        const prof = counts[t.profile] ? t.profile : 'Other';
        counts[prof].total++;
        if (dayRecord[`${sec.key}-${t.sr}`]?.checked) {
          counts[prof].done++;
        }
      });
    });

    return Object.entries(counts)
      .filter(([_, v]) => v.total > 0)
      .map(([k, v]) => ({
        profile: k,
        ...v,
        pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
      }));
  }, [sectionsConfig, tasksMaster, dayRecord]);

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
                : `${overall.total - overall.completed} tasks remain pending execution or sign-off before shift handover certification. Range through #${overall.maxSr}.`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 print:hidden">
            <button
              type="button"
              onClick={onOpenEmailModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Email Report
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Audit Sheet
            </button>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-700/80">
          <div className="flex items-center justify-between text-xs font-mono mb-2 text-slate-300">
            <span>Overall Execution Progress ({overall.completed} of {overall.total} registered tasks)</span>
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

      {/* 4 High-Level KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Executed Tasks */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Executed Tasks
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {overall.completed}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ {overall.total}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {overall.total - overall.completed === 0
              ? 'All daily operational checklist items finished.'
              : `${overall.total - overall.completed} tasks awaiting execution.`}
          </p>
        </div>

        {/* Card 2: Maker-Checker Compliance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Dual Control Sign-offs
            </span>
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {signedCount} <span className="text-xs text-slate-400">Init</span> / {authCount} <span className="text-xs text-purple-400">Auth</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {signedCount === authCount && signedCount > 0
              ? '100% verified by Supervisor/Admin.'
              : `${Math.max(0, signedCount - authCount)} executed tasks pending Auth verification.`}
          </p>
        </div>

        {/* Card 3: SLA Cutoff Compliance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              SLA Cutoff Status
            </span>
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {passedSlas} / {totalSlas}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Passed</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {passedSlas === totalSlas
              ? 'All critical banking cutoff milestones met.'
              : `${totalSlas - passedSlas} milestones pending action.`}
          </p>
        </div>

        {/* Card 4: Shift SLA Integrity */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Shift Pass Score
            </span>
            {isShiftPassed ? (
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {overall.percentage}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isShiftPassed ? 'Certified 100% compliant.' : 'Pending mandatory handover sign-offs.'}
          </p>
        </div>
      </div>

      {/* NEW: Operational Productivity Graphs Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Operational Productivity & Shift Trend Graphs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual completion analytics across shift windows, historical pass rates, and system profiles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveChartTab('trend')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeChartTab === 'trend'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              7-Day Trend
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('phases')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeChartTab === 'phases'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Shift Phases
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('profiles')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeChartTab === 'profiles'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Profile Distribution
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Graph Tab 1: 7-Day Historical Trend Bar Chart */}
          {activeChartTab === 'trend' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Daily Shift Completion % (Last 7 Days)</span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Certified 100%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" /> In Progress
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-7 gap-3 pt-4 pb-2 border-b border-slate-200 dark:border-slate-700 items-end h-48">
                {recentDaysTrend.map(d => (
                  <div key={d.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {d.pct}%
                    </div>
                    <div className="w-full max-w-[40px] bg-slate-100 dark:bg-slate-700 rounded-t-lg overflow-hidden h-36 flex items-end">
                      <div
                        className={`w-full transition-all duration-500 ${
                          d.passed ? 'bg-emerald-500' : d.pct > 50 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ height: `${Math.max(d.pct, 4)}%` }}
                        title={`${d.date}: ${d.completed}/${d.total} tasks (${d.pct}%)`}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-full">
                      {d.displayDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graph Tab 2: Shift Phase Breakdown */}
          {activeChartTab === 'phases' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execution progress broken down by operational timeline cutoff windows for shift {viewingDateStr}:
              </p>

              <div className="space-y-3">
                {phaseBreakdown.map((p, i) => {
                  const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                        <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">
                          {p.done} / {p.total} tasks ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Graph Tab 3: Profile Distribution */}
          {activeChartTab === 'profiles' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operational workload by system environment & tool profile:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {profileDistribution.map(p => (
                  <div
                    key={p.profile}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                        {p.profile}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {p.pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full ${p.color}`}
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between font-mono">
                      <span>Completed: {p.done}</span>
                      <span>Total: {p.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Critical Core Banking SLA Milestones Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Critical Core Banking & Cutoff Milestones ({slaMilestones.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
              Mandatory Shift SLA checkpoints
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsSlaModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 border border-blue-200 dark:border-blue-800 rounded-md transition-colors cursor-pointer"
                title="Configure and customize shift SLA deadlines"
              >
                <Settings className="w-3.5 h-3.5" />
                Configure SLAs
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
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
                  className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isDone
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : '—'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.label}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Target Cutoff: {m.targetTime}
                        {m.isMandatory && ' · Mandatory'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {isDone ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-sm">
                          Logged: {execTime || 'Recorded'}
                        </span>
                        {init && (
                          <span className="font-bold text-slate-700 dark:text-slate-200">Init: {init}</span>
                        )}
                        {auth && (
                          <span className="font-bold text-purple-700 dark:text-purple-300">Auth: {auth}</span>
                        )}
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-sm">
                          Passed
                        </span>
                      </div>
                    ) : (
                      <span className="font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-sm">
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
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Shift Category Health Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionsConfig.map(sec => {
            const stats = getSectionStats(sec.key);
            const isComplete = stats.total > 0 && stats.completed === stats.total;

            return (
              <div
                key={sec.key}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{sec.title}</span>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-sm ${
                      isComplete
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200'
                        : stats.completed > 0
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {stats.percentage}% ({stats.completed}/{stats.total})
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full ${
                      isComplete ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
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
