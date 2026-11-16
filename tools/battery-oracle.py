"""Independent Python checks: no imports from application JS or its math helpers.

Recomputes all 30 NumberLogic models with Fraction, checks supported Intervals models,
recounts table/chart ranking scenarios, and checks signed Orderbooks cash/exposure.
Generator parameters establish the stated model; this does not establish that the
model is a real assessment item or that finite sequences have universal uniqueness.
"""
import json, math, itertools
from fractions import Fraction as F
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CASES=json.loads((ROOT/'evaluation/battery-oracle-cases.json').read_text())
def require(ok,message):
    if not ok: raise AssertionError(message)
def near(a,b): return abs(float(a)-float(b)) <= 2e-8*max(1,abs(float(a)),abs(float(b)))
def primes(n=80):
    out=[];v=2
    while len(out)<n:
        if all(v%d for d in range(2,math.isqrt(v)+1)):out.append(v)
        v+=1
    return out
PR=primes();FB=[1,1]
while len(FB)<50:FB.append(FB[-1]+FB[-2])
def strand(p,n):
    if p['k']=='arith':return F(p['a']+n*p['d'])
    if p['k']=='geo':return F(p['a']*p['r']**n)
    if p['k']=='quad':return F(p['a']+n*p['d'])+p['s']*math.comb(n,2)
    a,b=map(F,(p['a'],p['b']))
    for _ in range(n):a,b=b,a+b
    return a
def parts(p,n):
    kind,*v=p
    return {'arith':lambda:v[0]+n*v[1],'geo':lambda:v[0]*v[1]**n,'sq':lambda:(n+v[0])**2,'prime':lambda:PR[n+v[0]],'fib':lambda:FB[n+v[0]]}[kind]()
