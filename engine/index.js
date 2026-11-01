import { Context, getTransport, setContext } from './vendor/tone/index.js';
import {
  PEDAL_DEFS, CURVE_PRESETS, formatKnob, clamp01, defaultKnobs, snapBars,
  cycleSeconds, tailHoldSeconds,
} from './pedals.js';
import { mulberry32 } from './rng.js';
import { settings as storedSettings } from './storage.js';
import { idbPut, idbGet, idbAll, idbDelete } from './storage.js';
import { encodeWav24 } from './wav.js';
import { ensureWorklets, createGraph, renderOffline } from './graph.js';
import { renderStretch } from './stretch.js';

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_SECONDS = 5 * 60;

const listeners = {};
let state = 'idle';
let started = false;
let ctx = null;
let toneCtx = null;
let graph = null;
let lite = !!storedSettings.get('lite');
let seed = 424242;
let seq = 1;
let order = [];
let batch = false;
let current = null;
let bpmOverride = null;
let keyOverride = null;
let loopStart = 0;
let loopEnd = 0;
let loopEnabled = false;
let playing = false;
let playhead = 0;
let startedAt = 0;
let startOffset = 0;
let sourceNode = null;
let projectId = null;
const unownedBakes = new Set();
let meterTimer = 0;
let micStream = null;
let micNode = null;
const bakes = new Map();
const voices = [];
for (let i = 0; i < 16; i++) voices.push({ busy: false, pad: -1, mode: 0 });
let voiceCursor = 0;
const bufWait = {};
let bufSeq = 1;
const hitFrames = [];
let pads = blankPads();
let analyzeQueue = Promise.resolve();

function emit(name, data) {
  const list = listeners[name];
  if (!list) return;
  for (let i = 0; i < list.length; i++) {
    try { list[i](data); } catch { /* a listener threw */ }
  }
}

function fail(code, message) {
  emit('error', { code, message });
  const err = new Error(message);
  err.code = code;
  return err;
}

function uid(prefix) {
  seq += 1;
  return prefix + '_' + Date.now().toString(36) + '_' + seq.toString(36);
}

function blankPads() {
  const list = [];
  for (let i = 0; i < 16; i++) {
    list.push({
      i, start: 0, end: 0, score: 0, favorite: false, level: 0.8, reverse: false,
      key: 0, stretch: 1, mode: 'trigger', ready: true, playL: null, playR: null, token: 0,
    });
  }
  return list;
}

function viewPad(pad) {
  return {
    i: pad.i, start: pad.start, end: pad.end, score: pad.score, favorite: !!pad.favorite,
    level: pad.level, reverse: !!pad.reverse, key: pad.key, stretch: pad.stretch,
    mode: pad.mode, ready: !!pad.ready,
  };
}

function viewPads() {
  const list = [];
  for (let i = 0; i < pads.length; i++) list.push(viewPad(pads[i]));
  return list;
}

function tempo() {
  if (bpmOverride != null) return bpmOverride;
  if (current && current.detectedBpm) return current.detectedBpm;
  return 120;
}

function currentKey() {
  if (keyOverride != null) return keyOverride;
  if (current && current.detectedKey) return current.detectedKey;
  return '';
}

function viewSource(rec) {
  return {
    id: rec.id,
    name: rec.name,
    duration: rec.duration,
    sampleRate: rec.sampleRate,
    peaks: rec.peaks,
    bpm: bpmOverride != null ? bpmOverride : rec.detectedBpm,
    key: keyOverride != null ? keyOverride : rec.detectedKey,
    onsets: rec.onsets.slice(),
  };
}

function setState(next) {
  if (state === next) return;
  state = next;
  emit('state', state);
}

function syncState() {
  if (!started || !ctx) {
    setState('idle');
    return;
  }
  const audioState = ctx.state;
  if (audioState === 'running') setState('running');
  else if (audioState === 'interrupted') setState('interrupted');
  else if (typeof document !== 'undefined' && document.visibilityState === 'hidden') setState('interrupted');
  else setState('suspended');
}

function setSession(type) {
  const session = typeof navigator !== 'undefined' ? navigator.audioSession : null;
  if (session && 'type' in session) {
    try { session.type = type; } catch { /* some builds expose a read-only session */ }
  }
}

function findPedal(id) {
  for (let i = 0; i < order.length; i++) if (order[i].id === id) return order[i];
  return null;
}

function audios() {
  const list = [];
  for (let i = 0; i < order.length; i++) if (order[i].audio) list.push(order[i].audio);
  return list;
}

function makePeaks(left, right) {
  const buckets = 2048;
  const out = new Float32Array(buckets * 2);
  const n = left.length;
  for (let i = 0; i < buckets; i++) {
    const a = n ? Math.floor((i * n) / buckets) : 0;
    const b = n ? Math.max(a + 1, Math.floor(((i + 1) * n) / buckets)) : 0;
    let min = 0;
    let max = 0;
    if (n) {
      min = 1;
      max = -1;
      for (let j = a; j < b && j < n; j++) {
        const s = 0.5 * (left[j] + right[j]);
        if (s < min) min = s;
        if (s > max) max = s;
      }
    }
    out[i * 2] = min;
    out[i * 2 + 1] = max;
  }
  return out;
}

async function resampleTo(left, right, fromRate, toRate) {
  if (fromRate === toRate) return { left, right, sampleRate: toRate };
  const len = Math.max(1, Math.ceil(left.length * toRate / fromRate));
  const offline = new OfflineAudioContext(2, len, toRate);
  const buffer = offline.createBuffer(2, left.length, fromRate);
  buffer.copyToChannel(left, 0);
  buffer.copyToChannel(right, 1);
  const src = offline.createBufferSource();
  src.buffer = buffer;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();
  return {
    left: rendered.getChannelData(0).slice(),
    right: rendered.getChannelData(1).slice(),
    sampleRate: toRate,
  };
}

