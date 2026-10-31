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
  'blueberry+lemon':'Blue Spark',
  'raspberry+cream':'Raspberry Cream',
  'mango+lime':'Mango Lime',
  'passion+orange':'Passion Sun',
  'coconut+pineapple':'Island Fizz',
  'vanilla+cherry':'Cherry Vanilla',
  'caramel+cola':'Salted Cola',
  'hazelnut+coffee':'Hazel Brew',
  'cinnamon+apple':'Spiced Orchard',
  'lavender+lemon':'Lavender Lemonade',
  'hibiscus+lime':'Hibiscus Lime',
  'yuzu+ginger':'Yuzu Ginger',
  'bloodorange+cola':'Blood Orange Cola',
  'pear+ginger':'Pear Ginger',
  'plum+vanilla':'Plum Velvet',
  'cardamom+cream':'Cardamom Cream',
  'saltedlemon+mint':'Salted Mint',
  'watermelon+mint':'Melon Cooler',
  'anise+coffee':'Black Licorice Brew',
  'clove+orange':'Clove Orange',
};

const SWEET_WORDS = ['Bone dry','Barely sweet','Light','Balanced','Sweet','Candy'];
const FIZZ_WORDS  = ['Still','Soft','Gentle','Crisp','Lively','Volcanic'];
const FIZZ_ADJ    = ['still','soft','gentle','crisp','lively','wild'];

const CURATED = ['cola','cherry','lemon','lime','orange','grape','cream','rootbeer'];

/* ───────────── rarities, finishes, charms ───────────── */

const RARITY = [
  { id:'common',    name:'Common',    weight:50,   color:'#8E8E93', stars:1, odds:'1 in 2' },
  { id:'uncommon',  name:'Uncommon',  weight:27,   color:'#2E9E63', stars:2, odds:'1 in 4' },
  { id:'rare',      name:'Rare',      weight:14,   color:'#2E7BD6', stars:3, odds:'1 in 7' },
  { id:'epic',      name:'Epic',      weight:6.5,  color:'#9B4FD6', stars:4, odds:'1 in 15' },
  { id:'legendary', name:'Legendary', weight:2,    color:'#D69A22', stars:5, odds:'1 in 50' },
  { id:'mythic',    name:'Mythic',    weight:.5,   color:'#D6457C', stars:6, odds:'1 in 200' },
];

const FINISHES = [
  { id:'none',    name:'Clear',   sub:'Clean glass',        swatch:'#E8EEF1', luck:0,   desc:'Nothing added. Just the drink.' },
  { id:'glitter', name:'Glitter', sub:'Gold dust',          swatch:'#E8C25A', luck:.05, desc:'Edible gold dust, suspended and turning.' },
  { id:'pearl',   name:'Pearl',   sub:'Iridescent swirl',   swatch:'#DCC9EC', luck:.06, desc:'A soft mother-of-pearl shimmer.' },
  { id:'aurora',  name:'Aurora',  sub:'Polar lights',       swatch:'#6FD3B0', luck:.07, desc:'Green and violet ribbons, slow as a night sky.' },
  { id:'cosmic',  name:'Cosmic',  sub:'Bottled nebula',     swatch:'#5B4B9E', luck:.08, desc:'A small galaxy, carbonated.' },
  { id:'ember',   name:'Ember',   sub:'Warm sparks',        swatch:'#E2703A', luck:.07, desc:'Sparks that drift up and never burn.' },
];

const CHARMS = [
  { id:'star',   name:'Star',    art:'<path d="M12 2.5l2.6 5.7 6.2.7-4.6 4.3 1.3 6.1L12 16.2l-5.5 3.1 1.3-6.1L3.2 8.9l6.2-.7z" fill="#F5C542" stroke="#B8860B" stroke-width=".8" stroke-linejoin="round"/><circle cx="9.2" cy="8.4" r=".9" fill="#FFF6D0"/>' },
  { id:'heart',  name:'Heart',   art:'<path d="M12 20s-7.4-4.6-7.4-9.4A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.4 3.2C19.4 15.4 12 20 12 20Z" fill="#F26D8E" stroke="#C23A5C" stroke-width=".8"/><ellipse cx="9" cy="10.4" rx="1.5" ry="1" fill="#FFD3DE" opacity=".8"/>' },
  { id:'cherry', name:'Cherry',  art:'<path d="M12 7c0-2 1.4-3.4 3.2-4" fill="none" stroke="#4F8A3A" stroke-width="1.2" stroke-linecap="round"/><path d="M12 7c-1-1.6-2.6-2.2-4-2" fill="none" stroke="#4F8A3A" stroke-width="1.2" stroke-linecap="round"/><circle cx="8.4" cy="14.4" r="3.5" fill="#D62F4A" stroke="#9E1B33" stroke-width=".8"/><circle cx="15.4" cy="15.4" r="3.2" fill="#E8425C" stroke="#9E1B33" stroke-width=".8"/><circle cx="7.4" cy="13.2" r="1" fill="#FF9AA8" opacity=".9"/>' },
  { id:'flower', name:'Flower',  art:'<g fill="#FFF6F8" stroke="#E7C6D2" stroke-width=".6"><circle cx="12" cy="5.6" r="3"/><circle cx="18" cy="10" r="3"/><circle cx="15.7" cy="17.2" r="3"/><circle cx="8.3" cy="17.2" r="3"/><circle cx="6" cy="10" r="3"/></g><circle cx="12" cy="12" r="2.8" fill="#F5C542"/>' },
  { id:'moon',   name:'Moon',    art:'<path d="M16.6 3.6a8.6 8.6 0 1 0 4.2 13.6A9.2 9.2 0 0 1 16.6 3.6Z" fill="#F0D27A" stroke="#C9A43F" stroke-width=".8"/><path d="M18.4 4.6l.7 1.5 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2z" fill="#FFF3C4"/>' },
  { id:'shell',  name:'Shell',   art:'<path d="M12 20c-4.8 0-8-3.2-8-7.2C4 8.6 7.4 4 12 4s8 4.6 8 8.8c0 4-3.2 7.2-8 7.2Z" fill="#F7B9A0" stroke="#C97E63" stroke-width=".8"/><path d="M12 20V5M8.6 19.2 9.6 6M15.4 19.2 14.4 6M5.6 16.6 7.4 7.4M18.4 16.6 16.6 7.4" fill="none" stroke="#D99276" stroke-width=".7" stroke-linecap="round"/>' },
  { id:'bow',    name:'Bow',     art:'<path d="M12 12 5 8.4c-1.4-.7-2.4.2-2.4 1.8 0 1.7 1.1 3.4 2.6 3.9L12 12Zm0 0 7-3.6c1.4-.7 2.4.2 2.4 1.8 0 1.7-1.1 3.4-2.6 3.9L12 12Z" fill="#F27BA4" stroke="#C24570" stroke-width=".8" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.2" fill="#F7A6C0" stroke="#C24570" stroke-width=".8"/>' },
  { id:'bolt',   name:'Bolt',    art:'<path d="M13.6 2.5 5.2 13.2h5.1l-1.4 8.3 8.9-11.2h-5.3z" fill="#F7C948" stroke="#C79A1E" stroke-width=".8" stroke-linejoin="round"/>' },
  { id:'clover', name:'Clover',  art:'<g fill="#5FAE4A" stroke="#3C7D2C" stroke-width=".6"><circle cx="12" cy="7.6" r="3.4"/><circle cx="16.4" cy="12" r="3.4"/><circle cx="12" cy="16.4" r="3.4"/><circle cx="7.6" cy="12" r="3.4"/></g><path d="M12 15c.4 2.4-.4 4.4-2 5.8" fill="none" stroke="#3C7D2C" stroke-width="1.1" stroke-linecap="round"/>' },
  { id:'gem',    name:'Gem',     art:'<path d="M12 3.4 20 9.4l-8 11.2L4 9.4Z" fill="#6FD8E8" stroke="#2E9BAF" stroke-width=".8" stroke-linejoin="round"/><path d="M4 9.4h16M12 3.4 8.6 9.4 12 20.6l3.4-11.2z" fill="none" stroke="#B9F2FA" stroke-width=".7" opacity=".85"/>' },
  { id:'pearl',  name:'Pearl',   art:'<circle cx="12" cy="12" r="8" fill="#F3EEF8"/><circle cx="12" cy="12" r="8" fill="none" stroke="#C9C2D6" stroke-width=".7"/><ellipse cx="9.2" cy="8.8" rx="2.8" ry="1.9" fill="#FFF" opacity=".8"/><ellipse cx="14.6" cy="15.2" rx="2" ry="1.2" fill="#E7D8F2" opacity=".7"/>' },
  { id:'planet', name:'Planet',  art:'<circle cx="12" cy="11.6" r="6.4" fill="#6E93D8"/><circle cx="10" cy="9.4" r="2.2" fill="#A8C2F2" opacity=".8"/><ellipse cx="12" cy="12.4" rx="10.2" ry="2.6" fill="none" stroke="#E9C77A" stroke-width="1.4" transform="rotate(-18 12 12.4)"/>' },
];

