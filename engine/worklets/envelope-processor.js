class EnvelopeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'follow', defaultValue: 0.01, minValue: 0.00005, maxValue: 1, automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();
    this.env = 0;
    this.zeros = new Float32Array(2048);
  }

  process(inputs, outputs, params) {
    const output = outputs[0];
    if (!output || !output[0]) return true;
    const input = inputs[0] || [];
    const inL = input[0] && input[0].length ? input[0] : this.zeros;
    const inR = input[1] && input[1].length ? input[1] : inL;
    const out = output[0];
    const follow = params.follow[0];
    let env = this.env;
    const n = out.length;
    for (let i = 0; i < n; i++) {
      const l = inL[i] || 0;
      const r = inR[i] || 0;
      const p = 0.5 * (l * l + r * r);
      env += (p - env) * follow;
      out[i] = Math.sqrt(env > 0 ? env : 0);
    }
    this.env = env;
    if (output[1] && output[1] !== out) output[1].set(out);
    return true;
  }
}

registerProcessor('sweep-envelope', EnvelopeProcessor);
