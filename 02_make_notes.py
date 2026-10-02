"""STEP 2 - Nursing notes + NLP (section 4).
PhysioNet 2019 has NO notes, so we (a) generate SYNTHETIC notes from the patient's vitals state
(NOT from the sepsis label - that would be leakage) and (b) run a negation-aware extractor on them.
Replace make_note() with real notes (e.g. MIMIC) later; the extractor stays the same."""
import re
import numpy as np, pandas as pd
from common import *

rng = np.random.default_rng(7)

# ------------------------- NLP extractor (negation aware) -------------------------
NEG = re.compile(r"\b(no|denies|denied|without|negative for|not|free of|resolved|absent)\b")
CLAUSE = re.compile(r"[.;,]| but ")
TERMS = {
    'confusion': ['confus', 'disorient', 'altered mental', 'not oriented'],
    'cough': ['cough', 'sputum', 'short of breath', 'dyspnea'],
    'chills': ['chills', 'rigor', 'shiver'],
    'urinary': ['dysuria', 'cloudy urine', 'foul urine', 'burning urination'],
    'wound_redness': ['wound redness', 'erythema', 'red wound', 'purulent', 'wound discharge'],
    'catheter_line': ['catheter site', 'line site', 'foley', 'central line', 'picc'],
}
SOURCE_OF = {'cough': 'Lungs (respiratory)', 'urinary': 'Urinary tract', 'wound_redness': 'Wound / skin',
             'catheter_line': 'Line / catheter'}


def extract(note):
    found = dict.fromkeys(TERMS, 0)
    for clause in CLAUSE.split(note.lower()):
        for k, words in TERMS.items():
            for w in words:
                pos = clause.find(w)
                if pos >= 0 and not NEG.search(clause[:pos]):   # "No confusion" is NOT counted
                    found[k] = 1
    return found


# ------------------------- synthetic note generator -------------------------
def make_note(r, source):
    parts = []
    if r.Temp > 38: parts.append(rng.choice(["Pt febrile", "Spiked a temp overnight", "Feels warm to touch"]))
    if r.HR > 100: parts.append(rng.choice(["tachycardic on monitor", "HR running high"]))
    if r.Resp > 22: parts.append(rng.choice(["breathing fast", "increased work of breathing"]))
    if r.SBP < 100: parts.append("BP soft, MD aware")
    stressed = (r.MAP < 65) or (r.Resp > 22)
    if rng.random() < 0.04 + (0.15 if stressed else 0):
        parts.append(rng.choice(["Patient appears confused and restless", "New confusion, disoriented to time"]))
    elif rng.random() < 0.25:
        parts.append(rng.choice(["No confusion noted", "Alert and oriented x3, denies confusion"]))
    if source == 'lung' and rng.random() < 0.6:
        parts.append(rng.choice(["Productive cough, yellow sputum", "Increased cough overnight", "Chills reported"]))
    if source == 'urine' and rng.random() < 0.6:
        parts.append(rng.choice(["Foley draining cloudy urine", "Complains of burning urination"]))
    if source == 'wound' and rng.random() < 0.6:
        parts.append(rng.choice(["Wound redness and purulent discharge at incision", "Erythema around wound edges"]))
    if source == 'line' and rng.random() < 0.6:
        parts.append(rng.choice(["Central line site tender and red", "Rigors after line flush"]))
    if not parts or rng.random() < 0.3:
        parts.append(rng.choice(["Resting comfortably", "No cough, no chills", "Wound clean and dry", "Tolerating feeds"]))
    return ". ".join(parts) + "."


if __name__ == "__main__":
    # tiny unit test of negation handling
    assert extract("No confusion noted")['confusion'] == 0
    assert extract("Patient appears confused")['confusion'] == 1
    assert extract("Alert and oriented x3, denies confusion")['confusion'] == 0
    print("negation tests passed")

    df = pd.read_parquet(f"{WORK}/features.parquet", columns=['patient', 'ICULOS', 'Temp', 'HR', 'Resp', 'SBP', 'MAP'])
    pats = df.patient.unique()
    src = dict(zip(pats, rng.choice(['none', 'lung', 'urine', 'wound', 'line'], size=len(pats),
                                    p=[.6, .15, .12, .08, .05])))        # independent of sepsis label
    sel = df[df.ICULOS % 4 == 0]                                           # one note every 4 hours
    records, examples = [], []
    for r in sel.itertuples(index=False):
        note = make_note(r, src[r.patient])
        flags = extract(note)
        records.append((r.patient, r.ICULOS, *[flags[k] for k in NOTE_KEYS]))
        if len(examples) < 60: examples.append((r.patient, r.ICULOS, note, *[flags[k] for k in NOTE_KEYS]))
    rows = pd.DataFrame(records, columns=['patient', 'ICULOS'] + NOTE_KEYS)
    full = df[['patient', 'ICULOS']].merge(rows, how='left', on=['patient', 'ICULOS']).fillna(0)
    roll = (full.groupby('patient', sort=False)[NOTE_KEYS].rolling(12, min_periods=1).max()
            .reset_index(level=0, drop=True).sort_index())                 # symptom seen in last 12h
    roll.columns = [f'note_{k}_12h' for k in NOTE_KEYS]
    roll['note_count_12h'] = roll.sum(axis=1)
    out = pd.concat([full[['patient', 'ICULOS']], roll], axis=1)
    out.to_parquet(f"{WORK}/notes_features.parquet")
    pd.DataFrame(examples, columns=['patient', 'ICULOS', 'note'] + NOTE_KEYS).to_csv(f"{WORK}/notes_examples.csv", index=False)
    print("Saved notes features:", out.shape, "| examples -> work/notes_examples.csv")
