# Sound Lab

Drop in any sound. Sculpt it into candy.

A pocket studio in a phone frame: load or record a sound, run it through a chain of
candy pedals, chop it into 16 pads, and bake the result to a 24-bit WAV. Everything
runs locally — audio never leaves the device.

```
SodaLab/
├── index.html        markup for the screens + sheets
├── styles.css        the whole design system (tokens, device frame, cards, sheets, motion)
├── app.js            the UI layer: shelf, board, pads, chain, sheets, engine wiring
├── version.js        version source of truth (service worker)
├── manifest.json     installable / standalone metadata
├── sw.js             cache-first offline shell (cache name follows version.js)
├── CHANGELOG.md
├── icons/            favicons (ico, 16, 32), apple-touch 180, PWA 192/512 + maskable 512
└── engine/           the audio engine (see engine/README.md)
    ├── index.js      SoundEngine: sources, transport, chain, pads, bakes, projects
    ├── graph.js      live pedal graph + AudioWorklet loading
    ├── pedals.js     PEDAL_DEFS, curves, knob formatting, tempo math
    ├── analyze.js    onsets, tempo and key
    ├── storage.js    IndexedDB (sources, projects, bakes) + settings
    ├── stretch.js    Signalsmith Stretch wrapper
    ├── wav.js        16/24-bit WAV encoding
    ├── worklets/     capture, pad, prism, glitch, crusher, envelope processors
    ├── workers/      analysis worker
    └── vendor/       Tone.js, Meyda, Signalsmith Stretch
```

## Run it

AudioWorklet needs a secure context, so `file://` will not boot. Serve the folder:

```bash
python -m http.server 5190
```

Then open `http://127.0.0.1:5190`. On a phone, use the local network URL and
"Add to Home Screen" — it launches standalone, full-bleed, with no browser chrome.

> Desktop shows the app inside a phone frame; below 520px it goes full-screen.

## What's in it

**Boot** — tap to start the audio context. Browsers require a gesture, so this is
the only gate between you and the engine.

**Shelf** — everything you have made, filtered by Bakes, Chops and Chains. Bakes
open a detail sheet (play, download, delete); sources reopen in the board; projects
restore the chain, pads and loop.

**Board** — the waveform, a Chain/Pads switch, and the transport. Tap the waveform
to seek. The Chain pane is the pedal rail; tap a pedal to edit it, or add one of
six types: Prism (grain delay), Reel (tape echo), Cathedral (hall reverb), Fizz
(saturator), Crusher (bit crush) and Sweep (auto filter).

**Pads** — the sound chopped into 16 slices. Find scores onsets, Slice cuts on the
bar, Random shuffles the cuts, Tap sets the tempo by tapping. Press a pad to fire
it; hold it to open the pad editor (level, key, stretch, reverse, trigger/hold,
favorite). Favorites survive re-chops.

**Chain** — the same chain as a list, with bypass state and a live knob summary.

**Bake & export** — print the chain offline, either the loop region or the pads in
order, with an optional effect tail. Download the WAV or save the project to the
shelf. Projects keep the source, chain, pads, loop, BPM and key.

Only real engine parameters are exposed in the UI. Every knob maps to a value in
`engine/pedals.js`; nothing is decorative.

## Privacy

Sources, projects and bakes live in IndexedDB under the `soundlab` database. The
microphone is only opened while recording. There is no account, no upload and no
analytics.

## Credits

Engine built on [Tone.js](https://tonejs.github.io/), [Meyda](https://meyda.js.org/)
and [Signalsmith Stretch](https://github.com/Signalsmith-Audio/signalsmith-stretch),
vendored under `engine/vendor/` with their licenses.