const MAX_CHARMS = 6;   // one limit for placing, merging, rarity luck and score

const charmById = id => CHARMS.find(c => c.id === id);
const finishById = id => FINISHES.find(f => f.id === id) || FINISHES[0];
const rarityById = id => RARITY.find(r => r.id === id) || RARITY[0];


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
  const names = fs.map(f => f.name.toLowerCase());
  const flavorList = names.length > 2
    ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    : names.join(' and ');
  const lead = fs.length
    ? `${flavorList} over ${baseById(mix.base).name.toLowerCase()}, served ${TEMP_LABEL(mix.temp)}.`
    : `Unflavored ${baseById(mix.base).name.toLowerCase()}, served ${TEMP_LABEL(mix.temp)}.`;

  return `${cap(lead)} ${cap(a)} leads, ${b} follows, and the carbonation stays ${FIZZ_ADJ[mix.fizz]}.`;
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const TEMP_LABEL = id => (TEMPS.find(t => t.id === id) || TEMPS[0]).label.toLowerCase();

/* ───────────── the bottle ───────────── */

const BODY = 'M74 18 C74 33 84 41 90 57 C96 73 98 86 98 102 L98 210 C98 226 88 234 74 234 L46 234 C32 234 22 226 22 210 L22 102 C22 86 24 73 30 57 C36 41 46 33 46 18 Z';
let uidCounter = 0;

/* liquid finishes: glitter, pearl, aurora, cosmic, ember */
function finishLayer(finish, uid, color, surface) {
  if (!finish || finish === 'none') return '';
  const rnd = mulberry32(420 + hashStr(color + finish));
  const bottom = 236;

  if (finish === 'glitter') {
    let dots = '';
    for (let i = 0; i < 34; i++) {
      const x = 24 + rnd() * 72;
      const y = surface + 8 + rnd() * (bottom - surface - 14);
      const r = .55 + rnd() * 1.25;
      const dur = (1.4 + rnd() * 2.6).toFixed(2);
      const begin = (-rnd() * 3).toFixed(2);
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#FFF2BE" opacity=".8"><animate attributeName="opacity" values=".12;1;.12" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></circle>`;
    }
    for (let i = 0; i < 7; i++) {
      const x = 30 + rnd() * 60;
      const y = surface + 14 + rnd() * (bottom - surface - 26);
      const s = .8 + rnd() * 1.4;
      dots += `<path d="M${x} ${y - s * 2.4} L${x + s * .55} ${y - s * .55} L${x + s * 2.4} ${y} L${x + s * .55} ${y + s * .55} L${x} ${y + s * 2.4} L${x - s * .55} ${y + s * .55} L${x - s * 2.4} ${y} L${x - s * .55} ${y - s * .55}Z" fill="#FFF9DC" opacity=".85"><animate attributeName="opacity" values=".1;.95;.1" dur="${(2.2 + rnd() * 2.4).toFixed(2)}s" begin="${(-rnd() * 4).toFixed(2)}s" repeatCount="indefinite"/></path>`;
    }
    return dots;
  }

  if (finish === 'pearl') {
    return `<g opacity=".62">
      <rect x="-30" y="${surface}" width="180" height="${bottom - surface}" fill="url(#pearl-${uid})"/>
      <g><animateTransform attributeName="transform" type="translate" values="-34 0; 34 0; -34 0" dur="13s" repeatCount="indefinite"/>
        <ellipse cx="42" cy="${surface + (bottom - surface) * .32}" rx="34" ry="46" fill="#FFFFFF" opacity=".16"/>
        <ellipse cx="82" cy="${surface + (bottom - surface) * .66}" rx="30" ry="42" fill="#D9C6FF" opacity=".13"/>
      </g>
    </g>`;
  }

  if (finish === 'aurora') {
    const y1 = surface + (bottom - surface) * .28;
    const y2 = surface + (bottom - surface) * .52;
    const y3 = surface + (bottom - surface) * .76;
    return `<g opacity=".72">
      <g><animateTransform attributeName="transform" type="translate" values="0 4; 0 -6; 0 4" dur="9s" repeatCount="indefinite"/>
        <path d="M-20 ${y1} C 18 ${y1 - 26}, 46 ${y1 + 28}, 82 ${y1 + 2} S 128 ${y1 - 18}, 150 ${y1 + 6} L150 ${bottom} L-20 ${bottom}Z" fill="url(#aur-a-${uid})"/>
        <path d="M-20 ${y2} C 24 ${y2 + 20}, 54 ${y2 - 24}, 90 ${y2 + 4} S 132 ${y2 + 22}, 150 ${y2 - 4} L150 ${bottom} L-20 ${bottom}Z" fill="url(#aur-b-${uid})" opacity=".8"/>
        <path d="M-20 ${y3} C 20 ${y3 - 16}, 52 ${y3 + 22}, 86 ${y3 - 2} S 130 ${y3 - 18}, 150 ${y3 + 8} L150 ${bottom} L-20 ${bottom}Z" fill="url(#aur-c-${uid})" opacity=".7"/>
      </g>
    </g>`;
  }

  if (finish === 'cosmic') {
    let stars = '';
    for (let i = 0; i < 26; i++) {
      const x = 22 + rnd() * 76;
      const y = surface + 6 + rnd() * (bottom - surface - 12);
      const r = .35 + rnd() * 1.05;
      stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#FFFFFF" opacity=".9"><animate attributeName="opacity" values=".15;.95;.15" dur="${(1.8 + rnd() * 3.2).toFixed(2)}s" begin="${(-rnd() * 4).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
    }
    return `<g>
      <rect x="0" y="${surface}" width="120" height="${bottom - surface}" fill="#141029" opacity=".5"/>
      <ellipse cx="44" cy="${surface + (bottom - surface) * .38}" rx="46" ry="54" fill="url(#neb-a-${uid})" opacity=".85"/>
      <ellipse cx="86" cy="${surface + (bottom - surface) * .7}" rx="40" ry="46" fill="url(#neb-b-${uid})" opacity=".7"/>
      <g><animateTransform attributeName="transform" type="rotate" values="0 60 ${(surface + bottom) / 2}; 360 60 ${(surface + bottom) / 2}" dur="46s" repeatCount="indefinite"/>
        <ellipse cx="60" cy="${(surface + bottom) / 2}" rx="46" ry="18" fill="none" stroke="#B9A6FF" stroke-width="5" opacity=".12" transform="rotate(-24 60 ${(surface + bottom) / 2})"/>
      </g>
      ${stars}
    </g>`;
  }

  if (finish === 'ember') {
    let sparks = '';
    for (let i = 0; i < 16; i++) {
      const x = 26 + rnd() * 68;
      const y = surface + 10 + rnd() * (bottom - surface - 20);
      const r = .8 + rnd() * 1.7;
      const dur = (3 + rnd() * 3.4).toFixed(2);
      const begin = (-rnd() * 5).toFixed(2);
      sparks += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#FFB15C" opacity=".8"><animate attributeName="cy" values="${y.toFixed(1)};${(surface + 4).toFixed(1)}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.9;0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></circle>`;
    }
    return `<g><rect x="0" y="${surface}" width="120" height="${bottom - surface}" fill="url(#ember-${uid})" opacity=".35"/>${sparks}</g>`;
  }

  return '';
}

