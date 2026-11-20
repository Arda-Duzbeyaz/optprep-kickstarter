export const CHECK_SECTIONS = ['bto','nl','ll','iv','ob'];
export const FORM_NAMES = ['a','b'];
export const CHECK_LENGTH = 5;
const DRILLS_PER_SECTION = 30;
const record = x => !!x && typeof x === 'object' && !Array.isArray(x);
const time = t => Number.isSafeInteger(t) && t >= 0;
const validKey = key => /^(bto|nl|ll|iv|ob):(a|b|drill:[\w-]{1,64})$/.test(key);
const short = x => (typeof x === 'string' && x.length <= 80) || Number.isFinite(x);

function validResponse(r) {
  if (r === null) return true;
  if (!record(r)) return false;
  if ('value' in r) return short(r.value);
  if ('lower' in r || 'upper' in r) return short(r.lower) && short(r.upper);
  if ('order' in r) return Array.isArray(r.order) && r.order.length === 3 &&
    r.order.every(i => [0,1,2].includes(i)) && new Set(r.order).size === 3;
  if (r.pass === true) return true;
  return Array.isArray(r.trades) && r.trades.length <= 6 && r.trades.every(t =>
    record(t) && /^q\d$/.test(t.id) && ['buy','sell'].includes(t.side));
}

export function validCheckSessions(sessions) {
  return record(sessions) && Object.entries(sessions).every(([key,s]) => validKey(key) && record(s) &&
    s.key === key && key.split(':')[0] === s.section && key.split(':')[1] === s.form &&
    time(s.startedAt) && time(s.updatedAt) && s.updatedAt >= s.startedAt &&
    (s.form === 'drill' ? s.endsAt === null : time(s.endsAt) && s.endsAt > s.startedAt) &&
    Number.isFinite(s.multiplier) && s.multiplier >= 1 && s.multiplier <= 10 &&
    Array.isArray(s.answers) && s.answers.length <= CHECK_LENGTH && validResponse(s.draft) &&
    s.answers.every(a => record(a) && time(a.at) && validResponse(a.response) &&
      Number.isFinite(a.score) && a.score >= 0 && a.score <= 1 &&
      (a.skill === undefined || (typeof a.skill === 'string' && /^[a-z\d-]{1,64}$/.test(a.skill))) &&
      (a.direction === undefined || ['below','above','inside'].includes(a.direction))));
}

export function paperDone(s, now = Date.now()) {
  return s.answers.length === CHECK_LENGTH || (s.endsAt !== null && now >= s.endsAt);
}

export function checkFinishedAt(s) {
  return s.answers.length === CHECK_LENGTH ? s.answers[CHECK_LENGTH-1].at : s.endsAt;
}

export function checkTotal(s) {
  return s.answers.reduce((total,a) => total+a.score,0);
}

export function recentChecks(sessions, section, form) {
  return Object.values(sessions).filter(s => s.section === section && (!form || s.form === form))
    .sort((a,b) => b.startedAt-a.startedAt || b.key.localeCompare(a.key));
}

function trim(sessions) {
  const kept = { ...sessions };
  for (const id of CHECK_SECTIONS) {
    for (const s of recentChecks(kept,id,'drill').slice(DRILLS_PER_SECTION)) delete kept[s.key];
  }
  return kept;
}

// A submitted position outranks an old draft. A form's earliest start owns its clock.
export function mergeChecks(local, other) {
  const merged = { ...local };
  for (const [key,b] of Object.entries(other)) {
    const a = merged[key];
    if (!a || (a.startedAt !== b.startedAt ? b.startedAt < a.startedAt :
      b.answers.length > a.answers.length || (b.answers.length === a.answers.length && b.updatedAt > a.updatedAt))) merged[key]=b;
  }
  return trim(merged);
}

export function checkActions({ state, readLatest, save, clock }) {
  const refresh = () => {
    const incoming = readLatest();
    if (incoming && validCheckSessions(incoming)) state().checkSessions = mergeChecks(state().checkSessions,incoming);
    return state().checkSessions;
  };
  return {
    startCheck(section, form, seconds, multiplier = 1) {
      if (!CHECK_SECTIONS.includes(section) || ![...FORM_NAMES,'drill'].includes(form)) throw Error('Unknown practice paper');
      const all = refresh(), now = clock();
      const existing = form === 'drill' ? recentChecks(all,section,form).find(s=>!paperDone(s,now)) : all[section+':'+form];
      if (existing) return existing.key;
      const suffix = form === 'drill' ? ':' + now.toString(36) + '-' + Math.random().toString(36).slice(2,10) : '';
      const key = section+':'+form+suffix;
      const row = { key, section, form, startedAt:now, updatedAt:now,
        endsAt:form==='drill'?null:now+Math.round(seconds*multiplier*1000), multiplier, answers:[], draft:null };
      if (!validCheckSessions({[key]:row})) throw Error('Invalid training clock');
      state().checkSessions=trim({...all,[key]:row}); save(); return key;
    },
    updateCheck(key, index, response, result) {
      const s=refresh()[key], now=clock();
      if (!s || paperDone(s,now) || s.answers.length !== index || !validResponse(response)) return false;
      if (result === undefined) s.draft=structuredClone(response);
      else {
        const answer={ response:structuredClone(response), score:result.score, at:now };
        if (result.direction) answer.direction=result.direction;
        if (result.skill) answer.skill=result.skill;
        if (!Number.isFinite(answer.score) || answer.score < 0 || answer.score > 1) throw Error('Invalid practice score');
        s.answers.push(answer); s.draft=null;
      }
      s.updatedAt=now; save(); return true;
    },
  };
}

export function calibration(sessions, limit = 30, now = Date.now()) {
  const entries = recentChecks(sessions,'iv').filter(s=>s.form === 'drill' || paperDone(s,now)).flatMap(s=>s.answers).filter(a => a.direction && a.response)
    .sort((a,b)=>b.at-a.at).slice(0,limit);
  if (!entries.length) return null;
  const spans = entries.map(a => Number(a.response.upper) / Number(a.response.lower)).sort((a,b)=>a-b);
  const mid = Math.floor(spans.length/2);
  return { n:entries.length, inside:entries.filter(a=>a.direction==='inside').length,
    above:entries.filter(a=>a.direction==='above').length, below:entries.filter(a=>a.direction==='below').length,
    typicalWidth:spans.length%2 ? spans[mid] : (spans[mid-1]+spans[mid])/2 };
}
