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
  { id:'blueberry',name:'Blueberry', note:'Forest · Deep · Soft',         color:'#4E63B8', desc:'Wild blueberry with a violet shadow. Sweet up front, cool all the way down.', p:{sweet:.66,tart:.46,bitter:.12,spice:.06,herbal:.18} },
  { id:'raspberry',name:'Raspberry', note:'Jam · Bright · Seed',          color:'#C33A63', desc:'Crushed raspberry, seeds and all. Tart enough to make your jaw tingle.', p:{sweet:.62,tart:.70,bitter:.14,spice:.06,herbal:.12} },
  { id:'watermelon',name:'Watermelon',note:'Summer · Juicy · Light',      color:'#E8606B', desc:'A cold slice on a hot porch. Juicy, pink and barely there.', p:{sweet:.70,tart:.28,bitter:.06,spice:.04,herbal:.10} },
  { id:'mango',    name:'Mango',     note:'Tropical · Honey · Round',     color:'#F0A13C', desc:'Sun-ripened mango, honeyed and round, with a soft resinous edge.', p:{sweet:.76,tart:.44,bitter:.08,spice:.06,herbal:.12} },
  { id:'passion',  name:'Passionfruit',note:'Acid · Floral · Wild',       color:'#E0A22E', desc:'Bracing tropical acid with a floral top note. Not for the timid.', p:{sweet:.48,tart:.86,bitter:.12,spice:.06,herbal:.22} },
  { id:'coconut',  name:'Coconut',   note:'Cream · Nut · Island',         color:'#E8DCC6', desc:'Fresh coconut milk and toasted flesh. Lush, nutty, a little beachy.', p:{sweet:.74,tart:.06,bitter:.10,spice:.08,herbal:.10} },
  { id:'vanilla',  name:'Vanilla',   note:'Bean · Warm · Silk',           color:'#EFE2C8', desc:'Split vanilla bean. Warm, floral and impossibly smooth.', p:{sweet:.84,tart:.02,bitter:.08,spice:.14,herbal:.06} },
  { id:'caramel',  name:'Caramel',   note:'Burnt sugar · Salt · Deep',    color:'#B97434', desc:'Sugar taken just past golden. Bittersweet, salted, deep.', p:{sweet:.82,tart:.06,bitter:.22,spice:.16,herbal:.06} },
  { id:'hazelnut', name:'Hazelnut',  note:'Nut · Roast · Soft',           color:'#9A6A3E', desc:'Toasted hazelnut with a soft roast bitterness and a creamy tail.', p:{sweet:.58,tart:.10,bitter:.30,spice:.12,herbal:.10} },
  { id:'cinnamon', name:'Cinnamon',  note:'Bark · Heat · Sweet',          color:'#B4532B', desc:'Cassia bark, warm and sweet, with a slow burn that lingers.', p:{sweet:.56,tart:.12,bitter:.20,spice:.90,herbal:.14} },
  { id:'clove',    name:'Clove',     note:'Spice · Wood · Dark',          color:'#6B3A2A', desc:'A single clove goes a long way. Dark, woody, almost medicinal.', p:{sweet:.34,tart:.10,bitter:.28,spice:.86,herbal:.20} },
  { id:'anise',    name:'Anise',     note:'Licorice · Cool · Sharp',      color:'#5C4A6B', desc:'Black licorice and a cool, numbing finish. Polarizing on purpose.', p:{sweet:.46,tart:.08,bitter:.24,spice:.72,herbal:.30} },
  { id:'lavender', name:'Lavender',  note:'Petal · Calm · Soft',          color:'#9A86C8', desc:'Dried lavender buds. Perfumed, calm and faintly soapy in the best way.', p:{sweet:.42,tart:.10,bitter:.12,spice:.06,herbal:.62} },
  { id:'hibiscus', name:'Hibiscus',  note:'Tart · Petal · Bright',        color:'#B32B4E', desc:'Steeped hibiscus. Cranberry-tart, ruby red and full of grip.', p:{sweet:.38,tart:.80,bitter:.16,spice:.06,herbal:.38} },
  { id:'yuzu',     name:'Yuzu',      note:'Citrus · Sharp · Floral',      color:'#D9C13F', desc:'A citrus that tastes like it has opinions. Sharp, floral, electric.', p:{sweet:.34,tart:.90,bitter:.16,spice:.06,herbal:.18} },
  { id:'bloodorange',name:'Blood Orange',note:'Juice · Bitter · Sunset',  color:'#D2452E', desc:'Deep red juice with a bitter peel halo. Sunset in a bottle.', p:{sweet:.58,tart:.62,bitter:.26,spice:.08,herbal:.10} },
  { id:'pear',     name:'Pear',      note:'Orchard · Soft · Green',       color:'#C9C96A', desc:'Ripe pear, soft and green, with a clean watery finish.', p:{sweet:.66,tart:.34,bitter:.08,spice:.04,herbal:.16} },
  { id:'plum',     name:'Plum',      note:'Stone · Jam · Dark',           color:'#7A3A62', desc:'Dark plum skin and jammy flesh. Brooding, sweet and tart at once.', p:{sweet:.72,tart:.40,bitter:.14,spice:.08,herbal:.14} },
  { id:'cardamom', name:'Cardamom',  note:'Pod · Aromatic · Warm',        color:'#8E9A5B', desc:'Green cardamom, cracked open. Aromatic, warm and strangely cooling.', p:{sweet:.30,tart:.12,bitter:.22,spice:.70,herbal:.44} },
  { id:'saltedlemon',name:'Salted Lemon',note:'Salt · Zest · Bright',     color:'#E2C24B', desc:'Lemonade with a pinch of sea salt. Bright, savory, endlessly drinkable.', p:{sweet:.28,tart:.84,bitter:.12,spice:.10,herbal:.08} },
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
  'cream+grape':'Grape Float',
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
  'coffee+cola':'Cola Noir',
  'blueberry+lemon':'Blue Spark',
  'cream+raspberry':'Raspberry Cream',
  'lime+mango':'Mango Lime',
  'orange+passion':'Passion Sun',
  'coconut+pineapple':'Island Fizz',
  'cherry+vanilla':'Cherry Vanilla',
  'caramel+cola':'Salted Cola',
  'coffee+hazelnut':'Hazel Brew',
  'cinnamon+pear':'Spiced Orchard',
  'lavender+lemon':'Lavender Lemonade',
  'hibiscus+lime':'Hibiscus Lime',
  'ginger+yuzu':'Yuzu Ginger',
  'bloodorange+cola':'Blood Orange Cola',
  'ginger+pear':'Pear Ginger',
  'plum+vanilla':'Plum Velvet',
  'cardamom+cream':'Cardamom Cream',
  'mint+saltedlemon':'Salted Mint',
  'mint+watermelon':'Melon Cooler',
  'anise+coffee':'Black Licorice Brew',
  'clove+orange':'Clove Orange',
};

// Keys are two flavor ids; lookups sort them, so write them in either order.
const COMBO_NAMES = Object.fromEntries(
  Object.entries(COMBOS).map(([k, v]) => [k.split('+').sort().join('+'), v]));

const SWEET_WORDS = ['Bone dry','Barely sweet','Light','Balanced','Sweet','Candy'];
const FIZZ_WORDS  = ['Still','Soft','Gentle','Crisp','Lively','Volcanic'];
const FIZZ_ADJ    = ['still','soft','gentle','crisp','lively','wild'];

const CURATED = ['cola','cherry','lemon','lime','orange','grape','cream','rootbeer'];

/* ───────────── mix rules ───────────── */

/* Each flavor slider is its own 0–100 strength; 0 is off. A dose is that
   share of the flavor's max shot. When the doses overflow the cup they all
   scale down by one factor, so the ratios (the mix shares) never change. */
const CUP_ROOM = 180;          // ml of flavor the cup holds
const DEFAULT_MAX_SHOT = 30;   // ml a flavor pours at slider 100
const maxShotOf = f => (f && f.maxShot) || DEFAULT_MAX_SHOT;

const FIZZ_LABELS = [
  { label:'Flat',       max:0   },
  { label:'Light',      max:33  },
  { label:'Regular',    max:66  },
  { label:'Extra fizz', max:100 },
];
const fizzLabel = v => (FIZZ_LABELS.find(l => v <= l.max) || FIZZ_LABELS[FIZZ_LABELS.length - 1]).label;


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

/* ───────────── dose math ─────────────
   dose  = slider/100 × the flavor's max shot
   fit   = one factor for every shot when the doses overflow the cup
   share = a flavor's dose ÷ total dose (always sums to 100%) */

function rawDoses(mix) {
  return (mix.flavors || []).map(x => {
    const f = flavorById(x.id);
    return f ? { id: x.id, f, value: x.value, dose: (x.value / 100) * maxShotOf(f) } : null;
  }).filter(Boolean);
}

const rawDoseTotal = mix => rawDoses(mix).reduce((a, x) => a + x.dose, 0);
const scaledToFit = mix => rawDoseTotal(mix) > CUP_ROOM + 1e-6;

function sharesOf(mix) {
  const items = rawDoses(mix);
  const raw = items.reduce((a, x) => a + x.dose, 0);
  const fit = raw > CUP_ROOM ? CUP_ROOM / raw : 1;
  const total = raw * fit;
  return items.map(x => {
    const dose = x.dose * fit;
    return { ...x, dose, share: total ? dose / total : 0 };
  });
}

function blendColor(mix) {
  const shares = sharesOf(mix);
  if (!shares.length) {
    const b = baseById(mix.base);
    return mixHex(b.color, BASE_ACCENT[b.id] || BASE_ACCENT.soda, .8);
  }

  let x = 0, y = 0, sat = 0, lig = 0;
  shares.forEach(({ f, share }) => {
    const w = Math.max(share, .02);          // a 2% splash still tints the glass
    const { h, s, l } = rgbToHsl(...hexToRgb(f.color));
    x += Math.cos(h * Math.PI / 180) * w;
    y += Math.sin(h * Math.PI / 180) * w;
    sat += s * w;
    lig += l * w;
  });
  const wsum = shares.reduce((a, s) => a + Math.max(s.share, .02), 0);
  let hue = Math.atan2(y, x) * 180 / Math.PI;
  if (hue < 0) hue += 360;
  sat /= wsum; lig /= wsum;

  const s = clamp(sat * .92 + .14, .48, .92);
  const l = clamp(lig * .52 + .28, .44, .63);
  return hslToHex(hue, s, l);
}

function profileOf(mix) {
  const p = { sweet:.20, tart:.12, bitter:.08, spice:.08, herbal:.08 };
  const shares = sharesOf(mix);
  const w = shares.reduce((a, s) => a + s.share, 0);
  if (w > 0) {
    for (const k in p) {
      p[k] += shares.reduce((a, s) => a + (s.f.p[k] || 0) * s.share, 0) * .56;
    }
  }
  // fizz nudges tartness a little, on the 0–100 scale
  p.tart += (mix.fizz - 50) * .00075;
  for (const k in p) p[k] = clamp(p[k], .04, 1);
  return p;
}

