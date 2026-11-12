import json
import subprocess
from copy import deepcopy
from pathlib import Path
import pytest
from oa_backend.transfer_verify import recompute_transfer
from oa_backend.verify import check_structure
ROOT = Path(__file__).resolve().parents[2]

@pytest.fixture(scope='module')
def exported(tmp_path_factory):
    directory = tmp_path_factory.mktemp('transfer-checks')
    subprocess.run(['node', 'tools/export-transfer.mjs', str(directory), '12'], cwd=ROOT, check=True, capture_output=True)
    return [it for path in sorted(directory.glob('*.json')) for it in json.loads(path.read_text())['items']]

@pytest.mark.parametrize('family', ['information-protocols', 'shared-source', 'selection-weights', 'rates-weights'])
def test_actual_generated_answers_are_independently_recomputed(exported, family):
    items = [it for it in exported if it['family'] == family]
    assert len(items) >= 36
    for item in items:
        assert not check_structure(item), item['id']
        assert item.get('_recomputed'), item['id']

@pytest.mark.parametrize('family', ['information-protocols', 'shared-source', 'selection-weights', 'rates-weights'])
def test_internally_consistent_wrong_keys_are_rejected(exported, family):
    item = deepcopy(next(it for it in exported if it['family'] == family))
    if item['kind'] == 'rank': item['statements'][0]['p'] += .005
    elif item['kind'] == 'interval': item['truth'] *= 1.1
    else:
        item['answer']['value'] += .001
        item['options'][item['answerIndex']]['value'] = item['answer']['value']
    assert check_structure(item), family

def test_unsupported_family_does_not_claim_numerical_coverage():
    assert recompute_transfer({'family': 'unsupported'}) is None
