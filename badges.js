/* ═══════════════════════════════════════════════════════════
   Soda Lab — badges (data and logic only; no UI)
   Loaded before app.js. app.js calls SodaBadges.init(deps) once after load(),
   then evaluateBadges() from finishBrew, Save to shelf and Mix this again.
   Badges are cosmetic: nothing here changes rarity, luck or score.
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const STORE_KEY = 'sodalab.badges';
const STORE_V = 1;

// Thresholds (spec proposals; tune here)
const LAB_REGULAR_BREWS = 25;
const PANTRY_FLAVORS    = 12;
const COMBO_HUNTER      = 10;

const TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
const THEMES = ['brewing', 'rarity', 'variety', 'combos', 'merging', 'daily'];
const BREWS = ['brew', 'merge'];

let D = null;               // deps from app.js (catalogs, helpers, live shelf/count)
let store = emptyStore();
const doneEvents = new Set(); // event:batchId pairs already evaluated this session
const markedSeen = new Set();

function emptyStore() {
  return { v: STORE_V, earned: {}, seen: { bases: [], flavors: [], combos: [] }, unseen: [], retroDone: false, remixFrom: null };
}

/* ───────── helpers over the app's catalog ───────── */

const rank = id => TIERS.indexOf(id);
const comboKeyOf = flavors => (flavors && flavors.length >= 2 ? [flavors[0], flavors[1]].sort().join('+') : null);
const comboOf = flavors => { const k = comboKeyOf(flavors); return k && D.COMBO_NAMES[k] ? k : null; };
function dayOfYearAt(ts) {           // same rule as app.js dayOfYear(), for any timestamp, device-local
  const d = new Date(ts);
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
}
const dailyFlavorAt = ts => D.FLAVORS[dayOfYearAt(ts) % D.FLAVORS.length].id;
const isDemoBottle = b => /^demo\d+$/.test(b.id);
const parentIsMerge = (id, shelf) => {
  const p = shelf.find(x => x.id === id);
  return p ? !!p.merged : /^m/.test(id);   // parent gone: merge ids start with 'm'
};

/* ───────── the 18 definitions ─────────
   ctx = { event, batch, shelf, count, seen, remixFrom }  (batch is null for count-only checks)
   check(ctx) -> bool ; progress(ctx) -> { n, of } ; retro: 'yes' | 'shelf' | 'no' */

