# The fight is one piece in seven costumes — 2026-09-16

**Step 1 of [`the-album-plan`](the-album-plan-2026-09-07.md), the half that can be measured.** That
step asks for *a committed report naming which quantity is generic — layer set, harmonic move,
leitmotif source, or timbre* — and it is the brief for step 4, the seven per-place final movements.

⚠️ **THE READING IN THE PLAN IS NOW A MEASUREMENT, AND IT WAS RIGHT ABOUT THE WRONG LAYER.** The plan
guessed *"the leitmotif `wraith` is the BASE composition's `call` flattened"*. It is not: measured,
**no place's fight quotes any of its own melodic material and none of it comes from the base either.**
Every fight is new material. The trouble is that it is the **same** new material.

⚠️ **AND THE LISTENING HALF IS OWED.** Step 1 also says *listen to the seven final movements back to
back*, and nothing below is a substitute for that. Everything here is read off
`src/content/themes.ts`, `src/content/arrangement.ts` and the seven place files; **no audio was
rendered for it.** What a table can settle is that two places sound the same PITCHES; what it cannot
settle is whether a difference it does show survives the sum, which is
[0152](../docs/decisions/0152-a-layer-is-heard-in-the-sum.md)'s whole subject — so every *differs*
below is weaker evidence than every *identical*.

## The answer, in one table

| quantity | generic? | measured |
|---|---|---|
| **timbre** | **no** | every place re-voices all fourteen layers it opens at the fight |
| **the harmonic move** | **the most** | `dread` sounds the **identical two pitch classes in six of seven** |
| the leitmotif | yes, sideways | `wraith` shares one pitch set across five of seven, and no fight quotes its own level |
| the layer set | yes | six of seven open the identical fourteen and make the identical swap |
| the gesture | yes, at the bottom | `drone` is filled the same way by **11 of 21 pairs**, `dread` by 10, `stomp` by 9 |

**Timbre is the one thing that is NOT shared, and it is the thing the work went into.**
[0189](../docs/decisions/0189-a-place-is-what-it-does-not-play.md) says so in as many words —
*"this project has spent two weeks on timbre"* — and its own answer was that **a place differs by
what it OPENS before it differs by what that sounds like.** At the fight, six of seven open the same
set and make the same harmonic move. Step 4 should not spend another pass on voices.

## 1. ⚠️ The harmonic move is the same two notes in six places

`dread` is the layer [0114](../docs/decisions/0114-the-fight-is-a-different-piece.md) turns the key
with, and it is the `part` the shared arrangement appoints at `boss` and `bossPeak` — the thing a
listener is asked to follow.

| place | pitch classes it sounds |
|---|---|
| approach | A, B♭, E♭ |
| nebula, saurian, labyrinth, rime, mire, core | **B, F** |

