"""5-type sepsis SOURCE CLUE CHECKER (rule-based, negation-aware, NO medicines).
Reads a nursing note / clinician text, matches the 3 key clues per source, ranks the likely sources and
prints the source-specific work-up, red flags, source control and prevention from protocols.json.
Usage:  python source_clues.py                      (runs 5 demo notes)
        python source_clues.py --note "Productive cough with green sputum, focal crackles on left base"
NOTE: PhysioNet 2019 has none of these clues, so this is a prototype validated on examples only (no accuracy claim)."""
import re, sys
from recommendations import load_protocols

NEG = re.compile(r"\b(no|denies|denied|without|negative for|not|free of|absent|resolved)\b")
CLAUSE = re.compile(r"[.;,]| but ")

CLUES = {
 'respiratory': [("Yellow/green sputum with cough", ['purulent sputum', 'yellow sputum', 'green sputum', 'productive cough', 'coloured sputum', 'colored sputum']),
                 ("Focal crackles on chest exam", ['focal crackles', 'crackles', 'crepitations', 'bronchial breathing']),
                 ("Chest X-ray infiltrate + low oxygen", ['infiltrate', 'consolidation', 'low spo2', 'hypoxi', 'desaturat'])],
 'urosepsis': [("Flank (kidney-side) pain", ['flank pain', 'loin pain', 'cva tenderness']),
               ("Pyuria + nitrite positive on urine test", ['pyuria', 'nitrite positive', 'positive nitrite', 'pus cells']),
               ("Fever + chills + burning / cloudy urine", ['dysuria', 'burning urination', 'cloudy urine', 'foul urine'])],
 'abdominal': [("Rigid / board-like abdomen", ['rigid abdomen', 'board-like', 'board like', 'guarding', 'rebound tenderness']),
               ("Fever + jaundice + right upper abdominal pain", ['jaundice', 'icterus', 'right upper quadrant pain', 'ruq pain', 'right upper abdominal pain']),
               ("Free air / abscess on scan", ['free air', 'pneumoperitoneum', 'intra-abdominal abscess', 'abdominal abscess', 'free fluid'])],
 'bloodstream': [("Positive blood culture", ['positive blood culture', 'blood culture positive', 'bacteremia', 'bacteraemia']),
                 ("Rigors after IV line use / line site changes", ['rigors after line', 'rigors after flush', 'line site', 'picc site', 'iv site red']),
                 ("New heart murmur + skin / nail signs", ['new murmur', 'heart murmur', 'splinter', 'janeway', 'osler'])],
 'skin': [("Pain out of proportion to the skin", ['pain out of proportion', 'disproportionate pain', 'pain disproportionate']),
          ("Rapid redness + blisters / black skin", ['rapidly spreading', 'blister', 'bullae', 'black skin', 'dusky skin', 'necrosis']),
          ("Crepitus (crackling under the skin)", ['crepitus', 'subcutaneous emphysema', 'gas in tissue'])],
}
LEVEL = {3: "STRONG", 2: "LIKELY", 1: "POSSIBLE"}


def matched_clues(text):
    """Return {source: [indices of matched clues]} - negated mentions ('no crackles') are ignored."""
    hits = {k: set() for k in CLUES}
    for clause in CLAUSE.split(text.lower()):
        for src, clues in CLUES.items():
            for i, (_, terms) in enumerate(clues):
                for t in terms:
                    pos = clause.find(t)
                    if pos >= 0 and not NEG.search(clause[:pos]):
                        hits[src].add(i)
    return hits


def rank_sources(text):
    hits = matched_clues(text)
    ranked = sorted(((len(v), k) for k, v in hits.items() if v), reverse=True)
    return [(k, n, [CLUES[k][i][0] for i in sorted(hits[k])], [c[0] for j, c in enumerate(CLUES[k]) if j not in hits[k]])
            for n, k in ranked]


def print_source_card(key, proto):
    s = proto['source_specific'][key]; pp = proto['prevention_patient_level']
    print(f"\n  >> {s['label']}")
    for title, items in (("RED FLAGS", s.get('red_flags', [])), ("Work-up / investigations", s['workup']),
                         ("Source control", s['source_control']), ("Prevention", pp.get(key, []))):
        if items:
            print(f"     {title}:"); [print(f"       - {i}") for i in items]


def analyse(text, proto):
    print(f"\nNOTE: \"{text}\"")
    ranked = rank_sources(text)
    if not ranked:
        print("  No source clues found. Do a systematic source search (chest, urine, abdomen, lines/blood, skin)."); return
    for key, n, found, missing in ranked:
        print(f"  {LEVEL[n]} ({n}/3) {proto['source_specific'][key]['label']}: found -> {'; '.join(found)}")
        if missing: print(f"     still to check: {'; '.join(missing)}")
    print_source_card(ranked[0][0], proto)


if __name__ == "__main__":
    proto = load_protocols()
    if '--note' in sys.argv:
        analyse(sys.argv[sys.argv.index('--note') + 1], proto)
    else:
        for t in ["Productive cough with green sputum, focal crackles on left base. Low SpO2.",
                  "Fever and chills with burning urination and flank pain. Urine nitrite positive.",
                  "Rigid abdomen, severe pain. Fever with jaundice and right upper quadrant pain.",
                  "Blood culture positive x2. Rigors after line flush, central line site red.",
                  "Pain out of proportion, rapidly spreading redness with blisters. Crepitus felt.",
                  "No cough, no crackles. Alert and comfortable."]:
            analyse(t, proto)
