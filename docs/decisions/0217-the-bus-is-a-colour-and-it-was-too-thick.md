# 0217 — The bus is a colour, and it was too thick

**Accepted 2026-09-03.**

> *"there's also what seems to be a distortion issue… the approach compared to ember nebula sounds
> distorted a bit and some of the boss music has similar distortion, it just doesn't sound crystal
> clear and clean. I'm not sure how else to describe it."*

## The rule

**`MUSIC_DRIVE` is 0.15, and it was 0.3.** The music bus still runs through `saturate` —
[0104](0104-the-gun-plays-a-figure.md) put it there on purpose and a linear bus would be deleting a
feature — but at half the amount.

**How dirty the bus is has a guard now**, in `tests/themes.test.ts`, riding the walk that already
drives every place at every rung.

## ⚠️ It is not clipping, and I nearly recorded that it was

The first draft of `tests/clean.ts` opened by claiming *the clipping guard has never heard a place*,
on the evidence that `tests/music.test.ts`'s **no rung clips** bakes with no theme and scales by
`MUSIC_LADDER` directly. That much is true and it is not the guard that covers this.

**`tests/themes.test.ts` walks every place at every rung**, through `rungOf`, `mixOf` and the aura's
own ceiling, with the browser's clamp modelled — and it is green for a good reason. The peaks over
full scale that `scripts/weigh-clean.mjs` reports are **single samples**: Ember Nebula's `boss`
touches 1.33 for an instant, and the share of the signal actually flattened is **0.0089%** at worst,
about one sample in eleven thousand, each 0.054 dB out. [0176](0176-the-re-based-mix-is-the-mix.md)
already refused to trim 1.85 dB off the music to make that go away, and it was right to.

⚠️ **SO WHAT A LISTENER IS HEARING IS THE SATURATION ITSELF**, working hardest where the mix is
loudest — which is exactly why the places and rungs named in the report are the loud ones. **A
clipping guard would never report it**, because the bus was doing precisely what it had been told to.

## The quantity, and why nothing here had it

⚠️ **LEVEL CANNOT SEE SATURATION.** A bus driven to 1.33 leaves the shaper at 1.00, so every peak
reading says the mix is fine while the loudest third of the signal is being squashed. The clamp share
answers *is anything flattened* and its answer was a rounding error.

**What was missing is how much of the output no gain explains.** Fit the best single multiplier to
the clean signal; whatever is left is what the shaper added. It is the standard definition of
non-linear distortion, it needs no reference tone, and it is three dot products riding a loop that was
already running.

| place / rung | at 0.3 | at 0.15 |
|---|---|---|
| The Approach `push` ← **the reported comparison** | −16.6 | **−21.1** |
| Ember Nebula `push` | −18.3 | −23.3 |
| The Approach `boss` | −15.3 | −19.2 |
| Ember Nebula `boss` | −15.1 | −19.0 |
| Saurian Belt `surge` (dirtiest in the game) | −13.0 | −16.8 |
| The Labyrinth `run` (cleanest) | −30.7 | −36.8 |

⚠️ **THE REPORT'S OWN COMPARISON IS IN THE TABLE AND IT WAS REAL.** The Approach sat **1.7 dB dirtier
than Ember Nebula at `push`** and 1.4 dB at `surge` — the two rungs a level spends most of its length
at. A listener naming those two places was reading a difference that measures.

## ⚠️ The constant had been chosen twice, and both times correctly

`MUSIC_DRIVE` went **0.15 → 0.22** ([0108](0108-the-bed-is-felt-and-the-boss-arrives.md), swept on
the column for *"the boss music isn't increasing proportionally"*) **→ 0.3**
([0114](0114-the-fight-is-a-different-piece.md), because *"the boss music was better, but too subdued
and quiet against the game sfx themselves"* — a shaper buys loudness at the same peak, which a gain
cannot).

**Both moves were measured, and both were right about what they measured.** Neither measured what the
shaper costs, because nothing in the repository could. That is the shape of this defect: not a wrong
decision, but a quantity outside every instrument that existed.

## What it costs, stated rather than discovered

⚠️ **ABOUT 2.4 dB OF MUSIC LEVEL.** The table above `MUSIC_DRIVE` measures `run` RMS at **0.376 for
0.3 and 0.285 for 0.15** — and 0114 raised this constant precisely to answer *too subdued against the
game sfx*. **That report may come back.** If it does, `MUSIC_GAIN` is where it is answered now, and
the shaper is no longer standing in for a level control.

⚠️ **THE DYNAMICS IMPROVE, WHICH IS THE ONE THING THAT GETS BETTER FOR FREE.** Boss-over-run is
**+1.7 dB at 0.3 and +2.1 dB at 0.15**, because a shaper on a summed bus takes the arrival away first.
0108 chose 0.22 on that column and 0114 spent it again for level.

⚠️ **AND EVERY EXISTING GUARD STILL HOLDS AT 0.15**, which was the risk worth checking before
anything else: 0104's *the bed is not quieter than the gun*, 0108's *the shaper has not flattened the
ladder*, and the per-place clamp share. The trade was put to the player with the numbers, and this is
the answer they chose.

## Three mistakes of my own, all in the instrument

1. **The false finding above.** Corrected before it shipped; the file now opens by saying which guard
   covers this and why its answer is right.
2. **`saturate` called unclamped.** A `WaveShaperNode` clamps its input to [−1, 1] first, so my `out`
   column reported 1.03 for a bus that cannot exceed `saturate(1)` — **the exact modelling error 0176
   exists to have fixed**, made again three lines from a comment describing it.
3. **A `Map` lookup per layer per sample**, which put the script past ten minutes before it printed
   anything. Twenty-three lookups a sample over a million samples over forty-nine combinations.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0217`.

| broken on purpose | went red |
|---|---|
| the bus driven back to 0.3, which is where the report came from | `and no theme at any rung drives the bus past full scale` |
| the distortion measured against nothing, so every bus reads clean whatever it does | `and no theme at any rung drives the bus past full scale` |

The first reddens as *"approach at boss is −15.3 dB dirty"*, which is the report in the guard's own
words. **Two probes belonging to other decisions were stranded by this change and re-anchored** —
0104's and 0108's both pinned the drive's literal, and 0176's pinned the clamp line this split in two.

## What is owed

**A listen, and there is a second report already waiting behind this one.** *"I'm a little dubious on
everything being stereo… some of the tracks are one ear only and aren't stereo, in some cases it's
good, but in other cases it comes off a little weird."* That is a separate subject — `LAYER_PAN` and
[0209](0209-the-rig-hears-in-stereo.md) — and it has not been looked at here.

⚠️ **AND IF IT IS STILL NOT CLEAN, THE NEXT LEVER IS NOT THIS ONE.** At 0.15 the dirtiest thing in the
game is Saurian Belt's `surge` at −16.8 dB, and that place is loud because its own `mix` makes it so.
Going further means either the drive again — which costs the loudness 0114 bought, twice — or bringing
the loud places down, which is [0191](0191-a-place-sits-somewhere.md)'s `trim` and a different
conversation about how loud a place should sit.