function analyze(samples, sampleRate) {
  const run = analyzeQueue.then(() => runAnalyze(samples, sampleRate));
  analyzeQueue = run.then(() => {}, () => {});
  return run;
}

function runAnalyze(samples, sampleRate) {
  return new Promise((resolve) => {
    let worker;
    const finish = (value) => {
      clearTimeout(timer);
      resolve(value || { onsets: [], strengths: [], bpm: 120, key: 'C major' });
    };
    const timer = setTimeout(() => finish({ onsets: [], strengths: [], bpm: 120, key: 'C major' }), 20000);
    try {
      worker = new Worker(new URL('./workers/analysis-worker.js', import.meta.url));
    } catch {
      finish({ onsets: [], strengths: [], bpm: 120, key: 'C major' });
      return;
    }
    worker.onmessage = (event) => {
      worker.terminate();
      finish(event.data);
    };
    worker.onerror = () => {
      worker.terminate();
      finish({ onsets: [], strengths: [], bpm: 120, key: 'C major' });
    };
    const copy = samples.slice();
    worker.postMessage({ samples: copy, sampleRate }, [copy.buffer]);
  });
}

async function adopt(rec, savedLoop) {
  let left = rec.left;
  let right = rec.right;
  let sampleRate = rec.sampleRate;
  if (ctx && sampleRate !== ctx.sampleRate) {
    const next = await resampleTo(left, right, sampleRate, ctx.sampleRate);
    left = next.left;
    right = next.right;
    sampleRate = next.sampleRate;
  }
  current = {
    id: rec.id,
    name: rec.name,
    duration: left.length / sampleRate,
    sampleRate,
    left,
    right,
    peaks: rec.peaks && rec.peaks.length === 4096 ? rec.peaks : makePeaks(left, right),
    detectedBpm: rec.detectedBpm || 120,
    detectedKey: rec.detectedKey || 'C major',
    onsets: rec.onsets || [],
    strengths: rec.strengths || [],
    added: rec.added,
  };
  if (toneCtx) {
    try { getTransport().bpm.value = tempo(); } catch { /* transport not ready */ }
  }
  settleTransport(current.duration, savedLoop || null);
}

const TAIL_THRESHOLD = Math.pow(10, -60 / 20);
const TAIL_HOLD_SEC = 0.1;
const TAIL_MAX_SEC = 10;

function trimTail(left, right, regionFrames, sampleRate, holdSec) {
  const hold = Math.max(1, Math.round(Math.max(TAIL_HOLD_SEC, holdSec || TAIL_HOLD_SEC) * sampleRate));
  const limit = Math.min(left.length, regionFrames + Math.round(TAIL_MAX_SEC * sampleRate));
  let quiet = 0;
  let cut = limit;
  const start = Math.max(0, Math.min(regionFrames, left.length));
  for (let i = start; i < limit; i++) {
    const a = left[i] < 0 ? -left[i] : left[i];
    const b = right[i] < 0 ? -right[i] : right[i];
    if (a < TAIL_THRESHOLD && b < TAIL_THRESHOLD) {
      quiet++;
      if (quiet >= hold) {
        cut = i + 1;
        break;
      }
    } else {
      quiet = 0;
    }
  }
  if (cut >= left.length) {
    return { left: left.slice(), right: right.slice() };
  }
  return { left: left.slice(0, cut), right: right.slice(0, cut) };
}

async function claimUnownedBakes(ownerId) {
  const ids = Array.from(unownedBakes);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const rec = bakes.get(id) || await idbGet('bakes', id);
    if (!rec || rec.projectId) continue;
    rec.projectId = ownerId;
    await idbPut('bakes', rec);
    bakes.set(id, rec);
  }
  unownedBakes.clear();
}

function settleTransport(duration, savedLoop) {
  halt();
  playing = false;
  playhead = 0;
  startedAt = 0;
  startOffset = 0;
  try { if (toneCtx) getTransport().pause(); } catch { /* no clock yet */ }
  if (savedLoop) {
    loopStart = Math.max(0, Number(savedLoop.start) || 0);
    loopEnd = Math.max(loopStart, Number(savedLoop.end) || 0);
    loopEnabled = !!savedLoop.enabled;
  } else {
    loopStart = 0;
    loopEnd = Math.max(0, Number(duration) || 0);
  }
}

async function storeChannels(info) {
  let left = info.left;
  let right = info.right && info.right.length === left.length ? info.right : left.slice();
  let sampleRate = info.sampleRate;
  if (!left.length) {
    left = new Float32Array([0]);
    right = new Float32Array([0]);
  }
  if (ctx && ctx.sampleRate !== sampleRate) {
    const next = await resampleTo(left, right, sampleRate, ctx.sampleRate);
    left = next.left;
    right = next.right;
    sampleRate = next.sampleRate;
  }
  const mono = new Float32Array(left.length);
  for (let i = 0; i < left.length; i++) mono[i] = 0.5 * (left[i] + right[i]);
  const analysis = await analyze(mono, sampleRate);
  const rec = {
    id: uid('src'),
    name: info.name || 'Audio',
    duration: left.length / sampleRate,
    sampleRate,
    left,
    right,
    peaks: makePeaks(left, right),
    detectedBpm: analysis.bpm || 120,
    detectedKey: analysis.key || 'C major',
    onsets: analysis.onsets || [],
    strengths: analysis.strengths || [],
    added: new Date().toISOString(),
  };
  try {
    await idbPut('sources', rec);
  } catch (err) {
    if (err && err.code === 'storage_full') {
      throw fail('storage_full', 'Storage is full.');
    }
    throw err;
  }
  await adopt(rec);
  return viewSource(current);
}

function wirePadPort() {
  graph.padNode.port.onmessage = (event) => {
    const data = event.data || {};
    if (data.type === 'hit' && Number.isFinite(data.frame)) hitFrames.push(data.frame);
    else if (data.type === 'end' && voices[data.voice]) voices[data.voice].busy = false;
    else if (data.type === 'buf-ack' && bufWait[data.id]) {
      const done = bufWait[data.id];
      delete bufWait[data.id];
      done();
    }
  };
}

