/** 24-bit PCM WAV. 16-bit helper is for generated test files. */

function writeStr(view, offset, text) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

export function encodeWav24(left, right, sampleRate) {
  const channels = right ? 2 : 1;
  const frames = left.length;
  const block = channels * 3;
  const dataSize = frames * block;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeStr(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * block, true);
  view.setUint16(32, block, true);
  view.setUint16(34, 24, true);
  writeStr(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    offset = write24(view, offset, left[i]);
    if (channels === 2) offset = write24(view, offset, right[i]);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function write24(view, offset, sample) {
  let x = sample;
  if (x > 1) x = 1;
  else if (x < -1) x = -1;
  let n = x < 0 ? Math.round(x * 0x800000) : Math.round(x * 0x7fffff);
  if (n < -0x800000) n = -0x800000;
  if (n > 0x7fffff) n = 0x7fffff;
  view.setUint8(offset, n & 0xff);
  view.setUint8(offset + 1, (n >> 8) & 0xff);
  view.setUint8(offset + 2, (n >> 16) & 0xff);
  return offset + 3;
}

export function encodeWav16(channels, sampleRate) {
  const ch = channels.length;
  const frames = channels[0].length;
  const block = ch * 2;
  const dataSize = frames * block;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeStr(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, ch, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * block, true);
  view.setUint16(32, block, true);
  view.setUint16(34, 16, true);
  writeStr(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < ch; c++) {
      let x = channels[c][i];
      if (x > 1) x = 1;
      else if (x < -1) x = -1;
      view.setInt16(offset, x < 0 ? Math.round(x * 0x8000) : Math.round(x * 0x7fff), true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export function audioBufferToChannels(buffer) {
  const left = buffer.getChannelData(0).slice();
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1).slice() : left.slice();
  return { left, right, sampleRate: buffer.sampleRate, duration: buffer.duration };
}
