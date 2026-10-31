# Soda Lab

A quiet little lab for loud little drinks.

An iOS-flavoured soda-mixing app: pick a base, stack up to three flavors, dress the bottle, brew it, and shelve the result. Every pour rolls a rarity. No frameworks, no build step — just three files and a very large amount of SVG.

```
SodaLab/
├── index.html     markup for the screens + overlays
├── styles.css     the whole design system (tokens, cards, sheets, motion)
├── badges.js      badge definitions, badge store, evaluator (no UI)
├── app.js         flavor data, color blending, bottle renderer, router
├── manifest.json  installable / standalone metadata
├── sw.js          cache-first offline shell (bump CACHE when files change)
└── icons/         favicons (ico, 16, 32), apple-touch 180, PWA 192/512 + maskable 512;
                   badges/ holds Pixel's badge caps (<id>.svg, <id>-locked.svg, mystery.svg)
```

## Run it

Double-click `index.html`, or serve the folder:

```bash
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080`. On a phone, use the local network URL and
"Add to Home Screen" — it launches standalone, full-bleed, with no browser chrome.

> Desktop shows the app inside a phone frame; below 520px it goes full-screen.

## What's in it

**Lab** — a hero card that reflects whatever is currently in the glass, your shelf,
and a flavor of the day that rotates on a daily seed.

**Mixer** — four bases, thirty-six flavors, six-step sweetness and fizz dials, three
serving temperatures. The bottle re-renders live: liquid color is blended in HSL
so it stays luminous instead of turning to mud, and bubble count follows the fizz
setting.

**Style** — cosmetic only. Six liquid finishes (Clear, Glitter, Pearl, Aurora,
Cosmic, Ember) and twelve charms you can place anywhere on the bottle. Tap to
add, drag to move, tap a placed charm to remove. Finishes and charms tilt the
rarity odds, they don't change the taste.

**Brew** — a full-screen pour: the liquid rises, four stages tick past, and the
batch gets sealed. Rarity is rolled when the bottle is sealed, not before.

**Result** — a generated name (with easter-egg combos like *Cherry Cola* and
*Root Beer Float*), a rarity badge and a 40–99 score, tasting notes derived from
the flavor profile, five profile bars, save-to-shelf, and a copyable recipe.

**Shelf** — saved batches as bottle cards, each tagged with its rarity. Tap one
for details, remix it, merge it with another, or remove it.

**Merge** — fuse any two shelf bottles into a third. Flavors, sweetness, fizz,
finish and charms combine (three flavors, six charms max). The originals stay.
Merged batches roll with better rarity odds.

**Flavors** — the pantry: searchable, each with notes, a description, and a
one-tap "add to mix".

Everything persists to `localStorage` under `sodalab.v1` (drafts included), so a
half-finished mix survives a refresh. Older saves pick up a rarity the first time
they're loaded.

## Rarity

Rolled once, at brew time, from a weighted table. Finishes, charms, a full
three-flavor mix, and merging all raise the odds of the higher tiers.

| Rank | Base odds |
| --- | --- |
| Common | 1 in 2 |
| Uncommon | 1 in 4 |
| Rare | 1 in 7 |
| Epic | 1 in 15 |
| Legendary | 1 in 50 |
| Mythic | 1 in 200 |

The score is separate: harmony of the flavor profile, plus small bonuses for
rarity, finish and charms.

## Deep links

| URL | Opens |
| --- | --- |
| `#/mix` | the mixer |
| `#/shelf` | your shelf |
| `#/flavors` | the pantry |
| `#/result` | a result screen (synthesises one if empty) |
| `?demo=1` | seeds four dressed example batches |

## Design notes

- System type stack (`-apple-system` / SF Pro), tight tracking, `-0.035em` on titles.
- Warm paper background `#F5F4F1` with a barely-there grain overlay.
- Cards are white with a 1px hairline shadow; nothing has a visible border.
- Motion uses one easing curve — `cubic-bezier(.32,.72,0,1)` — for pushes, sheets,
  and the brew overlay. Everything respects `prefers-reduced-motion`.
- Color is never hardcoded in the UI: it's derived from the drink, then checked for
  luminance so button labels always stay readable.
- The bottle is one SVG: a depth gradient in the liquid, a left highlight, a rim
  catch, a ridged cap, and a colored contact shadow. Finishes and charms sit on
  top of that, never inside the flavor math.
