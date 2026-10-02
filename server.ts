import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize Gemini client if API key is provided
let geminiAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.warn('Failed to initialize Gemini AI client:', err);
  }
}

export interface PatientData {
  age?: number | null;
  blood_group?: string | null;
  temperature?: number | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  lactate?: number | null;
  creatinine?: number | null;
  spo2?: number | null;
  wbc?: number | null;
  notes?: string | null;
}

export interface PredictionResult {
  risk_level: 'Low' | 'Moderate' | 'High';
  probability: number;
  message: string;
  contributing_factors: string[];
  qsofa_score: number;
  sirs_score: number;
  shock_index: number | null;
  clinical_actions: string[];
  execution_time_seconds: number;
  disclaimer: string;
}

/**
 * Clinical Sepsis Risk Evaluation Model
 * Calibrated against qSOFA, SIRS criteria, Surviving Sepsis Campaign guidelines,
 * and hemodynamic organ hypoperfusion indices (shock index, lactate clearance threshold, renal creatinine).
 */
function evaluateSepsisRisk(data: PatientData, startTimeMs: number): PredictionResult {
  const contributing_factors: string[] = [];
  let riskScore = 0; // base score points
  let sirsScore = 0;
  let qsofaScore = 0;

  const age = typeof data.age === 'number' ? data.age : null;
  const temp = typeof data.temperature === 'number' ? data.temperature : null;
  const hr = typeof data.heart_rate === 'number' ? data.heart_rate : null;
  const rr = typeof data.respiratory_rate === 'number' ? data.respiratory_rate : null;
  const sbp = typeof data.systolic_bp === 'number' ? data.systolic_bp : null;
  const dbp = typeof data.diastolic_bp === 'number' ? data.diastolic_bp : null;
  const lactate = typeof data.lactate === 'number' ? data.lactate : null;
  const creatinine = typeof data.creatinine === 'number' ? data.creatinine : null;
  const spo2 = typeof data.spo2 === 'number' ? data.spo2 : null;
  const wbc = typeof data.wbc === 'number' ? data.wbc : null;

  // 1. Heart Rate (SIRS criteria: HR > 90)
  if (hr !== null) {
    if (hr >= 125) {
      riskScore += 24;
      sirsScore += 1;
      contributing_factors.push(`Severe tachycardia (Heart rate: ${hr} bpm)`);
    } else if (hr > 90) {
      riskScore += 10;
      sirsScore += 1;
      contributing_factors.push(`Elevated heart rate (Heart rate: ${hr} bpm)`);
    } else if (hr < 50) {
      riskScore += 10;
      contributing_factors.push(`Profound bradycardia (Heart rate: ${hr} bpm)`);
    }
  }

  // 2. Respiratory Rate (qSOFA: RR >= 22; SIRS: RR > 20)
  if (rr !== null) {
    if (rr >= 26) {
      riskScore += 25;
      qsofaScore += 1;
      sirsScore += 1;
      contributing_factors.push(`Marked tachypnea (Respiratory rate: ${rr} breaths/min)`);
    } else if (rr >= 22) {
      riskScore += 15;
      qsofaScore += 1;
      sirsScore += 1;
      contributing_factors.push(`Increased respiratory rate (Respiratory rate: ${rr} breaths/min)`);
    } else if (rr > 20) {
      riskScore += 8;
      sirsScore += 1;
      contributing_factors.push(`Mild tachypnea (Respiratory rate: ${rr} breaths/min)`);
    }
  }

  // 3. Systolic Blood Pressure (qSOFA: SBP <= 100; Septic shock: SBP < 90)
  if (sbp !== null) {
    if (sbp < 90) {
      riskScore += 30;
      qsofaScore += 1;
      contributing_factors.push(`Hypotension / Septic shock range (Systolic BP: ${sbp} mmHg)`);
    } else if (sbp <= 100) {
      riskScore += 15;
      qsofaScore += 1;
      contributing_factors.push(`Low systolic blood pressure (Systolic BP: ${sbp} mmHg)`);
    }
  }

  // 4. Serum Lactate (Tissue hypoperfusion marker)
  if (lactate !== null) {
    if (lactate >= 4.0) {
      riskScore += 32;
      contributing_factors.push(`Critical serum lactate indicating severe cellular hypoxia (${lactate.toFixed(2)} mmol/L)`);
    } else if (lactate >= 2.0) {
      riskScore += 12;
      contributing_factors.push(`Elevated lactate indicating tissue hypoperfusion (${lactate.toFixed(2)} mmol/L)`);
    }
  }

  // 5. Serum Creatinine (Acute Kidney Injury / Organ Dysfunction)
  if (creatinine !== null) {
    if (creatinine >= 2.0) {
      riskScore += 20;
      contributing_factors.push(`Markedly increased creatinine indicating acute renal injury (${creatinine.toFixed(2)} mg/dL)`);
    } else if (creatinine >= 1.4) {
      riskScore += 8;
      contributing_factors.push(`Elevated serum creatinine (${creatinine.toFixed(2)} mg/dL)`);
    }
  }

  // 6. Body Temperature (SIRS: Temp > 38.0�C or < 36.0�C)
  if (temp !== null) {
    if (temp >= 39.0) {
      riskScore += 14;
      sirsScore += 1;
      contributing_factors.push(`Significant hyperthermia (Temperature: ${temp.toFixed(1)} �C)`);
    } else if (temp > 38.0) {
      riskScore += 8;
      sirsScore += 1;
      contributing_factors.push(`Fever (Temperature: ${temp.toFixed(1)} �C)`);
    } else if (temp < 36.0) {
      riskScore += 16;
      sirsScore += 1;
      contributing_factors.push(`Hypothermia - ominous septic dysregulation (Temperature: ${temp.toFixed(1)} �C)`);
    }
  }

  // 7. Oxygen Saturation (SpO2)
  if (spo2 !== null) {
    if (spo2 < 90) {
      riskScore += 16;
      contributing_factors.push(`Severe hypoxia (SpO2: ${spo2}%)`);
    } else if (spo2 <= 93) {
      riskScore += 8;
      contributing_factors.push(`Borderline oxygen saturation (SpO2: ${spo2}%)`);
    }
  }

  // 8. White Blood Cell Count (WBC)
  if (wbc !== null) {
    if (wbc > 12.0) {
      riskScore += 8;
      sirsScore += 1;
      contributing_factors.push(`Leukocytosis (WBC: ${wbc.toFixed(1)} � 10?/L)`);
    } else if (wbc < 4.0) {
      riskScore += 14;
      sirsScore += 1;
      contributing_factors.push(`Leukopenia - immune exhaustion (WBC: ${wbc.toFixed(1)} � 10?/L)`);
    }
  }

  // 9. Shock Index (HR / SBP). Normal < 0.7; > 0.9 suggests occult shock
  let shockIndex: number | null = null;
  if (hr !== null && sbp !== null && sbp > 0) {
    shockIndex = parseFloat((hr / sbp).toFixed(2));
    if (shockIndex >= 1.0) {
      riskScore += 14;
      contributing_factors.push(`Elevated shock index ${shockIndex} (>0.9 indicates hemodynamic decompensation)`);
    } else if (shockIndex >= 0.9) {
      riskScore += 6;
      contributing_factors.push(`Borderline shock index ${shockIndex}`);
    }
  }

  // 10. Age factor (> 65 years carries higher vulnerability)
  if (age !== null && age >= 65) {
    riskScore += 4;
  }

  // Calculate logistic probability (calibrated range 0.04 to 0.98)
  const normalizedExponent = (riskScore - 42) / 16;
  const rawProb = 1 / (1 + Math.exp(-normalizedExponent));
  const probability = parseFloat(Math.min(0.98, Math.max(0.04, rawProb)).toFixed(2));

  // Determine Risk Category based on probability, qSOFA, and lactate
  let risk_level: 'Low' | 'Moderate' | 'High' = 'Low';
  let message = 'Low sepsis risk. Continue standard clinical monitoring.';

  const isSevereLactate = lactate !== null && lactate >= 4.0;
  const isHypotension = sbp !== null && sbp < 90;

  if (qsofaScore >= 2 || (isHypotension && isSevereLactate) || riskScore >= 56 || probability >= 0.65) {
    risk_level = 'High';
    message = 'High Sepsis Risk � Immediate Clinical Evaluation Recommended';
  } else if (probability >= 0.30 || qsofaScore === 1 || (lactate !== null && lactate >= 2.0) || sirsScore >= 2 || riskScore >= 20) {
    risk_level = 'Moderate';
    message = 'Moderate Sepsis Risk. Heightened surveillance and repeat lactate within 2-4 hours recommended.';
  } else {
    risk_level = 'Low';
    message = 'Low Sepsis Risk. Patient parameters currently within acceptable baseline.';
  }

  // Surviving Sepsis Campaign (SSC) 1-Hour Bundle Recommendations
  const clinical_actions: string[] = [];
  if (risk_level === 'High') {
    clinical_actions.push('Measure blood lactate level immediately; re-measure if initial lactate > 2.0 mmol/L.');
    clinical_actions.push('Obtain blood cultures prior to initiation of antimicrobial therapy.');
    clinical_actions.push('Administer broad-spectrum empiric IV antimicrobials within 1 hour.');
    clinical_actions.push('Rapidly administer 30 mL/kg crystalloid for hypotension (MAP < 65) or lactate = 4.0 mmol/L.');
    clinical_actions.push('Apply vasopressors (norepinephrine first-line) during or after fluid resuscitation to maintain MAP = 65 mmHg.');
  } else if (risk_level === 'Moderate') {
    clinical_actions.push('Perform bedside clinical assessment and repeat vital signs every 1-2 hours.');
    clinical_actions.push('Review infectious sources (pulmonary, urinary tract, abdominal, catheter).');
    clinical_actions.push('Check repeat serial lactate and full blood count.');
    clinical_actions.push('Prepare peripheral IV access and optimize fluid intake.');
  } else {
    clinical_actions.push('Maintain routine ward vital observations every 4-6 hours.');
    clinical_actions.push('Re-assess if fever develops or respiratory status changes.');
  }

  const execution_time_seconds = parseFloat(((Date.now() - startTimeMs) / 1000).toFixed(2));

  return {
    risk_level,
    probability,
    message,
    contributing_factors: contributing_factors.length > 0 ? contributing_factors : ['All measured clinical vitals within stable reference ranges'],
    qsofa_score: qsofaScore,
    sirs_score: sirsScore,
    shock_index: shockIndex,
    clinical_actions,
    execution_time_seconds: Math.max(0.05, execution_time_seconds),
    disclaimer: 'This system is an AI-based clinical decision-support tool and does not replace professional medical diagnosis.'
  };
}

