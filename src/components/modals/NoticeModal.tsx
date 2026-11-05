import React from 'react';
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface NoticeModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
  onClose: () => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          {type === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
          {type === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
          {type === 'info' && <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
