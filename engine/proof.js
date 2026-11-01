import { SoundEngine } from './index.js';
import { encodeWav16 } from './wav.js';

const F0 = 196;

export async function runProof(options) {
  const log = options.log || (() => {});
  const out = { checks: {}, notes: [] };
  const say = (line) => {
    out.notes.push(line);
    log(line);
  };

  const sessionOrder = [];
  installSessionProbe(sessionOrder);

  say('state before start: ' + SoundEngine.state);
  await SoundEngine.start();
  say('state after start: ' + SoundEngine.state);
  say('latency ' + JSON.stringify(SoundEngine.latency()));
  say('audioSession order: ' + sessionOrder.join(' | '));
  out.checks.session = {
    state: SoundEngine.state,
    order: sessionOrder.slice(),
    playbackBeforeResume: sessionOrder.indexOf('type:playback') !== -1
      && sessionOrder.indexOf('type:playback') < sessionOrder.indexOf('resume:playback'),
  };

  const sr = SoundEngine._context().sampleRate;
  say('sample rate ' + sr);
  out.sampleRate = sr;

  await checkTooLarge(say, out);
  await checkMono(say, out, sr);

  const drums = makeDrums(sr);
  const drumFile = new File([encodeWav16([drums.left, drums.right], sr)], 'drums.wav', { type: 'audio/wav' });
  const drumSource = await SoundEngine.loadFile(drumFile);
  const hitMatch = matchHits(drumSource.onsets, drums.hits, 0.02);
  say('drums bpm ' + drumSource.bpm + ' key ' + drumSource.key + ' onsets ' + drumSource.onsets.length);
  say('hit match missed ' + hitMatch.missed + ' maxDeltaMs ' + (hitMatch.max * 1000).toFixed(2));
  out.checks.drums = {
    bpm: drumSource.bpm,
    key: drumSource.key,
    onsets: drumSource.onsets,
    expected: drums.hits,
    missed: hitMatch.missed,
    maxDeltaMs: hitMatch.max * 1000,
    deltasMs: hitMatch.deltas.map((d) => Math.round(d * 10000) / 10),
  };

  await SoundEngine.seek(0);
  const found = await SoundEngine.chop('find');
  const fav = found[0];
  await SoundEngine.setFavorite(0, true);
  const again = await SoundEngine.chop('find');
  const sliced = await SoundEngine.chop('slice', { division: '1' });
  const randomA = await SoundEngine.chop('random', { seed: 99 });
  const randomB = await SoundEngine.chop('random', { seed: 99 });
  const randomC = await SoundEngine.chop('random', { seed: 100 });
  out.checks.chop = {
    findCount: found.length,
    favoriteKept: again[0].start === fav.start && again[0].favorite === true,
    sliceLen: sliced[1].end - sliced[1].start,
    randomStable: Math.abs(randomA[3].start - randomB[3].start) < 1e-9,
    randomChanges: Math.abs(randomA[3].start - randomC[3].start) > 1e-4,
  };
  say('chop favoriteKept ' + out.checks.chop.favoriteKept + ' slice ' + out.checks.chop.sliceLen.toFixed(3));

  await clearChain();
  const prism = SoundEngine.addPedal('prism');
  SoundEngine.setKnob(prism, 'pitch', 1);
  SoundEngine.setKnob(prism, 'space', 0);
  SoundEngine.setKnob(prism, 'mix', 0.5);
  SoundEngine.setKnob(prism, 'density', 0.45);
  SoundEngine.setKnob(prism, 'time', 0.5);
  SoundEngine.setKnob(prism, 'repeats', 0.72);
  SoundEngine.setKnob(prism, 'shape', 0.4);
  SoundEngine.setKnob(prism, 'wobble', 0);
  SoundEngine.setKnob(prism, 'tone', 1);
  await sleep(180);

  const hello = makeHello(sr);
  const helloFile = new File([encodeWav16([hello.left, hello.right], sr)], 'hello.wav', { type: 'audio/wav' });
  await SoundEngine.loadFile(helloFile);
  SoundEngine.setLoop(0, 0);

  const wet = await SoundEngine.bake({ seed: SoundEngine._seed(), what: 'region' });
  const wetBuf = await channelsOf(wet.id);
  SoundEngine.setKnob(prism, 'mix', 0);
  await sleep(120);
  const dry = await SoundEngine.bake({ seed: SoundEngine._seed(), what: 'region' });
  const dryBuf = await channelsOf(dry.id);
  SoundEngine.setKnob(prism, 'mix', 0.5);
  await sleep(80);

  const tailA = Math.floor(0.75 * sr);
  const tailB = Math.floor(2.6 * sr);
  const wetTail = wetBuf.left.subarray(tailA, tailB);
  const spec = fftMag(wetTail);
  const eDown = band(spec, sr, 80, 120);
  const eUp = band(spec, sr, 360, 440);
  const eFund = band(spec, sr, 170, 230);
  const dryTailRms = rms(dryBuf.left, tailA, tailB);
  const wetTailRms = rms(wetBuf.left, tailA, tailB);
  say('octave tail rms wet ' + wetTailRms.toFixed(4) + ' dry ' + dryTailRms.toFixed(5));
  say('octave bands down ' + eDown.toFixed(4) + ' fund ' + eFund.toFixed(4) + ' up ' + eUp.toFixed(4));
  out.checks.octave = {
    wetTailRms: wetTailRms,
    dryTailRms: dryTailRms,
    energyDown: eDown,
    energyUp: eUp,
    energyFund: eFund,
    downVsDry: eDown / (band(fftMag(dryBuf.left.subarray(tailA, tailB)), sr, 80, 120) + 1e-12),
    upVsDry: eUp / (band(fftMag(dryBuf.left.subarray(tailA, tailB)), sr, 360, 440) + 1e-12),
  };

  const click = makeClick(sr);
  const clickFile = new File([encodeWav16([click, click], sr)], 'click.wav', { type: 'audio/wav' });
  await SoundEngine.loadFile(clickFile);
  SoundEngine.setKnob(prism, 'mix', 1);
  SoundEngine.setKnob(prism, 'space', 0);
  SoundEngine.setKnob(prism, 'repeats', 0.2);
  SoundEngine.setKnob(prism, 'time', 1 / 6);
  SoundEngine.setKnob(prism, 'shape', 0.15);
  SoundEngine.setKnob(prism, 'density', 0);
  await sleep(120);
  const sparse = await SoundEngine.bake({ seed: 7, what: 'region' });
  const sparseCh = await channelsOf(sparse.id);
  SoundEngine.setKnob(prism, 'density', 1);
  await sleep(120);
  const dense = await SoundEngine.bake({ seed: 7, what: 'region' });
  const denseCh = await channelsOf(dense.id);
  const sparseHits = countBursts(sparseCh.left, sr);
  const denseHits = countBursts(denseCh.left, sr);
  say('density bursts low ' + sparseHits + ' high ' + denseHits + ' spawns ' + sparse.spawns + ' / ' + dense.spawns);
  out.checks.density = {
    lowBursts: sparseHits,
    highBursts: denseHits,
    lowSpawns: sparse.spawns || 0,
    highSpawns: dense.spawns || 0,
    highMeanGapMs: meanGap(denseCh.left, sr),
  };

  await SoundEngine.loadFile(helloFile);
  SoundEngine.setKnob(prism, 'mix', 0.5);
  SoundEngine.setKnob(prism, 'density', 0.4);
  SoundEngine.setKnob(prism, 'time', 0.5);
  SoundEngine.setKnob(prism, 'repeats', 0.55);
  SoundEngine.setKnob(prism, 'space', 0);
  await sleep(150);
  const space0 = await SoundEngine.bake({ seed: 11, what: 'region' });
  const s0 = await channelsOf(space0.id);
  SoundEngine.setKnob(prism, 'space', 1);
  await sleep(150);
  const space1 = await SoundEngine.bake({ seed: 11, what: 'region' });
  const s1 = await channelsOf(space1.id);
  const nullWin = Math.floor(0.03 * sr);
  const nullDb = diffDb(s0.left, s1.left, 0, nullWin);
  const bodyDb = diffDb(s0.left, s1.left, 0, Math.floor(0.5 * sr));
  const tail0 = rms(s0.left, Math.floor(1.05 * sr), Math.floor(2.7 * sr));
  const tail1 = rms(s1.left, Math.floor(1.05 * sr), Math.floor(2.7 * sr));
  say('space null dB ' + nullDb.toFixed(1) + ' body ' + bodyDb.toFixed(1) + ' tail0 ' + tail0.toFixed(4) + ' tail1 ' + tail1.toFixed(4));
  out.checks.space = {
    predelayNullDb: nullDb,
    dryBodyDiffDb: bodyDb,
    tailRmsSpace0: tail0,
    tailRmsSpace1: tail1,
    tailDb: 20 * Math.log10((tail1 + 1e-12) / (tail0 + 1e-12)),
  };

  const noise = makeNoise(sr, 1.2);
  const noiseFile = new File([encodeWav16([noise, noise], sr)], 'noise.wav', { type: 'audio/wav' });
  await SoundEngine.loadFile(noiseFile);
  SoundEngine.setKnob(prism, 'space', 0);
  SoundEngine.setKnob(prism, 'mix', 0);
  SoundEngine.setKnob(prism, 'tone', 0);
  await sleep(120);
  const toneDryA = await channelsOf((await SoundEngine.bake({ seed: 3, what: 'region' })).id);
  SoundEngine.setKnob(prism, 'tone', 1);
  await sleep(80);
  const toneDryB = await channelsOf((await SoundEngine.bake({ seed: 3, what: 'region' })).id);
  const dryNull = diffDb(toneDryA.left, toneDryB.left, 0, Math.min(toneDryA.left.length, toneDryB.left.length));
  SoundEngine.setKnob(prism, 'mix', 1);
  SoundEngine.setKnob(prism, 'density', 0.85);
  SoundEngine.setKnob(prism, 'time', 0.5);
  SoundEngine.setKnob(prism, 'tone', 0);
  await sleep(120);
  const dark = await channelsOf((await SoundEngine.bake({ seed: 3, what: 'region' })).id);
  SoundEngine.setKnob(prism, 'tone', 1);
  await sleep(120);
  const bright = await channelsOf((await SoundEngine.bake({ seed: 3, what: 'region' })).id);
  const hfDark = band(fftMag(dark.left), sr, 7000, 14000);
  const hfBright = band(fftMag(bright.left), sr, 7000, 14000);
  say('tone dry null dB ' + dryNull.toFixed(1) + ' hf dark ' + hfDark.toFixed(3) + ' bright ' + hfBright.toFixed(3));
  out.checks.tone = {
    dryNullDb: dryNull,
    hfDark: hfDark,
    hfBright: hfBright,
    hfDb: 20 * Math.log10((hfBright + 1e-12) / (hfDark + 1e-12)),
  };

  SoundEngine.setKnob(prism, 'mix', 0.5);
  SoundEngine.setKnob(prism, 'tone', 1);
  SoundEngine.setKnob(prism, 'space', 0);
  SoundEngine.setKnob(prism, 'density', 0.4);
  SoundEngine.setKnob(prism, 'wobble', 0);
  await sleep(200);
  await SoundEngine.seek(0);
  await SoundEngine._tap('stream', 'start');
  await SoundEngine._tap('direct', 'start');
  await SoundEngine.play();
  await sleep((hello.left.length / sr) * 1000 + 250);
  const liveStream = await SoundEngine._tap('stream', 'stop');
  const liveDirect = await SoundEngine._tap('direct', 'stop');
  SoundEngine.stop();
  const baked = await SoundEngine.bake({ seed: SoundEngine._seed(), what: 'region' });
  const bakeCh = await channelsOf(baked.id);
  const streamCmp = liveStream && liveStream.left ? compareLive(bakeCh.left, liveStream.left, sr) : { db: null, error: 'no stream' };
  const directCmp = liveDirect && liveDirect.left ? compareLive(bakeCh.left, liveDirect.left, sr) : { db: null, error: 'no direct' };
  say('live vs bake stream ' + JSON.stringify(streamCmp) + ' direct ' + JSON.stringify(directCmp));
  out.checks.liveBake = { stream: streamCmp, direct: directCmp, seed: SoundEngine._seed() };

  SoundEngine.setKnob(prism, 'mix', 0.35);
  SoundEngine.setCurve(prism, {
    knob: 'density',
    points: SoundEngine.CURVE_PRESETS.ramp,
    bars: 1,
    amount: 1,
  });
  await sleep(50);
  const phaseA = SoundEngine.curvePhase(prism);
  await sleep(180);
  const phaseB = SoundEngine.curvePhase(prism);
  const curved = await SoundEngine.bake({ seed: 5, what: 'region' });
  SoundEngine.setCurve(prism, null);
  say('curve phase ' + phaseA.toFixed(3) + ' -> ' + phaseB.toFixed(3));
  out.checks.curve = { phaseA, phaseB, moved: Math.abs(phaseB - phaseA) > 0.01, bakeId: curved.id };
  say('format 1/8=' + SoundEngine.formatKnob('prism', 'time', 0.5) + ' 62%=' + SoundEngine.formatKnob('prism', 'mix', 0.62));

  await SoundEngine.loadFile(drumFile);
  await SoundEngine.seek(0);
  const pads = await SoundEngine.chop('slice', { division: '1' });
  const pending = SoundEngine.setPad(1, { key: 7, stretch: 1.25, level: 0.7, reverse: true, mode: 'trigger' });
  const readyDuring = SoundEngine.getPads()[1].ready;
  SoundEngine.trigger(1);
  await pending;
  const readyAfter = SoundEngine.getPads()[1].ready;
  SoundEngine.keyboard(1, 4);
  SoundEngine.keyboard(1, -5);
  say('pad ready during render ' + readyDuring + ' after ' + readyAfter);
  out.checks.pads = { readyDuring, readyAfter, count: pads.length };

  const wavBlob = await SoundEngine.exportWav(baked.id);
  const wavInfo = parseWav(await wavBlob.arrayBuffer());
  const wavSeconds = wavInfo.dataSize / (wavInfo.sampleRate * wavInfo.channels * (wavInfo.bits / 8));
  say('wav ' + wavInfo.bits + 'bit ' + wavInfo.sampleRate + 'Hz ' + wavSeconds.toFixed(3) + 's ' + wavBlob.type);
  out.checks.wav = Object.assign({ seconds: wavSeconds, type: wavBlob.type, size: wavBlob.size }, wavInfo);

  const projectId = await SoundEngine.saveProject({ name: 'Proof project' });
  const before = {
    bpm: 97,
    key: 'F# minor',
    mix: SoundEngine.getChain()[0] ? SoundEngine.getChain()[0].knobs.mix : null,
  };
  SoundEngine.setBpm(97);
  SoundEngine.setKey('F# minor');
  if (SoundEngine.getChain()[0]) SoundEngine.setKnob(SoundEngine.getChain()[0].id, 'mix', 0.42);
  const savedId = await SoundEngine.saveProject({ name: 'Proof project' });
  SoundEngine.setBpm(140);
  SoundEngine.setKnob(SoundEngine.getChain()[0].id, 'mix', 0.1);
  await SoundEngine.loadProject(savedId);
  const restored = SoundEngine.getChain()[0];
  const projects = await SoundEngine.listProjects();
  const listed = projects.filter((row) => row.id === savedId)[0];
  const sources = await SoundEngine.listSources();
  const reloaded = await SoundEngine.loadSource(sources[0].id);
  const linked = await SoundEngine.bake({ what: 'region', seed: 1 });
  const bakes = await SoundEngine.listBakes();
  const projectsAfter = await SoundEngine.listProjects();
  const listedAfter = projectsAfter.filter((row) => row.id === savedId)[0];
  say('project restored mix ' + (restored && restored.knobs.mix) + ' bakes ' + (listedAfter && listedAfter.bakeCount));
  out.checks.project = {
    id: projectId,
    sameId: projectId === savedId,
    mix: restored && restored.knobs.mix,
    chainType: restored && restored.type,
    list: listedAfter || listed,
    linkedBake: bakes.filter((row) => row.id === linked.id)[0] || null,
    sourceReload: reloaded && reloaded.duration > 0 && reloaded.peaks && reloaded.peaks.length === 4096,
    before,
  };

  const chainFullErrors = [];
  const onErr = (e) => chainFullErrors.push(e.code);
  SoundEngine.on('error', onErr);
  await clearChain();
  const ids = [];
  for (const type of ['prism', 'reel', 'cathedral', 'fizz', 'crusher', 'sweep']) ids.push(SoundEngine.addPedal(type));
  const seventh = SoundEngine.addPedal('prism');
  SoundEngine.off('error', onErr);
  out.checks.chainFull = { count: SoundEngine.getChain().length, seventh, errors: chainFullErrors, ids };

  try {
    await SoundEngine.recordStart();
    await sleep(280);
    const mic = await SoundEngine.recordStop();
    out.checks.mic = { duration: mic.duration, peaks: mic.peaks.length, sessionBack: sessionType() };
    say('mic ' + mic.duration.toFixed(3) + 's session ' + sessionType());
  } catch (err) {
    out.checks.mic = { error: String(err && err.message || err) };
    say('mic failed ' + out.checks.mic.error);
  }

  if (!options.skipStress) {
    out.checks.stress = await stress(say, sr);
  } else {
    out.checks.stress = { skipped: true };
    say('stress skipped');
  }

  out.checks.console = { errors: (window.__errors || []).slice() };
  say('console errors ' + out.checks.console.errors.length);
  return out;
}

