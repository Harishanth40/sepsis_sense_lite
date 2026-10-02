"""STEP 3 - Train LightGBM, calibrate, set Low/Watch/High, evaluate (sections 2 & 3).
Usage:
    python 03_train_evaluate.py
    python 03_train_evaluate.py --fast
    python 03_train_evaluate.py --v2
    python 03_train_evaluate.py --v2 --no-behavior
"""

import sys, json
import numpy as np
import pandas as pd
import joblib
import lightgbm as lgb

from sklearn.model_selection import train_test_split
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import roc_auc_score, average_precision_score

from common import *


FAST = '--fast' in sys.argv
V2 = '--v2' in sys.argv
NO_BEHAVIOR = '--no-behavior' in sys.argv

PRE = 'v2_' if V2 else ''

PARAMS = dict(
    objective='binary',
    metric='average_precision',
    learning_rate=0.03,
    num_leaves=63,
    min_child_samples=200,
    feature_fraction=0.6,
    bagging_fraction=0.8,
    bagging_freq=1,
    lambda_l2=5.0,
    scale_pos_weight=5,
    verbose=-1,
    n_jobs=-1,
    seed=42
)


def run(df, feats, tr_p, va_p, te_p, tag, save=True):

    tr, va, te = (
        df[df.patient.isin(s)]
        for s in (tr_p, va_p, te_p)
    )

    print(
        f"\n=== {tag}: {len(feats)} features | "
        f"train {len(tr):,} rows, "
        f"val {len(va):,}, "
        f"test {len(te):,} ==="
    )

    dtr = lgb.Dataset(tr[feats], tr.label)
    dva = lgb.Dataset(va[feats], va.label, reference=dtr)

    model = lgb.train(
        PARAMS,
        dtr,
        3000,
        valid_sets=[dva],
        callbacks=[
            lgb.early_stopping(100, verbose=False),
            lgb.log_evaluation(200)
        ]
    )

    # Calibration
    pv = model.predict(
        va[feats],
        num_iteration=model.best_iteration
    )

    iso = IsotonicRegression(
        out_of_bounds='clip',
        y_min=0,
        y_max=1
    ).fit(pv, va.label)

    pv_c = iso.predict(pv)

    # Threshold selection
    up_v, un_v = row_utilities(va)

    grid = np.unique(
        np.quantile(
            pv_c,
            np.linspace(0.80, 0.9995, 120)
        )
    )

    utils = [
        normalized_utility(
            pv_c >= t,
            up_v,
            un_v
        )
        for t in grid
    ]

    t_high = min(
        float(grid[int(np.argmax(utils))]),
        0.95
    )

    t_watch = t_high / 2

    print(
        f"val utility {max(utils):.3f} "
        f"at t_high={t_high:.4f}, "
        f"t_watch={t_watch:.4f}"
    )

    # Test
    pt = iso.predict(
        model.predict(
            te[feats],
            num_iteration=model.best_iteration
        )
    )

    up_t, un_t = row_utilities(te)

    score = risk_score(
        pt,
        t_watch,
        t_high
    )

    res = {
        "AUROC": round(
            roc_auc_score(te.label, pt),
            4
        ),
        "AUPRC": round(
            average_precision_score(te.label, pt),
            4
        ),
        "PhysioNet_utility_row_level": round(
            normalized_utility(
                pt >= t_high,
                up_t,
                un_t
            ),
            4
        ),
        "n_test_patients": len(te_p)
    }

    pred = te[
        [
            'patient',
            'ICULOS',
            'label',
            'hosp',
            'Lactate',
            'MAP',
            'SBP'
        ]
    ].copy()

    pred['prob'] = pt
    pred['score'] = score

    res["alerts_with_immediate_rules"] = alert_report(
        pred,
        simulate_alerts(
            pred,
            immediate=True
        )
    )

    res["alerts_score_only"] = alert_report(
        pred,
        simulate_alerts(
            pred,
            immediate=False
        )
    )

    print(
        json.dumps(
            res,
            indent=2
        )
    )

    if save:

        model.save_model(
            f"{WORK}/{tag}_model.txt"
        )

        joblib.dump(
            iso,
            f"{WORK}/{tag}_calibrator.joblib"
        )

        json.dump(
            {
                "tag": tag,
                "features": feats,
                "t_watch": t_watch,
                "t_high": t_high,
                "consec": 2,
                "cooldown": 6
            },
            open(
                f"{WORK}/{tag}_config.json",
                "w"
            )
        )

        pred.to_parquet(
            f"{WORK}/{tag}_test_preds.parquet"
        )

        imp = pd.Series(
            model.feature_importance('gain'),
            index=feats
        ).sort_values(
            ascending=False
        )

        imp.head(30).to_csv(
            f"{WORK}/{tag}_top_features.csv"
        )

        print(
            "Top 10 features:",
            list(imp.index[:10])
        )

    return res


