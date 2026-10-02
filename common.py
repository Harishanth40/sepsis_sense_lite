"""Shared config + helpers for SepsisSense Lite. EDIT DATA_DIRS to point at your PhysioNet folders."""
import os
import numpy as np
import pandas as pd

DATA_DIRS = {
    "A": "C:/Users/hari4/OneDrive/Desktop/SEPSIS AI/training_setA/training_setA",
    "B": "C:/Users/hari4/OneDrive/Desktop/SEPSIS AI/training_setB/training_setB"
}  # <-- EDIT THIS
WORK = "work"
os.makedirs(WORK, exist_ok=True)

VITALS = ['HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'DBP', 'Resp']
LABS = ['Lactate', 'WBC', 'Creatinine', 'Bilirubin_total', 'Platelets', 'BUN', 'Glucose',
        'pH', 'PaCO2', 'HCO3', 'BaseExcess', 'FiO2', 'Hgb', 'Potassium']
LABS_EXTRA = ['EtCO2', 'SaO2', 'AST', 'Alkalinephos', 'Calcium', 'Chloride', 'Bilirubin_direct',
              'Magnesium', 'Phosphate', 'TroponinI', 'Hct', 'PTT', 'Fibrinogen']   # used only by v2 features
TREND_LABS = ['Lactate', 'WBC', 'Creatinine', 'Bilirubin_total', 'Platelets']
NOTE_KEYS = ['confusion', 'cough', 'chills', 'urinary', 'wound_redness', 'catheter_line']
NOTE_COLS = [f'note_{k}_12h' for k in NOTE_KEYS] + ['note_count_12h']
NON_FEATURES = ['patient', 'hosp', 'label']


# ---------- loading ----------
def load_features(with_notes=True, version='v1'):
    df = pd.read_parquet(f"{WORK}/features.parquet" if version == 'v1' else f"{WORK}/features_v2.parquet")
    p = f"{WORK}/notes_features.parquet"
    if with_notes and os.path.exists(p):
        notes = pd.read_parquet(p)
        df = df.merge(notes, on=['patient', 'ICULOS'], how='left')
        df[NOTE_COLS] = df[NOTE_COLS].fillna(0).astype('float32')
        df['qsofa_full'] = df['qsofa_proxy'] + (df['note_confusion_12h'] > 0)  # adds mental status
    return df


# ---------- official PhysioNet 2019 utility (vectorised form) ----------
def patient_utilities(labels):
    """Per-hour utility if we predict POSITIVE (u_pos) or NEGATIVE (u_neg) for one patient."""
    n = len(labels)
    if not labels.any():
        return np.full(n, -0.05), np.zeros(n)
    t_s = int(np.argmax(labels)) + 6          # label turns 1 six hours before true onset
    d = np.arange(n) - t_s
    u_pos = np.where(d < -12, -0.05, np.where(d <= -6, (d + 12) / 6, np.where(d <= 3, (3 - d) / 9, 0.0)))
    u_neg = np.where(d <= -6, 0.0, np.where(d <= 3, -2 / 9 * (d + 6), 0.0))
    return u_pos, u_neg


def row_utilities(df):
    up, un = np.empty(len(df)), np.empty(len(df))
    lab = df['label'].values
    s = 0
    for L in df.groupby('patient', sort=False).size().values:
        up[s:s + L], un[s:s + L] = patient_utilities(lab[s:s + L])
        s += L
    return up, un


def normalized_utility(pred_pos, up, un):
    obs = np.where(pred_pos, up, un).sum()
    inaction = un.sum()
    best = np.maximum(up, un).sum()
    return float((obs - inaction) / (best - inaction))


# ---------- risk score 0-100 : Low 0-40, Watch 40-70, High 70+ ----------
def risk_score(p, t_watch, t_high):
    """Monotonic mapping of calibrated probability -> 0-100 so that
    t_watch -> 40 and t_high -> 70 (sepsis is rare, so raw 40%/70% probabilities would almost never occur)."""
    return np.interp(p, [0, t_watch, t_high, 1.0], [0, 40, 70, 100])


def band(score):
    return "High" if score >= 70 else ("Watch" if score >= 40 else "Low")


# ---------- alert logic (section 3) ----------
def alerts_for_patient(score, lactate, map_, sbp, high=70, consec=2, cooldown=6, immediate=True):
    n = len(score)
    alerts = np.zeros(n, bool)
    last, run = -10 ** 9, 0
    for i in range(n):
        run = run + 1 if score[i] >= high else 0
        critical = immediate and ((lactate[i] >= 4) or (map_[i] < 65) or (sbp[i] < 90))
        if (run >= consec or critical) and (i - last) > cooldown:
            alerts[i] = True
            last = i
    return alerts


def simulate_alerts(df, immediate=True, consec=2, cooldown=6):
    """df needs: patient, score, Lactate, MAP, SBP (sorted by patient, ICULOS)."""
    alert = np.zeros(len(df), bool)
    sc, lac, mp, sb = (df[c].values for c in ['score', 'Lactate', 'MAP', 'SBP'])
    s = 0
    with np.errstate(invalid='ignore'):
        for L in df.groupby('patient', sort=False).size().values:
            alert[s:s + L] = alerts_for_patient(sc[s:s + L], lac[s:s + L], mp[s:s + L], sb[s:s + L],
                                                consec=consec, cooldown=cooldown, immediate=immediate)
            s += L
    return alert


def alert_report(df, alert):
    lab = df['label'].values
    leads, early, detected, n_sep = [], 0, 0, 0
    fa_pat, n_non = 0, 0
    s = 0
    for L in df.groupby('patient', sort=False).size().values:
        a = np.where(alert[s:s + L])[0]
        y = lab[s:s + L]
        if y.any():
            n_sep += 1
            ts = int(np.argmax(y)) + 6
            pre = [i for i in a if ts - 12 <= i < ts]
            if pre:
                early += 1; detected += 1; leads.append(ts - pre[0])
            elif any(ts <= i <= ts + 3 for i in a):
                detected += 1
        else:
            n_non += 1
            fa_pat += int(len(a) > 0)
        s += L
    return {
        "septic_patients": n_sep,
        "pct_septic_alerted_1to12h_before_onset": round(100 * early / max(n_sep, 1), 1),
        "pct_septic_alerted_incl_late": round(100 * detected / max(n_sep, 1), 1),
        "median_lead_time_hours": float(np.median(leads)) if leads else None,
        "pct_nonseptic_patients_with_any_alert": round(100 * fa_pat / max(n_non, 1), 1),
        "alerts_per_100_patient_days": round(alert.sum() / (len(df) / 24) * 100, 1),
    }
