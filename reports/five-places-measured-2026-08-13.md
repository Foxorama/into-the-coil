# Five places measured — 2026-08-13

**The numbers behind [0146](../docs/decisions/0146-three-more-places-and-two-after-them.md).** Taken
with `node scripts/weigh-rung.mjs`, `node scripts/weigh-place.mjs` and
`node scripts/weigh-audition.mjs`, which share their arithmetic with `tests/pace.ts` —
[0116](../docs/decisions/0116-the-rig-plays-the-level.md) is why they import the guard's own
measurement rather than restating it.

⚠️ **NOT ONE OF THESE NUMBERS IS EVIDENCE THAT THE MUSIC IS GOOD.** Every one is a model quantity —
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) — and *space laser dinosaur* is a
claim about a picture. **The verdict is a listen at `npm run dash`, and nothing here substitutes for
it.**

## Pace and balance, against the base composition at the same rung

`notes/bar` is 0102's definition of what rises when a listener says *faster*. `under 300 Hz` is the
share of A-weighted energy in the bottom two bands. `tests/themes.test.ts` refuses either below
**90%** of the base.

| rung | saurian | labyrinth | rime | mire | core |
|---|---|---|---|---|---|
| | notes / low | notes / low | notes / low | notes / low | notes / low |
| `run` | 126% / 110% | 119% / 105% | 114% / 105% | 120% / 112% | 121% / 95% |
| `push` | 114% / **94%** | 107% / 100% | 108% / **97%** | 109% / 105% | 110% / **93%** |
| `surge` | 124% / 98% | 119% / 107% | 118% / 112% | 121% / 105% | 115% / 96% |
| `approach` | 115% / 95% | 109% / **95%** | 111% / 113% | 111% / 107% | 111% / **92%** |
| `boss` | 104% / 112% | 102% / 121% | 102% / 120% | 105% / 126% | 118% / 120% |

⚠️ **EVERY PLACE IS FASTER THAN THE BASE AT EVERY RUNG**, which is the direct answer to 0134's floor
and to *"the surge from level one should be the default music speed for the next levels at the
start"* — the thinnest reading is 102% and the opening of every one of the five is 114% or more.

⚠️ **`push` IS THE TIGHT RUNG IN ALL FIVE AND IT IS STRUCTURAL.** `push` opens `arp`, `ride`, `hook`
and `lead` — four bright layers over a bed that does not gain anything new — so the low SHARE falls at
that rung in the base composition too (44.5% → 39.1%). A place with bright push material tracks that
fall and then some. Three of the five were re-balanced specifically here.

## Where the notes sit, in Hz — the arc

`pitchOf`, gain-weighted, which is [0136](../docs/decisions/0136-the-place-has-a-room-and-an-arc.md)'s
own measure and not the spectral centroid.

| rung | base | saurian | labyrinth | rime | mire | core |
|---|---|---|---|---|---|---|
| `run` | 112 | 131 | 178 | 257 | 132 | 143 |
| `push` | 161 | 217 | 234 | 366 | 223 | 192 |
| `surge` | 197 | 207 | 198 | 285 | 199 | 190 |
| `approach` | 206 | 199 | 199 | 247 | 192 | 191 |
| `boss` | 195 | 186 | 205 | 264 | 176 | 129 |

⚠️ **FOUR OF THE FIVE CLIMB INTO `push` AND FALL INTO THE FIGHT, AND NONE IS HELD TO THAT BY A
GUARD.** 0136's arc assertion is written for `nebula` alone, because the other six places did not
exist when it landed. What the table shows is that the ladder produces the shape on its own — `push`
opens the high material and `boss` closes it — so the arc is a property of `MUSIC_LADDER` rather than
of any one composition.

⚠️ **`core` FALLS FURTHEST INTO THE FIGHT — 191 Hz to 129 — AND THAT IS THE ONE THAT WAS AUTHORED FOR
IT.** The growl is an octave below every other place's, which is the difference between a growl and a
shriek.

⚠️ **`rime` SITS AN OCTAVE ABOVE EVERYTHING**, which is the ice and is also the thing most likely to
be reported as thin. Its low share is fine at every rung; where it will be judged is the ear.

## Resident cost, per place

`node scripts/weigh-place.mjs <theme>`:

| | |
|---|---|
| the base composition | **48.0 MB**, 23 layers |
| each of the five, held ALONGSIDE the base | 94.8 MB |
| each of the five, REPLACING the layers it states | **48.0 MB** |