const hasBatch = c => !!c.batch;
const BADGES = [
  { id:'first-pour', name:'First Pour', how:'Brew your first batch', tier:'common', theme:'brewing', hidden:false, icon:'first-pour', retro:'yes',
    on: BREWS, check: c => c.count >= 1 },
  { id:'shelf-starter', name:'Shelf Starter', how:'Save a bottle to the shelf', tier:'common', theme:'brewing', hidden:false, icon:'shelf-starter', retro:'yes',
    on: ['save'], check: c => c.shelf.length >= 1 },
  { id:'lab-regular', name:'Lab Regular', how:`Brew ${LAB_REGULAR_BREWS} batches (merges count)`, tier:'uncommon', theme:'brewing', hidden:false, icon:'lab-regular', retro:'yes',
    on: BREWS, check: c => c.count >= LAB_REGULAR_BREWS,
    progress: c => ({ n: Math.min(c.count, LAB_REGULAR_BREWS), of: LAB_REGULAR_BREWS }) },
  { id:'full-glass', name:'Full Glass', how:'Brew with three flavors', tier:'common', theme:'brewing', hidden:false, icon:'full-glass', retro:'yes',
    on: BREWS, check: c => hasBatch(c) && c.batch.flavors.length === 3 },
  { id:'dressed-up', name:'Dressed Up', how:'Brew with any finish other than Clear', tier:'common', theme:'brewing', hidden:false, icon:'dressed-up', retro:'yes',
    on: BREWS, check: c => hasBatch(c) && !!c.batch.finish && c.batch.finish !== 'none' },
  { id:'fully-charmed', name:'Fully Charmed', get how() { return `Brew a bottle with all ${D ? D.MAX_CHARMS : 6} charm spots filled`; }, tier:'rare', theme:'brewing', hidden:false, icon:'fully-charmed', retro:'yes',
    on: BREWS, check: c => hasBatch(c) && (c.batch.charms || []).length >= D.MAX_CHARMS },
  { id:'lucky-pour', name:'Lucky Pour', how:'Roll Rare or better', tier:'uncommon', theme:'rarity', hidden:false, icon:'lucky-pour', retro:'shelf',
    on: BREWS, check: c => hasBatch(c) && rank(c.batch.rarity) >= rank('rare') },
  { id:'epic-find', name:'Epic Find', how:'Roll Epic or better', tier:'rare', theme:'rarity', hidden:false, icon:'epic-find', retro:'shelf',
    on: BREWS, check: c => hasBatch(c) && rank(c.batch.rarity) >= rank('epic') },
  { id:'legend-in-a-bottle', name:'Legend in a Bottle', how:'Roll Legendary or better', tier:'epic', theme:'rarity', hidden:false, icon:'legend-in-a-bottle', retro:'shelf',
    on: BREWS, check: c => hasBatch(c) && rank(c.batch.rarity) >= rank('legendary') },
  { id:'mythic', name:'Mythic', how:'Roll a Mythic', tier:'mythic', theme:'rarity', hidden:true, hint:'Rarer than rare. Finishes, charms and merges tilt the odds.', icon:'mythic', retro:'shelf',
    on: BREWS, check: c => hasBatch(c) && c.batch.rarity === 'mythic' },
  { id:'base-tour', name:'Base Tour', get how() { return `Brew with all ${D ? D.BASES.length : 4} bases`; }, tier:'uncommon', theme:'variety', hidden:false, icon:'base-tour', retro:'shelf',
    on: BREWS, check: c => c.seen.bases.length >= D.BASES.length,
    progress: c => ({ n: c.seen.bases.length, of: D.BASES.length }) },
  { id:'pantry-explorer', name:'Pantry Explorer', how:`Brew with ${PANTRY_FLAVORS} different flavors`, tier:'rare', theme:'variety', hidden:false, icon:'pantry-explorer', retro:'shelf',
    on: BREWS, check: c => c.seen.flavors.length >= PANTRY_FLAVORS,
    progress: c => ({ n: Math.min(c.seen.flavors.length, PANTRY_FLAVORS), of: PANTRY_FLAVORS }) },
  { id:'secret-recipe', name:'Secret Recipe', how:'Brew your first named combo', tier:'uncommon', theme:'combos', hidden:false, hint:'Some pairs have names. Try two flavors that belong together.', icon:'secret-recipe', retro:'yes',
    on: BREWS, check: c => c.seen.combos.length >= 1 },
  { id:'combo-hunter', name:'Combo Hunter', how:`Find ${COMBO_HUNTER} named combos`, tier:'epic', theme:'combos', hidden:false, icon:'combo-hunter', retro:'shelf',
    on: BREWS, check: c => c.seen.combos.length >= COMBO_HUNTER,
    progress: c => ({ n: Math.min(c.seen.combos.length, COMBO_HUNTER), of: COMBO_HUNTER }) },
  { id:'fusion', name:'Fusion', how:'Merge two bottles', tier:'uncommon', theme:'merging', hidden:false, icon:'fusion', retro:'yes',
    on: ['merge'], check: c => hasBatch(c) && !!c.batch.merged },
  { id:'family-tree', name:'Family Tree', how:'Merge a bottle that was itself a merge', tier:'epic', theme:'merging', hidden:true, hint:'What happens if a merged bottle merges again?', icon:'family-tree', retro:'yes',
    on: ['merge'], check: c => hasBatch(c) && !!c.batch.merged && (c.batch.lineage || []).some(id => parentIsMerge(id, c.shelf)) },
  { id:'flavor-of-the-day', name:'Flavor of the Day', how:"Brew with that day's flavor", tier:'uncommon', theme:'daily', hidden:false, icon:'flavor-of-the-day', retro:'yes',
    on: BREWS, check: c => hasBatch(c) && c.batch.flavors.includes(dailyFlavorAt(c.batch.date)) },
  { id:'encore', name:'Encore', how:'Use Mix this again, then brew', tier:'common', theme:'brewing', hidden:false, icon:'encore', retro:'no',
    on: ['brew'], check: c => !!c.remixFrom },
];
const BY_ID = Object.fromEntries(BADGES.map(b => [b.id, b]));
const ORDER = Object.fromEntries(BADGES.map((b, i) => [b.id, i]));
const byTierDesc = (a, b) => rank(BY_ID[b].tier) - rank(BY_ID[a].tier) || ORDER[a] - ORDER[b];

/* ───────── store: load, validate, persist (merge-on-write) ───────── */