/**
 * POST /predict
 * Primary API endpoint matching user specification.
 */
app.post(['/predict', '/api/predict'], (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const body = req.body || {};

    // Validate and convert numeric values
    // Age must be integer if provided
    let age: number | null = null;
    if (body.age !== undefined && body.age !== null && body.age !== '') {
      const parsedAge = parseInt(String(body.age), 10);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
        return res.status(400).json({ error: 'Invalid age value. Please provide a valid integer between 0 and 125.' });
      }
      age = parsedAge;
    }

    // Blood Group
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    let blood_group: string | null = null;
    if (body.blood_group && typeof body.blood_group === 'string') {
      const bg = body.blood_group.trim().toUpperCase();
      if (validBloodGroups.includes(bg)) {
        blood_group = bg;
      }
    }

    // Floating-point clinical variables
    const parseNumber = (val: any, min: number, max: number, name: string): number | null => {
      if (val === undefined || val === null || val === '') return null;
      const num = parseFloat(String(val));
      if (isNaN(num) || num < min || num > max) {
        throw new Error(`Invalid ${name} value (${val}). Expected numeric value between ${min} and ${max}.`);
      }
      return num;
    };

    let temperature: number | null = null;
    let heart_rate: number | null = null;
    let respiratory_rate: number | null = null;
    let systolic_bp: number | null = null;
    let diastolic_bp: number | null = null;
    let lactate: number | null = null;
    let creatinine: number | null = null;
    let spo2: number | null = null;
    let wbc: number | null = null;

    try {
      temperature = parseNumber(body.temperature, 28, 45, 'temperature');
      heart_rate = parseNumber(body.heart_rate, 20, 300, 'heart rate');
      respiratory_rate = parseNumber(body.respiratory_rate, 4, 80, 'respiratory rate');
      systolic_bp = parseNumber(body.systolic_bp, 30, 300, 'systolic BP');
      diastolic_bp = parseNumber(body.diastolic_bp, 10, 200, 'diastolic BP');
      lactate = parseNumber(body.lactate, 0.1, 30, 'lactate');
      creatinine = parseNumber(body.creatinine, 0.1, 25, 'creatinine');
      spo2 = parseNumber(body.spo2, 30, 100, 'SpO2');
      wbc = parseNumber(body.wbc, 0.1, 100, 'WBC');
    } catch (validationErr: any) {
      return res.status(400).json({ error: validationErr.message });
    }

    // Check that at least some clinical vitals are provided
    const hasVitals = [temperature, heart_rate, respiratory_rate, systolic_bp, lactate, creatinine].some(v => v !== null);
    if (!hasVitals && age === null) {
      return res.status(400).json({
        error: 'Please provide at least one clinical vital (e.g. Heart Rate, Temperature, Blood Pressure, Lactate) to assess sepsis risk.'
      });
    }

    const patientData: PatientData = {
      age,
      blood_group,
      temperature,
      heart_rate,
      respiratory_rate,
      systolic_bp,
      diastolic_bp,
      lactate,
      creatinine,
      spo2,
      wbc,
      notes: body.notes || null
    };

    const result = evaluateSepsisRisk(patientData, startTime);
    return res.json(result);
  } catch (err: any) {
    console.error('Error in /predict:', err);
    return res.status(500).json({ error: 'Internal server error processing clinical analysis.' });
  }
});

