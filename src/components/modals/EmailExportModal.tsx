import React, { useState, useRef } from 'react';
import { Copy, Check, X, Mail } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useHistory } from '../../context/HistoryContext';

interface EmailExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotice?: (msg: string) => void;
}

export const EmailExportModal: React.FC<EmailExportModalProps> = ({
  isOpen,
  onClose,
  onSuccessNotice,
}) => {
  const { sectionsConfig, tasksMaster } = useTasks();
  const { viewingDateStr, historyDB } = useHistory();
  const [filterType, setFilterType] = useState<'completed' | 'all'>('completed');
  const [copied, setCopied] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const dayRecord = historyDB[viewingDateStr] || {};

  const handleCopy = () => {
    if (!tableRef.current) return;

    try {
      // Modern clipboard API with HTML blob support for Excel / Outlook formatting
      const htmlContent = tableRef.current.innerHTML;
      const textContent = tableRef.current.innerText;

      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobText = new Blob([textContent], { type: 'text/plain' });
        const item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        });
        navigator.clipboard.write([item]).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
          if (onSuccessNotice) onSuccessNotice('Formatted table copied to clipboard! Paste directly into Outlook or Excel.');
        });
      } else {
        // Fallback selection copy
        const range = document.createRange();
        range.selectNode(tableRef.current);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
        document.execCommand('copy');
        window.getSelection()?.removeAllRanges();
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        if (onSuccessNotice) onSuccessNotice('Table copied to clipboard!');
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-semibold">Email & Excel Formatted Shift Report</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs text-slate-600">
              Generated for Shift Date: <strong className="text-slate-900">{viewingDateStr}</strong>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="emailFilter"
                  checked={filterType === 'completed'}
                  onChange={() => setFilterType('completed')}
                  className="accent-blue-600"
                />
                Completed Tasks Only
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="emailFilter"
                  checked={filterType === 'all'}
                  onChange={() => setFilterType('all')}
                  className="accent-blue-600"
                />
                All Tasks (Completed + Pending)
              </label>
            </div>
          </div>

          {/* Formatted HTML report preview */}
          <div
            ref={tableRef}
            className="p-4 bg-white border border-slate-300 rounded-lg overflow-x-auto text-xs font-sans"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            <div style={{ marginBottom: '14px', borderBottom: '2px solid #1a56db', paddingBottom: '8px' }}>
              <h2 style={{ margin: '0 0 4px 0', color: '#1a56db', fontSize: '16px', fontWeight: 'bold' }}>
                Soneri Bank Limited — IT Operations Shift Status Report
              </h2>
              <div style={{ fontSize: '11px', color: '#4b5563' }}>
                <strong>Shift Date:</strong> {viewingDateStr} &nbsp;|&nbsp; <strong>Generated At:</strong>{' '}
                {new Date().toLocaleTimeString()}
              </div>
            </div>

            {sectionsConfig.map(sec => {
              const tasks = tasksMaster[sec.key] || [];
              const filteredTasks = tasks.filter(t => {
                const taskId = `${sec.key}-${t.sr}`;
                const saved = dayRecord[taskId];
                return filterType === 'all' || (saved && saved.checked);
              });

              if (filteredTasks.length === 0) return null;

              return (
                <div key={sec.key} style={{ marginBottom: '18px' }}>
                  <div
                    style={{
                      background: '#eef2ff',
                      color: '#1e3a8a',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      padding: '6px 10px',
                      border: '1px solid #cbd5e1',
                      borderBottom: 'none',
                    }}
                  >
                    {sec.title}
                  </div>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '11px',
                      textAlign: 'left',
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#334155' }}>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', width: '40px', textAlign: 'center' }}>Sr#</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', width: '90px' }}>Nature</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>Task Description</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', width: '80px', textAlign: 'center' }}>Status</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', width: '70px' }}>Exec Time</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', width: '60px' }}>Inputer</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', width: '60px' }}>Verifier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(item => {
                        const taskId = `${sec.key}-${item.sr}`;
                        const saved = dayRecord[taskId] || { checked: false, time: '', init: '', auth: '' };
                        return (
                          <tr
                            key={item.sr}
                            style={{
                              background: saved.checked ? '#f0fdf4' : '#ffffff',
                            }}
                          >
                            <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                              {item.sr}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', color: '#475569' }}>
                              {item.nature || '-'}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px' }}>
                              <div style={{ fontWeight: 500, color: '#0f172a' }}>{item.task}</div>
                              {item.note && <div style={{ fontSize: '10px', color: '#0284c7' }}>{item.note}</div>}
                            </td>
                            <td
                              style={{
                                border: '1px solid #cbd5e1',
                                padding: '5px 8px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: saved.checked ? '#059669' : '#dc2626',
                              }}
                            >
                              {saved.checked ? 'COMPLETED' : 'PENDING'}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontFamily: 'monospace' }}>
                              {saved.time || '-'}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#334155' }}>
                              {saved.init || '-'}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#334155' }}>
                              {saved.auth || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Formatted with borders and colors for direct paste into Outlook, Gmail, or Microsoft Excel.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Table Content'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