function makeName(mix) {
  const shares = sharesOf(mix).sort((a, b) => b.share - a.share);
  if (!shares.length) return 'Plain Sparkle';

  if (shares.length >= 2) {
    const key = [shares[0].id, shares[1].id].sort().join('+');
    if (COMBO_NAMES[key]) return COMBO_NAMES[key];
  }

  const h = hashStr(shares.map(s => s.id).join('') + mix.base + mix.fizz);
  const suffix = SUFFIXES[h % SUFFIXES.length];
  let stem = shares.slice(0, 2).map(s => s.f.name).join(' ');
  if (stem.length > 15) stem = shares[0].f.name;
  return `${stem} ${suffix}`;
}

function notesFor(mix) {
  const p = profileOf(mix);
  const shares = sharesOf(mix).sort((a, b) => b.share - a.share);
  const fs = shares.map(s => s.f);
  const bits = [];
  if (p.sweet > .58) bits.push('a soft, rounded sweetness');
  else if (p.sweet < .32) bits.push('a bone-dry edge');
  if (p.tart > .52) bits.push('a bright acidic snap');
  if (p.spice > .46) bits.push('warm spice on the back palate');
  if (p.bitter > .46) bits.push('a gentle bitter shadow');
  if (p.herbal > .46) bits.push('a cool herbal lift');

  const a = bits[0] || 'a clean, quiet body';
  const b = bits[1] || 'an easy finish';
  const names = fs.map(f => f.name.toLowerCase());
  const flavorList = names.length > 2
    ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    : names.join(' and ');
  const lead = fs.length
    ? `${flavorList} over ${baseById(mix.base).name.toLowerCase()}, served ${TEMP_LABEL(mix.temp)}.`
    : `Unflavored ${baseById(mix.base).name.toLowerCase()}, served ${TEMP_LABEL(mix.temp)}.`;

  const fizz = fizzLabel(mix.fizz).toLowerCase();
  return `${cap(lead)} ${cap(a)} leads, ${b} follows, and the carbonation stays ${fizz}.`;
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const TEMP_LABEL = id => (TEMPS.find(t => t.id === id) || TEMPS[0]).label.toLowerCase();

/* ───────────── the cup ─────────────
   A tapered tumbler: wide rim, narrow base, three floating ice cubes, liquid
   that fills from the bottom, and carbonation that speeds up with fizz.
   Everything is one SVG so it scales crisply from a 52px shelf thumbnail to
   the full mixer stage. */

const CUP_BODY = 'M16 46 L35.4 230 Q36.2 238 43.2 238 L76.8 238 Q83.8 238 84.6 230 L104 46 Z';
const CUP_RIM_Y = 46;
const CUP_FLOOR = 236;
const CUP_SURFACE_TOP = 58;
const CUP_SURFACE_BOT = 232;
let uidCounter = 0;

const bottleVars = c =>
  `--l0:${lighten(c, .44)};--l1:${lighten(c, .30)};--l2:${c};--l3:${darken(c, .32)};--l4:${lighten(c, .54)};--l5:${lighten(c, .64)}`;

/* Half the cup's inner width at a given height (rim 44, base 24). */
const cupHalfWidth = y => 44 - ((y - CUP_RIM_Y) / (CUP_FLOOR - CUP_RIM_Y)) * 20;

function iceCube(uid, cx, cy, size, rot, bob, delay) {
  const h = size / 2;
  return `<g class="cup-ice-cube" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})" style="--bob:${bob.toFixed(2)}px;animation-delay:${delay.toFixed(2)}s">
      <rect x="${-h}" y="${-h}" width="${size}" height="${size}" rx="${(size * .26).toFixed(1)}" fill="url(#ice-${uid})"/>
      <rect x="${-h}" y="${-h}" width="${size}" height="${size}" rx="${(size * .26).toFixed(1)}" fill="none" stroke="#fff" stroke-opacity=".62" stroke-width=".9"/>
      <rect x="${(-h + 2.6).toFixed(1)}" y="${(-h + 2.6).toFixed(1)}" width="${(size * .4).toFixed(1)}" height="${(size * .4).toFixed(1)}" rx="${(size * .13).toFixed(1)}" fill="#fff" opacity=".38"/>
      <path d="M${(-h + 3).toFixed(1)} ${(h - 3).toFixed(1)} L${(-h + 3).toFixed(1)} ${(-h + 3).toFixed(1)}" stroke="#fff" stroke-opacity=".5" stroke-width="1.1" stroke-linecap="round"/>
    </g>`;
}

function bottleSVG(opts) {
  const o = Object.assign({ color:'#9BD3E8', fill:.78, fizz:50, seed:1, animate:false, cls:'', still:false }, opts);
  const uid = 'c' + (++uidCounter);
  const color = o.color;
  const fill = clamp(o.fill, .08, 1);
  const surface = CUP_SURFACE_BOT - fill * (CUP_SURFACE_BOT - CUP_SURFACE_TOP);
  const rx = cupHalfWidth(surface) - 1.4;
  const rise = -(CUP_SURFACE_BOT - surface);
  const rnd = mulberry32(o.seed || 1);

  // Fizz 0–100: 0 pours flat, 100 is a fast rolling boil.
  const fizz = clamp(o.fizz, 0, 100);
  const count = fizz <= 0 ? 0 : Math.round((fizz / 100) * (o.still ? 14 : 30));
  let bubbles = '';
  for (let i = 0; i < count; i++) {
    const cx = 38 + rnd() * 44;
    const cy = 228 + rnd() * 8;
    const r = .8 + rnd() * (o.still ? 1.3 : 1.9);
    const dur = (3.9 - (fizz / 100) * 2.2) + rnd() * 1.2;
    const delay = -rnd() * dur;
    bubbles += `<circle class="bub" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" style="--rise:${rise.toFixed(1)}px;animation-duration:${dur.toFixed(2)}s;animation-delay:${delay.toFixed(2)}s"/>`;
  }

  // Ice sits just under the surface, never below the floor.
  const iceTop = Math.min(surface + 6, 176);
  const cubes = [
    iceCube(uid, 45, iceTop + 8,  26, -15, 2.6, 0),
    iceCube(uid, 72, iceTop + 18, 22,  13, 2.1, -.9),
    iceCube(uid, 57, iceTop + 33, 18,  -6, 2.4, -1.7),
  ].join('');

  // Pour animation: the liquid group starts below the floor and slides up.
  const offset = o.animate ? (CUP_FLOOR + 20 - surface) : 0;

  return `<svg class="bottle cup ${o.cls} ${o.still ? 'bottle--still' : ''}" viewBox="0 0 120 260" role="img" aria-label="A cup of soda" style="${bottleVars(color)}">
    <defs>
      <clipPath id="cup-${uid}"><path d="${CUP_BODY}"/></clipPath>
      <clipPath id="liq-${uid}"><rect x="0" y="${surface.toFixed(1)}" width="120" height="${(CUP_FLOOR + 4 - surface).toFixed(1)}"/></clipPath>
      <linearGradient id="lg-${uid}" x1=".1" y1="0" x2=".9" y2="1">
        <stop offset="0" style="stop-color:var(--l0)"/>
        <stop offset=".22" style="stop-color:var(--l1)"/>
        <stop offset=".64" style="stop-color:var(--l2)"/>
        <stop offset="1" style="stop-color:var(--l3)"/>
      </linearGradient>
      <linearGradient id="dp-${uid}" x1="0" y1="${surface.toFixed(1)}" x2="0" y2="${CUP_FLOOR}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset=".5" stop-color="#000" stop-opacity=".07"/>
        <stop offset="1" stop-color="#000" stop-opacity=".32"/>
      </linearGradient>
      <radialGradient id="core-${uid}" cx=".46" cy=".5" r=".62">
        <stop offset="0" stop-color="#fff" stop-opacity=".30"/>
        <stop offset=".55" stop-color="#fff" stop-opacity=".06"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="glass-${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".58"/>
        <stop offset=".09" stop-color="#fff" stop-opacity=".16"/>
        <stop offset=".3" stop-color="#fff" stop-opacity=".02"/>
        <stop offset=".68" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".9" stop-color="#fff" stop-opacity=".12"/>
        <stop offset="1" stop-color="#fff" stop-opacity=".52"/>
      </linearGradient>
      <radialGradient id="in-${uid}" cx=".5" cy=".5" r=".64">
        <stop offset=".5" stop-color="#000" stop-opacity="0"/>
        <stop offset=".86" stop-color="#000" stop-opacity=".09"/>
        <stop offset="1" stop-color="#000" stop-opacity=".22"/>
      </radialGradient>
      <linearGradient id="hl-${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".5" stop-color="#fff" stop-opacity=".7"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="ice-${uid}" x1=".1" y1="0" x2=".9" y2="1">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity=".92"/>
        <stop offset=".45" stop-color="#EAF7FF" stop-opacity=".72"/>
        <stop offset="1" stop-color="#CFE9F7" stop-opacity=".58"/>
      </linearGradient>
      <radialGradient id="rim-${uid}" cx=".5" cy=".5" r=".5">
        <stop offset=".55" style="stop-color:var(--l1)" stop-opacity=".18"/>
        <stop offset="1" style="stop-color:var(--l3)" stop-opacity=".42"/>
      </radialGradient>
      <linearGradient id="sh-${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".45" stop-color="#fff" stop-opacity=".42"/>
        <stop offset=".55" stop-color="#fff" stop-opacity=".42"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <ellipse class="bottle-shadow" cx="60" cy="243" rx="33" ry="5.4"/>
    <ellipse class="bottle-caustic" cx="60" cy="242.4" rx="24" ry="3.4" style="fill:var(--l2)" opacity=".34"/>

    <g class="cup-float">
      <g clip-path="url(#cup-${uid})">
        <g class="liquid" style="transform:translateY(${offset.toFixed(1)}px)">
          <rect x="0" y="${surface.toFixed(1)}" width="120" height="${(CUP_FLOOR + 4 - surface).toFixed(1)}" fill="url(#lg-${uid})"/>
          <rect x="0" y="${surface.toFixed(1)}" width="120" height="${(CUP_FLOOR + 4 - surface).toFixed(1)}" fill="url(#dp-${uid})"/>
          <rect x="0" y="${surface.toFixed(1)}" width="120" height="${(CUP_FLOOR + 4 - surface).toFixed(1)}" fill="url(#core-${uid})"/>
          <g clip-path="url(#liq-${uid})">${bubbles}</g>
          <ellipse cx="60" cy="${surface.toFixed(1)}" rx="${rx.toFixed(1)}" ry="3.4" style="fill:var(--l4)" opacity=".95"/>
          <ellipse cx="60" cy="${(surface - .7).toFixed(1)}" rx="${(rx * .8).toFixed(1)}" ry="2" fill="#fff" opacity=".42"/>
          <path d="M${(60 - rx).toFixed(1)} ${surface.toFixed(1)} q ${rx.toFixed(1)} 3.4 ${(rx * 2).toFixed(1)} 0" fill="none" style="stroke:var(--l5)" stroke-width=".9" opacity=".65"/>
        </g>

        <g class="cup-ice">${cubes}</g>

        <path d="${CUP_BODY}" fill="url(#glass-${uid})"/>
        <path d="${CUP_BODY}" fill="url(#in-${uid})"/>
        <g clip-path="url(#cup-${uid})">
          <rect x="26.5" y="70" width="5.2" height="132" rx="2.6" fill="url(#hl-${uid})" opacity=".5"/>
          <rect x="34" y="80" width="1.6" height="108" rx=".8" fill="#fff" opacity=".2"/>
          <path d="M90.5 78 C94 96 95 108 94.6 124 L93 198" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" opacity=".24"/>
          <path d="M33.5 216 C43 228 78 228 87.5 216" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".18"/>
          <rect class="cup-sheen" x="-46" y="46" width="30" height="196" fill="url(#sh-${uid})"/>
        </g>

        <path d="${CUP_BODY}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.1"/>

        <ellipse cx="60" cy="${CUP_RIM_Y}" rx="44" ry="8" fill="url(#rim-${uid})"/>
        <ellipse cx="60" cy="${CUP_RIM_Y}" rx="44" ry="8" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="1.6"/>
        <ellipse cx="60" cy="${CUP_RIM_Y + .6}" rx="40.5" ry="6.6" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width=".9"/>
        <path d="M24 44.4 C34 38.4 86 38.4 96 44.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>

        <g class="cup-cond" fill="#fff" opacity=".26">
          <ellipse cx="30" cy="96" rx="1.5" ry="2.2"/>
          <ellipse cx="34.4" cy="118" rx="1.1" ry="1.7"/>
          <ellipse cx="88" cy="104" rx="1.3" ry="2"/>
          <ellipse cx="84.6" cy="132" rx="1" ry="1.5"/>
        </g>

        <!-- extra flash on high fizz -->
        ${fizz > 70 ? `<circle class="cup-spark" cx="52" cy="${(surface + 12).toFixed(1)}" r="1.8" fill="#fff" opacity=".7"/>` : ''}
      </g>
    </g>
  </svg>`;
}

function bottleStage(opts) {
  const o = Object.assign({ cls:'', editable:false }, opts);
  return `<div class="bottle-stage ${o.cls} ${o.still ? 'is-still' : ''}" data-bottle-stage>${bottleSVG(o)}</div>`;
}

/* Simple colored cutout for flavor sheets (fallback until real SVGs are added) */
function cutoutSVG(f) {
  return `<svg viewBox="0 0 120 120" width="92" height="92">
    <defs>
      <radialGradient id="co-${f.id}" cx=".42" cy=".38" r=".72">
        <stop offset="0" stop-color="#fff" stop-opacity=".65"/>
        <stop offset=".55" stop-color="${f.color}" stop-opacity=".95"/>
        <stop offset="1" stop-color="${darken(f.color,.25)}"/>
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="52" fill="url(#co-${f.id})"/>
    <circle cx="60" cy="60" r="52" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>
    <circle cx="46" cy="44" r="14" fill="#fff" opacity=".35"/>
  </svg>`;
}

/* Update a live bottle in place. The SVG is only rebuilt when its shape
   changes (fill, fizz, seed); a color change is a cheap repaint. */
function syncStage(host, opts) {
  const key = [opts.fill, opts.fizz, opts.seed].join('|');
  const stage = host.firstElementChild;
  if (!stage || stage.dataset.key !== key) {
    host.innerHTML = bottleStage(opts);
    host.firstElementChild.dataset.key = key;
    return;
  }
  stage.querySelector('.bottle').style.cssText = bottleVars(opts.color);
}

/* ───────────── state ───────────── */

const KEY = 'sodalab.v1';

// badges.js (loaded first) owns the badge store; this is the only way app.js talks to it.
const badges = (fn, ...args) => (window.SodaBadges ? window.SodaBadges[fn](...args) : undefined);

const SCHEMA = 2;                 // 2 = sliders, fizz 0–100, no finish/charms/rarity
const SAVE_LIMIT = 10;            // free accounts; nothing is ever deleted over the limit
const defaultMix = () => ({ base:'soda', flavors:[], fizz:50, temp:'ice' });

/* ───────────── saved-data validation ─────────────
   Everything read from localStorage goes through sanitizeMix / sanitizeBatch,
   so render code can trust ids, numbers and colors. Free text (names) is
   escaped with esc() wherever it is put into HTML. */

const ID_RE  = /^[A-Za-z0-9_-]{1,64}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const ESC_MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
const esc = s => String(s).replace(/[&<>"']/g, c => ESC_MAP[c]);
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const intIn = (v, a, b, d) => (Number.isInteger(v) && v >= a && v <= b ? v : d);
const numIn = (v, a, b, d) => (typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d);

/* v0.4 fizz was a 0–5 dial; v1 uses 0–100. Only pre-schema-2 data is scaled. */
const migrateFizz = (v, legacy) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 50;
  if (legacy && v <= 5) return Math.round(clamp(v, 0, 5) * 20);
  return Math.round(clamp(v, 0, 100));
};

/* Flavors are [{ id, value }]. Old saves stored bare ids; those become a full
   slider so the recipe survives the upgrade. Duplicates and unknown ids drop. */
function sanitizeFlavors(list, legacy) {
  if (!Array.isArray(list)) return [];
  const seen = new Set(), out = [];
  for (const item of list) {
    const id = typeof item === 'string' ? item : (isObj(item) ? item.id : null);
    if (typeof id !== 'string' || !flavorById(id) || seen.has(id)) continue;
    const value = isObj(item) ? Math.round(numIn(item.value, 0, 100, 100)) : 100;
    if (value <= 0) continue;
    seen.add(id);
    out.push({ id, value });
  }
  return out;
}

function sanitizeMix(m, legacy = false) {
  const d = defaultMix();
  if (!isObj(m)) return d;
  return {
    base:    BASES.some(b => b.id === m.base) ? m.base : d.base,
    flavors: sanitizeFlavors(m.flavors, legacy),
    fizz:    migrateFizz(m.fizz, legacy),
    temp:    TEMPS.some(t => t.id === m.temp) ? m.temp : d.temp,
  };
}

/* Returns a clean batch, or null if the entry is unusable. */
function sanitizeBatch(b, legacy = false) {
  if (!isObj(b)) return null;
  const mix = sanitizeMix(b, legacy);
  const id = typeof b.id === 'string' && ID_RE.test(b.id) ? b.id : 'r' + hashStr(JSON.stringify(b)).toString(36);
  const name = typeof b.name === 'string' && b.name.trim() ? b.name.trim().slice(0, 80) : makeName(mix);
  const out = Object.assign({
    id,
    num:   intIn(b.num, 0, 1e9, 0),
    name,
  }, mix, {
    color: typeof b.color === 'string' && HEX_RE.test(b.color) ? b.color : blendColor(mix),
    date:  numIn(b.date, 0, 8.64e15, Date.now()),
  });
  if (typeof b.remixedFrom === 'string' && b.remixedFrom.trim()) {
    out.remixedFrom = b.remixedFrom.trim().slice(0, 80);
  }
  return out;
}

const state = {
  view: 'home',
  mix: defaultMix(),
  saved: [],
  count: 0,
  lastBatch: null,
  pending: null,
  showAllFlavors: false,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!isObj(d)) return;
    const legacy = d.v !== SCHEMA;      // pre-v1 saves: 0–5 fizz, bare flavor ids
    if (Array.isArray(d.saved)) {
      const seen = new Set();
      state.saved = d.saved.map(b => sanitizeBatch(b, legacy)).filter(b => b && !seen.has(b.id) && seen.add(b.id));
    }
    state.count = Math.max(intIn(d.count, 0, 1e9, 0), 0, ...state.saved.map(b => b.num));
    if (d.mix) state.mix = sanitizeMix(d.mix, legacy);
  } catch (e) { /* storage unavailable — carry on */ }
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: SCHEMA, saved: state.saved, count: state.count, mix: state.mix }));
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

