class CrusherProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'bits', defaultValue: 8, minValue: 1, maxValue: 16, automationRate: 'k-rate' },
      { name: 'hold', defaultValue: 1, minValue: 1, maxValue: 64, automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();
    this.acc = 999;
    this.hL = 0;
    this.hR = 0;
    this.zeros = new Float32Array(2048);
  }

  process(inputs, outputs, params) {
    const output = outputs[0];
    if (!output || !output[0]) return true;
    const input = inputs[0] || [];
    const inL = input[0] && input[0].length ? input[0] : this.zeros;
    const inR = input[1] && input[1].length ? input[1] : inL;
    const outL = output[0];
    const outR = output[1] || output[0];
    const bits = Math.max(1, Math.min(16, Math.round(params.bits[0])));
    const hold = Math.max(1, Math.round(params.hold[0]));
    const steps = Math.pow(2, bits);
    const n = outL.length;
    for (let i = 0; i < n; i++) {
      this.acc++;
      if (this.acc >= hold) {
        this.acc = 0;
        this.hL = quant(inL[i] || 0, steps);
        this.hR = quant(inR[i] || 0, steps);
      }
      outL[i] = this.hL;
      if (outR !== outL) outR[i] = this.hR;
    }
    return true;
  }
}

function quant(x, steps) {
  let y = x;
  if (y > 1) y = 1;
  else if (y < -1) y = -1;
  const s = Math.max(2, steps);
  const q = Math.round((y + 1) * 0.5 * (s - 1));
  return (q / (s - 1)) * 2 - 1;
}

registerProcessor('crusher-bit', CrusherProcessor);
