# Soda Lab

A quiet little lab for loud little drinks.

An iOS-flavoured soda-mixing app: pick a base, stack up to three flavors, tune the
sweetness and fizz, brew it, and shelve the result. No frameworks, no build step —
just three files and a very large amount of SVG.

```
SodaLab/
├── index.html     markup for the five screens + overlays
├── styles.css     the whole design system (tokens, cards, sheets, motion)
├── app.js         flavor data, color blending, bottle renderer, router
├── manifest.json  installable / standalone metadata
└── icon.svg
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

**Mixer** — four bases, sixteen flavors, six-step sweetness and fizz dials, three
serving temperatures. The bottle re-renders live: liquid color is blended in HSL
so it stays luminous instead of turning to mud, and bubble count follows the fizz
setting.

**Brew** — a full-screen pour: the liquid rises, four stages tick past, and the
batch gets sealed.

**Result** — a generated name (with a few easter-egg combos like *Cherry Cola* and
*Root Beer Float*), tasting notes derived from the flavor profile, five profile
bars, save-to-shelf, and a copyable recipe.

**Shelf** — saved batches as bottle cards. Tap one for details, remove it, or
"mix this again" to load it back into the lab.

**Flavors** — the pantry: searchable, each with notes, a description, and a
one-tap "add to mix".

Everything persists to `localStorage` (drafts included), so a half-finished mix
survives a refresh.

## Deep links

| URL | Opens |
| --- | --- |
| `#/mix` | the mixer |
| `#/shelf` | your shelf |
| `#/flavors` | the pantry |
| `#/result` | a result screen (synthesises one if empty) |
| `?demo=1` | seeds four example batches |

## Design notes

- System type stack (`-apple-system` / SF Pro), tight tracking, `-0.035em` on titles.
- Warm paper background `#F5F4F1` with a barely-there grain overlay.
- Cards are white with a 1px hairline shadow; nothing has a visible border.
- Motion uses one easing curve — `cubic-bezier(.32,.72,0,1)` — for pushes, sheets,
  and the brew overlay. Everything respects `prefers-reduced-motion`.
- Color is never hardcoded in the UI: it's derived from the drink, then checked for
  luminance so button labels always stay readable.
