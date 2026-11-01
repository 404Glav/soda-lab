/* ═══════════════════════════════════════════════════════════
   Sound Lab — drop in any sound. Sculpt it into candy.
   UI layer over engine/index.js
   ═══════════════════════════════════════════════════════════ */

import { SoundEngine as E } from './engine/index.js';
import { evalCurve } from './engine/pedals.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const SVG_NS = 'http://www.w3.org/2000/svg';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PEDAL_TYPES = ['prism', 'reel', 'cathedral', 'fizz', 'crusher', 'sweep'];
const PEDAL_BLURB = {
  prism: 'Grain delay',
  reel: 'Tape echo',
  cathedral: 'Hall reverb',
  fizz: 'Saturator',
  crusher: 'Bit crush',
  sweep: 'Auto filter',
};
const PEDAL_STYLE = {
  prism:     { a: '#4A49B0', b: '#23224F', rim: '#7776E8', glow: '#9EE9FF', ink: '#EFEEFF', plate: .16 },
  reel:      { a: '#FFA05C', b: '#E9661D', rim: '#FFC08C', glow: '#5B2A08', ink: '#4A2109', plate: .48 },
  cathedral: { a: '#E2F6FF', b: '#A9D2E8', rim: '#F2FBFF', glow: '#4B93B4', ink: '#2E6B88', plate: .55 },
  fizz:      { a: '#FA8A92', b: '#DE4A55', rim: '#FFB4B9', glow: '#7A1B22', ink: '#5E1219', plate: .5 },
  crusher:   { a: '#A6EF8D', b: '#68C84B', rim: '#C6F7B3', glow: '#1F6B22', ink: '#1D5C20', plate: .5 },
  sweep:     { a: '#D2B6FF', b: '#A374EE', rim: '#E6D6FF', glow: '#4B2A87', ink: '#3E2274', plate: .5 },
};

const S = {
  started: false,
  view: 'shelf',
  returnView: 'shelf',
  shelfFilter: 'all',
  shelf: [],
  seg: 'chain',
  source: null,
  chain: [],
  pads: [],
  sheet: { kind: '' },
  recording: false,
  recStart: 0,
  baking: false,
  projectId: null,
  projectName: '',
  playing: false,
  lastPos: -1,
  lastTimeText: '',
  chopping: false,
  curve: null,
  curveCanvas: null,
  curveDragging: false,
  bake: null,
  taps: [],
  shelfToken: 0,
};
const bakeNames = new Map();
const bakePeaks = new Map();
const BAKE_META = 'soundlab-bakes';
const fakeCache = new Map();
const WAVES = [];

/* ─────────── small helpers ─────────── */

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

function fmtPrecise(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, '0');
  return m + ':' + s;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function safeName(name) {
  return String(name || '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'soundlab';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

let toastTimer = 0;
function toast(message, ms = 2200) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-show'), ms);
}

function pedalName(type) {
  const def = E.PEDAL_DEFS[type];
  return def ? def.name : 'Pedal';
}

function pedalSummary(pedal) {
  if (pedal.bypass) return 'Bypassed';
  const def = E.PEDAL_DEFS[pedal.type];
  if (!def) return '';
  const parts = [];
  for (let i = 0; i < def.knobs.length && parts.length < 2; i++) {
    const knob = def.knobs[i];
    if (knob.steps === 2) continue;
    parts.push(knob.label + ' ' + E.formatKnob(pedal.type, knob.key, pedal.knobs[knob.key]));
  }
  return parts.join(' · ');
}

/* ─────────── bake names + card peaks (localStorage) ─────────── */

/* 256 min/max pairs is plenty for a shelf card and keeps each bake ~3 KB. */
function shrinkPeaks(peaks) {
  const src = peaks.length / 2;
  const n = Math.min(256, src);
  const out = new Float32Array(n * 2);
  for (let b = 0; b < n; b++) {
    let lo = 0;
    let hi = 0;
    for (let i = Math.floor(b * src / n); i < Math.floor((b + 1) * src / n); i++) {
      lo = Math.min(lo, peaks[i * 2]);
      hi = Math.max(hi, peaks[i * 2 + 1]);
    }
    out[b * 2] = lo;
    out[b * 2 + 1] = hi;
  }
  return out;
}

function storeBakeMeta() {
  const out = {};
  bakeNames.forEach((name, id) => { out[id] = { name }; });
  bakePeaks.forEach((peaks, id) => {
    (out[id] = out[id] || {}).peaks = Array.from(peaks, (v) => Math.round(v * 1000) / 1000);
  });
  try { localStorage.setItem(BAKE_META, JSON.stringify(out)); } catch (err) { /* names fall back to durations */ }
}

function restoreBakeMeta() {
  try {
    const saved = JSON.parse(localStorage.getItem(BAKE_META) || '{}');
    Object.keys(saved).forEach((id) => {
      if (saved[id].name) bakeNames.set(id, saved[id].name);
      if (saved[id].peaks) bakePeaks.set(id, Float32Array.from(saved[id].peaks));
    });
  } catch (err) { /* ignore a bad entry */ }
}

function nameBake(id, name) {
  bakeNames.set(id, (name || '').trim() || 'Bake');
  storeBakeMeta();
}

/* ─────────── pedal artwork ─────────── */

let artSeq = 0;

function pedalKnobSVG(cx, cy, r, gradId) {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gradId})" stroke="#000" stroke-opacity=".18" stroke-width=".7"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 2.1}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".6"/>
    <line x1="${cx}" y1="${cy - r + 2.6}" x2="${cx}" y2="${cy - r + 5.4}" stroke="#fff" stroke-opacity=".9" stroke-width="1.5" stroke-linecap="round"/>`;
}

function pedalArt(type) {
  const s = PEDAL_STYLE[type] || PEDAL_STYLE.prism;
  if (type === 'prism') {
    return `
      <path d="M15 84 L27 66 L37 76 L48 55 L59 70 L70 50 L81 64 L86 58" fill="none" stroke="${s.glow}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>
      <path d="M15 88 L27 74 L37 80 L48 65 L59 76 L70 60 L81 70 L86 66" fill="none" stroke="#fff" stroke-width=".9" opacity=".2"/>
      <path d="M64 46 l1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2Z" fill="#fff" opacity=".85"/>
      <circle cx="30" cy="55" r="1" fill="#fff" opacity=".6"/>
      <circle cx="76" cy="47" r="1.2" fill="#fff" opacity=".45"/>`;
  }
  if (type === 'reel') {
    const reel = (cx) => `
      <circle cx="${cx}" cy="69" r="8.4" fill="#FFE0C4" opacity=".92"/>
      <circle cx="${cx}" cy="69" r="2.7" fill="#5B2A08"/>
      <g stroke="#5B2A08" stroke-width="1.2" stroke-linecap="round" opacity=".7">
        <path d="M${cx} 62.6v-2.2M${cx} 75.4v2.2M${cx - 6.4} 69h-2.2M${cx + 6.4} 69h2.2"/>
      </g>`;
    return `
      <rect x="19" y="51" width="62" height="36" rx="7" fill="#3A1B08" opacity=".24"/>
      <rect x="22" y="54" width="56" height="30" rx="5" fill="none" stroke="#fff" stroke-opacity=".3"/>
      ${reel(36)}${reel(64)}
      <rect x="45" y="64" width="10" height="10" rx="2" fill="#FFE0C4" opacity=".5"/>`;
  }
  if (type === 'cathedral') {
    return `
      <path d="M33 89 V64 Q50 41 67 64 V89 Z" fill="#fff" fill-opacity=".32" stroke="#fff" stroke-opacity=".6" stroke-width=".9"/>
      <path d="M50 89 V57" stroke="#fff" stroke-opacity=".55" stroke-width=".9"/>
      <path d="M33 75 H67" stroke="#fff" stroke-opacity=".55" stroke-width=".9"/>
      <circle cx="50" cy="67" r="4.4" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width=".9"/>
      <path d="M21 89 H79" stroke="#fff" stroke-opacity=".3" stroke-width="1"/>
      <circle cx="50" cy="67" r="1.6" fill="#fff" opacity=".7"/>`;
  }
  if (type === 'fizz') {
    return `
      <g fill="#fff">
        <circle cx="30" cy="58" r="2.2" opacity=".5"/>
        <circle cx="39" cy="50" r="1.5" opacity=".4"/>
        <circle cx="71" cy="56" r="2.5" opacity=".45"/>
        <circle cx="79" cy="66" r="1.6" opacity=".35"/>
        <circle cx="26" cy="70" r="1.3" opacity=".35"/>
      </g>
      <path d="M37 72 q13 13 26 0" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" opacity=".85"/>
      <path d="M43 72 l2 5 2 -5 M53 72 l2 5 2 -5" fill="#fff" opacity=".85"/>
      <circle cx="42" cy="61" r="2.6" fill="#fff" opacity=".9"/><circle cx="42" cy="61" r="1.1" fill="#5E1219"/>
      <circle cx="58" cy="61" r="2.6" fill="#fff" opacity=".9"/><circle cx="58" cy="61" r="1.1" fill="#5E1219"/>`;
  }
  if (type === 'crusher') {
    let pixels = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        const on = ((r * 6 + c) * 7 + 3) % 11;
        if (on < 4) continue;
        pixels += `<rect x="${28 + c * 8}" y="${51 + r * 8}" width="5.4" height="5.4" rx="1.1" fill="#fff" opacity="${(0.28 + (on / 11) * 0.6).toFixed(2)}"/>`;
      }
    }
    return `${pixels}
      <path d="M36 81 l4 -4 l4 4 l4 -4 l4 4 l4 -4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>`;
  }
  return `
    <path d="M15 87 H85" stroke="#fff" stroke-opacity=".18"/>
    <path d="M15 87 C30 87 34 56 48 56 C62 56 66 75 85 75" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" opacity=".92"/>
    <circle cx="48" cy="56" r="2.5" fill="#fff"/>
    <path d="M20 61 l3 3 3 -3" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".4"/>`;
}

