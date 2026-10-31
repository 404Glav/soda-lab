/* ═══════════════════════════════════════════════════════════
   Soda Lab
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ───────────── data ───────────── */

const FLAVORS = [
  { id:'cola',     name:'Cola',      note:'Vanilla · Spice · Caramel',   color:'#8A4B2A', desc:'The original pharmacy pour. Deep caramel, a whisper of citrus peel and a long, dry finish.', p:{sweet:.72,tart:.22,bitter:.34,spice:.62,herbal:.18} },
  { id:'lemon',    name:'Lemon',     note:'Zest · Sun · Bright',          color:'#E9B33A', desc:'Pressed peel and clean acid. The flavor that makes everything else taste more like itself.', p:{sweet:.30,tart:.88,bitter:.10,spice:.08,herbal:.12} },
  { id:'lime',     name:'Lime',      note:'Sharp · Green · Cool',         color:'#7FB43F', desc:'Tart, green and slightly wild. Cuts through sweetness like a cold knife.', p:{sweet:.22,tart:.92,bitter:.14,spice:.10,herbal:.24} },
  { id:'cherry',   name:'Cherry',    note:'Jam · Almond · Deep',          color:'#BE2F45', desc:'Stewed fruit with a bitter almond edge. Rich, a little nostalgic, never shy.', p:{sweet:.78,tart:.42,bitter:.20,spice:.14,herbal:.10} },
  { id:'orange',   name:'Orange',    note:'Juice · Peel · Warm',          color:'#EE8A34', desc:'Sunlit and round. More juice than peel, with a soft bitter halo at the end.', p:{sweet:.62,tart:.58,bitter:.18,spice:.10,herbal:.10} },
  { id:'grape',    name:'Grape',     note:'Violet · Candy · Soft',        color:'#7A56BE', desc:'Concord grape, floral and faintly candy. Nostalgia in a glass.', p:{sweet:.80,tart:.30,bitter:.10,spice:.06,herbal:.14} },
  { id:'rootbeer', name:'Root Beer', note:'Sassafras · Cream · Woodsy',   color:'#6E4326', desc:'Sassafras, wintergreen and a creamy foam. Tastes like a shade tree.', p:{sweet:.70,tart:.14,bitter:.30,spice:.48,herbal:.42} },
  { id:'ginger',   name:'Ginger',    note:'Heat · Spice · Bite',          color:'#D8A03E', desc:'Fresh rhizome heat that builds slowly and leaves the palate buzzing.', p:{sweet:.34,tart:.30,bitter:.22,spice:.88,herbal:.26} },
  { id:'cream',    name:'Cream',     note:'Vanilla · Silk · Sweet',       color:'#E3D2B0', desc:'Vanilla bean and a silky mouthfeel. Softens every sharp edge it meets.', p:{sweet:.86,tart:.04,bitter:.06,spice:.16,herbal:.06} },
  { id:'berry',    name:'Wild Berry',note:'Forest · Tart · Bloom',        color:'#98356B', desc:'A handful of forest fruit — blackberry, raspberry, something unnamed.', p:{sweet:.64,tart:.62,bitter:.16,spice:.08,herbal:.22} },
  { id:'peach',    name:'Peach',     note:'Stone fruit · Honey · Soft',   color:'#EE9C61', desc:'Ripe stone fruit with honeyed edges and a faint almond skin.', p:{sweet:.74,tart:.36,bitter:.10,spice:.08,herbal:.10} },
  { id:'cucumber', name:'Cucumber',  note:'Water · Fresh · Green',        color:'#8FC48D', desc:'Cool as a garden hose. Barely sweet, endlessly refreshing.', p:{sweet:.18,tart:.16,bitter:.14,spice:.06,herbal:.72} },
  { id:'mint',     name:'Mint',      note:'Cool · Leaf · Clean',          color:'#4FB894', desc:'Spearmint, snapped between your fingers. A cold exhale at the end.', p:{sweet:.24,tart:.14,bitter:.10,spice:.20,herbal:.86} },
  { id:'pineapple',name:'Pineapple', note:'Tropical · Acid · Gold',       color:'#E4BE3C', desc:'Golden, tropical and bracingly tart, with a foamy tropical top note.', p:{sweet:.62,tart:.78,bitter:.14,spice:.10,herbal:.16} },
  { id:'coffee',   name:'Cold Brew', note:'Roast · Bitter · Deep',        color:'#4C3024', desc:'Slow-steeped roast. Bitter, chocolatey, and surprisingly good with citrus.', p:{sweet:.20,tart:.22,bitter:.82,spice:.20,herbal:.18} },
  { id:'rose',     name:'Rose',      note:'Floral · Petal · Delicate',    color:'#DE8199', desc:'Petal-soft and perfumed. A single drop changes the whole glass.', p:{sweet:.46,tart:.16,bitter:.10,spice:.10,herbal:.50} },
];

const BASES = [
  { id:'soda',    name:'Soda',    desc:'Neutral, crisp',  color:'#EAF3F6', fizz:1 },
  { id:'tonic',   name:'Tonic',   desc:'Quinine, dry',    color:'#EEF4EA', fizz:0 },
  { id:'mineral', name:'Mineral', desc:'Salty, round',    color:'#F0EFEA', fizz:0 },
  { id:'cream',   name:'Cream',   desc:'Vanilla, lush',   color:'#F7EEDF', fizz:-1 },
];

const TEMPS = [
  { id:'ice',     label:'Over ice' },
  { id:'chilled', label:'Chilled' },
  { id:'room',    label:'Room temp' },
];

