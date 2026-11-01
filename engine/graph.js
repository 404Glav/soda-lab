import { LFO, Gain, Context } from './vendor/tone/index.js';
import { makeImpulse } from './ir.js';
import {
  clamp01, stepIndex, logMap, linMap, eqPower, timeSeconds, modulate,
  cycleSeconds, SIZE_NAMES, FILTER_TYPES, RATE_SECONDS, defaultKnobs,
} from './pedals.js';

const WORKLETS = [
  'prism-processor.js',
  'crusher-processor.js',
  'envelope-processor.js',
  'pad-processor.js',
  'capture-processor.js',
  'glitch-processor.js',
];

const loaded = new WeakSet();

export async function ensureWorklets(ctx) {
  if (!ctx.audioWorklet) {
    const err = new Error('This browser has no AudioWorklet.');
    err.code = 'worklet_unsupported';
    throw err;
  }
  if (loaded.has(ctx)) return;
  const dir = new URL('./worklets/', import.meta.url);
  for (let i = 0; i < WORKLETS.length; i++) {
    await ctx.audioWorklet.addModule(new URL(WORKLETS[i], dir));
  }
  loaded.add(ctx);
}

/* Peak loop gain. A true 0.95 would stay above -60 dB longer than the 10 s
   tail cap at the longest delay. 0.25 is about 12 dB down per repeat. */
const REEL_FB_MAX = 0.25;
const DRIVE = makeCurve(2048, (x) => Math.tanh(x * 2.2));
const FUZZ = makeCurve(2048, (x) => {
  const y = x * 2.4;
  const c = y > 0.55 ? 0.55 : y < -0.55 ? -0.55 : y;
  return c - (c * c * c) / 3;
});

function makeCurve(n, fn) {
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = fn(x);
  }
  return curve;
}

function writeAt(param, value, time, smooth, schedule) {
  if (!param) return;
  if (!schedule) {
    try { param.cancelScheduledValues(time); } catch { /* already clear */ }
  }
  if (smooth && param.setTargetAtTime) param.setTargetAtTime(value, time, 0.02);
  else if (param.setValueAtTime) param.setValueAtTime(value, time);
  else param.value = value;
}

function disc(node) {
  try { node.disconnect(); } catch { /* not connected */ }
}

function makeModulator(toneCtx, nativeCtx, frequency) {
  try {
    const lfo = new LFO({
      context: toneCtx,
      frequency,
      min: -1,
      max: 1,
      phase: 0,
      units: 'number',
    });
    const depth = new Gain({ context: toneCtx, gain: 0 });
    lfo.connect(depth);
    lfo.start(0);
    return { lfo, depth: depth.gain, node: depth, tone: true };
  } catch {
    const osc = nativeCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    const depth = nativeCtx.createGain();
    depth.gain.value = 0;
    osc.connect(depth);
    osc.start();
    return {
      lfo: { stop() { try { osc.stop(); } catch { /* */ } }, dispose() {}, frequency: osc.frequency },
      depth: depth.gain,
      node: depth,
      tone: false,
    };
  }
}

function ageCurves(drive) {
  const g = Math.max(1, drive);
  const n = 2048;
  const wet = new Float32Array(n);
  const fb = new Float32Array(n);
  const wetNorm = Math.tanh(g) || 1;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const y = Math.tanh(x * g);
    wet[i] = y / wetNorm;
    fb[i] = y / g;
  }
  return { wet, fb };
}

function reelHeadroom(knobs) {
  const wow = knobs.wow || 0;
  const flutter = knobs.flutter || 0;
  const wowSlew = wow * 0.007 * 2 * Math.PI * (0.25 + wow * 1.1);
  const flutterSlew = flutter * 0.0028 * 2 * Math.PI * (6 + flutter * 7);
  return 1 + wowSlew + flutterSlew;
}

function shaper(ctx, curve, oversample) {
  const node = ctx.createWaveShaper();
  node.curve = curve;
  node.oversample = oversample;
  return node;
}