function pedalSVG(type, opts = {}) {
  const s = PEDAL_STYLE[type] || PEDAL_STYLE.prism;
  const n = ++artSeq;
  const gid = 'pg' + n;
  const kid = 'pk' + n;
  const name = opts.name || pedalName(type);
  const on = !opts.bypass;
  const plateOpacity = s.plate;
  return `<svg class="pedal-svg${opts.bypass ? ' is-bypass' : ''}" viewBox="0 0 100 140" role="img" aria-label="${esc(name)} pedal">
  <defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2=".35" y2="1">
      <stop offset="0" stop-color="${s.a}"/><stop offset="1" stop-color="${s.b}"/>
    </linearGradient>
    <radialGradient id="${kid}" cx=".35" cy=".28" r=".9">
      <stop offset="0" stop-color="#fff" stop-opacity=".98"/>
      <stop offset=".55" stop-color="#EAE8E3"/><stop offset="1" stop-color="#B9B6AF"/>
    </radialGradient>
  </defs>
  <rect x="4" y="3" width="92" height="134" rx="19" fill="url(#${gid})" stroke="${s.rim}" stroke-opacity=".45" stroke-width="1"/>
  <rect x="7.5" y="6.5" width="85" height="127" rx="16" fill="none" stroke="#fff" stroke-opacity=".1"/>
  <path d="M10 17 Q50 4 90 17 L90 30 Q50 20 10 30 Z" fill="#fff" opacity=".07"/>
  <circle cx="50" cy="12" r="4.2" fill="${on ? s.glow : '#8B8B90'}" opacity=".14"/>
  <circle cx="50" cy="12" r="2.1" fill="${on ? s.glow : '#8B8B90'}" opacity="${on ? .95 : .6}"/>
  ${pedalKnobSVG(32, 34, 9.4, kid)}
  ${pedalKnobSVG(68, 34, 9.4, kid)}
  ${pedalArt(type)}
  <rect x="17" y="96" width="66" height="15" rx="5" fill="#fff" fill-opacity="${plateOpacity}" stroke="#fff" stroke-opacity=".18"/>
  <text x="50" y="106.6" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="7.2" font-weight="700" letter-spacing=".03em" fill="${s.ink}" fill-opacity=".92">${esc(name.toUpperCase())}</text>
  <circle cx="50" cy="124" r="9.4" fill="url(#${kid})" stroke="#000" stroke-opacity=".18" stroke-width=".7"/>
  <circle cx="50" cy="124" r="5.6" fill="none" stroke="#fff" stroke-opacity=".3"/>
  <circle cx="50" cy="124" r="9.4" fill="none" stroke="#fff" stroke-opacity=".18"/>
</svg>`;
}

/* ─────────── waveform painting ─────────── */

function seededPeaks(seed) {
  const cached = fakeCache.get(seed);
  if (cached) return cached;
  let h = 2166136261;
  const text = String(seed || 'sound');
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = h || 1;
  const rnd = () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
  const buckets = 512;
  const out = new Float32Array(buckets * 2);
  let env = .45;
  for (let i = 0; i < buckets; i++) {
    const t = i / buckets;
    const shape = Math.sin(Math.PI * Math.min(1, t * 1.12)) * (.62 + .38 * Math.sin(t * 17 + rnd() * 2.2));
    env = env * .74 + shape * .26;
    const amp = Math.max(.035, Math.abs(env) * (.55 + rnd() * .5));
    out[i * 2] = -amp;
    out[i * 2 + 1] = amp * (.55 + rnd() * .45);
  }
  fakeCache.set(seed, out);
  return out;
}

function paintWave(canvas, peaks, opts = {}) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const c = canvas.getContext('2d');
  if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rect.width;
  const H = rect.height;
  c.clearRect(0, 0, W, H);
  if (!peaks || !peaks.length) return;
  const mid = H / 2;
  const amp = H * (opts.amp || .42);
  const duration = opts.duration || 0;
  const chops = opts.chops;
  if (chops && duration) {
    for (let i = 0; i < chops.length; i++) {
      const pad = chops[i];
      if (!pad || !(pad.end > pad.start)) continue;
      const x0 = (pad.start / duration) * W;
      const x1 = (pad.end / duration) * W;
      c.fillStyle = i % 2 ? 'rgba(239,115,41,.10)' : 'rgba(239,115,41,.17)';
      c.fillRect(x0, 0, Math.max(1, x1 - x0), H);
      c.fillStyle = 'rgba(239,115,41,.42)';
      c.fillRect(x0, 0, 1, H);
      if (opts.labels && x1 - x0 > 13) {
        c.fillStyle = 'rgba(178,88,24,.9)';
        c.font = '600 7px -apple-system, system-ui, sans-serif';
        c.fillText(String((pad.i || 0) + 1), x0 + 3, 9);
      }
    }
  }
  if (!opts.noBaseline) {
    c.fillStyle = 'rgba(11,11,12,.07)';
    c.fillRect(0, mid, W, 1);
  }
  const buckets = peaks.length / 2;
  const r0 = opts.range ? opts.range[0] : 0;
  const r1 = opts.range ? opts.range[1] : 1;
  c.fillStyle = opts.color || '#2B2A66';
  for (let x = 0; x < W; x++) {
    const p = r0 + (x / W) * (r1 - r0);
    const b = Math.min(buckets - 1, Math.max(0, Math.floor(p * buckets)));
    let y1 = mid - peaks[b * 2 + 1] * amp;
    let y2 = mid - peaks[b * 2] * amp;
    if (y2 - y1 < 1) { y1 -= .5; y2 += .5; }
    c.fillRect(x, y1, 1, y2 - y1);
  }
}

function makeWave(container, opts = {}) {
  container.innerHTML = `
    <canvas class="wave-canvas"></canvas>
    <div class="wave-loop"></div>
    <div class="wave-play"></div>
    <div class="wave-empty"></div>`;
  const canvas = $('.wave-canvas', container);
  const loopEl = $('.wave-loop', container);
  const playEl = $('.wave-play', container);
  const emptyEl = $('.wave-empty', container);
  const view = {
    el: container,
    canvas,
    peaks: null,
    duration: 0,
    chops: null,
    loop: null,
    setSource(source, chops) {
      this.peaks = source && source.peaks ? source.peaks : null;
      this.duration = source && source.duration ? source.duration : 0;
      this.chops = chops || null;
      emptyEl.textContent = this.duration ? '' : (opts.empty || 'No sound loaded');
      emptyEl.hidden = !!this.duration;
      this.draw();
      this.setPosition(0);
    },
    setChops(chops) {
      this.chops = chops || null;
      this.draw();
    },
    setLoop(loop) {
      this.loop = loop;
      this.paintLoop();
    },
    setPosition(sec) {
      this.playhead = sec;
      if (!this.duration) { playEl.style.opacity = '0'; return; }
      const p = clamp(sec / this.duration, 0, 1);
      playEl.style.opacity = '1';
      playEl.style.left = (p * 100) + '%';
    },
    paintLoop() {
      if (this.loop && this.loop.enabled && this.loop.end > this.loop.start && this.duration) {
        loopEl.style.display = 'block';
        loopEl.style.left = (this.loop.start / this.duration * 100) + '%';
        loopEl.style.width = ((this.loop.end - this.loop.start) / this.duration * 100) + '%';
      } else {
        loopEl.style.display = 'none';
      }
    },
    draw() {
      if (!this.el.isConnected) return;
      paintWave(canvas, this.peaks, {
        color: opts.color || '#2B2A66',
        chops: this.chops,
        duration: this.duration,
        labels: !!opts.labels,
        amp: opts.amp || .42,
      });
    },
  };
  container.addEventListener('pointerdown', (event) => {
    if (!view.duration) return;
    const rect = canvas.getBoundingClientRect();
    const p = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const sec = p * view.duration;
    E.seek(sec);
    view.setPosition(sec);
  });
  WAVES.push(view);
  return view;
}

/* ─────────── clock + boot ─────────── */

function clock() {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  const el = $('#sbTime');
  if (el) el.textContent = h + ':' + m;
}

async function boot() {
  if (S.started) return;
  const btn = $('#bootStart');
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = 'Starting…';
  try {
    await E.start();
    S.started = true;
    S.chain = E.getChain();
    S.pads = E.getPads();
    const bootEl = $('#boot');
    bootEl.classList.add('is-gone');
    setTimeout(() => {
      bootEl.hidden = true;
      document.body.classList.remove('is-booting');
    }, reduceMotion ? 20 : 640);
    $('#views').hidden = false;
    $('#tabbar').hidden = false;
    renderAll();
    S.view = '';
    go('shelf');
    loadShelf();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Tap to start';
    if (location.protocol === 'file:') {
      toast('Audio needs a server. Open this over http://localhost, not a file.', 6000);
    } else {
      toast(err && err.message ? err.message : 'Audio could not start.', 5000);
    }
  }
}

/* ─────────── navigation ─────────── */

function viewEl(name) {
  return $('.view[data-view="' + name + '"]');
}

function go(view) {
  if (!view) view = 'shelf';
  if (view === 'board' && S.view !== 'board') S.returnView = S.view;
  if (view === S.view) {
    if (view === 'shelf') loadShelf();
    return;
  }
  const prev = viewEl(S.view);
  const next = viewEl(view);
  if (!next) return;
  if (prev) prev.classList.remove('is-active');
  next.classList.add('is-active');
  next.scrollTop = 0;
  S.view = view;
  $$('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.go === view));
  if (view === 'shelf') loadShelf();
  else if (view === 'pads') renderPads();
  else if (view === 'chain') renderChainList();
  else if (view === 'board') renderBoard();
}

/* ─────────── transport helpers ─────────── */

function updateBpm() {
  const bpm = S.source && S.source.bpm ? Math.round(S.source.bpm) : 120;
  const el = $('#bpmVal');
  if (el) el.textContent = bpm + ' BPM';
}

function syncPlayButton() {
  const playing = E.isPlaying();
  if (playing === S.playing) return;
  S.playing = playing;
  const btn = $('#playBtn');
  if (!btn) return;
  const play = $('.ic-play', btn);
  const stop = $('.ic-stop', btn);
  if (play) play.hidden = playing;
  if (stop) stop.hidden = !playing;
  btn.setAttribute('aria-label', playing ? 'Stop' : 'Play');
  btn.classList.toggle('is-playing', playing);
}

function tapTempo() {
  const now = performance.now();
  S.taps = S.taps.filter((t) => now - t < 2600);
  S.taps.push(now);
  if (S.taps.length < 2) { toast('Tap again…', 900); return; }
  const gaps = [];
  for (let i = 1; i < S.taps.length; i++) gaps.push(S.taps[i] - S.taps[i - 1]);
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const bpm = clamp(Math.round(60000 / avg), 20, 300);
  E.setBpm(bpm);
  S.source = E.getSource();
  updateBpm();
  toast(bpm + ' BPM', 900);
}

/* ─────────── shelf ─────────── */

const CARD_LOOK = {
  bake: { badge: 'Bake', grad: 'linear-gradient(160deg,#F1EBFF,#DFD4FF)', color: 'rgba(91,75,196,.82)' },
  chop: { badge: 'Chops', grad: 'linear-gradient(160deg,#FFEFE1,#FFDCC0)', color: 'rgba(210,115,42,.82)' },
  chain: { badge: 'Chain', grad: 'linear-gradient(160deg,#E7F8ED,#CFEFDB)', color: 'rgba(46,158,99,.82)' },
};

async function loadShelf() {
  const token = ++S.shelfToken;
  try {
    const [bakes, sources, projects] = await Promise.all([
      E.listBakes(), E.listSources(), E.listProjects(),
    ]);
    if (token !== S.shelfToken) return;
    const live = new Set(bakes.map((bake) => bake.id));
    let stale = false;
    [bakeNames, bakePeaks].forEach((map) => map.forEach((value, id) => {
      if (!live.has(id)) { map.delete(id); stale = true; }
    }));
    if (stale) storeBakeMeta();
    const items = [];
    for (let i = 0; i < bakes.length; i++) {
      const bake = bakes[i];
      items.push({
        kind: 'bake',
        id: bake.id,
        name: bakeNames.get(bake.id) || ('Bake ' + fmtTime(bake.duration)),
        meta: fmtDate(bake.created) || 'Baked',
        date: bake.created,
        duration: bake.duration,
        peaks: bakePeaks.get(bake.id) || null,
      });
    }
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      items.push({
        kind: 'chop',
        id: src.id,
        name: src.name,
        meta: fmtTime(src.duration) + ' · audio',
        date: src.added,
        duration: src.duration,
        peaks: S.source && S.source.id === src.id ? S.source.peaks : null,
      });
    }
    for (let i = 0; i < projects.length; i++) {
      const proj = projects[i];
      items.push({
        kind: 'chain',
        id: proj.id,
        name: proj.name,
        meta: proj.bakeCount + (proj.bakeCount === 1 ? ' bake' : ' bakes') + ' · ' + fmtDate(proj.updated),
        date: proj.updated,
      });
    }
    items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    S.shelf = items;
    renderShelf();
  } catch (err) {
    if (token !== S.shelfToken) return;
    S.shelf = [];
    renderShelf();
  }
}

