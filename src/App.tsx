import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { ClinicalCard } from './components/ClinicalCard';
import { ChatInputBar } from './components/ChatInputBar';
import { UploadModal } from './components/UploadModal';
import { ResultPanel } from './components/ResultPanel';
import { ClinicalReportModal } from './components/ClinicalReportModal';
import { Lock, AlertCircle, MessageSquare } from 'lucide-react';
import {
  PatientFormState,
  BloodGroup,
  FieldSourceMap,
  ExtractedRecordData,
  SepsisPredictionResponse
} from './types';

// Matching the exact clinical values displayed in the user screenshots
const DEFAULT_FORM: PatientFormState = {
  age: '45',
  blood_group: '',
  temperature: '38.6',
  heart_rate: '115',
  respiratory_rate: '26',
  systolic_bp: '95',
  diastolic_bp: '',
  lactate: '2.45',
  creatinine: '1.72',
  spo2: '',
  wbc: ''
};

export default function App() {
  const [form, setForm] = useState<PatientFormState>(DEFAULT_FORM);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('');
  const [sourceMap, setSourceMap] = useState<FieldSourceMap>({
    age: 'manual',
    temperature: 'manual',
    heart_rate: 'manual',
    respiratory_rate: 'manual',
    systolic_bp: 'manual',
    lactate: 'manual',
    creatinine: 'manual'
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedRecord, setUploadedRecord] = useState<ExtractedRecordData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictionResult, setPredictionResult] = useState<SepsisPredictionResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [chatAnswer, setChatAnswer] = useState<{ query: string; reply: string } | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const resultRef = useRef<HTMLDivElement | null>(null);

  // Field edit handler - manual values override extracted values
  const handleFieldChange = (field: keyof PatientFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSourceMap((prev) => ({ ...prev, [field]: 'manual' }));
    if (analysisError) setAnalysisError(null);
  };

  // Upload file handler
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(15);
    setAnalysisError(null);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev >= 85 ? 85 : prev + 15));
    }, 150);

    try {
      const isImage = file.type.startsWith('image/');
      let fileContent = '';
      let imageBase64 = '';

      if (isImage) {
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else {
        fileContent = await file.text();
      }

      const response = await fetch('/api/extract-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'text/plain',
          fileContent: fileContent || '',
          imageBase64: imageBase64 || '',
          fileSize: `${(file.size / 1024).toFixed(1)} KB`
        })
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract record.');
      }

      const extractedInfo: ExtractedRecordData = {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        fileType: file.type || 'Hospital Record',
        extracted: data.extracted || {},
        unidentifiableFields: data.unidentifiableFields || [],
        message: data.message || 'Record uploaded successfully.'
      };

      setUploadedRecord(extractedInfo);

      // Populate form with converted numeric values
      const newSourceMap = { ...sourceMap };
      const newForm = { ...form };

      if (extractedInfo.extracted.age) {
        newForm.age = String(Math.round(Number(extractedInfo.extracted.age.value)));
        newSourceMap.age = 'extracted';
      }
      if (extractedInfo.extracted.blood_group) {
        const bg = String(extractedInfo.extracted.blood_group.value) as BloodGroup;
        setBloodGroup(bg);
      }
      if (extractedInfo.extracted.temperature) {
        newForm.temperature = String(extractedInfo.extracted.temperature.value);
        newSourceMap.temperature = 'extracted';
      }
      if (extractedInfo.extracted.heart_rate) {
        newForm.heart_rate = String(extractedInfo.extracted.heart_rate.value);
        newSourceMap.heart_rate = 'extracted';
      }
      if (extractedInfo.extracted.respiratory_rate) {
        newForm.respiratory_rate = String(extractedInfo.extracted.respiratory_rate.value);
        newSourceMap.respiratory_rate = 'extracted';
      }
      if (extractedInfo.extracted.systolic_bp) {
        newForm.systolic_bp = String(extractedInfo.extracted.systolic_bp.value);
        newSourceMap.systolic_bp = 'extracted';
      }
      if (extractedInfo.extracted.lactate) {
        newForm.lactate = String(extractedInfo.extracted.lactate.value);
        newSourceMap.lactate = 'extracted';
      }
      if (extractedInfo.extracted.creatinine) {
        newForm.creatinine = String(extractedInfo.extracted.creatinine.value);
        newSourceMap.creatinine = 'extracted';
      }

      setForm(newForm);
      setSourceMap(newSourceMap);
    } catch (err: any) {
      clearInterval(progressTimer);
      setAnalysisError(err.message || 'Error parsing uploaded record. Please enter values manually.');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 300);
    }
  };

  // Sample record loader
  const handleLoadSample = (sampleType: string) => {
    if (sampleType === 'icu' || sampleType === 'high') {
      setForm({
        age: '68',
        blood_group: 'O+',
        temperature: '38.8',
        heart_rate: '122',
        respiratory_rate: '28',
        systolic_bp: '82',
        diastolic_bp: '48',
        lactate: '3.8',
        creatinine: '2.1',
        spo2: '91',
        wbc: '18.2'
      });
      setBloodGroup('O+');
      setUploadedRecord({
        fileName: 'ICU_Septic_Shock_Chart.csv',
        fileSize: '36.4 KB',
        fileType: 'text/csv',
        extracted: {
          heart_rate: { value: 122, confidence: 0.98 },
          systolic_bp: { value: 82, confidence: 0.99 },
          temperature: { value: 38.8, confidence: 0.97 },
          respiratory_rate: { value: 28, confidence: 0.95 },
          lactate: { value: 3.8, confidence: 0.99 },
          creatinine: { value: 2.1, confidence: 0.98 },
          age: { value: 68, confidence: 0.99 }
        },
        unidentifiableFields: [],
        message: 'Record uploaded successfully.'
      });
    } else if (sampleType === 'ward' || sampleType === 'moderate') {
      setForm({
        age: '54',
        blood_group: 'A+',
        temperature: '38.2',
        heart_rate: '98',
        respiratory_rate: '22',
        systolic_bp: '106',
        diastolic_bp: '68',
        lactate: '2.1',
        creatinine: '1.2',
        spo2: '95',
        wbc: '11.4'
      });
      setBloodGroup('A+');
    } else {
      setForm({
        age: '42',
        blood_group: 'B+',
        temperature: '36.8',
        heart_rate: '72',
        respiratory_rate: '14',
        systolic_bp: '120',
        diastolic_bp: '78',
        lactate: '1.1',
        creatinine: '0.9',
        spo2: '99',
        wbc: '6.8'
      });
      setBloodGroup('B+');
    }
  };

  // Run Sepsis Risk Analysis (POST /predict)
  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    const clientStartTime = performance.now();

    try {
      // Validate inputs
      const ageNum = form.age ? parseInt(form.age, 10) : null;
      if (form.age && (isNaN(ageNum!) || ageNum! < 0 || ageNum! > 125)) {
        throw new Error('Age must be a valid integer between 0 and 125 years.');
      }

      const parseField = (val: string, name: string, min: number, max: number): number | null => {
        if (!val.trim()) return null;
        const num = parseFloat(val);
        if (isNaN(num) || num < min || num > max) {
          throw new Error(`Invalid ${name} (${val}). Expected numeric value between ${min} and ${max}.`);
        }
        return num;
      };

      const payload = {
        age: ageNum,
        blood_group: bloodGroup || null,
        temperature: parseField(form.temperature, 'temperature', 28, 45),
        heart_rate: parseField(form.heart_rate, 'heart rate', 20, 260),
        respiratory_rate: parseField(form.respiratory_rate, 'respiratory rate', 4, 75),
        systolic_bp: parseField(form.systolic_bp, 'systolic BP', 30, 280),
        lactate: parseField(form.lactate, 'lactate', 0.1, 30),
        creatinine: parseField(form.creatinine, 'creatinine', 0.1, 25)
      };

      const hasVitals = [
        payload.temperature,
        payload.heart_rate,
        payload.respiratory_rate,
        payload.systolic_bp,
        payload.lactate,
        payload.creatinine
      ].some((v) => v !== null);

      if (!hasVitals) {
        throw new Error('Please enter patient vitals or lab values to analyze sepsis risk.');
      }

      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete sepsis prediction.');
      }

      const clientElapsedSec = parseFloat(((performance.now() - clientStartTime) / 1000).toFixed(2));
      const finalResult: SepsisPredictionResponse = {
        ...data,
        execution_time_seconds: Math.max(0.1, clientElapsedSec)
      };

      setPredictionResult(finalResult);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      setAnalysisError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Conversational message handler
  const handleSendMessage = async (text: string) => {
    setIsChatLoading(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          patientData: {
            ...form,
            blood_group: bloodGroup
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to answer inquiry.');

      setChatAnswer({
        query: text,
        reply: data.reply
      });

      // If user typed vitals in chat, extract and populate form
      if (/(?:hr|bp|temp|lactate|cr|rr|age|blood|vitals|shock|rate|group)/i.test(text)) {
        const extractRes = await fetch('/api/extract-record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileContent: text, fileName: 'Clinician Query' })
        });
        const extractData = await extractRes.json();
        if (extractData.extracted) {
          const newForm = { ...form };
          const newSourceMap = { ...sourceMap };
          for (const [key, item] of Object.entries(extractData.extracted)) {
            if (key in newForm && (item as any).value !== undefined) {
              (newForm as any)[key] = String((item as any).value);
              newSourceMap[key] = 'extracted';
            }
          }
          if (extractData.extracted.blood_group && extractData.extracted.blood_group.value) {
            const bg = String(extractData.extracted.blood_group.value).trim().toUpperCase() as BloodGroup;
            const validBGs: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            if (validBGs.includes(bg)) {
              setBloodGroup(bg);
              newForm.blood_group = bg;
              newSourceMap.blood_group = 'extracted';
            }
          }
          setForm(newForm);
          setSourceMap(newSourceMap);
        }
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Error processing inquiry.');
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFA] text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onSelectPreset={handleLoadSample}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 flex flex-col items-center">
        {/* Centered Main Title & Subtitle */}
        <div className="text-center mb-8 sm:mb-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            AI-Powered Sepsis Risk Assessment
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600">
            Upload patient records or enter clinical values manually to predict sepsis risk.
          </p>
        </div>

        {/* Global Error Banner */}
        {analysisError && (
          <div className="max-w-4xl w-full mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-rose-800 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-900">Clinical Data Notice</p>
              <p className="mt-0.5">{analysisError}</p>
            </div>
            <button
              type="button"
              onClick={() => setAnalysisError(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-semibold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Central Clinical Information Card */}
        <ClinicalCard
          form={form}
          bloodGroup={bloodGroup}
          onFieldChange={handleFieldChange}
          onBloodGroupChange={setBloodGroup}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />

        {/* Centered Privacy Statement below the card */}
        <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
          <span>Uploaded records are processed only for this analysis and are not stored.</span>
        </div>

        {/* Results Section */}
        <div ref={resultRef} className="w-full">
          {predictionResult && (
            <ResultPanel
              result={predictionResult}
              onPrintReport={() => setIsReportOpen(true)}
              onReset={() => setPredictionResult(null)}
            />
          )}
        </div>

        {/* Medical Chat Assistant Response */}
        {chatAnswer && (
          <div className="max-w-4xl w-full mt-6 bg-white rounded-2xl border border-teal-200 shadow-sm p-5 animate-in fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#007A78]">
                <MessageSquare className="w-4 h-4" />
                <span>SepsisSense Clinical Response</span>
              </div>
              <button
                type="button"
                onClick={() => setChatAnswer(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Close
              </button>
            </div>
            <p className="text-xs font-medium text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Query: &ldquo;{chatAnswer.query}&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-slate-800 mt-3 leading-relaxed">
              {chatAnswer.reply}
            </p>
          </div>
        )}

        {/* ChatGPT-style Bottom Input Bar */}
        <ChatInputBar
          onSendMessage={handleSendMessage}
          onTriggerFileUpload={() => setIsUploadModalOpen(true)}
          onTriggerImageUpload={() => setIsUploadModalOpen(true)}
          isLoading={isChatLoading}
        />
      </main>

      {/* Upload Hospital Records Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadedRecord={uploadedRecord}
        onLoadSampleReport={handleLoadSample}
      />

      {/* Printable Clinical Report Modal */}
      {predictionResult && (
        <ClinicalReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          form={form}
          bloodGroup={bloodGroup}
          result={predictionResult}
        />
      )}
    </div>
  );
}
