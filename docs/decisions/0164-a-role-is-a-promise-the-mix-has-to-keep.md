# 0164 — A role is a promise, and the mix has to keep it

**Accepted 2026-08-18.** The threshold [0152](0152-a-layer-is-heard-in-the-sum.md) refused to set,
now that [0154](0154-the-mix-is-authored-as-intent.md) has made it settable.

> *"Still getting sounds playing that I can't hear… it's probably not going to be just the groove and
> not just on that level, but a whole bunch of sounds and a whole bunch of levels, so if we can
> identify them all and fix them all, that'd be a lot better than me having to listen to each
> individual segment and then listen to each individual item in each segment to identify what's not
> audible."*

## The rules

**No layer may sit further under its role's stated margin than the widest step between two adjacent
roles.** Past that it is performing the role below the one the arrangement gave it, and the
arrangement is the thing being disbelieved. `tests/pace.ts` owns `adriftAt` and `ROLE_FLOOR_DB`;
`tests/themes.test.ts` asserts it; `scripts/weigh-adrift.mjs` prints it.

**The floor is derived from `ROLE_MARGIN_DB` and is never typed.** Retune the roles and it follows,
because it was never about decibels — it is about whether the five roles still mean five different
things.

**Ninety-one known offenders ship in a named list, and the guard holds it in both directions.**
Nothing new may join it; an entry that starts passing must be deleted rather than left to rot.

## ⚠️ The measurement already existed, and it was thresholdless on purpose

0152 built `margin` — how far over everything else a layer sits, in the best band it lives in, on the
ear that favours it — and deliberately did not guard it. The reason is written into `ROLE_MARGIN_DB`'s
own comment:

> `air` **IS NOT A FAILURE STATE, WHICH IS THE DISTINCTION NOTHING HERE HAS EVER HAD.** `drone` is
> the connective tissue and is *meant* to sit under everything… A guard that says *every layer must
> be audible* would flag it every time, which is why 0152 refused to set one.

⚠️ **That objection stopped being true when 0154 landed, and nobody noticed.** Once every layer has a
stated role at every rung, the unanswerable question *is this audible* becomes the answerable one
*is this the thing the arrangement said it was*. `drone` is `air`, `air` wants −13 dB, and a `drone`
at −13 now passes a guard that a `drone` at −25 fails. **The distinction the comment says nothing has
ever had is exactly what a role is**, and it has been sitting in `src/content/arrangement.ts` since
0154 without a guard reading it.

⚠️ **So this decision adds no measurement.** `heardAt` is unchanged, `bandLevels` is unchanged, the
audit in [`what-the-mix-buries`](../../reports/what-the-mix-buries-2026-08-16.md) was run over the
same arithmetic two days earlier. What is new is that the number now has something to be wrong
*against*, so a person no longer has to read the ranking and decide.

## ⚠️ The floor is derived, which is the property `AUDIBLE_FLOOR_DB` does not have

`ROLE_MARGIN_DB` is `part 3, counter −2, pulse −6, bed −9, air −13`. The steps between adjacent roles
are 5, 4, 3 and 4 dB, so the widest is **5**, and `ROLE_FLOOR_DB` is **−5 dB** — computed from the
table, never typed.

⚠️ **A layer past it is demonstrably doing a different job.** A `part` at −6 is behaving as a `pulse`;
a `pulse` at −12 is below `air`. That statement holds whatever the absolute numbers become, which is
what makes this survive a retune of the role targets — and `ROLE_MARGIN_DB` says plainly that its
values *"want an ear and have not had one yet."*

⚠️ **CLAUDE.md's *no counting guard* is the bar this had to clear**, and 0140's floor is the
comparison. −33 dB was read off one measured spread and its own comment says it *"should GO rather
than be widened"* if that spread closes. This one has nothing to widen. It is not a quantity defined
in terms of the constant it guards, either: the *measurement* is `margin`, which comes out of the
audio through seven bandpass filters and a pan law, and only the *target* comes from the table.