function shelfCardHTML(item) {
  const look = CARD_LOOK[item.kind] || CARD_LOOK.bake;
  return `<button class="card" data-kind="${item.kind}" data-id="${esc(item.id)}">
    <div class="card-art" style="background:${look.grad}">
      <span class="card-badge">${look.badge}</span>
      <canvas></canvas>
    </div>
    <div class="card-name">${esc(item.name)}</div>
    <div class="card-meta">${esc(item.meta)}</div>
  </button>`;
}

function drawCardArt(canvas, item) {
  const look = CARD_LOOK[item.kind] || CARD_LOOK.bake;
  const peaks = item.peaks || seededPeaks(item.id);
  paintWave(canvas, peaks, { color: look.color, amp: .44, noBaseline: true });
}

function renderShelf() {
  const grid = $('#shelfGrid');
  if (!grid) return;
  const filter = S.shelfFilter;
  const items = filter === 'all' ? S.shelf : S.shelf.filter((item) => item.kind === filter);
  grid.innerHTML = items.map(shelfCardHTML).join('');
  requestAnimationFrame(() => {
    $$('.card', grid).forEach((card) => {
      const item = items.find((row) => row.kind === card.dataset.kind && row.id === card.dataset.id);
      const canvas = $('canvas', card);
      if (item && canvas) drawCardArt(canvas, item);
    });
  });
  const empty = $('#shelfEmpty');
  if (!empty) return;
  empty.hidden = items.length > 0;
  if (items.length) return;
  const labels = { bake: 'bakes', chop: 'chops', chain: 'chains' };
  const hasAny = S.shelf.length > 0;
  $('h3', empty).textContent = hasAny ? 'No ' + (labels[filter] || 'sounds') + ' yet' : 'Nothing here yet';
  $('p', empty).textContent = hasAny
    ? 'Try another filter.'
    : 'Load a sound, chop it, bake it. Your shelf fills up as you go.';
  const add = $('#emptyAdd');
  if (add) add.hidden = hasAny;
}

/* ─────────── board ─────────── */

function updateTransportTime(sec) {
  const text = fmtTime(sec);
  if (text === S.lastTimeText) return;
  S.lastTimeText = text;
  const el = $('#timeNow');
  if (el) el.textContent = text;
}

function renderBoard() {
  const title = $('#boardTitle');
  if (title) title.textContent = S.source ? S.source.name : 'No sound';
  if (S.boardWave) {
    S.boardWave.setSource(S.source, null);
    S.boardWave.setLoop(E.getLoop());
    S.boardWave.setPosition(E.position());
  }
  $$('.seg-btn', $('#boardSeg')).forEach((btn) => btn.classList.toggle('is-on', btn.dataset.seg === S.seg));
  const chainPane = $('#boardChain');
  const padsPane = $('#boardPads');
  if (chainPane) chainPane.hidden = S.seg !== 'chain';
  if (padsPane) padsPane.hidden = S.seg !== 'pads';
  renderChainRail();
  if (S.seg === 'pads') renderBoardPads();
  updateBpm();
  updateTransportTime(E.position());
}

function chainShape(chain) {
  return chain.map((pedal) => pedal.id + (pedal.bypass ? '-' : '+')).join();
}

function renderChainRail() {
  const host = $('#boardChain');
  if (!host) return;
  S.railShape = chainShape(S.chain);
  const rail = $('.chain-rail', host);
  const scroll = rail ? rail.scrollLeft : 0;
  const pedals = S.chain.map((pedal) => `
    <button class="pedal" data-pedal="${esc(pedal.id)}" aria-label="${esc(pedalName(pedal.type))}">
      <div class="pedal-art">${pedalSVG(pedal.type, { bypass: pedal.bypass })}</div>
      <div class="pedal-name">${esc(pedalName(pedal.type))}</div>
    </button>`).join('');
  host.innerHTML = `<div class="chain-rail">${pedals}
    <button class="pedal-add" data-add-pedal="1" aria-label="Add a pedal">
      <svg viewBox="0 0 24 24" width="19" height="19"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>
      <span>Add pedal</span>
    </button>
  </div>`;
  const next = $('.chain-rail', host);
  if (next) next.scrollLeft = scroll;
}

function padButtonHTML(pad) {
  const empty = !(pad.end > pad.start);
  const cls = ['pad', empty ? 'is-empty' : 'is-ready', pad.favorite ? 'is-fav' : '', pad.ready ? '' : 'is-loading']
    .filter(Boolean).join(' ');
  return `<button class="${cls}" data-pad="${pad.i}" aria-label="Pad ${pad.i + 1}${pad.favorite ? ', favorite' : ''}">
    <span class="pad-n">${pad.i + 1}</span>
    ${empty ? '' : '<canvas class="pad-mini"></canvas>'}
  </button>`;
}

function drawPadMinis(container) {
  if (!container || !S.source || !S.source.peaks || !S.source.duration) return;
  $$('.pad', container).forEach((el) => {
    const index = Number(el.dataset.pad);
    const pad = S.pads[index];
    const canvas = $('canvas', el);
    if (!pad || !canvas || !(pad.end > pad.start)) return;
    paintWave(canvas, S.source.peaks, {
      color: 'rgba(138,74,22,.58)',
      amp: .5,
      noBaseline: true,
      range: [pad.start / S.source.duration, pad.end / S.source.duration],
    });
  });
}

function renderPadGrid() {
  const html = S.pads.map(padButtonHTML).join('');
  const main = $('#padGrid');
  if (main) main.innerHTML = html;
  const board = $('#boardPadGrid');
  if (board) board.innerHTML = html;
  requestAnimationFrame(() => {
    drawPadMinis(main);
    drawPadMinis(board);
  });
}

function renderBoardPads() {
  const pane = $('#boardPads');
  if (!pane) return;
  if (!$('.pad-grid', pane)) pane.innerHTML = '<div class="pad-grid pad-grid--board" id="boardPadGrid"></div>';
  const grid = $('#boardPadGrid');
  if (grid) {
    grid.innerHTML = S.pads.map(padButtonHTML).join('');
    requestAnimationFrame(() => drawPadMinis(grid));
  }
}

/* ─────────── pads ─────────── */

function renderPads() {
  const eyebrow = $('#padsEyebrow');
  if (eyebrow) eyebrow.textContent = S.source ? S.source.name : 'No sound';
  if (S.padsWave) {
    S.padsWave.setSource(S.source, S.pads);
    S.padsWave.setPosition(E.position());
  }
  renderPadGrid();
}

function renderPadsWaveChops() {
  if (S.padsWave) S.padsWave.setChops(S.pads);
}

async function doChop(mode) {
  if (!S.source) { toast('Load a sound first.'); openLoadSheet(); return; }
  if (S.chopping) return;
  S.chopping = true;
  toast(mode === 'find' ? 'Finding hits…' : mode === 'slice' ? 'Slicing…' : 'Shuffling…', 5000);
  try {
    const pads = await E.chop(mode, mode === 'slice' ? { division: '1' } : {});
    S.pads = pads;
    renderPadGrid();
    renderPadsWaveChops();
    const filled = pads.filter((pad) => pad.end > pad.start).length;
    toast(filled + ' pads', 1400);
  } catch (err) {
    toast(err && err.message ? err.message : 'Chop failed.');
  }
  S.chopping = false;
}

/* ─────────── chain ─────────── */

function renderChainList() {
  const eyebrow = $('#chainEyebrow');
  if (eyebrow) eyebrow.textContent = S.source ? S.source.name : 'No sound';
  const list = $('#chainList');
  if (!list) return;
  list.innerHTML = S.chain.map((pedal) => `
    <button class="chain-row${pedal.bypass ? ' is-bypass' : ''}" data-pedal="${esc(pedal.id)}">
      <div class="chain-art">${pedalSVG(pedal.type, { bypass: pedal.bypass })}</div>
      <div class="chain-copy">
        <div class="chain-name">${esc(pedalName(pedal.type))}</div>
        <div class="chain-sub">${esc(pedalSummary(pedal))}</div>
      </div>
      <span class="chain-state${pedal.bypass ? ' is-off' : ''}">${pedal.bypass ? 'Off' : 'On'}</span>
      <span class="chain-grip" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 9h12M6 15h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </span>
    </button>`).join('');
  const empty = $('#chainEmpty');
  if (empty) empty.hidden = S.chain.length > 0;
}

/* ─────────── source lifecycle ─────────── */

function renderAll() {
  renderBoard();
  renderPads();
  renderChainList();
  renderPadGrid();
  updateBpm();
}

async function afterSource(source, opts = {}) {
  S.source = source || E.getSource();
  S.chain = E.getChain();
  S.pads = E.getPads();
  S.lastPos = -1;
  S.lastTimeText = '';
  renderAll();
  go('board');
  if (opts.autoChop) {
    try {
      const pads = await E.chop('find');
      S.pads = pads;
      renderPadGrid();
      renderPadsWaveChops();
      const filled = pads.filter((pad) => pad.end > pad.start).length;
      toast(filled + ' chops ready', 1600);
    } catch (err) {
      /* the source still plays without chops */
    }
  }
}

async function loadSourceFlow(id) {
  if (S.source && S.source.id === id) {
    closeSheet(true);
    go('board');
    return;
  }
  try {
    toast('Loading sound…', 5000);
    const source = await E.loadSource(id);
    S.projectName = source.name;
    closeSheet(true);
    await afterSource(source, { autoChop: true });
  } catch (err) {
    toast(err && err.message ? err.message : 'Could not load that sound.');
  }
}

async function loadProjectFlow(id) {
  try {
    toast('Opening project…', 5000);
    const source = await E.loadProject(id);
    const item = S.shelf.find((row) => row.kind === 'chain' && row.id === id);
    S.projectId = id;
    S.projectName = item ? item.name : 'Project';
    closeSheet(true);
    await afterSource(source || E.getSource(), { autoChop: false });
    toast('Opened ' + S.projectName);
  } catch (err) {
    toast(err && err.message ? err.message : 'Could not open that project.');
  }
}

/* ─────────── sheet shell ─────────── */

let sheetTimer = 0;
let recTimer = 0;

function openSheet() {
  clearTimeout(sheetTimer);
  const layer = $('#sheetLayer');
  const body = $('#sheetBody');
  if (!layer || !body) return;
  layer.hidden = false;
  body.scrollTop = 0;
  document.body.classList.add('has-sheet');
  requestAnimationFrame(() => layer.classList.add('is-open'));
}

