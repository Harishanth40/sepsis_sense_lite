import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ExtractedRecordData } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  uploadedRecord: ExtractedRecordData | null;
  onLoadSampleReport: (sampleType: 'icu' | 'ward' | 'emergency') => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  isUploading,
  uploadProgress,
  uploadedRecord,
  onLoadSampleReport
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#007A78]/10 text-[#007A78] flex items-center justify-center">
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Hospital Records</h3>
              <p className="text-xs text-slate-500">Automated extraction for vitals and lab results</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.xlsx,.xls,.txt,image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-[#007A78] bg-[#007A78]/5 scale-[0.99]'
                : 'border-slate-200 hover:border-[#007A78]/50 hover:bg-slate-50/60'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#007A78] flex items-center justify-center mb-3 shadow-2xs">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6 stroke-[2]" />
              )}
            </div>

            <p className="text-sm font-semibold text-slate-800">
              Drag & drop files here or click to browse
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF, CSV, XLSX, TXT, PNG, and JPG images
            </p>

            <button
              type="button"
              disabled={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-4 px-4 py-1.5 text-xs font-semibold text-[#007A78] bg-[#007A78]/10 hover:bg-[#007A78]/20 rounded-full transition-colors"
            >
              {isUploading ? 'Extracting clinical values...' : 'Choose File'}
            </button>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                <span>Processing medical document...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#007A78] transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Uploaded File Info */}
          {uploadedRecord && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#007A78] flex items-center justify-center">
                    {uploadedRecord.fileType?.includes('csv') ? (
                      <FileSpreadsheet className="w-4 h-4" />
                    ) : uploadedRecord.fileType?.includes('image') ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                      {uploadedRecord.fileName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {uploadedRecord.fileSize} · {uploadedRecord.fileType}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
                  title="Replace file"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Record uploaded successfully. Values populated into form.</span>
              </div>

              {uploadedRecord.unidentifiableFields && uploadedRecord.unidentifiableFields.length > 0 && (
                <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Unable to identify this value: </span>
                    <span>{uploadedRecord.unidentifiableFields.map(f => f.replace('_', ' ')).join(', ')}. Please enter it manually.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Mock Sample Records */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#007A78]" />
              <span>Quick Test with Mock Clinical Records</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  onLoadSampleReport('icu');
                  onClose();
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-[#007A78] hover:bg-teal-50/40 text-left transition-colors"
              >
                <p className="font-bold text-slate-800">ICU Shock Chart</p>
                <p className="text-[10px] text-slate-400 mt-0.5">HR 115, Lac 2.45, BP 95</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadSampleReport('ward');
                  onClose();
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-[#007A78] hover:bg-teal-50/40 text-left transition-colors"
              >
                <p className="font-bold text-slate-800">Ward Observation</p>
                <p className="text-[10px] text-slate-400 mt-0.5">HR 98, Lac 2.1, BP 106</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadSampleReport('emergency');
                  onClose();
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-[#007A78] hover:bg-teal-50/40 text-left transition-colors"
              >
                <p className="font-bold text-slate-800">Stable Baseline</p>
                <p className="text-[10px] text-slate-400 mt-0.5">HR 72, Lac 1.1, BP 120</p>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