⚠️ **THE SECOND ROW IS THE ONE THAT MATTERS AND IT IS UNCHANGED BY GOING FROM TWO PLACES TO SEVEN.**
[`what-a-whole-place-costs`](what-a-whole-place-costs-2026-08-12.md) predicted this and 0133 is what
makes it true: a place's arrays are the same length as the ones they replace, so the boundary bake
swaps them in place. `tests/sound.test.ts`'s 56 MB ceiling is untouched.

⚠️ **The bake is 3.3–3.9 s per place**, spent at the level break ([0063](../docs/decisions/0063-a-level-break-is-a-respite.md))
and split one note at a time, with the longest single job at 2.16 s against `tests/sound.test.ts`'s
3 s ceiling.

## The clipping ceiling, and how close each place gets

`saturate(x, a) ≤ 1` exactly when `x ≤ 1`, so the constraint is the summed layer values at any instant
× `MUSIC_GAIN` (0.46) ≤ 1 — a **raw sum of 2.174**. Measured at each place's own worst instant, at
`boss`:

| place | raw sum | of the ceiling | shaped peak |
|---|---|---|---|
| saurian | 2.033 | 94% | 0.997 |
| labyrinth | 2.082 | 96% | 0.988 |
| rime | — | — | 0.986 |
| mire | — | — | 0.979 |
| core | 2.058 | 95% | 0.997 |

⚠️ **A SHAPED PEAK OF 0.997 IS NOT 0.3% OF HEADROOM.** The shaper compresses hard near full scale, so
a sum at 94% of the ceiling reads as 0.997 out of it. **Read the raw sum, not the peak** — which is
the mistake this session made twice before printing the sum at all.

## Per-layer loudness — 0140's measure

`node scripts/weigh-audition.mjs`, in dB under the loudest layer of the same place.
[0140](../docs/decisions/0140-no-layer-is-inaudible.md) refuses a layer below **−33 dB on both** RMS
and peak.

| | saurian | labyrinth | rime | mire | core |
|---|---|---|---|---|---|
| loudest layer | `sub` | `sub` | `sub` | `sub` | `sub` |
| `sub` over the next | 1.6 dB | 2.6 | 6.0 | 6.5 | **9.5** |
| worst RMS | `ride` −43.0 | `ride` −44.1 | `ride` −42.2 | `ride` −45.1 | `ride` −47.0 |
| worst peak | `ride` −24.2 | `ride` −25.5 | `ride` −24.7 | `ride` −26.8 | `ride` −29.8 |

⚠️ **`ride` IS THE WORST RMS IN ALL SEVEN PLACES INCLUDING THE TWO THAT EXISTED**, and it passes on
peak every time. A 25-millisecond tick on every sixteenth is exactly the sparse-vs-continuous case
0140 says needs both measures — it is inaudible by RMS and perfectly conspicuous when it lands.

⚠️ **`core`'s `sub` IS 9.5 dB OVER ITS NEXT LOUDEST LAYER, WHICH IS THE WIDEST SPREAD OF THE FIVE AND
IS DELIBERATE-ISH.** It got there by being raised twice to hold the low-share floor at `push` and
`approach` while the guitars stayed bright. **It is the number most likely to come back as a report**,
and it is written down here rather than pre-emptively tuned, because
[0109](../docs/decisions/0109-a-death-is-a-drum.md)'s rule is that changing two channels at once makes
the next verdict unreadable.

## ⚠️ What a guard caught that an ear would have blamed on something else

`saurian`'s kick was authored at eighths with a pickup on the last *and* of the bar — the same instant
`OFFBEAT` plays the hi-NRG stab. Sixteen collisions a phrase between the two loudest low transients in
the place, measuring as **the boss mix at 1.004 of full scale**. The layer's own comment said *the
kick has the downbeat to itself* and the pattern disagreed with it.

⚠️ **Fixed by moving the kick to a sixteenth grid so its pickup sits where the stab has nothing** — a
placement rather than a gain, and the second time in this project a clipping guard has found a
rhythmic defect rather than a loudness one.

## What is NOT measured

⚠️ **Whether any of it sounds like the brief.** Five places, twenty-one layers each, and the only
instrument that can answer is `npm run dash`.

⚠️ **Whether the five are distinguishable from each other.** The numbers say they differ; *differ* and
*cannot be confused* are not the same claim, and only a listener settles the second.

⚠️ **Anything about levels one and two.** Neither was touched. The three questions
[0136](../docs/decisions/0136-the-place-has-a-room-and-an-arc.md) put to the player are still open.
