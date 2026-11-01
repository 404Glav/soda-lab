import './Tone.js';

const Tone = globalThis.Tone;
if (!Tone) {
  throw new Error('Tone.js did not install its global.');
}

export default Tone;
export const LFO = Tone.LFO;
export const Gain = Tone.Gain;
export const Context = Tone.Context;
export const getTransport = Tone.getTransport;
export const setContext = Tone.setContext;
export const getContext = Tone.getContext;