function bottleSVG(opts) {
  const o = Object.assign({ color:'#9BD3E8', fill:.78, fizz:3, seed:1, animate:false, cls:'', finish:'none', still:false }, opts);
  const uid = 'v' + (++uidCounter);
  const color = o.color;
  const light = lighten(color, .30);
  const deep  = darken(color, .36);
  const surface = Math.round(226 - clamp(o.fill, .04, .94) * 168);
  const rx = clamp(30 + (surface - 58) / 44 * 7, 27, 37);
  const rise = -(226 - surface);

  const rnd = mulberry32(o.seed || 1);
  const count = o.fizz <= 0 ? 0 : Math.round((o.still ? 3 : 5) + o.fizz * (o.still ? 2.2 : 4.2));
  let bubbles = '';
  for (let i = 0; i < count; i++) {
    const cx = 30 + rnd() * 60;
    const cy = 220 + rnd() * 10;
    const r = 1 + rnd() * (o.still ? 1.6 : 2.2);
    const dur = 2.1 + rnd() * 2.6;
    const delay = -rnd() * dur;
    bubbles += `<circle class="bub" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" style="--rise:${rise}px;animation-duration:${dur.toFixed(2)}s;animation-delay:${delay.toFixed(2)}s"/>`;
  }

  const offset = o.animate ? (250 - surface) : 0;
  const finish = finishLayer(o.finish, uid, color, surface);
  const capRidges = [44.5, 48.5, 52.5, 56.5, 60.5, 64.5, 68.5, 72.5, 76.5]
    .map(x => `<line x1="${x}" y1="6.4" x2="${x}" y2="18.4"/>`).join('');

  return `<svg class="bottle ${o.cls} ${o.still ? 'bottle--still' : ''}" viewBox="0 0 120 250" role="img" aria-label="A bottle of soda">
    <defs>
      <clipPath id="bc-${uid}"><path d="${BODY}"/></clipPath>
      <clipPath id="lc-${uid}"><rect x="0" y="${surface}" width="120" height="${252 - surface}"/></clipPath>
      <linearGradient id="lg-${uid}" x1=".12" y1="0" x2=".86" y2="1">
        <stop offset="0" stop-color="${lighten(color, .42)}"/>
        <stop offset=".2" stop-color="${light}"/>
        <stop offset=".62" stop-color="${color}"/>
        <stop offset="1" stop-color="${deep}"/>
      </linearGradient>
      <linearGradient id="dp-${uid}" x1="0" y1="${surface}" x2="0" y2="236" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset=".55" stop-color="#000" stop-opacity=".08"/>
        <stop offset="1" stop-color="#000" stop-opacity=".34"/>
      </linearGradient>
      <linearGradient id="gl-${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".52"/>
        <stop offset=".07" stop-color="#fff" stop-opacity=".15"/>
        <stop offset=".28" stop-color="#fff" stop-opacity=".03"/>
        <stop offset=".62" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".88" stop-color="#fff" stop-opacity=".11"/>
        <stop offset="1" stop-color="#fff" stop-opacity=".48"/>
      </linearGradient>
      <radialGradient id="in-${uid}" cx=".5" cy=".5" r=".62">
        <stop offset=".52" stop-color="#000" stop-opacity="0"/>
        <stop offset=".84" stop-color="#000" stop-opacity=".10"/>
        <stop offset="1" stop-color="#000" stop-opacity=".24"/>
      </radialGradient>
      <linearGradient id="hl-${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".5" stop-color="#fff" stop-opacity=".62"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="cap-${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#3C3C45"/>
        <stop offset=".16" stop-color="#1A1A20"/>
        <stop offset=".5" stop-color="#0B0B0E"/>
        <stop offset=".8" stop-color="#26262E"/>
        <stop offset="1" stop-color="#41414B"/>
      </linearGradient>
      <linearGradient id="pearl-${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FFD1E8"/>
        <stop offset=".28" stop-color="#CFE8FF"/>
        <stop offset=".52" stop-color="#D8FFE9"/>
        <stop offset=".76" stop-color="#FFF0C9"/>
        <stop offset="1" stop-color="#E4D2FF"/>
      </linearGradient>
      <linearGradient id="aur-a-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6FF0C4" stop-opacity=".78"/>
        <stop offset=".55" stop-color="#6FF0C4" stop-opacity=".16"/>
        <stop offset="1" stop-color="#6FF0C4" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="aur-b-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9C7BFF" stop-opacity=".72"/>
        <stop offset=".55" stop-color="#9C7BFF" stop-opacity=".14"/>
        <stop offset="1" stop-color="#9C7BFF" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="aur-c-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#67C8FF" stop-opacity=".68"/>
        <stop offset=".55" stop-color="#67C8FF" stop-opacity=".12"/>
        <stop offset="1" stop-color="#67C8FF" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="neb-a-${uid}" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#8E6BFF" stop-opacity=".9"/>
        <stop offset=".55" stop-color="#5B3DB8" stop-opacity=".45"/>
        <stop offset="1" stop-color="#5B3DB8" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="neb-b-${uid}" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#4FA6E8" stop-opacity=".8"/>
        <stop offset=".6" stop-color="#2B4E9E" stop-opacity=".35"/>
        <stop offset="1" stop-color="#2B4E9E" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="ember-${uid}" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#FF7A2E" stop-opacity=".55"/>
        <stop offset="1" stop-color="#FFD08A" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <ellipse class="bottle-shadow" cx="60" cy="242.5" rx="35" ry="5.5"/>
    <ellipse class="bottle-caustic" cx="60" cy="242" rx="26" ry="3.6" fill="${color}" opacity=".3"/>

    <g clip-path="url(#bc-${uid})">
      <g class="liquid" style="transform:translateY(${offset}px)">
        <rect x="0" y="${surface}" width="120" height="${252 - surface}" fill="url(#lg-${uid})"/>
        <rect x="0" y="${surface}" width="120" height="${252 - surface}" fill="url(#dp-${uid})"/>
        <g clip-path="url(#lc-${uid})">${finish}</g>
        <g clip-path="url(#lc-${uid})">${bubbles}</g>
        <ellipse cx="60" cy="${surface}" rx="${rx}" ry="3.8" fill="${lighten(color, .52)}" opacity=".9"/>
        <ellipse cx="60" cy="${surface - .8}" rx="${rx * .82}" ry="2.3" fill="#fff" opacity=".38"/>
        <path d="M${60 - rx} ${surface} q ${rx} 4 ${rx * 2} 0" fill="none" stroke="${lighten(color, .6)}" stroke-width=".9" opacity=".7"/>
      </g>

      <path d="${BODY}" fill="url(#gl-${uid})"/>
      <path d="${BODY}" fill="url(#in-${uid})"/>
      <g clip-path="url(#bc-${uid})">
        <rect x="29" y="64" width="5.4" height="140" rx="2.7" fill="url(#hl-${uid})" opacity=".62"/>
        <rect x="36.5" y="72" width="1.8" height="116" rx=".9" fill="#fff" opacity=".22"/>
        <path d="M91.5 70 C95.5 86 96.5 98 96.5 112 L96.5 202" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".26"/>
        <path d="M39 48 C45 33 53 26 60 25" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".34"/>
        <path d="M27 214 C37 225 83 225 93 214" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".2"/>
        <rect x="30" y="88" width="60" height="1.4" fill="#fff" opacity=".12"/>
      </g>
      <path d="${BODY}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.1"/>
    </g>

    <g class="cap">
      <rect x="38.5" y="1.5" width="43" height="21" rx="7" fill="url(#cap-${uid})"/>
      <g stroke="rgba(255,255,255,.10)" stroke-width=".9">${capRidges}</g>
      <rect x="38.5" y="1.5" width="43" height="21" rx="7" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".8"/>
      <rect x="43" y="4.4" width="34" height="3" rx="1.5" fill="rgba(255,255,255,.24)"/>
      <rect x="42" y="20" width="36" height="2.6" rx="1.3" fill="rgba(0,0,0,.32)"/>
    </g>
  </svg>`;
}

