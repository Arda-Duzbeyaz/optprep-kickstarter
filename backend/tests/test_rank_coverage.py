import json
from copy import deepcopy

import pytest

from oa_backend.rank_verify import recompute_rank
from oa_backend.verify import check_structure
from oa_backend import verify as verifier


def ranking(family, visual, params, probabilities):
    return {'id': family, 'family': family, 'kind': 'rank', 'params': params,
            'prompt': {'visual': visual}, 'statements': [{'p': p} for p in probabilities],
            'answerOrder': sorted(range(len(probabilities)), key=lambda i: -probabilities[i])}


def test_fund_counts_are_independent_of_the_keyed_probabilities():
    values = [[1, -4, 1, -1, 8, 7, 2, 2], [4, 6, 28, 1, 31, 9, -22, 31]]
    item = ranking('fund-returns', {'series': [{'values': row} for row in values]},
                   {'statements': [{'t': 'pos', 'f': 0}, {'t': 'pos', 'f': 1}, {'t': 'lt', 'f': 0, 'v': 0}]},
                   [0.75, 0.875, 0.25])
    assert check_structure(item) == []
    assert item['_recomputed']
    wrong = deepcopy(item)
    wrong['statements'][0]['p'] = 0.76  # still sorted correctly, but numerically false
    assert any('disagree' in error for error in check_structure(wrong))


def test_score_table_conditional_uses_its_subgroup_denominator():
    item = ranking('score-table', {'columns': ['Student', 'M', 'P'],
                                  'rows': [['A', 80, 90], ['B', 30, 20], ['C', 70, 60]]},
                   {'statements': [{'cond': {'t': 'ge', 's': 'M', 'v': 50}},
                                   {'given': {'t': 'ge', 's': 'M', 'v': 50}, 'cond': {'t': 'ge', 's': 'P', 'v': 80}},
                                   {'cond': {'t': 'both', 'a': 'M', 'b': 'P', 'v': 80}}]},
                   [2 / 3, 1 / 2, 1 / 3])
    assert check_structure(item) == []


def test_conjunction_probabilities_are_recomputed_from_cells():
    item = ranking('conjunction', {}, {'cells': [[2, 1], [1, 4]], 'statements': ['A', 'AB', 'AorB']},
                   [3 / 8, 2 / 8, 4 / 8])
    assert check_structure(item) == []


def test_markov_stationary_distribution_is_solved_from_rendered_edges():
    edges = [('A', 'A', .5), ('A', 'B', .5), ('B', 'C', 1), ('C', 'A', .25), ('C', 'C', .75)]
    visual = {'nodes': [{'id': name} for name in ['A', 'B', 'C']],
              'edges': [{'from': a, 'to': b, 'p': p} for a, b, p in edges]}
    item = ranking('markov-graph', visual, {'mode': 'stationary', 'targets': [2, 0, 1]}, [4 / 7, 2 / 7, 1 / 7])
    assert recompute_rank(item) == pytest.approx([4 / 7, 2 / 7, 1 / 7])
    assert check_structure(item) == []


def test_an_unsupported_family_is_not_reported_as_numerically_recomputed():
    item = ranking('unsupported', {}, {}, [.9, .6, .2])
    assert check_structure(item) == []
    assert not item.get('_recomputed')


def test_curated_ranking_display_order_is_applied_after_recomputation():
    item = ranking('conjunction', {}, {'cells': [[2, 1], [1, 4]], 'statements': ['A', 'AB', 'AorB'],
                                      'displayOrder': [2, 0, 1]}, [4 / 8, 3 / 8, 2 / 8])
    assert check_structure(item) == []


def test_sequence_coverage_counts_actual_queries_and_reports_skips(monkeypatch, tmp_path):
    calls = []

    class Engine:
        def call(self, request):
            calls.append(request)
            return {'predictions': [{'nextValue': 4, 'complexity': 1}]}

        def close(self):
            pass

    monkeypatch.setattr(verifier, 'available', lambda: True)
    monkeypatch.setattr(verifier, 'Engine', Engine)
    item = {'id': 'next', 'family': 'arithmetic', 'kind': 'mcq',
            'params': {'shown': [1, 2, 3], 'rule': 'arithmetic'},
            'answer': {'value': 4}, 'answerIndex': 3,
            'options': [{'label': str(x), 'value': x, 'misconception': None if x == 4 else 'a slip'} for x in [0, 1, 2, 4, 5]]}
    missing = deepcopy(item)
    missing['id'] = 'missing'
    missing['params']['position'] = 1
    (tmp_path / 'nl.json').write_text(json.dumps({'section': 'nl', 'items': [item, missing]}))
    report = verifier.verify(tmp_path)
    stats = report['sections']['nl']['stats']
    assert len(calls) == stats['sequence_checked'] == 1
    assert stats['sequence_skipped'] == 1
    assert stats['numerically_checked'] == stats['numerically_unchecked'] == 1
    assert report['ok'] is True
    assert report['complete_numerical_coverage'] is False


def test_empty_library_cannot_claim_success(tmp_path):
    assert verifier.verify(tmp_path)['ok'] is False