function readRaw() {
  try { return localStorage.getItem(STORE_KEY); } catch (e) { return undefined; }   // undefined = blocked
}
function upgrade(d) {
  // v1 is the first format. Future versions: transform older shapes here, keyed on d.v.
  return d;
}
function sanitizeStore(d) {
  const out = emptyStore();
  if (!D.isObj(d)) return out;
  d = upgrade(d);
  if (D.isObj(d.earned)) {
    for (const [id, e] of Object.entries(d.earned)) {
      if (!BY_ID[id] || !D.isObj(e)) continue;
      const at = D.intIn(e.at, 0, 8.64e15, null);
      if (at === null) continue;
      out.earned[id] = { at };
      if (typeof e.batch === 'string' && D.ID_RE.test(e.batch)) out.earned[id].batch = e.batch;
    }
  }
  const s = D.isObj(d.seen) ? d.seen : {};
  const known = {
    bases: id => D.BASES.some(b => b.id === id),
    flavors: id => D.FLAVORS.some(f => f.id === id),
    combos: id => Object.prototype.hasOwnProperty.call(D.COMBO_NAMES, id),
  };
  for (const k of Object.keys(known)) {
    out.seen[k] = Array.isArray(s[k]) ? [...new Set(s[k].filter(x => typeof x === 'string' && known[k](x)))] : [];
  }
  out.unseen = Array.isArray(d.unseen) ? [...new Set(d.unseen.filter(id => typeof id === 'string' && out.earned[id]))] : [];
  out.retroDone = d.retroDone === true;
  out.remixFrom = typeof d.remixFrom === 'string' && D.ID_RE.test(d.remixFrom) ? d.remixFrom : null;
  return out;
}
function parseStored(raw) {
  if (raw == null) return null;
  try { return sanitizeStore(JSON.parse(raw)); } catch (e) { return emptyStore(); }
}

// Re-read what another tab may have written, merge it into ours, then write.
function persistStore() {
  const theirs = parseStored(readRaw());
  if (theirs) {
    for (const [id, e] of Object.entries(theirs.earned)) {
      const mine = store.earned[id];
      if (!mine || e.at < mine.at) store.earned[id] = e;
    }
    for (const k of ['bases', 'flavors', 'combos']) store.seen[k] = [...new Set([...store.seen[k], ...theirs.seen[k]])];
    store.unseen = [...new Set([...store.unseen, ...theirs.unseen.filter(id => !markedSeen.has(id))])];
    store.retroDone = store.retroDone || theirs.retroDone;
  }
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* blocked: keep in memory */ }
}

/* ───────── evaluation ───────── */

function addSeen(batch) {
  const s = store.seen;
  if (D.BASES.some(b => b.id === batch.base) && !s.bases.includes(batch.base)) s.bases.push(batch.base);
  for (const f of batch.flavors || []) if (D.FLAVORS.some(x => x.id === f) && !s.flavors.includes(f)) s.flavors.push(f);
  const k = comboOf(batch.flavors);
  if (k && !s.combos.includes(k)) s.combos.push(k);
}

function runChecks(event, ctx, at, batchId) {
  const got = [];
  for (const def of BADGES) {
    if (store.earned[def.id] || !def.on.includes(event)) continue;
    let ok = false;
    try { ok = !!def.check(ctx); } catch (e) { ok = false; }
    if (!ok) continue;
    store.earned[def.id] = batchId ? { at, batch: batchId } : { at };
    got.push(def.id);
  }
  return got;
}

/* evaluateBadges(event, ctx) -> string[] of newly earned ids, highest tier first.
   event: 'brew' | 'merge' | 'save' | 'remix'
   ctx:   { batch }            (shelf and count are read from the app when omitted)
   Persists the store, then dispatches one 'badges:unlock' when anything was earned. */
function evaluateBadges(event, ctx = {}) {
  if (!D || D.demo) return [];
  const batch = ctx.batch || null;
  if (event === 'remix') {                               // just remembers the source; safe to repeat
    store.remixFrom = batch && D.ID_RE.test(batch.id) ? batch.id : null;
    persistStore();
    return [];
  }
  if (!['brew', 'merge', 'save'].includes(event)) return [];

  const key = event + ':' + (batch && batch.id);
  if (batch && doneEvents.has(key)) return [];           // same action evaluated twice
  if (batch) doneEvents.add(key);

  const shelf = ctx.shelf || D.shelf();
  const count = typeof ctx.count === 'number' ? ctx.count : D.count();

  if (event !== 'save' && batch) addSeen(batch);
  const c = { event, batch, shelf, count, seen: store.seen, remixFrom: event === 'brew' ? store.remixFrom : null };
  const at = (batch && batch.date) || Date.now();
  const ids = runChecks(event, c, at, batch && batch.id).sort(byTierDesc);
  if (event === 'brew') store.remixFrom = null;          // the next brew uses the remix up, Encore or not
  store.unseen.push(...ids.filter(id => !store.unseen.includes(id)));
  persistStore();
  if (ids.length) document.dispatchEvent(new CustomEvent('badges:unlock', { detail: { ids, source: event } }));
  return ids;
}

