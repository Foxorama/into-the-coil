# 0417 — A place is baked by its name

**Accepted 2026-09-29.** Amends [0416](0416-the-viper-has-a-pilot.md), which found this, left it as
its own piece of work, and made the intro's sky the first level's so it would follow. Level one had
never been drawn in its own place.

## What was wrong

`applyPlace` in `src/app/mount.ts` re-bakes the sky — the weather ([0112](0112-the-sky-has-weather.md)),
the landmark ([0204](0204-a-landmark-is-lit-by-the-place-it-stands-in.md)), the ground
([0221](0221-a-planet-is-not-a-space.md)) — when the place on screen changes. It runs every step, so it is
memoised, and the memo was **the backdrop colour**: `if (want === shownSpace) return;`.

The Approach's `space` is `#0b0b14` vivid and `#000000` high contrast, which is the palette's own
`space` in both (`src/content/themes.ts`, `src/content/palette.ts`). The title's place is `null`,
whose backdrop is the palette's `space`. So going from the title into level one was *no change* to the
memo, and it returned before anything was baked: level one flew the atlas as boot left it, in the
palette's generic `sky` ink for both the cloud and its edge, and The Approach's own nebula (`#2b3352`)
and glow (`#3f7a86`) were never used. `bakedPlace` stayed `null`, so its sky came from `skyFor(null)`
too — the same layers today, because The Approach has no veins, and a different answer the day it does.

Every table held the right colours and every bake was right. The bake that would have used them simply
never ran — [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)'s shape exactly, with
the picture the only place it showed.

## What changed

**The memo is the place.** `if (place === bakedPlace) return;` — and `bakedPlace`, which `applySky`
already read as *the place the sky was baked for*, is now the one memo rather than a twin of a colour
memo. A colour is one output of a place, and two places may share any one output; the place is the
only key that differs whenever anything the function bakes does.

**Not the palette as well**, although the report asked for it: `colours` is a `const` under one
`mount`, and `src/main.ts` mounts once, so a palette cannot change under the memo. A key half made of a
value that never moves is a key that cannot be wrong in that half, and one that says it can.

**`null` at boot is still the title's**, and still skips the first bake: the atlas is baked in the
palette's own sky ink (`bakeOne`), which is what the title asks for, and
`tests/room.browser.test.ts` depends on the title at boot being unbaked.

## What it looks like

Level one's weather goes from a grey band to The Approach's cold blue body with a teal edge —
photographed before and after at 1280×720 with `scripts/shot.mjs`. **It changes the picture the
player has been treating as the reference look for level one**, so it goes to the player's eye on the
branch preview rather than being called right here. The intro's sky reads the same path (0416's
`placeOnScreen` answers `placeFor(0)` for it) and follows: its dark outside is The Approach's now.

**Not guarded, and said:** the intro's half. 0416 declined a guard on it because it had no observable
effect until this landed; it has one now, and the guard owed is the intro's own frame counted the way
`tests/place.browser.test.ts` counts level one's — not written here, because this change's subject is
the memo and level one is where the memo was wrong.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md), [0019](0019-a-probe-must-be-seen-to-apply.md).
`tests/place.browser.test.ts` starts a run from the title and counts, three seconds in, how many
pixels lie on the blend of The Approach's glow over its void against how many lie on the blend of the
palette's `sky` — in pixels, because the model was right throughout
([0027](0027-measure-the-picture-not-the-model.md)). Measured both ways: 334 against 180,385 with the
colour memo, 173,519 against 66,168 keyed on the place. `scripts/probes/0417-a-place-is-baked-by-its-name.mjs`
puts the colour comparison back, and `node scripts/prove-guard.mjs 0417` saw it redden:

| broken on purpose | went red |
|---|---|
| the sky memoised on the backdrop colour, so level one keeps the title's weather | `has the place’s glow on the canvas, a few seconds after the title` — 319 against 180,520 |

**Rejected: a unit test of the memo.** `mount` is a closure no unit test constructs, and a key
function lifted out to be testable is a test that the key agrees with itself — which is all the
colour memo ever did.