const SUFFIXES = ['Fizz','Spritz','Spark','Haze','Bloom','Noir','Crush','Drift','Glow','Mist','Splash','Tonic'];

const COMBOS = {
  'cherry+cola':'Cherry Cola',
  'lemon+lime':'Citrus Split',
  'grape+cream':'Grape Float',
  'cream+rootbeer':'Root Beer Float',
  'cola+orange':'Orange Cola',
  'ginger+lime':'Ginger Lime',
  'cream+peach':'Peach Cream',
  'lime+mint':'Mint Lime Cooler',
  'berry+cream':'Berry Cream',
  'coffee+cream':'Cold Brew Cream',
  'cucumber+mint':'Garden Cooler',
  'ginger+peach':'Peach Ginger',
  'lemon+rose':'Rose Lemonade',
  'berry+lime':'Wild Lime',
  'cola+coffee':'Cola Noir',
};

const SWEET_WORDS = ['Bone dry','Barely sweet','Light','Balanced','Sweet','Candy'];
const FIZZ_WORDS  = ['Still','Soft','Gentle','Crisp','Lively','Volcanic'];
const FIZZ_ADJ    = ['still','soft','gentle','crisp','lively','wild'];

const CURATED = ['cola','cherry','lemon','lime','orange','grape','cream','rootbeer'];

/* ───────────── color utils ───────────── */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function rgbToHex(r, g, b) {
  return '#' + [r,g,b].map(v => clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
}
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t);
}
const lighten = (c, t) => mixHex(c, '#ffffff', t);
const darken  = (c, t) => mixHex(c, '#000000', t);
const rgba    = (c, a) => { const [r,g,b] = hexToRgb(c); return `rgba(${r},${g},${b},${a})`; };

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      default: h = ((r - g) / d + 4);
    }
    h *= 60;
  }
  return { h, s, l };
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2*l - 1)) * s;
  const x = c * (1 - Math.abs(((h/60) % 2) - 1));
  const m = l - c/2;
  let r=0,g=0,b=0;
  if (h < 60)      { r=c; g=x; }
  else if (h < 120){ r=x; g=c; }
  else if (h < 180){ g=c; b=x; }
  else if (h < 240){ g=x; b=c; }
  else if (h < 300){ r=x; b=c; }
  else             { r=c; b=x; }
  return rgbToHex((r+m)*255, (g+m)*255, (b+m)*255);
}
function luminance(c) {
  const [r,g,b] = hexToRgb(c).map(v => {
    v /= 255;
    return v <= .03928 ? v/12.92 : Math.pow((v + .055)/1.055, 2.4);
  });
  return .2126*r + .7152*g + .0722*b;
}
const readableOn = c => luminance(c) > .44 ? '#0B0B0C' : '#FFFFFF';

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ───────────── the blend ───────────── */

const flavorById = id => FLAVORS.find(f => f.id === id);
const baseById   = id => BASES.find(b => b.id === id) || BASES[0];
const fname      = id => (flavorById(id) || { name: 'Unknown' }).name;

const BASE_ACCENT = { soda:'#8FCFE0', tonic:'#B4D6A4', mineral:'#C6D4D9', cream:'#E8CFA4' };

function blendColor(mix) {
  const fs = mix.flavors.map(flavorById).filter(Boolean);
  if (!fs.length) {
    const b = baseById(mix.base);
    return mixHex(b.color, BASE_ACCENT[b.id] || BASE_ACCENT.soda, .8);
  }

  let x = 0, y = 0, sat = 0, lig = 0;
  fs.forEach(f => {
    const { h, s, l } = rgbToHsl(...hexToRgb(f.color));
    const w = 1;
    x += Math.cos(h * Math.PI / 180) * w;
    y += Math.sin(h * Math.PI / 180) * w;
    sat += s; lig += l;
  });
  let hue = Math.atan2(y, x) * 180 / Math.PI;
  if (hue < 0) hue += 360;
  sat /= fs.length; lig /= fs.length;

  const s = clamp(sat * .92 + .14, .48, .92);
  const l = clamp(lig * .52 + .28 + (mix.sweet - 3) * .012, .44, .63);
  return hslToHex(hue, s, l);
}

function profileOf(mix) {
  const p = { sweet:.20, tart:.12, bitter:.08, spice:.08, herbal:.08 };
  mix.flavors.map(flavorById).filter(Boolean).forEach(f => {
    for (const k in p) p[k] += (f.p[k] || 0) * .56;
  });
  p.sweet += (mix.sweet - 3) * .07;
  p.tart  += (mix.fizz - 3) * .015;
  for (const k in p) p[k] = clamp(p[k], .04, 1);
  return p;
}

function makeName(mix) {
  const fs = mix.flavors.map(flavorById).filter(Boolean);
  if (!fs.length) return 'Plain Sparkle';

  if (fs.length >= 2) {
    const key = [fs[0].id, fs[1].id].sort().join('+');
    if (COMBOS[key]) return COMBOS[key];
  }

  const h = hashStr(mix.flavors.join('') + mix.base + mix.sweet + mix.fizz);
  const suffix = SUFFIXES[h % SUFFIXES.length];
  let stem = fs.map(f => f.name).join(' ');
  if (stem.length > 15 && fs.length > 2) stem = fs.slice(0, 2).map(f => f.name).join(' ');
  return `${stem} ${suffix}`;
}