function installPad(pad) {
  if (!graph || !graph.padNode || !pad.playL) return Promise.resolve();
  const id = bufSeq++;
  const left = pad.playL.slice();
  const right = (pad.playR || pad.playL).slice();
  return new Promise((resolve) => {
    bufWait[id] = resolve;
    graph.padNode.port.postMessage({ type: 'buffer', id, i: pad.i, left, right }, [left.buffer, right.buffer]);
  });
}

function sliceSource(start, end) {
  const sr = current.sampleRate;
  const n = current.left.length;
  let a = Math.floor(start * sr);
  let b = Math.floor(end * sr);
  if (a < 0) a = 0;
  if (b > n) b = n;
  if (b <= a) b = Math.min(n, a + 1);
  return { left: current.left.slice(a, b), right: current.right.slice(a, b) };
}

function loopState() {
  return { start: loopStart, end: loopEnd, enabled: !!loopEnabled };
}

function loopOn() {
  return !!(loopEnabled && loopEnd > loopStart);
}

function applyLoopToSource() {
  if (!sourceNode || !current) return;
  const looping = loopOn();
  sourceNode.loop = looping;
  if (looping) {
    sourceNode.loopStart = loopStart;
    sourceNode.loopEnd = Math.min(loopEnd, current.duration);
  }
}

/** Same bar grid the offline bake uses, written into AudioParams ahead of time. */
function scheduleLiveCurves(audioTime, origin, duration) {
  if (!graph || !ctx) return;
  const when = audioTime == null ? ctx.currentTime : audioTime;
  const pos = origin == null ? position() : origin;
  const horizon = duration == null ? 8 : duration;
  const bpm = tempo();
  const loop = loopState();
  for (let i = 0; i < order.length; i++) {
    const pedal = order[i];
    if (!pedal.curve || !pedal.audio) continue;
    pedal.audio.knobs = pedal.knobs;
    pedal.audio.curve = pedal.curve;
    graph.scheduleCurve(pedal.audio, pedal.curve, bpm, horizon, lite, pos, when, loop);
  }
}

const meterL = new Float32Array(256);
const meterR = new Float32Array(256);
function meter() {
  if (state !== 'running' || !graph || !graph.analyserL) return;
  try {
    graph.analyserL.getFloatTimeDomainData(meterL);
    graph.analyserR.getFloatTimeDomainData(meterR);
    let gr = graph.compressor.reduction || 0;
    if (gr > 0) gr = -gr;
    emit('meter', { l: dbfs(peakOf(meterL)), r: dbfs(peakOf(meterR)), gr });
  } catch { /* analyser not ready */ }
}

function peakOf(buf) {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    const a = buf[i] < 0 ? -buf[i] : buf[i];
    if (a > peak) peak = a;
  }
  return peak;
}

function dbfs(peak) {
  if (peak < 1e-7) return -100;
  return 20 * Math.log10(peak);
}

function halt() {
  if (!sourceNode) return;
  const node = sourceNode;
  sourceNode = null;
  try { node.onended = null; } catch { /* */ }
  try { node.stop(); } catch { /* already stopped */ }
  try { node.disconnect(); } catch { /* */ }
}

function position() {
  if (!playing || !ctx) return playhead;
  const elapsed = Math.max(0, ctx.currentTime - startedAt);
  let p = startOffset + elapsed;
  const end = current ? current.duration : 0;
  if (loopOn() && end) {
    const loopB = Math.min(loopEnd, end);
    const span = loopB - loopStart;
    if (span > 0 && startOffset < loopB && p >= loopB) {
      const first = loopB - startOffset;
      if (elapsed >= first) p = loopStart + ((elapsed - first) % span);
    }
  }
  if (end && p > end) p = end;
  playhead = p;
  return p;
}

async function rebuildChain() {
  for (let i = 0; i < order.length; i++) {
    const pedal = order[i];
    pedal.audio = graph.build(pedal.type, seed);
    pedal.audio.knobs = pedal.knobs;
    pedal.audio.bypass = pedal.bypass;
    pedal.audio.curve = pedal.curve;
    graph.applyAll(pedal.audio, tempo(), ctx.currentTime, false, lite);
  }
  graph.reconnect(audios());
}