/* History: every screen change writes #/<view> and a state of
   { v: view, depth: entries pushed since boot, root: view at depth 0 }.
   Tab-to-tab moves (except leaving the Lab) replace instead of push, so the
   phone's back button walks back through screens, not every tab tap. */
const VIEW_RE = /^#\/(home|shelf|flavors|mix|result|badges)\b/;
const viewFromHash = () => (location.hash.match(VIEW_RE) || [])[1] || null;
let navState = { v: 'home', depth: 0, root: 'home' };

function writeHistory(name, mode) {
  if (mode === 'none') return;
  navState = mode === 'push'
    ? { v: name, depth: navState.depth + 1, root: navState.root }
    : { v: name, depth: navState.depth, root: navState.depth ? navState.root : name };
  const url = location.pathname + location.search + '#/' + name;
  if (mode === 'push') history.pushState(navState, '', url);
  else history.replaceState(navState, '', url);
}

function historyModeFor(from, to) {
  return TAB_VIEWS.includes(from) && TAB_VIEWS.includes(to) && from !== 'home' ? 'replace' : 'push';
}

/* go(name, dir = 'push' | 'pop' | 'fade', { history: 'push' | 'replace' | 'none' }) */
function go(name, dir = 'push', opts = {}) {
  if (name === 'badges' && !badgesOn()) name = 'home';
  const next = document.querySelector(`.view[data-view="${name}"]`);
  const cur  = document.querySelector('.view.is-active');
  if (!next || next === cur) return;
  writeHistory(name, opts.history || historyModeFor(state.view, name));

  if (name === 'home')  { renderHome(); next.scrollTop = 0; }
  if (name === 'shelf') { renderShelf(); next.scrollTop = 0; }
  if (name === 'flavors') { renderFlavorList(); next.scrollTop = 0; }
  if (name === 'mix')   { renderMix(); }
  if (name === 'result') { $('#resultBody').scrollTop = 0; }
  if (name === 'badges') { renderBadges(); next.scrollTop = 0; }

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
  updateTabs(name);
  badgeRoute(name, next);
}