async function stress(say, sr) {
  const noise = makeNoise(sr, 2);
  const file = new File([encodeWav16([noise, noise], sr)], 'loop.wav', { type: 'audio/wav' });
  await SoundEngine.loadFile(file);
  await clearChain();
  const types = ['prism', 'reel', 'cathedral', 'fizz', 'crusher', 'sweep'];
  const ids = types.map((type) => SoundEngine.addPedal(type));
  SoundEngine.setKnob(ids[0], 'mix', 0.45);
  SoundEngine.setKnob(ids[0], 'density', 0.35);
  SoundEngine.setKnob(ids[0], 'repeats', 0.4);
  SoundEngine.setKnob(ids[0], 'space', 0.35);
  SoundEngine.setKnob(ids[1], 'mix', 0.4);
  SoundEngine.setKnob(ids[1], 'feedback', 0.35);
  SoundEngine.setKnob(ids[2], 'mix', 0.3);
  SoundEngine.setKnob(ids[3], 'mix', 0.35);
  SoundEngine.setKnob(ids[3], 'gain', 0.3);
  SoundEngine.setKnob(ids[4], 'mix', 0.4);
  SoundEngine.setKnob(ids[5], 'mix', 0.55);
  SoundEngine.setLoop(0, 2);
  await SoundEngine._glitch('reset');
  const ctx = SoundEngine._context();
  const capacity = hookCapacity(ctx);
  await SoundEngine.seek(0);
  await SoundEngine.play();
  say('stress running 120s');
  await sleep(120000);
  SoundEngine.stop();
  const glitch = await SoundEngine._glitch('read');
  if (capacity) {
    try { capacity.rc.stop(); } catch { /* */ }
  }
  const summary = {
    glitch,
    capacity: capacity ? capacity.samples : null,
    capacityApi: capacity ? capacity.api : 'missing',
  };
  say('stress ' + JSON.stringify({
    nonfinite: glitch && glitch.nonfinite,
    jumps: glitch && glitch.jumps,
    dropouts: glitch && glitch.dropouts,
    rms: glitch && glitch.rms,
    capacityPoints: capacity ? capacity.samples.length : 0,
  }));
  return summary;
}