const api = {
  PEDAL_DEFS,
  CURVE_PRESETS,
  formatKnob,
  settings: {
    get(key) { return storedSettings.get(key); },
    set(key, value) {
      storedSettings.set(key, value);
      if (key === 'lite') {
        lite = !!value;
        if (graph) graph.setLite(lite);
      }
    },
  },
  get state() { return state; },
  on(name, fn) {
    if (!listeners[name]) listeners[name] = [];
    listeners[name].push(fn);
  },
  off(name, fn) {
    const list = listeners[name];
    if (!list) return;
    const index = list.indexOf(fn);
    if (index >= 0) list.splice(index, 1);
  },
  latency() {
    if (!ctx) return { base: 0, output: 0, total: 0 };
    const base = (ctx.baseLatency || 0) * 1000;
    const output = (ctx.outputLatency || 0) * 1000;
    return { base, output, total: base + output };
  },
  async start() {
    setSession('playback');
    if (!ctx) {
      ctx = new AudioContext({ latencyHint: 'interactive' });
      ctx.addEventListener('statechange', syncState);
    }
    await ctx.resume();
    if (!graph) {
      try {
        await ensureWorklets(ctx);
      } catch (err) {
        throw fail('worklet_unsupported', 'AudioWorklet failed to load.');
      }
      toneCtx = new Context({
        context: ctx,
        clockSource: 'timeout',
        lookAhead: 0.01,
        updateInterval: 0.02,
      });
      setContext(toneCtx);
      try { getTransport().bpm.value = tempo(); } catch { /* */ }
      graph = createGraph(ctx, toneCtx, { lite });
      await rebuildChain();
      wirePadPort();
      for (let i = 0; i < pads.length; i++) {
        if (pads[i].playL) await installPad(pads[i]);
      }
      if (!meterTimer) meterTimer = setInterval(meter, 33);
      if (current && current.sampleRate !== ctx.sampleRate) await adopt(current);
    }
    await ctx.resume();
    started = true;
    syncState();
  },
  async resume() {
    if (!ctx) return api.start();
    setSession('playback');
    await ctx.resume();
    started = true;
    syncState();
  },
  async loadFile(file) {
    halt();
    playing = false;
    if (file && file.size > MAX_BYTES) throw fail('too_large', 'Audio is over 50 MB.');
    let bytes;
    try {
      bytes = await file.arrayBuffer();
    } catch {
      throw fail('decode_failed', 'Could not read the audio file.');
    }
    const base = ctx || new OfflineAudioContext(2, 2, 48000);
    let audio;
    try {
      audio = await base.decodeAudioData(bytes.slice(0));
    } catch {
      throw fail('decode_failed', 'Could not decode that audio file.');
    }
    if (audio.duration > MAX_SECONDS) throw fail('too_large', 'Audio is longer than 5 minutes.');
    const left = audio.getChannelData(0).slice();
    const right = audio.numberOfChannels > 1 ? audio.getChannelData(1).slice() : left.slice();
    return storeChannels({ name: file.name || 'Audio', left, right, sampleRate: audio.sampleRate });
  },
  async recordStart() {
    if (!ctx) await api.start();
    setSession('play-and-record');
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch {
      setSession('playback');
      throw fail('mic_denied', 'Microphone permission was denied.');
    }
    micNode = ctx.createMediaStreamSource(micStream);
    micNode.connect(graph.micCapture);
    graph.micCapture.connect(graph.sink);
    await portCall(graph.micCapture, { type: 'start' }, 'started');
    return undefined;
  },
  async recordStop() {
    if (!graph || !graph.micCapture) throw fail('mic_denied', 'Microphone is not recording.');
    const audio = await portCall(graph.micCapture, { type: 'stop' }, 'audio');
    if (micStream) {
      const tracks = micStream.getTracks();
      for (let i = 0; i < tracks.length; i++) tracks[i].stop();
    }
    micStream = null;
    if (micNode) {
      try { micNode.disconnect(); } catch { /* */ }
      micNode = null;
    }
    try { graph.micCapture.disconnect(); } catch { /* */ }
    setSession('playback');
    const left = audio.left && audio.left.length ? audio.left : new Float32Array([0]);
    const right = audio.right && audio.right.length ? audio.right : left.slice();
    return storeChannels({ name: 'Mic recording', left, right, sampleRate: ctx.sampleRate });
  },
  async listSources() {
    const rows = await idbAll('sources');
    return rows.map((row) => ({
      id: row.id, name: row.name, duration: row.duration, added: row.added,
    })).sort((a, b) => (a.added < b.added ? 1 : -1));
  },
  async loadSource(id) {
    halt();
    playing = false;
    const rec = await idbGet('sources', id);
    if (!rec) throw new Error('Unknown source.');
    await adopt(rec);
    return viewSource(current);
  },
  getSource() {
    return current ? viewSource(current) : null;
  },
  setBpm(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    bpmOverride = Math.max(20, Math.min(300, n));
    try { if (toneCtx) getTransport().bpm.value = bpmOverride; } catch { /* */ }
    refreshKnobs();
    scheduleLiveCurves();
  },
  setKey(value) {
    keyOverride = String(value || '');
  },
  async play() {
    if (!ctx || !current || !graph) return;
    halt();
    const offset = Math.min(current.duration, Math.max(0, playhead));
    const pending = [];
    const prisms = [];
    for (let i = 0; i < order.length; i++) {
      if (order[i].type === 'prism' && order[i].audio) {
        prisms.push(order[i].audio);
        pending.push(graph.armPrism(order[i].audio, seed));
      }
    }
    await Promise.all(pending);
    const when = ctx.currentTime + 0.05;
    for (let i = 0; i < prisms.length; i++) graph.triggerPrism(prisms[i], when);
    const buffer = ctx.createBuffer(2, current.left.length, current.sampleRate);
    buffer.copyToChannel(current.left, 0);
    buffer.copyToChannel(current.right, 1);
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(graph.input);
    const looping = loopOn();
    node.loop = looping;
    if (looping) {
      node.loopStart = loopStart;
      node.loopEnd = Math.min(loopEnd, current.duration);
    }
    node.start(when, offset);
    const remain = Math.max(0.1, current.duration - offset);
    scheduleLiveCurves(when, offset, looping ? Math.max(remain, 8) : remain);
    sourceNode = node;
    startedAt = when;
    startOffset = offset;
    playing = true;
    try {
      const transport = getTransport();
      transport.bpm.value = tempo();
      if (transport.state !== 'started') transport.start(when);
    } catch { /* clock is advisory */ }
    node.onended = () => {
      if (sourceNode !== node) return;
      playing = false;
      if (!node.loop) playhead = loopOn() ? loopStart : 0;
    };
  },
  stop() {
    halt();
    playing = false;
    playhead = loopOn() ? loopStart : 0;
    try { getTransport().pause(); } catch { /* */ }
  },
  seek(sec) {
    const end = current ? current.duration : 0;
    let next = Number(sec) || 0;
    if (next < 0) next = 0;
    if (end && next > end) next = end;
    playhead = next;
    if (playing) return api.play();
  },
  setLoop(startSec, endSec) {
    loopStart = Math.max(0, Number(startSec) || 0);
    loopEnd = Math.max(loopStart, Number(endSec) || 0);
    applyLoopToSource();
    scheduleLiveCurves();
  },
  setLoopEnabled(value) {
    loopEnabled = !!value;
    applyLoopToSource();
    scheduleLiveCurves();
  },
  getLoop() {
    return { start: loopStart, end: loopEnd, enabled: !!loopEnabled };
  },
  isPlaying() {
    return !!playing;
  },
  position,
  getChain() {
    const list = [];
    for (let i = 0; i < order.length; i++) {
      const pedal = order[i];
      list.push({
        id: pedal.id,
        type: pedal.type,
        bypass: pedal.bypass,
        knobs: Object.assign({}, pedal.knobs),
        curve: pedal.curve ? {
          knob: pedal.curve.knob,
          points: pedal.curve.points.map((pt) => [pt[0], pt[1]]),
          bars: pedal.curve.bars,
          amount: pedal.curve.amount,
        } : null,
      });
    }
    return list;
  },
  addPedal(type) {
    if (!PEDAL_DEFS[type]) return null;
    if (order.length >= 6) {
      emit('error', { code: 'chain_full', message: 'The chain holds 6 pedals.' });
      return null;
    }
    const pedal = {
      id: 'p' + (seq++),
      type,
      bypass: false,
      knobs: defaultKnobs(type),
      curve: null,
      audio: null,
    };
    if (graph) {
      pedal.audio = graph.build(type, seed);
      pedal.audio.knobs = pedal.knobs;
      pedal.audio.bypass = false;
      graph.applyAll(pedal.audio, tempo(), ctx.currentTime, true, lite);
      if (!batch) graph.pokeReconnect(audios().concat([pedal.audio]), false);
    }
    order.push(pedal);
    emit('chain', api.getChain());
    return pedal.id;
  },
  removePedal(id) {
    const index = order.findIndex((pedal) => pedal.id === id);
    if (index < 0) return;
    const pedal = order[index];
    order.splice(index, 1);
    if (pedal.audio && graph) {
      graph.destroy(pedal.audio);
      if (!batch) graph.pokeReconnect(audios(), false);
    }
    emit('chain', api.getChain());
  },
  movePedal(id, toIndex) {
    const from = order.findIndex((pedal) => pedal.id === id);
    if (from < 0) return;
    const pedal = order.splice(from, 1)[0];
    let dest = toIndex | 0;
    if (dest < 0) dest = 0;
    if (dest > order.length) dest = order.length;
    order.splice(dest, 0, pedal);
    if (graph && !batch) graph.pokeReconnect(audios(), false);
    emit('chain', api.getChain());
  },
  setBypass(id, value) {
    const pedal = findPedal(id);
    if (!pedal) return;
    pedal.bypass = !!value;
    if (pedal.audio) {
      pedal.audio.bypass = pedal.bypass;
      graph.applyKnob(pedal.audio, 'mix', pedal.knobs.mix || 0, {
        time: ctx.currentTime, smooth: true, bpm: tempo(), lite,
      });
    }
    emit('chain', api.getChain());
  },
  setKnob(id, key, value) {
    const pedal = findPedal(id);
    if (!pedal || !Object.prototype.hasOwnProperty.call(pedal.knobs, key)) return;
    pedal.knobs[key] = clamp01(value);
    if (pedal.audio) {
      pedal.audio.knobs = pedal.knobs;
      if (!pedal.curve || pedal.curve.knob !== key) {
        graph.applyKnob(pedal.audio, key, pedal.knobs[key], {
          time: ctx.currentTime, smooth: true, bpm: tempo(), lite,
        });
      } else {
        scheduleLiveCurves();
      }
    }
    emit('chain', api.getChain());
  },
  setCurve(id, curve) {
    const pedal = findPedal(id);
    if (!pedal) return;
    if (!curve) {
      pedal.curve = null;
    } else {
      const points = [];
      const raw = curve.points || [];
      for (let i = 0; i < raw.length; i++) points.push([Number(raw[i][0]), Number(raw[i][1])]);
      points.sort((a, b) => a[0] - b[0]);
      pedal.curve = {
        knob: curve.knob,
        points,
        bars: snapBars(curve.bars),
        amount: Math.max(-1, Math.min(1, Number(curve.amount) || 0)),
      };
    }
    if (pedal.audio) {
      pedal.audio.curve = pedal.curve;
      pedal.audio.knobs = pedal.knobs;
      graph.applyAll(pedal.audio, tempo(), ctx.currentTime, true, lite);
      scheduleLiveCurves();
    }
    emit('chain', api.getChain());
  },
  curvePhase(id) {
    const pedal = findPedal(id);
    if (!pedal || !pedal.curve) return 0;
    const cycle = cycleSeconds(pedal.curve.bars, tempo());
    if (!(cycle > 0)) return 0;
    const t = playing ? position() : (ctx ? ctx.currentTime : 0);
    return ((t % cycle) + cycle) % cycle / cycle;
  },
  getPads: viewPads,
  async chop(mode, opts) {
    const options = opts || {};
    const bpm = tempo();
    const duration = current ? current.duration : 0;
    const fresh = makeSlices(mode, options, bpm, duration);
    const next = [];
    let take = 0;
    for (let i = 0; i < 16; i++) {
      if (pads[i] && pads[i].favorite) {
        pads[i].i = i;
        next.push(pads[i]);
        continue;
      }
      const slice = fresh[take] || { start: 0, end: Math.min(duration || 0.25, 0.25), score: 0 };
      take += 1;
      next.push({
        i,
        start: slice.start,
        end: Math.max(slice.start + 0.02, slice.end),
        score: slice.score || 0,
        favorite: false,
        level: pads[i] ? pads[i].level : 0.8,
        reverse: false,
        key: 0,
        stretch: 1,
        mode: pads[i] ? pads[i].mode : 'trigger',
        ready: false,
        playL: null,
        playR: null,
        token: (pads[i] ? pads[i].token : 0) + 1,
      });
    }
    pads = next;
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      if (pad.favorite && pad.playL) {
        await installPad(pad);
        pad.ready = true;
        continue;
      }
      if (!current || pad.end <= pad.start) {
        pad.ready = true;
        continue;
      }
      const raw = sliceSource(pad.start, pad.end);
      pad.playL = raw.left;
      pad.playR = raw.right;
      await installPad(pad);
      pad.ready = true;
    }
    const view = viewPads();
    emit('pads', view);
    return view;
  },
  setFavorite(index, value) {
    const pad = pads[index | 0];
    if (!pad) return;
    pad.favorite = !!value;
    emit('pads', viewPads());
  },
  async setPad(index, patch) {
    const pad = pads[index | 0];
    if (!pad || !patch) return;
    const prevKey = pad.key;
    const prevStretch = pad.stretch;
    if (patch.level != null) pad.level = Math.max(0, Math.min(1, Number(patch.level)));
    if (patch.reverse != null) pad.reverse = !!patch.reverse;
    if (patch.mode) pad.mode = patch.mode === 'hold' ? 'hold' : 'trigger';
    if (patch.key != null) pad.key = Math.max(-12, Math.min(12, Math.round(patch.key)));
    if (patch.stretch != null) pad.stretch = Math.max(0.5, Math.min(2, Number(patch.stretch)));
    const needsRender = pad.key !== prevKey || Math.abs(pad.stretch - prevStretch) > 0.0001;
    if (!needsRender) {
      emit('pads', viewPads());
      return;
    }
    const token = ++pad.token;
    pad.ready = false;
    emit('pads', viewPads());
    if (!current) {
      pad.ready = true;
      emit('pads', viewPads());
      return;
    }
    const raw = sliceSource(pad.start, pad.end);
    let left = raw.left;
    let right = raw.right;
    if (pad.key !== 0 || Math.abs(pad.stretch - 1) > 0.0001) {
      const rendered = await renderStretch(current.sampleRate, raw.left, raw.right, pad.key, pad.stretch, lite);
      left = rendered.left;
      right = rendered.right;
    }
    if (token !== pad.token) return;
    pad.playL = left;
    pad.playR = right;
    await installPad(pad);
    if (token !== pad.token) return;
    pad.ready = true;
    emit('pads', viewPads());
  },
  trigger(index) { firePad(index | 0, 0); },
  release(index) {
    if (!graph) return;
    const i = index | 0;
    for (let v = 0; v < voices.length; v++) {
      if (voices[v].busy && voices[v].pad === i && voices[v].mode === 1) {
        graph.padParams[v].rel.value = 1;
        voices[v].busy = false;
      }
    }
  },
  keyboard(index, semitones) { firePad(index | 0, Number(semitones) || 0); },
  async bake(opts) {
    const options = opts || {};
    if (options.seed != null) seed = options.seed >>> 0;
    const what = options.what || 'region';
    const withTail = options.tail !== false;
    const sr = current ? current.sampleRate : (ctx ? ctx.sampleRate : 48000);
    let left;
    let right;
    let duration;
    if (what === 'pads') {
      const seqAudio = sequencePads(sr);
      left = seqAudio.left;
      right = seqAudio.right;
      duration = left.length / sr;
    } else if (current) {
      const a = loopEnd > loopStart ? Math.floor(loopStart * sr) : 0;
      let b = loopEnd > loopStart ? Math.floor(loopEnd * sr) : current.left.length;
      if (b > current.left.length) b = current.left.length;
      if (b <= a) b = Math.min(current.left.length, a + 1);
      left = current.left.slice(a, b);
      right = current.right.slice(a, b);
      duration = left.length / sr;
    } else {
      left = new Float32Array(Math.ceil(sr * 0.1));
      right = new Float32Array(left.length);
      duration = left.length / sr;
    }
    const regionStart = what !== 'pads' && loopEnd > loopStart ? loopStart : 0;
    const regionFrames = left.length;
    const renderDuration = withTail ? duration + 10 : duration;
    const rendered = await renderOffline({
      sampleRate: sr,
      duration: renderDuration,
      left,
      right,
      chain: api.getChain(),
      bpm: tempo(),
      seed,
      lite,
      phaseOrigin: regionStart,
      loop: loopState(),
      onProgress: (value) => emit('progress', value),
    });
    let outL = rendered.buffer.getChannelData(0);
    let outR = rendered.buffer.numberOfChannels > 1 ? rendered.buffer.getChannelData(1) : outL;
    if (withTail) {
      const hold = tailHoldSeconds(api.getChain(), tempo());
      const trimmed = trimTail(outL, outR, regionFrames, rendered.buffer.sampleRate, hold);
      outL = trimmed.left;
      outR = trimmed.right;
    } else {
      const n = Math.min(regionFrames, outL.length);
      outL = outL.slice(0, n);
      outR = outR.slice(0, n);
    }
    const id = uid('bake');
    if (!projectId) unownedBakes.add(id);
    const rec = {
      id,
      projectId,
      duration: outL.length / rendered.buffer.sampleRate,
      created: new Date().toISOString(),
      sampleRate: rendered.buffer.sampleRate,
      left: outL,
      right: outR,
      peaks: makePeaks(outL, outR),
      seed,
      spawns: rendered.spawns,
    };
    try {
      await idbPut('bakes', rec);
    } catch (err) {
      if (err && err.code === 'storage_full') throw fail('storage_full', 'Storage is full.');
      throw err;
    }
    bakes.set(id, rec);
    return { id, duration: rec.duration, peaks: rec.peaks, spawns: rec.spawns };
  },
  async exportWav(bakeId) {
    const rec = bakes.get(bakeId) || await idbGet('bakes', bakeId);
    if (!rec) throw new Error('Unknown bake.');
    bakes.set(bakeId, rec);
    return encodeWav24(rec.left, rec.right, rec.sampleRate);
  },
  async loadBake(bakeId) {
    halt();
    playing = false;
    const rec = bakes.get(bakeId) || await idbGet('bakes', bakeId);
    if (!rec) throw new Error('Unknown bake.');
    bakes.set(bakeId, rec);
    return storeChannels({
      name: 'Bake ' + bakeId,
      left: rec.left,
      right: rec.right,
      sampleRate: rec.sampleRate,
    });
  },
  async saveProject(opts) {
    const name = (opts && opts.name) || 'Untitled';
    const now = new Date().toISOString();
    if (!projectId) projectId = uid('proj');
    const existing = await idbGet('projects', projectId);
    const rec = {
      id: projectId,
      name,
      created: existing && existing.created ? existing.created : now,
      updated: now,
      bpm: tempo(),
      key: currentKey(),
      sourceId: current ? current.id : null,
      chain: api.getChain(),
      pads: viewPads(),
      loop: { start: loopStart, end: loopEnd, enabled: !!loopEnabled },
      bpmOverride,
      keyOverride,
      seed,
    };
    try {
      await idbPut('projects', rec);
      await claimUnownedBakes(projectId);
    } catch (err) {
      if (err && err.code === 'storage_full') throw fail('storage_full', 'Storage is full.');
      throw err;
    }
    return projectId;
  },
  async listProjects() {
    const projects = await idbAll('projects');
    const baked = await idbAll('bakes');
    return projects.map((row) => ({
      id: row.id,
      name: row.name,
      updated: row.updated,
      bakeCount: baked.filter((item) => item.projectId === row.id).length,
    })).sort((a, b) => (a.updated < b.updated ? 1 : -1));
  },
  async loadProject(id) {
    halt();
    playing = false;
    const rec = await idbGet('projects', id);
    if (!rec) throw new Error('Unknown project.');
    projectId = rec.id;
    if (rec.seed) seed = rec.seed;
    const savedLoop = rec.loop ? {
      start: Number(rec.loop.start) || 0,
      end: Number(rec.loop.end) || 0,
      enabled: !!rec.loop.enabled,
    } : { start: 0, end: 0, enabled: false };
    if (Object.prototype.hasOwnProperty.call(rec, 'bpmOverride')) bpmOverride = rec.bpmOverride;
    else bpmOverride = rec.bpm == null ? null : rec.bpm;
    if (Object.prototype.hasOwnProperty.call(rec, 'keyOverride')) keyOverride = rec.keyOverride;
    else keyOverride = rec.key == null ? null : rec.key;
    if (rec.sourceId) {
      const src = await idbGet('sources', rec.sourceId);
      if (src) await adopt(src, savedLoop);
      else settleTransport(0, savedLoop);
    } else {
      settleTransport(current ? current.duration : 0, savedLoop);
    }
    batch = true;
    if (graph) {
      for (let i = 0; i < order.length; i++) {
        if (order[i].audio) graph.destroy(order[i].audio);
      }
    }
    order = [];
    const chain = rec.chain || [];
    for (let i = 0; i < chain.length; i++) {
      const spec = chain[i];
      const pedal = {
        id: spec.id || ('p' + (seq++)),
        type: spec.type,
        bypass: !!spec.bypass,
        knobs: Object.assign(defaultKnobs(spec.type), spec.knobs || {}),
        curve: spec.curve || null,
        audio: null,
      };
      if (graph) {
        pedal.audio = graph.build(spec.type, seed);
        pedal.audio.knobs = pedal.knobs;
        pedal.audio.bypass = pedal.bypass;
        pedal.audio.curve = pedal.curve;
        graph.applyAll(pedal.audio, tempo(), ctx.currentTime, false, lite);
      }
      order.push(pedal);
    }
    batch = false;
    if (graph) graph.reconnect(audios());
    const savedPads = rec.pads || [];
    const fresh = blankPads();
    for (let i = 0; i < savedPads.length; i++) {
      const saved = savedPads[i];
      const index = saved.i | 0;
      if (index < 0 || index > 15) continue;
      fresh[index] = Object.assign(fresh[index], saved, { playL: null, playR: null, ready: false });
    }
    pads = fresh;
    if (current) {
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (!(pad.end > pad.start)) {
          pad.ready = true;
          continue;
        }
        const raw = sliceSource(pad.start, pad.end);
        if (pad.key || Math.abs((pad.stretch || 1) - 1) > 0.0001) {
          const rendered = await renderStretch(current.sampleRate, raw.left, raw.right, pad.key || 0, pad.stretch || 1, lite);
          pad.playL = rendered.left;
          pad.playR = rendered.right;
        } else {
          pad.playL = raw.left;
          pad.playR = raw.right;
        }
        await installPad(pad);
        pad.ready = true;
      }
    }
    try { if (toneCtx) getTransport().bpm.value = tempo(); } catch { /* */ }
    scheduleLiveCurves();
    emit('chain', api.getChain());
    emit('pads', viewPads());
    return current ? viewSource(current) : null;
  },
  async deleteProject(id) {
    const rec = await idbGet('projects', id);
    if (!rec) return false;
    const projects = await idbAll('projects');
    const baked = await idbAll('bakes');
    for (let i = 0; i < baked.length; i++) {
      if (baked[i].projectId === id) {
        await idbDelete('bakes', baked[i].id);
        bakes.delete(baked[i].id);
      }
    }
    if (rec.sourceId) {
      const shared = projects.some((row) => row.id !== id && row.sourceId === rec.sourceId);
      if (!shared) await idbDelete('sources', rec.sourceId);
    }
    await idbDelete('projects', id);
    if (projectId === id) projectId = null;
    return true;
  },
  async deleteBake(id) {
    await idbDelete('bakes', id);
    bakes.delete(id);
    return true;
  },
  async listBakes() {
    const rows = await idbAll('bakes');
    return rows.map((row) => ({
      id: row.id,
      projectId: row.projectId || null,
      duration: row.duration,
      created: row.created,
    })).sort((a, b) => (a.created < b.created ? 1 : -1));
  },
  _seed() { return seed; },
  _context() { return ctx; },
  async _tap(which, command) {
    if (!graph) return null;
    const node = which === 'direct' ? graph.directCapture : graph.streamCapture;
    if (command === 'start') return portCall(node, { type: 'start' }, 'started');
    if (command === 'stop') return portCall(node, { type: 'stop' }, 'audio');
    return null;
  },
  _glitch(command) {
    if (!graph || !graph.glitch) return Promise.resolve(null);
    return portCall(graph.glitch, { type: command || 'read' }, 'glitch');
  },
  _takeHits() {
    const frames = hitFrames.slice();
    hitFrames.length = 0;
    return frames;
  },
};