function notesFor(mix) {
  const p = profileOf(mix);
  const fs = mix.flavors.map(flavorById).filter(Boolean);
  const bits = [];
  if (p.sweet > .58) bits.push('a soft, rounded sweetness');
  else if (p.sweet < .32) bits.push('a bone-dry edge');
  if (p.tart > .52) bits.push('a bright acidic snap');
  if (p.spice > .46) bits.push('warm spice on the back palate');
  if (p.bitter > .46) bits.push('a gentle bitter shadow');
  if (p.herbal > .46) bits.push('a cool herbal lift');

  const a = bits[0] || 'a clean, quiet body';
  const b = bits[1] || 'an easy finish';
  const lead = fs.length
    ? `${fs.map(f => f.name.toLowerCase()).join(' and ')} over ${baseById(mix.base).name.toLowerCase()}, served ${TEMP_LABEL(mix.temp)}.`
    : `Unflavored ${baseById(mix.base).name.toLowerCase()}, served ${TEMP_LABEL(mix.temp)}.`;

  return `${cap(lead)} ${cap(a)} leads, ${b} follows, and the carbonation stays ${FIZZ_ADJ[mix.fizz]}.`;
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const TEMP_LABEL = id => (TEMPS.find(t => t.id === id) || TEMPS[0]).label.toLowerCase();

/* ───────────── the bottle ───────────── */

const BODY = 'M74 20 C74 34 84 42 90 58 C96 74 98 86 98 102 L98 212 C98 226 88 234 74 234 L46 234 C32 234 22 226 22 212 L22 102 C22 86 24 74 30 58 C36 42 46 34 46 20 Z';
let uidCounter = 0;

function bottleSVG(opts) {
  const o = Object.assign({ color:'#9BD3E8', fill:.78, fizz:3, seed:1, animate:false, cls:'' }, opts);
  const uid = 'v' + (++uidCounter);
  const color = o.color;
  const light = lighten(color, .26);
  const dark  = darken(color, .22);
  const surface = Math.round(226 - clamp(o.fill, .04, .94) * 168);
  const rx = surface > 108 ? 37 : 30;
  const rise = -(226 - surface);

  const rnd = mulberry32(o.seed || 1);
  const count = o.fizz <= 0 ? 0 : Math.round(4 + o.fizz * 4.5);
  let bubbles = '';
  for (let i = 0; i < count; i++) {
    const cx = 32 + rnd() * 56;
    const cy = 222 + rnd() * 8;
    const r = 1.1 + rnd() * 2.2;
    const dur = 2.1 + rnd() * 2.4;
    const delay = -rnd() * dur;
    bubbles += `<circle class="bub" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" style="--rise:${rise}px;animation-duration:${dur.toFixed(2)}s;animation-delay:${delay.toFixed(2)}s"/>`;
  }

  const offset = o.animate ? (250 - surface) : 0;

  return `<svg class="bottle ${o.cls}" viewBox="0 0 120 250" role="img" aria-label="A bottle of soda">
    <defs>
      <clipPath id="bc-${uid}"><path d="${BODY}"/></clipPath>
      <clipPath id="lc-${uid}"><rect x="0" y="${surface}" width="120" height="${252 - surface}"/></clipPath>
      <linearGradient id="lg-${uid}" x1="0" y1="0" x2=".4" y2="1">
        <stop offset="0" stop-color="${light}"/>
        <stop offset=".5" stop-color="${color}"/>
        <stop offset="1" stop-color="${dark}"/>
      </linearGradient>
      <linearGradient id="gg-${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".55"/>
        <stop offset=".16" stop-color="#fff" stop-opacity=".08"/>
        <stop offset=".52" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".86" stop-color="#fff" stop-opacity=".13"/>
        <stop offset="1" stop-color="#fff" stop-opacity=".42"/>
      </linearGradient>
    </defs>
    <ellipse class="bottle-shadow" cx="60" cy="242" rx="33" ry="5"/>
    <g clip-path="url(#bc-${uid})">
      <g class="liquid" style="transform:translateY(${offset}px)">
        <rect x="0" y="${surface}" width="120" height="${252 - surface}" fill="url(#lg-${uid})"/>
        <g clip-path="url(#lc-${uid})">${bubbles}</g>
        <ellipse cx="60" cy="${surface}" rx="${rx}" ry="3.4" fill="${lighten(color,.45)}" opacity=".8"/>
      </g>
      <path d="${BODY}" fill="url(#gg-${uid})"/>
      <path d="${BODY}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.1"/>
    </g>
    <rect x="40" y="3" width="40" height="19" rx="8" fill="#17171B"/>
    <rect x="40" y="3" width="40" height="19" rx="8" fill="none" stroke="rgba(255,255,255,.16)"/>
    <rect x="46" y="7.5" width="28" height="3" rx="1.5" fill="rgba(255,255,255,.18)"/>
  </svg>`;
}

/* ───────────── state ───────────── */

const KEY = 'sodalab.v1';

const defaultMix = () => ({ base:'soda', flavors:[], sweet:3, fizz:3, temp:'ice' });

const state = {
  view: 'home',
  mix: defaultMix(),
  saved: [],
  count: 0,
  lastBatch: null,
  pending: null,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (Array.isArray(d.saved)) state.saved = d.saved;
    if (typeof d.count === 'number') state.count = d.count;
    if (d.mix && Array.isArray(d.mix.flavors)) state.mix = Object.assign(defaultMix(), d.mix);
  } catch (e) { /* storage unavailable — carry on */ }
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ saved: state.saved, count: state.count, mix: state.mix }));
  } catch (e) { /* ignore */ }
}

/* ───────────── dom refs ───────────── */

const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const views     = $('#views');
const tabbar    = $('#tabbar');
const sheetLayer= $('#sheetLayer');
const sheetBody = $('#sheetBody');
const brewLayer = $('#brewLayer');
const brewBottle= $('#brewBottle');
const brewStep  = $('#brewStep');
const brewBar   = $('#brewBar');
const toastEl   = $('#toast');