function closeSheet(force) {
  if (S.recording && !force) { toast('Stop recording first.'); return; }
  const layer = $('#sheetLayer');
  const body = $('#sheetBody');
  if (!layer || layer.hidden) return;
  const kind = S.sheet.kind;
  layer.classList.remove('is-open');
  document.body.classList.remove('has-sheet');
  S.sheet = { kind: '' };
  S.curve = null;
  S.curveCanvas = null;
  S.bake = null;
  if (kind === 'pad') {
    renderPadGrid();
    renderPadsWaveChops();
  } else if (kind === 'pedal') {
    renderChainRail();
    renderChainList();
  }
  clearTimeout(sheetTimer);
  sheetTimer = setTimeout(() => {
    if (!layer.classList.contains('is-open')) {
      layer.hidden = true;
      if (body) body.innerHTML = '';
    }
  }, reduceMotion ? 20 : 420);
}

/* ─────────── load a sound ─────────── */

function openLoadSheet() {
  S.sheet = { kind: 'load' };
  const body = $('#sheetBody');
  body.innerHTML = `
    <div class="sheet-head">
      <div>
        <div class="sheet-title">Load a sound</div>
        <div class="sheet-note">Everything stays on this device.</div>
      </div>
      <button class="sheet-close" data-close-sheet aria-label="Close">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="load-row">
      <button class="load-opt" id="loadFileOpt">
        <svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 15V4m0 0L8 8m4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <span>Pick a file</span>
      </button>
      <button class="load-opt" id="loadRecOpt">
        <span class="rec-dot${S.recording ? ' is-on' : ''}">
          <svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="4.6" fill="currentColor"/></svg>
        </span>
        <span id="recLabel">${S.recording ? 'Stop recording' : 'Record'}</span>
        <span class="rec-time" id="recTime" ${S.recording ? '' : 'hidden'}>0:00</span>
      </button>
    </div>
    <div class="sec-head">
      <h3>Recent sources</h3>
      <button class="link" id="refreshSources">Refresh</button>
    </div>
    <div class="sheet-scrolllist" id="sourceList"><p class="sheet-note">Looking…</p></div>
    <p class="footnote">Audio files up to 50 MB or 5 minutes.</p>`;
  openSheet();
  $('#loadFileOpt').addEventListener('click', () => $('#fileInput').click());
  $('#loadRecOpt').addEventListener('click', toggleRecording);
  $('#refreshSources').addEventListener('click', refreshSourceList);
  refreshSourceList();
  if (S.recording) startRecTimer();
}

async function refreshSourceList() {
  const box = $('#sourceList');
  if (!box) return;
  try {
    const sources = await E.listSources();
    if (!box.isConnected) return;
    if (!sources.length) {
      box.innerHTML = '<p class="sheet-note">Nothing loaded yet. Pick a file or record something.</p>';
      return;
    }
    box.innerHTML = sources.map((src) => `
      <button class="src-row" data-source="${esc(src.id)}">
        <div class="src-art"><canvas></canvas></div>
        <div class="src-copy">
          <div class="src-name">${esc(src.name)}</div>
          <div class="src-meta">${fmtTime(src.duration)} · ${fmtDate(src.added)}</div>
        </div>
      </button>`).join('');
    requestAnimationFrame(() => {
      $$('.src-row', box).forEach((row) => {
        const src = sources.find((item) => item.id === row.dataset.source);
        const canvas = $('canvas', row);
        if (!src || !canvas) return;
        const peaks = S.source && S.source.id === src.id ? S.source.peaks : seededPeaks(src.id);
        paintWave(canvas, peaks, { color: 'rgba(43,42,102,.7)', amp: .44, noBaseline: true });
      });
    });
  } catch (err) {
    if (box.isConnected) box.innerHTML = '<p class="sheet-note">Could not read saved sounds.</p>';
  }
}

function startRecTimer() {
  clearInterval(recTimer);
  recTimer = setInterval(() => {
    const el = $('#recTime');
    if (!el) return;
    el.hidden = false;
    el.textContent = fmtTime((performance.now() - S.recStart) / 1000);
  }, 250);
}

function stopRecTimer() {
  clearInterval(recTimer);
  recTimer = 0;
}

async function toggleRecording() {
  try {
    if (!S.recording) {
      await E.recordStart();
      S.recording = true;
      S.recStart = performance.now();
      const label = $('#recLabel');
      if (label) label.textContent = 'Stop recording';
      const dot = $('#loadRecOpt .rec-dot');
      if (dot) dot.classList.add('is-on');
      startRecTimer();
      toast('Recording… tap again to stop.', 3000);
      return;
    }
    const source = await E.recordStop();
    S.recording = false;
    stopRecTimer();
    S.projectName = source.name;
    closeSheet(true);
    await afterSource(source, { autoChop: true });
  } catch (err) {
    S.recording = false;
    stopRecTimer();
    toast(err && err.message ? err.message : 'Microphone unavailable.', 4000);
  }
}

async function loadFileFlow(file) {
  try {
    toast('Loading ' + file.name + '…', 10000);
    const source = await E.loadFile(file);
    S.projectName = source.name;
    closeSheet(true);
    await afterSource(source, { autoChop: true });
  } catch (err) {
    toast(err && err.message ? err.message : 'Could not load that file.', 4000);
  }
}

/* ─────────── drag reorder ─────────── */

/* Drag a pedal along its list. Neighbours slide with transforms and the
   engine order follows live; the DOM is rebuilt once on drop. Rows drag by
   their grip (touch too); rail pedals drag with a mouse or pen, since a
   finger on the rail scrolls it. */
function wireReorder(host, opts) {
  let drag = null;
  const vertical = opts.axis === 'y';
  const coord = (event) => (vertical ? event.clientY : event.clientX);
  const paint = (st) => {
    st.frame = 0;
    // swap once the row is a third of the way over its neighbour, so the gap opens early
    const to = clamp(st.from + Math.trunc((st.d + Math.sign(st.d) * st.step * 0.65) / st.step), 0, st.items.length - 1);
    const move = vertical ? 'translateY(' : 'translateX(';
    st.items.forEach((el, i) => {
      let shift = 0;
      if (el === st.item) shift = st.d;
      else if (st.from < to && i > st.from && i <= to) shift = -st.step;
      else if (to < st.from && i >= to && i < st.from) shift = st.step;
      el.style.transform = shift ? move + shift + 'px)' : '';
    });
    if (to !== st.to) {
      st.to = to;
      E.movePedal(st.id, to);
    }
  };
  host.addEventListener('pointerdown', (event) => {
    if (event.button || drag) return;
    const item = event.target.closest(opts.item);
    if (!item || !host.contains(item)) return;
    if (opts.handle ? !event.target.closest(opts.handle) : event.pointerType === 'touch') return;
    const items = $$(opts.item, host);
    const index = items.indexOf(item);
    const a = items[0];
    const b = items[1];
    drag = {
      item, items, id: item.dataset.pedal, pointerId: event.pointerId,
      from: index, to: index, start: coord(event), d: 0, on: false, frame: 0,
      step: b ? (vertical ? b.offsetTop - a.offsetTop : b.offsetLeft - a.offsetLeft) : 1,
    };
  });
  host.addEventListener('pointermove', (event) => {
    if (!drag || drag.done || event.pointerId !== drag.pointerId) return;
    const d = coord(event) - drag.start;
    if (!drag.on) {
      if (Math.abs(d) < 6) return;
      drag.on = true;
      S.dragging = true;
      drag.item.setPointerCapture(event.pointerId);
      drag.item.classList.add('is-lifted');
      host.classList.add('is-sorting');
    }
    event.preventDefault();
    drag.d = d;
    if (!drag.frame) {
      const st = drag;
      st.frame = requestAnimationFrame(() => paint(st));
    }
  });
  const end = (event) => {
    if (!drag || drag.done || event.pointerId !== drag.pointerId) return;
    const st = drag;
    if (!st.on) { drag = null; return; }
    st.done = true;
    if (st.frame) { cancelAnimationFrame(st.frame); paint(st); }
    S.dragEndAt = performance.now();
    // settle the lifted row into its slot, then render the new order in place
    st.item.classList.add('is-settling');
    st.item.style.transform = (vertical ? 'translateY(' : 'translateX(') + (st.to - st.from) * st.step + 'px)';
    setTimeout(() => {
      drag = null;
      S.dragging = false;
      S.dragEndAt = performance.now();
      host.classList.remove('is-sorting');
      st.items.forEach((el) => { el.style.transform = ''; el.classList.remove('is-lifted', 'is-settling'); });
      S.chain = E.getChain();
      renderChainRail();
      renderChainList();
    }, reduceMotion ? 0 : 190);
  };
  host.addEventListener('pointerup', end);
  host.addEventListener('pointercancel', end);
}

/* ─────────── pedal picker ─────────── */

function openPedalPicker() {
  S.sheet = { kind: 'picker' };
  const full = S.chain.length >= 6;
  const body = $('#sheetBody');
  body.innerHTML = `
    <div class="sheet-head">
      <div>
        <div class="sheet-title">Add a pedal</div>
        <div class="sheet-note">${full ? 'The chain is full. Remove a pedal to add another.' : 'The chain holds up to six.'}</div>
      </div>
      <button class="sheet-close" data-close-sheet aria-label="Close">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="pick-grid">
      ${PEDAL_TYPES.map((type) => `
        <button class="pick-card" data-pick="${type}"${full ? ' disabled' : ''}>
          <div class="pick-art">${pedalSVG(type)}</div>
          <div>
            <div class="pick-name">${esc(pedalName(type))}</div>
            <div class="pick-sub">${esc(PEDAL_BLURB[type])}</div>
          </div>
        </button>`).join('')}
    </div>`;
  openSheet();
  $$('[data-pick]', body).forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = E.addPedal(btn.dataset.pick);
      if (id) openPedalSheet(id);
    });
  });
}

/* ─────────── knobs ─────────── */

function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx, cy, r, from, to) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function knobElHTML(opts) {
  const value = clamp(opts.value, 0, 1);
  const angle = -135 + 270 * value;
  const [tx1, ty1] = polar(27, 27, 12, angle);
  const [tx2, ty2] = polar(27, 27, 18, angle);
  return `<div class="knob" data-knob="${esc(opts.key)}" data-value="${value}" role="slider" tabindex="0"
      aria-label="${esc(opts.label)}" aria-valuemin="0" aria-valuemax="100"
      aria-valuenow="${Math.round(value * 100)}" aria-valuetext="${esc(opts.format(value))}">
    <div class="knob-dial">
      <svg viewBox="0 0 54 54">
        <path class="knob-track" d="${arcPath(27, 27, 22, -135, 135)}"/>
        ${value > .004 ? `<path class="knob-value" d="${arcPath(27, 27, 22, -135, angle)}"/>` : ''}
        <circle class="knob-cap" cx="27" cy="27" r="15.5"/>
        <line class="knob-tick" x1="${tx1.toFixed(2)}" y1="${ty1.toFixed(2)}" x2="${tx2.toFixed(2)}" y2="${ty2.toFixed(2)}"/>
      </svg>
    </div>
    <div class="knob-label">${esc(opts.label)}</div>
    <div class="knob-read">${esc(opts.format(value))}</div>
  </div>`;
}

