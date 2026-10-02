import React from 'react';
import { X, History, Trash2, ArrowUpRight, Activity } from 'lucide-react';
import { PatientHistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: PatientHistoryItem[];
  onSelectHistoryItem: (item: PatientHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Patient Evaluation History</h3>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Activity className="w-8 h-8 mb-2 stroke-[1.5] text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No past analyses recorded</p>
              <p className="text-[11px] text-slate-400 mt-1">Evaluated patients will appear here for reference during this session.</p>
            </div>
          ) : (
            history.map((item) => {
              const isHigh = item.prediction.risk_level === 'High';
              const isModerate = item.prediction.risk_level === 'Moderate';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectHistoryItem(item)}
                  className="bg-slate-50/70 hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-200 rounded-2xl p-4 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isHigh
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isModerate
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {item.prediction.risk_level.toUpperCase()} RISK ({(item.prediction.probability * 100).toFixed(0)}%)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {item.age ? `Patient Age: ${item.age}y` : 'Patient Record'}{' '}
                    {item.blood_group ? `· Blood: ${item.blood_group}` : ''}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{item.vitalsSummary}</p>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-blue-600 font-medium">
                    <span>Reload values</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