function updateTabs(name = state.view) {
  $$('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.go === name));
}

/* In-app back (and the Lab tab) returns to the lab. If the lab is the root of
   our history, unwind to it so the phone's back button doesn't land on the
   screens we just left; otherwise replace the current entry. */
function back(dir = 'pop') {
  if (state.view === 'home') return;
  if (navState.depth > 0 && navState.root === 'home') history.go(-navState.depth);
  else go('home', dir, { history: 'replace' });
}

function overlayOpen() {
  if (sheetLayer.classList.contains('is-open')) return 'sheet';
  if (brewLayer.classList.contains('is-open')) return 'brew';
  return null;
}

window.addEventListener('popstate', e => {
  // Back with a sheet open closes it and keeps the screen: put the entry we
  // just left back on the stack. Back during a brew is ignored.
  const overlay = overlayOpen();
  if (overlay) {
    if (overlay === 'sheet') closeSheet();
    history.pushState(navState, '', location.pathname + location.search + '#/' + navState.v);
    return;
  }
  let v = (e.state && e.state.v) || viewFromHash() || 'home';
  if (v === 'result' && !$('#resultBody').children.length) v = 'home';
  const forward = !!(e.state && e.state.depth > navState.depth);
  navState = e.state && typeof e.state.depth === 'number'
    ? e.state
    : { v, depth: navState.depth, root: navState.root };
  const tabs = TAB_VIEWS.includes(state.view) && TAB_VIEWS.includes(v);
  go(v, tabs ? 'fade' : forward ? 'push' : 'pop', { history: 'none' });
});

document.addEventListener('click', e => {
  const goEl = e.target.closest('[data-go]');
  if (goEl) {
    e.preventDefault();
    const target = goEl.dataset.go;
    if (target === 'mix' && state.view !== 'mix') {
      go('mix', 'push');
    } else if (target === 'home') {
      back(TAB_VIEWS.includes(state.view) ? 'fade' : 'pop');
    } else if (TAB_VIEWS.includes(target)) {
      go(target, TAB_VIEWS.includes(state.view) ? 'fade' : 'pop');
    } else {
      go(target, 'push');
    }
    return;
  }
  if (e.target.closest('[data-back]')) { e.preventDefault(); back(); }
  if (e.target.closest('[data-badges-back]')) { e.preventDefault(); badgesBack(); }
});

/* ───────────── home ───────────── */

function renderHome() {
  const hour = new Date().getHours();
  $('#greeting').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const mix = state.mix;
  const color = blendColor(mix);
  const shares = sharesOf(mix).sort((a, b) => b.share - a.share);
  const hasFlavors = shares.length > 0;
  const hero = $('#homeHero');

  hero.style.background = `
    radial-gradient(115% 105% at 92% 4%, ${rgba(lighten(color,.42), .55)} 0%, ${rgba(lighten(color,.72), .28)} 46%, transparent 74%),
    linear-gradient(160deg, ${lighten(color,.76)} 0%, ${lighten(color,.88)} 100%)`;

  hero.innerHTML = `
    <div class="hero-copy">
      <div class="hero-kicker">${hasFlavors ? 'In the lab' : 'The lab is open'}</div>
      <div class="hero-title">${hasFlavors ? makeName(mix) : 'Mix something bright.'}</div>
      <div class="hero-sub">${hasFlavors
        ? `${baseById(mix.base).name} · ${shares.map(s => s.f.name).join(', ')}`
        : `Four bases, ${FLAVORS.length} flavors, one very good glass.`}</div>
      <button class="hero-btn">
        ${hasFlavors ? 'Continue' : 'Start a batch'}
        <svg viewBox="0 0 24 24" width="15" height="15"><path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <div class="hero-art">${bottleStage({ color, fill:.8, fizz:mix.fizz, seed:7 })}</div>`;

  hero.onclick = () => go('mix', 'push');
  renderHomeBadges();

  const row = $('#homeShelf');
  if (!state.saved.length) {
    row.innerHTML = `<button class="placeholder-card" data-go="mix">
      <span class="plus">+</span>
      <span>Brew your<br>first batch</span>
    </button>`;
  } else {
    row.innerHTML = state.saved.slice(0, 6).map(b => `
      <button class="mini-card" data-batch="${esc(b.id)}">
        <div class="mini-art" style="background:linear-gradient(160deg, ${lighten(b.color,.86)}, ${lighten(b.color,.94)})">
          ${bottleStage({ color:b.color, fill:.8, fizz:b.fizz, seed:hashStr(b.id) % 999, still:true })}
        </div>
        <div class="mini-name">${esc(b.name)}</div>
        <div class="mini-meta">${dateLabel(b.date)} · ${b.flavors.length} flavor${b.flavors.length === 1 ? '' : 's'}</div>
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

/* Everything the mixer shows that is derived from the mix itself. */
function deriveMix(mix) {
  const shares = sharesOf(mix).sort((a, b) => b.share - a.share);
  return {
    color: blendColor(mix),
    name:  makeName(mix),
    sub:   shares.length
      ? `${baseById(mix.base).name} · ${shares.map(s => s.f.name).join(', ')}`
      : `${baseById(mix.base).name} · no flavors yet`,
    flavors: shares.map(s => s.f),
    shares,
    fill:  shares.length ? .82 : .62,
  };
}

function renderMix() {
  const mix = state.mix;
  const derived = deriveMix(mix);
  const color = derived.color;

  $('#mixWash').style.background = `
    radial-gradient(52% 48% at 50% 40%, ${rgba(color, .34)} 0%, ${rgba(color, .10)} 52%, transparent 74%),
    radial-gradient(40% 42% at 24% 62%, ${rgba(lighten(color,.3), .30)} 0%, transparent 70%)`;

  syncStage($('#mixBottle'), { color, fill: derived.fill, fizz: mix.fizz, seed: 21 });

  $('#mixName').textContent = derived.name;
  $('#mixSub').textContent = derived.sub;

  // base options (built once, then only their pressed state changes)
  const baseRow = $('#baseRow');
  if (!baseRow.firstElementChild) baseRow.innerHTML = BASES.map(b => `
    <button class="base-opt" data-base="${b.id}">
      <span class="dot" style="background:${b.color}"></span>
      <span class="lbl">${b.name}</span>
    </button>`).join('');
  baseRow.querySelectorAll('[data-base]').forEach(el => el.setAttribute('aria-pressed', mix.base === el.dataset.base));

  // flavor slider rows, sorted by share (biggest pour first)
  const shares = sharesOf(mix).sort((a, b) => b.share - a.share);
  const host = $('#flavorSliders');
  const key = shares.map(s => s.id + ':' + s.value).join(',') + '|' + (state.showAllFlavors ? 1 : 0);
  if (host.dataset.key !== key) {
    host.dataset.key = key;
    const shown = state.showAllFlavors ? shares : shares.slice(0, MIXER_ROWS);
    host.innerHTML = shown.map(s => sliderRow(s, color)).join('');
    const hidden = shares.length - shown.length;
    $('#showAllFlavors').hidden = hidden <= 0 && !state.showAllFlavors;
    $('#showAllFlavors').textContent = state.showAllFlavors ? 'Show fewer' : `Show all ${shares.length}`;
  } else {
    host.querySelectorAll('[data-flavor-range]').forEach(input => {
      const s = shares.find(x => x.id === input.dataset.flavorRange);
      if (s) input.value = s.value;
    });
    host.querySelectorAll('[data-flavor-pct]').forEach(el => {
      const s = shares.find(x => x.id === el.dataset.flavorPct);
      if (s) el.textContent = pctText(s.share);
    });
  }

  $('#flavorCount').textContent = shares.length
    ? `${shares.length} flavor${shares.length === 1 ? '' : 's'}`
    : 'None yet';
  $('#flavorEmpty').hidden = shares.length > 0;

  // shares meter + scale-to-fit note
  const meter = $('#mixShares');
  meter.hidden = !shares.length;
  meter.innerHTML = shares.map(s => `<i style="flex:${Math.max(s.share, .01)};background:${s.f.color}"></i>`).join('');
  const scaleNote = $('#scaleNote');
  scaleNote.hidden = !scaledToFit(mix);
  if (!scaleNote.hidden) scaleNote.textContent = `Scaled to fit · ${Math.round(rawDoseTotal(mix))} ml of flavor in a ${CUP_ROOM} ml cup`;

  // fizz
  syncFizz();

  // serve
  const tempRow = $('#tempRow');
  if (!tempRow.firstElementChild) tempRow.innerHTML = TEMPS.map(t => `
    <button class="temp-opt" data-temp="${t.id}">${t.label}</button>`).join('');
  tempRow.querySelectorAll('[data-temp]').forEach(el => el.setAttribute('aria-pressed', mix.temp === el.dataset.temp));

  // hint
  $('#mixHint').textContent = !shares.length
    ? 'Add a flavor to start. Every slider is its own strength.'
    : shares.length === 1
      ? `${shares[0].f.name} at ${Math.round(shares[0].share * 100)}%. Add another flavor to blend, or brew it as is.`
      : `${shares[0].f.name} leads with ${Math.round(shares[0].share * 100)}%. Doses scale to fit; shares always total 100%.`;

  // cta
  const btn = $('#brewBtn');
  const useColor = shares.length > 0;
  btn.style.background = useColor ? color : '#111';
  btn.style.color = useColor ? readableOn(color) : '#fff';
  btn.style.boxShadow = useColor
    ? `0 12px 26px -12px ${rgba(darken(color,.25), .95)}, inset 0 1px 0 rgba(255,255,255,.18)`
    : '';
}

const MIXER_ROWS = 6;
const pctText = share => share > 0 && share < .01 ? '<1%' : `${Math.round(share * 100)}%`;

function sliderRow(s, color) {
  return `<div class="fl-row" data-flavor-row="${s.id}">
    <div class="fl-top">
      <span class="fl-dot" style="background:${s.f.color}"></span>
      <span class="fl-name">${s.f.name}</span>
      <span class="fl-pct" data-flavor-pct="${s.id}">${pctText(s.share)}</span>
      <button class="fl-x" data-flavor-remove="${s.id}" aria-label="Remove ${s.f.name}">
        <svg viewBox="0 0 24 24" width="13" height="13"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>
      </button>
    </div>
    <input type="range" min="0" max="100" step="1" value="${s.value}" data-flavor-range="${s.id}" aria-label="${s.f.name} strength" style="--fill:${s.f.color}">
  </div>`;
}

function syncFizz() {
  const v = state.mix.fizz;
  const input = $('#fizzRange');
  const color = blendColor(state.mix);
  input.value = v;
  input.style.setProperty('--pct', `${v}%`);
  input.style.setProperty('--fill', color);
  $('#fizzVal').textContent = fizzLabel(v);
  $('#fizzVal').style.color = v > 0 ? darken(color, .15) : 'var(--ink-3)';
}

/* Add (100) or remove a flavor. No count limit: duplicates are ignored and
   only unknown ids drop. */
function toggleFlavor(id) {
  const mix = state.mix;
  const i = mix.flavors.findIndex(x => x.id === id);
  let result;
  if (i >= 0) { mix.flavors.splice(i, 1); result = 'removed'; }
  else { mix.flavors.push({ id, value: 100 }); result = 'added'; }
  persist();
  renderMix();
  return result;
}

function setFlavorValue(id, value) {
  const item = state.mix.flavors.find(x => x.id === id);
  if (!item) return;
  item.value = Math.round(clamp(value, 0, 100));
  if (item.value === 0) state.mix.flavors = state.mix.flavors.filter(x => x.id !== id);
  persist();
  renderMix();
}

/* ───────────── brewing ───────────── */

let brewRaf = 0;
const BREW_STEP = 640, BREW_TOTAL = 2960, BREW_BAR = [22, 52, 80, 100];
const setBrewBar = pct => { brewBar.style.transform = `translateX(${pct - 100}%)`; };

function makeBatch(mix) {
  state.count += 1;
  const color = blendColor(mix);
  const batch = {
    id: 'b' + Date.now().toString(36) + Math.floor(Math.random() * 999).toString(36),
    num: state.count,
    name: makeName(mix),
    base: mix.base,
    flavors: mix.flavors.map(f => ({ ...f })),
    fizz: mix.fizz,
    temp: mix.temp,
    color,
    date: Date.now(),
  };
  return batch;
}

function runBrew(batch, steps) {
  state.pending = batch;

  brewLayer.style.background = `
    radial-gradient(95% 62% at 50% 30%, ${rgba(batch.color, .30)} 0%, rgba(10,10,12,0) 66%),
    radial-gradient(120% 90% at 50% 100%, ${rgba(darken(batch.color, .35), .30)} 0%, rgba(10,10,12,0) 60%),
    rgba(10,10,12,.87)`;
  brewBottle.innerHTML = bottleStage({
    color: batch.color, fill: .84, fizz: batch.fizz, seed: 5, animate: true,
  });
  brewStep.textContent = steps[0];
  brewStep.style.opacity = 1;
  setBrewBar(0);

  brewLayer.hidden = false;
  void brewLayer.offsetWidth;
  brewLayer.classList.add('is-open');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const liquid = brewBottle.querySelector('.liquid');
    if (liquid) liquid.style.transform = 'translateY(0)';
  }));

  afterTransition(brewLayer, 600, () => views.classList.toggle('is-covered', brewLayer.classList.contains('is-open')));

  // One clock drives the steps, the label swap and the finish.
  let t0 = null, step = -1;
  cancelAnimationFrame(brewRaf);
  const tick = now => {
    if (t0 === null) t0 = now;
    const t = now - t0;
    if (t >= BREW_TOTAL) { brewRaf = 0; finishBrew(); return; }
    const i = Math.min(steps.length - 1, Math.floor(t / BREW_STEP));
    if (i !== step) {
      step = i;
      setBrewBar(BREW_BAR[Math.min(i, BREW_BAR.length - 1)]);
      if (i > 0) brewStep.style.opacity = 0;
    }
    if (i > 0 && brewStep.textContent !== steps[i] && t - i * BREW_STEP >= 160) {
      brewStep.textContent = steps[i];
      brewStep.style.opacity = 1;
    }
    brewRaf = requestAnimationFrame(tick);
  };
  brewRaf = requestAnimationFrame(tick);
}

function startBrew() {
  if (brewLayer.classList.contains('is-open')) return;
  runBrew(makeBatch(state.mix), ['Chilling the glass', 'Carbonating', 'Balancing the syrup', 'Sealing the batch']);
}

function finishBrew() {
  const batch = state.pending;
  brewLayer.classList.remove('is-open');
  views.classList.remove('is-covered');
  setTimeout(() => { brewLayer.hidden = true; }, 460);
  if (!batch) return;
  state.lastBatch = batch;
  state.pending = null;
  badges('evaluateBadges', 'brew', { batch });   // once per brew, never in renderResult
  renderResult(batch, true);
  go('result', 'push');
  persist();
}

/* ───────────── result ───────────── */

function renderResult(batch, fresh) {
  const mix = { base: batch.base, flavors: batch.flavors, fizz: batch.fizz, temp: batch.temp };
  const p = profileOf(mix);
  const color = batch.color;
  const isSaved = state.saved.some(b => b.id === batch.id);
  const shares = sharesOf(mix).sort((a, b) => b.share - a.share);

  const bars = [
    ['Sweet', p.sweet], ['Tart', p.tart], ['Bitter', p.bitter], ['Spice', p.spice], ['Herbal', p.herbal],
  ].map(([label, val]) => `
    <div class="bar-row">
      <span class="lbl">${label}</span>
      <span class="bar-track"><span class="bar-fill" data-w="${Math.round(val * 100)}" style="background:${color}"></span></span>
      <span class="num">${Math.round(val * 100)}</span>
    </div>`).join('');

  const stats = [
    ['Fizz', fizzLabel(batch.fizz)],
    ['Serve', (TEMPS.find(t => t.id === batch.temp) || TEMPS[0]).label],
    ['Flavors', String(shares.length)],
  ].map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');

  const recipe = shares.map(s => `
    <div class="recipe-row">
      <span class="rr-dot" style="background:${s.f.color}"></span>
      <span class="rr-name">${s.f.name}</span>
      <span class="rr-bar"><i style="width:${Math.round(s.share * 100)}%;background:${s.f.color}"></i></span>
      <span class="rr-num">${pctText(s.share)}</span>
    </div>`).join('');

  $('#resultBody').innerHTML = `
    <div class="result-top">
      <button class="icon-btn" data-back aria-label="Back to lab">
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M14.5 5 8 12l6.5 7" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span style="font-size:11.5px;font-weight:650;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)">Batch ${String(batch.num).padStart(3,'0')}</span>
      <button class="icon-btn" id="shareBtn" aria-label="Share recipe">
        <svg viewBox="0 0 24 24" width="19" height="19"><path d="M12 3v11m0-11 4 4m-4-4-4 4M5 14v4.4c0 1 .8 1.6 1.7 1.6h10.6c1 0 1.7-.6 1.7-1.6V14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>

    <div class="result-hero">
      <div class="result-wash" style="background:
        radial-gradient(46% 42% at 50% 42%, ${rgba(color,.30)} 0%, ${rgba(color,.08)} 55%, transparent 76%)"></div>
      <div class="result-bottle">${bottleStage({ color, fill:.84, fizz:batch.fizz, seed:11 })}</div>
      <div class="result-eyebrow">${fresh ? 'Freshly brewed' : 'From your shelf'}</div>
      <h1 class="result-name">${esc(batch.name)}</h1>
      <div class="result-sub">${baseById(batch.base).name} · ${shares.length ? shares.map(s => s.f.name).join(', ') : 'No flavors'}</div>
      ${batch.remixedFrom ? `<div class="remix-credit">Remixed from ${esc(batch.remixedFrom)}</div>` : ''}
    </div>

    <div class="stat-row">${stats}</div>

    <div class="panel">
      <div class="panel-title">Recipe${scaledToFit(mix) ? ' · scaled to fit' : ''}</div>
      <div class="recipe-list">${recipe || '<p class="notes-copy">No flavors — just the base.</p>'}</div>
    </div>

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
    $$('#resultBody .bar-fill').forEach(el => { el.style.transform = `translateX(${el.dataset.w - 100}%)`; });
  });

  $('#saveBtn')?.addEventListener('click', () => {
    if (state.saved.some(b => b.id === batch.id)) return;
    if (state.saved.length >= SAVE_LIMIT) {
      toast(`You've saved ${SAVE_LIMIT} of ${SAVE_LIMIT}. Remove one to save this.`);
      return;
    }
    state.saved.unshift(batch);
    persist();
    badges('evaluateBadges', 'save', { batch });
    const btn = $('#saveBtn');
    btn.textContent = 'Saved to shelf';
    btn.disabled = true;
    btn.style.background = 'rgba(11,11,12,.07)';
    btn.style.color = 'var(--ink-3)';
    btn.style.boxShadow = 'none';
    toast('Added to your shelf');
  });

  $('#againBtn')?.addEventListener('click', () => {
    badges('clearRemixFrom');
    state.mix = defaultMix();
    persist();
    renderMix();
    go('mix', 'pop');
  });

  $('#shareBtn')?.addEventListener('click', () => {
    const txt = `${batch.name} — Soda Lab\n${baseById(batch.base).name}, ${shares.map(s => `${s.f.name} ${pctText(s.share)}`).join(', ')}\nFizz ${fizzLabel(batch.fizz)} · ${(TEMPS.find(t => t.id === batch.temp) || TEMPS[0]).label}`;
    shareText(txt, batch.name).then(result => {
      if (result === 'copied') toast('Recipe copied');
      else if (result === 'failed') toast('Could not copy');
      // 'shared' / 'cancelled': the system share sheet was the feedback
    });
  });
}