function paintKnob(el, value, format) {
  const v = clamp(value, 0, 1);
  const angle = -135 + 270 * v;
  const svg = $('svg', el);
  let path = $('.knob-value', svg);
  if (v <= .004) {
    if (path) path.remove();
  } else {
    if (!path) {
      path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', 'knob-value');
      svg.insertBefore(path, $('.knob-cap', svg));
    }
    path.setAttribute('d', arcPath(27, 27, 22, -135, angle));
  }
  const tick = $('.knob-tick', svg);
  const [x1, y1] = polar(27, 27, 12, angle);
  const [x2, y2] = polar(27, 27, 18, angle);
  tick.setAttribute('x1', x1.toFixed(2));
  tick.setAttribute('y1', y1.toFixed(2));
  tick.setAttribute('x2', x2.toFixed(2));
  tick.setAttribute('y2', y2.toFixed(2));
  el.dataset.value = String(v);
  el.setAttribute('aria-valuenow', String(Math.round(v * 100)));
  el.setAttribute('aria-valuetext', format(v));
  const read = $('.knob-read', el);
  if (read) read.textContent = format(v);
}

function wireKnob(el, opts) {
  const def = opts.def == null ? .5 : opts.def;
  const format = opts.format;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let sv = 0;
  const read = () => Number(el.dataset.value) || 0;
  const apply = (value, commit) => {
    paintKnob(el, value, format);
    if (opts.onInput) opts.onInput(clamp(value, 0, 1));
    if (commit && opts.onCommit) opts.onCommit(clamp(value, 0, 1));
  };
  el.addEventListener('pointerdown', (event) => {
    if (event.button) return;
    dragging = true;
    sx = event.clientX;
    sy = event.clientY;
    sv = read();
    el.setPointerCapture(event.pointerId);
    el.classList.add('is-dragging');
    event.preventDefault();
  });
  el.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const delta = (sy - event.clientY) + (event.clientX - sx) * .3;
    const scale = event.shiftKey ? 800 : 190;
    apply(sv + delta / scale, false);
  });
  const stop = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('is-dragging');
    if (opts.onCommit) opts.onCommit(read());
  };
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
  el.addEventListener('dblclick', () => apply(def, true));
  el.addEventListener('wheel', (event) => {
    event.preventDefault();
    apply(read() + (event.deltaY < 0 ? .01 : -.01), true);
  }, { passive: false });
  el.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? .05 : .01;
    let v = read();
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') v += step;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') v -= step;
    else if (event.key === 'Home') v = 0;
    else if (event.key === 'End') v = 1;
    else return;
    event.preventDefault();
    apply(v, true);
  });
}

/* ─────────── pedal sheet ─────────── */

function defaultCurveKnob(pedal) {
  const def = E.PEDAL_DEFS[pedal.type];
  if (!def) return 'mix';
  if (pedal.type === 'sweep') return 'cutoff';
  const mix = def.knobs.find((knob) => knob.key === 'mix');
  return mix ? 'mix' : def.knobs[0].key;
}

function openPedalSheet(id) {
  const pedal = S.chain.find((row) => row.id === id);
  if (!pedal) return;
  const def = E.PEDAL_DEFS[pedal.type];
  if (!def) return;
  S.sheet = { kind: 'pedal', id };
  const toggles = def.knobs.filter((knob) => knob.steps === 2);
  const dials = def.knobs.filter((knob) => knob.steps !== 2);
  const target = pedal.curve && pedal.curve.knob ? pedal.curve.knob : defaultCurveKnob(pedal);
  const curve = pedal.curve
    ? {
        knob: pedal.curve.knob,
        points: pedal.curve.points.map((point) => [point[0], point[1]]),
        bars: pedal.curve.bars,
        amount: pedal.curve.amount,
      }
    : {
        knob: target,
        points: E.CURVE_PRESETS.ramp.map((point) => [point[0], point[1]]),
        bars: 1,
        amount: 0,
      };
  const curveKnob = def.knobs.find((knob) => knob.key === curve.knob);
  const curveLabel = curveKnob ? curveKnob.label : def.name;
  const body = $('#sheetBody');
  body.innerHTML = `
    <div class="pedal-hero">
      <div class="pedal-hero-art">${pedalSVG(pedal.type, { bypass: pedal.bypass })}</div>
      <div class="pedal-hero-copy">
        <div class="pedal-hero-title">${esc(def.name)}</div>
        <div class="pedal-hero-sub">${esc(PEDAL_BLURB[pedal.type] || 'Pedal')}</div>
        <div class="switch-row" style="border:0;padding:10px 0 0">
          <span class="switch-label">${pedal.bypass ? 'Bypassed' : 'On'}</span>
          <button class="switch${pedal.bypass ? '' : ' is-on'}" id="pedalBypass" role="switch" aria-checked="${!pedal.bypass}" aria-label="Bypass"></button>
        </div>
      </div>
      <button class="sheet-close pedal-hero-close" data-close-sheet aria-label="Close">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
    </div>
    ${toggles.length ? `<div class="toggle-row">${toggles.map((knob) => `
      <button class="mini-btn${pedal.knobs[knob.key] >= .5 ? ' is-on' : ''}" data-toggle="${esc(knob.key)}">${esc(knob.label)}</button>`).join('')}</div>` : ''}
    <div class="knob-grid">${dials.map((knob) => knobElHTML({
      key: knob.key,
      label: knob.label,
      value: pedal.knobs[knob.key],
      format: (v) => E.formatKnob(pedal.type, knob.key, v),
    })).join('')}</div>
    <div class="curve-card">
      <div class="curve-head">
        <span class="curve-title">Movement · ${esc(curveLabel)}</span>
        <span class="curve-sub" id="curveState">${curve.amount > 0 ? 'On' : 'Off'}</span>
      </div>
      <div class="curve-targets" id="curveTargets">
        ${def.knobs.map((knob) => `<button class="ctarget${knob.key === curve.knob ? ' is-on' : ''}" data-curve-knob="${esc(knob.key)}">${esc(knob.label)}</button>`).join('')}
      </div>
      <div class="curve-canvas"><canvas id="curveCanvas"></canvas></div>
      <div class="curve-divs" id="curveDivs">
        ${[[.25, '1/4'], [.5, '1/2'], [1, '1 bar'], [2, '2 bars'], [4, '4 bars']].map(([bars, label]) => `
          <button class="cdiv${bars === curve.bars ? ' is-on' : ''}" data-bars="${bars}">${label}</button>`).join('')}
      </div>
      <div class="curve-presets" id="curvePresets">
        ${['ramp', 'saw', 'square', 'triangle', 'pump'].map((name) => `
          <button class="curve-preset" data-preset="${name}" title="${name}" aria-label="${name}">
            <svg viewBox="0 0 24 24" width="15" height="15">${curveIcon(name)}</svg>
          </button>`).join('')}
      </div>
      <div class="curve-range">
        <input id="curveRange" type="range" min="0" max="100" value="${Math.round(curve.amount * 100)}" aria-label="Range" />
        <span id="curveAmount">Range ${Math.round(curve.amount * 100)}%</span>
      </div>
      <div class="pair" style="margin-top:22px">
        <button class="mini-btn" id="curveClear">Clear</button>
        <button class="mini-btn is-on" id="curveDone">Done</button>
      </div>
    </div>
    <div class="sheet-actions">
      <div class="pair">
        <button class="mini-btn" id="pedalEarlier">Move earlier</button>
        <button class="mini-btn" id="pedalLater">Move later</button>
      </div>
      <button class="btn-ghost" id="pedalRemove">Remove pedal</button>
    </div>`;
  openSheet();

  let bypass = pedal.bypass;
  const switchEl = $('#pedalBypass');
  const artEl = $('.pedal-hero-art .pedal-svg');
  switchEl.addEventListener('click', () => {
    bypass = !bypass;
    E.setBypass(pedal.id, bypass);
    switchEl.classList.toggle('is-on', !bypass);
    switchEl.setAttribute('aria-checked', String(!bypass));
    $('.switch-label', switchEl.closest('.switch-row')).textContent = bypass ? 'Bypassed' : 'On';
    if (artEl) artEl.classList.toggle('is-bypass', bypass);
  });

  $$('[data-toggle]', body).forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.toggle;
      const row = E.getChain().find((item) => item.id === pedal.id);
      const current = row ? row.knobs[key] : 0;
      const next = current >= .5 ? 0 : 1;
      E.setKnob(pedal.id, key, next);
      btn.classList.toggle('is-on', next >= .5);
    });
  });

  $$('.knob', body).forEach((el) => {
    const knob = def.knobs.find((item) => item.key === el.dataset.knob);
    if (!knob) return;
    wireKnob(el, {
      def: knob.default,
      format: (v) => E.formatKnob(pedal.type, knob.key, v),
      onInput: (v) => E.setKnob(pedal.id, knob.key, v),
    });
  });

  wireCurveEditor(pedal.id, curve, def);

  const index = () => E.getChain().findIndex((item) => item.id === pedal.id);
  $('#pedalEarlier').addEventListener('click', () => {
    const i = index();
    if (i > 0) E.movePedal(pedal.id, i - 1);
  });
  $('#pedalLater').addEventListener('click', () => {
    const i = index();
    if (i >= 0 && i < E.getChain().length - 1) E.movePedal(pedal.id, i + 1);
  });
  $('#pedalRemove').addEventListener('click', () => {
    E.removePedal(pedal.id);
    closeSheet(true);
    toast('Pedal removed');
  });
}

/* ─────────── curve editor ─────────── */