/**
 * Helper to extract clinical values from raw text using regex
 */
function extractWithRegex(text: string) {
  const extracted: Record<string, { value: number | string; confidence: number; sourceText: string }> = {};

  // Age: e.g. "Age: 64", "64 y/o", "64yo", "Age 64 years"
  const ageMatch = text.match(/(?:age|patient\s+age)[:\s]*([0-9]{1,3})|(?:^|\s)([0-9]{1,3})\s*(?:yo|y\/o|years\s+old)/i);
  if (ageMatch) {
    const ageVal = parseInt(ageMatch[1] || ageMatch[2], 10);
    if (ageVal > 0 && ageVal < 125) {
      extracted.age = { value: ageVal, confidence: 0.95, sourceText: ageMatch[0].trim() };
    }
  }

  // Blood group: e.g. "Blood Group: O+", "O Rh+", "Type: AB-"
  const bgMatch = text.match(/(?:blood\s*group|blood\s*type|type)[:\s]*([ABO]{1,2}\s*[+-]|O\s*Rh[+-])/i) ||
                   text.match(/\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/);
  if (bgMatch) {
    let bg = (bgMatch[1] || bgMatch[0]).trim().toUpperCase().replace(/\s*RH/i, '');
    extracted.blood_group = { value: bg, confidence: 0.9, sourceText: bgMatch[0].trim() };
  }

  // Heart Rate / Pulse: e.g. "HR: 112", "Pulse: 112 bpm", "Heart Rate 112"
  const hrMatch = text.match(/(?:heart\s*rate|hr|pulse|pulse\s*rate)[:\s]*([0-9]{2,3})\s*(?:bpm)?/i);
  if (hrMatch) {
    const hr = parseFloat(hrMatch[1]);
    if (hr >= 30 && hr <= 250) {
      extracted.heart_rate = { value: hr, confidence: 0.95, sourceText: hrMatch[0].trim() };
    }
  }

  // Temperature: e.g. "Temp: 38.4 C", "Temperature = 38.6", "T: 38.4"
  const tempMatch = text.match(/(?:temp(?:erature)?|t)[:\s=]*([0-9]{2}(?:\.[0-9]{1,2})?)\s*(?:Â°?C|deg\s*C)?/i);
  if (tempMatch) {
    let t = parseFloat(tempMatch[1]);
    // check if Fahrenheit e.g. 101.2 F
    if (t > 90 && t < 108) {
      t = parseFloat(((t - 32) * 5 / 9).toFixed(1));
    }
    if (t >= 32 && t <= 44) {
      extracted.temperature = { value: t, confidence: 0.92, sourceText: tempMatch[0].trim() };
    }
  }

  // Blood Pressure: e.g. "BP: 88/54", "Blood Pressure: 95/60 mmHg"
  const bpMatch = text.match(/(?:blood\s*pressure|bp|nibb)[:\s]*([0-9]{2,3})\s*[\/|\\]\s*([0-9]{2,3})/i);
  if (bpMatch) {
    const sbp = parseFloat(bpMatch[1]);
    const dbp = parseFloat(bpMatch[2]);
    if (sbp >= 40 && sbp <= 260) {
      extracted.systolic_bp = { value: sbp, confidence: 0.95, sourceText: bpMatch[0].trim() };
    }
    if (dbp >= 20 && dbp <= 160) {
      extracted.diastolic_bp = { value: dbp, confidence: 0.95, sourceText: bpMatch[0].trim() };
    }
  } else {
    const sbpOnly = text.match(/(?:systolic|sbp)[:\s]*([0-9]{2,3})/i);
    if (sbpOnly) {
      const sbp = parseFloat(sbpOnly[1]);
      if (sbp >= 40 && sbp <= 260) {
        extracted.systolic_bp = { value: sbp, confidence: 0.85, sourceText: sbpOnly[0].trim() };
      }
    }
  }

  // Respiratory Rate: e.g. "RR: 26", "Resp Rate: 26 /min", "Respiratory: 24 bpm"
  const rrMatch = text.match(/(?:respiratory\s*rate|resp\s*rate|rr|respirations)[:\s]*([0-9]{1,2})\s*(?:breaths\/min|\/min)?/i);
  if (rrMatch) {
    const rr = parseFloat(rrMatch[1]);
    if (rr >= 4 && rr <= 70) {
      extracted.respiratory_rate = { value: rr, confidence: 0.92, sourceText: rrMatch[0].trim() };
    }
  }

  // Lactate: e.g. "Lactate: 2.8 mmol/L", "Serum Lactate = 2.45"
  const lacMatch = text.match(/(?:serum\s*)?lactate[:\s=]*([0-9]{1,2}(?:\.[0-9]{1,3})?)\s*(?:mmol\/l)?/i);
  if (lacMatch) {
    const lac = parseFloat(lacMatch[1]);
    if (lac >= 0.2 && lac <= 30) {
      extracted.lactate = { value: lac, confidence: 0.96, sourceText: lacMatch[0].trim() };
    }
  }

  // Creatinine: e.g. "Creatinine: 1.4 mg/dL", "Cr: 1.72"
  const crMatch = text.match(/(?:serum\s*)?creat(?:inine)?(?:\s*\(cr\))?[:\s=]*([0-9]{1,2}(?:\.[0-9]{1,3})?)\s*(?:mg\/dl)?/i);
  if (crMatch) {
    const cr = parseFloat(crMatch[1]);
    if (cr >= 0.2 && cr <= 25) {
      extracted.creatinine = { value: cr, confidence: 0.96, sourceText: crMatch[0].trim() };
    }
  }

  // SpO2: e.g. "SpO2: 94%", "O2 Sat: 94"
  const spo2Match = text.match(/(?:spo2|o2\s*sat(?:uration)?)[:\s]*([0-9]{2,3})\s*%?/i);
  if (spo2Match) {
    const spo2 = parseFloat(spo2Match[1]);
    if (spo2 >= 50 && spo2 <= 100) {
      extracted.spo2 = { value: spo2, confidence: 0.94, sourceText: spo2Match[0].trim() };
    }
  }

  // WBC: e.g. "WBC: 12.5", "White Blood Cells: 14.2"
  const wbcMatch = text.match(/(?:wbc|white\s*blood\s*cells?)[:\s]*([0-9]{1,2}(?:\.[0-9]{1,2})?)/i);
  if (wbcMatch) {
    const wbc = parseFloat(wbcMatch[1]);
    if (wbc >= 0.5 && wbc <= 100) {
      extracted.wbc = { value: wbc, confidence: 0.92, sourceText: wbcMatch[0].trim() };
    }
  }

  return extracted;
}

