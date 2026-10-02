import React from 'react';
import {
  Edit3,
  User,
  Heart,
  Thermometer,
  Clock,
  Wind,
  Gauge,
  FlaskConical,
  Activity,
  Layers,
  Info,
  CheckCircle2
} from 'lucide-react';
import { PatientFormState, FieldSourceMap } from '../types';

interface ManualInputCardProps {
  form: PatientFormState;
  sourceMap: FieldSourceMap;
  onChange: (field: keyof PatientFormState, value: string) => void;
  onClear: () => void;
}

export const ManualInputCard: React.FC<ManualInputCardProps> = ({
  form,
  sourceMap,
  onChange,
  onClear
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Manual Input</h2>
              <p className="text-[11px] text-slate-500">Patient Clinical Information & Vitals</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Clear Fields
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Age */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="field-age" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Age (years)</span>
              </label>
              {sourceMap.age === 'extracted' && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                  Extracted
                </span>
              )}
            </div>
            <input
              id="field-age"
              type="number"
              step="1"
              min="0"
              max="125"
              placeholder="e.g. 64"
              value={form.age}
              onChange={(e) => onChange('age', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* Heart Rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="field-hr" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Heart Rate (bpm)</span>
              </label>
              {sourceMap.heart_rate === 'extracted' && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                  Extracted
                </span>
              )}
            </div>
            <input
              id="field-hr"
              type="number"
              step="any"
              min="20"
              max="260"
              placeholder="e.g. 112"
              value={form.heart_rate}
              onChange={(e) => onChange('heart_rate', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="field-temp" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                <span>Temperature (°C)</span>
              </label>
              {sourceMap.temperature === 'extracted' && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                  Extracted
                </span>
              )}
            </div>
            <input
              id="field-temp"
              type="number"
              step="0.1"
              min="30"
              max="45"
              placeholder="e.g. 38.4"
              value={form.temperature}
              onChange={(e) => onChange('temperature', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* Blood Pressure (Systolic / Diastolic) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Blood Pressure (mmHg)</span>
              </label>
              {(sourceMap.systolic_bp === 'extracted' || sourceMap.diastolic_bp === 'extracted') && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                  Extracted
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="field-sbp"
                type="number"
                step="any"
                min="30"
                max="280"
                placeholder="Sys 88"
                value={form.systolic_bp}
                onChange={(e) => onChange('systolic_bp', e.target.value)}
                className="w-1/2 px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                title="Systolic Blood Pressure"
              />
              <span className="text-slate-400 font-bold">/</span>
              <input
                id="field-dbp"
                type="number"
                step="any"
                min="20"
                max="180"
                placeholder="Dia 54"
                value={form.diastolic_bp}
                onChange={(e) => onChange('diastolic_bp', e.target.value)}
                className="w-1/2 px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                title="Diastolic Blood Pressure"
              />
            </div>
          </div>

          {/* Respiratory Rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="field-rr" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Wind className="w-3.5 h-3.5 text-teal-500" />
                <span>Respiratory Rate (breaths/min)</span>
              </label>
              {sourceMap.respiratory_rate === 'extracted' && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                  Extracted
                </span>
              )}
            </div>
            <input
              id="field-rr"
              type="number"
              step="any"
              min="4"
              max="70"
              placeholder="e.g. 26"
              value={form.respiratory_rate}
              onChange={(e) => onChange('respiratory_rate', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* SpO2 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="field-spo2" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                <span>SpO₂ (%)</span>
              </label>
              {sourceMap.spo2 === 'extracted' && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                  Extracted
                </span>
              )}
            </div>
            <input
              id="field-spo2"
              type="number"
              step="any"
              min="40"
              max="100"
              placeholder="e.g. 94"
              value={form.spo2}
              onChange={(e) => onChange('spo2', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* Lactate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="field-lac" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
                <span>Lactate (mmol/L)</span>
              </label>
              {sourceMap.lactate === 'extracted' && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                  Extracted
                </span>
              )}
            </div>
            <input
              id="field-lac"
              type="number"
              step="0.01"
              min="0.1"
              max="30"
              placeholder="e.g. 2.8"
              value={form.lactate}
              onChange={(e) => onChange('lactate', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* Creatinine */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="field-cr" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Activity className="w-3.5 h-3.5 text-purple-500" />
                <span>Creatinine (mg/dL)</span>
              </label>
              {sourceMap.creatinine === 'extracted' && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                  Extracted
                </span>
              )}
            </div>
            <input
              id="field-cr"
              type="number"
              step="0.01"
              min="0.1"
              max="25"
              placeholder="e.g. 1.4"
              value={form.creatinine}
              onChange={(e) => onChange('creatinine', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* Priority rule indicator */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Manual user-entered values override extracted data</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">All metrics validated</span>
      </div>
    </div>
  );
};
