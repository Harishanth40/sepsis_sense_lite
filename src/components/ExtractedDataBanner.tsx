import React from 'react';
import { FileCheck, Heart, Clock, Gauge, Thermometer, FlaskConical, Activity, Check } from 'lucide-react';
import { ExtractedRecordData, FieldSourceMap } from '../types';

interface ExtractedDataBannerProps {
  uploadedRecord: ExtractedRecordData | null;
  sourceMap: FieldSourceMap;
}

export const ExtractedDataBanner: React.FC<ExtractedDataBannerProps> = ({
  uploadedRecord,
  sourceMap
}) => {
  if (!uploadedRecord || Object.keys(uploadedRecord.extracted).length === 0) {
    return null;
  }

  const { extracted } = uploadedRecord;

  // Extract display values
  const hr = extracted.heart_rate?.value;
  const sbp = extracted.systolic_bp?.value;
  const dbp = extracted.diastolic_bp?.value;
  const spo2 = extracted.spo2?.value;
  const temp = extracted.temperature?.value;
  const lactate = extracted.lactate?.value;
  const creatinine = extracted.creatinine?.value;

  const hasAnyCard = hr || sbp || spo2 || temp || lactate || creatinine;
  if (!hasAnyCard) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
          <FileCheck className="w-3.5 h-3.5" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            Extracted Data <span className="font-normal text-slate-500">(from uploaded documents)</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Values detected automatically from your uploaded hospital records (converted to clinical numeric types)
          </p>
        </div>
      </div>

      {/* Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Heart Rate */}
        {hr !== undefined && (
          <div className="bg-blue-50/70 border border-blue-100/90 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-[11px] font-semibold">Heart Rate</span>
              <Heart className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold font-mono text-slate-900">
                {Number(hr).toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">bpm</span>
            </div>
            {sourceMap.heart_rate === 'manual' && (
              <span className="text-[9px] text-amber-600 font-medium mt-1">Edited manually</span>
            )}
          </div>
        )}

        {/* Blood Pressure */}
        {(sbp !== undefined || dbp !== undefined) && (
          <div className="bg-purple-50/70 border border-purple-100/90 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-700">
              <span className="text-[11px] font-semibold">Blood Pressure</span>
              <Clock className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold font-mono text-slate-900">
                {sbp !== undefined ? Number(sbp).toFixed(1) : '--'}/{dbp !== undefined ? Number(dbp).toFixed(1) : '--'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">mmHg</span>
            </div>
            {(sourceMap.systolic_bp === 'manual' || sourceMap.diastolic_bp === 'manual') && (
              <span className="text-[9px] text-amber-600 font-medium mt-1">Edited manually</span>
            )}
          </div>
        )}

        {/* SpO2 */}
        {spo2 !== undefined && (
          <div className="bg-emerald-50/70 border border-emerald-100/90 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[11px] font-semibold">SpO₂</span>
              <Gauge className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold font-mono text-slate-900">
                {Number(spo2).toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">%</span>
            </div>
            {sourceMap.spo2 === 'manual' && (
              <span className="text-[9px] text-amber-600 font-medium mt-1">Edited manually</span>
            )}
          </div>
        )}

        {/* Temperature */}
        {temp !== undefined && (
          <div className="bg-rose-50/70 border border-rose-100/90 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-[11px] font-semibold">Temperature</span>
              <Thermometer className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold font-mono text-slate-900">
                {Number(temp).toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">°C</span>
            </div>
            {sourceMap.temperature === 'manual' && (
              <span className="text-[9px] text-amber-600 font-medium mt-1">Edited manually</span>
            )}
          </div>
        )}

        {/* Lactate */}
        {lactate !== undefined && (
          <div className="bg-amber-50/70 border border-amber-100/90 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[11px] font-semibold">Lactate</span>
              <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold font-mono text-slate-900">
                {Number(lactate).toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">mmol/L</span>
            </div>
            {sourceMap.lactate === 'manual' && (
              <span className="text-[9px] text-amber-600 font-medium mt-1">Edited manually</span>
            )}
          </div>
        )}

        {/* Creatinine */}
        {creatinine !== undefined && (
          <div className="bg-indigo-50/70 border border-indigo-100/90 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-700">
              <span className="text-[11px] font-semibold">Creatinine</span>
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold font-mono text-slate-900">
                {Number(creatinine).toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">mg/dL</span>
            </div>
            {sourceMap.creatinine === 'manual' && (
              <span className="text-[9px] text-amber-600 font-medium mt-1">Edited manually</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