/**
 * POST /api/extract-record
 * Parses uploaded hospital documents, lab reports, CSVs, nursing notes, or images.
 */
app.post('/api/extract-record', async (req: Request, res: Response) => {
  try {
    const { fileName, fileContent, fileType, isBase64, imageBase64 } = req.body;

    let textContent = '';
    if (typeof fileContent === 'string') {
      if (isBase64) {
        try {
          const buffer = Buffer.from(fileContent, 'base64');
          textContent = buffer.toString('utf-8');
        } catch {
          textContent = fileContent;
        }
      } else {
        textContent = fileContent;
      }
    }

    let extracted: Record<string, any> = {};

    // If Gemini is available and an image or complex unstructured report was provided
    if (geminiAI && (imageBase64 || (textContent && textContent.length > 30))) {
      try {
        const prompt = `You are a specialized clinical data extraction system for hospital records.
Extract the patient vitals and lab numbers from the provided document or text:
- age: Integer in years (e.g. 64)
- blood_group: String, one of "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
- temperature: Float in Celsius (Â°C)
- heart_rate: Float/Integer in bpm
- respiratory_rate: Float/Integer in breaths/min
- systolic_bp: Float/Integer in mmHg
- diastolic_bp: Float/Integer in mmHg
- lactate: Float in mmol/L
- creatinine: Float in mg/dL
- spo2: Float/Integer in %
- wbc: Float in 10^9/L

CRITICAL RULES:
1. Convert numerical values into proper numeric data types: Integer for Age, Float/Double for decimal clinical values.
2. Only return values you can identify with high confidence. Do not guess or hallucinate.
3. If an uploaded value cannot be confidently extracted, leave it null.
Return STRICT JSON ONLY with format:
{
  "age": number | null,
  "blood_group": string | null,
  "temperature": number | null,
  "heart_rate": number | null,
  "respiratory_rate": number | null,
  "systolic_bp": number | null,
  "diastolic_bp": number | null,
  "lactate": number | null,
  "creatinine": number | null,
  "spo2": number | null,
  "wbc": number | null,
  "summary": "Brief 1-sentence description of the patient record"
}`;

        const contents: any[] = [];
        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
          contents.push({
            inlineData: {
              data: cleanBase64,
              mimeType: fileType && fileType.startsWith('image/') ? fileType : 'image/jpeg'
            }
          });
        }
        if (textContent) {
          contents.push({ text: `Document content:\n${textContent.slice(0, 8000)}` });
        }
        contents.push({ text: prompt });

        const response = await geminiAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents
        });

        const reply = response.text || '';
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          for (const [k, v] of Object.entries(parsed)) {
            if (v !== null && v !== undefined && k !== 'summary') {
              extracted[k] = {
                value: k === 'age' ? Math.round(Number(v)) : (typeof v === 'number' ? Number(v) : v),
                confidence: 0.96,
                sourceText: `Extracted via AI from ${fileName || 'uploaded document'}`
              };
            }
          }
          if (parsed.summary) {
            extracted._summary = parsed.summary;
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini extraction failed, falling back to deterministic regex parser:', geminiErr);
      }
    }

    // Combine or fallback with deterministic regex parser
    const regexResults = extractWithRegex(textContent);
    for (const [key, resItem] of Object.entries(regexResults)) {
      if (!extracted[key]) {
        extracted[key] = resItem;
      }
    }

    const unidentifiableFields: string[] = [];
    const coreFields = ['temperature', 'heart_rate', 'respiratory_rate', 'systolic_bp', 'lactate', 'creatinine'];
    for (const f of coreFields) {
      if (!extracted[f]) {
        unidentifiableFields.push(f);
      }
    }

    return res.json({
      success: true,
      fileName: fileName || 'uploaded_document',
      fileType: fileType || 'text/plain',
      extracted,
      unidentifiableFields,
      message: Object.keys(extracted).length > 0
        ? 'Record uploaded and processed successfully.'
        : 'Record uploaded, but unable to identify clinical values automatically. Please enter values manually.'
    });
  } catch (err: any) {
    console.error('Error in /api/extract-record:', err);
    return res.status(500).json({ error: 'Failed to process hospital record.' });
  }
});

