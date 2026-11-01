class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.recording = false;
    this.chunks = [];
    this.frames = 0;
    this.port.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === 'start') {
        this.chunks = [];
        this.frames = 0;
        this.recording = true;
        this.port.postMessage({ type: 'started' });
      } else if (data.type === 'stop') {
        this.recording = false;
        const frames = this.frames;
        const left = new Float32Array(frames);
        const right = new Float32Array(frames);
        let offset = 0;
        for (let i = 0; i < this.chunks.length; i++) {
          const chunk = this.chunks[i];
          left.set(chunk[0], offset);
          right.set(chunk[1], offset);
          offset += chunk[0].length;
        }
        this.chunks = [];
        this.frames = 0;
        this.port.postMessage({ type: 'audio', left: left, right: right }, [left.buffer, right.buffer]);
      }
    };
  }

  process(inputs) {
    if (!this.recording) return true;
    const input = inputs[0];
    if (!input || !input[0] || !input[0].length) return true;
    const left = new Float32Array(input[0]);
    const right = new Float32Array(input[1] && input[1].length ? input[1] : input[0]);
    this.chunks.push([left, right]);
    this.frames += left.length;
    return true;
  }
}

registerProcessor('capture-tap', CaptureProcessor);