function hookCapacity(ctx) {
  const rc = ctx && ctx.renderCapacity;
  if (!rc || typeof rc.start !== 'function') return null;
  const samples = [];
  const handler = (event) => {
    samples.push({
      averageLoad: event.averageLoad,
      peakLoad: event.peakLoad,
      underrunRatio: event.underrunRatio,
      timestamp: event.timestamp,
    });
  };
  rc.addEventListener('update', handler);
  try { rc.start({ updateInterval: 1 }); } catch { return null; }
  return { samples, rc, api: 'renderCapacity' };
}

function installSessionProbe(order) {
  const session = {
    _t: '',
    set type(value) {
      order.push('type:' + value);
      this._t = value;
    },
    get type() { return this._t; },
  };
  try {
    Object.defineProperty(navigator, 'audioSession', { configurable: true, get() { return session; } });
  } catch { /* native session stays */ }
  const Orig = window.AudioContext;
  window.AudioContext = function PatchedAudioContext(options) {
    order.push('new:' + (navigator.audioSession && navigator.audioSession.type));
    const real = new Orig(options);
    const resume = real.resume.bind(real);
    real.resume = function () {
      order.push('resume:' + (navigator.audioSession && navigator.audioSession.type));
      return resume();
    };
    window.AudioContext = Orig;
    return real;
  };
}