const TAB_VIEWS = ['home', 'shelf', 'flavors'];

/* ───────────── router ───────────── */

function go(name, dir = 'push') {
  const next = document.querySelector(`.view[data-view="${name}"]`);
  const cur  = document.querySelector('.view.is-active');
  if (!next || next === cur) return;

  const enterCls = dir === 'fade' ? 'enter-fade' : dir === 'pop' ? 'enter-left' : 'enter-right';
  next.classList.add(enterCls);
  void next.offsetWidth;
  next.classList.add('is-active');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    next.classList.remove('enter-right', 'enter-left', 'enter-fade');
  }));
  if (cur) cur.classList.remove('is-active');

  state.view = name;
  tabbar.classList.toggle('is-hidden', !TAB_VIEWS.includes(name));

  if (name === 'home')  { renderHome(); next.scrollTop = 0; }
  if (name === 'shelf') { renderShelf(); next.scrollTop = 0; }
  if (name === 'flavors') { renderFlavorList(); next.scrollTop = 0; }
  if (name === 'mix')   { renderMix(); }
  if (name === 'result') { $('#resultBody').scrollTop = 0; }

  updateTabs(name);
}

function updateTabs(name = state.view) {
  $$('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.go === name));
}

function back() { go('home', 'pop'); }

document.addEventListener('click', e => {
  const goEl = e.target.closest('[data-go]');
  if (goEl) {
    e.preventDefault();
    const target = goEl.dataset.go;
    if (target === 'mix' && state.view !== 'mix') {
      go('mix', 'push');
    } else if (TAB_VIEWS.includes(target)) {
      go(target, TAB_VIEWS.includes(state.view) ? 'fade' : 'pop');
    } else {
      go(target, 'push');
    }
    return;
  }
  if (e.target.closest('[data-back]')) { e.preventDefault(); back(); }
});

/* ───────────── home ───────────── */

function renderHome() {
  const hour = new Date().getHours();
  $('#greeting').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const mix = state.mix;
  const color = blendColor(mix);
  const fs = mix.flavors.map(flavorById).filter(Boolean);
  const hasFlavors = fs.length > 0;
  const hero = $('#homeHero');

  hero.style.background = `
    radial-gradient(115% 105% at 92% 4%, ${rgba(lighten(color,.42), .55)} 0%, ${rgba(lighten(color,.72), .28)} 46%, transparent 74%),
    linear-gradient(160deg, ${lighten(color,.76)} 0%, ${lighten(color,.88)} 100%)`;

  hero.innerHTML = `
    <div class="hero-copy">
      <div class="hero-kicker">${hasFlavors ? 'In the lab' : 'The lab is open'}</div>
      <div class="hero-title">${hasFlavors ? makeName(mix) : 'Mix something bright.'}</div>
      <div class="hero-sub">${hasFlavors
        ? `${baseById(mix.base).name} · ${fs.map(f => f.name).join(', ')}`
        : 'Four bases, sixteen flavors, one very good glass.'}</div>
      <button class="hero-btn">
        ${hasFlavors ? 'Continue' : 'Start a batch'}
        <svg viewBox="0 0 24 24" width="15" height="15"><path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <div class="hero-art">${bottleSVG({ color, fill:.8, fizz:mix.fizz, seed:7 })}</div>`;

  hero.onclick = () => go('mix', 'push');

  const row = $('#homeShelf');
  if (!state.saved.length) {
    row.innerHTML = `<button class="placeholder-card" data-go="mix">
      <span class="plus">+</span>
      <span>Brew your<br>first batch</span>
    </button>`;
  } else {
    row.innerHTML = state.saved.slice(0, 6).map(b => `
      <button class="mini-card" data-batch="${b.id}">
        <div class="mini-art" style="background:linear-gradient(160deg, ${lighten(b.color,.86)}, ${lighten(b.color,.94)})">
          ${bottleSVG({ color:b.color, fill:.8, fizz:b.fizz, seed:hashStr(b.id) % 999 })}
        </div>
        <div class="mini-name">${b.name}</div>
        <div class="mini-meta">${dateLabel(b.date)} · ${b.sweet}/5 sweet</div>
      </button>`).join('');
  }

  const daily = FLAVORS[dayOfYear() % FLAVORS.length];
  $('#dailyFlavor').innerHTML = `
    <button class="daily-card" data-flavor="${daily.id}">
      <div class="daily-swatch" style="background:linear-gradient(150deg, ${lighten(daily.color,.28)}, ${darken(daily.color,.06)})"></div>
      <div class="daily-copy">
        <div class="daily-name">${daily.name}</div>
        <div class="daily-note">${daily.note}</div>
      </div>
      <svg class="daily-chev" viewBox="0 0 24 24" width="18" height="18"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>`;
}

function dayOfYear() {
  const d = new Date();
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
}

function dateLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, now)) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (same(d, y)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
}

/* ───────────── mix ───────────── */

