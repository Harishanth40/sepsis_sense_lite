"""Configurable alert policy (replaces the fixed rules in common.py when work/alert_policy.json exists)."""
import numpy as np
from common import alert_report  # noqa: F401  (re-exported for convenience)


def alerts_one(score, lac, mp, sb, high=70, consec=2, cooldown=6, imm='off', map_hours=3, watch=40):
    """imm: 'off' | 'old' (lactate>=4 or MAP<65 or SBP<90) | 'lac4' | 'lac4_watch' (lactate>=4 AND score>=Watch)
            | 'lac4_map' ((lactate>=4 OR MAP<65 for map_hours in a row) AND score>=Watch)"""
    n = len(score); out = np.zeros(n, bool); last, run, maprun = -10 ** 9, 0, 0
    for i in range(n):
        run = run + 1 if score[i] >= high else 0
        maprun = maprun + 1 if mp[i] < 65 else 0
        if imm == 'old': crit = lac[i] >= 4 or mp[i] < 65 or sb[i] < 90
        elif imm == 'lac4': crit = lac[i] >= 4
        elif imm == 'lac4_watch': crit = lac[i] >= 4 and score[i] >= watch
        elif imm == 'lac4_map': crit = (lac[i] >= 4 or maprun >= map_hours) and score[i] >= watch
        else: crit = False
        if (run >= consec or crit) and (i - last) > cooldown:
            out[i] = True; last = i
    return out


def simulate(df, **policy):
    alert = np.zeros(len(df), bool)
    sc, lac, mp, sb = (df[c].values for c in ['score', 'Lactate', 'MAP', 'SBP'])
    s = 0
    with np.errstate(invalid='ignore'):
        for L in df.groupby('patient', sort=False).size().values:
            alert[s:s + L] = alerts_one(sc[s:s + L], lac[s:s + L], mp[s:s + L], sb[s:s + L], **policy)
            s += L
    return alert