/* ───────────── charm stage ───────────── */

function charmSVG(def) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${def.art}</svg>`;
}

function bottleStage(opts) {
  const o = Object.assign({ finish:'none', charms:[], cls:'', editable:false }, opts);
  const charms = (o.charms || []).map((c, i) => {
    const def = charmById(c.id);
    if (!def) return '';
    return `<span class="charm" data-charm-index="${i}" style="left:${c.x}%;top:${c.y}%;--rot:${c.rot || 0}deg">${charmSVG(def)}</span>`;
  }).join('');
  return `<div class="bottle-stage ${o.cls} ${o.editable ? 'is-editable' : ''}" data-bottle-stage>${bottleSVG(o)}${charms}</div>`;
}

/* ───────────── state ───────────── */

const KEY = 'sodalab.v1';

const defaultMix = () => ({ base:'soda', flavors:[], sweet:3, fizz:3, temp:'ice', finish:'none', charms:[] });

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

function sanitizeCharms(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(c => isObj(c) && charmById(c.id))
    .slice(0, MAX_CHARMS)
    .map(c => ({ id: c.id, x: numIn(c.x, 0, 100, 50), y: numIn(c.y, 0, 100, 50), rot: numIn(c.rot, -45, 45, 0) }));
}

function sanitizeMix(m) {
  const d = defaultMix();
  if (!isObj(m)) return d;
  const flavors = Array.isArray(m.flavors)
    ? m.flavors.filter((id, i, a) => typeof id === 'string' && flavorById(id) && a.indexOf(id) === i).slice(0, 3)
    : [];
  return {
    base:    BASES.some(b => b.id === m.base) ? m.base : d.base,
    flavors,
    sweet:   intIn(m.sweet, 0, 5, d.sweet),
    fizz:    intIn(m.fizz, 0, 5, d.fizz),
    temp:    TEMPS.some(t => t.id === m.temp) ? m.temp : d.temp,
    finish:  FINISHES.some(f => f.id === m.finish) ? m.finish : d.finish,
    charms:  sanitizeCharms(m.charms),
  };
}

/* Returns a clean batch, or null if the entry is unusable. Missing rarity and
   rating are filled in (older saves), exactly as before. */
function sanitizeBatch(b) {
  if (!isObj(b)) return null;
  const mix = sanitizeMix(b);
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
  if (b.merged === true) {
    out.merged = true;
    out.lineage = Array.isArray(b.lineage) ? b.lineage.filter(x => typeof x === 'string' && ID_RE.test(x)).slice(0, 2) : [];
  }
  out.rarity = RARITY.some(r => r.id === b.rarity) ? b.rarity : rollRarity(out.id, luckOf(out)).id;
  out.rating = typeof b.rating === 'number' && Number.isFinite(b.rating) ? Math.round(clamp(b.rating, 0, 100)) : scoreOf(out);
  return out;
}

function luckOf(b) {
  let l = 0;
  l += Math.min((b.flavors || []).length, 3) * .07;
  if (b.finish && b.finish !== 'none') l += finishById(b.finish).luck;
  l += Math.min((b.charms || []).length, MAX_CHARMS) * .045;
  if (b.merged) l += .18;
  if ((b.flavors || []).length === 3) l += .03;
  return clamp(l, 0, .8);
}

function rollRarity(seed, luck) {
  const rnd = mulberry32(hashStr(String(seed)));
  const weights = RARITY.map((r, i) => r.weight * Math.pow(1 + luck, i * 1.15));
  const total = weights.reduce((a, b) => a + b, 0);
  let pick = rnd() * total;
  for (let i = 0; i < weights.length; i++) {
    pick -= weights[i];
    if (pick <= 0) return RARITY[i];
  }
  return RARITY[0];
}

function rarityOdds(id, luck) {
  const weights = RARITY.map((r, i) => r.weight * Math.pow(1 + luck, i * 1.15));
  const total = weights.reduce((a, b) => a + b, 0);
  const i = RARITY.findIndex(r => r.id === id);
  const p = i >= 0 ? weights[i] / total : 0;
  if (!p) return '';
  return `1 in ${Math.max(2, Math.round(1 / p))}`;
}

function scoreOf(b) {
  const mix = { base:b.base, flavors:b.flavors || [], sweet:b.sweet, fizz:b.fizz, temp:b.temp };
  const p = profileOf(mix);
  const vals = [p.sweet, p.tart, p.bitter, p.spice, p.herbal];
  const mean = vals.reduce((a, v) => a + v, 0) / vals.length;
  const spread = vals.reduce((a, v) => a + Math.abs(v - mean), 0) / vals.length;
  const harmony = clamp(1 - spread * 1.25, 0, 1);
  const complexity = clamp((b.flavors || []).length / 3, 0, 1);
  const rare = rarityById(b.rarity);
  const bonus = (rare.stars - 1) * 3.2 + (b.finish && b.finish !== 'none' ? 3 : 0) + Math.min((b.charms || []).length, MAX_CHARMS) * 1.5;
  return Math.round(clamp(48 + harmony * 20 + complexity * 12 + bonus, 40, 99));
}

const state = {
  view: 'home',
  mix: defaultMix(),
  saved: [],
  count: 0,
  lastBatch: null,
  pending: null,
  charmSel: 'star',
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!isObj(d)) return;
    if (Array.isArray(d.saved)) {
      const seen = new Set();
      state.saved = d.saved.map(sanitizeBatch).filter(b => b && !seen.has(b.id) && seen.add(b.id));
    }
    state.count = Math.max(intIn(d.count, 0, 1e9, 0), 0, ...state.saved.map(b => b.num));
    if (d.mix) state.mix = sanitizeMix(d.mix);
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

/* History: every screen change writes #/<view> and a state of
   { v: view, depth: entries pushed since boot, root: view at depth 0 }.
   Tab-to-tab moves (except leaving the Lab) replace instead of push, so the
   phone's back button walks back through screens, not every tab tap. */
const VIEW_RE = /^#\/(home|shelf|flavors|mix|result)\b/;
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
  const next = document.querySelector(`.view[data-view="${name}"]`);
  const cur  = document.querySelector('.view.is-active');
  if (!next || next === cur) return;
  writeHistory(name, opts.history || historyModeFor(state.view, name));

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

/* In-app back (and the Lab tab) returns to the lab. If the lab is the root of
   our history, unwind to it so the phone's back button doesn't land on the
   screens we just left; otherwise replace the current entry. */
function back(dir = 'pop') {
  if (state.view === 'home') return;
  if (navState.depth > 0 && navState.root === 'home') history.go(-navState.depth);
  else go('home', dir, { history: 'replace' });
}

function overlayOpen() {
  const deco = $('#decoLayer');
  if (sheetLayer.classList.contains('is-open')) return 'sheet';
  if (deco && deco.classList.contains('is-open')) return 'deco';
  if (brewLayer.classList.contains('is-open')) return 'brew';
  return null;
}

window.addEventListener('popstate', e => {
  // Back with a sheet or Decorate open closes it and keeps the screen: put the
  // entry we just left back on the stack. Back during a brew is ignored.
  const overlay = overlayOpen();
  if (overlay) {
    if (overlay === 'sheet') closeSheet();
    if (overlay === 'deco') closeDeco();
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
        : `Four bases, ${FLAVORS.length} flavors, one very good glass.`}</div>
      <button class="hero-btn">
        ${hasFlavors ? 'Continue' : 'Start a batch'}
        <svg viewBox="0 0 24 24" width="15" height="15"><path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <div class="hero-art">${bottleStage({ color, fill:.8, fizz:mix.fizz, seed:7, finish:mix.finish, charms:mix.charms })}</div>`;

  hero.onclick = () => go('mix', 'push');

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
          ${bottleStage({ color:b.color, fill:.8, fizz:b.fizz, seed:hashStr(b.id) % 999, finish:b.finish, charms:b.charms, still:true })}
        </div>
        <div class="mini-name">${esc(b.name)}</div>
        <div class="mini-meta">${dateLabel(b.date)} · ${rarityById(b.rarity).name}</div>
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
  const fs = mix.flavors.map(flavorById).filter(Boolean);
  return {
    color: blendColor(mix),
    name:  makeName(mix),
    sub:   fs.length
      ? `${baseById(mix.base).name} · ${fs.map(f => f.name).join(', ')}`
      : `${baseById(mix.base).name} · no flavors yet`,
    flavors: fs,
    fill:  fs.length ? .82 : .62,
  };
}

