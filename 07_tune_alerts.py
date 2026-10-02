"""STEP 7 - Tune the alert policy to cut alert fatigue WITHOUT peeking at the data we report on.
Held-out patients are split 50/50: policy is CHOSEN on the 'tune' half and REPORTED on the 'final' half.
Usage: python 07_tune_alerts.py --tag v2_nobeh_core [--min-early 80]"""
import sys, json, itertools
import numpy as np, pandas as pd
from sklearn.model_selection import train_test_split
from common import WORK, alert_report
from alert_policy import simulate

tag = sys.argv[sys.argv.index('--tag') + 1] if '--tag' in sys.argv else 'v2_nobeh_core'
min_early = float(sys.argv[sys.argv.index('--min-early') + 1]) if '--min-early' in sys.argv else 80.0
preds = pd.read_parquet(f"{WORK}/{tag}_test_preds.parquet")
pat = preds.groupby('patient').label.max().reset_index()
tune_p, _ = train_test_split(pat, test_size=0.5, stratify=pat.label, random_state=7)
mt = preds.patient.isin(tune_p.patient).values; mf = ~mt

rows = []
for imm, consec, cool, high in itertools.product(['off', 'old', 'lac4', 'lac4_watch', 'lac4_map'], [2, 3], [6, 12], [60, 70]):
    pol = dict(imm=imm, consec=consec, cooldown=cool, high=high)
    a = simulate(preds, **pol)
    rt, rf = alert_report(preds[mt], a[mt]), alert_report(preds[mf], a[mf])
    rows.append({**pol,
                 'tune_early%': rt['pct_septic_alerted_1to12h_before_onset'], 'tune_alerts/100pd': rt['alerts_per_100_patient_days'],
                 'tune_FPpat%': rt['pct_nonseptic_patients_with_any_alert'],
                 'final_early%': rf['pct_septic_alerted_1to12h_before_onset'], 'final_alerts/100pd': rf['alerts_per_100_patient_days'],
                 'final_FPpat%': rf['pct_nonseptic_patients_with_any_alert'], 'final_lead_h': rf['median_lead_time_hours']})
res = pd.DataFrame(rows)
res.to_csv(f"{WORK}/{tag}_alert_policy_sweep.csv", index=False)

ok = res[res['tune_early%'] >= min_early]
best = (ok.sort_values('tune_alerts/100pd').iloc[0] if len(ok) else res.sort_values('tune_early%', ascending=False).iloc[0])
pol = dict(imm=best.imm, consec=int(best.consec), cooldown=int(best.cooldown), high=int(best.high))
json.dump({'tag': tag, 'policy': pol, 'min_early_target': min_early, 'chosen_on': 'tune half', 'reported_on': 'final half',
           'final_half': {k: (None if pd.isna(best[k]) else float(best[k])) for k in best.index if k.startswith('final_')}},
          open(f"{WORK}/alert_policy.json", 'w'), indent=2)

show = ['imm', 'consec', 'cooldown', 'high', 'tune_early%', 'tune_alerts/100pd', 'final_early%', 'final_alerts/100pd', 'final_FPpat%']
print(f"\nCurrent rule ('old', consec 2, cooldown 6, high 70) vs best candidates (target: early detection >= {min_early}% on tune half)\n")
print(res[(res.imm == 'old') & (res.consec == 2) & (res.cooldown == 6) & (res.high == 70)][show].to_string(index=False))
print("\nTop candidates:\n", (ok if len(ok) else res).sort_values('tune_alerts/100pd')[show].head(8).to_string(index=False))
print(f"\nCHOSEN policy: {pol}\nREPORT THE 'final_*' NUMBERS (not seen during choosing). Saved work/alert_policy.json")