function renderMix() {
  const mix = state.mix;
  const color = blendColor(mix);
  const fs = mix.flavors.map(flavorById).filter(Boolean);

  $('#mixWash').style.background = `
    radial-gradient(52% 48% at 50% 40%, ${rgba(color, .34)} 0%, ${rgba(color, .10)} 52%, transparent 74%),
    radial-gradient(40% 42% at 24% 62%, ${rgba(lighten(color,.3), .30)} 0%, transparent 70%)`;

  $('#mixBottle').innerHTML = bottleSVG({
    color, fill: fs.length ? .82 : .62, fizz: mix.fizz, seed: 21,
  });

  $('#mixName').textContent = makeName(mix);
  $('#mixSub').textContent = fs.length
    ? `${baseById(mix.base).name} · ${fs.map(f => f.name).join(', ')}`
    : `${baseById(mix.base).name} · no flavors yet`;

  // base options
  $('#baseRow').innerHTML = BASES.map(b => `
    <button class="base-opt" data-base="${b.id}" aria-pressed="${mix.base === b.id}">
      <span class="dot" style="background:${b.color}"></span>
      <span class="lbl">${b.name}</span>
    </button>`).join('');

  // flavor chips
  const visible = visibleFlavors();
  $('#flavorChips').innerHTML = visible.map(f => {
    const on = mix.flavors.includes(f.id);
    const locked = !on && mix.flavors.length >= 3;
    return `<button class="chip ${locked ? 'is-locked' : ''}" data-flavor-toggle="${f.id}" aria-pressed="${on}">
      <span class="sw" style="background:${f.color}"></span>
      <span class="nm">${f.name}</span>
    </button>`;
  }).join('') + `<button class="chip chip--wide" data-all-flavors>
      <span class="nm">All ${FLAVORS.length} flavors</span>
    </button>`;

  $('#flavorCount').textContent = `${mix.flavors.length} / 3`;

  // dials
  syncDial('sweet');
  syncDial('fizz');

  // serve
  $('#tempRow').innerHTML = TEMPS.map(t => `
    <button class="temp-opt" data-temp="${t.id}" aria-pressed="${mix.temp === t.id}">${t.label}</button>`).join('');

  // hint
  $('#mixHint').textContent = fs.length === 0
    ? 'Pick a base and up to three flavors. The lab handles the rest.'
    : fs.length >= 3
      ? 'Three flavors is the sweet spot. Anything more and the glass gets confused.'
      : `Tasting ${fs.map(f => f.name.toLowerCase()).join(', ')}. Add ${3 - fs.length} more if you like.`;

  // cta
  const btn = $('#brewBtn');
  const useColor = fs.length > 0;
  btn.style.background = useColor ? color : '#111';
  btn.style.color = useColor ? readableOn(color) : '#fff';
  btn.style.boxShadow = useColor
    ? `0 12px 26px -12px ${rgba(darken(color,.25), .95)}, inset 0 1px 0 rgba(255,255,255,.18)`
    : '';
}

function visibleFlavors() {
  const chosen = state.mix.flavors.map(flavorById).filter(Boolean);
  const rest = CURATED.map(flavorById).filter(f => f && !state.mix.flavors.includes(f.id));
  const list = [...chosen, ...rest];
  const seen = new Set();
  return list.filter(f => (seen.has(f.id) ? false : (seen.add(f.id), true))).slice(0, 6);
}

function syncDial(kind) {
  const mix = state.mix;
  const v = mix[kind];
  const input = $(`#${kind}Range`);
  const label = $(`#${kind}Val`);
  const color = blendColor(mix);
  input.value = v;
  input.style.setProperty('--pct', `${v / 5 * 100}%`);
  input.style.setProperty('--fill', color);
  label.textContent = kind === 'sweet' ? SWEET_WORDS[v] : FIZZ_WORDS[v];
  label.style.color = v > 0 ? darken(color, .15) : 'var(--ink-3)';
}

function toggleFlavor(id) {
  const mix = state.mix;
  const i = mix.flavors.indexOf(id);
  if (i >= 0) mix.flavors.splice(i, 1);
  else if (mix.flavors.length < 3) mix.flavors.push(id);
  else { toast('Three flavors max'); return; }
  persist();
  renderMix();
}

/* ───────────── brewing ───────────── */

let brewTimers = [];

function makeBatch(mix) {
  state.count += 1;
  const color = blendColor(mix);
  return {
    id: 'b' + Date.now().toString(36) + Math.floor(Math.random() * 999).toString(36),
    num: state.count,
    name: makeName(mix),
    base: mix.base,
    flavors: [...mix.flavors],
    sweet: mix.sweet,
    fizz: mix.fizz,
    temp: mix.temp,
    color,
    date: Date.now(),
  };
}

function startBrew() {
  if (brewLayer.classList.contains('is-open')) return;
  const batch = makeBatch(state.mix);
  state.pending = batch;

  brewLayer.style.background = `
    radial-gradient(95% 62% at 50% 30%, ${rgba(batch.color, .30)} 0%, rgba(10,10,12,0) 66%),
    radial-gradient(120% 90% at 50% 100%, ${rgba(darken(batch.color, .35), .30)} 0%, rgba(10,10,12,0) 60%),
    rgba(10,10,12,.87)`;
  brewBottle.innerHTML = bottleSVG({
    color: batch.color, fill: .84, fizz: batch.fizz, seed: 5, animate: true,
  });
  brewStep.textContent = 'Chilling the glass';
  brewStep.style.opacity = 1;
  brewBar.style.width = '0%';

  brewLayer.hidden = false;
  void brewLayer.offsetWidth;
  brewLayer.classList.add('is-open');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const liquid = brewBottle.querySelector('.liquid');
    if (liquid) liquid.style.transform = 'translateY(0)';
  }));

  const steps = ['Chilling the glass', 'Carbonating', 'Balancing the syrup', 'Sealing the batch'];
  const widths = ['22%', '52%', '80%', '100%'];
  brewTimers.forEach(clearTimeout);
  brewTimers = steps.map((s, i) => setTimeout(() => {
    if (i > 0) {
      brewStep.style.opacity = 0;
      setTimeout(() => { brewStep.textContent = s; brewStep.style.opacity = 1; }, 160);
    }
    brewBar.style.width = widths[i];
  }, i * 640));

  brewTimers.push(setTimeout(finishBrew, 2960));
}

