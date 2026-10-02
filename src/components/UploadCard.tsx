import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, X, RefreshCw, Sparkles, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { ExtractedRecordData } from '../types';

interface UploadCardProps {
  onFileUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  uploadedRecord: ExtractedRecordData | null;
  onRemoveRecord: () => void;
  onLoadSampleReport: (sampleType: 'icu' | 'ward' | 'emergency') => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  onFileUpload,
  isUploading,
  uploadProgress,
  uploadedRecord,
  onRemoveRecord,
  onLoadSampleReport,
  fileInputRef
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full transition-all">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Upload Hospital Records</h2>
              <p className="text-[11px] text-slate-500">Automated extraction for vitals & lab metrics</p>
            </div>
          </div>

          {/* Sample hospital records button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSampleMenuOpen(!sampleMenuOpen)}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100/70 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Sample Labs</span>
            </button>
            {sampleMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                <div className="px-3 py-1 text-[10px] text-slate-400 font-semibold uppercase">Load Mock Record</div>
                <button
                  type="button"
                  onClick={() => {
                    onLoadSampleReport('icu');
                    setSampleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  ICU Septic Shock Chart (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLoadSampleReport('ward');
                    setSampleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  Ward Pulmonary Report (TXT)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLoadSampleReport('emergency');
                    setSampleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  ER Triage Note (PDF/Text)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.xlsx,.xls,.txt,image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Drag & Drop Zone */}
        {!uploadedRecord ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 bg-slate-50/20'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
              {isUploading ? (
                <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
              ) : (
                <UploadCloud className="w-7 h-7 stroke-[1.8]" />
              )}
            </div>

            <p className="text-sm font-semibold text-slate-800">
              Drag & drop files here or click to upload
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Supports PDF, PNG, JPG (images), CSV (lab reports), XLSX, TXT
            </p>

            <button
              type="button"
              disabled={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors shadow-xs"
            >
              {isUploading ? 'Extracting clinical values...' : 'Choose Files'}
            </button>
          </div>
        ) : (
          /* Uploaded File Details */
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  {uploadedRecord.fileType?.includes('csv') || uploadedRecord.fileName.endsWith('.csv') ? (
                    <FileSpreadsheet className="w-5 h-5" />
                  ) : uploadedRecord.fileType?.includes('image') ? (
                    <ImageIcon className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate" title={uploadedRecord.fileName}>
                    {uploadedRecord.fileName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {uploadedRecord.fileSize || 'Hospital Record'} · {uploadedRecord.fileType || 'Medical document'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
                  title="Replace file"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onRemoveRecord}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Success message */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Record uploaded successfully.</span>
            </div>

            {/* Unidentifiable fields notice if any */}
            {uploadedRecord.unidentifiableFields && uploadedRecord.unidentifiableFields.length > 0 && (
              <div className="mt-2.5 bg-amber-50/80 border border-amber-200/70 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Unable to identify some values automatically: </span>
                  <span>{uploadedRecord.unidentifiableFields.map(f => f.replace('_', ' ')).join(', ')}. Please enter them manually.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1 font-medium">
              <span>Extracting clinical data & verifying types...</span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Ribbon */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5 truncate">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Upload vitals charts, lab reports, nursing notes, or patient summary</span>
        </span>
      </div>
    </div>
  );
};
