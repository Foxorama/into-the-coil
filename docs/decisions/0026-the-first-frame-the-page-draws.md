# 0026 — The first frame the page draws: a canvas, a baked atlas, and two assertions that changed surface

**Accepted 2026-08-04.** The commit [0025](0025-the-frame-budget-is-counted-not-timed.md) named as
its next step. The page stops printing a version string and starts running.

## What landed

| | |
|---|---|
| `src/content/palette.ts` | the first table in `content/` — inks by ROLE, two palettes |
| `src/render/bake.ts` | every sprite drawn once at load, per palette and per view |
| `src/render/canvas.ts` | the Canvas2D backend, and 0022's DPR cap |
| `src/app/mount.ts` | boot: create the canvas, bake, seed, listen for resize |
| `src/app/frame.ts` | what happens every frame, and nothing else |
| `src/main.ts` | mounts it, and labels it |

## The mount/frame split is the load-bearing structural choice

Setup allocates — it creates canvases, bakes bitmaps, builds pools. The frame must not.
[0025](0025-the-frame-budget-is-counted-not-timed.md)'s scan is per-file, so **putting both in one
file would mean marking it `// @setup:` line by line until the markers meant nothing.**

So they are two files, `frame.ts` is on the hot list and `mount.ts` is explicitly not, and the test
now carries a second list — `DELIBERATELY_COLD` — naming each cold file next door to a hot one with
the reason it is cold. A file that silently drops off the hot list is a file that started running
every frame without anyone saying so.

**And the rule they exist to hold is asserted directly: no hot file may import the baker at runtime.**
Art is drawn once and blitted thereafter, and a frame that *can* bake is a frame that will, the first
time somebody needs a sprite in a colour they have not got.

## The palette is a table of ROLES, and it is 0024's first executable clause

An ink is `enemy`, never `red`. The moment a table says `red`, the high-contrast palette has to lie
about its own name and the code that reads it starts meaning "the red one" — which is exactly how
colour ends up carrying meaning by itself.

Two guards, and they are the palette's share of
[0024](0024-the-accessibility-floor-is-settings.md)'s unconditional tier:

- **Every ink clears WCAG AA (4.5:1) against `space`**, in every palette.
- **The pairs a player must never confuse are separated by LUMINANCE**, not hue — because hue is the
  channel colour-blind players do not have. The list is deliberately short: `player`/`enemy`,
  `bullet`/`pickup`, `enemy`/`pickup`, each with the cost of confusing them written down. Every pair
  added constrains every palette forever, and a palette with seven mutually-separated inks is a
  palette of greys, which is not the loud game 0024 promised.

⚠️ **What this does NOT claim** is 0024's full "colour never carries meaning alone". That is a
property of the cue table and the sprites and lands with them. A palette can only make sure the
colours are tellable apart in the first place. The sprites here take a first step anyway — the enemy
is a diamond, the pickup a square with a hole, the bullet a disc — so silhouette already carries
what colour carries.

The contrast maths is checked against the WCAG reference points rather than against itself, and the
assertion that matters is `#808080` → 0.2158, **not 0.5**: that is the one that fails if the gamma
step is dropped, which is the usual mistake and produces plausible numbers that let bad palettes
through.

## Two assertions changed surface, and neither weakened

`tests/boot.browser.test.ts` and `tests/offline.browser.test.ts` both read `#app`'s text, because the
page's whole content was a line of text. The page now mounts a canvas.

The claim they make was never about text: **the module graph evaluated in a real browser, and
`brand.ts` reached the rendered page.** The brand now arrives as the canvas's `aria-label`, so that is
where they read it from. That is also why the label exists — a bare canvas has no accessible name,
and `brand.ts` needs a real consumer or the version and commit injections are tree-shaken out and
`tests/brand.test.ts` starts asserting nothing.

⚠️ The distinction worth keeping: an assertion whose *surface* moved is not an assertion that was
relaxed. Deleting either would leave `dist/` greppable and a bundle that throws on line one still
passing.

## What the browser test drives, and why file://

Loaded over `file://`, which is the harshest way to open the page, is what
[0003](0003-single-file-build.md) exists for, and is exactly what an itch download is.

It asserts the canvas paints, **keeps** painting (a frozen canvas and a working one look identical in
a screenshot), fills the viewport in both orientations, caps the backing store at 2× against a
browser reporting DPR 4, and survives a rotation mid-run without erroring or going blank. Console and
page errors are collected and asserted empty throughout.

