"""STEP 4 - Explainable AI + suggested actions + case-study plot (sections 5 & 6).
Usage: python 04_explain_and_actions.py --tag core --mode septic        (good catch)
       python 04_explain_and_actions.py --tag core --mode false_alarm   (honest failure case)
       python 04_explain_and_actions.py --tag core --mode missed        (honest failure case)
       python 04_explain_and_actions.py --tag with_notes --mode septic  (shows note-based reasons)"""
import argparse, json, re
import numpy as np, pandas as pd, lightgbm as lgb
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from common import *
from recommendations import load_protocols, build_recommendations, format_card, source_from_row

ap = argparse.ArgumentParser()
ap.add_argument('--tag', default='core'); ap.add_argument('--mode', default='septic')
ap.add_argument('--patient', default=None)
args = ap.parse_args()

cfg = json.load(open(f"{WORK}/{args.tag}_config.json"))
model = lgb.Booster(model_file=f"{WORK}/{args.tag}_model.txt")
preds = pd.read_parquet(f"{WORK}/{args.tag}_test_preds.parquet")
import os
from alert_policy import simulate
_pj = os.path.join(WORK, 'alert_policy.json')
_pol = json.load(open(_pj)) if os.path.exists(_pj) else None
if _pol and _pol.get('tag') == args.tag:          # tuned policy from 07_tune_alerts.py
    preds['alert'] = simulate(preds, **_pol['policy'])
else:
    preds['alert'] = simulate_alerts(preds, consec=cfg['consec'], cooldown=cfg['cooldown'])
V2 = args.tag.startswith('v2')
feat = load_features(with_notes=not V2, version='v2' if V2 else 'v1')

SOURCE = {'note_cough_12h': 'Lungs (respiratory)', 'note_urinary_12h': 'Urinary tract',
          'note_wound_redness_12h': 'Wound / skin', 'note_catheter_line_12h': 'Line / catheter'}
NICE = {'sirs': 'SIRS criteria count is high', 'qsofa_proxy': 'qSOFA criteria met', 'qsofa_full': 'qSOFA (incl. confusion) met',
        'shock_index': 'Shock index (HR/SBP) is high', 'sofa_proxy': 'Organ-dysfunction (SOFA-proxy) score is high',
        'note_confusion_12h': 'Nursing notes mention confusion', 'note_cough_12h': 'Nursing notes mention cough/sputum',
        'note_chills_12h': 'Nursing notes mention chills/rigors', 'note_urinary_12h': 'Nursing notes mention urinary symptoms',
        'note_wound_redness_12h': 'Nursing notes mention wound redness', 'note_catheter_line_12h': 'Nursing notes mention line/catheter issue',
        'note_count_12h': 'Several symptoms in nursing notes', 'ICULOS': 'Time in ICU', 'HospAdmTime': 'Time from hospital admission'}


def phrase(f, row):
    v = row[f]
    if f in NICE: return NICE[f]
    m = re.match(r'(.+)_d(\d+)$', f)
    if m: return f"{m[1]} changed by {v:+.1f} over {m[2]}h (now {row[m[1]]:.1f})"
    m = re.match(r'(.+)_(mean|max|min|std)(\d+)$', f)
    if m: return f"{m[1]} {dict(mean='averaging', max='peaked at', min='dipped to', std='varying (std)')[m[2]]} {v:.1f} in last {m[3]}h"
    m = re.match(r'(.+)_vs_baseline$', f)
    if m: return f"{m[1]} is {v:+.1f} vs. first value in stay"
    m = re.match(r'(.+)_hrs_since$', f)
    if m: return f"{m[1]} last measured {v:.0f}h ago"
    m = re.match(r'(.+)_nmeas$', f)
    if m: return f"{m[1]} has been measured {v:.0f} times"
    if f in row.index and f.split('_')[0] in VITALS + LABS: return f"{f} = {v:.1f}"
    return f"{f} = {v:.2f}"


def suggest(row, band_, map_low_hours):
    out = []
    lac, lac_age = row['Lactate'], row['Lactate_hrs_since']
    if np.isnan(lac) or (not np.isnan(lac_age) and lac_age > 6):
        if band_ != 'Low': out.append("Consider checking / repeating lactate (missing or stale).")
    if not np.isnan(lac) and lac >= 2: out.append(f"Lactate {lac:.1f} is elevated - consider repeating within 2-4 h.")
    if band_ == 'High' or (band_ == 'Watch' and row['sirs'] >= 2):
        out.append("Consider blood cultures (before antibiotics, if no delay).")
    if band_ == 'High': out.append("Consider broad-spectrum antibiotics - follow local protocol.")
    if (not np.isnan(row['MAP']) and row['MAP'] < 65) or (not np.isnan(lac) and lac >= 4):
        out.append("Consider fluid resuscitation per clinical assessment.")
    if map_low_hours >= 2: out.append("MAP still low - consider ICU / vasopressor review.")
    if not out: out.append("No specific action suggested; continue routine monitoring.")
    return out


