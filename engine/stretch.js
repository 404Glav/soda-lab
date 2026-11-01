import SignalsmithStretch from './vendor/signalsmith-stretch/SignalsmithStretch.js';

let chain = Promise.resolve();

/** Offline Signalsmith render. stretch is a length factor (2 = twice as long). */
export function renderStretch(sampleRate, left, right, semitones, stretch, lite) {
  const run = chain.then(() => renderNow(sampleRate, left, right, semitones, stretch, lite));
  chain = run.then(() => {}, () => {});
  return run;
}

async function renderNow(sampleRate, left, right, semitones, stretch, lite) {
  const factor = stretch > 0 ? stretch : 1;
  const rate = 1 / factor;
  const inDur = left.length / sampleRate;
  const outDur = inDur * factor;
  const pad = 0.35;
  const frames = Math.max(1, Math.ceil((outDur + pad) * sampleRate));
  const offline = new OfflineAudioContext(2, frames, sampleRate);
  let node;
  try {
    node = await SignalsmithStretch(offline, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      channelCount: 2,
    });
  } catch {
    node = await SignalsmithStretch(offline, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      channelCount: 2,
    });
  }
  if (node.configure) {
    try {
      await node.configure({ preset: lite ? 'cheaper' : 'default' });
    } catch {
      /* preset is optional */
    }
  }
  const l = left instanceof Float32Array ? left : new Float32Array(left);
  const r = right instanceof Float32Array ? right : new Float32Array(right);
  await node.addBuffers([l, r]);
  node.connect(offline.destination);
  const latency = typeof node.latency === 'function' ? Number(node.latency()) || 0 : 0;
  if (node.schedule) {
    node.schedule({
      active: true,
      input: 0,
      output: 0,
      rate,
      semitones: semitones || 0,
    });
  } else if (node.start) {
    node.start(0);
  }
  const rendered = await offline.startRendering();
  const trim = Math.max(0, Math.round(latency * sampleRate));
  const keep = Math.max(1, Math.round(outDur * sampleRate));
  const outL = new Float32Array(keep);
  const outR = new Float32Array(keep);
  const srcL = rendered.getChannelData(0);
  const srcR = rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : srcL;
  for (let i = 0; i < keep; i++) {
    const j = i + trim;
    outL[i] = j < srcL.length ? srcL[j] : 0;
    outR[i] = j < srcR.length ? srcR[j] : 0;
  }
  return { left: outL, right: outR, sampleRate, latency };
}