function curveIcon(name) {
  const paths = {
    ramp: 'M3 20 L21 5',
    saw: 'M3 20 L20 5 L20 20',
    square: 'M3 20 L3 5 L12 5 L12 20 L21 20',
    triangle: 'M3 20 L12 5 L21 20',
    pump: 'M3 18 C6 4 9 4 12 12 C15 20 18 20 21 6',
  };
  return `<path d="${paths[name] || paths.ramp}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function curvePoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const pad = 8;
  return {
    x: clamp((event.clientX - rect.left - pad) / Math.max(1, rect.width - pad * 2), 0, 1),
    y: clamp(1 - (event.clientY - rect.top - pad) / Math.max(1, rect.height - pad * 2), 0, 1),
  };
}

function commitCurve(pedalId, curve) {
  E.setCurve(pedalId, {
    knob: curve.knob,
    points: curve.points.map((point) => [point[0], point[1]]),
    bars: curve.bars,
    amount: curve.amount,
  });
}

function updateCurveUI(curve) {
  const state = $('#curveState');
  if (state) state.textContent = curve.amount > 0 ? 'On' : 'Off';
  const amount = $('#curveAmount');
  if (amount) amount.textContent = 'Range ' + Math.round(curve.amount * 100) + '%';
  const range = $('#curveRange');
  if (range && Number(range.value) !== Math.round(curve.amount * 100)) range.value = String(Math.round(curve.amount * 100));
  $$('#curveTargets .ctarget').forEach((btn) => btn.classList.toggle('is-on', btn.dataset.curveKnob === curve.knob));
  $$('#curveDivs .cdiv').forEach((btn) => btn.classList.toggle('is-on', Number(btn.dataset.bars) === curve.bars));
}

function drawCurveCanvas(canvas, curve, phase) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const c = canvas.getContext('2d');
  if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rect.width;
  const H = rect.height;
  c.clearRect(0, 0, W, H);
  const pad = 8;
  const x0 = pad;
  const y0 = pad;
  const x1 = W - pad;
  const y1 = H - pad;
  c.strokeStyle = 'rgba(11,11,12,.055)';
  c.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const x = x0 + (x1 - x0) * i / 4;
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
  }
  for (let i = 0; i <= 3; i++) {
    const y = y0 + (y1 - y0) * i / 3;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  }
  const px = (x) => x0 + (x1 - x0) * clamp(x, 0, 1);
  const py = (y) => y1 - (y1 - y0) * clamp(y, 0, 1);
  const points = curve.points && curve.points.length ? curve.points : [[0, .5], [1, .5]];
  c.beginPath();
  c.moveTo(px(0), y1);
  for (let i = 0; i < points.length; i++) c.lineTo(px(points[i][0]), py(points[i][1]));
  c.lineTo(px(1), y1);
  c.closePath();
  c.fillStyle = 'rgba(182,139,244,.18)';
  c.fill();
  c.beginPath();
  for (let i = 0; i < points.length; i++) {
    const X = px(points[i][0]);
    const Y = py(points[i][1]);
    if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
  }
  c.strokeStyle = '#7C4DE0';
  c.lineWidth = 2;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.stroke();
  for (let i = 0; i < points.length; i++) {
    const X = px(points[i][0]);
    const Y = py(points[i][1]);
    c.beginPath();
    c.arc(X, Y, 3.3, 0, Math.PI * 2);
    c.fillStyle = '#fff';
    c.fill();
    c.strokeStyle = '#7C4DE0';
    c.lineWidth = 1.8;
    c.stroke();
  }
  if (phase != null && curve.amount > 0) {
    const X = px(phase);
    c.strokeStyle = 'rgba(11,11,12,.3)';
    c.setLineDash([3, 3]);
    c.beginPath(); c.moveTo(X, y0); c.lineTo(X, y1); c.stroke();
    c.setLineDash([]);
    const Y = py(evalCurve(points, phase));
    c.beginPath();
    c.arc(X, Y, 4.2, 0, Math.PI * 2);
    c.fillStyle = '#0B0B0C';
    c.fill();
  }
}

function wireCurveEditor(pedalId, curve, def) {
  const canvas = $('#curveCanvas');
  if (!canvas) return;
  S.curve = curve;
  S.curveCanvas = canvas;
  S.curveDragging = false;
  requestAnimationFrame(() => drawCurveCanvas(canvas, curve, 0));
  let dragPoint = null;
  let frame = 0;
  const queueCommit = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      commitCurve(pedalId, curve);
    });
  };
  const redraw = () => drawCurveCanvas(canvas, curve, null);

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const pt = curvePoint(canvas, event);
    let best = -1;
    let bestD = .075;
    for (let i = 0; i < curve.points.length; i++) {
      const d = Math.abs(curve.points[i][0] - pt.x);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0) {
      curve.points.push([pt.x, pt.y]);
      curve.points.sort((a, b) => a[0] - b[0]);
      best = curve.points.findIndex((point) => point[0] === pt.x && point[1] === pt.y);
    }
    if (best < 0) return;
    dragPoint = curve.points[best];
    dragPoint[0] = pt.x;
    dragPoint[1] = pt.y;
    if (curve.amount === 0) curve.amount = .6;
    S.curveDragging = true;
    canvas.setPointerCapture(event.pointerId);
    updateCurveUI(curve);
    redraw();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragPoint) return;
    const pt = curvePoint(canvas, event);
    dragPoint[0] = pt.x;
    dragPoint[1] = pt.y;
    redraw();
  });
  const stop = () => {
    if (!dragPoint) return;
    dragPoint = null;
    S.curveDragging = false;
    curve.points.sort((a, b) => a[0] - b[0]);
    commitCurve(pedalId, curve);
    updateCurveUI(curve);
    redraw();
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('dblclick', (event) => {
    if (curve.points.length <= 2) return;
    const pt = curvePoint(canvas, event);
    let best = -1;
    let bestD = .09;
    for (let i = 0; i < curve.points.length; i++) {
      const d = Math.abs(curve.points[i][0] - pt.x);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best >= 0) {
      curve.points.splice(best, 1);
      commitCurve(pedalId, curve);
      redraw();
    }
  });

  $$('#curveTargets .ctarget').forEach((btn) => {
    btn.addEventListener('click', () => {
      curve.knob = btn.dataset.curveKnob;
      const knob = def.knobs.find((item) => item.key === curve.knob);
      const title = $('.curve-title');
      if (title && knob) title.textContent = 'Movement · ' + knob.label;
      commitCurve(pedalId, curve);
      updateCurveUI(curve);
    });
  });

  $$('#curveDivs .cdiv').forEach((btn) => {
    btn.addEventListener('click', () => {
      curve.bars = Number(btn.dataset.bars) || 1;
      commitCurve(pedalId, curve);
      updateCurveUI(curve);
    });
  });

  $$('#curvePresets [data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = E.CURVE_PRESETS[btn.dataset.preset];
      if (!preset) return;
      curve.points = preset.map((point) => [point[0], point[1]]);
      if (curve.amount === 0) curve.amount = .7;
      commitCurve(pedalId, curve);
      updateCurveUI(curve);
      redraw();
    });
  });

  const range = $('#curveRange');
  if (range) {
    range.addEventListener('input', () => {
      curve.amount = clamp(Number(range.value) / 100, 0, 1);
      updateCurveUI(curve);
      redraw();
      queueCommit();
    });
  }

  const clear = $('#curveClear');
  if (clear) {
    clear.addEventListener('click', () => {
      curve.points = E.CURVE_PRESETS.ramp.map((point) => [point[0], point[1]]);
      curve.amount = 0;
      E.setCurve(pedalId, null);
      updateCurveUI(curve);
      redraw();
    });
  }

  const done = $('#curveDone');
  if (done) done.addEventListener('click', () => closeSheet());
}

/* ─────────── pad sheet ─────────── */

function openPadSheet(index) {
  const pad = S.pads[index];
  if (!pad) return;
  if (!(pad.end > pad.start)) { toast('Chop the sound to fill this pad.'); return; }
  S.sheet = { kind: 'pad', index };
  const body = $('#sheetBody');
  const levelFormat = (v) => Math.round(v * 100) + '%';
  const keyFormat = (v) => {
    const semi = Math.round(v * 24 - 12);
    return (semi > 0 ? '+' : '') + semi + ' st';
  };
  const stretchFormat = (v) => (.5 + v * 1.5).toFixed(2) + 'x';
  body.innerHTML = `
    <div class="eyebrow">Chop ${index + 1} · ${fmtPrecise(pad.start)} – ${fmtPrecise(pad.end)}</div>
    <div class="sheet-title">Pad ${index + 1}</div>
    <div class="sheet-note">${(pad.end - pad.start).toFixed(2)} s · ${esc(S.source ? S.source.name : 'audio')}</div>
    <div class="wave-card wave-card--chops" id="padWave" style="margin:2px 0 14px"></div>
    <div class="knob-grid knob-grid--3">
      ${knobElHTML({ key: 'level', label: 'Level', value: pad.level, format: levelFormat })}
      ${knobElHTML({ key: 'key', label: 'Key', value: (pad.key + 12) / 24, format: keyFormat })}
      ${knobElHTML({ key: 'stretch', label: 'Stretch', value: (pad.stretch - .5) / 1.5, format: stretchFormat })}
    </div>
    <div class="switch-row">
      <span class="switch-label">Reverse</span>
      <button class="switch${pad.reverse ? ' is-on' : ''}" id="padReverse" role="switch" aria-checked="${!!pad.reverse}" aria-label="Reverse"></button>
    </div>
    <div class="switch-row">
      <span class="switch-label">Favorite</span>
      <button class="switch${pad.favorite ? ' is-on' : ''}" id="padFavorite" role="switch" aria-checked="${!!pad.favorite}" aria-label="Favorite"></button>
    </div>
    <div class="sec-head" style="margin-top:16px"><h3>Mode</h3></div>
    <div class="seg seg--tight" id="padMode">
      <button class="seg-btn${pad.mode === 'trigger' ? ' is-on' : ''}" data-mode="trigger">Trigger</button>
      <button class="seg-btn${pad.mode === 'hold' ? ' is-on' : ''}" data-mode="hold">Hold</button>
    </div>
    <div class="sec-head"><h3>Keyboard</h3><span class="link">semitones</span></div>
    <div class="pad-keys">
      ${[-12, -5, 0, 5, 12].map((semi) => `<button class="key-btn" data-semi="${semi}">${semi > 0 ? '+' : ''}${semi}</button>`).join('')}
    </div>
    <p class="footnote">Trigger fires the chop once. Hold keeps it sounding until you let go. Drag a knob up or down; double-tap resets it.</p>
    <div class="sheet-actions"><button class="btn-primary" id="padDone">Done</button></div>`;
  openSheet();

  const wave = makeWave($('#padWave'), { color: '#EF7329', empty: 'No sound' });
  wave.setSource(S.source, [pad]);
  wave.setPosition(pad.start);

  let levelFrame = 0;
  let levelValue = pad.level;
  $$('.knob', body).forEach((el) => {
    const key = el.dataset.knob;
    if (key === 'level') {
      wireKnob(el, {
        def: pad.level,
        format: levelFormat,
        onInput: (v) => {
          levelValue = v;
          if (levelFrame) return;
          levelFrame = requestAnimationFrame(() => {
            levelFrame = 0;
            E.setPad(index, { level: levelValue });
          });
        },
        onCommit: (v) => E.setPad(index, { level: v }),
      });
    } else if (key === 'key') {
      wireKnob(el, {
        def: (pad.key + 12) / 24,
        format: keyFormat,
        onCommit: (v) => E.setPad(index, { key: Math.round(v * 24 - 12) }),
      });
    } else if (key === 'stretch') {
      wireKnob(el, {
        def: (pad.stretch - .5) / 1.5,
        format: stretchFormat,
        onCommit: (v) => E.setPad(index, { stretch: .5 + v * 1.5 }),
      });
    }
  });

  const reverse = $('#padReverse');
  reverse.addEventListener('click', () => {
    const next = !reverse.classList.contains('is-on');
    reverse.classList.toggle('is-on', next);
    reverse.setAttribute('aria-checked', String(next));
    E.setPad(index, { reverse: next });
  });

  const favorite = $('#padFavorite');
  favorite.addEventListener('click', () => {
    const next = !favorite.classList.contains('is-on');
    favorite.classList.toggle('is-on', next);
    favorite.setAttribute('aria-checked', String(next));
    E.setFavorite(index, next);
  });

  $$('#padMode .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('#padMode .seg-btn').forEach((item) => item.classList.toggle('is-on', item === btn));
      E.setPad(index, { mode: btn.dataset.mode });
    });
  });

  $$('.key-btn', body).forEach((btn) => {
    const semi = Number(btn.dataset.semi) || 0;
    btn.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      E.keyboard(index, semi);
      btn.classList.add('is-on');
    });
    const up = () => btn.classList.remove('is-on');
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  });

  $('#padDone').addEventListener('click', () => closeSheet(true));
}

/* ─────────── bake & export ─────────── */

function openBakeSheet() {
  if (!S.source) { toast('Load a sound first.'); openLoadSheet(); return; }
  S.sheet = { kind: 'bake' };
  S.bake = {
    what: 'region',
    tail: true,
    name: S.source.name + ' Bake',
    result: null,
    elapsed: 0,
  };
  renderBakeSheet();
  openSheet();
}

function renderBakeSheet() {
  const bake = S.bake;
  if (!bake) return;
  const body = $('#sheetBody');
  const result = bake.result;
  const filled = S.pads.filter((pad) => pad.end > pad.start).length;
  body.innerHTML = `
    <div class="sheet-head">
      <div>
        <div class="sheet-title">Bake &amp; export</div>
        <div class="sheet-note">Print the chain to audio.</div>
      </div>
      <button class="sheet-close" data-close-sheet aria-label="Close">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="seg" id="bakeWhat">
      <button class="seg-btn${bake.what === 'region' ? ' is-on' : ''}" data-what="region">Region</button>
      <button class="seg-btn${bake.what === 'pads' ? ' is-on' : ''}" data-what="pads">Pads</button>
    </div>
    <div class="bake-wave" id="bakeWave"></div>
    <p class="bake-note">${bake.what === 'pads'
      ? filled + ' pads in order. Empty pads are skipped.'
      : 'The loop region, or the whole sound when no loop is set.'}</p>
    <div class="field">
      <label for="bakeName">Name</label>
      <input id="bakeName" type="text" value="${esc(bake.name)}" />
    </div>
    <div class="field">
      <label>Format</label>
      <span class="v">WAV · 24-bit</span>
    </div>
    <div class="switch-row">
      <span class="switch-label">Keep the tail</span>
      <button class="switch${bake.tail ? ' is-on' : ''}" id="bakeTail" role="switch" aria-checked="${bake.tail}" aria-label="Keep the tail"></button>
    </div>
    <div class="field">
      <label>Chain</label>
      <span class="chain-dots">${S.chain.length
        ? S.chain.map((pedal) => `<span class="chain-dot" style="background:${PEDAL_STYLE[pedal.type].a}" title="${esc(pedalName(pedal.type))}"></span>`).join('')
        : '<span class="v">dry</span>'}</span>
    </div>
    ${result
      ? `<div class="bake-done"><span class="dot"></span> Baked in ${bake.elapsed.toFixed(1)} s · ${fmtTime(result.duration)}</div>
         <div class="pair" style="margin-top:14px">
           <button class="btn-ghost" id="bakeDownload">Download</button>
           <button class="btn-primary" id="bakeSave">Save to shelf</button>
         </div>
         <button class="btn-ghost" id="bakeAgain" style="margin-top:9px">Bake again</button>`
      : `<div class="bake-progress" id="bakeProgress" hidden><i id="bakeProgressBar"></i></div>
         <div class="sheet-actions"><button class="btn-primary" id="bakeRun">Bake</button></div>`}`;
  openSheet();

  const wave = makeWave($('#bakeWave'), { color: '#5B4BC4', empty: 'No sound' });
  wave.setSource(S.source, bake.what === 'pads' ? S.pads : null);
  if (bake.what === 'region') wave.setLoop(E.getLoop());
  wave.setPosition(E.position());

  $$('#bakeWhat .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.what === bake.what) return;
      bake.what = btn.dataset.what;
      bake.result = null;
      bake.elapsed = 0;
      renderBakeSheet();
    });
  });

  const name = $('#bakeName');
  name.addEventListener('input', () => {
    bake.name = name.value;
    if (bake.result) nameBake(bake.result.id, bake.name);
  });

  const tail = $('#bakeTail');
  tail.addEventListener('click', () => {
    bake.tail = !bake.tail;
    tail.classList.toggle('is-on', bake.tail);
    tail.setAttribute('aria-checked', String(bake.tail));
    bake.result = null;
    bake.elapsed = 0;
  });

  const run = $('#bakeRun');
  if (run) run.addEventListener('click', runBake);
  const again = $('#bakeAgain');
  if (again) again.addEventListener('click', () => {
    bake.result = null;
    bake.elapsed = 0;
    renderBakeSheet();
  });
  const download = $('#bakeDownload');
  if (download) download.addEventListener('click', () => {
    if (bake.result) downloadBakeFlow(bake.result.id, bake.name);
  });
  const save = $('#bakeSave');
  if (save) save.addEventListener('click', saveBakeFlow);
}

async function runBake() {
  const bake = S.bake;
  if (!bake || S.baking) return;
  if (bake.what === 'pads' && !S.pads.some((pad) => pad.end > pad.start)) {
    toast('Chop the sound first.');
    return;
  }
  S.baking = true;
  const started = performance.now();
  const btn = $('#bakeRun');
  if (btn) { btn.disabled = true; btn.textContent = 'Baking…'; }
  const progress = $('#bakeProgress');
  if (progress) progress.hidden = false;
  try {
    const result = await E.bake({ what: bake.what, tail: bake.tail });
    S.baking = false;
    bake.result = result;
    bake.elapsed = (performance.now() - started) / 1000;
    bakePeaks.set(result.id, shrinkPeaks(result.peaks));
    nameBake(result.id, bake.name);
    await loadShelf();
    if (S.sheet.kind === 'bake') renderBakeSheet();
    toast('Baked ' + fmtTime(result.duration));
  } catch (err) {
    S.baking = false;
    toast(err && err.message ? err.message : 'Bake failed.', 4000);
    if (S.sheet.kind === 'bake') renderBakeSheet();
  }
}

async function downloadBakeFlow(id, name) {
  try {
    const blob = await E.exportWav(id);
    downloadBlob(blob, safeName(name) + '.wav');
    toast('WAV exported');
  } catch (err) {
    toast(err && err.message ? err.message : 'Could not export that bake.');
  }
}

async function saveBakeFlow() {
  const bake = S.bake;
  if (!bake) return;
  const name = (bake.name || '').trim() || 'Untitled';
  if (bake.result) nameBake(bake.result.id, name);
  const project = S.projectName || name;
  try {
    await E.saveProject({ name: project });
    S.projectName = project;
    await loadShelf();
    closeSheet(true);
    go('shelf');
    toast('Saved to shelf');
  } catch (err) {
    toast(err && err.message ? err.message : 'Could not save that project.');
  }
}

/* ─────────── project sheet ─────────── */

function openProjectSheet() {
  S.sheet = { kind: 'project' };
  const body = $('#sheetBody');
  body.innerHTML = `
    <div class="sheet-head">
      <div>
        <div class="sheet-title">Project</div>
        <div class="sheet-note">Keeps the chain, pads and loop.</div>
      </div>
      <button class="sheet-close" data-close-sheet aria-label="Close">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="field">
      <label for="projName">Name</label>
      <input id="projName" type="text" value="${esc(S.projectName || (S.source ? S.source.name : 'Untitled'))}" />
    </div>
    <div class="field">
      <label>Chain</label>
      <span class="chain-dots">${S.chain.length
        ? S.chain.map((pedal) => `<span class="chain-dot" style="background:${PEDAL_STYLE[pedal.type].a}" title="${esc(pedalName(pedal.type))}"></span>`).join('')
        : '<span class="v">dry</span>'}</span>
    </div>
    <div class="sheet-actions"><button class="btn-primary" id="projSave">Save project</button></div>
    <div class="sec-head" style="margin-top:22px"><h3>Saved</h3><button class="link" id="projRefresh">Refresh</button></div>
    <div id="projList"><p class="sheet-note">Looking…</p></div>`;
  openSheet();

  const box = $('#projList');
  box.addEventListener('click', async (event) => {
    const load = event.target.closest('[data-proj-load]');
    if (load) { await loadProjectFlow(load.dataset.projLoad); return; }
    const del = event.target.closest('[data-proj-del]');
    if (!del) return;
    if (del.dataset.confirm !== '1') {
      del.dataset.confirm = '1';
      del.textContent = 'Sure?';
      setTimeout(() => {
        if (del.isConnected && del.dataset.confirm === '1') {
          del.dataset.confirm = '0';
          del.textContent = 'Delete';
        }
      }, 2600);
      return;
    }
    try {
      await E.deleteProject(del.dataset.projDel);
      toast('Project deleted');
      await loadShelf();
      refreshProjects();
    } catch (err) {
      toast(err && err.message ? err.message : 'Could not delete that project.');
    }
  });

  $('#projSave').addEventListener('click', async () => {
    const input = $('#projName');
    const name = (input.value || '').trim() || 'Untitled';
    try {
      const id = await E.saveProject({ name });
      S.projectId = id;
      S.projectName = name;
      toast('Project saved');
      await loadShelf();
      refreshProjects();
    } catch (err) {
      toast(err && err.message ? err.message : 'Could not save that project.');
    }
  });

  $('#projRefresh').addEventListener('click', refreshProjects);
  refreshProjects();
}

async function refreshProjects() {
  const box = $('#projList');
  if (!box) return;
  try {
    const projects = await E.listProjects();
    if (!box.isConnected) return;
    if (!projects.length) {
      box.innerHTML = '<p class="sheet-note">No projects yet. Bake something and save it to the shelf.</p>';
      return;
    }
    box.innerHTML = projects.map((proj) => `
      <div class="proj-row">
        <div class="proj-copy">
          <div class="proj-name">${esc(proj.name)}</div>
          <div class="proj-meta">${proj.bakeCount} ${proj.bakeCount === 1 ? 'bake' : 'bakes'} · ${fmtDate(proj.updated)}</div>
        </div>
        <button class="proj-btn" data-proj-load="${esc(proj.id)}">Load</button>
        <button class="proj-btn" data-proj-del="${esc(proj.id)}" data-confirm="0">Delete</button>
      </div>`).join('');
  } catch (err) {
    if (box.isConnected) box.innerHTML = '<p class="sheet-note">Could not read saved projects.</p>';
  }
}

/* ─────────── bake detail ─────────── */

function openBakeDetailSheet(id) {
  const item = S.shelf.find((row) => row.kind === 'bake' && row.id === id);
  if (!item) return;
  S.sheet = { kind: 'bakeDetail', id };
  const body = $('#sheetBody');
  body.innerHTML = `
    <div class="sheet-head">
      <div>
        <div class="eyebrow">Bake</div>
        <div class="sheet-title">${esc(item.name)}</div>
        <div class="sheet-note">${fmtTime(item.duration)} · ${fmtDate(item.date) || 'Baked'}</div>
      </div>
      <button class="sheet-close" data-close-sheet aria-label="Close">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="bake-wave" id="bakeDetailWave" style="margin-top:6px"></div>
    <div class="sheet-list">
      <div class="sheet-li"><span class="k">Duration</span><span class="v">${fmtTime(item.duration)}</span></div>
      <div class="sheet-li"><span class="k">Format</span><span class="v">WAV · 24-bit</span></div>
      <div class="sheet-li"><span class="k">Baked</span><span class="v">${fmtDate(item.date) || '—'}</span></div>
    </div>
    <div class="sheet-actions">
      <button class="btn-primary" id="detailOpen">Open in board</button>
      <button class="btn-ghost" id="detailDownload">Download WAV</button>
      <button class="btn-ghost" id="detailDelete" data-confirm="0">Delete bake</button>
    </div>`;
  openSheet();

  const wave = makeWave($('#bakeDetailWave'), { color: '#5B4BC4', empty: 'No sound' });
  wave.setSource({ peaks: item.peaks || seededPeaks(id), duration: item.duration }, null);

  $('#detailOpen').addEventListener('click', async () => {
    try {
      const source = await E.loadBake(id);
      S.projectName = item.name;
      closeSheet(true);
      await afterSource(source, { autoChop: true });
    } catch (err) {
      toast(err && err.message ? err.message : 'Could not open that bake.');
    }
  });

  $('#detailDownload').addEventListener('click', () => downloadBakeFlow(id, item.name));

  const del = $('#detailDelete');
  del.addEventListener('click', async () => {
    if (del.dataset.confirm !== '1') {
      del.dataset.confirm = '1';
      del.textContent = 'Tap again to delete';
      setTimeout(() => {
        if (del.isConnected && del.dataset.confirm === '1') {
          del.dataset.confirm = '0';
          del.textContent = 'Delete bake';
        }
      }, 2600);
      return;
    }
    try {
      await E.deleteBake(id);
      toast('Bake deleted');
      await loadShelf();
      closeSheet(true);
    } catch (err) {
      toast(err && err.message ? err.message : 'Could not delete that bake.');
    }
  });
}

/* ─────────── transport + pads input ─────────── */

/* Audio can be suspended or interrupted (calls, other apps, a locked phone). */
function wake() {
  if (!S.started || E.state === 'running') return Promise.resolve();
  return E.resume().catch(() => { /* the resume pill stays up */ });
}

async function togglePlay() {
  if (!S.source) { openLoadSheet(); return; }
  try {
    await wake();
    if (E.isPlaying()) E.stop();
    else await E.play();
    syncPlayButton();
    updateTransportTime(E.position());
  } catch (err) {
    toast(err && err.message ? err.message : 'Could not play that sound.');
  }
}

let padPress = null;
let padTimer = 0;

function wirePadInput() {
  document.addEventListener('pointerdown', (event) => {
    const el = event.target.closest('.pad');
    if (!el || !el.closest('#padGrid, #boardPadGrid')) return;
    if (event.button) return;
    const index = Number(el.dataset.pad);
    if (Number.isNaN(index)) return;
    if (S.padEdit) { event.preventDefault(); openPadSheet(index); return; }
    padPress = { el, index, x: event.clientX, y: event.clientY };
    el.classList.add('is-on');
    wake();
    E.trigger(index);
    clearTimeout(padTimer);
    padTimer = setTimeout(() => {
      padTimer = 0;
      if (padPress) openPadSheet(index);
    }, 520);
  });

  document.addEventListener('pointermove', (event) => {
    if (!padPress) return;
    if (Math.abs(event.clientX - padPress.x) + Math.abs(event.clientY - padPress.y) > 12) {
      clearTimeout(padTimer);
      padTimer = 0;
    }
  });

  const end = () => {
    if (!padPress) return;
    const held = padPress;
    padPress = null;
    clearTimeout(padTimer);
    padTimer = 0;
    held.el.classList.remove('is-on');
    E.release(held.index);
  };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
  window.addEventListener('blur', end);
}

/* ─────────── static wiring ─────────── */

function wireStatic() {
  const on = (sel, event, fn) => {
    const el = $(sel);
    if (el) el.addEventListener(event, fn);
  };

  on('#bootStart', 'click', boot);
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => go(tab.dataset.go)));
  $$('[data-back]').forEach((btn) => btn.addEventListener('click', () => go(S.returnView || 'shelf')));
  on('#playBtn', 'click', togglePlay);
  on('#bakeBtn', 'click', openBakeSheet);
  on('#boardMenu', 'click', openProjectSheet);
  on('#shelfAdd', 'click', openLoadSheet);
  on('#emptyAdd', 'click', openLoadSheet);
  on('#chainAdd', 'click', openPedalPicker);
  on('#chainEmptyAdd', 'click', openPedalPicker);
  on('#padsChop', 'click', () => doChop('find'));
  on('#padsEdit', 'click', () => {
    S.padEdit = !S.padEdit;
    const btn = $('#padsEdit');
    btn.classList.toggle('icon-btn--dark', S.padEdit);
    btn.setAttribute('aria-pressed', String(S.padEdit));
    const note = $('#padsNote');
    if (note) {
      note.textContent = S.padEdit
        ? 'Edit is on: tap a pad to change it. Tap the pencil again to play.'
        : 'Tap to play. Hold a pad, press E, or turn on the pencil to edit it. Gold star = favorite.';
    }
  });
  on('#resumeBtn', 'click', () => {
    wake().then(() => { if (E.state === 'running') toast('Sound is back', 1200); });
  });

  on('#shelfFilters', 'click', (event) => {
    const chip = event.target.closest('.fchip');
    if (!chip) return;
    S.shelfFilter = chip.dataset.filter;
    $$('.fchip').forEach((item) => item.classList.toggle('is-on', item === chip));
    renderShelf();
  });

  on('#boardSeg', 'click', (event) => {
    const btn = event.target.closest('.seg-btn');
    if (!btn) return;
    S.seg = btn.dataset.seg;
    $$('#boardSeg .seg-btn').forEach((item) => item.classList.toggle('is-on', item === btn));
    const chainPane = $('#boardChain');
    const padsPane = $('#boardPads');
    if (chainPane) chainPane.hidden = S.seg !== 'chain';
    if (padsPane) padsPane.hidden = S.seg !== 'pads';
    if (S.seg === 'pads') renderBoardPads();
  });

  on('#chopTools', 'click', (event) => {
    const btn = event.target.closest('[data-chop]');
    if (!btn) return;
    if (btn.dataset.chop === 'tap') tapTempo();
    else doChop(btn.dataset.chop);
  });

  on('#fileInput', 'change', (event) => {
    const input = event.target;
    const file = input.files && input.files[0];
    input.value = '';
    if (file) loadFileFlow(file);
  });

  on('#shelfGrid', 'click', (event) => {
    const card = event.target.closest('.card');
    if (!card) return;
    if (card.dataset.kind === 'bake') openBakeDetailSheet(card.dataset.id);
    else if (card.dataset.kind === 'chop') loadSourceFlow(card.dataset.id);
    else if (card.dataset.kind === 'chain') loadProjectFlow(card.dataset.id);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-sheet]')) { closeSheet(); return; }
    const pedal = event.target.closest('[data-pedal]');
    if (pedal && performance.now() - (S.dragEndAt || 0) < 400) return;
    if (pedal) { openPedalSheet(pedal.dataset.pedal); return; }
    if (event.target.closest('[data-add-pedal]')) { openPedalPicker(); return; }
    const source = event.target.closest('[data-source]');
    if (source) loadSourceFlow(source.dataset.source);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const layer = $('#sheetLayer');
      if (layer && !layer.hidden) closeSheet();
      return;
    }
    const target = event.target;
    if (!target || !target.classList || !target.classList.contains('pad')) return;
    const index = Number(target.dataset.pad);
    if (Number.isNaN(index)) return;
    if (event.key === 'e' || event.key === 'E' || (S.padEdit && event.key === 'Enter')) {
      event.preventDefault();
      openPadSheet(index);
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    wake();
    E.trigger(index);
    target.classList.add('is-on');
    setTimeout(() => {
      E.release(index);
      target.classList.remove('is-on');
    }, 260);
  });

  window.addEventListener('resize', () => {
    for (let i = 0; i < WAVES.length; i++) WAVES[i].draw();
  });
}

/* ─────────── engine events ─────────── */

function wireEngine() {
  let chainDirty = false;
  E.on('chain', (chain) => {
    S.chain = chain;
    if (S.dragging) return;
    /* under the pedal sheet, only order and bypass changes repaint (not every knob move) */
    if (S.sheet.kind === 'pedal' && chainShape(chain) === S.railShape) return;
    if (chainDirty) return;
    chainDirty = true;
    requestAnimationFrame(() => {
      chainDirty = false;
      renderChainRail();
      renderChainList();
    });
  });

  let padsDirty = false;
  E.on('pads', (pads) => {
    S.pads = pads;
    if (S.sheet.kind === 'pad') return;
    if (padsDirty) return;
    padsDirty = true;
    requestAnimationFrame(() => {
      padsDirty = false;
      renderPadGrid();
      renderPadsWaveChops();
    });
  });

  E.on('state', (state) => {
    const btn = $('#resumeBtn');
    if (btn) btn.hidden = !S.started || state === 'running' || state === 'idle';
  });

  E.on('error', (err) => {
    if (err && err.message) toast(err.message);
  });

  E.on('progress', (value) => {
    if (S.sheet.kind !== 'bake') return;
    const bar = $('#bakeProgressBar');
    if (bar) bar.style.width = Math.round(clamp(Number(value) || 0, 0, 1) * 100) + '%';
  });
}

/* ─────────── tick ─────────── */

let tickFrame = 0;

function tick() {
  tickFrame += 1;
  syncPlayButton();
  if (S.source) {
    const pos = E.position();
    if (Math.abs(pos - S.lastPos) > .004) {
      S.lastPos = pos;
      if (S.boardWave) S.boardWave.setPosition(pos);
      if (S.padsWave) S.padsWave.setPosition(pos);
      updateTransportTime(pos);
    }
  }
  if (S.sheet.kind === 'pedal' && S.curve && S.curveCanvas && !S.curveDragging && tickFrame % 2 === 0) {
    drawCurveCanvas(S.curveCanvas, S.curve, E.curvePhase(S.sheet.id));
  }
  requestAnimationFrame(tick);
}

/* ─────────── init ─────────── */

function init() {
  document.body.classList.add('is-booting');
  const bootPedal = $('#bootPedal');
  if (bootPedal) bootPedal.innerHTML = pedalSVG('prism', { name: 'Prism' });

  S.boardWave = makeWave($('#boardWave'), { color: '#2B2A66', empty: 'Load a sound to see its shape' });
  S.padsWave = makeWave($('#padsWave'), { color: '#EF7329', empty: 'Chop a sound to fill the pads' });

  S.chain = E.getChain();
  S.pads = E.getPads();
  restoreBakeMeta();

  wireStatic();
  wirePadInput();
  wireReorder($('#chainList'), { item: '.chain-row', handle: '.chain-grip', axis: 'y' });
  wireReorder($('#boardChain'), { item: '.pedal', axis: 'x' });
  wireEngine();

  renderShelf();
  renderChainList();
  renderPadGrid();
  clock();
  setInterval(clock, 15000);
  requestAnimationFrame(tick);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => { /* offline shell is optional */ });
    });
  }
}

init();
