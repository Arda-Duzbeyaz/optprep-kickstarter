#!/usr/bin/env python3
"""Independent Python/standard-library finite-outcome check of exported JS cases.

No application code or generator formulas are imported. Fractions keep outcome
weights exact. The corpus is produced by tools/curriculum-evaluation.mjs.
"""
from collections import Counter
from fractions import Fraction as F
from itertools import combinations, permutations, product
from pathlib import Path
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[1]


def mean(atoms):
    return sum((F(x) * w for x, w in atoms), F(0))


def variance(atoms):
    m = mean(atoms)
    return sum((w * (F(x) - m) ** 2 for x, w in atoms), F(0))


def binary_paths(n, probability):
    for xs in product((0, 1), repeat=n):
        w = F(1)
        for i, x in enumerate(xs):
            p = probability(i, xs[:i])
            w *= p if x else 1 - p
            if not w:
                break
        if w:
            yield xs, w


def distribution(values, weights):
    return [(x, F(w, sum(weights))) for x, w in zip(values, weights)]


def result(family, p):
    kind = p.get('kind')
    if family == 'event-algebra':
        if kind == 'independent':
            a, b = F(*p['pa']), F(*p['pb'])
            return sum(((a if i else 1-a) * (b if j else 1-b)
                        for i, j in product((0, 1), repeat=2) if i or j), F(0))
        weights = p.get('weights', p.get('cells'))
        allowed = hit = 0
        for mask, w in enumerate(weights):
            a, b = bool(mask & 1), bool(mask & 2)
            if kind == 'conditional' and not a:
                continue
            allowed += w
            yes = mask != 0 if kind == 'three-union' else a or b if kind == 'union' else a != b if kind == 'exclusive' else not a and not b if kind == 'neither' else a and b
            hit += w * yes
        return F(hit, allowed)
    if family == 'success-counts':
        n = p['a'] + p['b'] if kind == 'split' else len(p['ps']) if kind == 'unequal' else p['n']
        def chance(i, previous):
            if kind == 'unequal':
                return F(*p['ps'][i])
            e = p['e']
            return F(e['good'], e['total']) if e['replacement'] else F(e['good']-sum(previous), e['total']-i)
        numerator = denominator = F(0)
        for xs, w in binary_paths(n, chance):
            k = sum(xs)
            condition = k == p['K'] if kind == 'split' else p.get('condition') is None or k >= p['condition']
            yes = sum(xs[:p['a']]) == p['j'] if kind == 'split' else k == p['k'] if kind == 'unequal' else p['lo'] <= k <= p['hi']
            if condition:
                denominator += w
                if yes:
                    numerator += w
        return numerator / denominator
    if family == 'payout-models':
        if kind == 'fair-win':
            # Solve the two-payoff fairness equation as a finite weighted lottery.
            return F(p['loss'], p['win'] + p['loss'])
        atoms = []
        if kind in ('mixture', 'information'):
            for s in range(3):
                for green, hit in product((0, 1), repeat=2):
                    if kind == 'information' and not green:
                        continue
                    w = F(p['priors'][s], sum(p['priors'])) * F(p['lights'][s] if green else 4-p['lights'][s], 4) * F(p['hit'][s] if hit else 4-p['hit'][s], 4)
                    atoms.append((p['pays'][s] if hit else 0, w))
        else:
            for x, w in distribution(p['values'], p['weights']):
                if kind == 'conditional' and x < 0:
                    continue
                y = x-p['fee'] if kind == 'profit' else min(x, p['cap']) if kind == 'cap' else x+(p['bonus'] if x >= p['threshold'] else 0) if kind == 'bonus' else x
                atoms.append((y, w))
        return mean(atoms) / sum(w for _, w in atoms)
    if family == 'variance-dependence':
        if kind == 'covariance':
            atoms = [((i >> 1, i & 1), F(w, sum(p['cells']))) for i, w in enumerate(p['cells'])]
            mx = sum(x*w for (x, _), w in atoms)
            my = sum(y*w for (_, y), w in atoms)
            return sum(w*(x-mx)*(y-my) for (x, y), w in atoms)
        if kind == 'sample':
            totals = [sum(xs) for xs in combinations(range(1, p['N']+1), p['n'])]
            atoms = [(x, F(1, len(totals))) for x in totals]
        elif kind in ('mixture', 'conditional-variance'):
            atoms = []
            priors = [F(p['prior'], 4), F(4-p['prior'], 4)]
            if p['shared']:
                for s in range(2):
                    signal = F(p['lights'][s], 4) if kind == 'conditional-variance' else F(1)
                    for xs, w in binary_paths(p['n'], lambda i, previous: F(p['rates'][s], 5)):
                        atoms.append((sum(xs), priors[s]*signal*w))
            else:
                for pairs in product(tuple(product((0, 1), repeat=2)), repeat=p['n']):
                    w = F(1)
                    for s, hit in pairs:
                        w *= priors[s] * F(p['rates'][s] if hit else 5-p['rates'][s], 5)
                    atoms.append((sum(hit for _, hit in pairs), w))
            norm = sum(w for _, w in atoms)
            atoms = [(x, w/norm) for x, w in atoms]
        else:
            dist = distribution(p['values'], p['weights'])
            if kind == 'sum':
                atoms = [(p['a']*x+p['b']*y, w*v) for x, w in dist for y, v in dist]
            else:
                atoms = [((p['a']+p['b'])*x if kind == 'reuse' else p['a']*x+p['shift'] if kind == 'affine' else x, w) for x, w in dist]
        return variance(atoms)
    if family == 'discrete-sums':
        xdist, ydist = distribution(p['xs'], p['wx']), distribution(p['ys'], p['wy'])
        if kind == 'random-total':
            answer = F(0)
            for n, w in distribution(p['counts'], p['countWeights']):
                for xs in product(xdist, repeat=n):
                    if sum(x for x, _ in xs) >= p['limit']:
                        answer += w * math.prod(r for _, r in xs)
            return answer
        if kind == 'reuse' and not p['independent']:
            return sum((w for x, w in xdist if 2*x >= p['t']), F(0))
        numerator = denominator = F(0)
        for x, w in xdist:
            for y, r in ydist:
                if kind == 'conditional' and x+y < p['t']:
                    continue
                denominator += w*r
                yes = x >= p['bound'] if kind == 'conditional' else x > y if kind == 'comparison' else x+y == p['t'] if kind == 'exact' else x+y >= p['t']
                if yes:
                    numerator += w*r
        return numerator/denominator
    if family == 'restricted-counting':
        if kind == 'repeated':
            letters = tuple(i for i, n in enumerate(p['counts']) for _ in range(n))
            return F(len(set(permutations(letters))))
        if kind == 'roles':
            outcomes = [(i, j) for i in range(p['a']+p['b']) for j in range(p['a']+p['b']) if i != j]
            return F(sum(i < p['a'] <= j for i, j in outcomes), len(outcomes))
        if kind == 'adjacent':
            outcomes = [(i, j) for i in range(p['n']) for j in range(p['n']) if i != j]
            return F(sum((abs(i-j) == 1) != p['apart'] for i, j in outcomes), len(outcomes))
        if kind == 'gaps':
            outcomes = list(combinations(range(p['r']+p['b']), p['r']))
            return F(sum(all(y-x > 1 for x, y in zip(xs, xs[1:])) for xs in outcomes), len(outcomes))
        labels = tuple(i for i, n in enumerate(p['counts']) for _ in range(n))
        allowed = hit = 0
        for selected in combinations(range(len(labels)), p['k']):
            colours = Counter(labels[i] for i in selected)
            if kind == 'conditioned' and not colours[0]:
                continue
            allowed += 1
            hit += all(colours[i] > 0 for i in range(3)) if kind == 'conditioned' else all(colours[i] == p['target'][i] for i in range(3))
        return F(hit, allowed)
    if family == 'first-success':
        n = p['k'] if p['variant'] == 'rth' else p['past']+p['m']
        numerator = denominator = F(0)
        for xs, w in binary_paths(n, lambda i, previous: F(p['a'], p['c'])):
            if p['variant'] == 'memoryless' and any(xs[:p['past']]):
                continue
            denominator += w
            if (xs[-1] and sum(xs) == p['r']) if p['variant'] == 'rth' else not any(xs):
                numerator += w
        return numerator/denominator
    raise AssertionError(f'Unhandled family: {family}')


def main():
    cases = json.loads(Path(sys.argv[1] if len(sys.argv)>1 else ROOT/'evaluation/curriculum-oracle-cases.json').read_text())
    counts = Counter()
    for case in cases:
        expected = result(case['family'], case['params'])
        assert math.isclose(float(expected), case['answer'], rel_tol=1e-10, abs_tol=1e-10), (case['seed'], expected, case)
        counts[case['family']] += 1
    report = {'passed':len(cases), 'failed':0, 'arithmetic':'Python fractions.Fraction', 'models':'explicit finite paths, labelled subsets, unique strings, centred deviations', 'byFamily':dict(counts)}
    (ROOT/'evaluation/curriculum-python-oracle.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
