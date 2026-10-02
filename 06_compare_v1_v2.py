"""Prints v1 vs v2 metrics side by side (same patient split, so the comparison is fair)."""
import json
from common import WORK
a = json.load(open(f"{WORK}/metrics.json"))['core_vitals_labs']
b = json.load(open(f"{WORK}/metrics_v2.json"))['core_vitals_labs']
rows = [("AUROC", a['AUROC'], b['AUROC']), ("AUPRC", a['AUPRC'], b['AUPRC']),
        ("Utility", a['PhysioNet_utility_row_level'], b['PhysioNet_utility_row_level'])]
for k in ('pct_septic_alerted_1to12h_before_onset', 'median_lead_time_hours', 'alerts_per_100_patient_days'):
    rows.append((k, a['alerts_with_immediate_rules'][k], b['alerts_with_immediate_rules'][k]))
print(f"{'metric':45s}{'v1':>10s}{'v2':>10s}")
for k, x, y in rows: print(f"{k:45s}{str(x):>10s}{str(y):>10s}")