function biquad(ctx, type, freq) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = freq;
  node.Q.value = 0.707;
  return node;
}

export function createGraph(ctx, toneCtx, options) {
  const lite = !!(options && options.lite);
  const oversample = lite ? '2x' : '4x';
  const pedals = [];

  const input = ctx.createGain();
  input.channelCount = 2;
  input.channelCountMode = 'explicit';

  const duck = new Gain({ context: toneCtx, gain: 1 });
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -1.5;
  compressor.knee.value = 0;
  compressor.ratio.value = 20;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.08;

  duck.connect(compressor);
  compressor.connect(ctx.destination);

  const live = typeof ctx.createMediaStreamDestination === 'function';
  let analyserL = null;
  let analyserR = null;
  let sink = null;
  let glitch = null;
  let directCapture = null;
  let streamCapture = null;
  let micCapture = null;
  let padNode = null;
  const padParams = [];

  if (live) {
    const split = ctx.createChannelSplitter(2);
    compressor.connect(split);
    analyserL = ctx.createAnalyser();
    analyserR = ctx.createAnalyser();
    analyserL.fftSize = 256;
    analyserR.fftSize = 256;
    analyserL.smoothingTimeConstant = 0;
    analyserR.smoothingTimeConstant = 0;
    split.connect(analyserL, 0);
    split.connect(analyserR, 1);

    sink = ctx.createGain();
    sink.gain.value = 0;
    sink.connect(ctx.destination);
    analyserL.connect(sink);
    analyserR.connect(sink);

    glitch = new AudioWorkletNode(ctx, 'glitch-tap', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    compressor.connect(glitch);
    glitch.connect(sink);

    directCapture = new AudioWorkletNode(ctx, 'capture-tap', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    compressor.connect(directCapture);
    directCapture.connect(sink);

    const mediaDest = ctx.createMediaStreamDestination();
    mediaDest.channelCount = 2;
    compressor.connect(mediaDest);
    const mediaSrc = ctx.createMediaStreamSource(mediaDest.stream);
    streamCapture = new AudioWorkletNode(ctx, 'capture-tap', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    mediaSrc.connect(streamCapture);
    streamCapture.connect(sink);

    micCapture = new AudioWorkletNode(ctx, 'capture-tap', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    padNode = new AudioWorkletNode(ctx, 'pad-voices', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      channelCount: 2,
    });
    padNode.connect(input);
    for (let v = 0; v < 16; v++) {
      padParams.push({
        trig: padNode.parameters.get('t' + v),
        rel: padNode.parameters.get('rel' + v),
        pad: padNode.parameters.get('pad' + v),
        semi: padNode.parameters.get('semi' + v),
        level: padNode.parameters.get('level' + v),
        rev: padNode.parameters.get('rev' + v),
        mode: padNode.parameters.get('mode' + v),
      });
    }
  }

  let reconTimer = 0;

  function reconnect(order) {
    disc(input);
    for (let i = 0; i < pedals.length; i++) disc(pedals[i].output);
    let prev = input;
    for (let i = 0; i < order.length; i++) {
      prev.connect(order[i].input);
      prev = order[i].output;
    }
    prev.connect(duck.input);
  }

  function pokeReconnect(order, immediate) {
    if (immediate) {
      reconnect(order);
      return;
    }
    const now = ctx.currentTime;
    writeAt(duck.gain, 0.0001, now, true, false);
    clearTimeout(reconTimer);
    reconTimer = setTimeout(() => {
      reconnect(order);
      writeAt(duck.gain, 1, ctx.currentTime, true, false);
    }, 36);
  }

  function blend(pedal, mix, bypass, time, smooth, schedule) {
    const [dry, wet] = eqPower(bypass ? 0 : mix);
    writeAt(pedal.dry.gain, dry, time, smooth, schedule);
    writeAt(pedal.wet.gain, wet, time, smooth, schedule);
  }

  function applyKnob(pedal, key, v01, opts) {
    const v = clamp01(v01);
    const time = opts.time;
    const smooth = !!opts.smooth;
    const schedule = !!opts.schedule;
    const bpm = opts.bpm || 120;
    const isLite = opts.lite != null ? opts.lite : lite;
    const p = pedal.params;
    const n = pedal.nodes;

    if (pedal.type === 'prism') {
      if (key === 'density') {
        let per = linMap(v, 1, 40);
        if (isLite) per = Math.min(per, 16);
        writeAt(p.density, per, time, smooth, schedule);
      } else if (key === 'time' || key === 'free') {
        const sec = timeSeconds(pedal.knobs.time, pedal.knobs.free, bpm, 20, 400);
        writeAt(p.grainSec, Math.min(0.75, Math.max(0.012, sec)), time, smooth, schedule);
      } else if (key === 'repeats') {
        writeAt(p.feedback, Math.min(0.95, v * 0.95), time, smooth, schedule);
      } else if (key === 'shape') {
        writeAt(p.shape, v, time, smooth, schedule);
      } else if (key === 'pitch') {
        writeAt(p.pitchMode, stepIndex(v, 4), time, false, schedule);
      } else if (key === 'wobble') {
        writeAt(p.wobble, v, time, smooth, schedule);
      } else if (key === 'space') {
        writeAt(p.space, v, time, smooth, schedule);
      } else if (key === 'tone') {
        const hz = logMap(v, 200, 20000);
        writeAt(p.tone, hz, time, smooth, schedule);
        writeAt(p.tone2, hz, time, smooth, schedule);
      } else if (key === 'mix') {
        blend(pedal, v, pedal.bypass, time, smooth, schedule);
      } else if (key === 'reverse') {
        writeAt(p.reverse, stepIndex(v, 2), time, false, schedule);
      } else if (key === 'freeze') {
        writeAt(p.freeze, stepIndex(v, 2), time, false, schedule);
      }
      return;
    }

    if (pedal.type === 'reel') {
      if (key === 'time' || key === 'free') {
        const sec = timeSeconds(pedal.knobs.time, pedal.knobs.free, bpm, 40, 800);
        writeAt(p.delay, Math.min(1.6, Math.max(0.02, sec)), time, smooth, schedule);
      } else if (key === 'feedback' || key === 'wow' || key === 'flutter' || key === 'age') {
        if (key === 'wow') {
          writeAt(p.wow, v * 0.007, time, smooth, schedule);
          writeAt(n.wow.lfo.frequency, 0.25 + v * 1.1, time, smooth, schedule);
        } else if (key === 'flutter') {
          writeAt(p.flutter, v * 0.0028, time, smooth, schedule);
          writeAt(n.flutter.lfo.frequency, 6 + v * 7, time, smooth, schedule);
        } else if (key === 'age') {
          writeAt(p.ageFreq, logMap(1 - v, 700, 12000), time, smooth, schedule);
          const curves = ageCurves(1 + v * 7);
          n.clipWet.curve = curves.wet;
          n.clipFb.curve = curves.fb;
        }
        const fb = Math.min(REEL_FB_MAX, (pedal.knobs.feedback || 0) * REEL_FB_MAX);
        const headroom = reelHeadroom(pedal.knobs);
        writeAt(p.feedback, fb / headroom, time, smooth, schedule);
      } else if (key === 'mix') {
        blend(pedal, v, pedal.bypass, time, smooth, schedule);
      }
      return;
    }

    if (pedal.type === 'cathedral') {
      if (key === 'size') {
        const kind = SIZE_NAMES[stepIndex(v, 4)];
        n.convolver.buffer = makeImpulse(ctx, kind, isLite, 0);
      } else if (key === 'predelay') {
        writeAt(p.predelay, linMap(v, 0, 0.2), time, smooth, schedule);
      } else if (key === 'damping') {
        writeAt(p.damp, logMap(1 - v, 350, 16000), time, smooth, schedule);
      } else if (key === 'mix') {
        blend(pedal, v, pedal.bypass, time, smooth, schedule);
      }
      return;
    }

    if (pedal.type === 'fizz') {
      if (key === 'gain') writeAt(p.pre, 1 + v * 36, time, smooth, schedule);
      else if (key === 'tone') writeAt(p.tone, logMap(v, 400, 14000), time, smooth, schedule);
      else if (key === 'mode') {
        const fuzz = stepIndex(v, 2);
        writeAt(p.driveMix, fuzz ? 0 : 1, time, smooth, schedule);
        writeAt(p.fuzzMix, fuzz ? 1 : 0, time, smooth, schedule);
      } else if (key === 'level') writeAt(p.level, v, time, smooth, schedule);
      else if (key === 'mix') blend(pedal, v, pedal.bypass, time, smooth, schedule);
      return;
    }

    if (pedal.type === 'crusher') {
      if (key === 'bits') writeAt(p.bits, 1 + stepIndex(v, 16), time, false, schedule);
      else if (key === 'downsample') writeAt(p.hold, Math.max(1, Math.round(linMap(v, 1, 32))), time, smooth, schedule);
      else if (key === 'mix') blend(pedal, v, pedal.bypass, time, smooth, schedule);
      return;
    }

    if (pedal.type === 'sweep') {
      if (key === 'type') n.filter.type = FILTER_TYPES[stepIndex(v, 3)];
      else if (key === 'cutoff') writeAt(p.cutoff, logMap(v, 40, 18000), time, smooth, schedule);
      else if (key === 'resonance') writeAt(p.q, linMap(v, 0.2, 16), time, smooth, schedule);
      else if (key === 'envelope') writeAt(p.env, v * 7000, time, smooth, schedule);
      else if (key === 'rate') {
        const seconds = RATE_SECONDS[stepIndex(v, RATE_SECONDS.length)];
        const coeff = 1 - Math.exp(-1 / (ctx.sampleRate * seconds));
        writeAt(p.follow, coeff, time, smooth, schedule);
      } else if (key === 'mix') blend(pedal, v, pedal.bypass, time, smooth, schedule);
    }
  }

  function applyAll(pedal, bpm, time, smooth, isLite) {
    const keys = Object.keys(pedal.knobs);
    for (let i = 0; i < keys.length; i++) {
      applyKnob(pedal, keys[i], pedal.knobs[keys[i]], { time, smooth, bpm, lite: isLite });
    }
  }

  function playheadAt(origin, t, loop) {
    let p = origin + t;
    if (loop && loop.enabled && loop.end > loop.start && origin < loop.end && p >= loop.end) {
      const span = loop.end - loop.start;
      const first = loop.end - origin;
      if (span > 0 && t >= first) p = loop.start + ((t - first) % span);
    }
    return p;
  }

  function scheduleCurve(pedal, curve, bpm, duration, isLite, originSec, audioTime0, loop) {
    if (!curve) return;
    const cycle = cycleSeconds(curve.bars, bpm);
    const step = Math.min(0.02, Math.max(0.01, cycle / 64));
    const base = pedal.knobs[curve.knob];
    const origin = originSec || 0;
    const t0 = audioTime0 || 0;
    for (let t = 0; t <= duration + 1e-4; t += step) {
      const playhead = playheadAt(origin, t, loop);
      const phase = cycle > 0 ? ((playhead % cycle) + cycle) % cycle / cycle : 0;
      const value = modulate(base, curve, phase);
      pedal.knobs[curve.knob] = value;
      applyKnob(pedal, curve.knob, value, {
        time: t0 + t, smooth: false, schedule: t > 0, bpm, lite: isLite,
      });
    }
    pedal.knobs[curve.knob] = base;
  }

  function shell(type) {
    const entry = ctx.createGain();
    const output = ctx.createGain();
    const dry = new Gain({ context: toneCtx, gain: 1 });
    const wet = new Gain({ context: toneCtx, gain: 0 });
    entry.connect(dry.input);
    dry.connect(output);
    wet.connect(output);
    const pedal = {
      type,
      input: entry,
      output,
      dry,
      wet,
      bypass: false,
      knobs: defaultKnobs(type),
      nodes: {},
      params: {},
      stats: { spawns: 0, samples: 0 },
    };
    return pedal;
  }

  function build(type, seed) {
    if (type === 'prism') return buildPrism(seed);
    if (type === 'reel') return buildReel();
    if (type === 'cathedral') return buildCathedral();
    if (type === 'fizz') return buildFizz();
    if (type === 'crusher') return buildCrusher();
    if (type === 'sweep') return buildSweep();
    return null;
  }

  function buildPrism(seed) {
    const pedal = shell('prism');
    const worklet = new AudioWorkletNode(ctx, 'prism-grain', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      channelCount: 2,
      processorOptions: { seed: seed || 1 },
    });
    const bus = ctx.createGain();
    const tone = biquad(ctx, 'lowpass', 18000);
    const tone2 = biquad(ctx, 'lowpass', 18000);
    const space = ctx.createGain();
    space.gain.value = 0;
    const convolver = ctx.createConvolver();
    convolver.normalize = false;
    convolver.buffer = makeImpulse(ctx, 'hall', lite, 0.6);
    const wob = makeModulator(toneCtx, ctx, 0.65);
    pedal.input.connect(worklet);
    worklet.connect(bus);
    bus.connect(tone);
    tone.connect(tone2);
    bus.connect(space);
    space.connect(convolver);
    convolver.connect(tone);
    tone2.connect(pedal.wet.input);
    wob.node.connect(worklet.parameters.get('wobbleIn'));
    worklet.port.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === 'stats') pedal.stats = data;
      else if (data.type === 'seeded' && pedal._seedWait) {
        const done = pedal._seedWait;
        pedal._seedWait = null;
        done();
      }
    };
    pedal.nodes = { worklet, tone, tone2, space, convolver, wob, lfos: [wob.lfo] };
    pedal.params = {
      density: worklet.parameters.get('density'),
      grainSec: worklet.parameters.get('grainSec'),
      feedback: worklet.parameters.get('feedback'),
      shape: worklet.parameters.get('shape'),
      pitchMode: worklet.parameters.get('pitchMode'),
      reverse: worklet.parameters.get('reverse'),
      freeze: worklet.parameters.get('freeze'),
      reset: worklet.parameters.get('reset'),
      voiceCap: worklet.parameters.get('voiceCap'),
      space: space.gain,
      tone: tone.frequency,
      tone2: tone2.frequency,
      wobble: wob.depth,
    };
    pedal.params.voiceCap.value = lite ? 8 : 16;
    pedals.push(pedal);
    return pedal;
  }

  function buildReel() {
    const pedal = shell('reel');
    const sum = ctx.createGain();
    const delay = ctx.createDelay(3);
    delay.delayTime.value = 0.25;
    const lowpass = biquad(ctx, 'lowpass', 6000);
    const curves = ageCurves(1 + (pedal.knobs.age || 0) * 7);
    const clipWet = shaper(ctx, curves.wet, '2x');
    const clipFb = shaper(ctx, curves.fb, '2x');
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const wow = makeModulator(toneCtx, ctx, 0.4);
    const flutter = makeModulator(toneCtx, ctx, 8);
    pedal.input.connect(sum);
    sum.connect(delay);
    delay.connect(lowpass);
    lowpass.connect(clipWet);
    lowpass.connect(clipFb);
    clipFb.connect(feedback);
    feedback.connect(sum);
    clipWet.connect(pedal.wet.input);
    wow.node.connect(delay.delayTime);
    flutter.node.connect(delay.delayTime);
    pedal.nodes = { delay, lowpass, clipWet, clipFb, feedback, wow, flutter, lfos: [wow.lfo, flutter.lfo] };
    pedal.params = {
      delay: delay.delayTime,
      feedback: feedback.gain,
      wow: wow.depth,
      flutter: flutter.depth,
      ageFreq: lowpass.frequency,
    };
    pedals.push(pedal);
    return pedal;
  }

  function buildCathedral() {
    const pedal = shell('cathedral');
    const predelay = ctx.createDelay(1);
    const convolver = ctx.createConvolver();
    convolver.normalize = false;
    convolver.buffer = makeImpulse(ctx, 'hall', lite, 0);
    const damp = biquad(ctx, 'lowpass', 8000);
    pedal.input.connect(predelay);
    predelay.connect(convolver);
    convolver.connect(damp);
    damp.connect(pedal.wet.input);
    pedal.nodes = { predelay, convolver, damp, lfos: [] };
    pedal.params = { predelay: predelay.delayTime, damp: damp.frequency };
    pedals.push(pedal);
    return pedal;
  }

  function buildFizz() {
    const pedal = shell('fizz');
    const pre = ctx.createGain();
    const drive = shaper(ctx, DRIVE, oversample);
    const fuzz = shaper(ctx, FUZZ, oversample);
    const driveMix = ctx.createGain();
    const fuzzMix = ctx.createGain();
    fuzzMix.gain.value = 0;
    const tone = biquad(ctx, 'lowpass', 6000);
    const level = ctx.createGain();
    pedal.input.connect(pre);
    pre.connect(drive);
    pre.connect(fuzz);
    drive.connect(driveMix);
    fuzz.connect(fuzzMix);
    driveMix.connect(tone);
    fuzzMix.connect(tone);
    tone.connect(level);
    level.connect(pedal.wet.input);
    pedal.nodes = { driveShaper: drive, fuzzShaper: fuzz, lfos: [] };
    pedal.params = {
      pre: pre.gain,
      driveMix: driveMix.gain,
      fuzzMix: fuzzMix.gain,
      tone: tone.frequency,
      level: level.gain,
    };
    pedals.push(pedal);
    return pedal;
  }

  function buildCrusher() {
    const pedal = shell('crusher');
    const worklet = new AudioWorkletNode(ctx, 'crusher-bit', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      channelCount: 2,
    });
    pedal.input.connect(worklet);
    worklet.connect(pedal.wet.input);
    pedal.nodes = { worklet, lfos: [] };
    pedal.params = {
      bits: worklet.parameters.get('bits'),
      hold: worklet.parameters.get('hold'),
    };
    pedals.push(pedal);
    return pedal;
  }

  function buildSweep() {
    const pedal = shell('sweep');
    const filter = biquad(ctx, 'lowpass', 1200);
    const env = new AudioWorkletNode(ctx, 'sweep-envelope', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    const envGain = ctx.createGain();
    envGain.gain.value = 2000;
    pedal.input.connect(filter);
    filter.connect(pedal.wet.input);
    pedal.input.connect(env);
    env.connect(envGain);
    envGain.connect(filter.frequency);
    pedal.nodes = { filter, env, lfos: [] };
    pedal.params = {
      cutoff: filter.frequency,
      q: filter.Q,
      env: envGain.gain,
      follow: env.parameters.get('follow'),
    };
    pedals.push(pedal);
    return pedal;
  }

  function destroy(pedal) {
    disc(pedal.input);
    disc(pedal.output);
    const lfos = (pedal.nodes && pedal.nodes.lfos) || [];
    for (let i = 0; i < lfos.length; i++) {
      try { lfos[i].stop(); } catch { /* already stopped */ }
      try { lfos[i].dispose(); } catch { /* native fallback */ }
    }
    const idx = pedals.indexOf(pedal);
    if (idx >= 0) pedals.splice(idx, 1);
  }

  function setLite(next) {
    for (let i = 0; i < pedals.length; i++) {
      const pedal = pedals[i];
      if (pedal.type === 'prism' && pedal.params.voiceCap) {
        pedal.params.voiceCap.value = next ? 8 : 16;
        pedal.nodes.convolver.buffer = makeImpulse(ctx, 'hall', next, 0.6);
      }
      if (pedal.type === 'fizz') {
        const mode = next ? '2x' : '4x';
        pedal.nodes.driveShaper.oversample = mode;
        pedal.nodes.fuzzShaper.oversample = mode;
      }
      if (pedal.type === 'cathedral') {
        const kind = SIZE_NAMES[stepIndex(pedal.knobs.size, 4)];
        pedal.nodes.convolver.buffer = makeImpulse(ctx, kind, next, 0);
      }
    }
  }

  function armPrism(pedal, seed) {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, 80);
      pedal._seedWait = () => {
        clearTimeout(timer);
        resolve();
      };
      pedal.nodes.worklet.port.postMessage({ type: 'seed', seed: seed >>> 0 });
    });
  }

  function triggerPrism(pedal, when) {
    const reset = pedal.params.reset;
    const next = (reset.value || 0) + 1;
    reset.setValueAtTime(next, when);
  }

  reconnect([]);

  return {
    input,
    duck,
    compressor,
    analyserL,
    analyserR,
    glitch,
    directCapture,
    streamCapture,
    micCapture,
    sink,
    padNode,
    padParams,
    build,
    destroy,
    reconnect,
    pokeReconnect,
    applyKnob,
    applyAll,
    scheduleCurve,
    blend,
    setLite,
    armPrism,
    triggerPrism,
  };
}