function renderMix() {
  const mix = state.mix;
  const derived = deriveMix(mix);
  const color = derived.color;
  const fs = derived.flavors;

  $('#mixWash').style.background = `
    radial-gradient(52% 48% at 50% 40%, ${rgba(color, .34)} 0%, ${rgba(color, .10)} 52%, transparent 74%),
    radial-gradient(40% 42% at 24% 62%, ${rgba(lighten(color,.3), .30)} 0%, transparent 70%)`;

  $('#mixBottle').innerHTML = bottleStage({
    color, fill: derived.fill, fizz: mix.fizz, seed: 21,
    finish: mix.finish, charms: mix.charms,
  });

  $('#mixName').textContent = derived.name;
  $('#mixSub').textContent = derived.sub;

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

  // style
  const fin = finishById(mix.finish);
  const sw = $('#styleSwatch');
  if (sw) {
    sw.style.background = fin.id === 'none'
      ? 'radial-gradient(circle at 32% 26%, #fff, #DCE6EA 70%)'
      : `linear-gradient(140deg, ${fin.swatch}, ${lighten(fin.swatch, .45)})`;
    $('#styleName').textContent = fin.id === 'none' ? 'Clear glass' : `${fin.name} finish`;
    $('#styleSub').textContent = mix.charms.length
      ? `${mix.charms.length} charm${mix.charms.length === 1 ? '' : 's'} · ${fin.sub.toLowerCase()}`
      : fin.id === 'none' ? 'Add a finish, glitter or charms' : fin.sub;
    $('#charmCount').textContent = mix.charms.length
      ? `${mix.charms.length} charm${mix.charms.length === 1 ? '' : 's'}`
      : 'Optional';
  }

  // hint
  $('#mixHint').textContent = fs.length === 0
    ? 'Pick a base and up to three flavors. The lab handles the rest.'
    : fs.length >= 3
      ? 'Three flavors is the sweet spot. A finish and charms tilt the rarity odds.'
      : `Tasting ${fs.map(f => f.name.toLowerCase()).join(', ')}. Add ${3 - fs.length} more, or dress it up for better odds.`;

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

/* Returns 'added' | 'removed' | 'full' (nothing changed; the toast says why). */
function toggleFlavor(id) {
  const mix = state.mix;
  const i = mix.flavors.indexOf(id);
  let result;
  if (i >= 0) { mix.flavors.splice(i, 1); result = 'removed'; }
  else if (mix.flavors.length < 3) { mix.flavors.push(id); result = 'added'; }
  else { toast('Three flavors max'); return 'full'; }
  persist();
  renderMix();
  return result;
}

/* ───────────── brewing ───────────── */

let brewTimers = [];

function makeBatch(mix) {
  state.count += 1;
  const color = blendColor(mix);
  const batch = {
    id: 'b' + Date.now().toString(36) + Math.floor(Math.random() * 999).toString(36),
    num: state.count,
    name: makeName(mix),
    base: mix.base,
    flavors: [...mix.flavors],
    sweet: mix.sweet,
    fizz: mix.fizz,
    temp: mix.temp,
    finish: mix.finish || 'none',
    charms: (mix.charms || []).map(c => ({ ...c })),
    color,
    date: Date.now(),
  };
  batch.rarity = rollRarity(batch.id, luckOf(batch)).id;
  batch.rating = scoreOf(batch);
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
    finish: batch.finish, charms: batch.charms,
  });
  brewStep.textContent = steps[0];
  brewStep.style.opacity = 1;
  brewBar.style.width = '0%';

  brewLayer.hidden = false;
  void brewLayer.offsetWidth;
  brewLayer.classList.add('is-open');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const liquid = brewBottle.querySelector('.liquid');
    if (liquid) liquid.style.transform = 'translateY(0)';
  }));

  const widths = ['22%', '52%', '80%', '100%'];
  brewTimers.forEach(clearTimeout);
  brewTimers = steps.map((s, i) => setTimeout(() => {
    if (i > 0) {
      brewStep.style.opacity = 0;
      setTimeout(() => { brewStep.textContent = s; brewStep.style.opacity = 1; }, 160);
    }
    brewBar.style.width = widths[Math.min(i, widths.length - 1)];
  }, i * 640));

  brewTimers.push(setTimeout(finishBrew, 2960));
}