/**
 * POST /api/chat
 * Medical conversational assistant for explaining sepsis parameters, answering queries,
 * interpreting clinical factors or protocol guidance.
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, patientData } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // If Gemini is available
    if (geminiAI) {
      try {
        const systemPrompt = `You are SepsisSense, a professional medical decision-support AI assistant.
Answer clinical and sepsis inquiries clearly, succinctly, and with authoritative medical rigor (referencing Sepsis-3 guidelines, qSOFA, SIRS, and Surviving Sepsis Campaign 1-Hour Bundles).
Context of current patient: ${JSON.stringify(patientData || {})}
Always remind the clinician that SepsisSense provides clinical decision support and does not replace in-person medical diagnosis or laboratory testing. Keep answers concise (under 150 words) unless detailed explanation is requested.`;

        const response = await geminiAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { text: systemPrompt },
            { text: prompt }
          ]
        });

        return res.json({ reply: response.text || 'Unable to generate clinical explanation.' });
      } catch (geminiErr: any) {
        console.warn('Gemini chat error:', geminiErr);
      }
    }

    // Fallback medical explanations if Gemini is not configured
    const lowerPrompt = prompt.toLowerCase();
    let reply = '';
    if (lowerPrompt.includes('lactate')) {
      reply = 'Serum lactate is a surrogate marker for tissue hypoperfusion and anaerobic metabolism. In sepsis, values > 2.0 mmol/L indicate metabolic distress and microvascular dysfunction, while values â‰¥ 4.0 mmol/L are associated with severe septic shock and high mortality, requiring emergent 30 mL/kg fluid resuscitation.';
    } else if (lowerPrompt.includes('qsofa') || lowerPrompt.includes('score')) {
      reply = 'Quick SOFA (qSOFA) identifies adult patients with suspected infection at high risk of poor ICU outcomes. Criteria: 1) Respiratory rate â‰¥ 22 breaths/min; 2) Altered mentation (GCS < 15); 3) Systolic BP â‰¤ 100 mmHg. A score â‰¥ 2 triggers urgent sepsis evaluation.';
    } else if (lowerPrompt.includes('bundle') || lowerPrompt.includes('treatment') || lowerPrompt.includes('action')) {
      reply = 'The Surviving Sepsis Campaign (SSC) 1-Hour Bundle recommends: 1) Measure blood lactate (re-measure within 2-4h if > 2.0); 2) Obtain blood cultures before starting antibiotics; 3) Administer broad-spectrum IV antimicrobials; 4) Administer 30 mL/kg crystalloid for hypotension (MAP < 65) or lactate â‰¥ 4.0; 5) Apply vasopressors if MAP < 65 persists.';
    } else if (lowerPrompt.includes('predict') || lowerPrompt.includes('risk')) {
      reply = 'To evaluate sepsis risk, click the "Analyze Sepsis Risk" button. SepsisSense synthesizes vital signs (heart rate, temperature, BP, respiratory rate) and laboratory markers (lactate, creatinine, WBC) to generate risk stratification.';
    } else {
      reply = 'SepsisSense provides real-time sepsis risk stratification and clinical guidance based on international consensus guidelines. Enter patient clinical values or upload laboratory charts to generate an assessment.';
    }

    return res.json({ reply });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return res.status(500).json({ error: 'Failed to process clinical inquiry.' });
  }
});

// Mount Vite or serve static files
async function startServer() {
  const distDir = path.resolve(ROOT_DIR, 'dist');
  const isProd = process.env.NODE_ENV === 'production' || !process.env.npm_lifecycle_event?.includes('dev');

  if (fs.existsSync(distDir) && isProd) {
    console.log('Serving production static build from:', distDir);
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/predict') return next();
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    console.log('Mounting Vite dev server middleware from root:', ROOT_DIR);
    const vite = await createViteServer({
      root: ROOT_DIR,
      configFile: path.resolve(ROOT_DIR, 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`?? SepsisSense server listening on http://0.0.0.0:${PORT}`);
    console.log(`?? Open in browser: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
    
    // Auto-open default browser when server is ready
    if (process.platform === 'win32' && !process.env.NO_OPEN) {
      import('child_process').then(({ exec }) => {
        exec(`start http://localhost:${PORT}`);
      }).catch(() => {});
    }
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`\n======================================================`);
      console.log(`??  Port ${PORT} is already running an active SepsisSense server!`);
      console.log(`?? Opening active website in your browser: http://localhost:${PORT}`);
      console.log(`======================================================\n`);
      if (process.platform === 'win32') {
        import('child_process').then(({ exec }) => {
          exec(`start http://localhost:${PORT}`);
        }).catch(() => {});
      }
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
