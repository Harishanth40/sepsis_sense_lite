"""STEP 1b - v2 features: ALL 26 labs + organ-system features (respiratory, kidney, liver, clotting, circulation).
These come from REAL PhysioNet columns that v1 ignored. Output: work/features_v2.parquet
Usage: python 01b_build_features_v2.py [--limit N]   then   python 03_train_evaluate.py --v2"""
import glob, os, sys, importlib
import numpy as np, pandas as pd
from joblib import Parallel, delayed
from common import *

base = importlib.import_module('01_build_dataset')
cnt = base.cnt


def engineer_v2(df):
    out = base.engineer(df)                       # all v1 features first
    n = len(df); idx = np.arange(n)
    raw = df[LABS_EXTRA]; ff = raw.ffill()
    f = {}
    for c in LABS_EXTRA:                          # remaining 13 labs: value, hours since, 6h change
        m = raw[c].notna().values
        last = np.maximum.accumulate(np.where(m, idx, -1))
        f[c] = ff[c].values
        f[f'{c}_hrs_since'] = np.where(last >= 0, idx - last, np.nan)
        f[f'{c}_d6'] = (ff[c] - ff[c].shift(6).bfill()).values
    O2, FI, R, M, L, B, C, P, BUN, PH = (out[c].values for c in
        ['O2Sat', 'FiO2', 'Resp', 'MAP', 'Lactate', 'Bilirubin_total', 'Creatinine', 'Platelets', 'BUN', 'pH'])
    AST, ALP, PTT, FIB = (ff[c].values for c in ['AST', 'Alkalinephos', 'PTT', 'Fibrinogen'])
    Pmax = pd.Series(P).cummax().values
    with np.errstate(invalid='ignore', divide='ignore'):
        sf = np.where(FI > 0, O2 / FI, np.nan)
        resp = cnt(sf < 315, sf < 235, sf < 150, R >= 22)
        renal = cnt(C >= 1.2, C >= 2, C >= 3.5, C >= 5)
        hepatic = cnt(B >= 1.2, B >= 2, B >= 6, B >= 12)
        coag = cnt(P < 150, P < 100, P < 50, P < 20)
        cardio = cnt(M < 70, L >= 2, L >= 4)
        f.update(sf_ratio=sf, pts_resp=resp, pts_renal=renal, pts_hepatic=hepatic, pts_coag=coag, pts_cardio=cardio,
                 organ_count=cnt(resp > 0, renal > 0, hepatic > 0, coag > 0, cardio > 0),
                 plt_drop_from_max=Pmax - P, bun_cr_ratio=BUN / C,
                 labs_ordered_6h=df[LABS + LABS_EXTRA].notna().astype(int).rolling(6, min_periods=1).sum().sum(axis=1).values,
                 pat_resp=resp + cnt(PH < 7.35),
                 pat_hepatobiliary=cnt(B >= 2, AST > 100, ALP > 240),
                 pat_renal=cnt(C >= 1.5, BUN >= 30),
                 pat_coag=cnt(PTT > 40, FIB < 150, (Pmax - P) > 50))
    add = pd.DataFrame(f)
    fl = add.select_dtypes('float64').columns
    add[fl] = add[fl].astype('float32')
    return pd.concat([out, add], axis=1)


def process_v2(path, hosp):
    df = pd.read_csv(path, sep='|')
    df['patient'] = hosp + '_' + os.path.basename(path)[:-4]
    df['hosp'] = hosp
    return engineer_v2(df.sort_values('ICULOS'))


if __name__ == "__main__":
    limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else None
    jobs = []
    for hosp, d in DATA_DIRS.items():
        paths = sorted(glob.glob(os.path.join(d, '*.psv')))
        if limit: paths = paths[:limit]
        jobs += [(p, hosp) for p in paths]
    if not jobs: sys.exit("No .psv files found - edit DATA_DIRS in common.py")
    data = pd.concat(Parallel(n_jobs=-1, batch_size=32)(delayed(process_v2)(p, h) for p, h in jobs), ignore_index=True)
    data.to_parquet(f"{WORK}/features_v2.parquet")
    print(f"Saved {data.shape[0]:,} rows x {data.shape[1]} cols -> {WORK}/features_v2.parquet")
