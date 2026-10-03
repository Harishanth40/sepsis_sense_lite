import React from 'react';
import { Activity, FileUp } from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  onSelectPreset?: (presetName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenUpload, onSelectPreset }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#007A78] flex items-center justify-center text-white shadow-xs">
          <Activity className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-slate-900">Sepsis</span>
            <span className="text-xl font-bold tracking-tight text-[#007A78]">Sense</span>
          </div>
          <span className="px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-[#007A78] border border-teal-200/80 rounded-md">
            Lite
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {onSelectPreset && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Sample cases:</span>
            <button
              type="button"
              onClick={() => onSelectPreset('high')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 font-medium transition-colors"
              title="Load Septic Shock (High Risk) Patient"
            >
              High Risk
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('moderate')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 font-medium transition-colors"
              title="Load Borderline Ward Patient"
            >
              Moderate
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('low')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-medium transition-colors"
              title="Load Post-Op Stable Patient"
            >
              Low Risk
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007A78] hover:bg-[#006967] text-white rounded-full text-sm font-medium transition-colors shadow-xs"
        >
          <FileUp className="w-4 h-4" />
          <span>Upload Hospital Records</span>
        </button>
      </div>
    </header>
  );
};