function startBrew() {
  if (brewLayer.classList.contains('is-open')) return;
  runBrew(makeBatch(state.mix), ['Chilling the glass', 'Carbonating', 'Balancing the syrup', 'Sealing the batch']);
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

  const rarity = rarityById(batch.rarity);
  const fin = finishById(batch.finish);
  const charmTags = (batch.charms || []).map(c => charmById(c.id)).filter(Boolean)
    .map(c => `<span class="tag tag--charm">${charmSVG(c)}${c.name}</span>`).join('');
  const dressed = fin.id !== 'none' || (batch.charms || []).length > 0 || batch.merged;

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
      <div class="result-bottle">${bottleStage({ color, fill:.84, fizz:batch.fizz, seed:11, finish:batch.finish, charms:batch.charms })}</div>
      <div class="result-eyebrow">${fresh ? 'Freshly brewed' : 'From your shelf'}</div>
      <h1 class="result-name">${esc(batch.name)}</h1>
      <div class="result-sub">${baseById(batch.base).name} · ${batch.flavors.length ? batch.flavors.map(fname).join(', ') : 'No flavors'}</div>
      <div class="rarity-badge" style="--rc:${rarity.color}" title="Rolled at brew time">
        <span class="rarity-stars">${'★'.repeat(rarity.stars)}<span class="rarity-dim">${'★'.repeat(6 - rarity.stars)}</span></span>
        <span class="rarity-name">${rarity.name}</span>
        <span class="rarity-score">${batch.rating}<small>/100</small></span>
      </div>
      <div class="rarity-note">Rolled at brew time · ${rarityOdds(batch.rarity, luckOf(batch))}</div>
    </div>

    <div class="stat-row">${stats}</div>

    ${dressed ? `<div class="panel">
      <div class="panel-title">Dressing</div>
      <div class="tag-row">
        ${fin.id !== 'none' ? `<span class="tag"><i class="tag-dot" style="background:${fin.swatch}"></i>${fin.name}</span>` : ''}
        ${charmTags}
        ${batch.merged ? '<span class="tag tag--merge">Merged batch</span>' : ''}
      </div>
    </div>` : ''}

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
    const fin = finishById(batch.finish);
    const rarity = rarityById(batch.rarity);
    const txt = `${batch.name} — Soda Lab\n${baseById(batch.base).name}, ${batch.flavors.map(fname).join(', ')}\n${rarity.name} · ${batch.rating}/100 · Sweetness ${batch.sweet}/5 · Fizz ${batch.fizz}/5 · ${(TEMPS.find(t => t.id === batch.temp) || TEMPS[0]).label}${fin.id !== 'none' ? ` · ${fin.name} finish` : ''}`;
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
  if (mergeBtn) mergeBtn.hidden = state.saved.length < 2;
  const eyebrow = document.querySelector('[data-view="shelf"] .eyebrow');
  if (eyebrow) eyebrow.textContent = state.saved.length
    ? `Your collection · ${state.saved.length} bottle${state.saved.length === 1 ? '' : 's'}`
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
    const r = rarityById(b.rarity);
    return `
    <button class="batch-card" data-batch="${esc(b.id)}">
      <div class="batch-art" style="background:linear-gradient(155deg, ${lighten(b.color,.84)} 0%, ${lighten(b.color,.93)} 100%)">
        ${bottleStage({ color:b.color, fill:.8, fizz:b.fizz, seed:hashStr(b.id) % 997, finish:b.finish, charms:b.charms, still:true })}
        <span class="rarity-chip" style="--rc:${r.color}">${r.name}</span>
      </div>
      <div class="batch-name">${esc(b.name)}</div>
      <div class="batch-meta">${dateLabel(b.date)} · ${b.rating}/100</div>
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
  const r = rarityById(b.rarity);
  const fin = finishById(b.finish);
  const rows = [
    ['Rarity', `${r.name} · ${b.rating}/100`],
    ['Base', baseById(b.base).name],
    ['Flavors', b.flavors.length ? b.flavors.map(fname).join(', ') : 'None'],
    ['Sweetness', SWEET_WORDS[b.sweet]],
    ['Carbonation', FIZZ_WORDS[b.fizz]],
    ['Serve', (TEMPS.find(t => t.id === b.temp) || TEMPS[0]).label],
    ['Finish', fin.name],
    ['Charms', b.charms.length ? b.charms.map(c => (charmById(c.id) || {}).name).filter(Boolean).join(', ') : 'None'],
    ['Brewed', dateLabel(b.date)],
  ].map(([k, v]) => `<div class="sheet-li"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');

  openSheet(`
    <div class="sheet-hero" style="background:linear-gradient(155deg, ${lighten(b.color,.8)}, ${lighten(b.color,.92)})">
      <div style="width:48px">${bottleStage({ color:b.color, fill:.8, fizz:b.fizz, seed:hashStr(b.id) % 997, finish:b.finish, charms:b.charms })}</div>
      <span class="sheet-rarity" style="--rc:${r.color}">${'★'.repeat(r.stars)} ${r.name}</span>
    </div>
    <h2 class="sheet-title">${esc(b.name)}</h2>
    <div class="sheet-note">Batch ${String(b.num).padStart(3,'0')} · ${b.rating}/100</div>
    <div class="sheet-list">${rows}</div>
    <div class="sheet-actions">
      <button class="btn-primary" data-remix="${esc(b.id)}">Mix this again</button>
      <button class="btn-ghost" data-merge-this="${esc(b.id)}">Merge with another</button>
      <button class="danger-btn" data-remove-batch="${esc(b.id)}">Remove from shelf</button>
    </div>`);
}

/* ───────────── merge ───────────── */

let mergePick = [];
const MERGE_STRIP = /\s+(Fizz|Spritz|Spark|Haze|Bloom|Noir|Crush|Drift|Glow|Mist|Splash|Tonic)$/i;

function mergeShort(n) {
  return n.replace(MERGE_STRIP, '').split(' ').slice(0, 2).join(' ');
}
function mergeName(a, b) {
  const x = mergeShort(a.name), y = mergeShort(b.name);
  return x === y ? `${x} Double` : `${x} × ${y}`;
}
function mergeFinish(a, b) {
  const fa = finishById(a.finish), fb = finishById(b.finish);
  if (fa.id === fb.id) return fa.id;
  if (fa.id === 'none') return fb.id;
  if (fb.id === 'none') return fa.id;
  return hashStr(a.id + b.id) % 2 ? fa.id : fb.id;
}
function mergeCharms(a, b) {
  const out = [], seen = new Set();
  [...(a.charms || []), ...(b.charms || [])].forEach(c => {
    if (out.length >= MAX_CHARMS || seen.has(c.id) || !charmById(c.id)) return;
    seen.add(c.id);
    out.push({ ...c });
  });
  return out;
}
function mergeMixOf(a, b) {
  const flavors = [];
  [...a.flavors, ...b.flavors].forEach(id => {
    if (flavorById(id) && !flavors.includes(id) && flavors.length < 3) flavors.push(id);
  });
  const base = a.base === b.base ? a.base : (hashStr(a.id + b.id) % 2 ? a.base : b.base);
  return {
    base,
    flavors,
    sweet: Math.round((a.sweet + b.sweet) / 2),
    fizz: Math.round((a.fizz + b.fizz) / 2),
    temp: a.temp,
    finish: mergeFinish(a, b),
    charms: mergeCharms(a, b),
  };
}
function makeMergedBatch(a, b) {
  const mix = mergeMixOf(a, b);
  state.count += 1;
  const batch = {
    id: 'm' + Date.now().toString(36) + Math.floor(Math.random() * 999).toString(36),
    num: state.count,
    name: mergeName(a, b),
    base: mix.base,
    flavors: [...mix.flavors],
    sweet: mix.sweet,
    fizz: mix.fizz,
    temp: mix.temp,
    finish: mix.finish,
    charms: mix.charms.map(c => ({ ...c })),
    color: blendColor(mix),
    date: Date.now(),
    merged: true,
    lineage: [a.id, b.id],
  };
  batch.rarity = rollRarity(batch.id, luckOf(batch)).id;
  batch.rating = scoreOf(batch);
  return batch;
}
function mergeCandidates() {
  return mergePick.map(id => state.saved.find(b => b.id === id)).filter(Boolean);
}

