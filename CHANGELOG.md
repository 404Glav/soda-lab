# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions are two-part numbers, `MAJOR.MINOR`, with no patch component (`0.4`).

## [Unreleased]

### Added

- Sound Lab replaces Soda Lab: a real UI over `engine/`, with a boot screen, Shelf, Board, Pads and Chain views, plus sheets for loading, pedals, pads, bake/export and projects.
- Six pedal artworks (Prism, Reel, Cathedral, Fizz, Crusher, Sweep) drawn as SVG, with bypass state.
- Waveform rendering from `source.peaks`, chop overlays on the pads view, and a draggable curve editor wired to `setCurve`/`curvePhase`.

### Changed

- `app.js` is now an ES module importing `engine/index.js`; the engine also exposes `window.SoundEngine`.
- `version.js` exports `SOUNDLAB_VERSION`; the service worker cache is `soundlab-` plus that version and precaches the engine, worklets and vendors.
- `manifest.json` and `README.md` describe Sound Lab.

### Removed

- `badges.js` and `icons/badges/` (soda-specific, no longer referenced).

## [0.4] - 2026-10-31

### Added

- 18 cosmetic badges (PR #4), stored under `sodalab.badges`. They never change rarity, luck, or score. A one-time retro pass picks up bottles already on the shelf, then a single welcome.
- A `#/badges` screen, a Shelf button, a Lab row, and unlock banners (PR #4). Banners queue highest tier first. `?demo=1` shows no badge UI.
- Pixel's badge art in `icons/badges/` (PR #4).
- One version number in `version.js` (`SODALAB_VERSION`). The service worker cache is `sodalab-` plus that version (`sodalab-0.4`), and it precaches `version.js`.

### Changed

- App icons are Pixel's Blue Fizz set: favicons, apple-touch 180, and PWA 192/512 plus maskable 512 (PR #3). `icon.svg`, `icon-180.png`, and `icon-maskable-512.png` are gone.
- `theme-color` is `#F5F4F1` on the document and in the manifest (PR #3).
- PR #5 merged the icon, theme-color, and badge work onto main. The hand-written cache name `sodalab-v3` from that branch is retired in favor of `sodalab-` plus the version.

## [0.3] - 2026-10-31

### Changed

- UI performance (PR #2). Liquid finishes animate with CSS transform and opacity instead of SMIL. Still thumbnails do not animate, and reduced motion stops the finishes.
- Views that are off-screen, or covered by Decorate or the brew overlay, pause their animations. Invisible backdrop blurs on the hero button, rarity chip, and sheet rarity are gone.
- The mixer and Decorate repaint in place. Charm drag reads the bottle once per press and moves the charm inside `requestAnimationFrame`. A charm is placed on release only when the press stayed within 8px; tapping a charm or Clear removes it, with Undo.
- Brew runs on one animation clock, flavor bars and the brew progress move with transform, and closing a sheet chains the next step on `transitionend`. The screen renders before its transition starts.
- The service worker cache name was `sodalab-v2`.

## [0.2] - 2026-10-31

### Added

- PNG app icons and a cache-first service worker (`sodalab-v1`) so the shell works offline (PR #1).

### Fixed

- Saved data is validated on load, and names and ids are escaped before they are written into HTML (PR #1).
- The charm cap is one constant, 6, shared by placing, merging, luck, and score. Luck and score used to stop at 4 (PR #1).
- Sharing tries the share sheet, then the clipboard, then the legacy copy command (PR #1).
- Navigation goes through history: `#/view` URLs, `popstate`, and Back closes sheets. Switching tabs replaces the history entry, and home is `#/home` (PR #1).
- Twelve combo names that could never be reached, and the nonexistent `apple` flavor. Spiced Orchard is cinnamon and pear (PR #1).
- Decorate Cancel, Back, and Escape restore the finish and charms from when Decorate opened (PR #1).
- Add to mix reports a full glass instead of pretending the flavor was added. Sweetness and fizz recompute the whole mix and save on change, not on input (PR #1).

## [0.1] - 2026-10-31

### Added

- Soda Lab: an installable soda mixer with no build step. Pick a base, stack up to three flavors, tune sweetness and fizz, brew, and shelve the result.
- Charms, liquid finishes, merging, and rarity rolls, added on main before the 0.2 fixes. The bottle render is glassier, two shelf bottles can fuse into a third, and the pantry has 36 flavors.
