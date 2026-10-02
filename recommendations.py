"""Builds the doctor-facing recommendation card from risk band + patient state + protocols.json."""
import json, os
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
NOTE_TO_SOURCE = {'note_cough_12h': 'respiratory', 'note_urinary_12h': 'urosepsis',
                  'note_wound_redness_12h': 'skin', 'note_catheter_line_12h': 'bloodstream'}


def load_protocols(path=None):
    return json.load(open(path or os.path.join(HERE, "protocols.json"), encoding="utf-8"))


def source_from_row(row):
    return next((k for c, k in NOTE_TO_SOURCE.items() if c in row.index and row[c] > 0), None)


def organ_pattern_hints(row):
    """WEAK hints from lab patterns (v2 features). They point to organ involvement, NOT a source diagnosis."""
    g = lambda c: 0 if (c not in row.index or pd.isna(row[c])) else row[c]
    h = []
    if g('pat_resp') >= 2: h.append("Respiratory pattern (low oxygenation / fast breathing): consider chest assessment.")
    if g('pat_hepatobiliary') >= 2: h.append("Liver / bile lab pattern: consider an abdominal or biliary source.")
    if g('pat_renal') >= 2: h.append("Kidney involvement: review urine output; consider urinary tract source or obstruction.")
    if g('pat_coag') >= 2: h.append("Clotting / platelet pattern: consider bloodstream infection; discuss with the senior team.")
    return h


def build_recommendations(row, band, source_key, map_low_hours, proto):
    b = proto['hour1_bundle']
    lac, lac_age = row['Lactate'], row.get('Lactate_hrs_since', np.nan)
    mapv, sbp = row['MAP'], row['SBP']
    lactate_missing = np.isnan(lac) or (not np.isnan(lac_age) and lac_age > 6)
    hypoperf = (not np.isnan(mapv) and mapv < 65) or (not np.isnan(lac) and lac >= 4)
    shock_like = hypoperf or (map_low_hours >= 2)
    rec = {'immediate': [], 'source': {}, 'hints': [], 'monitoring': [], 'prevention': [], 'data_flags': []}
    if band != 'Low': rec['hints'] = organ_pattern_hints(row)

    # ---- 1. immediate actions, depends on risk band ----
    if band == 'Low':
        rec['immediate'].append("No sepsis-specific action suggested. Continue routine monitoring.")
    else:
        if lactate_missing or (not np.isnan(lac) and lac > 2): rec['immediate'].append(b['lactate'])
        if band == 'Watch':
            rec['immediate'].append("Bedside review for infection source and organ dysfunction; re-score in 1-2 hours.")
            rec['immediate'].append("If infection is suspected: " + b['cultures'])
            if hypoperf: rec['immediate'].append(b['perfusion_review'])
        else:  # High
            rec['immediate'].append(b['cultures'])
            rec['immediate'].append(b['treatment_review'])
            if hypoperf: rec['immediate'].append(b['perfusion_review'])
            if map_low_hours >= 2: rec['immediate'].append(b['escalation'])
            rec['immediate'].append(b['source_control'])

    # ---- 2. source-directed (only when not Low) ----
    if band != 'Low':
        if source_key and source_key in proto['source_specific']:
            s = proto['source_specific'][source_key]
            rec['source'] = {'title': f"Likely source (from notes, prototype): {s['label']}", **{k: s.get(k, []) for k in ('workup', 'source_control', 'red_flags')}}
        else:
            u = proto['unknown_source']
            rec['source'] = {'title': "Source not identified from notes", 'workup': u['workup'], 'source_control': [], 'red_flags': []}
        rec['monitoring'] = list(proto['reassessment'])

    # ---- 3. prevention for this patient ----
    pp = proto['prevention_patient_level']
    rec['prevention'] = list(pp['general']) + (list(pp.get(source_key, [])) if source_key else [])

    # ---- 4. data gaps that change the regimen ----
    rec['data_flags'].append("Weight, allergies and culture history are NOT in this dataset - the treating doctor must check them before any treatment decision.")
    cr, plt = row.get('Creatinine', np.nan), row.get('Platelets', np.nan)
    if not np.isnan(cr) and cr >= 1.5: rec['data_flags'].append(f"Creatinine {cr:.1f}: possible kidney impairment - flag to the treating team.")
    if not np.isnan(plt) and plt < 100: rec['data_flags'].append(f"Platelets {plt:.0f}: low - consider before invasive procedures.")
    return rec


def format_card(rec, proto):
    L = []
    def sec(t, items):
        if items:
            L.append(f"\n{t}")
            L.extend(f"  - {i}" for i in items)
    sec("A. IMMEDIATE ACTIONS TO CONSIDER", rec['immediate'])
    if rec['source']:
        s = rec['source']; L.append(f"\nB. {s['title']}")
        for k, name in (('red_flags', 'RED FLAGS'), ('workup', 'Work-up / investigations'), ('source_control', 'Source control')):
            if s[k]:
                L.append(f"  {name}:"); L.extend(f"    - {i}" for i in s[k])
    sec("B2. LAB-PATTERN HINTS (weak - organ involvement, NOT a source diagnosis)", rec.get('hints', []))
    sec("C. MONITORING / REASSESSMENT", rec['monitoring'])
    sec("D. PREVENTION FOR THIS PATIENT", rec['prevention'])
    sec("E. DATA GAPS THAT AFFECT TREATMENT", rec['data_flags'])
    L.append(f"\n{proto['disclaimer']}")
    return "\n".join(L)