function mergeRow(b, on) {
  const r = rarityById(b.rarity);
  return `<button class="merge-row ${on ? 'is-on' : ''}" data-merge-pick="${esc(b.id)}">
    <span class="merge-art" style="background:linear-gradient(155deg, ${lighten(b.color,.86)}, ${lighten(b.color,.94)})">
      ${bottleStage({ color:b.color, fill:.8, fizz:b.fizz, seed:hashStr(b.id) % 997, finish:b.finish, still:true })}
    </span>
    <span class="merge-copy">
      <span class="mr-name">${esc(b.name)}</span>
      <span class="mr-meta"><i class="rc-dot" style="background:${r.color}"></i>${r.name} · ${b.rating}/100</span>
    </span>
    <span class="merge-check">${on ? '✓' : ''}</span>
  </button>`;
}

function mergePreviewMarkup(a, b) {
  const mix = mergeMixOf(a, b);
  const color = blendColor(mix);
  const fin = finishById(mix.finish);
  return `<div class="merge-preview">
    <div class="merge-preview-art" style="background:linear-gradient(155deg, ${lighten(color,.86)}, ${lighten(color,.94)})">
      ${bottleStage({ color, fill:.82, fizz:mix.fizz, seed:77, finish:mix.finish, charms:mix.charms })}
    </div>
    <div class="merge-preview-copy">
      <div class="mp-kicker">The blend</div>
      <div class="mp-name">${esc(mergeName(a, b))}</div>
      <div class="mp-sub">${mix.flavors.length ? mix.flavors.map(fname).join(' · ') : 'No flavors'} · ${fin.name}</div>
      <div class="mp-bonus">Merged batches roll with better rarity odds.</div>
    </div>
  </div>`;
}

function openMergeSheet(firstId) {
  mergePick = firstId ? [firstId] : [];
  openSheet(`
    <h2 class="sheet-title" style="font-size:23px">Merge two sodas</h2>
    <div class="sheet-note">Fuse two batches into one. The originals stay on your shelf.</div>
    <div class="merge-list" id="mergeList">
      ${state.saved.map(b => mergeRow(b, mergePick.includes(b.id))).join('')}
    </div>
    <div id="mergePreview">${mergePick.length === 2 ? mergePreviewMarkup(...mergeCandidates()) : ''}</div>
    <div class="sheet-actions">
      <button class="btn-primary" id="doMergeBtn" ${mergePick.length === 2 ? '' : 'disabled style="opacity:.4;box-shadow:none"'}>
        ${mergePick.length === 2 ? 'Merge into one' : `Pick ${2 - mergePick.length} more`}
      </button>
      <button class="btn-ghost" data-close-sheet>Cancel</button>
    </div>`);
}

function refreshMergeSheet() {
  $$('#mergeList .merge-row').forEach(row => {
    const on = mergePick.includes(row.dataset.mergePick);
    row.classList.toggle('is-on', on);
    const check = row.querySelector('.merge-check');
    if (check) check.textContent = on ? '✓' : '';
  });
  const picks = mergeCandidates();
  const ready = picks.length === 2;
  const host = $('#mergePreview');
  if (host) host.innerHTML = ready ? mergePreviewMarkup(picks[0], picks[1]) : '';
  const btn = $('#doMergeBtn');
  if (btn) {
    btn.disabled = !ready;
    btn.textContent = ready ? 'Merge into one' : `Pick ${2 - picks.length} more`;
    btn.style.opacity = ready ? '' : '.4';
    btn.style.boxShadow = ready ? '' : 'none';
  }
}