function firePad(index, semi) {
  if (!graph || !graph.padParams.length) return;
  const pad = pads[index];
  if (!pad || !pad.playL) return;
  let slot = -1;
  for (let n = 0; n < voices.length; n++) {
    const idx = (voiceCursor + n) % voices.length;
    if (!voices[idx].busy) {
      slot = idx;
      break;
    }
  }
  if (slot < 0) slot = voiceCursor;
  voiceCursor = (slot + 1) % voices.length;
  const voice = voices[slot];
  voice.busy = true;
  voice.pad = index;
  voice.mode = pad.mode === 'hold' ? 1 : 0;
  const params = graph.padParams[slot];
  params.pad.value = index;
  params.semi.value = semi;
  params.level.value = pad.level;
  params.rev.value = pad.reverse ? 1 : 0;
  params.mode.value = voice.mode;
  params.rel.value = 0;
  params.trig.value = (params.trig.value || 0) + 1;
}

function portCall(node, message, type) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      node.port.removeEventListener('message', onmsg);
      resolve(null);
    }, 5000);
    const onmsg = (event) => {
      if (event.data && event.data.type === type) {
        clearTimeout(timer);
        node.port.removeEventListener('message', onmsg);
        resolve(event.data);
      }
    };
    if (node.port.start) node.port.start();
    node.port.addEventListener('message', onmsg);
    node.port.postMessage(message);
  });
}

