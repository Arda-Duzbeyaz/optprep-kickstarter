"""Recheck generated new/changed families through the optional backend interface.

Run tools/battery-evaluation.mjs first. This integration check is in addition to
the separate Fraction oracle and explicitly tests the backend's exported shape.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from oa_backend.verify import check_structure

families = ['conditional-rates', 'uncertainty-models', 'histogram-bins', 'coupon']
cases = json.loads((ROOT / 'evaluation/battery-oracle-cases.json').read_text())
checked = 0
for case in cases:
    if case['family'] not in families:
        continue
    rank = case['section'] == 'll'
    item = {
        'family': case['family'], 'kind': 'rank' if rank else 'interval',
        'params': case['params'], 'prompt': {'visual': case['visual']},
        'truth': case.get('truth'), 'statements': case['statements'],
        'answerOrder': case['order'],
    }
    errors = check_structure(item)
    assert not errors, (case['seed'], errors)
    assert item.get('_recomputed'), case['seed']
    checked += 1
assert checked == 192, checked
report = {'checked': checked, 'failures': 0, 'families': families}
(ROOT / 'evaluation/battery-backend-corpus.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