function finishBrew() {
  const batch = state.pending;
  brewLayer.classList.remove('is-open');
  setTimeout(() => { brewLayer.hidden = true; }, 460);
  if (!batch) return;
  state.lastBatch = batch;
  state.pending = null;
  renderResult(batch, true);
  go('result', 'push');
  persist();
}

/* ───────────── result ───────────── */

function renderResult(batch, fresh) {
  const mix = { base: batch.base, flavors: batch.flavors, sweet: batch.sweet, fizz: batch.fizz, temp: batch.temp };
  const p = profileOf(mix);
  const color = batch.color;
  const isSaved = state.saved.some(b => b.id === batch.id);

  const bars = [
    ['Sweet', p.sweet], ['Tart', p.tart], ['Bitter', p.bitter], ['Spice', p.spice], ['Herbal', p.herbal],
  ].map(([label, val]) => `
    <div class="bar-row">
      <span class="lbl">${label}</span>
      <span class="bar-track"><span class="bar-fill" data-w="${Math.round(val * 100)}" style="background:${color}"></span></span>
      <span class="num">${Math.round(val * 100)}</span>
    </div>`).join('');

  const stats = [
    ['Sweetness', `${batch.sweet}/5`],
    ['Fizz', `${batch.fizz}/5`],
    ['Serve', (TEMPS.find(t => t.id === batch.temp) || TEMPS[0]).label],
  ].map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');

  $('#resultBody').innerHTML = `
    <div class="result-top">
      <button class="icon-btn" data-back aria-label="Back to lab">
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M14.5 5 8 12l6.5 7" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span style="font-size:11.5px;font-weight:650;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)">Batch ${String(batch.num).padStart(3,'0')}</span>
      <button class="icon-btn" id="shareBtn" aria-label="Copy recipe">
        <svg viewBox="0 0 24 24" width="19" height="19"><path d="M12 3v11m0-11 4 4m-4-4-4 4M5 14v4.4c0 1 .8 1.6 1.7 1.6h10.6c1 0 1.7-.6 1.7-1.6V14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>

    <div class="result-hero">
      <div class="result-wash" style="background:
        radial-gradient(46% 42% at 50% 42%, ${rgba(color,.30)} 0%, ${rgba(color,.08)} 55%, transparent 76%)"></div>
      <div class="result-bottle">${bottleSVG({ color, fill:.84, fizz:batch.fizz, seed:11 })}</div>
      <div class="result-eyebrow">${fresh ? 'Freshly brewed' : 'From your shelf'}</div>
      <h1 class="result-name">${batch.name}</h1>
      <div class="result-sub">${baseById(batch.base).name} · ${batch.flavors.map(fname).join(', ')}</div>
    </div>

    <div class="stat-row">${stats}</div>

    <div class="panel">
      <div class="panel-title">Tasting notes</div>
      <p class="notes-copy">${notesFor(mix)}</p>
    </div>

    <div class="panel">
      <div class="panel-title">Flavor profile</div>
      ${bars}
    </div>

    <div class="result-actions">
      <button class="btn-primary" id="saveBtn" ${isSaved ? 'disabled style="background:rgba(11,11,12,.07);color:var(--ink-3);box-shadow:none"' : ''}>
        ${isSaved ? 'Saved to shelf' : 'Save to shelf'}
      </button>
      <button class="btn-ghost" id="againBtn">Mix another</button>
    </div>`;

  requestAnimationFrame(() => {
    $$('#resultBody .bar-fill').forEach(el => { el.style.width = el.dataset.w + '%'; });
  });

  $('#saveBtn')?.addEventListener('click', () => {
    if (state.saved.some(b => b.id === batch.id)) return;
    state.saved.unshift(batch);
    persist();
    const btn = $('#saveBtn');
    btn.textContent = 'Saved to shelf';
    btn.disabled = true;
    btn.style.background = 'rgba(11,11,12,.07)';
    btn.style.color = 'var(--ink-3)';
    btn.style.boxShadow = 'none';
    toast('Added to your shelf');
  });

  $('#againBtn')?.addEventListener('click', () => {
    state.mix = defaultMix();
    persist();
    renderMix();
    go('mix', 'pop');
  });

  $('#shareBtn')?.addEventListener('click', () => {
    const txt = `${batch.name} — Soda Lab\n${baseById(batch.base).name}, ${batch.flavors.map(fname).join(', ')}\nSweetness ${batch.sweet}/5 · Fizz ${batch.fizz}/5 · ${(TEMPS.find(t => t.id === batch.temp) || TEMPS[0]).label}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(() => toast('Recipe copied'), () => toast('Could not copy'));
    else toast('Recipe copied');
  });
}

/* ───────────── shelf ───────────── */

function renderShelf() {
  const grid = $('#shelfGrid');
  const empty = $('#shelfEmpty');
  if (!state.saved.length) {
    grid.innerHTML = '';
    grid.hidden = true;
    empty.hidden = false;
    return;
  }
  grid.hidden = false;
  empty.hidden = true;
  grid.innerHTML = state.saved.map(b => `
    <button class="batch-card" data-batch="${b.id}">
      <div class="batch-art" style="background:linear-gradient(155deg, ${lighten(b.color,.84)} 0%, ${lighten(b.color,.93)} 100%)">
        ${bottleSVG({ color:b.color, fill:.8, fizz:b.fizz, seed:hashStr(b.id) % 997 })}
      </div>
      <div class="batch-name">${b.name}</div>
      <div class="batch-meta">${dateLabel(b.date)} · ${b.flavors.length || 0} flavor${b.flavors.length === 1 ? '' : 's'}</div>
    </button>`).join('');
}

/* ───────────── flavors list ───────────── */

let flavorQuery = '';

function renderFlavorList() {
  const q = flavorQuery.trim().toLowerCase();
  const list = FLAVORS.filter(f =>
    !q || f.name.toLowerCase().includes(q) || f.note.toLowerCase().includes(q)
  );
  const host = $('#flavorList');

  if (!list.length) {
    host.innerHTML = `<div class="empty" style="padding-top:30px">
      <h3>No flavor found</h3><p>Try “citrus”, “herbal” or “cola”.</p></div>`;
    return;
  }

  host.innerHTML = list.map(f => `
    <button class="flavor-row" data-flavor="${f.id}">
      <span class="sw" style="background:linear-gradient(150deg, ${lighten(f.color,.25)}, ${darken(f.color,.08)})"></span>
      <span class="fr-copy">
        <span class="fr-name">${f.name}</span>
        <span class="fr-note">${f.note}</span>
      </span>
      <span class="fr-add">+</span>
    </button>`).join('');
}

/* ───────────── sheets ───────────── */

let sheetTimer = null;

function openSheet(html) {
  clearTimeout(sheetTimer);
  sheetBody.innerHTML = html;
  sheetLayer.hidden = false;
  void sheetLayer.offsetWidth;
  sheetLayer.classList.add('is-open');
}
function closeSheet() {
  sheetLayer.classList.remove('is-open');
  clearTimeout(sheetTimer);
  sheetTimer = setTimeout(() => { sheetLayer.hidden = true; }, 520);
}

sheetLayer.addEventListener('click', e => {
  if (e.target.closest('[data-close-sheet]')) closeSheet();
});

function openFlavorSheet(id) {
  const f = flavorById(id);
  if (!f) return;
  const inMix = state.mix.flavors.includes(id);
  openSheet(`
    <div class="sheet-hero" style="background:linear-gradient(150deg, ${lighten(f.color,.72)}, ${lighten(f.color,.88)})">
      <div style="width:44px">${bottleSVG({ color:f.color, fill:.8, fizz:3, seed:hashStr(f.id) % 500 })}</div>
    </div>
    <h2 class="sheet-title">${f.name}</h2>
    <div class="sheet-note">${f.note}</div>
    <p class="sheet-desc">${f.desc}</p>
    <div class="sheet-actions">
      <button class="btn-primary" data-add-flavor="${f.id}" style="background:${f.color};color:${readableOn(f.color)};box-shadow:0 12px 26px -14px ${rgba(f.color,.9)}">
        ${inMix ? 'Remove from mix' : 'Add to mix'}
      </button>
    </div>`);
}

function openBatchSheet(id) {
  const b = state.saved.find(x => x.id === id);
  if (!b) return;
  const rows = [
    ['Base', baseById(b.base).name],
    ['Flavors', b.flavors.length ? b.flavors.map(fname).join(', ') : 'None'],
    ['Sweetness', SWEET_WORDS[b.sweet]],
    ['Carbonation', FIZZ_WORDS[b.fizz]],
    ['Serve', (TEMPS.find(t => t.id === b.temp) || TEMPS[0]).label],
    ['Brewed', dateLabel(b.date)],
  ].map(([k, v]) => `<div class="sheet-li"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');

  openSheet(`
    <div class="sheet-hero" style="background:linear-gradient(155deg, ${lighten(b.color,.8)}, ${lighten(b.color,.92)})">
      <div style="width:44px">${bottleSVG({ color:b.color, fill:.8, fizz:b.fizz, seed:hashStr(b.id) % 997 })}</div>
    </div>
    <h2 class="sheet-title">${b.name}</h2>
    <div class="sheet-note">Batch ${String(b.num).padStart(3,'0')}</div>
    <div class="sheet-list">${rows}</div>
    <div class="sheet-actions">
      <button class="btn-primary" data-remix="${b.id}">Mix this again</button>
      <button class="danger-btn" data-remove-batch="${b.id}">Remove from shelf</button>
    </div>`);
}

function openAllFlavors() {
  openSheet(`
    <h2 class="sheet-title" style="font-size:22px">All flavors</h2>
    <div class="sheet-note">Tap to add or remove. Three per batch.</div>
    <div class="flavor-list sheet-scrolllist" id="sheetFlavorList">
      ${FLAVORS.map(f => {
        const on = state.mix.flavors.includes(f.id);
        return `<button class="flavor-row" data-sheet-toggle="${f.id}">
          <span class="sw" style="background:linear-gradient(150deg, ${lighten(f.color,.25)}, ${darken(f.color,.08)})"></span>
          <span class="fr-copy"><span class="fr-name">${f.name}</span><span class="fr-note">${f.note}</span></span>
          <span class="fr-add" style="${on ? 'background:var(--ink);color:#fff' : ''}">${on ? '✓' : '+'}</span>
        </button>`;
      }).join('')}
    </div>
    <div class="sheet-actions"><button class="btn-ghost" data-close-sheet>Done</button></div>`);
}

function refreshSheetToggles() {
  const host = $('#sheetFlavorList');
  if (!host) return;
  host.querySelectorAll('[data-sheet-toggle]').forEach(btn => {
    const on = state.mix.flavors.includes(btn.dataset.sheetToggle);
    const add = btn.querySelector('.fr-add');
    add.textContent = on ? '✓' : '+';
    add.style.background = on ? 'var(--ink)' : '';
    add.style.color = on ? '#fff' : '';
  });
}

/* ───────────── toast ───────────── */

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 1900);
}