function refreshKnobs() {
  if (!graph || !ctx) return;
  const time = ctx.currentTime;
  const bpm = tempo();
  for (let i = 0; i < order.length; i++) {
    const pedal = order[i];
    if (!pedal.audio) continue;
    pedal.audio.knobs = pedal.knobs;
    graph.applyAll(pedal.audio, bpm, time, true, lite);
  }
}

function makeSlices(mode, options, bpm, duration) {
  if (mode === 'slice') return sliceCuts(options.division || '1', bpm, duration);
  if (mode === 'random') return randomCuts(options.seed != null ? options.seed : seed, bpm, duration);
  return findCuts(bpm, duration);
}

function findCuts(bpm, duration) {
  const beat = 60 / Math.max(20, bpm);
  const times = current && current.onsets ? current.onsets : [];
  const strengths = current && current.strengths ? current.strengths : [];
  const scored = [];
  for (let i = 0; i < times.length; i++) {
    const prev = i > 0 ? times[i - 1] : times[i] - beat;
    const next = i < times.length - 1 ? times[i + 1] : times[i] + beat;
    const gap = Math.min(times[i] - prev, next - times[i]);
    const spacing = gap < 0.05 ? 0.15 : Math.min(1, gap / 0.12);
    const strength = strengths[i] != null ? strengths[i] : 1;
    const width = Math.max(0.08, Math.min(beat, Math.max(0.08, next - times[i])));
    scored.push({
      start: times[i],
      end: Math.min(duration || times[i] + width, times[i] + width),
      score: strength * spacing,
    });
  }
  scored.sort((a, b) => b.score - a.score);
  const chosen = scored.slice(0, 16).sort((a, b) => a.start - b.start);
  while (chosen.length < 16) {
    const start = duration ? ((chosen.length * beat) % Math.max(0.05, duration)) : 0;
    chosen.push({ start, end: Math.min(duration || start + beat, start + beat), score: 0 });
  }
  return chosen;
}

