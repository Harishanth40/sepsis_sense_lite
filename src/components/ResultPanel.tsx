import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ClipboardList,
  Printer,
  ChevronRight,
  Info,
  Timer,
  HeartPulse,
  Stethoscope,
  Activity,
  Sparkles,
  Droplets,
  Pill,
  TestTube2,
  Wind,
  Building2,
  HelpCircle
} from 'lucide-react';
import { SepsisPredictionResponse } from '../types';

interface ResultPanelProps {
  result: SepsisPredictionResponse;
  onPrintReport: () => void;
  onReset: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  onPrintReport
}) => {
  const isHigh = result.risk_level === 'High';
  const isModerate = result.risk_level === 'Moderate';

  const riskBadgeStyles = isHigh
    ? 'bg-rose-100 text-rose-800 border-rose-300'
    : isModerate
    ? 'bg-amber-100 text-amber-900 border-amber-300'
    : 'bg-emerald-100 text-emerald-800 border-emerald-300';

  const riskCardGlow = isHigh
    ? 'border-rose-200 ring-4 ring-rose-500/10'
    : isModerate
    ? 'border-amber-200 ring-4 ring-amber-500/10'
    : 'border-emerald-200 ring-4 ring-emerald-500/10';

  // Helper icon for local advice tags
  const getAdviceIcon = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'urgent care':
      case 'hydration':
        return <Droplets className="w-4 h-4 text-sky-600 shrink-0" />;
      case 'antibiotics':
      case 'medication':
        return <Pill className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'lab tests':
      case 'repeat labs':
        return <TestTube2 className="w-4 h-4 text-indigo-600 shrink-0" />;
      case 'breathing':
        return <Wind className="w-4 h-4 text-cyan-600 shrink-0" />;
      case 'hospital unit':
      case 'doctor check':
        return <Building2 className="w-4 h-4 text-purple-600 shrink-0" />;
      default:
        return <Activity className="w-4 h-4 text-teal-600 shrink-0" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`bg-white rounded-3xl border ${riskCardGlow} shadow-lg p-6 sm:p-8 transition-all`}>
        
        {/* Top Result Banner */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                isHigh
                  ? 'bg-rose-100 text-rose-600 shadow-sm shadow-rose-200'
                  : isModerate
                  ? 'bg-amber-100 text-amber-600 shadow-sm shadow-amber-200'
                  : 'bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-200'
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Sepsis Risk Assessment
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${riskBadgeStyles}`}>
                  {result.risk_level.toUpperCase()} RISK ({(result.probability * 100).toFixed(0)}%)
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export Report</span>
            </button>
          </div>
        </div>

        {/* Sepsis Stage / Type & Suspected Infection Source Card */}
        <div className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-teal-50/40 border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#007A78] flex items-center justify-center shrink-0 mt-0.5">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Identified Sepsis Stage / Type
              </p>
              <p className={`text-sm font-bold mt-0.5 ${isHigh ? 'text-rose-900' : isModerate ? 'text-amber-950' : 'text-emerald-950'}`}>
                {result.sepsis_type || (isHigh ? 'Severe Sepsis / Septic Shock Risk (Stage 3 - Emergency Alert)' : isModerate ? 'Early Sepsis / Infection Warning (Stage 1 - Moderate Alert)' : 'Stable Baseline / No Sepsis')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 md:border-l md:border-slate-200/80 md:pl-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Suspected Infection Clue / Source
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {result.suspected_source || 'Respiratory / Systemic Infection'}
              </p>
            </div>
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

        {/* Local Disease Advice & Plain-English Actions */}
        <div className="mb-6 p-5 rounded-2xl bg-teal-50/60 border border-teal-200/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#007A78] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#007A78]" />
              <span>Local Disease Advice & Immediate Steps (Simple English)</span>
            </h3>
            <span className="text-[11px] font-medium text-teal-700/80 bg-teal-100/70 px-2.5 py-0.5 rounded-full">
              Patient & Caregiver Guidance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(result.local_advices && result.local_advices.length > 0
              ? result.local_advices
              : [
                  {
                    tag: isHigh ? 'Urgent Care' : isModerate ? 'Doctor Check' : 'Stable',
                    title: isHigh ? 'Give Emergency IV Saline Fluids' : isModerate ? 'Find Infection Source' : 'Routine Health Monitoring',
                    advice: isHigh ? 'Start fast intravenous (IV) fluids immediately to raise low blood pressure and protect kidneys.' : isModerate ? 'Consult doctor to examine lungs, urine, or wounds for the root infection.' : 'Continue regular routine vital checks every 4-6 hours.'
                  },
                  {
                    tag: isHigh ? 'Antibiotics' : isModerate ? 'Monitoring' : 'Hydration',
                    title: isHigh ? 'Start IV Antibiotics within 1 Hour' : isModerate ? 'Check Vitals Every 1-2 Hours' : 'Adequate Rest and Fluids',
                    advice: isHigh ? 'Give broad-spectrum IV antibiotics immediately to destroy invading bacteria.' : isModerate ? 'Regularly monitor pulse, temperature, and blood pressure.' : 'Drink plenty of water and get sufficient rest.'
                  }
                ]
            ).map((item, idx) => (
              <div
                key={idx}
                className="bg-white/95 rounded-xl p-3.5 border border-teal-100 shadow-2xs hover:border-teal-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {getAdviceIcon(item.tag)}
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.advice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Contributing Clinical Factors */}
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

        {/* Recommended Hospital 1-Hour Protocol Bundle */}
        {result.clinical_actions && result.clinical_actions.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-blue-700" />
              <span>Recommended Hospital Protocol & 1-Hour Bundle</span>
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

        {/* Footer with Response Time & Medical Notice */}
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
