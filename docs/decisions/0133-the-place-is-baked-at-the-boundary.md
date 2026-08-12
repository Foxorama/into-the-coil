# 0133 — The place is baked at the boundary, and the game finally plays it

**Accepted 2026-08-12.** [0128](0128-a-place-plays-its-own-material.md) built `setLoops` and never
called it. [0132](0132-a-place-may-be-another-piece-entirely.md) wrote a whole composition behind it.
**Nothing in a real run has ever played a place's own notes.**

## The rule

**The material for the place the run is heading for is synthesised across frames and handed to the
mixer when it is ready.** `bakePlace` in `src/app/sound.ts`, called from `applyMusicLevel`; the swap
itself is 0128's, at the next phrase.

⚠️ **IT REPLACES AND DOES NOT CACHE, AND THAT IS THE MEASUREMENT RATHER THAN A PREFERENCE.**
[`what-a-whole-place-costs`](../../reports/what-a-whole-place-costs-2026-08-12.md): Ember Nebula is
**46.85 MB** of its own audio. A set kept per place is 94.8 MB against a 56 MB ceiling and seven of
them is not a number worth writing down. The arrays are copied into `AudioBuffer`s by `setLoops` and
**nothing keeps a reference to them**, so the steady state is one composition however many places a
run visits. `tests/sound.test.ts` holds the identity, not the intention.

⚠️ **This is `tests/sound.test.ts`'s own instruction arriving as an implementation**: *"THE THIRD
RAISE MUST NOT BE A NUMBER… the answer there is baking the level's own set at the boundary."*

## ⚠️ Keyed to the RUN's next level, which buys the whole break screen

`run.level` increments when a boss dies (`src/state/slices/run.ts`), so the incoming place is known
**before** [0063](0063-a-level-break-is-a-respite.md)'s screen is drawn. Reading `world.level.theme`
instead would start the bake at `advanceLevel` — three or four seconds into the level the music
belongs to, and the swap then waits for the next phrase on top of that.

⚠️ **The MIX still follows the field.** *What is playing* is a fact about where the ship is; *what is
baking* is a fact about where it is going. `applyMusicLevel` asks both, separately, and they are the
same answer everywhere except across a boundary.

⚠️ **`placeFor` IS A FUNCTION AND NOT TWO LINES IN A CLOSURE**, for the reason `src/app/lifecycle.ts`
gives in its own header: three closures over `mount`'s `state` meant the only way to ask *does level
two bake Ember Nebula* was to boot a canvas, and
[0005](0005-a-guard-must-be-seen-to-fail.md) cannot break what no test can reach.

## What it costs, and where

| | |
|---|---|
| one comparison a step | and a no-op almost every time, on `applyMusicLevel`'s own terms |
| **nothing in the frame loop** | the walk is scheduled off it, exactly as `prewarmAudio`'s is (0102) |
| a buffer claimed by its own job | claiming twenty-one up front is 47 MB of allocation and zeroing in one call, from a frame |
| the longest single job | is the longest single NOTE, which `tests/themes.test.ts` holds under three seconds for a place |
| a place that states nothing | free end to end — empty job list, `ready` on the first tick, `setLoops` finds every array identical and makes no buffer |

⚠️ **Cancellable, and the cancel is load-bearing rather than tidy.** A run can clear two levels while
a bake walks; 0128's swap lands at the next PHRASE, so an uncancelled bake hands the mixer the wrong
place's music up to twenty-five seconds into the level after the one it belonged to.

## What is guarded

| | |
|---|---|
| **the place baked is the one the run is heading for**, for all seven and past the end | ✅ `placeFor` |
| a place walked note-by-note is byte-identical to one baked in a single call | ✅ the property 0102 established, one level up |
| **a shared layer is the SAME array, not a copy** — the 56 MB ceiling as an identity check | ✅ |
| a place that states nothing hands the base set straight back | ✅ |
| a cancelled bake never hands anything over | ✅ |
| it does nothing before the prewarm has a base set to share from | ✅ |

⚠️ **`scripts/probes/0133-boundary-bake.mjs` breaks it the two cheap ways** — a bake that copies what
it shares, and a bake with no cancel — and both were seen red. Neither is visible by listening to one
level, which is why they are probes rather than an ear.

## ⚠️ What is still owed, and it is now a listen rather than a build

**Nobody has heard a level boundary change the music in the game.** The suites hold the arithmetic and
the identity; what no test here can say is whether a place arriving at the next phrase reads as *the
music changed* or as *the music glitched*. That is the first thing to listen for on the next play, and
[0027](0027-measure-the-picture-not-the-model.md) is why it is written down as owed rather than
claimed as done.

⚠️ **The window is up to a phrase — 25.6 s.** A boundary is followed by a break screen and then an
empty opening stretch ([0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md)), so in practice
the new place should arrive during the quietest part of the level. That is a prediction, not a
measurement.

## Rollback

None owed — [0001](0001-revertability-not-risk-rating.md). No storage key, no save schema, no SW
cache prefix. It allocates nothing that outlives the swap and touches no state a save can see; the
worst a revert does is put every level back on the base composition, which is where they were.
