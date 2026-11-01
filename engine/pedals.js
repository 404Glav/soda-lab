/** Pedal definitions, knob display, and tempo math. Values in the engine are always 0..1. */

export const TIME_LABELS = ['free', '1/32', '1/16', '1/8', '1/4', '1/2', '1 bar'];
const TIME_BEATS = [0, 0.125, 0.25, 0.5, 1, 2, 4];

export const PITCH_LABELS = ['up', 'down', 'octave', 'wide'];
export const PITCH_SETS = [
  [1, 2],
  [1, 0.5],
  [2],
  [0.25, 0.5, 1, 2, 4],
];

const SIZE_LABELS = ['room', 'dark', 'hall', 'huge'];
const MODE_LABELS = ['drive', 'fuzz'];
const FILTER_LABELS = ['lowpass', 'highpass', 'bandpass'];
const RATE_LABELS = ['1/16', '1/8', '1/4', '1/2', '1 bar'];
const ONOFF = ['off', 'on'];

function knob(key, label, min, max, def, unit, extra) {
  return Object.assign({ key, label, min, max, default: def, unit }, extra || {});
}

export const PEDAL_DEFS = {
  prism: {
    name: 'Prism',
    knobs: [
      knob('density', 'Density', 1, 40, 0.28, '/s'),
      knob('time', 'Time', 0, 1, 0.5, '', { steps: TIME_LABELS.length, labels: TIME_LABELS }),
      knob('free', 'Free', 20, 400, 0.26, 'ms'),
      knob('repeats', 'Repeats', 0, 95, 0.45, '%'),
      knob('shape', 'Shape', 0, 100, 0.35, '%'),
      knob('pitch', 'Pitch', 0, 3, 1, '', { steps: PITCH_LABELS.length, labels: PITCH_LABELS }),
      knob('wobble', 'Wobble', 0, 100, 0.15, '%'),
      knob('space', 'Space', 0, 100, 0, '%'),
      knob('tone', 'Tone', 200, 20000, 1, 'Hz', { log: true }),
      knob('mix', 'Mix', 0, 100, 0.5, '%'),
      knob('reverse', 'Reverse', 0, 1, 0, '', { steps: 2, labels: ONOFF }),
      knob('freeze', 'Freeze', 0, 1, 0, '', { steps: 2, labels: ONOFF }),
    ],
  },
  reel: {
    name: 'Reel',
    knobs: [
      knob('time', 'Time', 0, 1, 0.5, '', { steps: TIME_LABELS.length, labels: TIME_LABELS }),
      knob('free', 'Free', 40, 800, 0.3, 'ms'),
      knob('feedback', 'Feedback', 0, 95, 0.35, '%'),
      knob('wow', 'Wow', 0, 100, 0.25, '%'),
      knob('flutter', 'Flutter', 0, 100, 0.2, '%'),
      knob('age', 'Age', 0, 100, 0.35, '%'),
      knob('mix', 'Mix', 0, 100, 0.45, '%'),
    ],
  },
  cathedral: {
    name: 'Cathedral',
    knobs: [
      knob('size', 'Size', 0, 3, 0.67, '', { steps: SIZE_LABELS.length, labels: SIZE_LABELS }),
      knob('predelay', 'Pre-delay', 0, 200, 0.12, 'ms'),
      knob('damping', 'Damping', 0, 100, 0.4, '%'),
      knob('mix', 'Mix', 0, 100, 0.35, '%'),
    ],
  },
  fizz: {
    name: 'Fizz',
    knobs: [
      knob('gain', 'Gain', 0, 100, 0.35, '%'),
      knob('tone', 'Tone', 400, 14000, 0.7, 'Hz', { log: true }),
      knob('mode', 'Mode', 0, 1, 0, '', { steps: 2, labels: MODE_LABELS }),
      knob('level', 'Level', 0, 100, 0.7, '%'),
      knob('mix', 'Mix', 0, 100, 0.5, '%'),
    ],
  },
  crusher: {
    name: 'Crusher',
    knobs: [
      knob('bits', 'Bits', 1, 16, 7 / 15, 'bit', { steps: 16 }),
      knob('downsample', 'Downsample', 1, 32, 0.12, 'x'),
      knob('mix', 'Mix', 0, 100, 0.6, '%'),
    ],
  },
  sweep: {
    name: 'Sweep',
    knobs: [
      knob('type', 'Type', 0, 2, 0, '', { steps: FILTER_LABELS.length, labels: FILTER_LABELS }),
      knob('cutoff', 'Cutoff', 40, 18000, 0.55, 'Hz', { log: true }),
      knob('resonance', 'Resonance', 0.2, 16, 0.15, 'Q'),
      knob('curve', 'Curve', 0, 100, 1, '%'),
      knob('envelope', 'Envelope', 0, 100, 0.35, '%'),
      knob('rate', 'Rate', 0, 1, 0.5, '', { steps: RATE_LABELS.length, labels: RATE_LABELS }),
      knob('mix', 'Mix', 0, 100, 0.7, '%'),
    ],
  },
};

export const CURVE_PRESETS = {
  ramp: [[0, 0], [1, 1]],
  saw: [[0, 0], [0.98, 1], [1, 0]],
  square: [[0, 0], [0.48, 0], [0.5, 1], [1, 1]],
  triangle: [[0, 0], [0.5, 1], [1, 0]],
  pump: [[0, 1], [0.12, 0.15], [0.7, 0.2], [1, 1]],
};

const BARS = [0.25, 0.5, 1, 2, 4];

export function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function stepIndex(v, steps) {
  const n = Math.max(1, steps | 0);
  const i = Math.round(clamp01(v) * (n - 1));
  return i < 0 ? 0 : i > n - 1 ? n - 1 : i;
}

