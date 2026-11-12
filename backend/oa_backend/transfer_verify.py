"""Independent exact checks for additional-training generators, without using answers."""
from fractions import Fraction as F
from itertools import product


def recompute_transfer(item):
    p, family = item.get('params', {}), item.get('family')
    if family == 'information-protocols':
        n, red = p['r'] + p['b'], p['r']
        total = wanted = F(0)
        for a, b in product(range(n), repeat=2):
            if not p['replacement'] and a == b: continue
            colours = [a < red, b < red]
            if p['protocol'] == 'first-red': weight = F(colours[0])
            elif p['protocol'] == 'any-red': weight = F(any(colours))
            elif p['protocol'] == 'random-red': weight = F(sum(colours), 2)
            elif p['protocol'] == 'noisy-red': weight = sum((F(p['sensitivity'] if c else p['falsePositive'], 100) for c in colours), F(0)) / 2
            else: raise ValueError('unknown observation protocol')
            total += weight
            if all(colours): wanted += weight
        return float(wanted / total)
    if family == 'shared-source':
        prior = [F(p['wa'], p['wa'] + p['wb']), F(p['wb'], p['wa'] + p['wb'])]
        red = [F(p['a'], 10), F(p['b'], 10)]
        history = (1,) * p['h'] + (0,) * p['blue']
        conditional = p['task'] in ('next', 'source')
        length = len(history) + int(p['task'] == 'next') if conditional else p['n']
        total = wanted = F(0)
        sources = ((s,) * length for s in range(2)) if p['shared'] else product(range(2), repeat=length)
        for choices in sources:
            source_weight = prior[choices[0]] if p['shared'] else F(1)
            if not p['shared']:
                for source in choices: source_weight *= prior[source]
            for colours in product((0, 1), repeat=length):
                if conditional and colours[:len(history)] != history: continue
                weight = source_weight
                for source, colour in zip(choices, colours): weight *= red[source] if colour else 1 - red[source]
                total += weight
                hit = choices[0] == 0 if p['task'] == 'source' else colours[-1] == 1 if p['task'] == 'next' else sum(colours) == p['k']
                if hit: wanted += weight
        return float(wanted / total)
    if family == 'selection-weights':
        rows = item['prompt']['visual']['rows']
        sizes, hits = [r[1] for r in rows], [r[2] for r in rows]
        rates = [F(h, n) for h, n in zip(hits, sizes)]
        weighted = sum((F(w, sum(p['weights'])) * r for w, r in zip(p['weights'], rates)), F(0))
        equal = sum(rates) / 2
        vals = {'pooled': F(sum(hits), sum(sizes)), 'equal': equal, 'posterior': F(hits[0], sum(hits)),
                'weighted': weighted, 'joint': F(hits[0], sum(sizes)), 'independent': equal ** 2,
                'shared': sum((r ** 2 for r in rates), F(0)) / 2}
        return [float(vals[k]) for k in p['statements']]
    if family == 'rates-weights':
        s = p['scenario']
        if s == 'equal-time': value = F(p['v1'] + p['v2'], 2)
        elif s in ('equal-distance', 'unequal-distance'): value = F(p['d1'] + p['d2']) / (F(p['d1'], p['v1']) + F(p['d2'], p['v2']))
        elif s == 'mixture': value = F(p['x'] * p['a'] + p['y'] * p['b'], p['x'] + p['y'])
        elif s == 'dilute': value = F(p['volume'] * (p['initial'] - p['target']), p['target'])
        elif s == 'reverse-percent': value = F(str(p['final'])) * 100 / (100 + p['up'])
        elif s == 'compound-change': value = F(p['base'] * (100 + p['up']) * (100 - p['down']), 10000)
        elif s == 'work-together': value = 1 / (F(1, p['x']) + F(1, p['y']))
        else: raise ValueError('unknown rates scenario')
        return float(value)
    return None