export async function renderOffline(options) {
  const sampleRate = options.sampleRate;
  const frames = Math.max(1, Math.ceil(options.duration * sampleRate));
  const offline = new OfflineAudioContext(2, frames, sampleRate);
  await ensureWorklets(offline);
  const toneCtx = new Context({
    context: offline,
    clockSource: 'offline',
    lookAhead: 0,
    updateInterval: 128 / sampleRate,
  });
  const graph = createGraph(offline, toneCtx, { lite: options.lite });
  const built = [];
  const chain = options.chain || [];
  for (let i = 0; i < chain.length; i++) {
    const spec = chain[i];
    const pedal = graph.build(spec.type, options.seed || 1);
    pedal.bypass = !!spec.bypass;
    pedal.knobs = Object.assign(defaultKnobs(spec.type), spec.knobs || {});
    pedal.curve = spec.curve;
    built.push(pedal);
  }
  graph.reconnect(built);
  const bpm = options.bpm || 120;
  for (let i = 0; i < built.length; i++) {
    const pedal = built[i];
    graph.applyAll(pedal, bpm, 0, false, options.lite);
    if (pedal.curve) {
      graph.scheduleCurve(
        pedal, pedal.curve, bpm, options.duration, options.lite,
        options.phaseOrigin || 0, 0, options.loop || null,
      );
    }
  }
  const left = options.left;
  const right = options.right || left;
  const buffer = offline.createBuffer(2, left.length, sampleRate);
  buffer.copyToChannel(left, 0);
  buffer.copyToChannel(right, 1);
  const src = offline.createBufferSource();
  src.buffer = buffer;
  src.connect(graph.input);
  const offset = options.offset || 0;
  src.start(0, offset);

  const dur = offline.length / offline.sampleRate;
  if (options.onProgress) options.onProgress(0);
  if (dur > 0.3 && options.onProgress) {
    const steps = 4;
    for (let s = 1; s < steps; s++) {
      const at = (dur * s) / steps;
      offline.suspend(at).then(() => {
        options.onProgress(s / steps);
        return offline.resume();
      });
    }
  }
  const rendered = await offline.startRendering();
  if (options.onProgress) options.onProgress(1);
  let spawns = 0;
  for (let i = 0; i < built.length; i++) {
    if (built[i].stats && built[i].stats.spawns) spawns += built[i].stats.spawns;
  }
  return {
    buffer: rendered,
    spawns,
  };
}