function doMerge() {
  const picks = mergeCandidates();
  if (picks.length !== 2) return;
  const batch = makeMergedBatch(picks[0], picks[1]);
  closeSheet();
  setTimeout(() => runBrew(batch, ['Melting the two', 'Fusing the colors', 'Re-carbonating', 'Sealing the blend']), 300);
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

/* ───────────── decorate ───────────── */

function swatchFor(fin) {
  return fin.id === 'none'
    ? 'radial-gradient(circle at 32% 26%, #fff, #DCE6EA 70%)'
    : `linear-gradient(140deg, ${fin.swatch}, ${lighten(fin.swatch, .45)})`;
}

function openDeco() {
  const layer = $('#decoLayer');
  if (!layer) return;
  layer.hidden = false;
  void layer.offsetWidth;
  layer.classList.add('is-open');
  renderDeco();
}

function closeDeco() {
  const layer = $('#decoLayer');
  if (!layer) return;
  layer.classList.remove('is-open');
  setTimeout(() => { layer.hidden = true; }, 380);
  persist();
  renderMix();
  renderHome();
}

function renderDeco() {
  const mix = state.mix;
  const color = blendColor(mix);
  const wash = $('#decoWash');
  if (wash) {
    wash.style.background = `
      radial-gradient(52% 46% at 50% 40%, ${rgba(color, .34)} 0%, ${rgba(color, .10)} 54%, transparent 76%),
      radial-gradient(40% 42% at 24% 64%, ${rgba(lighten(color,.3), .30)} 0%, transparent 70%)`;
  }
  const host = $('#decoBottle');
  if (host) {
    host.innerHTML = bottleStage({
      color, fill: mix.flavors.length ? .84 : .66, fizz: mix.fizz, seed: 33,
      finish: mix.finish, charms: mix.charms, editable: true,
    });
  }
  const tray = $('#charmTray');
  if (tray) {
    tray.innerHTML = CHARMS.map(c => `
      <button class="charm-opt ${state.charmSel === c.id ? 'is-on' : ''}" data-charm-sel="${c.id}" aria-label="${c.name}">
        ${charmSVG(c)}<span>${c.name}</span>
      </button>`).join('');
  }
  const finRow = $('#decoFinishes');
  if (finRow) {
    finRow.innerHTML = FINISHES.map(f => `
      <button class="finish-opt ${mix.finish === f.id ? 'is-on' : ''}" data-finish="${f.id}" aria-label="${f.name}">
        <span class="finish-sw" style="background:${swatchFor(f)}"></span>
        <span class="finish-nm">${f.name}</span>
      </button>`).join('');
  }
  const hint = $('#decoHint');
  if (hint) hint.textContent = mix.charms.length
    ? 'Tap the bottle to add · drag to move · tap a charm to remove'
    : 'Pick a charm, then tap anywhere on the bottle';
  const count = $('#decoCount');
  if (count) count.textContent = `${mix.charms.length} charm${mix.charms.length === 1 ? '' : 's'}`;
}

function placeCharm(rect, cx, cy) {
  const mix = state.mix;
  if (mix.charms.length >= MAX_CHARMS) { toast(`${MAX_CHARMS} charms max`); return; }
  const def = charmById(state.charmSel) || CHARMS[0];
  const x = clamp((cx - rect.left) / rect.width * 100, 6, 94);
  const y = clamp((cy - rect.top) / rect.height * 100, 6, 94);
  mix.charms.push({ id: def.id, x: Math.round(x), y: Math.round(y), rot: Math.round(Math.random() * 24 - 12) });
  persist();
  renderDeco();
}

function initDeco() {
  const stage = $('#decoStage');
  if (!stage) return;
  let drag = null;
  const bottleRect = () => (stage.querySelector('.bottle-stage') || stage).getBoundingClientRect();

  stage.addEventListener('pointerdown', e => {
    const charmEl = e.target.closest('.charm');
    if (charmEl) {
      drag = { idx: Number(charmEl.dataset.charmIndex), moved: false, x0: e.clientX, y0: e.clientY, el: charmEl, x: 0, y: 0 };
      charmEl.classList.add('is-dragging');
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
      return;
    }
    if (!e.target.closest('[data-bottle-stage]')) return;
    placeCharm(bottleRect(), e.clientX, e.clientY);
  });

  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) > 5) drag.moved = true;
    const rect = bottleRect();
    const x = clamp((e.clientX - rect.left) / rect.width * 100, 4, 96);
    const y = clamp((e.clientY - rect.top) / rect.height * 100, 4, 96);
    drag.el.style.left = x + '%';
    drag.el.style.top = y + '%';
    drag.x = x;
    drag.y = y;
  });

  const end = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.el.classList.remove('is-dragging');
    const mix = state.mix;
    if (!d.moved) {
      mix.charms.splice(d.idx, 1);
      toast('Charm removed');
      persist();
      renderDeco();
      return;
    }
    if (mix.charms[d.idx]) {
      mix.charms[d.idx].x = Math.round(d.x);
      mix.charms[d.idx].y = Math.round(d.y);
    }
    persist();
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
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
    if (result === 'full') return;           // 'Three flavors max' already shown; sheet stays open
    if (result === 'removed') { toast('Removed from mix'); addFlavor.textContent = 'Add to mix'; }
    else { toast(`${flavorById(id).name} added to the mix`); closeSheet(); setTimeout(() => go('mix', 'push'), 240); }
    return;
  }

  const flavorRow = t.closest('[data-flavor]');
  if (flavorRow) { openFlavorSheet(flavorRow.dataset.flavor); return; }

  const batchEl = t.closest('[data-batch]');
  if (batchEl) { openBatchSheet(batchEl.dataset.batch); return; }

  const decoBtn = t.closest('[data-open-deco]');
  if (decoBtn) { openDeco(); return; }

  const closeDecoBtn = t.closest('[data-close-deco]');
  if (closeDecoBtn) { closeDeco(); return; }

  const charmSel = t.closest('[data-charm-sel]');
  if (charmSel) { state.charmSel = charmSel.dataset.charmSel; renderDeco(); return; }

  const finishBtn = t.closest('[data-finish]');
  if (finishBtn) { state.mix.finish = finishBtn.dataset.finish; persist(); renderDeco(); return; }

  const clearCharms = t.closest('[data-clear-charms]');
  if (clearCharms) {
    state.mix.charms = [];
    persist();
    renderDeco();
    toast('Charms cleared');
    return;
  }

  const mergeStart = t.closest('[data-merge-start]');
  if (mergeStart) { openMergeSheet(); return; }

  const mergeThis = t.closest('[data-merge-this]');
  if (mergeThis) {
    const id = mergeThis.dataset.mergeThis;
    closeSheet();
    setTimeout(() => openMergeSheet(id), 320);
    return;
  }

  const mergePickEl = t.closest('[data-merge-pick]');
  if (mergePickEl) {
    const id = mergePickEl.dataset.mergePick;
    const i = mergePick.indexOf(id);
    if (i >= 0) mergePick.splice(i, 1);
    else {
      if (mergePick.length >= 2) mergePick.shift();
      mergePick.push(id);
    }
    refreshMergeSheet();
    return;
  }

  const doMergeBtn = t.closest('#doMergeBtn');
  if (doMergeBtn) { doMerge(); return; }

  const remix = t.closest('[data-remix]');
  if (remix) {
    const b = state.saved.find(x => x.id === remix.dataset.remix);
    if (b) {
      state.mix = sanitizeMix({
        base: b.base,
        flavors: [...b.flavors],
        sweet: b.sweet,
        fizz: b.fizz,
        temp: b.temp,
        finish: b.finish,
        charms: (b.charms || []).map(c => ({ ...c })),
      });
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
  // input: recompute and redraw everything derived (name, color, glow, both dials, button)
  el.addEventListener('input', () => {
    state.mix[kind] = Number(el.value);
    renderMix();
  });
  // change: fires once when the drag ends (or per key press) — save then
  el.addEventListener('change', persist);
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
  if (e.key !== 'Escape') return;
  if (sheetLayer.classList.contains('is-open')) closeSheet();
  const deco = $('#decoLayer');
  if (deco && deco.classList.contains('is-open')) closeDeco();
});

/* ───────────── boot ───────────── */

function demoSeed() {
  if (state.saved.length) return;
  const examples = [
    { base:'soda',    flavors:['cherry','cola'],     sweet:4, fizz:4, temp:'ice',     finish:'glitter', charms:[{ id:'star', x:30, y:40, rot:-9 }, { id:'cherry', x:72, y:64, rot:8 }] },
    { base:'tonic',   flavors:['lime','mint'],       sweet:2, fizz:5, temp:'ice',     finish:'cosmic',  charms:[{ id:'moon', x:70, y:30, rot:12 }] },
    { base:'cream',   flavors:['peach'],             sweet:3, fizz:3, temp:'chilled', finish:'pearl',   charms:[{ id:'flower', x:32, y:72, rot:-6 }] },
    { base:'mineral', flavors:['cucumber','rose'],   sweet:1, fizz:4, temp:'ice',     finish:'aurora',  charms:[{ id:'shell', x:66, y:76, rot:10 }] },
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
  const m = location.hash.match(/^#\/(home|shelf|flavors|mix|result)\b/);
  if (!m) return false;
  const v = m[1];

  if (v === 'result') {
    let batch = state.lastBatch || state.saved[0];
    if (!batch) {
      const mix = { base:'soda', flavors:['cherry','cola'], sweet:4, fizz:4, temp:'ice', finish:'glitter', charms:[{ id:'star', x:26, y:36, rot:-8 }] };
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
if (new URLSearchParams(location.search).get('demo')) demoSeed();
clock();
setInterval(clock, 15000);

renderHome();
renderShelf();
renderFlavorList();
renderMix();
updateTabs('home');
initDeco();
bootRoute();
navState = { v: state.view, depth: 0, root: state.view };
history.replaceState(navState, '', location.pathname + location.search + '#/' + state.view);

})();