/* ───────────── global events ───────────── */

document.addEventListener('click', e => {
  const t = e.target;

  const baseBtn = t.closest('[data-base]');
  if (baseBtn) { state.mix.base = baseBtn.dataset.base; persist(); renderMix(); return; }

  const chip = t.closest('[data-flavor-toggle]');
  if (chip) { toggleFlavor(chip.dataset.flavorToggle); return; }

  const all = t.closest('[data-all-flavors]');
  if (all) { openAllFlavors(); return; }

  const sheetToggle = t.closest('[data-sheet-toggle]');
  if (sheetToggle) {
    const id = sheetToggle.dataset.sheetToggle;
    const was = state.mix.flavors.includes(id);
    toggleFlavor(id);
    refreshSheetToggles();
    if (!was && state.mix.flavors.includes(id)) toast(`${flavorById(id).name} added`);
    return;
  }

  const tempBtn = t.closest('[data-temp]');
  if (tempBtn) { state.mix.temp = tempBtn.dataset.temp; persist(); renderMix(); return; }

  const addFlavor = t.closest('[data-add-flavor]');
  if (addFlavor) {
    const id = addFlavor.dataset.addFlavor;
    const was = state.mix.flavors.includes(id);
    toggleFlavor(id);
    if (was) toast('Removed from mix');
    else { toast(`${flavorById(id).name} added to the mix`); closeSheet(); setTimeout(() => go('mix', 'push'), 240); }
    return;
  }

  const flavorRow = t.closest('[data-flavor]');
  if (flavorRow) { openFlavorSheet(flavorRow.dataset.flavor); return; }

  const batchEl = t.closest('[data-batch]');
  if (batchEl) { openBatchSheet(batchEl.dataset.batch); return; }

  const remix = t.closest('[data-remix]');
  if (remix) {
    const b = state.saved.find(x => x.id === remix.dataset.remix);
    if (b) {
      state.mix = { base:b.base, flavors:[...b.flavors], sweet:b.sweet, fizz:b.fizz, temp:b.temp };
      persist();
      closeSheet();
      setTimeout(() => go('mix', 'push'), 200);
    }
    return;
  }

  const removeBatch = t.closest('[data-remove-batch]');
  if (removeBatch) {
    state.saved = state.saved.filter(x => x.id !== removeBatch.dataset.removeBatch);
    persist();
    closeSheet();
    renderShelf();
    toast('Removed from shelf');
    return;
  }
});