function sessionType() {
  return navigator.audioSession ? navigator.audioSession.type : '';
}

async function clearChain() {
  const chain = SoundEngine.getChain();
  for (let i = chain.length - 1; i >= 0; i--) SoundEngine.removePedal(chain[i].id);
  await sleep(50);
}

async function channelsOf(id) {
  const blob = await SoundEngine.exportWav(id);
  const buf = await blob.arrayBuffer();
  return decodeWav24(buf);
}

async function checkTooLarge(say, out) {
  const errors = [];
  const onErr = (e) => errors.push(e.code);
  SoundEngine.on('error', onErr);
  let sizeRejected = false;
  try {
    const big = new File([new Uint8Array(50 * 1024 * 1024 + 16)], 'big.wav', { type: 'audio/wav' });
    await SoundEngine.loadFile(big);
  } catch (err) {
    sizeRejected = err && err.code === 'too_large';
  }
  let durationRejected = false;
  try {
    const sr = 8000;
    const seconds = 301;
    const silence = new Float32Array(Math.floor(sr * seconds));
    const file = new File([encodeWav16([silence], sr)], 'long.wav', { type: 'audio/wav' });
    await SoundEngine.loadFile(file);
  } catch (err) {
    durationRejected = err && err.code === 'too_large';
  }
  SoundEngine.off('error', onErr);
  out.checks.limits = { sizeRejected, durationRejected, errors };
  say('limits size ' + sizeRejected + ' duration ' + durationRejected);
}