export function logMap(v, min, max) {
  const a = Math.log(min);
  const b = Math.log(max);
  return Math.exp(a + clamp01(v) * (b - a));
}

export function linMap(v, min, max) {
  return min + clamp01(v) * (max - min);
}

export function knobDef(type, key) {
  const def = PEDAL_DEFS[type];
  if (!def) return null;
  for (let i = 0; i < def.knobs.length; i++) {
    if (def.knobs[i].key === key) return def.knobs[i];
  }
  return null;
}

export function defaultKnobs(type) {
  const out = {};
  const def = PEDAL_DEFS[type];
  if (!def) return out;
  for (let i = 0; i < def.knobs.length; i++) out[def.knobs[i].key] = def.knobs[i].default;
  return out;
}

function mappedNumber(def, v) {
  if (def.log) return logMap(v, def.min, def.max);
  if (def.steps && !def.labels) {
    const i = stepIndex(v, def.steps);
    return def.min + (i / (def.steps - 1)) * (def.max - def.min);
  }
  return linMap(v, def.min, def.max);
}

export function formatKnob(type, key, v01) {
  const def = knobDef(type, key);
  if (!def) return '';
  const v = clamp01(v01);
  if (def.labels && def.steps) return def.labels[stepIndex(v, def.steps)];
  const n = mappedNumber(def, v);
  if (def.unit === '%') return Math.round(n) + '%';
  if (def.unit === 'Hz') {
    if (n >= 1000) {
      const k = n / 1000;
      return (k >= 10 ? k.toFixed(1) : k.toFixed(2)) + ' kHz';
    }
    return Math.round(n) + ' Hz';
  }
  if (def.unit === 'ms') return Math.round(n) + ' ms';
  if (def.unit === 'st') {
    const s = Math.round(n);
    return (s > 0 ? '+' : '') + s + ' st';
  }
  if (def.unit === '/s') return n.toFixed(1) + '/s';
  if (def.unit === 'bit') return Math.round(n) + ' bit';
  if (def.unit === 'x') return Math.round(n) + 'x';
  if (def.unit === 'Q') return n.toFixed(1) + ' Q';
  if (def.unit === 'dB') return n.toFixed(1) + ' dB';
  return String(Math.round(n * 100) / 100);
}

export function snapBars(bars) {
  const n = Number(bars);
  let best = BARS[2];
  let bestD = Infinity;
  for (let i = 0; i < BARS.length; i++) {
    const d = Math.abs(BARS[i] - n);
    if (d < bestD) {
      bestD = d;
      best = BARS[i];
    }
  }
  return best;
}

export function evalCurve(points, x) {
  if (!points || !points.length) return 0;
  const x0 = x < 0 ? 0 : x > 1 ? 1 : x;
  if (x0 <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (x0 >= last[0]) return last[1];
  for (let i = 1; i < points.length; i++) {
    const b = points[i];
    const a = points[i - 1];
    if (x0 <= b[0]) {
      const span = b[0] - a[0] || 1;
      const t = (x0 - a[0]) / span;
      return a[1] + t * (b[1] - a[1]);
    }
  }
  return last[1];
}

/**
 * Curve amount is -1..1 and swings around the current knob.
 * amount 0 leaves the knob where it is.
 * value = clamp(knob + amount * (curveY - 0.5) * 2, 0, 1)
 */
export function modulate(base, curve, phase) {
  const y = evalCurve(curve.points, phase);
  const amount = Math.max(-1, Math.min(1, Number(curve.amount) || 0));
  return clamp01((Number(base) || 0) + amount * (y - 0.5) * 2);
}

export function cycleSeconds(bars, bpm) {
  const tempo = Math.max(20, Math.min(300, Number(bpm) || 120));
  return snapBars(bars) * 4 * (60 / tempo);
}

export function timeSeconds(timeV, freeV, bpm, freeMin, freeMax) {
  const i = stepIndex(timeV, TIME_LABELS.length);
  if (i === 0) return linMap(freeV, freeMin, freeMax) / 1000;
  const tempo = Math.max(20, Math.min(300, Number(bpm) || 120));
  return TIME_BEATS[i] * (60 / tempo);
}

/** Silence hold for bake tails: longest delay or grain spacing, plus 50 ms, at least 100 ms. */
export function tailHoldSeconds(chain, bpm) {
  let hold = 0.1;
  const list = chain || [];
  for (let i = 0; i < list.length; i++) {
    const pedal = list[i];
    if (!pedal || pedal.bypass) continue;
    const k = pedal.knobs || {};
    if (pedal.type === 'reel') {
      const sec = Math.min(1.6, Math.max(0.02, timeSeconds(k.time, k.free, bpm, 40, 800)));
      hold = Math.max(hold, sec + 0.05);
    } else if (pedal.type === 'prism') {
      const sec = Math.min(0.75, Math.max(0.012, timeSeconds(k.time, k.free, bpm, 20, 400)));
      hold = Math.max(hold, sec + 0.05);
    } else if (pedal.type === 'cathedral') {
      hold = Math.max(hold, linMap(k.predelay, 0, 0.2) + 0.05);
    }
  }
  return Math.min(Math.max(0.1, hold), 9.5);
}

export function eqPower(mix) {
  const m = clamp01(mix);
  return [Math.cos(m * Math.PI * 0.5), Math.sin(m * Math.PI * 0.5)];
}

export const SIZE_NAMES = SIZE_LABELS;
export const FILTER_TYPES = FILTER_LABELS;
export const FIZZ_MODES = MODE_LABELS;
export const RATE_SECONDS = [0.02, 0.05, 0.1, 0.22, 0.45];
