# 0140 — No layer is inaudible, and a gain is not a loudness

**Accepted 2026-08-13.** The first measurement this project has made of **what a mix number actually
produces**, and it found one layer nobody could hear.

> *"Is it on purpose that we've got such varied volume levels on the effects? Hook and Drive for
> example, hook I can barely hear and drive is quite loud and clear by comparison."*

## The rules

**A gain is not a loudness, and the second one is now measured.** `scripts/weigh-audition.mjs` prints
what every audition button puts out; `tests/pace.ts` owns the arithmetic and `tests/themes.test.ts`
holds a floor under it.

**No layer a rung opens may sit more than `AUDIBLE_FLOOR_DB` under the loudest layer of its own
place, on RMS *and* peak together.**

**And when in doubt, too loud beats inaudible.** Stated by the player and adopted as the ordering for
the whole tuning pass:

> *"I think cacophony is probably a better result than having half of the sounds completely inaudible
> and then we can tone down the cacophony."*

⚠️ **THAT IS A RULE ABOUT WHICH ERROR TO MAKE, AND IT IS WHY THIS DECISION RAISES A LAYER RATHER THAN
FILING A FINDING.** A layer that is too loud is a complaint anybody can make after one listen; a layer
that is inaudible produces **no report at all**, and this one produced none for the entire life of the
place it lives in.

## ⚠️ The finding: the faders span 7 dB and what comes out of them spans 38

`MUSIC_LADDER × mixOf` is what a hand sets and what
[0130](0130-a-layer-can-be-heard-on-its-own.md) writes into the audition fader. Across a place those
values span about **7 dB** (0.50 to 1.28). What they *produce*, over each layer's own material, spans
**38.5 dB in level one and 57.5 dB in Ember Nebula**.

⚠️ **SO EVERY MIX NUMBER IN THIS PROJECT HAS BEEN SET AGAINST A QUANTITY NOBODY COULD SEE**, including
the numbers inside the guards that already stand over the mix. Seven decisions have tuned this
composition. None of them multiplied a gain by the material underneath it.

The pair the report named, at their own audition gains:

| | level one | Ember Nebula |
|---|---|---|
| drive over hook | **6.1 dB** | **9.8 dB** |
| of which the FADER | 2.2 dB | **−1.8 dB** |
| of which the MATERIAL | 3.9 dB | **11.7 dB** |

⚠️ **IN EMBER NEBULA THE TABLE ASKS FOR THE OPPOSITE OF WHAT THE SPEAKERS DO.** `hook` is mixed at
0.94 and `drive` at 0.76 — the mix says hook is the louder — and drive comes out 9.8 dB up. That is
the gap between *target* and *live* that [0126](0126-the-dashboard-is-the-instrument.md) built two
columns to show, arriving in the tables instead of in the graph.

## ⚠️ The floor is a hand's guess, and the spread had a ten-decibel hole in it

Asked for in those terms: *"I'm not entirely [sure] how to specify the floor by ear at the moment, so
let's go from the measured spread and then see how it plays out as the min floor."*

Every layer of every place, ranked by **the better of its two measures** — which is what a floor has
to clear:

| | |
|---|---|
| `nebula` / `ride` | **−38.1 dB** |
| *— a 10.0 dB gap —* | |
| `nebula` / `arp` | −28.1 |
| `debris` / `ride` | −25.0 |
| `forge` / `arp` | −24.7 |
| five more `ride`s | −24.6 |
| three `crash`es | −23.9 … −23.6 |

⚠️ **ONE LAYER IS ON THE FAR SIDE OF A CHASM AND THE REST ARE A POPULATION**, so `AUDIBLE_FLOOR_DB`
= **−33** sits in the hole, five decibels clear of the healthy cluster. It flags **1 of 161** and the
one it flags is ten decibels clear of the next.

⚠️ **THAT IS WHAT CLAUDE.md's *no counting guard* DEMANDS.** Line, `case` and slice ceilings were each
measured against the predecessor and each refused, because every candidate flagged a healthy file as
loudly as a sick one. **If a later mix pass closes that gap, this number stops being defensible and
should GO rather than be widened** — a threshold that gets widened to stay quiet has stopped being a
guard.

## ⚠️ Both measures have to condemn a layer, and that is the load-bearing clause

RMS counts the silence between notes; peak counts one sample. Either alone convicts a healthy layer:

- **`crash` reads 38.5 dB down on RMS** — four strikes in twelve seconds — while being the most
  conspicuous sound in the approach. It fails RMS, passes peak, and stays.
- A continuous pad reads like a click on peak alone.

`scripts/probes/0140-no-layer-is-inaudible.mjs` plants the one-measure version, which looks strictly
stricter and is simply wrong.

## What moved, and it is the player's ear rather than the guard

| | from | to | |
|---|---|---|---|
| `nebula` `ride` tick | 0.05 | **0.125** | peak −38.1 → **−30.2 dB** |
| base `ride` wash | 0.052 | **0.13** | peak −24.6 → **−16.7 dB** |
| base `ride` bell | 0.036 | **0.09** | raised with the wash, so the shape does not change |

> *"Gut feeling on listening to them from the dashboard is probably that the ride needs to be 2-3× as
> loud as it is because otherwise it'll be overwhelmed."*

**2.5×, the middle of the range asked for**, which is +7.96 dB and is what both rows moved by.

⚠️ **ONLY THE NEBULA ONE WAS UNDER THE FLOOR.** The base ride at −24.6 dB is inside the healthy
cluster and is raised on the player's ear alone — and it **moves all seven places**, because six of
them share that voice. It is called out in `src/content/music.ts` at the line rather than folded in,
and reverting it is one number.

⚠️ **THE MATERIAL AND NOT THE MIX, WHICH IS A CHOICE ABOUT WHICH LEVER.** Nebula's `ride` mix is 0.6;
raising *that* would say *this place wants more ride*. What is true is that a 25-millisecond tick at
gain 0.05 puts out almost nothing wherever it is mixed. [0136](0136-the-place-has-a-room-and-an-arc.md)
shortened that voice tenfold **and** dropped the bell beside it — both deliberate, and neither was
checked for what it left behind.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| Ember Nebula's ride back to the level the report was written about | `0140 — NO LAYER A RUNG OPENS IS INAUDIBLE UNDER THE REST OF ITS OWN PLACE` |
| the floor condemning a layer on RMS alone, so a sparse cymbal reads as inaudible | the same guard |

## What was rejected

**Picking the ride's level myself.** [0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md) says a
mix number is an ear; the measurement can say *this cannot be heard* and cannot say *this is right*.
The 2.5× is the player's, asked for and quoted.

**Raising everything under the floor to the floor.** Mechanical, defensible, and it would have made
four more changes nobody asked for on the same day the player said the tweaks are not yet named. The
floor's job is to refuse a new one, not to retro-fit the old ones.

**A floor in absolute terms, against full scale.** Relative to its own place survives a change to
`MUSIC_GAIN`, to the bus shaper, or to any master a later decision puts in front of it — and the
question being asked is *can this be heard against the rest of what is playing*, which is a ratio.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix, no origin. Three gain literals under `src/content/`, one script, one shared function,
one guard. **The audio changes** — that is the point of it — and `docs/state-of-play.md` carries the
before-and-after so a listener can say it went the wrong way.