⚠️ **THE THIRD PROBE IS ABOUT PRECISELY THAT RISK.** A known-bad list of ninety-one names can carry
the whole result: widen the floor far enough and the guard still looks substantial and asserts nothing
about any of them. `scripts/probes/0164-a-role-is-a-promise.mjs` widens it to −30 and watches the test
go red.

## ⚠️ What it found: ninety-one, in all seven places, and four layers are most of it

Full ranking in [`what-a-role-does-not-buy`](../../reports/what-a-role-does-not-buy-2026-08-18.md).

| layer | times adrift | worst |
|---|---|---|
| **drone** | 25 | −12.2 dB (rime `surge`) |
| **perc** | 16 | −9.7 (mire `approach`) |
| **dread** | 14 | −13.5 (rime `bossPeak`) |
| **drive** | 10 | −11.4 (mire `surge`) |
| wraith, toll | 5 each | −12.7 (labyrinth `boss`) |
| frenzy | 4 | −8.2 |
| call, hook | 3 each | −8.8 |
| crash | 2 | −5.1 |
| chords, lead, stomp, sub | 1 each | −5.9 |

And what is on top of them, which is the same three the previous audit named:

| on top | times |
|---|---|
| **engine** | 15 |
| **sub** | 14 |
| **chords** | 9 |
| lead | 7 |
| counter | 6 |
| everything else | ≤ 5 each |

⚠️ **`drone` being the most frequent offender is not the previous audit's `drone` finding.**
[`what-the-mix-buries`](../../reports/what-the-mix-buries-2026-08-16.md) found `drone` in the worst
twenty six times and correctly excused it: *"it is connective tissue and is meant to be felt rather
than picked out."* This guard already grants that — it holds `drone` to `air`'s −13 and not to
anybody else's target — and `drone` **still fails, by up to 12 dB**. It is not sitting under the mix
as designed; it is absent.

⚠️ **`dread` is the sharpest single finding and it is a `part`.** A `part` is *the thing you follow*.
`dread` is the layer that arrives with the approach to the boss, it is given `part` at `approach` and
`bossPeak` in four places, and it is 8 to 13.5 dB under what that means — under `sub` and `engine`,
in `low`, every time.

## What this is not

⚠️ **It is not a mix fix, and none of the ninety-one is repaired here.** The list is the deliverable;
the guard is what stops it growing while the repairs are worked out. Doing both in one change would
mean tuning ninety-one numbers against a floor that had never been seen to fail.

⚠️ **It does not decide how they get fixed, and the obvious answer is blocked.** 0154's solve reaches
every one of these targets to 0.00 dB and cannot ship —
[`the-arrangement-holds-the-wrong-thing`](../../reports/the-arrangement-holds-the-wrong-thing-2026-08-17.md)
found it lurches 8.7–13.7 dB at every section boundary, and names the fix it needs. Until that lands,
this guard is what says how far the shipped mix is from the intent.

⚠️ **It is still not a substitute for listening** — [0027](0027-measure-the-picture-not-the-model.md).
Masking in a real ear spreads upward across bands and `heardAt` does not model that, and the role
targets are a hand's guess that `ROLE_MARGIN_DB` marks as one. What this can say without an ear is
that **two tables in this repository disagree about what the player is supposed to be able to hear**.

## Confirmed, not assumed

- All figures from `tests/pace.ts`'s own `adriftAt` over all seven places and all six fight rungs, at
  `main` d3e0d4e. The guard asserts over the same function, so the printed and the asserted figure
  cannot drift — [0029](0029-the-tracked-record-is-the-record.md).
- `ROLE_FLOOR_DB` is computed from `ROLE_MARGIN_DB` at module load; the third probe confirms the
  guard fails when it is replaced by a constant.
- Three probes, all seen red, all trees restored: `node scripts/prove-guard.mjs 0164`.

| broken on purpose | went red |
|---|---|
| the floor widened until nothing reaches it, which is how a threshold is silently retired | `0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT` |
| mire's sub halved, so the place's promoted bottom falls past the floor at rungs nobody listed | `0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT` |
| a layer that clears the floor left sitting on the known-adrift list, as a stale line would be | `0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT` |
