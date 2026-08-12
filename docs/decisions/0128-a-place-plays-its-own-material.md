# 0128 — A place plays its own material, and shares everything it does not

**Accepted 2026-08-12.** [0113](0113-there-is-one-composition-and-seven-levels.md) says a theme is a
composition; [`what-seven-compositions-would-cost`](../../reports/what-seven-compositions-would-cost-2026-08-12.md)
priced that at **672 MB resident** and ruled it out, leaving *"0113's RULE stands and its storage
model cannot."* This is the storage model.

> *"Crank out the level 2 theme, it'll give us something to work with with the dashboard having
> different theme levels and also give us a good idea of what we'll need to adjust for instructions
> regarding different levels, timing, layers, interactions etc."*

## The rules

**A theme states the layers it plays differently, and shares every layer it does not.** `voices` on a
theme row is a `Partial<Record<MusicLayer, MusicVoice[]>>`; `voicesOf(theme, layer)` is the single
description and returns **the base array itself**, not a copy.

**The cost is proportional to how much of a place is NEW.** Ember Nebula re-voices **two of
twenty-three**, so entering it bakes two layers rather than a composition. That is what makes the
remaining five affordable — the report's 94 MB per level was for a whole set.

**A theme may state FEWER voices than the base**, which is how a place gets sparser. It may not state
an empty array: removing a layer is `RUNG_CLOSES`' job ([0120](0120-a-rung-may-close-a-layer.md)),
where the guard that every rung opens something can see it.

**`MusicOut.setLoops` swaps material at the next PHRASE**, not the next bar. A rung change is a gain
ramp and lands on a downbeat ([0117](0117-a-section-change-lands-on-the-beat.md)); this replaces the
material, and the shortest span over which every layer is simultaneously back at position zero is the
phrase. `swapTo` already did the hard part — 0094's re-phase is the same gesture.

## Ember Nebula, and what it actually changed

| | |
|---|---|
| `engine` | **three voices where the base has five**, half-time: the kick leaves beat three alone, the shaker and the sixteenth hat are gone. RMS 0.238 → **0.114** |
| `call` | a tune that **falls where the base's climbs** — twelfth down to the root, twice, turning at bar eight |

⚠️ **THE TIMBRES ARE THE BASE'S AND ONLY THE PATTERNS MOVE, WHICH IS A DELIBERATE FIRST STEP.** Every
`note` is copied unchanged. A dozen guards hold this piece's spectrum — the shed, the band weights,
the mix peak, the bus ceiling — and every one of them is about what a voice *sounds like* rather than
what it plays. Changing both at once would leave the first theme in the project with nothing to be
judged against.

## ⚠️ The finding, and it is the one the next five places need

**A theme cannot change its HARMONY without re-voicing every pitched layer.** Ember Nebula shares
`chords`, so its tune had to stay in A natural minor — a new progression would put `sub`, `groove`,
`arp`, `hook`, `lead` and `counter` on the wrong notes for three bars in four. That is
[0095](0095-the-level-has-its-own-music.md)'s argument for closing the title's bass, arriving from the
other side, and `tests/themes.test.ts` holds it: **every pitched note of every override is a tone of
the key.**

⚠️ **SO THERE ARE TWO SIZES OF PLACE AND THEY SHOULD BE COSTED SEPARATELY.** A place that re-voices
melody and percussion over the shared progression is two or three layers. A place with **its own
harmony** is eight or more and is most of a composition — which is the 94 MB figure, and it should be
spent on the levels that most need to feel different rather than on all six.

## ⚠️ What is owed, and the game does not have this yet

**Nothing in `src/app/mount.ts` calls `setLoops`.** `makeAudioOut` bakes `bakeLoops(SAMPLE_RATE)` with
no theme, so **a real run still plays the base composition in every level.** What plays Ember Nebula
today is `rig/` and `scripts/hear.mjs --level=descent`.

⚠️ **That is deliberate and it is half a feature, so it is stated rather than implied.** The missing
piece is the *when*: a level boundary has to bake the incoming place's layers **off the frame** —
[0102](0102-the-music-goes-somewhere.md)'s per-note jobs are the mechanism and the report costs the
spread at **0.245 ms a frame** — and then call `setLoops`. Landing a scheduler at the same time as a
new composition and a new mechanism would have meant none of the three could be judged.

⚠️ **THE MATERIAL IS JUDGEABLE NOW AND THE PLUMBING IS NOT, WHICH IS THE RIGHT WAY ROUND.** 0116's
rule is the instrument first; the dashboard plays this on a selector, so whether Ember Nebula is a
different place is a question a hand can answer tonight.

## What was rejected

**Overriding a single voice by index.** A theme would then depend on the ORDER of the base's voice
array, so re-ordering `src/content/music.ts` would silently re-point every override — the coupling
[0016](0016-a-hub-enumerates-kinds.md) exists to refuse.

**Transposing the shared composition per theme.** It is the obvious cheap route to *different* and it
is a different KEY rather than a different place; it also breaks every cue, which
[0099](0099-the-cues-are-in-the-key.md) tuned to one key on purpose.

**Baking a whole set per place.** 672 MB, priced and refused before this started.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| a shared layer copied instead of shared, so every place pays for a whole composition | `A PLACE THAT STATES NOTHING IS THE BASE COMPOSITION, and voicesOf hands back the same array` |
| a place stopped playing its own voices, so every level is one composition again | `AND WHAT IT STATES ACTUALLY SOUNDS DIFFERENT, while everything else is untouched` |
| a re-voiced pattern that is shorter than the layer it plays in | `0095 STILL HOLDS OVER AN OVERRIDE: every pattern spans EXACTLY its own layer` |
| a re-voiced tune left the key the shared progression is in | `A RE-VOICED TUNE STAYS IN THE KEY, because the progression under it is still shared` |
| a place removed a layer by stating an empty voice array instead of closing it in the ladder | `AND AN OVERRIDE MAY NOT SILENCE A LAYER THE LADDER OPENS` |

⚠️ **AND 0090's BAKE PROBE WAS ORPHANED BY THIS AND RE-ANCHORED WITH ITS BREAK INTACT** — the second
time that probe has moved (0102 was the first), and `npm run prove` refused to run anything until it
did. [0019](0019-a-probe-must-be-seen-to-apply.md).

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). An optional field, an optional
argument, one method and one theme's patterns. Nothing the player has reaches it yet.