## The guard caught the scene, not the code

The first run reported a nearly-blank canvas — ink at 0.0007, which is the ship and nothing else.

The cause is worth recording because the code was right. Ongoing spawns are placed at `spawnAlong`,
which [0023](0023-the-long-axis-is-the-scroll-axis.md) puts beyond the widest view **any** device can
have. At this scroll rate that is about three seconds before a newly spawned object is visible —
correct for a real level, which is authored with content already in front of the player, and wrong
for a scene whose whole job is to prove the page draws. The field is now seeded at mount, from its
own named stream per [0021](0021-one-stream-per-concern.md).

**Nothing about the spawn rule changed.** The guard was reporting a true thing about a scene that was
not yet a scene.

## And once it caught the guard

The first version of "no hot file may import the baker" banned **every** import of `bake.ts`,
including `import type { Atlas }` — which the canvas backend requires, and which creates no runtime
edge at all.

⚠️ **This is a deliberate departure from [0015](0015-the-layer-ladder.md), which explicitly rejects
exempting type-only imports.** The two rules are asking different questions. 0015 is about coupling,
and a type is the coupling that hurts — the predecessor's simulation layer is unliftable because of
types. This is about whether a function can be **called** during a frame, which is a runtime question
and has a runtime answer. Same syntax, opposite correct treatment, and the reason is written here so
the next person to notice the inconsistency finds an argument rather than a bug.

The narrowed check tells a value import from a type-only one — including the inline
`{ type Atlas, bakeAtlas }` form — and is proved against six fixtures.

## Rejected: a stylesheet in `index.html`

The layout is three lines set from `main.ts`. `index.html` is a shipped surface with its own tests
and its own decisions ([0002](0002-brand-identity-contract.md),
[0007](0007-the-boot-watchdog.md), [0008](0008-the-shell-sidecars.md)), and a stylesheet existing
only to size one element is a second place to look for the same fact.

## Rejected: baking into `OffscreenCanvas`

Faster on paper and it keeps the bake off the main thread. Rejected for now because the bake happens
at load and on rotation, where nothing is competing for the frame, and `OffscreenCanvas` support is
the kind of thing that would need a fallback path — a second code path for the art, to save time
nobody is spending.

## The proof scene is not the game, and says so

Drifting debris and a ship that holds station. It exists to prove the loop, the pools, the camera and
the painter agree with each other in a real browser. Waves, enemies and bosses arrive with `content/`
and nothing about `frame.ts`'s shape survives that.

The placeholder art is honest about the same thing: `view` is a real argument and the seam is real —
`docs/game.md` calls two views per entity the single largest art cost in the project — but these
particular shapes are rotations of one another, and a real side profile and a real top-down are
different drawings.

## Deliberately not here

Input, the state slices, the content tables, audio, and the HUD. This commit is the frame reaching
the screen; each of those is its own change with its own guard.

## Confirmed, not assumed

Declared in `scripts/probes/0026-canvas.mjs`.

| broken on purpose | went red |
|---|---|
| the DPR cap removed, so a 3x phone renders 2.6M pixels a frame instead of 1.15M | `caps the device pixel ratio at 2` |
| the same cap removed, measured on the real canvas rather than on the function | `caps the backing store at 2x however high the device pixel ratio goes` |
| the atlas kept across a rotation, so every sprite points ninety degrees wrong | `rebakes when the orientation changes` |
| a rebake on every resize event, which stutters for the length of a window drag | `does not rebake for a resize that changes nothing anyone can see` |
| a bullet moved next to the pickup in lightness — the confusion that costs a life | `keeps every critical pair apart on the channel colour blindness does not take away` |
| an ink dropped below WCAG AA against space, so it is not reliably visible at all | `clears WCAG AA against the background` |
| the frame given the baker at runtime, so art can be redrawn during play | `the frame cannot reach the baker` |
| the canvas mounted with no accessible name, which is also how brand.ts stops shipping | `renders the title and version from brand.ts` |

⚠️ **The first two are the same edit, proved twice.** One runs the unit suite and one runs the
browser suite, because "the arithmetic is right" and "the arithmetic is reaching a canvas" are
different claims and the second is the one a player experiences.
