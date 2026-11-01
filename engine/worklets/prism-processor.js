/* Prism: 4s ring buffer, Hann grains, seeded pitch sets, feedback cap 0.95. */
const PITCH_SETS = [
  [1, 2],
  [1, 0.5],
  [2],
  [0.25, 0.5, 1, 2, 4],
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readRing(buf, pos) {
  const len = buf.length;
  let x = pos % len;
  if (x < 0) x += len;
  const i0 = x | 0;
  const frac = x - i0;
  const i1 = i0 + 1 === len ? 0 : i0 + 1;
  return buf[i0] * (1 - frac) + buf[i1] * frac;
}

function grainWindow(phase, shape) {
  let p = phase;
  if (shape < 0.5) p = Math.pow(phase, 0.35 + shape);
  else p = Math.pow(phase, 1 + (shape - 0.5) * 2.4);
  if (p < 0) p = 0;
  else if (p > 1) p = 1;
  return 0.5 * (1 - Math.cos(Math.PI * 2 * p));
}

class PrismProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'density', defaultValue: 8, minValue: 0.2, maxValue: 80, automationRate: 'k-rate' },
      { name: 'grainSec', defaultValue: 0.12, minValue: 0.008, maxValue: 0.8, automationRate: 'k-rate' },
      { name: 'feedback', defaultValue: 0.35, minValue: 0, maxValue: 0.95, automationRate: 'k-rate' },
      { name: 'shape', defaultValue: 0.35, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'pitchMode', defaultValue: 0, minValue: 0, maxValue: 3, automationRate: 'k-rate' },
      { name: 'reverse', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'freeze', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'reset', defaultValue: 0, minValue: 0, maxValue: 1e7, automationRate: 'k-rate' },
      { name: 'wobbleIn', defaultValue: 0, minValue: -2, maxValue: 2, automationRate: 'a-rate' },
      { name: 'voiceCap', defaultValue: 16, minValue: 1, maxValue: 16, automationRate: 'k-rate' },
    ];
  }

  constructor(options) {
    super();
    const seconds = 4;
    this.length = Math.floor(sampleRate * seconds);
    this.bufL = new Float32Array(this.length);
    this.bufR = new Float32Array(this.length);
    this.write = 0;
    this.prevL = 0;
    this.prevR = 0;
    this.fbScale = 0;
    this.voices = [];
    for (let i = 0; i < 16; i++) {
      this.voices.push({ on: false, pos: 0, step: 1, age: 0, life: 1 });
    }
    this.seed = (options.processorOptions && options.processorOptions.seed) || 1;
    this.rand = mulberry32(this.seed);
    this.bag = [];
    this.wait = 1;
    this.lastReset = -1;
    this.spawns = 0;
    this.sampleCount = 0;
    this.lastReport = 0;
    const zeros = new Float32Array(2048);
    this.zeros = zeros;
    this.port.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === 'seed') {
        this.seed = data.seed >>> 0;
        this.port.postMessage({ type: 'seeded' });
      } else if (data.type === 'stats') {
        this.port.postMessage({ type: 'stats', spawns: this.spawns, samples: this.sampleCount });
      }
    };
  }

  applyReset() {
    this.bufL.fill(0);
    this.bufR.fill(0);
    this.write = 0;
    this.prevL = 0;
    this.prevR = 0;
    this.wait = 1;
    this.spawns = 0;
    this.fbScale = 0;
    this.bag.length = 0;
    this.rand = mulberry32(this.seed >>> 0);
    for (let i = 0; i < this.voices.length; i++) this.voices[i].on = false;
  }

  takeRatio(mode) {
    const set = PITCH_SETS[mode] || PITCH_SETS[0];
    if (!this.bag.length) {
      for (let i = 0; i < set.length; i++) this.bag.push(set[i]);
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = (this.rand() * (i + 1)) | 0;
        const tmp = this.bag[i];
        this.bag[i] = this.bag[j];
        this.bag[j] = tmp;
      }
    }
    return this.bag.pop();
  }

  spawn(grainSec, pitchMode, reverse, voiceCap) {
    const cap = Math.max(1, Math.min(16, voiceCap | 0));
    let voice = null;
    for (let i = 0; i < cap; i++) {
      if (!this.voices[i].on) {
        voice = this.voices[i];
        break;
      }
    }
    if (!voice) {
      let worst = 0;
      voice = this.voices[0];
      for (let i = 0; i < cap; i++) {
        const v = this.voices[i];
        const age = v.life > 0 ? v.age / v.life : 1;
        if (age >= worst) {
          worst = age;
          voice = v;
        }
      }
    }
    const ratio = this.takeRatio(pitchMode | 0);
    const life = Math.max(8, Math.min(sampleRate * 0.45, grainSec * sampleRate));
    const delay = Math.max(life, grainSec * sampleRate);
    const jitter = (this.rand() - 0.5) * delay * 0.2;
    const dir = reverse > 0.5 ? -1 : 1;
    voice.on = true;
    voice.life = life;
    voice.age = 0;
    voice.step = ratio * dir;
    voice.pos = this.write - delay + jitter;
    this.spawns++;
  }

  process(inputs, outputs, params) {
    const input = inputs[0] || [];
    const output = outputs[0];
    if (!output || !output[0]) return true;
    const outL = output[0];
    const outR = output[1] || output[0];
    const n = outL.length;
    const inL = input[0] && input[0].length ? input[0] : this.zeros;
    const inR = input[1] && input[1].length ? input[1] : inL;
    const reset = params.reset[0];
    if (reset !== this.lastReset) {
      this.lastReset = reset;
      this.applyReset();
    }
    const density = params.density[0];
    const grainSec = params.grainSec[0];
    const feedback = params.feedback[0];
    const shape = params.shape[0];
    const pitchMode = params.pitchMode[0] | 0;
    const reverse = params.reverse[0];
    const freeze = params.freeze[0] > 0.5;
    const voiceCap = params.voiceCap[0] | 0;
    const wobble = params.wobbleIn;
    const wobbleA = wobble.length > 1;
    const cap = Math.max(1, Math.min(16, voiceCap));

    for (let i = 0; i < n; i++) {
      const inSampleL = inL[i] || 0;
      const inSampleR = inR[i] || 0;
      const incoming = Math.abs(inSampleL) + Math.abs(inSampleR) > 1e-5;
      let advance = true;
      if (!freeze || incoming) {
        const scale = freeze ? 0 : (this.fbScale || 0);
        this.bufL[this.write] = inSampleL + this.prevL * scale;
        this.bufR[this.write] = inSampleR + this.prevR * scale;
      } else {
        advance = false;
      }
      this.wait -= 1;
      if (this.wait <= 0) {
        this.spawn(grainSec, pitchMode, reverse, cap);
        const interval = sampleRate / Math.max(0.25, density);
        const jitter = (this.rand() - 0.5) * 0.35 * interval;
        this.wait = Math.max(1, interval + jitter);
      }
      const wob = wobbleA ? wobble[i] : wobble[0];
      let sumL = 0;
      let sumR = 0;
      let active = 0;
      for (let v = 0; v < cap; v++) {
        const voice = this.voices[v];
        if (!voice.on) continue;
        active++;
        const phase = voice.age / voice.life;
        const win = grainWindow(phase, shape);
        const mod = 1 + wob * 0.05;
        sumL += readRing(this.bufL, voice.pos) * win;
        sumR += readRing(this.bufR, voice.pos) * win;
        voice.pos += voice.step * mod;
        voice.age += 1;
        if (voice.age >= voice.life) voice.on = false;
      }
      // Forward gain is about 0.85 per voice. Divide feedback by the voice
      // count so overlapping grains cannot push the loop gain to 1 or above.
      const wetL = Math.tanh(sumL * 0.85);
      const wetR = Math.tanh(sumR * 0.85);
      this.fbScale = feedback / Math.max(1, active);
      outL[i] = wetL;
      if (outR !== outL) outR[i] = wetR;
      this.prevL = wetL;
      this.prevR = wetR;
      if (advance) {
        this.write++;
        if (this.write >= this.length) this.write = 0;
      }
    }
    this.sampleCount += n;
    if (this.sampleCount - this.lastReport > sampleRate) {
      this.lastReport = this.sampleCount;
      this.port.postMessage({ type: 'stats', spawns: this.spawns, samples: this.sampleCount });
    }
    return true;
  }
}

registerProcessor('prism-grain', PrismProcessor);
