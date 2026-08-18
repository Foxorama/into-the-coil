# 0171 — A boundary is a build

**Accepted 2026-08-18.** The third answer to *the section change sounds wrong*, and the first one that
is about **time** rather than about level.

> *"The push > run primarily but the other transitions for each individual level doesn't actually
> transition at the moment, it just jumps."*

## The rules

**At a section boundary, arrivals land one a bar, in the arrangement's own order.** Quietest role
first, and inside a role the quieter layer first. `entryBars` in `src/app/music.ts` is the whole of
it; `BUILD_BARS` is the cap.

**A build spans at most four bars.** Where a boundary opens more layers than that, the earliest share
the downbeat.

**Departures and swells are not arrivals and move on the boundary itself.** A layer the rung closes
leaves on the downbeat, and so does a bed that merely gets louder.

**Nothing sounding means nothing to build on, so the piece starts together.**

## ⚠️ `run → push` opened four layers on one downbeat, and it always had

`arp`, `ride`, `hook` and `lead`, at one instant, over one `RAMP_SECONDS`. Each of them a smooth
1.6-second approach, and all four the *same* 1.6 seconds — **four simultaneous fades are one event**,
and one event that adds four parts is a step however smoothly each part gets there.

⚠️ **THE FIX IS NOT A LONGER RAMP, AND THAT IS WHY TWO EARLIER ANSWERS DID NOT WORK.** Doubling
`RAMP_SECONDS` makes the same step slower. [0166](0166-the-level-is-solved-as-one-trajectory.md)
reduced the *size* of the moves and [0167](0167-a-build-does-not-duck.md) forbade the carried layers
falling — both correct, both about level, and a boundary can satisfy both while still delivering
everything it has at once.

⚠️ **THE ORDER IS NOT A NEW MUSICAL OPINION, WHICH IS WHAT MAKES THIS AFFORDABLE UNDER
[0161](0161-the-shape-of-a-level-is-not-guarded.md).** `ARRANGEMENT` has stated every layer's role at
every rung since [0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md), and `MUSIC_ROLES` is written
quietest-first. **A build is the arrivals landing in the order they are already listed in.** Nothing
here decides how long a section is, how busy it is, or what is in it.

## ⚠️ Grouping by role was tried, and it was a build in four places and a step in three

The more obviously musical rule is *the whole pulse arrives together*, one bar per **role**. It
fails wherever a place names its own lead: `roleOf` demotes the arrangement's part to a counter-line
to make room, so Saurian Reach's `push` opens `arp`, `hook` and `lead` as three counter-lines and
delivers three of its four arrivals on one downbeat.

| | boundaries left as steps | `run → push` spread |
|---|---|---|
| shipped | **35 of 35** | 0.00 s |
| one bar per role | 3 | 1.60 s in saurian and labyrinth, 4.80 s elsewhere |
| **one bar per arrival** | **0** | **4.80 s in all seven** |

⚠️ **A RULE THAT IS A BUILD IN FOUR PLACES AND A STEP IN THREE IS NOT A RULE**, and the thing that
caught it is the guard written in seconds rather than the one written in bars.
`node scripts/weigh-build.mjs` prints the table.

## ⚠️ And the order is already per-place, which is worth more than the stagger

`roleOf` reads `LEADS` and `PROMOTES`, so **what lands last at a boundary is what that place asks you
to follow there**:

| | `run → push` lands last | `approach → boss` lands last |
|---|---|---|
| Ember Nebula | `arp`, the mixture | `wraith`, the howl |
| Saurian Reach | `ride`, the kit | `frenzy` |
| The Coil Labyrinth | `ride` | `stomp`, the hound |
| The Black Heart | `hook`, the riff | `frenzy`, the tremolo |

That is [0155](0155-a-place-follows-its-own-instrument.md)'s differentiation spent on **time** instead
of on level, and it cost nothing to get — it falls out of a table seven places already fill in.

## ⚠️ Measured in the rendered audio, not in the model

[0027](0027-measure-the-picture-not-the-model.md). `node scripts/hear.mjs --level=approach` writes
the whole level as it is actually played; the high band across `run → push`, bar by bar, against the
bar before it:

| | bar 1 | 2 | 3 | 4 | 5 | whole rise |
|---|---|---|---|---|---|---|
| before | **+3.87** | +6.47 | +6.97 | +6.15 | +6.63 | 6.64 dB |
| after | **+2.57** | +5.34 | +6.06 | +5.76 | +6.60 | 6.63 dB |
| share of the rise in the first bar | **40%** → **22%** | | | | | |

⚠️ **THE RISE IS THE SAME SIZE AND IT ARRIVES OVER TWICE AS LONG.** 6.64 dB against 6.63: this change
does not make a section louder, quieter, or different in balance — every level guard in the repository
is untouched by it, which is the point. What moved is **how much of it lands in the first bar**.

⚠️ **AND THE BAR-BY-BAR FIGURES ARE NOISY, WHICH IS WORTH SAYING.** The material fluctuates bar to bar
on its own — the fourth bar reads *lower* than the third in both columns. What the measurement
supports is the direction and the first-bar share; it does not support a precise curve, and nothing
below is tuned against it.

## What this is not

⚠️ **It is not the differentiation ask.** Seven places' boundaries now happen in a different order and
that is a real difference a listener can hear, but the four loudest layers at every rung are still the
same four in all seven — `weigh-apart`'s standing finding. This moves nothing in that number.

⚠️ **It is not a tempo, and it is not a riser.** *A fast paced tempo melody that increases in tempo*
is ask 1 and is unblocked but unbuilt; a swell **into** a boundary is a one-shot with no picture and
no home in the layer model, and is deliberately not attempted here.

## Confirmed, not assumed

- `npm run typecheck` clean, `npm test` green, `npm run build` clean.
- All seven places, all five boundaries: `node scripts/weigh-build.mjs`.
- The rendered-audio table above, from `hear.mjs --level`, against the same command on `main`.
- Two probes, seen red, trees restored: `node scripts/prove-guard.mjs 0171`.

| broken on purpose | went red |
|---|---|
| every arrival back on the boundary downbeat, which is what a section change did until today | `THE REPORTED ONE: no boundary in any place delivers every arrival at one instant` |
| the build running down the arrangement instead of up, so the part lands first and the bed last | `and the arrivals go up the arrangement, so what a place asks you to FOLLOW lands last` |

⚠️ **AND FOUR OF 0117'S PROBES WERE RE-ANCHORED**, because the line they break moved. `npm run prove`
refused the tree until they were, which is [0019](0019-a-probe-must-be-seen-to-apply.md) doing its
whole job — and all four were re-run red afterwards rather than assumed still good.

⚠️ **NOTHING HERE HAS BEEN HEARD BY A PERSON.** It is a measured change to a rendered file.
[0027](0027-measure-the-picture-not-the-model.md) applies to this document.

## Rollback

Shipped audio timing. `entryBars` and the stagger in `levelWrites`, both in `src/app/music.ts`.
Revert the commit; no table, no gain and no material moves with it. No storage key, save schema, SW
cache prefix or origin.
