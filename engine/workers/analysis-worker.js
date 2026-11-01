importScripts('../vendor/meyda/meyda.min.js', '../analyze.js');

self.onmessage = function (event) {
  var data = event.data || {};
  var result = self.SoundLabAnalyze.run(data.samples, data.sampleRate, self.Meyda);
  self.postMessage(result);
};
