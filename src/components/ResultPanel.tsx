import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Timer,
  ChevronRight,
  Printer,
  ShieldAlert,
  Info,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { SepsisPredictionResponse } from '../types';

interface ResultPanelProps {
  result: SepsisPredictionResponse;
  onPrintReport: () => void;
  onReset: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  onPrintReport,
  onReset
}) => {
  const isHigh = result.risk_level === 'High';
  const isModerate = result.risk_level === 'Moderate';
  const isLow = result.risk_level === 'Low';

  const riskBadgeStyles = isHigh
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : isModerate
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const riskCardGlow = isHigh
    ? 'border-rose-300 ring-4 ring-rose-500/10'
    : isModerate
    ? 'border-amber-300 ring-4 ring-amber-500/10'
    : 'border-emerald-300 ring-4 ring-emerald-500/10';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`bg-white rounded-3xl border ${riskCardGlow} shadow-lg p-6 sm:p-8 transition-all`}>
        {/* Top Result Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                isHigh ? 'bg-rose-100 text-rose-600' : isModerate ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {isHigh ? (
                <AlertOctagon className="w-8 h-8 stroke-[2.2]" />
              ) : isModerate ? (
                <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
              ) : (
                <CheckCircle className="w-8 h-8 stroke-[2.2]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Sepsis Risk Assessment
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${riskBadgeStyles}`}>
                  {result.risk_level.toUpperCase()} RISK
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {isHigh
                  ? 'High Sepsis Risk — Immediate Clinical Evaluation Recommended'
                  : isModerate
                  ? 'Moderate Sepsis Risk — Close Monitoring Recommended'
                  : 'Low Sepsis Risk — Stable Baseline'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">{result.message}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={onPrintReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export Report</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
          {/* Estimated Probability */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Model Probability</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                {(result.probability * 100).toFixed(0)}
              </span>
              <span className="text-xs font-mono text-slate-500">%</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Calibrated ML Risk Index</p>
          </div>

          {/* qSOFA Score */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
            <p className="text-[11px] font-semibold uppercase text-slate-400">qSOFA Score</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${result.qsofa_score >= 2 ? 'text-rose-600' : 'text-slate-900'}`}>
                {result.qsofa_score}
              </span>
              <span className="text-xs font-mono text-slate-500">/ 3</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {result.qsofa_score >= 2 ? 'High risk (qSOFA ≥ 2)' : 'Low to moderate score'}
            </p>
          </div>

          {/* SIRS Score */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
            <p className="text-[11px] font-semibold uppercase text-slate-400">SIRS Criteria</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${result.sirs_score >= 2 ? 'text-amber-600' : 'text-slate-900'}`}>
                {result.sirs_score}
              </span>
              <span className="text-xs font-mono text-slate-500">/ 4</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {result.sirs_score >= 2 ? 'Meets SIRS criteria' : 'Sub-threshold'}
            </p>
          </div>

          {/* Shock Index */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Shock Index (HR/SBP)</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                {result.shock_index !== null ? result.shock_index.toFixed(2) : '--'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {result.shock_index && result.shock_index >= 0.9 ? 'Elevated (≥0.9 decompensation)' : 'Normal (<0.7)'}
            </p>
          </div>
        </div>

        {/* Contributing Clinical Factors */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Key Contributing Clinical Factors</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {result.contributing_factors.map((factor, idx) => (
              <div
                key={idx}
                className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-800"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span className="font-medium">{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Surviving Sepsis Campaign 1-Hour Bundle Actions */}
        {result.clinical_actions && result.clinical_actions.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-blue-700" />
              <span>Recommended Clinical Protocol & 1-Hour Bundle</span>
            </h3>
            <ul className="space-y-1.5">
              {result.clinical_actions.map((act, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-blue-950 font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer with Dynamic Response Time & Disclaimer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-mono">
            <Timer className="w-3.5 h-3.5 text-blue-600" />
            <span>Analysis completed in: {result.execution_time_seconds.toFixed(2)} seconds</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 italic max-w-xl text-right">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{result.disclaimer}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