if __name__ == "__main__":

    # Load dataset
    df = load_features(
        with_notes=not V2,
        version='v2' if V2 else 'v1'
    )

    have_notes = (
        'note_confusion_12h' in df.columns
    )

    extra = (
        NOTE_COLS + ['qsofa_full']
        if have_notes
        else []
    )

    # Normal feature list
    core = [
        c
        for c in df.columns
        if c not in NON_FEATURES + extra
    ]

    # -------------------------------------------------
    # NO-BEHAVIOR ABLATION
    # -------------------------------------------------

    if NO_BEHAVIOR:

        behavior_features = [
            'ICULOS',
            'HospAdmTime',
            'Potassium_nmeas',
            'Hgb_nmeas',
            'Creatinine_nmeas',
            'BUN_nmeas',
            'WBC_nmeas',
            'Platelets_nmeas',
            'BaseExcess_nmeas',
            'FiO2_hrs_since'
        ]

        existing_behavior = [
            c
            for c in behavior_features
            if c in core
        ]

        core = [
            c
            for c in core
            if c not in existing_behavior
        ]

        print(
            "\nNO-BEHAVIOR MODE ENABLED"
        )

        print(
            f"Removed {len(existing_behavior)} "
            f"behavior/time features:"
        )

        print(
            existing_behavior
        )

        print(
            f"Remaining features: {len(core)}"
        )

    # Patient-level split
    pat = (
        df.groupby('patient')
        .agg(
            sep=('label', 'max'),
            hosp=('hosp', 'first')
        )
        .reset_index()
    )

    tr, tmp = train_test_split(
        pat,
        test_size=0.3,
        stratify=pat.sep,
        random_state=42
    )

    va, te = train_test_split(
        tmp,
        test_size=0.5,
        stratify=tmp.sep,
        random_state=42
    )

    if FAST:
        tr = tr.sample(
            frac=0.3,
            random_state=1
        )

    allres = {}

    # Output tag
    if V2 and NO_BEHAVIOR:
        tag_prefix = 'v2_nobeh_'
    else:
        tag_prefix = PRE

    # Core model
    allres['core_vitals_labs'] = run(
        df,
        core,
        tr.patient,
        va.patient,
        te.patient,
        tag_prefix + 'core'
    )

    # Notes model for V1 only
    if have_notes:

        allres['with_synthetic_notes'] = run(
            df,
            core + extra,
            tr.patient,
            va.patient,
            te.patient,
            'with_notes'
        )

    # Cross-hospital evaluation
    if pat.hosp.nunique() > 1:

        A = pat[
            pat.hosp == 'A'
        ]

        B = pat[
            pat.hosp == 'B'
        ]

        a_tr, a_va = train_test_split(
            A,
            test_size=0.12,
            stratify=A.sep,
            random_state=42
        )

        if FAST:
            a_tr = a_tr.sample(
                frac=0.3,
                random_state=1
            )

        allres['train_A_test_B'] = run(
            df,
            core,
            a_tr.patient,
            a_va.patient,
            B.patient,
            tag_prefix + 'cross_A_to_B',
            save=False
        )

    # Save correct metrics filename
    if V2 and NO_BEHAVIOR:
        metrics_file = 'metrics_v2_nobeh.json'
    elif V2:
        metrics_file = 'metrics_v2.json'
    else:
        metrics_file = 'metrics.json'

    json.dump(
        allres,
        open(
            f"{WORK}/{metrics_file}",
            "w"
        ),
        indent=2
    )

    print(
        f"\nAll metrics saved to work/{metrics_file}"
    )