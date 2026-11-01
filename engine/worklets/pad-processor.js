const VOICES = 16;
const ATTACK = 64;
const RELEASE = 220;

class PadProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    const params = [];
    for (let v = 0; v < VOICES; v++) {
      params.push(
        { name: 't' + v, defaultValue: 0, automationRate: 'k-rate' },
        { name: 'rel' + v, defaultValue: 0, automationRate: 'k-rate' },
        { name: 'pad' + v, defaultValue: 0, automationRate: 'k-rate' },
        { name: 'semi' + v, defaultValue: 0, automationRate: 'k-rate' },
        { name: 'level' + v, defaultValue: 0.8, automationRate: 'k-rate' },
        { name: 'rev' + v, defaultValue: 0, automationRate: 'k-rate' },
        { name: 'mode' + v, defaultValue: 0, automationRate: 'k-rate' },
      );
    }
    return params;
  }

  constructor() {
    super();
    this.buffers = [];
    this.voices = [];
    for (let i = 0; i < 16; i++) this.buffers.push({ L: new Float32Array(0), R: new Float32Array(0) });
    for (let v = 0; v < VOICES; v++) {
      this.voices.push({
        on: false,
        lastTrig: 0,
        pos: 0,
        step: 1,
        env: 0,
        releasing: false,
        level: 0.8,
        mode: 0,
        L: null,
        R: null,
      });
    }
    this.port.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === 'buffer') {
        const i = data.i | 0;
        if (i >= 0 && i < 16) {
          this.buffers[i] = { L: data.left, R: data.right };
        }
        this.port.postMessage({ type: 'buf-ack', id: data.id });
      }
    };
  }

  startVoice(v, params) {
    const voice = this.voices[v];
    const pad = Math.round(params['pad' + v][0]);
    const buf = this.buffers[pad];
    if (!buf || buf.L.length < 2) {
      voice.on = false;
      return;
    }
    const rev = params['rev' + v][0] > 0.5;
    const semi = params['semi' + v][0];
    const rate = Math.pow(2, semi / 12);
    voice.L = buf.L;
    voice.R = buf.R;
    voice.step = rev ? -rate : rate;
    voice.pos = rev ? buf.L.length - 1 : 0;
    voice.env = 0;
    voice.releasing = false;
    voice.level = params['level' + v][0];
    voice.mode = params['mode' + v][0] > 0.5 ? 1 : 0;
    voice.on = true;
  }

  process(inputs, outputs, params) {
    const output = outputs[0];
    if (!output || !output[0]) return true;
    const outL = output[0];
    const outR = output[1] || output[0];
    const n = outL.length;
    outL.fill(0);
    if (outR !== outL) outR.fill(0);

    for (let v = 0; v < VOICES; v++) {
      const voice = this.voices[v];
      const trig = params['t' + v][0];
      if (trig !== voice.lastTrig) {
        voice.lastTrig = trig;
        this.startVoice(v, params);
        if (voice.on) this.port.postMessage({ type: 'hit', frame: currentFrame });
      }
      if (!voice.on) continue;
      if (params['rel' + v][0] > 0.5 && voice.mode === 1 && !voice.releasing) voice.releasing = true;
    }

    for (let i = 0; i < n; i++) {
      let sumL = 0;
      let sumR = 0;
      for (let v = 0; v < VOICES; v++) {
        const voice = this.voices[v];
        if (!voice.on || !voice.L) continue;
        const len = voice.L.length;
        let idx = voice.pos;
        if (idx < 0 || idx >= len) {
          if (voice.mode === 1 && !voice.releasing) {
            idx = ((idx % len) + len) % len;
            voice.pos = idx;
          } else {
            voice.on = false;
            this.port.postMessage({ type: 'end', voice: v });
            continue;
          }
        }
        const i0 = idx | 0;
        const frac = idx - i0;
        const dir = voice.step >= 0 ? 1 : -1;
        let i1 = i0 + dir;
        if (i1 < 0) i1 = 0;
        else if (i1 >= len) i1 = len - 1;
        const sL = voice.L[i0] * (1 - frac) + voice.L[i1] * frac;
        const sR = voice.R[i0] * (1 - frac) + voice.R[i1] * frac;
        if (voice.releasing) voice.env -= 1 / RELEASE;
        else if (voice.env < 1) voice.env += 1 / ATTACK;
        if (voice.env <= 0) {
          voice.on = false;
          this.port.postMessage({ type: 'end', voice: v });
          continue;
        }
        const g = voice.env * voice.level;
        sumL += sL * g;
        sumR += sR * g;
        voice.pos += voice.step;
      }
      outL[i] = Math.tanh(sumL);
      if (outR !== outL) outR[i] = Math.tanh(sumR);
    }
    return true;
  }
}

registerProcessor('pad-voices', PadProcessor);
