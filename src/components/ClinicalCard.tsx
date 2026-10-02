import React, { useState } from 'react';
import {
  User,
  Stethoscope,
  FlaskConical,
  Activity,
  Info,
  ChevronDown,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { PatientFormState, BloodGroup } from '../types';

interface ClinicalCardProps {
  form: PatientFormState;
  bloodGroup: BloodGroup;
  onFieldChange: (field: keyof PatientFormState, value: string) => void;
  onBloodGroupChange: (bg: BloodGroup) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const TOOLTIPS: Record<string, string> = {
  age: 'Adult patient age in years. Age ≥ 65 is an independent risk factor for severe sepsis and organ decompensation.',
  temperature: 'Core body temperature in °C. SIRS criteria: Fever > 38.0°C or ominous hypothermia < 36.0°C.',
  heart_rate: 'Resting pulse in beats/min. SIRS criteria: Tachycardia > 90 bpm reflects systemic stress response.',
  respiratory_rate: 'Breathing rate in breaths/min. qSOFA criteria: Tachypnea ≥ 22 breaths/min signifies respiratory distress.',
  systolic_bp: 'Systolic blood pressure in mmHg. qSOFA criteria: SBP ≤ 100 mmHg suggests cardiovascular hypoperfusion.',
  lactate: 'Serum lactate in mmol/L. Marker of anaerobic cellular metabolism. Lactate ≥ 2.0 indicates hypoperfusion; ≥ 4.0 indicates septic shock.',
  creatinine: 'Serum creatinine in mg/dL. Evaluates renal filtration and acute kidney injury (AKI) secondary to sepsis.'
};

export const ClinicalCard: React.FC<ClinicalCardProps> = ({
  form,
  bloodGroup,
  onFieldChange,
  onBloodGroupChange,
  onAnalyze,
  isAnalyzing
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Count required fields filled (7 required: age, temp, hr, rr, sbp, lactate, creatinine)
  const requiredFields: (keyof PatientFormState)[] = [
    'age',
    'temperature',
    'heart_rate',
    'respiratory_rate',
    'systolic_bp',
    'lactate',
    'creatinine'
  ];

  const filledCount = requiredFields.filter((f) => form[f] && form[f].trim() !== '').length;
  const remainingCount = 7 - filledCount;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm max-w-4xl w-full mx-auto overflow-hidden">
      <div className="p-6 sm:p-8 space-y-7">
        {/* ================= SECTION 1: PATIENT INFORMATION ================= */}
        <div>
          <div className="flex items-center gap-2 text-[#007A78] text-xs font-bold uppercase tracking-wider mb-3">
            <User className="w-4 h-4 stroke-[2.2]" />
            <span>Patient Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Age */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="field-age" className="text-sm font-semibold text-slate-800">
                    Age
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveTooltip('age')}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === 'age' ? null : 'age')}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {activeTooltip === 'age' && (
                      <div className="absolute left-0 top-5 w-64 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-50 leading-relaxed animate-in fade-in">
                        {TOOLTIPS.age}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  id="field-age"
                  type="number"
                  step="1"
                  min="0"
                  max="125"
                  value={form.age}
                  onChange={(e) => onFieldChange('age', e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full h-11 pl-4 pr-16 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 focus:border-[#007A78] transition-all"
                />
                <span className="absolute right-4 text-xs font-normal text-slate-400 pointer-events-none">
                  years
                </span>
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="field-blood-group" className="text-sm font-semibold text-slate-800">
                  Blood Group
                </label>
                <span className="text-xs text-slate-400">Optional</span>
              </div>

              <div className="relative">
                <select
                  id="field-blood-group"
                  value={bloodGroup}
                  onChange={(e) => onBloodGroupChange(e.target.value as BloodGroup)}
                  className="w-full h-11 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 focus:border-[#007A78] transition-all cursor-pointer"
                >
                  <option value="">Not specified</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: VITAL SIGNS ================= */}
        <div>
          <div className="flex items-center gap-2 text-[#007A78] text-xs font-bold uppercase tracking-wider mb-3">
            <Stethoscope className="w-4 h-4 stroke-[2.2]" />
            <span>Vital Signs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="field-temp" className="text-sm font-semibold text-slate-800">
                    Temperature
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveTooltip('temperature')}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === 'temperature' ? null : 'temperature')}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {activeTooltip === 'temperature' && (
                      <div className="absolute left-0 top-5 w-64 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-50 leading-relaxed animate-in fade-in">
                        {TOOLTIPS.temperature}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  id="field-temp"
                  type="number"
                  step="0.1"
                  min="28"
                  max="45"
                  value={form.temperature}
                  onChange={(e) => onFieldChange('temperature', e.target.value)}
                  placeholder="e.g. 38.6"
                  className="w-full h-11 pl-4 pr-12 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 focus:border-[#007A78] transition-all"
                />
                <span className="absolute right-4 text-xs font-normal text-slate-400 pointer-events-none">
                  °C
                </span>
              </div>
            </div>

            {/* Heart Rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="field-hr" className="text-sm font-semibold text-slate-800">
                    Heart Rate
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveTooltip('heart_rate')}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === 'heart_rate' ? null : 'heart_rate')}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {activeTooltip === 'heart_rate' && (
                      <div className="absolute left-0 top-5 w-64 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-50 leading-relaxed animate-in fade-in">
                        {TOOLTIPS.heart_rate}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  id="field-hr"
                  type="number"
                  step="any"
                  min="20"
                  max="260"
                  value={form.heart_rate}
                  onChange={(e) => onFieldChange('heart_rate', e.target.value)}
                  placeholder="e.g. 115"
                  className="w-full h-11 pl-4 pr-14 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 focus:border-[#007A78] transition-all"
                />
                <span className="absolute right-4 text-xs font-normal text-slate-400 pointer-events-none">
                  bpm
                </span>
              </div>
            </div>

            {/* Respiratory Rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="field-rr" className="text-sm font-semibold text-slate-800">
                    Respiratory Rate
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveTooltip('respiratory_rate')}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === 'respiratory_rate' ? null : 'respiratory_rate')}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {activeTooltip === 'respiratory_rate' && (
                      <div className="absolute left-0 top-5 w-64 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-50 leading-relaxed animate-in fade-in">
                        {TOOLTIPS.respiratory_rate}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  id="field-rr"
                  type="number"
                  step="any"
                  min="4"
                  max="70"
                  value={form.respiratory_rate}
                  onChange={(e) => onFieldChange('respiratory_rate', e.target.value)}
                  placeholder="e.g. 26"
                  className="w-full h-11 pl-4 pr-24 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 focus:border-[#007A78] transition-all"
                />
                <span className="absolute right-4 text-xs font-normal text-slate-400 pointer-events-none">
                  breaths/min
                </span>
              </div>
            </div>

            {/* Systolic Blood Pressure */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="field-sbp" className="text-sm font-semibold text-slate-800">
                    Systolic Blood Pressure
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveTooltip('systolic_bp')}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === 'systolic_bp' ? null : 'systolic_bp')}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {activeTooltip === 'systolic_bp' && (
                      <div className="absolute left-0 top-5 w-64 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-50 leading-relaxed animate-in fade-in">
                        {TOOLTIPS.systolic_bp}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  id="field-sbp"
                  type="number"
                  step="any"
                  min="30"
                  max="280"
                  value={form.systolic_bp}
                  onChange={(e) => onFieldChange('systolic_bp', e.target.value)}
                  placeholder="e.g. 95"
                  className="w-full h-11 pl-4 pr-16 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 focus:border-[#007A78] transition-all"
                />
                <span className="absolute right-4 text-xs font-normal text-slate-400 pointer-events-none">
                  mmHg
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 3: LABORATORY VALUES ================= */}
        <div>
          <div className="flex items-center gap-2 text-[#007A78] text-xs font-bold uppercase tracking-wider mb-3">
            <FlaskConical className="w-4 h-4 stroke-[2.2]" />
            <span>Laboratory Values</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Lactate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="field-lac" className="text-sm font-semibold text-slate-800">
                    Lactate
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveTooltip('lactate')}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === 'lactate' ? null : 'lactate')}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {activeTooltip === 'lactate' && (
                      <div className="absolute left-0 top-5 w-64 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-50 leading-relaxed animate-in fade-in">
                        {TOOLTIPS.lactate}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  id="field-lac"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="30"
                  value={form.lactate}
                  onChange={(e) => onFieldChange('lactate', e.target.value)}
                  placeholder="e.g. 2.45"
                  className="w-full h-11 pl-4 pr-18 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 focus:border-[#007A78] transition-all"
                />
                <span className="absolute right-4 text-xs font-normal text-slate-400 pointer-events-none">
                  mmol/L
                </span>
              </div>
            </div>

            {/* Creatinine */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="field-cr" className="text-sm font-semibold text-slate-800">
                    Creatinine
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveTooltip('creatinine')}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === 'creatinine' ? null : 'creatinine')}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {activeTooltip === 'creatinine' && (
                      <div className="absolute left-0 top-5 w-64 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-50 leading-relaxed animate-in fade-in">
                        {TOOLTIPS.creatinine}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  id="field-cr"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="25"
                  value={form.creatinine}
                  onChange={(e) => onFieldChange('creatinine', e.target.value)}
                  placeholder="e.g. 1.72"
                  className="w-full h-11 pl-4 pr-16 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 focus:border-[#007A78] transition-all"
                />
                <span className="absolute right-4 text-xs font-normal text-slate-400 pointer-events-none">
                  mg/dL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CARD FOOTER ================= */}
      <div className="bg-slate-50/50 border-t border-slate-100 px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-500 font-medium">
          {remainingCount === 0 ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              All 7 required clinical values entered
            </span>
          ) : (
            <span>
              {remainingCount} of 7 required values remaining
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={isAnalyzing}
          onClick={onAnalyze}
          className={`inline-flex items-center gap-2.5 px-6 py-2.5 bg-[#007A78] hover:bg-[#006967] text-white rounded-full text-sm font-semibold transition-all shadow-xs ${
            isAnalyzing ? 'opacity-80 cursor-not-allowed' : 'active:scale-98 hover:shadow-md'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 stroke-[2.2]" />
              <span>Analyze Sepsis Risk</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
