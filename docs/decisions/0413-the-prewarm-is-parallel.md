# 0413 — The prewarm is parallel

**Accepted 2026-09-29.** The music the game prepares at boot is baked on the worker pool the place
bakes already use ([0331](0331-the-heart-beats-under-it.md)), instead of on the page's own thread in
8 ms slices ([0157](0157-the-prewarm-was-scheduled-one-note-at-a-time.md)). Owed by
[0412](0412-the-port-is-heard.md), which found the prewarm was what the intro's Skip, its sound and its
dropped frames were all waiting on.

## The ask

> *"then do the faster prewarm"*

## What was slow

⚠️ **The prewarm was six seconds of the intro, and every one of them showed.** Measured on 0412's
build, the longest gap between frames in each second of the intro, nothing pressed: 144–423 ms in
the first (the boot), then **36–54 ms — one or two dropped frames — every second until the load
finished at about six seconds**, and a steady 17–18 ms after it. The Skip appeared at 6.2–6.4 s, and
the sound could not come on before it. Nearly all of that is the music's base layers: the cues are
milliseconds each.

## What changed

- **`prewarmAudio` hands every base layer to the pool when there is one**, all at once, and walks only
  the cues on this thread. The set is handed over when the walk and the last worker are both done,
  whichever finishes second. A worker runs `bakeLayer`, which is `layerNotes` with every note run in
  order — the walk's own jobs — so the samples are the walk's to the bit.
- **A press mid-prewarm still finishes it rather than starting again** (0157): `drainPrewarm` runs
  the cues left and bakes any layer still on a worker here, with the same `bakeLayer`. A worker's reply
  that arrives after that finds the layer no longer out and is dropped, so it can never overwrite a set
  already handed to the speaker.
- **Without a pool — every headless test, and a browser with no workers — nothing changes**: the walk
  is exactly 0157's.

## What it bought

Measured 2026-09-29 on the same machine, the same build otherwise:

| | before (0412) | after |
|---|---|---|
| canvas → Skip, alone | 6.2–6.4 s | **1.19–1.23 s** |
| canvas → Skip, under the whole suite | 7.7–16.5 s | **1.1–4.1 s** |
| longest frame gap, seconds 1–6 of the intro | 36–54 ms | **17 ms** |

The boot's own first-second hitch (133–453 ms) is untouched: it is the atlas and the port being baked,
and not the prewarm.

## What it costs

Up to four workers (`workersFor` in `src/app/bake-pool.ts`, cores less two) busy for about a second at
load. ⚠️ **In the test suite that is every browser test's page at once**, beside the unit suites: one
full run beside eight extra browsers of my own timed out a music test that takes 7.8 s alone. A clean
run is the evidence, and its result is in the PR.

## Guards

`tests/sound.test.ts`: **with a pool, every loop goes to it, the set is not handed over until the last
comes back, and what comes back is the walk's to the sample**; **a press with layers still out bakes
them here to the same samples, and a late reply changes nothing**.

`tests/intro.browser.test.ts`: **the page sends every base layer to the bake pool** — counted as
messages to a worker by the time the Skip appears. ⚠️ It is the only guard that can see
`src/main.ts` hand the pool over BEFORE `mount` starts the prewarm; the other order walks every layer
on the page again, and every headless test passes.

Re-sized on [0245](0245-a-budget-is-sized-under-load.md)'s terms: `INTRO_READY_MS` 50 s → 12.5 s, three
times the 4.1 s worst above. `FROZEN_MS` stays at 1.9 s, re-measured: the load is so quick now that the
press made before it goes in as soon as the canvas exists, inside the boot's hitch — 143–478 ms alone,
504–639 ms under the suite — and the test says so if the load beat it. Two tests changed with this: the
orientation gate's *draws again* polls for the picture rather than sampling it 120 ms after the turn,
because the intro it resumes on fades up out of black, and 0157's probe is re-anchored on the renamed
slice.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0413-the-prewarm-is-parallel.mjs`: the
loops walked although a pool was handed over; a drain leaving what is out empty; a late reply
overwriting the set; the pool handed over after `mount`.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing persisted.