function clearRemixFrom() {
  if (!D || D.demo || store.remixFrom === null) return;
  store.remixFrom = null;
  persistStore();
}

/* ───────── retro pass: once, quiet ───────── */

function retroPass() {
  const shelf = D.shelf().filter(b => !isDemoBottle(b)).slice().sort((a, b) => a.date - b.date || a.num - b.num);
  const before = new Set(Object.keys(store.earned));
  const fullShelf = D.shelf();
  for (const b of shelf) {
    addSeen(b);
    const c = { batch: b, shelf: fullShelf, count: b.num, seen: store.seen, remixFrom: null };
    for (const ev of [b.merged ? 'merge' : 'brew', 'save']) {
      c.event = ev;
      for (const def of BADGES) {
        if (def.retro === 'no' || store.earned[def.id] || !def.on.includes(ev)) continue;
        let ok = false;
        try { ok = !!def.check(c); } catch (e) { ok = false; }
        if (ok) store.earned[def.id] = { at: b.date, batch: b.id };
      }
    }
  }
  // what only `count` proves (unsaved past brews); demo seeding bumped count once per demo bottle
  const count = Math.max(0, D.count() - D.shelf().filter(isDemoBottle).length);
  const c = { event: 'brew', batch: null, shelf: fullShelf, count, seen: store.seen, remixFrom: null };
  for (const id of ['first-pour', 'lab-regular']) {
    if (!store.earned[id] && BY_ID[id].check(c)) store.earned[id] = { at: Date.now() };
  }
  const fresh = Object.keys(store.earned).filter(id => !before.has(id)).sort(byTierDesc);
  store.unseen.push(...fresh.filter(id => !store.unseen.includes(id)));
  store.retroDone = true;
  persistStore();
  return fresh;
}

/* ───────── read helpers for the UI ───────── */

function liveCtx() {
  return { event: null, batch: null, shelf: D ? D.shelf() : [], count: D ? D.count() : 0, seen: store.seen, remixFrom: store.remixFrom };
}

function badgeSummary() {
  return { earned: Object.keys(store.earned).length, total: BADGES.length, unseen: store.unseen.slice() };
}

function badgeState(id) {
  const def = BY_ID[id];
  if (!def) return null;
  const e = store.earned[id] || null;
  const shelf = D ? D.shelf() : [];
  return {
    earned: !!e,
    at: e ? e.at : null,
    batch: e && e.batch ? e.batch : null,
    batchExists: !!(e && e.batch && shelf.some(b => b.id === e.batch)),
    hidden: def.hidden,
    progress: def.progress && D ? def.progress(liveCtx()) : null,
  };
}

function getBadges() {
  return BADGES.map(def => {
    const s = badgeState(def.id);
    const masked = def.hidden && !s.earned;
    return {
      id: def.id,
      name: masked ? '?' : def.name,
      how: masked ? '?' : def.how,
      hint: def.hint || null,
      tier: def.tier,
      theme: def.theme,
      hidden: def.hidden,
      icon: def.icon,
      retro: def.retro,
      earnedAt: s.at,
      batch: s.batch,
      batchExists: s.batchExists,
      progress: masked ? null : s.progress,
      unseen: store.unseen.includes(def.id),
    };
  });
}

function markBadgesSeen(ids) {
  const list = Array.isArray(ids) ? ids : store.unseen.slice();
  list.forEach(id => markedSeen.add(id));
  const before = store.unseen.length;
  store.unseen = store.unseen.filter(id => !list.includes(id));
  if (store.unseen.length !== before && D && !D.demo) persistStore();
}

/* ───────── init ─────────
   deps: { FLAVORS, BASES, COMBO_NAMES, MAX_CHARMS, isObj, ID_RE, intIn,
           shelf: () => saved[], count: () => number, demo: bool } */
function init(deps) {
  D = deps;
  const raw = readRaw();
  const loaded = parseStored(raw);
  store = loaded || emptyStore();
  if (D.demo || store.retroDone) return;
  const fresh = retroPass();
  // after app.js finishes booting, so listeners added later in the same script still hear it
  if (fresh.length) setTimeout(() => document.dispatchEvent(new CustomEvent('badges:welcome', { detail: { count: fresh.length } })), 0);
}

window.SodaBadges = Object.freeze({
  BADGES, TIERS, THEMES, STORE_KEY,
  THRESHOLDS: Object.freeze({ LAB_REGULAR_BREWS, PANTRY_FLAVORS, COMBO_HUNTER }),
  init, evaluateBadges, clearRemixFrom,
  badgeSummary, badgeState, getBadges, markBadgesSeen,
  _store: () => JSON.parse(JSON.stringify(store)),   // for tests and debugging
});

})();
