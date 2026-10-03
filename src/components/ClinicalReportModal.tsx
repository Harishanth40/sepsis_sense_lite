import React from 'react';
import { X, Printer, Activity, HeartPulse, Stethoscope, Sparkles } from 'lucide-react';
import { PatientFormState, BloodGroup, SepsisPredictionResponse } from '../types';

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: PatientFormState;
  bloodGroup: BloodGroup;
  result: SepsisPredictionResponse;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
  form,
  bloodGroup,
  result
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Bar */}
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#007A78]" />
            <h3 className="font-bold text-slate-800 text-sm">Clinical Sepsis Risk Report</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#007A78] hover:bg-[#006967] rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 print:p-0">
          {/* Hospital Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">SepsisSense Lite</span>
                <span className="text-xs uppercase font-bold text-[#007A78] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Decision-Support Summary
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">AI-Assisted Early Sepsis Warning Evaluation</p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <p>Generated: {new Date().toLocaleString()}</p>
              <p>Ref ID: SPS-{Math.floor(100000 + Math.random() * 900000)}</p>
            </div>
          </div>

          {/* Patient Overview */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Patient Age</p>
              <p className="text-sm font-bold text-slate-900">{form.age ? `${form.age} years` : 'Not specified'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Blood Group</p>
              <p className="text-sm font-bold text-slate-900">{bloodGroup || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Assessment Status</p>
              <p className="text-sm font-bold text-emerald-700">Completed</p>
            </div>
          </div>

          {/* Sepsis Stage & Suspected Infection Source */}
          <div className="mb-6 p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2.5">
              <HeartPulse className="w-4 h-4 text-[#007A78] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Identified Sepsis Type / Stage</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {result.sepsis_type || (result.risk_level === 'High' ? 'Severe Sepsis / Septic Shock Risk (Stage 3)' : result.risk_level === 'Moderate' ? 'Early Sepsis / Infection Warning (Stage 1)' : 'Stable Baseline')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Stethoscope className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Suspected Infection Source</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {result.suspected_source || 'Respiratory / Systemic'}
                </p>
              </div>
            </div>
          </div>

          {/* Vitals & Labs Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Clinical Vitals & Laboratory Values
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Parameter</th>
                    <th className="py-2 px-3">Recorded Value</th>
                    <th className="py-2 px-3">Standard Reference</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-800">Heart Rate</td>
                    <td className="py-2 px-3">{form.heart_rate ? `${form.heart_rate} bpm` : '--'}</td>
                    <td className="py-2 px-3 text-slate-500">60 - 100 bpm</td>
                    <td className="py-2 px-3 text-right font-sans">
                      {Number(form.heart_rate) > 90 ? (
                        <span className="text-rose-600 font-bold">Elevated</span>
                      ) : (
                        <span className="text-slate-500">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-800">Blood Pressure</td>
                    <td className="py-2 px-3">
                      {form.systolic_bp || form.diastolic_bp ? `${form.systolic_bp || '--'}/${form.diastolic_bp || '--'} mmHg` : '--'}
                    </td>
                    <td className="py-2 px-3 text-slate-500">120/80 mmHg</td>
                    <td className="py-2 px-3 text-right font-sans">
                      {Number(form.systolic_bp) <= 100 ? (
                        <span className="text-rose-600 font-bold">Hypotensive</span>
                      ) : (
                        <span className="text-slate-500">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-800">Temperature</td>
                    <td className="py-2 px-3">{form.temperature ? `${form.temperature} °C` : '--'}</td>
                    <td className="py-2 px-3 text-slate-500">36.5 - 37.5 °C</td>
                    <td className="py-2 px-3 text-right font-sans">
                      {Number(form.temperature) > 38.0 ? (
                        <span className="text-rose-600 font-bold">Fever</span>
                      ) : (
                        <span className="text-slate-500">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-800">Respiratory Rate</td>
                    <td className="py-2 px-3">{form.respiratory_rate ? `${form.respiratory_rate} /min` : '--'}</td>
                    <td className="py-2 px-3 text-slate-500">12 - 20 /min</td>
                    <td className="py-2 px-3 text-right font-sans">
                      {Number(form.respiratory_rate) >= 22 ? (
                        <span className="text-rose-600 font-bold">Tachypneic</span>
                      ) : (
                        <span className="text-slate-500">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-800">Serum Lactate</td>
                    <td className="py-2 px-3">{form.lactate ? `${form.lactate} mmol/L` : '--'}</td>
                    <td className="py-2 px-3 text-slate-500">&lt; 2.0 mmol/L</td>
                    <td className="py-2 px-3 text-right font-sans">
                      {Number(form.lactate) >= 2.0 ? (
                        <span className="text-rose-600 font-bold">Critical</span>
                      ) : (
                        <span className="text-slate-500">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-800">Serum Creatinine</td>
                    <td className="py-2 px-3">{form.creatinine ? `${form.creatinine} mg/dL` : '--'}</td>
                    <td className="py-2 px-3 text-slate-500">0.6 - 1.2 mg/dL</td>
                    <td className="py-2 px-3 text-right font-sans">
                      {Number(form.creatinine) >= 1.3 ? (
                        <span className="text-rose-600 font-bold">Elevated</span>
                      ) : (
                        <span className="text-slate-500">Normal</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Assessment Result Block */}
          <div className="mb-6 p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-bold text-slate-400">Risk Stratification</span>
              <span className="text-sm font-black text-slate-900">
                Level: {result.risk_level.toUpperCase()} ({Math.round(result.probability * 100)}%)
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800">{result.message}</p>
            <div className="mt-3 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">Supported Contributing Factors:</p>
              {result.contributing_factors.map((f, i) => (
                <p key={i}>• {f}</p>
              ))}
            </div>
          </div>

          {/* Local Disease Advice (Simple English) */}
          {result.local_advices && result.local_advices.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl border border-teal-200 bg-teal-50/40">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-4 h-4 text-[#007A78]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#007A78]">
                  Immediate Local Advice & Patient Guidance (Plain English)
                </h4>
              </div>
              <div className="space-y-2">
                {result.local_advices.map((item, idx) => (
                  <div key={idx} className="text-xs bg-white p-2.5 rounded-xl border border-teal-100">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{item.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Hospital 1-Hour Protocol */}
          {result.clinical_actions && result.clinical_actions.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl border border-blue-200 bg-blue-50/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2">
                Hospital 1-Hour Protocol Bundle
              </h4>
              <ul className="space-y-1 text-xs text-slate-700">
                {result.clinical_actions.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer & Attestation */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-500">
            <p className="italic mb-4">{result.disclaimer}</p>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div>
                <div className="border-b border-slate-400 h-8 mb-1" />
                <p className="text-[10px] uppercase font-bold text-slate-400">Evaluating Physician Signature</p>
              </div>
              <div>
                <div className="border-b border-slate-400 h-8 mb-1" />
                <p className="text-[10px] uppercase font-bold text-slate-400">Date / Hospital Time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
