import { mulberry32, hashString } from './rng.js';

const LENGTHS = { room: 0.45, dark: 1.05, hall: 1.75, huge: 3.1 };
const DECAY = { room: 5.5, dark: 2.6, hall: 1.8, huge: 1.15 };

const cache = new Map();

/**
 * Shaped decaying noise. Dark is low-passed. predelaySec is silence at the front
 * so a send can be nulled against the dry region before the wash returns.
 */
export function makeImpulse(ctx, kind, lite, predelaySec) {
  const sr = ctx.sampleRate;
  const pre = Math.max(0, predelaySec || 0);
  const key = kind + '|' + (lite ? 1 : 0) + '|' + sr + '|' + pre;
  let data = cache.get(key);
  if (!data) {
    const seconds = (LENGTHS[kind] || 1) * (lite ? 0.5 : 1);
    const decay = DECAY[kind] || 2;
    const preN = Math.floor(pre * sr);
    const body = Math.max(8, Math.floor(seconds * sr));
    const n = preN + body;
    const left = new Float32Array(n);
    const right = new Float32Array(n);
    const rand = mulberry32(hashString(kind + (lite ? ':lite' : ':full')) || 1);
    const dark = kind === 'dark';
    let zL = 0;
    let zR = 0;
    const pole = Math.exp((-2 * Math.PI * 900) / sr);
    for (let i = 0; i < body; i++) {
      const t = i / body;
      const env = Math.pow(1 - t, decay) * Math.exp(-2.2 * t);
      const fade = i < 64 ? i / 64 : 1;
      let l = (rand() * 2 - 1) * env * fade;
      let r = (rand() * 2 - 1) * env * fade;
      if (dark) {
        zL = l + pole * (zL - l);
        zR = r + pole * (zR - r);
        l = zL;
        r = zR;
      }
      left[preN + i] = l;
      right[preN + i] = r;
    }
    let peak = 1e-8;
    for (let i = 0; i < n; i++) {
      const a = Math.abs(left[i]);
      const b = Math.abs(right[i]);
      if (a > peak) peak = a;
      if (b > peak) peak = b;
    }
    const g = 0.55 / peak;
    for (let i = 0; i < n; i++) {
      left[i] *= g;
      right[i] *= g;
    }
    data = { left, right };
    cache.set(key, data);
  }
  const buffer = ctx.createBuffer(2, data.left.length, sr);
  buffer.copyToChannel(data.left, 0);
  buffer.copyToChannel(data.right, 1);
  return buffer;
}
