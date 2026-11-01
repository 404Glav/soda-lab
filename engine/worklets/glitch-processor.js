class GlitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.prevL = 0;
    this.prevR = 0;
    this.nonfinite = 0;
    this.jumps = 0;
    this.dropouts = 0;
    this.zeroRun = 0;
    this.heard = false;
    this.firstDropoutSample = -1;
    this.samples = 0;
    this.sum = 0;
    this.peak = 0;
    this.port.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === 'read') {
        this.port.postMessage({
          type: 'glitch',
          nonfinite: this.nonfinite,
          jumps: this.jumps,
          dropouts: this.dropouts,
          firstDropoutSample: this.firstDropoutSample,
          samples: this.samples,
          rms: this.samples ? Math.sqrt(this.sum / this.samples) : 0,
          peak: this.peak,
        });
      } else if (data.type === 'reset') {
        this.nonfinite = 0;
        this.jumps = 0;
        this.dropouts = 0;
        this.zeroRun = 0;
        this.heard = false;
        this.firstDropoutSample = -1;
        this.samples = 0;
        this.sum = 0;
        this.peak = 0;
        this.port.postMessage({
          type: 'glitch',
          nonfinite: 0,
          jumps: 0,
          dropouts: 0,
          samples: 0,
          rms: 0,
          peak: 0,
        });
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const left = input[0];
    const right = input[1] && input[1].length ? input[1] : left;
    const n = left.length;
    const zeroLimit = sampleRate * 0.05;
    for (let i = 0; i < n; i++) {
      const l = left[i];
      const r = right[i] || 0;
      if (!Number.isFinite(l) || !Number.isFinite(r)) this.nonfinite++;
      if (Math.abs(l - this.prevL) > 1.5 || Math.abs(r - this.prevR) > 1.5) this.jumps++;
      const a = Math.abs(l) > Math.abs(r) ? Math.abs(l) : Math.abs(r);
      if (a > this.peak) this.peak = a;
      this.sum += l * l + r * r;
      if (a < 1e-5) {
        if (this.heard) {
          this.zeroRun++;
          if (this.zeroRun === zeroLimit) {
            this.dropouts++;
            if (this.firstDropoutSample < 0) this.firstDropoutSample = this.samples + i;
          }
        }
      } else {
        this.heard = true;
        this.zeroRun = 0;
      }
      this.prevL = l;
      this.prevR = r;
    }
    this.samples += n;
    return true;
  }
}

registerProcessor('glitch-tap', GlitchProcessor);