async function checkMono(say, out, sr) {
  const mono = new Float32Array(Math.floor(sr * 0.3));
  for (let i = 0; i < mono.length; i++) mono[i] = Math.sin((2 * Math.PI * 220 * i) / sr) * 0.4;
  const file = new File([encodeWav16([mono], sr)], 'mono.wav', { type: 'audio/wav' });
  const source = await SoundEngine.loadFile(file);
  out.checks.mono = { duration: source.duration, peaks: source.peaks.length };
  say('mono peaks ' + source.peaks.length + ' dur ' + source.duration.toFixed(3));
}

function makeHello(sr) {
  const dur = 3.1;
  const n = Math.floor(sr * dur);
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  const voice = Math.floor(sr * 0.55);
  const res = [{ y1: 0, y2: 0 }, { y1: 0, y2: 0 }, { y1: 0, y2: 0 }];
  const formants = [700, 1200, 2600];
  const radii = [0.97, 0.96, 0.94];
  let phase = 0;
  for (let i = 0; i < voice; i++) {
    phase += F0 / sr;
    if (phase >= 1) phase -= 1;
    let x = 0;
    for (let h = 1; h <= 14; h++) x += Math.sin(2 * Math.PI * (phase * h)) / h;
    x *= 0.25;
    let y = x;
    for (let f = 0; f < formants.length; f++) {
      const r = radii[f];
      const a = 2 * Math.cos((2 * Math.PI * formants[f]) / sr) * r;
      const o = y + a * res[f].y1 - r * r * res[f].y2;
      res[f].y2 = res[f].y1;
      res[f].y1 = o;
      y = o * (1 - r);
    }
    const env = Math.min(1, i / (sr * 0.02)) * Math.min(1, (voice - i) / (sr * 0.04));
    const s = Math.tanh(y * env * 3.2) * 0.7;
    left[i] = s;
    right[i] = s;
  }
  return { left, right };
}

