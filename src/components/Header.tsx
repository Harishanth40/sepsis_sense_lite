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
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span className="text-[11px] text-slate-400 font-semibold mr-0.5">Sample cases:</span>
            <button
              type="button"
              onClick={() => onSelectPreset('high')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50/90 hover:bg-rose-100 border border-rose-200 text-rose-800 font-medium transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              title="Load Septic Shock (High Risk: 98%) Patient and Auto-Analyze"
            >
              <span>High Risk</span>
              <span className="px-1.5 py-0.2 rounded-md bg-rose-200/80 text-rose-900 text-[10px] font-bold">
                98%
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('moderate')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/90 hover:bg-amber-100 border border-amber-200 text-amber-800 font-medium transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              title="Load Borderline Ward (Moderate Risk: 64%) Patient and Auto-Analyze"
            >
              <span>Moderate</span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                64%
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('low')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-medium transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              title="Load Post-Op Stable (Low Risk: 7%) Patient and Auto-Analyze"
            >
              <span>Low Risk</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-200/80 text-emerald-900 text-[10px] font-bold">
                7%
              </span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007A78] hover:bg-[#006967] text-white rounded-full text-sm font-medium transition-colors shadow-xs cursor-pointer"
        >
          <FileUp className="w-4 h-4" />
          <span>Upload Hospital Records</span>
        </button>
      </div>
    </header>
  );
};
