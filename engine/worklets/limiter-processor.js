/* Lookahead brickwall limiter. Sample peak stays at or under -1 dBFS.
   The delay is the lookahead: round(sampleRate * lookaheadSec) samples. */
const DEFAULT_LOOKAHEAD = 0.003;
const DEFAULT_CEILING_DB = -1;
const DEFAULT_RELEASE = 0.08;

class LimiterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    const lookaheadSec = Number(opts.lookaheadSec) > 0 ? Number(opts.lookaheadSec) : DEFAULT_LOOKAHEAD;
    const ceilingDb = Number.isFinite(opts.ceilingDb) ? opts.ceilingDb : DEFAULT_CEILING_DB;
    const releaseSec = Number(opts.releaseSec) > 0 ? Number(opts.releaseSec) : DEFAULT_RELEASE;
    this.n = Math.max(1, Math.round(sampleRate * lookaheadSec));
    this.bufL = new Float32Array(this.n);
    this.bufR = new Float32Array(this.n);
    this.write = 0;
    this.env = 1;
    this.release = 1 - Math.exp(-1 / (sampleRate * releaseSec));
    // A hair under the nominal ceiling so float rounding cannot print above it.
    this.ceiling = Math.pow(10, ceilingDb / 20) * (1 - 1e-5);
    this.gr = 0;
    this.since = 0;
    this.port.postMessage({
      type: 'ready',
      latency: this.n / sampleRate,
      samples: this.n,
    });
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (!output || !output[0]) return true;
    const input = inputs[0];
    const inL = input && input[0] && input[0].length ? input[0] : null;
    const inR = input && input[1] && input[1].length ? input[1] : inL;
    const outL = output[0];
    const outR = output[1] || outL;
    const n = outL.length;
    const N = this.n;
    const bufL = this.bufL;
    const bufR = this.bufR;
    const ceiling = this.ceiling;
    const rel = this.release;
    let w = this.write;
    let env = this.env;
    for (let i = 0; i < n; i++) {
      let l = inL ? inL[i] : 0;
      let r = inR ? inR[i] : 0;
      if (l > 1e6 || l < -1e6 || l !== l) l = 0;
      if (r > 1e6 || r < -1e6 || r !== r) r = 0;
      let peak = l < 0 ? -l : l;
      const ar = r < 0 ? -r : r;
      if (ar > peak) peak = ar;
      for (let k = 0; k < N; k++) {
        const a = bufL[k] < 0 ? -bufL[k] : bufL[k];
        const b = bufR[k] < 0 ? -bufR[k] : bufR[k];
        if (a > peak) peak = a;
        if (b > peak) peak = b;
      }
      const required = peak > ceiling ? ceiling / peak : 1;
      if (required < env) env = required;
      else env += (required - env) * rel;
      let yL = bufL[w] * env;
      let yR = bufR[w] * env;
      if (yL > ceiling) yL = ceiling;
      else if (yL < -ceiling) yL = -ceiling;
      if (yR > ceiling) yR = ceiling;
      else if (yR < -ceiling) yR = -ceiling;
      outL[i] = yL;
      if (outR !== outL) outR[i] = yR;
      bufL[w] = l;
      bufR[w] = r;
      w++;
      if (w >= N) w = 0;
    }
    this.write = w;
    this.env = env;
    this.gr = env >= 0.999999 ? 0 : 20 * Math.log10(env);
    this.since += n;
    if (this.since >= sampleRate * 0.02) {
      this.since = 0;
      this.port.postMessage({ type: 'gr', gr: this.gr });
    }
    return true;
  }
}

registerProcessor('master-limiter', LimiterProcessor);