function makeDrums(sr) {
  const bpm = 120;
  const beat = 60 / bpm;
  const hits = [];
  const n = Math.floor(sr * beat * 16);
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  for (let h = 0; h < 16; h++) {
    const t = h * beat;
    hits.push(t);
    const start = Math.floor(t * sr);
    const len = Math.floor(sr * 0.09);
    for (let i = 0; i < len && start + i < n; i++) {
      const e = Math.exp(-i / (sr * 0.016));
      const f = 80 + 90 * Math.exp(-i / (sr * 0.01));
      const s = Math.sin((2 * Math.PI * f * i) / sr) * e;
      const click = i < 12 ? (1 - i / 12) * 0.45 : 0;
      left[start + i] += (s + click) * 0.95;
      right[start + i] += (s * 0.9 + click) * 0.95;
    }
  }
  return { left, right, hits, bpm };
}

function makeClick(sr) {
  const n = Math.floor(sr * 2.2);
  const out = new Float32Array(n);
  const len = Math.floor(sr * 0.012);
  for (let i = 0; i < len; i++) {
    const e = 1 - i / len;
    out[i] = (Math.random() * 2 - 1) * e * 0.9;
  }
  return out;
}

function makeNoise(sr, seconds) {
  const n = Math.floor(sr * seconds);
  const out = new Float32Array(n);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    s = s * 0.2 + white * 0.8;
    out[i] = Math.tanh(s * 1.4) * 0.6;
  }
  return out;
}

