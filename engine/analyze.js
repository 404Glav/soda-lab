/* Classic script (worker + fallback). Onsets from spectral flux, BPM from
   onset spacing, key from a Meyda chroma estimate. */
(function (root) {
  var MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  var MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  function estimateKey(chroma) {
    var best = -Infinity;
    var name = 'C major';
    for (var i = 0; i < 12; i++) {
      var maj = 0;
      var min = 0;
      for (var k = 0; k < 12; k++) {
        var bin = chroma[(i + k) % 12] || 0;
        maj += bin * MAJOR[k];
        min += bin * MINOR[k];
      }
      if (maj > best) {
        best = maj;
        name = NAMES[i] + ' major';
      }
      if (min > best) {
        best = min;
        name = NAMES[i] + ' minor';
      }
    }
    return name;
  }

  function peaksFromFlux(flux, hop, sampleRate, delaySamples) {
    var max = 0;
    var sum = 0;
    for (var i = 0; i < flux.length; i++) {
      sum += flux[i];
      if (flux[i] > max) max = flux[i];
    }
    if (!(max > 0)) return [];
    var mean = sum / flux.length;
    var thresh = Math.max(mean * 2.2, max * 0.28);
    var minSamples = Math.floor(0.08 * sampleRate);
    var delay = delaySamples || 0;
    function timeAt(n) {
      var t = (n * hop - delay) / sampleRate;
      return t > 0 ? t : 0;
    }
    var hits = [];
    var lastSample = -minSamples;
    if (flux.length && flux[0] >= thresh && flux[0] >= (flux[1] || 0)) {
      hits.push({ time: timeAt(0), strength: flux[0] / max });
      lastSample = 0;
    }
    for (var n = 1; n < flux.length - 1; n++) {
      if (flux[n] < thresh) continue;
      if (flux[n] < flux[n - 1] || flux[n] < flux[n + 1]) continue;
      var sample = n * hop;
      if (sample - lastSample < minSamples) {
        if (hits.length && flux[n] > hits[hits.length - 1].strength) {
          hits[hits.length - 1] = { time: timeAt(n), strength: flux[n] / max };
          lastSample = sample;
        }
        continue;
      }
      hits.push({ time: timeAt(n), strength: flux[n] / max });
      lastSample = sample;
    }
    return hits;
  }

  function energyFlux(samples, sampleRate) {
    var hop = 256;
    var flux = [];
    var prev = 0;
    for (var i = 0; i + hop < samples.length; i += hop) {
      var e = 0;
      for (var j = 0; j < hop; j++) {
        var s = samples[i + j];
        e += s * s;
      }
      e = Math.sqrt(e / hop);
      var d = e - prev;
      flux.push(d > 0 ? d : 0);
      prev = e * 0.6 + prev * 0.4;
    }
    return peaksFromFlux(flux, hop, sampleRate);
  }

  function spectralFlux(samples, sampleRate, Meyda) {
    var frame = 512;
    var hop = 128;
    Meyda.bufferSize = frame;
    Meyda.sampleRate = sampleRate;
    Meyda.chromaBands = 12;
    var flux = [];
    var chroma = new Float64Array(12);
    var chromaFrames = 0;
    var prev = null;
    for (var i = 0; i + frame <= samples.length; i += hop) {
      var slice = samples.subarray(i, i + frame);
      var amp = Meyda.extract('amplitudeSpectrum', slice);
      if (!prev) prev = new Float32Array(amp.length);
      var f = 0;
      var bins = amp.length;
      for (var k = 2; k < bins; k++) {
        var d = amp[k] - prev[k];
        if (d > 0) f += d;
      }
      flux.push(f);
      prev = new Float32Array(amp);
      if ((i / hop) % 2 === 0) {
        var c = Meyda.extract('chroma', slice);
        if (c && c.length === 12) {
          for (var b = 0; b < 12; b++) chroma[b] += c[b];
          chromaFrames++;
        }
      }
    }
    return { hits: peaksFromFlux(flux, hop, sampleRate, -Math.round(frame * 0.45)), chroma: chroma, chromaFrames: chromaFrames };
  }

  function bpmFromOnsets(times) {
    if (!times || times.length < 2) return 120;
    var intervals = [];
    for (var i = 1; i < times.length; i++) {
      var dt = times[i] - times[i - 1];
      if (dt >= 0.18 && dt <= 2) intervals.push(dt);
    }
    if (!intervals.length) return 120;
    intervals.sort(function (a, b) { return a - b; });
    var median = intervals[intervals.length >> 1];
    var bpm = 60 / median;
    while (bpm < 75) bpm *= 2;
    while (bpm > 165) bpm /= 2;
    var rounded = Math.round(bpm);
    if (Math.abs(bpm - rounded) < 0.2) return rounded;
    return Math.round(bpm * 10) / 10;
  }

  function run(samples, sampleRate, Meyda) {
    var hits = [];
    var chroma = null;
    try {
      if (Meyda && typeof Meyda.extract === 'function') {
        var spec = spectralFlux(samples, sampleRate, Meyda);
        hits = spec.hits;
        if (spec.chromaFrames > 0) chroma = spec.chroma;
      }
    } catch (err) {
      hits = [];
    }
    if (hits.length < 2) hits = energyFlux(samples, sampleRate);
    var times = [];
    var strengths = [];
    for (var i = 0; i < hits.length; i++) {
      times.push(Math.round(hits[i].time * 10000) / 10000);
      strengths.push(hits[i].strength);
    }
    var key = 'C major';
    if (chroma) {
      var peak = 0;
      for (var c = 0; c < 12; c++) if (chroma[c] > peak) peak = chroma[c];
      if (peak > 0) {
        for (var n = 0; n < 12; n++) chroma[n] /= peak;
        key = estimateKey(chroma);
      }
    }
    return { onsets: times, strengths: strengths, bpm: bpmFromOnsets(times), key: key };
  }

  root.SoundLabAnalyze = { run: run };
})(typeof self !== 'undefined' ? self : globalThis);