/* Share sheet first (phones), then the async clipboard, then the legacy copy
   path (works on plain http). Resolves 'shared' | 'cancelled' | 'copied' | 'failed'. */
async function shareText(text, title) {
  if (typeof navigator.share === 'function') {
    try { await navigator.share({ title, text }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try { await navigator.clipboard.writeText(text); return 'copied'; } catch (e) { /* fall through */ }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (ok) return 'copied';
  } catch (e) { /* fall through */ }
  return 'failed';
}

/* ───────────── shelf ───────────── */

function renderShelf() {
  const grid = $('#shelfGrid');
  const empty = $('#shelfEmpty');
  const mergeBtn = $('#mergeBtn');
  if (mergeBtn) mergeBtn.hidden = true;      // Merge is gone in v1; Remix lives on each bottle
  renderShelfBadges();
  const eyebrow = document.querySelector('[data-view="shelf"] .eyebrow');
  if (eyebrow) eyebrow.textContent = state.saved.length
    ? `Your collection · ${state.saved.length} of ${SAVE_LIMIT}`
    : 'Your collection';

  if (!state.saved.length) {
    grid.innerHTML = '';
    grid.hidden = true;
    empty.hidden = false;
    return;
  }
  grid.hidden = false;
  empty.hidden = true;
  grid.innerHTML = state.saved.map(b => {
    const shares = sharesOf(b).sort((a, x) => x.share - a.share);
    return `
    <button class="batch-card" data-batch="${esc(b.id)}">
      <div class="batch-art" style="background:linear-gradient(155deg, ${lighten(b.color,.84)} 0%, ${lighten(b.color,.93)} 100%)">
        ${bottleStage({ color:b.color, fill:.8, fizz:b.fizz, seed:hashStr(b.id) % 997, still:true })}
      </div>
      <div class="batch-name">${esc(b.name)}</div>
      <div class="batch-meta">${dateLabel(b.date)} · ${shares.length} flavor${shares.length === 1 ? '' : 's'}</div>
    </button>`;
  }).join('');
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

/* Runs fn once el's own transition ends, or after ms if none fires. */
function afterTransition(el, ms, fn) {
  let timer;
  const done = e => {
    if (e && e.target !== el) return;
    el.removeEventListener('transitionend', done);
    clearTimeout(timer);
    fn();
  };
  el.addEventListener('transitionend', done);
  timer = setTimeout(done, ms);
}

let sheetGen = 0;   // bumps on every open/close so a stale close never hides a reopened sheet

function openSheet(html) {
  sheetGen++;
  sheetBody.innerHTML = html;
  sheetLayer.hidden = false;
  void sheetLayer.offsetWidth;
  sheetLayer.classList.add('is-open');
}
/* then: runs after the sheet is fully down, e.g. to navigate or open the next sheet. */
function closeSheet(then) {
  const gen = ++sheetGen;
  sheetLayer.classList.remove('is-open');
  afterTransition($('#sheet'), 600, () => {
    if (gen !== sheetGen) return;
    sheetLayer.hidden = true;
    if (then) then();
  });
}

sheetLayer.addEventListener('click', e => {
  if (e.target.closest('[data-close-sheet]')) closeSheet();
});

function openFlavorSheet(id) {
  const f = flavorById(id);
  if (!f) return;
  const inMix = state.mix.flavors.some(x => x.id === id);
  openSheet(`
    <div class="sheet-hero" style="background:linear-gradient(150deg, ${lighten(f.color,.72)}, ${lighten(f.color,.88)})">
      <div class="cutout-hero" style="--fc:${f.color}">${cutoutSVG(f)}</div>
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
  const shares = sharesOf(b).sort((a, x) => x.share - a.share);
  const rows = [
    ['Base', baseById(b.base).name],
    ['Flavors', shares.length ? shares.map(s => `${s.f.name} ${pctText(s.share)}`).join(', ') : 'None'],
    ['Fizz', fizzLabel(b.fizz)],
    ['Serve', (TEMPS.find(t => t.id === b.temp) || TEMPS[0]).label],
    ['Brewed', dateLabel(b.date)],
  ].map(([k, v]) => `<div class="sheet-li"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');

  openSheet(`
    <div class="sheet-hero" style="background:linear-gradient(155deg, ${lighten(b.color,.8)}, ${lighten(b.color,.92)})">
      <div style="width:48px">${bottleStage({ color:b.color, fill:.8, fizz:b.fizz, seed:hashStr(b.id) % 997 })}</div>
    </div>
    <h2 class="sheet-title">${esc(b.name)}</h2>
    <div class="sheet-note">Batch ${String(b.num).padStart(3,'0')}${b.remixedFrom ? ` · remixed from ${esc(b.remixedFrom)}` : ''}</div>
    <div class="sheet-list">${rows}</div>
    <div class="sheet-actions">
      <button class="btn-primary" data-remix="${esc(b.id)}">Remix this soda</button>
      <button class="btn-ghost" data-remove-batch="${esc(b.id)}">Remove from shelf</button>
    </div>`);
}

/* ───────────── remix ─────────────
   Remix copies the recipe exactly (flavors, values, fizz) and records who it
   came from. The original stays on the shelf; nothing is consumed. */

function remixBatch(src) {
  if (!src) return null;
  const mix = { base: src.base, flavors: src.flavors.map(f => ({ ...f })), fizz: src.fizz, temp: src.temp };
  state.count += 1;
  const batch = {
    id: 'r' + Date.now().toString(36) + Math.floor(Math.random() * 999).toString(36),
    num: state.count,
    name: makeName(mix),
    base: mix.base,
    flavors: mix.flavors,
    fizz: mix.fizz,
    temp: mix.temp,
    color: blendColor(mix),
    date: Date.now(),
    remixedFrom: src.creator || src.name,
  };
  return batch;
}

/* Opens the mixer on a copy of a shelf soda. */
function startRemix(id) {
  const b = state.saved.find(x => x.id === id);
  if (!b) return;
  state.mix = { base: b.base, flavors: b.flavors.map(f => ({ ...f })), fizz: b.fizz, temp: b.temp };
  state.remixOf = b.creator || b.name;
  persist();
  renderMix();
  closeSheet(() => go('mix', 'push'));
}

function openAllFlavors() {
  openSheet(`
    <h2 class="sheet-title" style="font-size:22px">All ${FLAVORS.length} flavors</h2>
    <div class="sheet-note">Tap to add or remove. No limit — the cup scales to fit.</div>
    <div class="sheet-search">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="11" cy="11" r="6.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input id="sheetFlavorSearch" type="search" placeholder="Search flavors" autocomplete="off" spellcheck="false" aria-label="Search flavors" />
    </div>
    <div class="flavor-list sheet-scrolllist" id="sheetFlavorList">
      ${FLAVORS.map(f => flavorRowHTML(f)).join('')}
    </div>
    <div class="sheet-actions"><button class="btn-ghost" data-close-sheet>Done</button></div>`);
}

function flavorRowHTML(f) {
  const on = state.mix.flavors.some(x => x.id === f.id);
  return `<button class="flavor-row" data-sheet-toggle="${f.id}" data-name="${f.name.toLowerCase()}">
    <span class="sw" style="background:linear-gradient(150deg, ${lighten(f.color,.25)}, ${darken(f.color,.08)})"></span>
    <span class="fr-copy"><span class="fr-name">${f.name}</span><span class="fr-note">${f.note}</span></span>
    <span class="fr-add" style="${on ? 'background:var(--ink);color:#fff' : ''}">${on ? '✓' : '+'}</span>
  </button>`;
}

function refreshSheetToggles() {
  const host = $('#sheetFlavorList');
  if (!host) return;
  host.querySelectorAll('[data-sheet-toggle]').forEach(btn => {
    const on = state.mix.flavors.some(x => x.id === btn.dataset.sheetToggle);
    const add = btn.querySelector('.fr-add');
    add.textContent = on ? '✓' : '+';
    add.style.background = on ? 'var(--ink)' : '';
    add.style.color = on ? '#fff' : '';
  });
}

const BADGE_THEMES = { brewing:'Brewing', variety:'Variety', combos:'Combos', remixing:'Remixing', daily:'Daily' };
const BADGE_UNITS = { 'lab-regular':'brews', 'base-tour':'bases', 'pantry-explorer':'flavors', 'combo-hunter':'combos' };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const badgesOn = () => !!window.SodaBadges && !DEMO;
const tierRank = t => window.SodaBadges.TIERS.indexOf(t);
const unseenCount = s => (Array.isArray(s.unseen) ? s.unseen.length : s.unseen) || 0;
const badgeSrc = b => `icons/badges/${b.earnedAt ? b.icon : b.hidden ? 'mystery' : b.icon + '-locked'}.svg`;
const badgeImg = (b, px) => `<img class="b-art" src="${esc(badgeSrc(b))}" width="${px}" height="${px}" alt="" decoding="async" draggable="false">`;
const badgeDate = (ts, year) => new Date(ts).toLocaleDateString(undefined, year ? { month:'short', day:'numeric', year:'numeric' } : { month:'short', day:'numeric' });
const progressLabel = b => `${Number(b.progress.n)} / ${Number(b.progress.of)}${BADGE_UNITS[b.id] ? ' ' + BADGE_UNITS[b.id] : ''}`;
const firstSentence = s => (String(s).match(/^.*?[.!?](\s|$)/) || [s])[0].trim();
const barFill = (n, of) => `<span class="b-bar"><span style="transform:translateX(${Math.round(Math.min(1, n / of) * 100) - 100}%)"></span></span>`;
const byTier = list => list.slice().sort((a, b) => tierRank(b.tier) - tierRank(a.tier));
const topEarned = (list, n) => byTier(list.filter(b => b.earnedAt)).slice(0, n);
const getBadge = id => window.SodaBadges.getBadges().find(b => b.id === id);
const badgeTotals = () => { const s = window.SodaBadges.badgeSummary(); return { earned: Number(s.earned) || 0, total: Number(s.total) || 0, unseen: unseenCount(s) }; };
const setHTML = (el, html) => { if (el._html !== html) { el._html = html; el.innerHTML = html; } };

function badgeFan(list, px) {
  return `<span class="b-fan">${list.map((b, i) => `<span class="tier-${esc(b.tier)}" style="z-index:${3 - i}">${badgeImg(b, px)}</span>`).join('')}</span>`;
}

/* Lab row + Shelf header button (rendered with their screens, in place) */
function renderHomeBadges() {
  const host = $('#homeBadges');
  if (!badgesOn()) { host.hidden = true; return; }
  const all = window.SodaBadges.getBadges();
  const sum = badgeTotals();
  const unseen = sum.unseen;
  const fan = sum.earned ? topEarned(all, 3) : ['first-pour', 'shelf-starter', 'full-glass'].map(id => all.find(b => b.id === id)).filter(Boolean);
  host.hidden = false;
  setHTML(host, `
    <button class="badge-row" data-go="badges">
      ${badgeFan(fan, 36)}
      <span class="badge-row-copy">
        <span class="badge-row-name">Badges</span>
        <span class="badge-row-sub">${sum.earned} of ${sum.total} earned${unseen ? ` · ${unseen} new` : ''}</span>
      </span>
      ${unseen ? '<i class="b-dot" aria-label="New badges"></i>' : ''}
      <svg class="daily-chev" viewBox="0 0 24 24" width="18" height="18"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>`);
}

function renderShelfBadges() {
  const btn = $('#shelfBadges');
  if (!badgesOn()) { btn.hidden = true; return; }
  const sum = badgeTotals();
  const top = topEarned(window.SodaBadges.getBadges(), 1)[0];
  btn.hidden = false;
  btn.setAttribute('aria-label', `Badges, ${sum.earned} of ${sum.total}`);
  setHTML(btn, `${top ? badgeImg(top, 26) : '<img class="b-art" src="icons/badges/mystery.svg" width="26" height="26" alt="">'}
    <span>${sum.earned} / ${sum.total}</span>${sum.unseen ? '<i class="b-dot"></i>' : ''}`);
}

/* #/badges */
let badgeSeenIO = null;

function badgeTile(b) {
  const masked = b.hidden && !b.earnedAt;
  const sub = b.earnedAt ? badgeDate(b.earnedAt)
    : masked ? firstSentence(b.hint || '')
    : b.progress ? progressLabel(b)
    : b.short || b.how;
  return `
    <button class="badge-tile tier-${esc(b.tier)}${b.earnedAt ? ' is-earned' : ''}" data-badge="${esc(b.id)}">
      ${badgeImg(b, 64)}
      <span class="bt-name">${esc(masked ? '?' : b.name)}</span>
      <span class="bt-sub">${esc(sub)}</span>
      ${!b.earnedAt && b.progress ? barFill(b.progress.n, b.progress.of) : ''}
      ${b.unseen ? '<i class="b-dot"></i>' : ''}
    </button>`;
}

function renderBadges() {
  const all = window.SodaBadges.getBadges();
  const sum = badgeTotals();
  const unseen = sum.unseen;
  const tiers = window.SodaBadges.TIERS.filter(t => all.some(b => b.tier === t));
  const themes = [...new Set([...Object.keys(BADGE_THEMES), ...all.map(b => b.theme)])].filter(t => all.some(b => b.theme === t));
  setHTML($('#badgesBody'), `
    <div class="badge-summary">
      <div class="eyebrow">Badges earned</div>
      <div class="bs-count"><b>${sum.earned}</b><span>of ${sum.total}</span></div>
      ${unseen ? `<span class="bs-new"><i></i>${unseen} new</span>` : ''}
      ${barFill(sum.earned, sum.total).replace('b-bar', 'b-bar bs-bar')}
      <div class="bs-tiers" style="--cols:${tiers.length}">${tiers.map(t => {
        const of = all.filter(b => b.tier === t);
        return `<span class="tier-${esc(t)}"><i></i>${of.filter(b => b.earnedAt).length}/${of.length}</span>`;
      }).join('')}</div>
    </div>
    ${themes.map(t => {
      const list = all.filter(b => b.theme === t);
      return `<div class="section-head"><h2>${esc(BADGE_THEMES[t] || cap(t))}</h2><span class="link">${list.filter(b => b.earnedAt).length} of ${list.length}</span></div>
        <div class="badge-grid">${list.map(badgeTile).join('')}</div>`;
    }).join('')}`);
  watchUnseen();
}

// An unseen tile counts as seen once most of it has been on screen; its dot then fades.
function watchUnseen() {
  if (badgeSeenIO) badgeSeenIO.disconnect();
  const tiles = $$('#badgesBody .badge-tile .b-dot').map(d => d.parentElement);
  if (!tiles.length) return;
  badgeSeenIO = new IntersectionObserver(entries => {
    const ids = entries.filter(e => e.isIntersecting).map(e => e.target);
    if (!ids.length) return;
    ids.forEach(el => { badgeSeenIO.unobserve(el); el.classList.add('is-seen'); });
    window.SodaBadges.markBadgesSeen(ids.map(el => el.dataset.badge));
  }, { root: $('.view[data-view="badges"]'), threshold: .6 });
  tiles.forEach(el => badgeSeenIO.observe(el));
}

function badgesBack() {
  if (navState.depth > 0) history.back();
  else go('home', 'pop', { history: 'replace' });
}

function openBadgeSheet(id) {
  const b = getBadge(id);
  if (!b) return;
  window.SodaBadges.markBadgesSeen([id]);
  document.querySelector(`.badge-tile[data-badge="${CSS.escape(id)}"]`)?.classList.add('is-seen');
  const masked = b.hidden && !b.earnedAt;
  const bottle = b.batchExists ? state.saved.find(x => x.id === b.batch) : null;
  const group = esc(BADGE_THEMES[b.theme] || cap(b.theme));
  const li = (k, v) => `<div class="sheet-li"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  const rows = b.earnedAt ? [
      li('Earned', badgeDate(b.earnedAt, true)), li('Group', group),
      b.batch ? (bottle
        ? `<button class="sheet-li" data-badge-bottle="${esc(bottle.id)}"><span class="k">Bottle</span><span class="v bsh-bottle"><i style="background:${bottle.color}"></i>${esc(bottle.name)}<svg viewBox="0 0 24 24" width="16" height="16"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>`
        : li('Bottle', '<span class="bsh-gone">No longer on your shelf</span>')) : '']
    : masked ? [li('How to earn', '?'), li('Group', group)]
    : [li('Group', group), li('Progress', b.progress ? esc(progressLabel(b)) : 'Not yet')];
  openSheet(`
    <div class="bsh-hero tier-${esc(b.tier)}${b.earnedAt ? ' is-earned' : ''}">${badgeImg(b, 140)}</div>
    <span class="tier-chip tier-${masked ? 'common' : esc(b.tier)}">${masked ? 'Hidden' : esc(cap(b.tier))}</span>
    <h2 class="sheet-title bsh-title">${esc(masked ? '?' : b.name)}</h2>
    <p class="sheet-desc bsh-desc">${esc(masked ? b.hint || '?' : b.how.replace(/\.?$/, '.'))}</p>
    ${!b.earnedAt && b.progress ? barFill(b.progress.n, b.progress.of).replace('b-bar', 'b-bar bsh-bar') : ''}
    <div class="sheet-list">${rows.join('')}</div>
    ${bottle ? `<div class="sheet-actions"><button class="btn-primary" data-badge-bottle="${esc(bottle.id)}">View bottle</button></div>` : ''}`);
}

/* ── unlock banner queue ──
   Items: { kind:'badge', id, i, total } | { kind:'more', ids } | { kind:'welcome', count }.
   One banner at a time, 160 ms apart. Unlocks from a brew or merge wait until
   #/result has settled; a save waits 300 ms. Nothing is dropped. */
const bbLayer = $('#bbLayer');
const BB = { queue: [], cur: null, peeks: [], holdForResult: false, notBefore: 0, welcomeAt: 0, gapUntil: 0, timer: 0, gate: 0, sheet: false };
const sparkle = '<svg viewBox="0 0 24 24"><path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0Z"/></svg>';

document.addEventListener('badges:unlock', e => {
  if (!badgesOn()) return;
  const ids = (e.detail && e.detail.ids) || [];
  if (!ids.length) return;
  ids.slice(0, 3).forEach((id, i) => BB.queue.push({ kind:'badge', id, i: i + 1, total: ids.length }));
  if (ids.length > 3) BB.queue.push({ kind:'more', ids: ids.slice(3) });
  if (e.detail.source === 'brew' || e.detail.source === 'merge') {
    BB.holdForResult = true;
    clearTimeout(BB.gate);
    BB.gate = setTimeout(releaseResultHold, 1500);   // safety net if Result never opens
  } else {
    BB.notBefore = Math.max(BB.notBefore, performance.now() + 300);
  }
  refreshBadgeEntry();
  pumpBanners();
});

document.addEventListener('badges:welcome', e => {
  if (!badgesOn() || !(e.detail && e.detail.count > 0)) return;
  BB.queue.unshift({ kind:'welcome', count: Number(e.detail.count) });
  BB.welcomeAt = Infinity;
  // 800 ms after the first paint that follows load
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => { BB.welcomeAt = 0; pumpBanners(); }, 800)));
});

function releaseResultHold() {
  clearTimeout(BB.gate);
  if (!BB.holdForResult) return;
  BB.holdForResult = false;
  pumpBanners();
}

// Called by go(): the first banner starts on Result's transform transitionend + 240 ms (720 ms at most).
function badgeRoute(name, el) {
  if (name !== 'badges' && badgeSeenIO) { badgeSeenIO.disconnect(); badgeSeenIO = null; }
  if (!BB.holdForResult) return;
  clearTimeout(BB.gate);
  if (name !== 'result') { BB.gate = setTimeout(releaseResultHold, 240); return; }
  BB.gate = setTimeout(releaseResultHold, 720);
  if (reducedMotion.matches) return;
  const done = e => {
    if (e.target !== el || e.propertyName !== 'transform') return;
    el.removeEventListener('transitionend', done);
    clearTimeout(BB.gate);
    BB.gate = setTimeout(releaseResultHold, 240);
  };
  el.addEventListener('transitionend', done);
}

function refreshBadgeEntry() {
  if (state.view === 'home') renderHomeBadges();
  if (state.view === 'shelf') renderShelfBadges();
  if (state.view === 'badges') renderBadges();
}

function pumpBanners() {
  clearTimeout(BB.timer);
  if (BB.cur || !BB.queue.length) return;
  const head = BB.queue[0];
  if (BB.sheet || (head.kind !== 'welcome' && BB.holdForResult)) { layoutPeeks(0, 0); return; }
  const wait = Math.max(head.kind === 'welcome' ? BB.welcomeAt : BB.notBefore, BB.gapUntil) - performance.now();
  if (wait === Infinity) return;
  if (wait > 0) { BB.timer = setTimeout(pumpBanners, wait); return; }
  showBanner(BB.queue.shift());
}

function bannerHTML(item) {
  if (item.kind === 'welcome') {
    const fan = topEarned(window.SodaBadges.getBadges(), 3);
    return `<div class="bb-art">${badgeFan(fan, 40)}</div>
      <div class="bb-text">
        <div class="bb-eyebrow">Welcome back</div>
        <div class="bb-name">You've already earned ${item.count} badge${item.count === 1 ? '' : 's'}</div>
        <div class="bb-how">We counted the bottles on your shelf.</div>
      </div>
      <div class="bb-actions"><button class="bb-later" data-bb-close>Not now</button><button class="bb-go" data-bb-badges>View badges</button></div>`;
  }
  const chev = '<svg class="bb-chev" viewBox="0 0 10 10" width="10" height="10"><path d="m3.2 1.2 3.8 3.8-3.8 3.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  if (item.kind === 'more') {
    const all = window.SodaBadges.getBadges();
    const fan = item.ids.slice(0, 3).map(id => all.find(b => b.id === id)).filter(Boolean);
    return `<div class="bb-art">${badgeFan(fan, 36)}</div>
      <div class="bb-text">
        <div class="bb-eyebrow">Badges unlocked</div>
        <div class="bb-name">+${item.ids.length} more badge${item.ids.length === 1 ? '' : 's'}</div>
        <div class="bb-how">Tap to see them all</div>
      </div>${chev}`;
  }
  const b = getBadge(item.id);
  const sparkles = tierRank(b.tier) >= tierRank('rare') ? [0, 1, 2].map(i => `<i class="bb-spark bb-spark--${i}">${sparkle}</i>`).join('') : '';
  return `<div class="bb-art"><i class="bb-glow"></i><i class="bb-ring"></i>${b.tier === 'mythic' ? '<i class="bb-ring bb-ring--2"></i>' : ''}
      <span class="bb-pop"><span class="bb-pop-in">${badgeImg(b, 52)}</span></span>${sparkles}</div>
    <div class="bb-text">
      <div class="bb-eyebrow">Badge unlocked<i></i><span class="bb-tier">${esc(b.tier)}</span></div>
      <div class="bb-name">${esc(b.name)}</div>
      <div class="bb-how">${esc(String(b.how).replace(/\.$/, ''))}</div>
    </div>
    ${item.total > 1 ? `<span class="bb-count">${item.i} of ${item.total}</span>` : ''}${chev}`;
}

const waitingBadges = () => BB.queue.filter(q => q.kind !== 'welcome').length;

// Blank cards behind the front banner, nearest first, at slots from..from+n-1.
function layoutPeeks(from, n) {
  while (BB.peeks.length > n) BB.peeks.pop().remove();
  while (BB.peeks.length < n) {
    const p = document.createElement('div');
    p.className = 'bb-peek';
    p.dataset.slot = from + BB.peeks.length + 1;   // starts one slot further back, then steps in
    bbLayer.prepend(p);
    BB.peeks.push(p);
  }
  void bbLayer.offsetWidth;
  BB.peeks.forEach((p, k) => { p.dataset.slot = from + k; });
}

function showBanner(item) {
  const b = item.kind === 'badge' ? getBadge(item.id) : null;
  if (item.kind === 'badge' && !b) { pumpBanners(); return; }
  const el = document.createElement('div');
  el.className = `bb bb--${item.kind}${b ? ' tier-' + b.tier : ''}`;
  if (b) el.dataset.id = b.id;
  el.setAttribute('role', item.kind === 'welcome' ? 'dialog' : 'button');
  el.setAttribute('aria-label', item.kind === 'badge' ? `Badge unlocked: ${b.name}` : item.kind === 'more' ? `${item.ids.length} more badges unlocked` : 'Welcome back');
  el.innerHTML = bannerHTML(item);
  // the next banner takes the front peek's place instead of dropping in again
  const front = BB.peeks[0] && BB.peeks[0].dataset.slot === '0' ? BB.peeks.shift() : null;
  if (front) el.classList.add('is-from-peek');
  bbLayer.append(el);
  void el.offsetWidth;
  el.classList.add('is-in');
  if (front) front.remove();
  layoutPeeks(1, item.kind === 'welcome' ? 0 : Math.min(2, waitingBadges()));

  const hold = reducedMotion.matches ? 4000 : item.kind === 'welcome' ? 8000 : b && b.tier === 'mythic' ? 3000 : 2200;
  // hold starts once the box is in; press or hover pauses it
  const cur = BB.cur = { el, item, left: hold, at: 0, timer: 0, paused: 0, live: false, out: false };
  const run = () => { if (cur.out || cur.paused) return; cur.at = performance.now(); cur.timer = setTimeout(() => exitBanner(cur), cur.left); };
  const pause = () => { if (cur.paused++ || !cur.at) return; clearTimeout(cur.timer); cur.left -= performance.now() - cur.at; cur.at = 0; };
  const resume = () => { if (!cur.paused || --cur.paused) return; if (cur.live) run(); };
  setTimeout(() => { cur.live = true; run(); }, reducedMotion.matches ? 240 : 520);

  let y0 = null, flicked = false;
  el.addEventListener('pointerdown', e => { y0 = e.clientY; pause(); });
  el.addEventListener('pointermove', e => {
    if (y0 === null || flicked || e.clientY - y0 > -18) return;
    flicked = true; exitBanner(cur, true);
  });
  const up = () => { if (y0 !== null) { y0 = null; resume(); } };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  if (matchMedia('(hover: hover)').matches) { el.addEventListener('pointerenter', pause); el.addEventListener('pointerleave', resume); }
  el.addEventListener('click', e => {
    if (flicked) return;
    if (e.target.closest('[data-bb-close]')) { exitBanner(cur); return; }
    if (e.target.closest('[data-bb-badges]') || item.kind === 'more') { exitBanner(cur); if (state.view !== 'badges') go('badges', 'push'); return; }
    if (item.kind === 'badge') {
      exitBanner(cur);
      layoutPeeks(0, 0);
      BB.sheet = true;     // the queue waits for the sheet, then resumes 400 ms after it closes
      openBadgeSheet(item.id);
      new MutationObserver((_, mo) => {
        if (!sheetLayer.hidden) return;
        mo.disconnect();
        BB.sheet = false;
        BB.gapUntil = Math.max(BB.gapUntil, performance.now() + 400);
        pumpBanners();
      }).observe(sheetLayer, { attributes: true, attributeFilter: ['hidden'] });
    }
  });
}

function exitBanner(cur, fast) {
  if (cur.out) return;
  cur.out = true;
  clearTimeout(cur.timer);
  const el = cur.el;
  el.classList.add(fast ? 'is-flick' : 'is-out');
  // the waiting peeks step forward while the front leaves
  const next = cur.item.kind === 'welcome' || BB.queue[0]?.kind === 'welcome' ? 0 : waitingBadges();
  layoutPeeks(0, next ? 1 + Math.min(2, next - 1) : 0);
  const ms = reducedMotion.matches ? 240 : fast ? 240 : 360;
  afterTransition(el, ms + 200, () => {
    el.remove();
    if (BB.cur === cur) BB.cur = null;
    BB.gapUntil = performance.now() + 160;
    pumpBanners();
  });
}

/* ───────────── toast ───────────── */

let toastTimer = null;
function hideToast() {
  clearTimeout(toastTimer);
  toastEl.classList.remove('is-show', 'has-action');
}
/* action: optional { label, run } shown as a button, e.g. Undo */
function toast(msg, action) {
  toastEl.textContent = msg;
  if (action) {
    const btn = document.createElement('button');
    btn.className = 'toast-act';
    btn.textContent = action.label;
    btn.addEventListener('click', () => { hideToast(); action.run(); });
    toastEl.append(btn);
  }
  toastEl.classList.toggle('has-action', !!action);
  toastEl.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 4000 : 1900);
}

/* ───────────── global events ───────────── */

document.addEventListener('click', e => {
  const t = e.target;

  const baseBtn = t.closest('[data-base]');
  if (baseBtn) { state.mix.base = baseBtn.dataset.base; persist(); renderMix(); return; }

  const chip = t.closest('[data-flavor-toggle]');
  if (chip) { toggleFlavor(chip.dataset.flavorToggle); return; }

  const removeFlavor = t.closest('[data-flavor-remove]');
  if (removeFlavor) {
    const id = removeFlavor.dataset.flavorRemove;
    state.mix.flavors = state.mix.flavors.filter(x => x.id !== id);
    persist();
    renderMix();
    toast(`${flavorById(id).name} removed`);
    return;
  }

  const all = t.closest('[data-all-flavors]');
  if (all) { openAllFlavors(); return; }

  if (t.closest('#showAllFlavors')) {
    state.showAllFlavors = !state.showAllFlavors;
    renderMix();
    return;
  }

  const sheetToggle = t.closest('[data-sheet-toggle]');
  if (sheetToggle) {
    const id = sheetToggle.dataset.sheetToggle;
    const result = toggleFlavor(id);
    refreshSheetToggles();
    if (result === 'added') toast(`${flavorById(id).name} added`);
    return;
  }

  const tempBtn = t.closest('[data-temp]');
  if (tempBtn) { state.mix.temp = tempBtn.dataset.temp; persist(); renderMix(); return; }

  const addFlavor = t.closest('[data-add-flavor]');
  if (addFlavor) {
    const id = addFlavor.dataset.addFlavor;
    const result = toggleFlavor(id);
    if (result === 'removed') { toast('Removed from mix'); addFlavor.textContent = 'Add to mix'; }
    else { toast(`${flavorById(id).name} added to the mix`); closeSheet(() => go('mix', 'push')); }
    return;
  }

  const flavorRow = t.closest('[data-flavor]');
  if (flavorRow) { openFlavorSheet(flavorRow.dataset.flavor); return; }

  const badgeEl = t.closest('[data-badge]');
  if (badgeEl) { openBadgeSheet(badgeEl.dataset.badge); return; }

  const badgeBottle = t.closest('[data-badge-bottle]');
  if (badgeBottle) { closeSheet(() => openBatchSheet(badgeBottle.dataset.badgeBottle)); return; }

  const batchEl = t.closest('[data-batch]');
  if (batchEl) { openBatchSheet(batchEl.dataset.batch); return; }

  const remix = t.closest('[data-remix]');
  if (remix) {
    const b = state.saved.find(x => x.id === remix.dataset.remix);
    if (b) {
      startRemix(b.id);
      badges('evaluateBadges', 'remix', { batch: b });
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

// fizz slider: recompute on input, persist when the drag ends
{
  const el = $('#fizzRange');
  el.addEventListener('input', () => {
    state.mix.fizz = Number(el.value);
    renderMix();
  });
  el.addEventListener('change', persist);
}

// per-flavor sliders are rebuilt on every render, so listen on the container
$('#flavorSliders').addEventListener('input', e => {
  const input = e.target.closest('[data-flavor-range]');
  if (!input) return;
  const id = input.dataset.flavorRange;
  const item = state.mix.flavors.find(x => x.id === id);
  if (!item) return;
  item.value = Math.round(clamp(Number(input.value), 0, 100));
  // cheap live update: recolor, re-share, redraw the bottle, leave the input alone
  const shares = sharesOf(state.mix).sort((a, b) => b.share - a.share);
  const pct = $('#flavorSliders').querySelector(`[data-flavor-pct="${id}"]`);
  if (pct) pct.textContent = pctText(shares.find(s => s.id === id)?.share || 0);
  $('#mixShares').innerHTML = shares.map(s => `<i style="flex:${Math.max(s.share, .01)};background:${s.f.color}"></i>`).join('');
  const color = blendColor(state.mix);
  syncStage($('#mixBottle'), { color, fill: .82, fizz: state.mix.fizz, seed: 21 });
  $('#mixName').textContent = makeName(state.mix);
  $('#mixSub').textContent = `${baseById(state.mix.base).name} · ${shares.map(s => s.f.name).join(', ')}`;
  syncFizz();
});
$('#flavorSliders').addEventListener('change', e => {
  if (e.target.closest('[data-flavor-range]')) persist();
});

$('#brewBtn').addEventListener('click', startBrew);

// iOS Safari only shows :active press states once a touchstart listener exists
document.addEventListener('touchstart', () => {}, { passive: true });

$('#mixReset').addEventListener('click', () => {
  badges('clearRemixFrom');
  state.mix = defaultMix();
  persist();
  renderMix();
  toast('Cleared');
});

$('#flavorSearch').addEventListener('input', e => {
  flavorQuery = e.target.value;
  renderFlavorList();
});

// the "all flavors" sheet is rebuilt each time it opens, so filter by delegation
document.addEventListener('input', e => {
  if (!e.target || e.target.id !== 'sheetFlavorSearch') return;
  const q = e.target.value.trim().toLowerCase();
  const host = $('#sheetFlavorList');
  if (!host) return;
  host.querySelectorAll('[data-name]').forEach(row => {
    row.hidden = !!q && !row.dataset.name.includes(q);
  });
});

// keyboard niceties
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (state.view === 'badges' && !overlayOpen()) badgesBack();
  if (sheetLayer.classList.contains('is-open')) closeSheet();
});

/* ───────────── boot ───────────── */

function demoSeed() {
  if (state.saved.length) return;
  const examples = [
    { base:'soda',    flavors:[{ id:'cherry', value:80 }, { id:'cola', value:60 }], fizz:62, temp:'ice' },
    { base:'tonic',   flavors:[{ id:'lime', value:70 }, { id:'mint', value:45 }],   fizz:88, temp:'ice' },
    { base:'cream',   flavors:[{ id:'peach', value:100 }],                         fizz:40, temp:'chilled' },
    { base:'mineral', flavors:[{ id:'cucumber', value:55 }, { id:'rose', value:35 }], fizz:70, temp:'ice' },
  ];
  examples.forEach((e, i) => {
    state.count += 1;
    const b = Object.assign({
      id: 'demo' + i,
      num: state.count,
      name: makeName(e),
      color: blendColor(e),
      date: Date.now() - Math.round((i + 1) * 1.2 * 864e5),
    }, e);
    state.saved.push(sanitizeBatch(b));
  });
  persist();
}

function bootRoute() {
  const m = location.hash.match(VIEW_RE);
  if (!m || (m[1] === 'badges' && !badgesOn())) return false;
  const v = m[1];

  if (v === 'result') {
    let batch = state.lastBatch || state.saved[0];
    if (!batch) {
      const mix = { base:'soda', flavors:[{ id:'cherry', value:80 }, { id:'cola', value:60 }], fizz:62, temp:'ice' };
      state.count += 1;
      batch = Object.assign({
        id: 'preview', num: state.count, name: makeName(mix),
        color: blendColor(mix), date: Date.now(),
      }, mix);
    }
    renderResult(sanitizeBatch(batch), !state.lastBatch);
    go('result', 'fade', { history: 'none' });
    return true;
  }
  go(v, 'fade', { history: 'none' });
  return true;
}

function clock() {
  const d = new Date();
  let h = d.getHours() % 12; if (h === 0) h = 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  $('#sbTime').textContent = `${h}:${m}`;
}

load();
const DEMO = !!new URLSearchParams(location.search).get('demo');
if (DEMO) demoSeed();
badges('init', {
  FLAVORS, BASES, COMBO_NAMES, isObj, ID_RE, intIn,
  shelf: () => state.saved, count: () => state.count, demo: DEMO,
});
clock();
setInterval(clock, 15000);

renderHome();
renderShelf();
renderFlavorList();
renderMix();
updateTabs('home');
bootRoute();
navState = { v: state.view, depth: 0, root: state.view };
history.replaceState(navState, '', location.pathname + location.search + '#/' + state.view);

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    // 'none' rechecks version.js on update. The default ('imports') may reuse
    // a cached copy, so a bump would keep the old cache name.
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
  });
}

})();