function matchHits(detected, expected, tol) {
  const deltas = [];
  let missed = 0;
  let max = 0;
  for (let i = 0; i < expected.length; i++) {
    let best = Infinity;
    for (let j = 0; j < detected.length; j++) {
      const d = Math.abs(detected[j] - expected[i]);
      if (d < best) best = d;
    }
    if (!Number.isFinite(best)) best = 999;
    deltas.push(best);
    if (best > max) max = best;
    if (best > tol) missed++;
  }
  return { deltas, missed, max };
}

function countBursts(channel, sr) {
  const hop = Math.max(1, Math.floor(sr * 0.008));
  const env = [];
  for (let i = 0; i < channel.length; i += hop) {
    let s = 0;
    const n = Math.min(hop, channel.length - i);
    for (let j = 0; j < n; j++) s += channel[i + j] * channel[i + j];
    env.push(Math.sqrt(s / n));
  }
  let max = 0;
  for (let i = 0; i < env.length; i++) if (env[i] > max) max = env[i];
  const th = max * 0.28;
  let count = 0;
  let last = -10;
  for (let i = 1; i < env.length - 1; i++) {
    if (env[i] > th && env[i] >= env[i - 1] && env[i] > env[i + 1] && i - last > 2) {
      count++;
      last = i;
    }
  }
  return count;
}

function meanGap(channel, sr) {
  const hop = Math.max(1, Math.floor(sr * 0.008));
  const times = [];
  const env = [];
  for (let i = 0; i < channel.length; i += hop) {
    let s = 0;
    const n = Math.min(hop, channel.length - i);
    for (let j = 0; j < n; j++) s += channel[i + j] * channel[i + j];
    env.push(Math.sqrt(s / n));
  }
  let max = 0;
  for (let i = 0; i < env.length; i++) if (env[i] > max) max = env[i];
  const th = max * 0.28;
  let last = -10;
  for (let i = 1; i < env.length - 1; i++) {
    if (env[i] > th && env[i] >= env[i - 1] && env[i] > env[i + 1] && i - last > 2) {
      times.push((i * hop) / sr);
      last = i;
    }
  }
  if (times.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < times.length; i++) sum += times[i] - times[i - 1];
  return (sum / (times.length - 1)) * 1000;
}

function rms(buf, a, b) {
  const end = Math.min(buf.length, b);
  const start = Math.max(0, a);
  let s = 0;
  let n = 0;
  for (let i = start; i < end; i++) {
    s += buf[i] * buf[i];
    n++;
  }
  return n ? Math.sqrt(s / n) : 0;
}

function diffDb(a, b, start, end) {
  const stop = Math.min(end, a.length, b.length);
  let s = 0;
  let ref = 0;
  let n = 0;
  for (let i = start; i < stop; i++) {
    const d = a[i] - b[i];
    s += d * d;
    ref += a[i] * a[i];
    n++;
  }
  if (!n) return 0;
  const diff = Math.sqrt(s / n);
  const base = Math.sqrt(ref / n);
  if (base < 1e-8) return diff < 1e-7 ? -120 : 0;
  return 20 * Math.log10((diff + 1e-12) / base);
}