**Six of the seven make the same move, note for note.** Each of those six wrote its own `dread`
voices — different waves, different envelopes, different registers — over the same two pitches. That
is *"here are two of the same songs with a slightly different background beat"*
([0186](../docs/decisions/0186-a-place-has-its-own-gesture.md)'s report) arriving at the fight, and it
is the single most concentrated thing to change.

The leitmotif is the same story one layer over — `wraith` is B, C, E, F in **five** of seven, with
only The Toxic Mire and The Approach elsewhere:

| layer | distinct pitch sets over seven places |
|---|---|
| `dread` | **2** |
| `wraith` | **3** |
| `frenzy` | 5 |
| `toll` | 6 |

`toll` and `frenzy` are where the places already differ. `dread` and `wraith` are where they do not,
and they are the two the arrangement makes the subject.

## 2. ⚠️ No fight quotes the level it ends

Every fight layer's material was compared against every melodic layer of its own place — `call`,
`hook`, `lead`, `counter`, `arp`, `chords` — on two axes: an exact transposition of the same interval
sequence, and the same steps struck regardless of pitch.

**Zero matches, in all seven places, on both axes.**

⚠️ **THIS IS THE FINDING THAT DECIDES WHAT STEP 4 IS FOR.** The plan already requires it —
*"the leitmotif from the place's own `call` or `hook`, not the base's, so the seam at two minutes is
the level's tune transformed rather than replaced"* — and this measures the starting point: the seam
is a **replacement** today, everywhere. On the album that is the moment a listener hears the track
stop being about anything it had been about.

## 3. The layer set, and the identical swap

| place | layers open at `boss` | differs from The Approach's set by |
|---|---|---|
| approach | 15 | — |
| saurian | 15 | **opens `bass` and `beat`, closes `drone`** |
| nebula, labyrinth, rime, mire, core | 14 | only The Approach's own `ownA` |

And the transition into the fight is the same sentence in six of seven: **in come `stomp`, `frenzy`
and `wraith`; out go `chords`, `lead` and `counter`.** Saurian Belt is again the exception, and it is
the place a player once called *"completely different to every other level"*
([0189](../docs/decisions/0189-a-place-is-what-it-does-not-play.md)) — which is evidence about what
differing costs and what it buys.

⚠️ **`ownA`–`ownD` ARE STILL ALMOST UNUSED AT THE FIGHT**, and the plan's claim that none is open has
just gone stale by one: [0325](../docs/decisions/0325-the-fight-sounds-like-the-fight.md) opened The
Approach's `ownA` at `boss` and `bossPeak` as a `pulse`. **Six places still open none.**
[0188](../docs/decisions/0188-a-place-owns-four-slots.md) built four slots per place for exactly this
and **twenty-seven of the twenty-eight** are silent in every fight in the game.

## 4. The gesture, over the layers both places open

`node scripts/weigh-gesture.mjs --all --rung=boss` — strikes a bar, note length, lowest pitch, over
the layers each pair both opens at `boss`. A pair is counted as agreeing when all three are within a
third of an octave of ratio, which is that instrument's own threshold and not a number chosen here.

| layer | pairs of the 21 that fill it identically |
|---|---|
| `drone` | **11** |
| `dread` | **10** |
| `stomp` | **9** |
| `auraSlow` | 7 |
| `drive` | 6 |
| `engine` | 4 |
| `toll`, `ride`, `sub`, `auraFast` | 3 |
| `crash` | 2 |
| `perc` | 1 |

**Every one of those layers was written separately by every place**, and they converged anyway. The
worst pair is Rime Shelf and The Toxic Mire at **7 of 14 slots identical**; the best is The Approach
against anything, at 0 or 1 — because the base is the one composition nobody wrote against a brief.

## 5. What each fight asks you to follow

| place | `boss` lead | loudest three at `bossPeak` |
|---|---|---|
| approach | **none stated** | perc 1.94, wraith 1.15, crash 1.07 |
| nebula | `wraith` | perc 2.24, crash 2.05, frenzy 1.59 |
| saurian | `frenzy` | perc 2.15, frenzy 2.05, wraith 1.83 |
| labyrinth | `stomp` | ride 3.31, dread 0.80, frenzy 0.57 |
| rime | `wraith` | crash 1.81, frenzy 1.77, ride 1.42 |
| mire | `toll` | wraith 1.15, frenzy 1.08, perc 0.92 |
| core | `frenzy` | ride 0.84, frenzy 0.73, wraith 0.67 |

⚠️ **THE APPROACH STATES NO FIGHT LEAD AT ALL**, so it follows the shared arrangement's `dread` — and
`dread` is the layer measured above as the most generic thing in the game. The base composition's own
fight is the one most fully described by the shared table.

⚠️ **AND THE LEAD IS NOT THE LOUDEST LAYER IN FIVE OF SEVEN.** That is not automatically wrong — a
role is about margin in a band and this column is raw gain, which
[0152](../docs/decisions/0152-a-layer-is-heard-in-the-sum.md) is the difference between. But The
Labyrinth follows `stomp` while `ride` sits at **four times the gain of anything else in the rung**,
and that one is worth an ear on its own.

## 6. ⚠️ One thing step 2 needs and did not have: the places are seven decibels apart

Not a fight question, but measured in the same pass and it decides a number step 2 has to state.
Through the shipped bus, K-weighted, at each place's `run` — which since
[0226](../docs/decisions/0226-the-level-holds-one-loudness.md) is very nearly each place's whole
track:

| place | LUFS at `run` |
|---|---|
| saurian | **−13.74** |
| core | −14.62 — as [0330](../docs/decisions/0330-the-black-heart-is-driven.md) leaves it; it was −18.29 |
| nebula | −14.97 |
| approach | −15.78 |
| rime | −16.02 |
| mire | −17.36 |
| labyrinth | **−20.64** |

⚠️ **A SEVEN-DECIBEL SPREAD, AND SPOTIFY NORMALISES PER TRACK.** Its target is −14 LUFS integrated, so
as an album these seven would be pulled to within a decibel of each other on playback — **The
Labyrinth up by nearly seven and Saurian Belt untouched.** Whatever the run of seven is supposed to
feel like as a sequence, that is not it: the quiet place is quiet on purpose
([0191](../docs/decisions/0191-a-place-sits-somewhere.md) is the field that says so) and the
normaliser would spend that.

⚠️ **THAT IS A CHOICE FOR STEP 2 AND NOT A DEFECT HERE.** The options are to master the album so the
spread survives (one gain per track, set against the loudest, and accept that the whole album plays
quieter than −14), or to let the normaliser have it and treat each track as standalone. **It cannot be
decided by measurement** — it is what the album is for. What is measured is that the question exists
and is worth seven decibels.

⚠️ **AND THE RENDER PATH IS NOT THIS PATH.** These numbers are `tests/clean.ts`'s `loud` over the
game's bus. `scripts/hear.mjs` writes its own WAV and the album mode does not exist yet; whether it
reproduces the compressor and the shaper is step 6's business, and a number read here must be
re-measured there before it is mastered against.

## What this makes step 4

The plan's step 4 is *"open own slots at `boss`/`bossPeak`; a per-place fight ladder; the leitmotif
from the place's own `call` or `hook`; a coda that resolves it."* This report reorders it by what is
actually shared, and takes one item off:

1. **The harmonic move, first and per place.** `dread` off B–F. It is two pitch classes in six
   places, it is the layer the arrangement makes the part, and it is the cheapest edit in the list.
2. **The leitmotif, from the place's own tune.** Not *new material per place* — there is already new
   material per place and it converged. **Derived** material, which is a different instruction, and
   the one thing that makes a final movement belong to the track in front of it.
3. **The own slots.** Twenty-seven silent slots and a mechanism built for them; 0325 is the worked
   example of opening one.
4. **The gesture, last and only where it is still shared** — `drone`, `stomp`, `drive`. Three layers,
   not fourteen.
5. **Not another voicing pass.** Timbre is the quantity that is already per place, and it did not
   make the fights different.

## What is owed before step 4 opens a file

- **A listen.** Seven final movements back to back, rendered with
  `node scripts/hear.mjs --level=<kind> --fight=<seconds>`. Nothing above replaces it.

  ⚠️ **AND THE PLAN'S FIGHT LENGTHS ARE OLDER THAN THE BOSSES.** Its table was measured 2026-09-07 and
  [0307](../docs/decisions/0307-the-serpent-is-armoured.md) amended
  [0260](../docs/decisions/0260-a-boss-is-fought-to-the-end.md) four days later. The numbers there are
  fine for hearing the music; they are not fine for step 2, which states the album's static lengths,
  and they are re-measured rather than copied.
- ~~`weigh-gesture.mjs --rung=boss`~~ — **built, and it is how section 4 is produced**:
  `node scripts/weigh-gesture.mjs --all --rung=boss`. `--rung` narrows the comparison to the layers
  both places open there, through `rungOf`; `--all` prints all twenty-one pairs and tallies which
  slot the places agree on. The numbers here were found by a scratch script first and the instrument
  reproduces them exactly, which is the only reason they are quotable —
  [0029](../docs/decisions/0029-the-tracked-record-is-the-record.md).
- **The bake budget.** [0245](../docs/decisions/0245-a-budget-is-sized-under-load.md) is still
  pending and the plan's own *what not to do* says to land it or sit beside it before seven fights
  get fuller.
