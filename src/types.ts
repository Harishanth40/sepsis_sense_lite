export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '';

export interface PatientFormState {
  age: string;
  blood_group: BloodGroup;
  temperature: string;
  heart_rate: string;
  respiratory_rate: string;
  systolic_bp: string;
  diastolic_bp: string;
  lactate: string;
  creatinine: string;
  spo2: string;
  wbc: string;
}

export type FieldSource = 'extracted' | 'manual' | 'unspecified';

export interface FieldSourceMap {
  [key: string]: FieldSource;
}

export interface ExtractedField {
  value: number | string;
  confidence: number;
  sourceText?: string;
}

export interface ExtractedRecordData {
  fileName: string;
  fileSize?: string;
  fileType?: string;
  extracted: Record<string, ExtractedField>;
  unidentifiableFields: string[];
  message: string;
}

export interface LocalAdviceItem {
  tag: string;
  title: string;
  advice: string;
}

export interface SepsisPredictionResponse {
  risk_level: 'Low' | 'Moderate' | 'High';
  probability: number;
  message: string;
  sepsis_type: string;
  suspected_source: string;
  local_advices: LocalAdviceItem[];
  contributing_factors: string[];
  qsofa_score: number;
  sirs_score: number;
  shock_index: number | null;
  clinical_actions: string[];
  execution_time_seconds: number;
  disclaimer: string;
}

export interface PatientHistoryItem {
  id: string;
  timestamp: string;
  age: number | null;
  blood_group: string | null;
  prediction: SepsisPredictionResponse;
  vitalsSummary: string;
}
