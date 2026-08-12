# What a whole place costs — measured, 2026-08-12

**The measurement behind [0132](../docs/decisions/0132-a-place-may-be-another-piece-entirely.md).**
Taken with `node scripts/weigh-place.mjs nebula`, which bakes through the game's own `bakeLayer` and
measures with the guard's own `bandEnergy` —
[0116](../docs/decisions/0116-the-rig-plays-the-level.md) is why it imports both rather than
restating either.

⚠️ **THE QUESTION IT ANSWERS IS NOT MUSICAL.** `tests/sound.test.ts` says in its own comment: *"THE
THIRD RAISE MUST NOT BE A NUMBER. Seven per-theme compositions are the next thing 0113 asks for, and
holding all of them resident is a multiple of this that no ceiling should absorb — the answer there is
baking the level's own set at the boundary."* Ember Nebula is the first place large enough to make
that sentence load-bearing, so the numbers came before the notes were finished.

## The base composition

**23 layers, 48.0 MB resident.** The 56 MB ceiling in `tests/sound.test.ts` is measured against this
and this alone.

## Ember Nebula: 21 of 23 layers re-voiced

| layer | bake ms | MB | under 130 Hz | pan | longest note |
|---|---|---|---|---|---|
| drone | 59 | 0.56 | 45% | 0 | 1.84 s |
| sub | 157 | 4.52 | 65% | 0 | 1.66 s |
| engine | 54 | 1.13 | 39% | 0 | 0.72 s |
| perc | 15 | 1.13 | 0% | −0.45 | 0.11 s |
| **chords** | **1566** | 4.52 | 33% | 0.2 | **2.40 s** |
| call | 209 | 4.52 | 6% | −0.3 | 0.72 s |
| groove | 166 | 4.52 | 22% | 0 | 0.44 s |
| hook | 169 | 4.52 | 16% | 0.55 | 0.40 s |
| arp | 315 | 4.52 | 0% | −0.55 | 0.18 s |
| ride | 49 | 1.13 | 0% | 0.5 | 0.36 s |
| counter | 169 | 4.52 | 8% | −0.4 | 0.60 s |
| crash | 35 | 1.13 | 0% | −0.35 | 1.40 s |
| drive | 25 | 0.56 | 2% | 0.25 | 0.24 s |
| toll | 109 | 1.13 | 22% | −0.5 | 1.96 s |
| dread | 75 | 1.13 | 10% | 0.15 | 1.80 s |
| lead | 98 | 1.13 | 0% | 0.3 | 0.68 s |
| stomp | 32 | 0.56 | 24% | 0 | 0.36 s |
| frenzy | 143 | 2.26 | 5% | 0.45 | 0.10 s |
| wraith | 113 | 2.26 | 12% | −0.25 | 0.40 s |
| auraSlow | 78 | 0.56 | 26% | −0.6 | 1.04 s |
| auraFast | 37 | 0.56 | 0% | 0.6 | 0.14 s |
| **TOTAL** | **3675** | **46.85** | | | |

## ⚠️ Three findings, and the first one decides an architecture

**1. Held alongside the base, this place is 94.8 MB. Replacing the layers it states, it is 48.0.**

A place's own arrays are the same LENGTH as the ones they replace — `tests/themes.test.ts` asserts
that per layer, because a different length would break the phrase — so a set that **replaces in
place** cannot grow resident audio at all, whatever a place re-voices and however many places there
are. A set that is **cached per place**, which is what `rig/dash.ts` does, grows by up to 47 MB each.

⚠️ **So the boundary bake is not an optimisation, it is the thing that makes a place this size
legal.** The dashboard may cache — it is a dev page on a desktop, and it wants to switch places
instantly. The game may not.

**2. The bake is 3.7 seconds, and 43% of it is one layer.** `chords` alone is 1566 ms: six sustained
voices, sixteen bars, ninety-six notes of 2.40 s each. That is the price of a choir and it is not
reducible without making it a smaller choir.

⚠️ **It is spread one NOTE at a time, which is 0102's mechanism and it already exists.** The longest
single job is 2.40 s of synthesis — under `tests/sound.test.ts`'s 3 s ceiling and about 16 ms of real
time per note. What is owed is somewhere to spend 3.7 seconds of it, and a level break
([0063](../docs/decisions/0063-a-level-break-is-a-respite.md)) is a screen the player is already
sitting on.

**3. A guard hole, found by falling into it.** The first cathedral bell was **49% of its energy below
130 Hz on a layer that sits at pan −0.5** — which `tests/music.test.ts` refuses, and which every guard
in the repository passed, because the band rule bakes `MUSIC` and only `MUSIC`. A place may change
what a layer plays and cannot change where it sits.

⚠️ **It was fixed as physics rather than as a number**: a bell's strike note went up an octave and its
hum — an octave under the strike, and the quietest thing in a real bell — became its own quiet voice.
22% now. The guard is in `tests/themes.test.ts` and
`scripts/probes/0132-another-piece.mjs` restores the bad bell to keep it honest.

## What this does NOT measure

⚠️ **Whether it sounds like the brief.** Every number here is a model quantity —
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) — and *haunting hymns, pipe
organs, a symphonic choir and an inferno* is a claim about a picture. **The verdict is a listen at
`npm run dash`, level `descent`**, and nothing in this report substitutes for it.

⚠️ **AND THE GAME STILL DOES NOT PLAY IT.** `src/app/mount.ts` never calls `setLoops`
([0128](../docs/decisions/0128-a-place-plays-its-own-material.md) left that open), so a real run of
level two is the base composition however this place is voiced. The dashboard is the only place this
music exists until that lands.