function sliceCuts(division, bpm, duration) {
  const beats = division === '1/2' ? 0.5 : division === 'bar' ? 4 : 1;
  const len = Math.max(0.05, beats * (60 / Math.max(20, bpm)));
  let t = position();
  const out = [];
  for (let i = 0; i < 16; i++) {
    let start = duration > 0 ? ((t % duration) + duration) % duration : 0;
    let end = start + len;
    if (duration && end > duration) end = duration;
    if (end - start < 0.02) {
      start = 0;
      end = Math.min(duration || len, len);
    }
    out.push({ start, end, score: 1 });
    t = start + len;
  }
  return out;
}

function randomCuts(chopSeed, bpm, duration) {
  const rand = mulberry32((chopSeed >>> 0) || 1);
  const len = Math.max(0.05, 60 / Math.max(20, bpm));
  const span = Math.max(0, (duration || len) - len);
  const out = [];
  for (let i = 0; i < 16; i++) {
    const start = rand() * (span || 0);
    out.push({
      start,
      end: Math.min(duration || start + len, start + len),
      score: rand(),
    });
  }
  return out;
}

function padIsEmpty(pad) {
  if (!pad || !(pad.end > pad.start)) return true;
  if (!pad.playL || pad.playL.length < 2) return true;
  return false;
}

function sequencePads(sr) {
  let frames = 0;
  const list = [];
  for (let i = 0; i < pads.length; i++) {
    if (padIsEmpty(pads[i])) continue;
    list.push(pads[i]);
    frames += pads[i].playL.length;
  }
  if (!frames) {
    const n = Math.max(1, Math.ceil(sr * 0.2));
    return { left: new Float32Array(n), right: new Float32Array(n) };
  }
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  let offset = 0;
  for (let p = 0; p < list.length; p++) {
    const pad = list[p];
    const n = pad.playL.length;
    for (let i = 0; i < n; i++) {
      const j = pad.reverse ? n - 1 - i : i;
      left[offset + i] = pad.playL[j] * pad.level;
      right[offset + i] = pad.playR[j] * pad.level;
    }
    offset += n;
  }
  return { left, right };
}

if (typeof window !== 'undefined') window.SoundEngine = api;

documentAddListeners();

function documentAddListeners() {
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', () => {
    if (!started) return;
    if (document.visibilityState === 'hidden' && ctx && ctx.state !== 'running') setState('interrupted');
    else syncState();
  });
  window.addEventListener('pagehide', () => {
    if (started) setState('interrupted');
  });
}

export const SoundEngine = api;
