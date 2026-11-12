"""Independent probability calculations for supported ranking scenarios.

Read rendered tables, bars and graph edges. Unsupported variants explicitly return
None; checking the supplied answer order alone is not numerical verification.
"""
from __future__ import annotations

from fractions import Fraction
from typing import Any
from .transfer_verify import recompute_transfer


def _stationary(matrix: list[list[Fraction]]) -> list[float]:
    n = len(matrix)
    a = [[matrix[col][row] - int(row == col) for col in range(n)] + [Fraction(0)]
         for row in range(n - 1)] + [[Fraction(1)] * n + [Fraction(1)]]
    for col in range(n):
        pivot = next(row for row in range(col, n) if a[row][col])
        a[col], a[pivot] = a[pivot], a[col]
        scale = a[col][col]
        a[col] = [v / scale for v in a[col]]
        for row in range(n):
            if row != col:
                factor = a[row][col]
                a[row] = [v - factor * w for v, w in zip(a[row], a[col])]
    return [float(row[-1]) for row in a]


def recompute_rank(item: dict[str, Any]) -> list[float] | None:
    probabilities = _canonical_probabilities(item)
    order = (item.get('params') or {}).get('displayOrder')
    if probabilities is not None and order is not None:
        return [probabilities[i] for i in order]
    return probabilities


def _canonical_probabilities(item: dict[str, Any]) -> list[float] | None:
    p = item.get('params') or {}
    visual = item.get('prompt', {}).get('visual') or {}
    family = item.get('family')
    if family == 'selection-weights':
        return recompute_transfer(item)
    specs = p.get('statements')
    if family == 'fund-returns' and isinstance(specs, list) and all(isinstance(s, dict) and 't' in s for s in specs):
        values = [s['values'] for s in visual['series']]
        first, second = values
        probabilities = []
        for spec in specs:
            row = values[spec.get('f', 1)]
            kind = spec['t']
            if kind == 'persist':
                scope = [i for i in range(1, len(row)) if row[i - 1] > 0]
                hits = sum(row[i] > 0 for i in scope)
                probabilities.append(hits / len(scope))
                continue
            if kind == 'pos': hits = sum(v > 0 for v in row)
            elif kind == 'gt': hits = sum(v > spec['v'] for v in row)
            elif kind == 'lt': hits = sum(v < spec['v'] for v in row)
            elif kind == 'beat': hits = sum(b > a for a, b in zip(first, second))
            elif kind == 'bothNeg': hits = sum(a < 0 and b < 0 for a, b in zip(first, second))
            else: return None
            probabilities.append(hits / len(first))
        return probabilities
    if family == 'score-table' and isinstance(specs, list) and all(isinstance(s, dict) and 'cond' in s for s in specs):
        rows = [dict(zip(visual['columns'], row)) for row in visual['rows']]

        def matches(c, row):
            t = c['t']
            if t == 'ge': return row[c['s']] >= c['v']
            if t == 'lt': return row[c['s']] < c['v']
            if t == 'both': return min(row[c['a']], row[c['b']]) >= c['v']
            if t == 'either': return max(row[c['a']], row[c['b']]) >= c['v']
            if t == 'gt': return row[c['a']] > row[c['b']]
            if t == 'avg': return sum(row[s] for s in c['subs']) >= 3 * c['v']
            raise ValueError('unknown score-table condition')

        probabilities = []
        for spec in specs:
            scope = [row for row in rows if not spec.get('given') or matches(spec['given'], row)]
            probabilities.append(sum(matches(spec['cond'], row) for row in scope) / len(scope))
        return probabilities
    if family == 'conjunction' and 'cells' in p and isinstance(specs, list) and all(isinstance(s, str) for s in specs):
        (both, only_a), (only_b, neither) = p['cells']
        total = both + only_a + only_b + neither
        values = {'A': (both + only_a) / total, 'B': (both + only_b) / total,
                  'AB': both / total, 'AorB': (total - neither) / total,
                  'BgA': both / (both + only_a), 'neither': neither / total}
        if all(s in values for s in specs):
            return [values[s] for s in specs]
    if family == 'markov-graph' and p.get('targets') and visual.get('edges'):
        nodes = {node['id']: i for i, node in enumerate(visual['nodes'])}
        matrix = [[Fraction(0) for _ in nodes] for _ in nodes]
        for edge in visual['edges']:
            matrix[nodes[edge['from']]][nodes[edge['to']]] += Fraction(str(edge['p']))
        if p.get('mode') == 'nstep':
            start = p['start']
            return [float(sum(matrix[start][k] * matrix[k][j] for k in range(len(nodes)))) for j in p['targets']]
        if p.get('mode') in ('stationary', 'trap'):
            result = _stationary(matrix)
            return [result[j] for j in p['targets']]
    return None
