# 0154 — The mix is authored as intent, and the gains are solved

**Accepted 2026-08-16.** The mechanism, the measurement, and **one blocker that is not solved** —
stated here rather than discovered later. Nothing is wired into the game yet, deliberately.

> *"There's a whole bunch of rules and guardrails around the music that's causing a whole heap of
> boundaries and guidelines that keep causing problems… we'll need to refactor the whole music rules
> and definitions in the repo because it's messy, complicated and causing rework and restrictions that
> I don't want."*

## The rules

**A layer's place in the mix is authored as a ROLE, not as a gain.** `src/content/arrangement.ts`
says what each layer is at each rung — the thing you follow, the line under it, the pulse, the bed,
the air — and `ROLE_MARGIN_DB` says how far apart those sit.

**Exactly one layer is followed at a rung.** `tests/arrangement.test.ts` refuses a second.

**A place deviates by PROMOTING**, never by a multiplier, and a promotion may not appoint a second
part.

**The solve sets balance and never loudness.** Each rung is held to the summed level `MUSIC_LADDER`
already authored, so the arc and the clipping ceiling survive by construction.

## ⚠️ What a player hears was set in two tables that multiply, and neither one meant anything

`MUSIC_LADDER[rung][layer]` is 169 numbers, `THEMES[place].mix[layer]` is 259 more, and only the
product matters. **Nothing anywhere stated what the listener was supposed to be able to pick out**, so
when something could not be heard the answer was always another layer or another gain — which is how
twenty-three layers and four hundred numbers happened.

⚠️ **AND THE RULE SET FORBADE ITS OWN ANSWER.** `MIX_CEILING` is 2.6 and `mixOf` silently **clamps**
to it. Solved, **60 gains across the seven places land past it** — so the table could say one thing
and the mixer play another with nothing reporting the difference. `arp` reads exactly 2.60 in two
places because somebody drove it into the wall and the wall said nothing.

## ⚠️ The solver proved a musical fact by refusing to converge

The first arrangement gave each layer one role for the whole game. `part` means *louder than
everything else together*, and three layers cannot each be 3 dB over the sum of the rest. The solver
ran its four-hundred-iteration ceiling and left `call`, `hook` and `chords` all short of the same
target — **not a bug, an over-determined system stating its own contradiction.**

⚠️ **A ROLE THEREFORE BELONGS TO THE RUNG**, which is
[0125](0125-the-build-starts-sooner.md)'s *only arrivals are heard* and
[0120](0120-a-rung-may-close-a-layer.md)'s *a rung that closes a layer as it opens two is a change of
arrangement* arriving as a data structure. A layer arrives as the part and recedes as the next thing
arrives.

⚠️ **AND THE ARRANGEMENT IS THE SPACING, NOT THE ABSOLUTE MARGINS.** At the boss every solved layer
landed exactly 1.6 dB under its target — a **uniform** offset, because the aura is at full there, is
not solved, and the level is held. A part at +1.4 over counter-lines at −3.6 is the same arrangement
as +3 over −2. Measuring the absolute value called twelve healthy layers wrong.

## What it produces

Ember Nebula at `push`, at the same summed level:

| layer | role | gain | margin |
|---|---|---|---|
| **hook** | part | 1.63 → **2.89** | −4.8 → **+2.4** |
| call | counter | 1.29 → 2.18 | −8.0 → −2.6 |
| arp | counter | 1.66 → 2.25 | −5.0 → −2.6 |
| chords | counter | 2.00 → 1.33 | +2.1 → −2.6 |
| sub | bed | 0.85 → 0.30 | −2.0 → −9.6 |

**Zero layers out of their role's spacing, across all seven places and every rung.** The riff is the
thing you follow; the hymn came up and the choir came down to meet it; the bed sits under both.

## ⚠️ THE BLOCKER: a global arrangement collapses the seven places together

Measured the way [0147](0147-a-place-is-a-balance.md) measures it — RMS difference between two
places' balances:

| rung | shipped | solved |
|---|---|---|
| run | 3.3 dB | **2.5** |
| push | 4.0 dB | **1.7** |
| surge | 3.8 dB | **1.0** |
| approach | 4.0 dB | **0.9** |
| boss | 3.5 dB | **1.3** |

**0147 requires no two places within 3 dB, and the solved mix fails it at every rung.** That is
0147's own defect — *"it didn't feel like I'd travelled somewhere else in the galaxy"* — arriving
through its replacement, and two promotions per place are not enough to hold seven places apart when
everything else is solved globally.

⚠️ **THIS IS WHY NOTHING IS WIRED IN.** The mechanism is right and the differentiation is not solved.
Three candidates, none chosen, because the choice wants an ear:

1. **More promotions per place.** Cheapest, and the least interesting — it re-approaches 0147's 259
   numbers one line at a time.
2. **Per-place target margins.** A place could hold a wider or narrower spread between its roles,
   which is a real character difference and is four numbers rather than thirty-seven.
3. **Let places differ by MATERIAL rather than by balance.**
   [0148](0148-a-place-has-its-own-notes.md) already gave each place its own notes and mode; 0147's
   balance-differentiation was a workaround from when six places shared one composition. **That is
   no longer true**, and it is possible the honest answer is that balance should be global and 0147's
   3 dB floor is now measuring the wrong thing.

⚠️ **CANDIDATE 2 IS ALREADY REFUTED BY MEASUREMENT.** A per-place *contrast* — one number widening or
narrowing the spacing between roles — does not help, and at three rungs is **worse**: `apartBy`
normalises each layer against its own place's loudest, so a uniform widening comes back out in the
wash.

⚠️ **AND THE WAY IT FAILS IS THE ANSWER: 0147's GUARD HAS BECOME TAUTOLOGICAL.** The solve drives
every layer to its role's target and hits it to **0.00 dB**, so two places with the same arrangement
have **identical balance profiles by construction** — the 1.0–2.5 dB that remains is nothing but
their differing promotions. `apartBy` was built to measure a balance that **emerged** from 428
hand-set numbers; under an authored arrangement, balance is **specified**. The guard now asks whether
two places were given different roles, which is a question about this table rather than about how
they sound — and [0148](0148-a-place-has-its-own-notes.md) gave every place its own notes, mode and
voicing, which is exactly what `apartBy` normalises away.

⚠️ **THAT MAKES CANDIDATE 3 THE ONE THE MEASUREMENT POINTS AT, AND IT IS STILL NOT TAKEN.** Retiring a
guard on the strength of an argument is precisely how the report it was written for comes back, and
this is a model claim about a channel nothing can look at —
[0027](0027-measure-the-picture-not-the-model.md). **The rendered files are the evidence that would
settle it, and nobody has heard them.**

## Confirmed, not assumed

- `node scripts/weigh-solve.mjs` — every place, every rung, **0 layers out of their role's spacing**,
  worst 0.00 dB.
- `node scripts/hear-solved.mjs` — the shipped and solved mixes rendered as stereo through the game's
  own bus, for an ear rather than a table. 0027 for the channel nothing can look at.
- `npm test` — 1052 green; nothing the game runs has changed.
- `node scripts/prove-guard.mjs 0154` — **four probes, four red**, on the four guards named.
- ⚠️ **And `tests/arrangement.test.ts` found four real defects on its first run** — `saurian`'s `arp`,
  `rime`'s `lead`, `mire`'s `toll`, `core`'s `lead` and `drive` were all promotions to a role the
  layer already held. A place that reads as having character and has none is precisely how this table
  rots, and it rotted before it shipped.