function compareLive(bake, live, sr) {
  const maxLag = Math.floor(sr * 0.25);
  const lag = alignLag(bake, live, maxLag);
  const start = Math.max(0, -lag) + Math.floor(sr * 0.02);
  const end = Math.min(bake.length, live.length - lag) - Math.floor(sr * 0.02);
  let sb = 0;
  let sl = 0;
  let n = 0;
  for (let i = start; i < end; i++) {
    const b = bake[i];
    const l = live[i + lag];
    sb += b * b;
    sl += l * l;
    n++;
  }
  const rb = n ? Math.sqrt(sb / n) : 0;
  const rl = n ? Math.sqrt(sl / n) : 0;
  const db = 20 * Math.log10((rl + 1e-12) / (rb + 1e-12));
  return { db, lag, bakeRms: rb, liveRms: rl, samples: n };
}

function alignLag(a, b, maxLag) {
  let best = 0;
  let bestC = -Infinity;
  const step = 16;
  for (let lag = -maxLag; lag <= maxLag; lag += step) {
    let c = 0;
    const start = Math.max(0, -lag);
    const end = Math.min(a.length, b.length - lag);
    for (let i = start; i < end; i += 32) c += a[i] * b[i + lag];
    if (c > bestC) {
      bestC = c;
      best = lag;
    }
  }
  return best;
}

function fftMag(samples) {
  let n = 1;
  while (n < samples.length) n <<= 1;
  if (n > 65536) n = 65536;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  const len = Math.min(samples.length, n);
  for (let i = 0; i < len; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (len - 1 || 1)));
    re[i] = samples[i] * w;
  }
  for (let size = 1; size < n; size <<= 1) {
    const ang = -Math.PI / size;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += size << 1) {
      let curRe = 1;
      let curIm = 0;
      for (let j = 0; j < size; j++) {
        const even = i + j;
        const odd = even + size;
        const tre = curRe * re[odd] - curIm * im[odd];
        const tim = curRe * im[odd] + curIm * re[odd];
        re[odd] = re[even] - tre;
        im[odd] = im[even] - tim;
        re[even] += tre;
        im[even] += tim;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
  const mag = new Float32Array(n / 2);
  for (let i = 0; i < mag.length; i++) mag[i] = Math.hypot(re[i], im[i]);
  return { mag, n };
}

function band(spec, sr, f0, f1) {
  const { mag, n } = spec;
  const a = Math.max(0, Math.floor((f0 / sr) * n));
  const b = Math.min(mag.length - 1, Math.ceil((f1 / sr) * n));
  let e = 0;
  for (let i = a; i <= b; i++) e += mag[i] * mag[i];
  return e;
}

function parseWav(buf) {
  const view = new DataView(buf);
  const text = (offset, length) => {
    let s = '';
    for (let i = 0; i < length; i++) s += String.fromCharCode(view.getUint8(offset + i));
    return s;
  };
  return {
    riff: text(0, 4),
    wave: text(8, 4),
    fmt: text(12, 4),
    audioFormat: view.getUint16(20, true),
    channels: view.getUint16(22, true),
    sampleRate: view.getUint32(24, true),
    bits: view.getUint16(34, true),
    data: text(36, 4),
    dataSize: view.getUint32(40, true),
  };
}

function decodeWav24(buf) {
  const info = parseWav(buf);
  const frames = info.dataSize / (info.channels * 3);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  const view = new DataView(buf);
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    left[i] = read24(view, offset);
    offset += 3;
    if (info.channels > 1) {
      right[i] = read24(view, offset);
      offset += 3;
    } else right[i] = left[i];
  }
  return { left, right, info };
}

function read24(view, offset) {
  const b0 = view.getUint8(offset);
  const b1 = view.getUint8(offset + 1);
  const b2 = view.getUint8(offset + 2);
  let n = b0 | (b1 << 8) | (b2 << 16);
  if (n & 0x800000) n |= ~0xffffff;
  return n / 0x800000;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