def pick(mode):
    c = []
    for p, g in preds.groupby('patient', sort=False):
        n = len(g)
        if n < 30: continue
        y = g.label.values; a = np.where(g.alert.values)[0]
        if y.any():
            ts = int(np.argmax(y)) + 6
            early = [i for i in a if ts - 12 <= i < ts]
            if mode == 'septic' and early: c.append((abs((ts - early[0]) - 6), p, early[0]))
            if mode == 'missed' and not any(ts - 12 <= i <= ts + 3 for i in a): c.append((0, p, min(max(ts - 3, 0), n - 1)))
        elif mode == 'false_alarm' and len(a): c.append((0, p, int(a[0])))
    c.sort()
    return c[0] if c else None


if args.patient:
    pid = args.patient; idx = int(preds[preds.patient == pid].alert.values.argmax())
else:
    sel = pick(args.mode)
    if not sel: raise SystemExit(f"No patient found for mode '{args.mode}'")
    _, pid, idx = sel
g = feat[feat.patient == pid].reset_index(drop=True)
pg = preds[preds.patient == pid].reset_index(drop=True)
row = g.loc[idx]; sc = pg.score[idx]; bd = band(sc)
ts = int(np.argmax(g.label.values)) + 6 if g.label.any() else None

print(f"\n{'=' * 70}\nPATIENT {pid} | mode={args.mode} | age {row.Age:.0f} | true sepsis onset: "
      f"{'hour ' + str(ts) if ts is not None else 'NEVER (non-septic)'}\n{'=' * 70}")
print("Hour | Score | Band  | HR   Temp  MAP  Lactate | Alert")
for i in range(max(0, idx - 12), min(len(g), idx + 4)):
    r = g.loc[i]
    print(f"{i:4d} | {pg.score[i]:5.0f} | {band(pg.score[i]):5s} | {r.HR:4.0f} {r.Temp:5.1f} {r.MAP:4.0f} {r.Lactate:6.1f}  | {'ALERT' if pg.alert[i] else ''}")

print(f"\nWHY (hour {idx}, risk {sc:.0f} = {bd}):")
contrib = model.predict(g.loc[[idx], cfg['features']], pred_contrib=True)[0][:-1]   # TreeSHAP values (log-odds)
for j in np.argsort(-contrib)[:5]:
    if contrib[j] > 0: print(f"  +{contrib[j]:.2f}  {phrase(cfg['features'][j], row)}")
srcs = [(row[c], n) for c, n in SOURCE.items() if c in row.index and row[c] > 0]
print("Possible infection source (from notes):", srcs[0][1] if srcs else "not indicated in notes")

low = 0
for m in g.MAP.values[:idx + 1][::-1]:
    if m < 65: low += 1
    else: break
proto = load_protocols()
rec = build_recommendations(row, bd, source_from_row(row), low, proto)
print("\n" + "=" * 70 + "\nDOCTOR RECOMMENDATION CARD (decision support, not orders)\n" + "=" * 70)
print(format_card(rec, proto))
print("\n[Clinician makes the final decision: Accept / Dismiss]")

fig, ax = plt.subplots(figsize=(9, 4))
ax.plot(pg.ICULOS, pg.score, lw=2, label='Risk score')
ax.axhspan(0, 40, color='green', alpha=.08); ax.axhspan(40, 70, color='orange', alpha=.1); ax.axhspan(70, 100, color='red', alpha=.1)
al = pg[pg.alert]; ax.scatter(al.ICULOS, al.score, marker='v', color='k', zorder=5, label='Alert fired')
if ts is not None: ax.axvline(g.ICULOS[min(ts, len(g) - 1)], color='r', ls='--', label='Sepsis onset')
ax.set_ylim(0, 100); ax.set_xlabel('ICU hour'); ax.set_ylabel('Risk score (0-100)'); ax.set_title(f'{pid} ({args.mode})'); ax.legend()
fig.tight_layout(); fig.savefig(f"{WORK}/case_{args.mode}_{pid}.png", dpi=150)
print(f"Plot saved: {WORK}/case_{args.mode}_{pid}.png")