// sliders
['sweet', 'fizz'].forEach(kind => {
  const el = $(`#${kind}Range`);
  el.addEventListener('input', () => {
    state.mix[kind] = Number(el.value);
    syncDial(kind);
    const color = blendColor(state.mix);
    $('#mixBottle').innerHTML = bottleSVG({
      color, fill: state.mix.flavors.length ? .82 : .62, fizz: state.mix.fizz, seed: 21,
    });
    const btn = $('#brewBtn');
    if (state.mix.flavors.length) btn.style.background = color;
    btn.style.color = state.mix.flavors.length ? readableOn(color) : '#fff';
    persist();
  });
});

$('#brewBtn').addEventListener('click', startBrew);

$('#mixReset').addEventListener('click', () => {
  state.mix = defaultMix();
  persist();
  renderMix();
  toast('Cleared');
});

$('#flavorSearch').addEventListener('input', e => {
  flavorQuery = e.target.value;
  renderFlavorList();
});

// keyboard niceties
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (sheetLayer.classList.contains('is-open')) closeSheet(); }
});

/* ───────────── boot ───────────── */

function demoSeed() {
  if (state.saved.length) return;
  const examples = [
    { base:'soda',    flavors:['cherry','cola'],     sweet:4, fizz:4, temp:'ice' },
    { base:'tonic',   flavors:['lime','mint'],       sweet:2, fizz:5, temp:'ice' },
    { base:'cream',   flavors:['peach'],             sweet:3, fizz:3, temp:'chilled' },
    { base:'mineral', flavors:['cucumber','rose'],   sweet:1, fizz:4, temp:'ice' },
  ];
  examples.forEach((e, i) => {
    state.count += 1;
    state.saved.push(Object.assign({
      id: 'demo' + i,
      num: state.count,
      name: makeName(e),
      color: blendColor(e),
      date: Date.now() - Math.round((i + 1) * 1.2 * 864e5),
    }, e));
  });
  persist();
}

function bootRoute() {
  const m = location.hash.match(/^#\/(home|shelf|flavors|mix|result)\b/);
  if (!m) return false;
  const v = m[1];

  if (v === 'result') {
    let batch = state.lastBatch || state.saved[0];
    if (!batch) {
      const mix = { base:'soda', flavors:['cherry','cola'], sweet:4, fizz:4, temp:'ice' };
      state.count += 1;
      batch = Object.assign({
        id: 'preview', num: state.count, name: makeName(mix),
        color: blendColor(mix), date: Date.now(),
      }, mix);
    }
    renderResult(batch, !state.lastBatch);
    go('result', 'fade');
    return true;
  }
  if (v === 'mix') { go('mix', 'fade'); return true; }
  go(v, 'fade');
  return true;
}

function clock() {
  const d = new Date();
  let h = d.getHours() % 12; if (h === 0) h = 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  $('#sbTime').textContent = `${h}:${m}`;
}

load();
if (new URLSearchParams(location.search).get('demo')) demoSeed();
clock();
setInterval(clock, 15000);

renderHome();
renderShelf();
renderFlavorList();
renderMix();
updateTabs('home');
bootRoute();

})();
