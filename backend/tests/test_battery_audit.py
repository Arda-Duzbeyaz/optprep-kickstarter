from copy import deepcopy
import math
from oa_backend.verify import recompute_interval, check_structure
from oa_backend.rank_verify import recompute_rank


def test_partial_coupon_keeps_collected_probability_as_wasted_draws():
    item={'family':'coupon','params':{'scenario':'partial','collected':4,'probs':[[1,6]]*6},'prompt':{}}
    assert abs(recompute_interval(item)-9)<1e-12
    item['params']['collected']=5
    assert abs(recompute_interval(item)-6)<1e-12


def test_conditional_rates_recomputed_from_table_and_wrong_key_rejected():
    rows=[['A','Low',90,18],['A','High',10,9],['B','Low',10,1],['B','High',90,72]]
    item={'kind':'rank','family':'conditional-rates','prompt':{'visual':{'rows':rows}},'params':{'statements':['aAll','bAll','stdA']},'statements':[{'p':.27},{'p':.73},{'p':.55}],'answerOrder':[1,2,0]}
    assert recompute_rank(item)==[.27,.73,.55]
    assert check_structure(item)==[]
    wrong=deepcopy(item);wrong['statements'][0]['p']=.29
    assert any('disagree' in e for e in check_structure(wrong))


def test_unequal_width_histogram_recounts_areas_and_conditional_scope():
    item={'family':'histogram-bins','prompt':{'visual':{'density':True,'bins':[{'from':0,'to':1,'count':9},{'from':1,'to':4,'count':12},{'from':4,'to':6,'count':10}]}},'params':{'statements':[{'t':'gt','a':1},{'t':'between','a':1,'b':4},{'t':'cond','a':1,'b':4}]}}
    assert recompute_rank(item)==[22/31,12/31,10/22]


def test_uncertainty_models_all_finite_cases_and_shared_cancellation():
    for scenario,answer in [('sum-bound',28),('product-bound',132),('ratio-bound',5.5),('difference-bound',18),('square-bound',484),('shared-offset',15)]:
        item={'family':'uncertainty-models','prompt':{},'params':{'scenario':scenario,'x':20,'y':5,'a':2,'b':1,'upper':True}}
        assert recompute_interval(item)==answer
    for scenario,answer in [('independent-sum-sd',5),('shared-sum-sd',7),('shared-difference-sd',1)]:
        item={'family':'uncertainty-models','prompt':{},'params':{'scenario':scenario,'c':3,'d':4}}
        assert math.isclose(recompute_interval(item),answer)
