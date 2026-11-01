# Sound Lab engine

`engine/index.js` exports `SoundEngine` and sets `window.SoundEngine`. The UI imports that module only.

## Pads bake

`bake({ what: 'pads' })` renders the 16 pads in index order, one after another, through the current pedal chain.

- Empty pads are skipped. A pad is empty when it has no slice (`end` is not after `start`) or it has no playable audio yet.
- Each pad is rendered with its current level, reverse, key shift, and stretch. Key and stretch are the pre-rendered Signalsmith buffer. Reverse flips that buffer. Level scales it.
- The result is one audio file: pad 0, then pad 1, and so on, with the gaps where empty pads were left out.

`bake({ what: 'region' })` renders the loop region when one is set, otherwise the whole source. By default the render continues after that audio until the output stays under -60 dBFS for 100 ms, and the extra time is capped at 10 seconds. `bake({ tail: false })` stops at the region (or the pad sequence) exactly. Pads bakes use the same tail. Curves use the same bar grid as live playback: phase follows the source playhead, and `amount` swings around the knob with `clamp(knob + amount * (curveY - 0.5) * 2, 0, 1)`.

A bake made before the first `saveProject` has no project yet. Saving attaches every unowned bake from this session to that project. Bakes made after a project is current are stored on it immediately.

## Transport and projects

- `getLoop()` returns `{ start, end, enabled }`.
- `setLoop(start, end)` sets the region. `setLoopEnabled(bool)` turns looping on or off.
- `isPlaying()` is true while the transport is running.
- `getSource()` returns the current Source, or null.
- `loadFile`, `loadSource`, and `loadBake` stop playback, set the position to 0, and set the loop to `{ start: 0, end: duration, enabled }` keeping the previous enabled flag.
- `loadProject(id)` resolves to the loaded Source (or null). It stops playback, sets the position to 0, and restores the saved loop instead of stretching it to the new duration.
- `recordStart()` resolves to `undefined`. `recordStop()` resolves to a Source.
- `saveProject` stores the loop region, the enabled flag, and the bpm and key overrides. `loadProject` puts them back.
- `deleteProject(id)` deletes that project and its bakes. It deletes the project's source only when no other project still uses it.
- `deleteBake(id)` deletes one bake.

Pad triggers use a fixed pool of 16 voices in an AudioWorklet, not a new `AudioBufferSourceNode` per hit.