def nl(f,p,n):
    def rec(start,step):
        out=list(map(F,start))
        while len(out)<=n:out.append(F(step(out,len(out))))
        return out[n]
    if f=='arithmetic':return F(p['a']+n*p['d'])
    if f=='geometric':return F(p['a'])*F(p['rn'],p['rd'])**n
    if f=='second-diff':return F(p['a']+n*p['d0']+p['s']*math.comb(n,2))
    if f=='add-index':return F(p['a']+p['m']*(n*(n+1)//2+n*p['s']))
    if f=='squares-plus':return F(p['c']*(p['m']*n+p['s'])**2+p['k'])
    if f=='triangular':return F(p['k']*(n+p['s'])*(n+p['s']+1),2)+p['c']
    if f=='diff-geometric':return F(p['a'])+F(p['g'])*(p['r']**n-1)/(p['r']-1)
    if f=='affine-recurrence':return rec([p['a']],lambda a,i:p['k']*a[-1]+p['c'])
    if f=='fibonacci-like':return rec([p['a'],p['b']],lambda a,i:a[-1]+a[-2])
    if f=='multiply-index':return rec([p['a']],lambda a,i:(i+p['s'])*a[-1]+p['c'])
    if f=='interleaved':return strand(p['strands'][n%2],n//2)
    if f=='alternating-ops':
        def step(a,i):
            k,v=p['ops'][(i-1)%2];return a[-1]+v if k=='add' else a[-1]-v if k=='sub' else a[-1]*v
        return rec([p['a']],step)
    if f=='cubes-plus':return F((n+p['s'])**3+p['lin']*(n+p['s'])+p['k'])
    if f=='pronic':return F((n+p['s'])*(n+p['s']+p['c']))
    if f=='primes':return F(PR[n+p['s']]**2 if p['sq'] else p['al']*PR[n+p['s']]+p['be'])
    if f=='powers-offset':return F(p['b']**(n+p['s'])+p['c'])
    if f=='decimals':return F(p['a'],4)+F(p['g']*n,4)+F(p['s']*n*(n-1),8) if p['k']=='quad' else F(p['a'])*F(p['rn'],p['rd'])**n
    if f=='alternating-signs':
        if p['k']=='aff':return rec([p['a']],lambda a,i:-p['m']*a[-1]+p['c'])
        return F((-1)**(n+p['e'])*((n+p['s'])**2 if p['k']=='sq' else p['a']+n*p['d']))
    if f=='third-diff':return F(p['a']+p['b']*n+p['c']*math.comb(n,2)+p['t']*math.comb(n,3))
    if f=='tribonacci':return rec(p['s'],lambda a,i:sum(a[-3:]))
    if f=='weighted-two-term':return rec(p['s'],lambda a,i:p['p']*a[-1]+p['q']*a[-2]+p['c'])
    if f=='product-recurrence':return rec([p['a'],p['b']],lambda a,i:a[-1]*a[-2]+p['c'])
    if f=='prime-gaps':return F(p['a']+sum(PR[p['s']:p['s']+n]))
    if f=='sum-previous':return rec(p['s'],lambda a,i:sum(a[-p['k']:])+p['c'])
    if f=='digit-sum':
        return rec([p['a']],lambda a,i:a[-1]+(sum if p['f']=='sum' else math.prod)(map(int,str(int(a[-1])))))
    if f=='fractions':return F(FB[n+p['num'][1]],FB[n+p['num'][1]+1]) if p.get('fibPair') else F(parts(p['num'],n),parts(p['den'],n))
    if f=='fibonacci-squares':return F((FB[n+p['s']]**2 if p['k']=='sq' else FB[n+p['s']]*FB[n+p['s']+1])+p['c'])
    if f=='reverse-digits':return rec([p['a']],lambda a,i:a[-1]+int(str(int(a[-1]))[::-1]))
    if f=='square-minus':return rec([p['a']],lambda a,i:a[-1]**2+p['c'])
    if f=='mixed-combo':
        def step(a,i):
            k=i+p['s'] if p['v']=='indexMul' else p['k']
            r=i+p['s'] if p['v']=='plusIndex' else -(i+p['s']) if p['v']=='minusIndex' else (i+p['s'])**2 if p['v']=='plusSquare' else p['c']*p['r']**(i-1) if p['v']=='plusGeometric' else (-1)**(i+1)*p['c'] if p['v']=='altConst' else p['c']
            return k*a[-1]+r
        return rec([p['a']],step)
    raise ValueError(f)
def solve(A,b):
    A=[list(map(F,row))+[F(v)] for row,v in zip(A,b)];n=len(A)
    for j in range(n):
        k=next(k for k in range(j,n) if A[k][j]);A[j],A[k]=A[k],A[j];d=A[j][j];A[j]=[x/d for x in A[j]]
        for i in range(n):
            if i!=j:
                d=A[i][j];A[i]=[x-d*y for x,y in zip(A[i],A[j])]
    return [r[-1] for r in A]
def pattern_wait(p):
    w=p['pattern'];N=len(w);alph=p['alphabet'];weights={c:F(n,d) for c,n,d in p['letterProbs']}
    def pr(c):return weights.get(c,F(1,6) if len(alph)==6 else 1-next(iter(weights.values())))
    A=[[F(int(i==j)) for j in range(N)]for i in range(N)]
    for i in range(N):
        for c in alph:
            s=w[:i]+c;j=max(j for j in range(N+1) if s.endswith(w[:j]))
            if j<N:A[i][j]-=pr(c)
    return solve(A,[1]*N)[0]
def iv(f,p,v):
    s=p.get('scenario')
    if f=='uncertainty-models':
        if s.endswith('-sd'):
            c,d=p['c'],p['d'];vals=[c+d,c-d,-c+d,-c-d] if s=='independent-sum-sd' else [c+d,-c-d] if s=='shared-sum-sd' else [c-d,-c+d]
            mean=F(sum(vals),len(vals));return math.sqrt(sum((x-mean)**2 for x in vals)/len(vals))
        x,y,a,b=p['x'],p['y'],p['a'],p['b'];vals=[]
        for X,Y in itertools.product([x-a,x+a],[y-b,y+b]):
            vals.append(X+Y if s=='sum-bound' else X*Y if s=='product-bound' else F(X,Y) if s=='ratio-bound' else X-Y if s=='difference-bound' else X*X)
        return x-y if s=='shared-offset' else (max if p['upper'] else min)(vals)
    if f=='mental-product':return math.prod(F(str(x)) for x in p['multiply'])/math.prod(F(str(x)) for x in p['divide'])
    if f=='powers-roots':
        return {'sqrt':lambda:math.sqrt(p['x']),'cbrt':lambda:p['x']**(1/3),'pow2':lambda:2**p['k'],'bigpow':lambda:p['b']**p['k'],'compound':lambda:F(p['p'])*(1+F(p['r'],100))**p['n'],'ln':lambda:math.log(p['x']),'exp':lambda:math.exp(p['x'])}[s]()
    if f=='combinatorics':
        if s=='choose':return math.comb(p['n'],p['k'])
        if s=='grid':return math.comb(p['a']+p['b'],p['a'])
        if s=='hearts':return math.comb(13,p['k'])*math.comb(39,5-p['k'])
        return F(math.factorial(len(p['w'])),math.prod(math.factorial(n) for n in Counter(p['w']).values()))
    if f=='dots-count':return sum(i[2]==p['countShape'] for i in p['items'])
    if f=='dice-grid':return sum(p['pips']) if s=='total-pips' else p['pips'].count(p['face'])
    if f=='path-length':return math.fsum(math.dist(a,b) for a,b in zip(p['points'],p['points'][1:]))*p['barUnits']/p['barPx']
    if f=='percentile':
        a=sorted(p['values'])
        return sum(a)/len(a) if s=='mean' else sum(x>=p['threshold'] for x in a) if s=='above' else (a[99]+a[100])/2 if s=='median' else a[math.ceil(p['p']*len(a)/100)-1]
    if f=='series':
        m=p['model'];t=p['target'];return m['a']*m['g']**t if s=='exp' else m['a']+m['b']*t+(m['amp']*math.sin(2*math.pi*t/m['period']) if s=='seasonal' else 0)
    if f=='waiting-time':return pattern_wait(p)
    if f=='coupon':
        ps=[F(n,d)for n,d in p['probs']][p.get('collected',0):]
        return sum(((-1)**(len(S)+1))/sum(S) for k in range(1,len(ps)+1) for S in itertools.combinations(ps,k))
    if f=='expected-dice':
        if s=='sumN':return F(p['n']*(p['m']+1),2)
        if s=='distinct':return 6*(1-F(5,6)**p['n'])
        m=p['m'];fn={'max2':lambda xs:(max if p['which']=='max' else min)(xs),'product':lambda xs:math.prod(xs),'absDiff':lambda xs:abs(xs[0]-xs[1]),'reroll':lambda xs:max(F(xs[0]),F(m+1,2))}[s]
        n=p.get('n',2) if s=='product' else 1 if s=='reroll' else 2
        return sum(map(fn,itertools.product(range(1,m+1),repeat=n)),F(0))/m**n
    if f=='fermi':return {'messages':lambda:p['rate']*p['hours']*3600/1e6,'orders':lambda:p['traders']*p['perHour']*p['hours'],'storage':lambda:p['bytes']*p['rate']*p['hours']*3600/1e9,'latency':lambda:2*p['km']/200,'notional':lambda:p['trades']*p['size']*p['price']/1e6,'ticks':lambda:p['spread']*p['shares']*p['capture']}[s]()
    if f=='rates-weights':
        # Verified separately by the existing independently organised equation residual checks.
        return None
    if f=='prob-estimate':
        n=p['n']
        if s=='birthday':return 100*(1-math.prod(F(365-i,365)for i in range(n)))
        if s=='sixes':return 100*(1-F(5,6)**n)
        if s=='derange':return 100*sum((F((-1)**i,math.factorial(i))for i in range(n+1)),F(0))
        if s=='binomTail':return 100*F(sum(math.comb(n,j)for j in range(p['k'],n+1)),2**n)
        counts={0:1}
        for _ in range(n):
            new=Counter()
            for t,c in counts.items():
                for face in range(1,7):new[t+face]+=c
            counts=new
        return 100*F(sum(c for t,c in counts.items()if t>=p['k']),6**n)
    if f=='prob-exact':return None # Existing exhaustive JS verifier covers every event branch.
    raise ValueError((f,s))
def ll(f,p,v):
    if f=='conditional-rates':
        r=v['rows'];a,b,c,d=[F(row[3],row[2])for row in r];A=F(r[0][3]+r[1][3],r[0][2]+r[1][2]);B=F(r[2][3]+r[3][3],r[2][2]+r[3][2]);P={'aLow':a,'bLow':c,'aHigh':b,'aAll':A,'bAll':B,'stdA':(a+b)/2,'stdB':(c+d)/2,'aGivenHit':F(r[0][3]+r[1][3],sum(x[3]for x in r))};return [P[k]for k in p['statements']]
    if f=='histogram-bins':
        bins=v['bins'];mass=lambda a,b:sum(x['count']for x in bins if x['from']>=a and x['to']<=b);total=mass(-math.inf,math.inf)
        return [F(mass(s['a'],math.inf),total) if s['t']=='gt' else F(mass(-math.inf,s['a']),total) if s['t']=='lt' else F(mass(s['a'],s['b']),total) if s['t']=='between' else F(mass(s['b'],math.inf),mass(s['a'],math.inf))for s in p['statements']]
    if f=='scatter-regions':
        def hit(c,xy):
            x,y=xy;return x>c['a'] if c['t']=='xGt' else y>c['b'] if c['t']=='yGt' else x<c['a'] if c['t']=='xLt' else x>c['a']and y>c['b'] if c['t']=='both' else y>x
        ans=[]
        for st in p['statements']:
            scope=[xy for xy in v['points']if not st.get('given')or hit(st['given'],xy)];ans.append(F(sum(hit(st['cond'],xy)for xy in scope),len(scope)))
        return ans
    if f=='density-curves':
        def cdf(c,x):
            k=c['kind']
            if k=='normal':return (1+math.erf((x-c['mu'])/(c['sd']*math.sqrt(2))))/2
            if k=='skew':return 0 if x<=0 else 1-math.exp(-x/c['th'])*(1+x/c['th'])
            if x<=c['lo']:return 0
            if x>=c['hi']:return 1
            if k=='uniform':return (x-c['lo'])/(c['hi']-c['lo'])
            return (x-c['lo'])**2/((c['hi']-c['lo'])*(c['mode']-c['lo'])) if x<=c['mode'] else 1-(c['hi']-x)**2/((c['hi']-c['lo'])*(c['hi']-c['mode']))
        return [1-cdf(p['curves'][s['curve']],s['a'])if s['t']=='gt' else cdf(p['curves'][s['curve']],s['a'])if s['t']=='lt' else cdf(p['curves'][s['curve']],s['b'])-cdf(p['curves'][s['curve']],s['a'])for s in p['statements']]
    if f=='markov-graph':
        P=[[F(x)for x in row]for row in p['matrix']];n=len(P)
        if p['mode']=='nstep':return [sum(P[p['start']][k]*P[k][j]for k in range(n))for j in p['targets']]
        A=[[P[i][j]-int(i==j)for i in range(n)]for j in range(n-1)]+[[1]*n];pi=solve(A,[0]*(n-1)+[1]);return [pi[j]for j in p['targets']]
    return None
counts=Counter();skips=Counter()
for row in CASES:
    section,f,p=row['section'],row['family'],row['params'];tag=row['seed']
    if section=='nl':
        expected=nl(f,p['coeffs'],p['position']);opts=[F(x['label'].replace('−','-'))for x in row['options']]
        require(opts[row['answerIndex']]==expected,tag+' exact answer');require(len(set(opts))==len(opts),tag+' equivalent options')
        require(all(F(x.replace('−','-'))==nl(f,p['coeffs'],i)for i,x in enumerate(row['answer']['full'])),tag+' full sequence');counts['nl']+=1
    elif section=='iv':
        expected=iv(f,p,row['visual'])
        if expected is None:skips['iv/'+f]+=1;continue
        require(near(expected,row['truth']),tag+f' truth {expected} vs {row["truth"]}');counts['iv']+=1
    elif section=='ll':
        ps=ll(f,p,row['visual'])
        if ps is None:skips['ll/'+f]+=1;continue
        require(all(near(x,s['p'])for x,s in zip(ps,row['statements'])),tag+' probabilities')
        require(sorted(range(3),key=lambda i:-ps[i])==row['order'],tag+' ranking');counts['ll']+=1
    elif section=='ob':
        board=row['board'];byid={i['id']:i for i in board['instruments']};net=[0]*len(board['products']);cash=F(0)
        for trade in row['best']['trades']:
            ins=byid[trade['id']];sign=1 if trade['side']=='buy' else -1
            net=[x+sign*y for x,y in zip(net,ins['legs'])];cash+=-F(str(ins['ask'])) if sign==1 else F(str(ins['bid']))
        require(all(x==0 for x in net)and cash>0 and near(cash,row['best']['profit']),tag+' cash/net');counts['ob']+=1
result={'corpus':len(CASES),'checked':sum(counts.values()),'checkedBySection':dict(counts),'explicitlyDelegatedToExistingJSVerifiers':dict(skips),'limitations':['Python NL checks derive exact displayed values from the stated generator model; they do not prove that a finite prefix has only one conceivable continuation.','LL families not listed as checked retain their existing enumeration/recount/DP verifiers and generated-contract tests.','Orderbooks Python checks cash and exposure, while the independent JS multiset search additionally checks the best primitive package.','Error-model widths and human difficulty are not validated by answer correctness.']}
(ROOT/'evaluation/battery-python-oracle.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
