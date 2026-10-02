"""STEP 1 - Data processing + feature engineering (sections 1 & 2 of your strategy).
Usage: python 01_build_dataset.py            (all patients)
       python 01_build_dataset.py --limit 500   (quick test)"""
import glob, os, sys
import numpy as np, pandas as pd
from joblib import Parallel, delayed
from common import *

cnt = lambda *conds: np.sum(conds, axis=0)


def engineer(df):
    n = len(df); idx = np.arange(n)
    f = {'patient': df['patient'].values, 'hosp': df['hosp'].values,
         'ICULOS': df['ICULOS'].values, 'label': df['SepsisLabel'].values.astype(np.int8)}
    for c in ['Age', 'Gender', 'Unit1', 'Unit2', 'HospAdmTime']:        # context: age, unit, time before ICU
        f[c] = df[c].values

    raw = df[VITALS + LABS]
    ff = raw.ffill()                                                   # carry last known value forward
    for c in VITALS + LABS:
        f[c] = ff[c].values

    # --- record WHEN a test was done and HOW LONG since the last one (missingness is a signal) ---
    for c in LABS:
        m = raw[c].notna().values
        last = np.maximum.accumulate(np.where(m, idx, -1))
        f[f'{c}_hrs_since'] = np.where(last >= 0, idx - last, np.nan)
        f[f'{c}_measured'] = m.astype(np.int8)
        f[f'{c}_nmeas'] = np.cumsum(m)

    # --- rolling 6h / 12h windows + change over the window for vitals ---
    v = ff[VITALS]
    for w in (6, 12):
        r = v.rolling(w, min_periods=1)
        mean, mn, mx, sd = r.mean(), r.min(), r.max(), r.std()
        delta = v - v.shift(w).bfill()
        for c in VITALS:
            f[f'{c}_mean{w}'] = mean[c].values; f[f'{c}_min{w}'] = mn[c].values
            f[f'{c}_max{w}'] = mx[c].values;    f[f'{c}_std{w}'] = sd[c].values
            f[f'{c}_d{w}'] = delta[c].values

    # --- lab trends: rising or falling ---
    lab = ff[TREND_LABS]
    first = lab.bfill().iloc[0]
    for w in (6, 12):
        d = lab - lab.shift(w).bfill()
        for c in TREND_LABS:
            f[f'{c}_d{w}'] = d[c].values
    for c in TREND_LABS:
        f[f'{c}_vs_baseline'] = (lab[c] - first[c]).values

    # --- clinical scores ---
    T, H, R, S, M, PC, W = (ff[c].values for c in ['Temp', 'HR', 'Resp', 'SBP', 'MAP', 'PaCO2', 'WBC'])
    P, B, C = ff['Platelets'].values, ff['Bilirubin_total'].values, ff['Creatinine'].values
    with np.errstate(invalid='ignore', divide='ignore'):
        f['sirs'] = cnt((T > 38) | (T < 36), H > 90, (R > 20) | (PC < 32), (W > 12) | (W < 4))
        f['qsofa_proxy'] = cnt(R >= 22, S <= 100)                      # no GCS in data; notes add confusion later
        f['shock_index'] = H / S
        f['sofa_proxy'] = (cnt(P < 150, P < 100, P < 50, P < 20) + cnt(B >= 1.2, B >= 2, B >= 6, B >= 12)
                           + cnt(C >= 1.2, C >= 2, C >= 3.5, C >= 5) + cnt(M < 70))
    out = pd.DataFrame(f)
    fl = out.select_dtypes('float64').columns
    out[fl] = out[fl].astype('float32')
    return out


def process(path, hosp):
    df = pd.read_csv(path, sep='|')
    df['patient'] = hosp + '_' + os.path.basename(path)[:-4]
    df['hosp'] = hosp
    return engineer(df.sort_values('ICULOS'))


if __name__ == "__main__":
    limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else None
    jobs = []
    for hosp, d in DATA_DIRS.items():
        paths = sorted(glob.glob(os.path.join(d, '*.psv')))
        if limit: paths = paths[:limit]
        print(f"Hospital {hosp}: {len(paths)} patient files in {d}")
        jobs += [(p, hosp) for p in paths]
    if not jobs:
        sys.exit("No .psv files found - edit DATA_DIRS in common.py")
    parts = Parallel(n_jobs=-1, batch_size=32)(delayed(process)(p, h) for p, h in jobs)
    data = pd.concat(parts, ignore_index=True)
    data.to_parquet(f"{WORK}/features.parquet")
    pat = data.groupby('patient')['label'].max()
    print(f"Saved {data.shape[0]:,} rows x {data.shape[1]} cols | patients: {len(pat):,} | "
          f"septic patients: {pat.sum():,} ({100 * pat.mean():.1f}%) | positive rows: {100 * data.label.mean():.2f}%")
