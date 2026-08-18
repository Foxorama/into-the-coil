# 0167 — A build does not duck

**Accepted 2026-08-18.** A property `MUSIC_LADDER` has always had, written down the day something else
took it away.

> *"The solved game music overall sounds way better, but the border change is way worse. It's not just
> this change on the approach between run and push, but every change for every level is now a hard
> jump between sounds whereas pre-'solved mix' the change was a lot smoother and balanced."*

## The rules

**At an in-level boundary, no layer sounding on both sides may fall by a decibel or more.** A section
change adds; it does not rebalance. `tests/pace.ts` owns `DUCK_FLOOR_DB` and `carriedThrough`,
`tests/themes.test.ts` asserts it, `scripts/weigh-boundary.mjs` prints it.

**A decibel because that is a level JND** — the point at which the thing being forbidden becomes a
thing that can be heard. Not a number read off a spread.

**`approach → boss` is not an in-level boundary.** The boss arriving is an event and is supposed to
reorganise the mix.

## ⚠️ The finding is a sign, not a size

Two *copy this moment* pastes of `approach` at `run → push`, desk untouched in both:

| | shipped | solved |
|---|---|---|
| `drone` | 0.34 → 0.34 | 0.55 → **0.52** |
| `sub` | 0.62 → 0.76 | 0.29 → **0.23** |
| `engine` | 0.74 → 0.79 | 0.34 → **0.33** |
| `perc` | 0.59 → 0.68 | 2.72 → **2.55** |
| `chords` | 0.86 → 0.87 | 0.49 → 0.67 |
| `groove` | 1.32 → 1.55 | 1.23 → 1.33 |
| `call` | 0.99 → 1.09 | 2.73 → **1.95** |
| opening | arp, ride, hook, lead | arp **2.18**, hook **2.23**, lead 1.46, ride 0.60 |

⚠️ **The shipped column has no negative numbers in it.** The largest solved move is 2.9 dB, which is
small — the objection is that **the bed ducks to pay for the arrivals**, so the mix inverts at the
instant four new parts enter.

Over all seven places and all three in-level boundaries:

| | carried layers made quieter | worst | boundaries left additive |
|---|---|---|---|
| shipped ladder | **0** audibly | **−0.26 dB** | **21 of 21** |
| solved mix | **56** | **−11.2 dB** | 3 of 21 |

At `surge → approach` the solve takes **all ten** carried layers down, 1.7 to 5.3 dB, while two open.

## ⚠️ 0166's guard is green over every one of them

[0166](0166-the-level-is-solved-as-one-trajectory.md) holds the **magnitude** of the worst boundary
move under the per-rung solve's. At the reported boundary that is 2.9 dB against a headline of 11.2 —
comfortably inside.

⚠️ **The quantity came from the previous report's vocabulary instead of from the complaint.** *Lurch*
and *moves ≥ 6 dB* are about size, and
[`the-arrangement-holds-the-wrong-thing`](../../reports/the-arrangement-holds-the-wrong-thing-2026-08-17.md)
was written about 8.7–13.7 dB moves, so size was right **for that report**. This report's word was
*jump*, which sounds like the same thing and is not.
[0027](0027-measure-the-picture-not-the-model.md), inside a guard one day old, and the second time in
this sequence that a measurement agreed with itself while a listener did not.

## ⚠️ Three fixes measured and refused

| | ducked | adrift (0164) | worst summed peak, ceiling **2.17** |
|---|---|---|---|
| shipped ladder | 0 | 91 | **2.15** — under, in all seven |
| today's solve | 56 | **0** | 2.53 — over in five of seven |
| clamp carried layers inside the solve | 0 | 37 | runs away; the solve does not converge |
| lift the whole rung until nothing falls | **0** | **0** | **16.04** — 17 dB over |
| shipped ladder's motion, solve's balance | **0** | 44 | 2.51 — over in four of seven |

⚠️ **THE HEADROOM COLUMN IS THE PEAK OF THE SUMMED WAVEFORM, WHICH IS THE ONLY MEASURE THAT MEANS
ANYTHING HERE.** An earlier version of this table used the sum of the *gains* — and the shipped ladder
reads **17.96** on that, eight times the same ceiling, while sounding fine. A sum of gains assumes
every layer peaks on the same sample and they do not. `tests/themes.test.ts`'s own clip guard and
`scripts/weigh-mix.mjs` both walk the waveform; this now does too.


**The clamp ratchets.** A floored layer can only rise, the renormalise pushes the rest down, the
margin step pushes them back; four hundred iterations later the level has run away.

**The lift is correct and unaffordable.** `solveMix`'s own comment supplies the lever — *"margins are
ratios, so scaling every gain together cannot move one"* — so lifting a rung until nothing falls costs
**nothing** in balance or audibility. It needs **6 to 10 dB per boundary**, compounding, and lands the
summed peak at **16.04** against a ceiling of 2.17 — **17 dB over**, where the shipped ladder sits at
2.15 and the solve at 2.53.

**Re-basing works and costs audibility**: 44 layers back under 0164's floor, against the solve's 0 and
the shipped ladder's 91 — and its headroom is the solve's, 2.51 against 2.53. **It is the only
candidate that gets the direction right at a cost anything currently played also pays.**

⚠️ **AND THE SOLVE ALREADY FAILS THE CLIP GUARD, WHICH NOTHING HAD RECORDED.** `tests/themes.test.ts`'s
*no theme at any rung drives the bus past full scale* runs over `MUSIC_LADDER` only, and the shipped
ladder clears it in all seven places. The solved mix peaks at 2.53 against 2.17 in five of seven, and
the re-based one at 2.51 in four. **That is a second blocker on shipping either**, independent of this
decision, and it is caught the moment the toggle stops being a toggle.

## ⚠️ What that means: the arrangement asks for more than the mix can pay for

At a fixed loudness, role targets for four arriving layers and an untouched bed are **incompatible**.
One of three has to give:

1. **the arrivals are quieter than their role asks** — the shipped ladder's answer, priced at the 91
   inaudible layers [0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md) found;
2. **the bed ducks** — the solve's answer, priced at this report;
3. **the ceiling rises** — no headroom.

⚠️ **A FOURTH LOOKED LIKE THE REAL ONE AND IS REFUTED.** The arrivals need gains past `MIX_CEILING` to
reach an ordinary margin **because their material is quiet** — `wraith` averages 2.65, `frenzy` 2.55,
`hook` 2.06 — which is [0140](0140-no-layer-is-inaudible.md)'s *a gain is not a loudness* one layer
up. The obvious reading is that louder material buys the same margin for less level and relieves all
three constraints at once.

**Measured, it relieves none of them.** Lifting the seven loudest-gain layers' material by 6 dB:

| | ducked | adrift | past `MIX_CEILING` | worst raw sum |
|---|---|---|---|---|
| as it is | 56 | 0 | 23 | 20.47 |
| material +6 dB | **52** | 2 | **25** | 20.31 |

⚠️ **AND THE REASON IS THE ONE THING THE SOLVE IS FOR.** It targets BALANCE, and renormalises to hold
the rung's summed level — so a louder layer needs less gain and contributes exactly the same amount.
**Material loudness cancels out of a balance.** It moves the gain NUMBER and not the mix, and the
`MIX_CEILING` violations get slightly worse rather than better, because the renormalise lifts
everything else to fill the level the louder layers no longer need.

⚠️ **THIS DOCUMENT ASSERTED IT BEFORE CHECKING IT, AND THE CHECK TOOK TWENTY MINUTES.** CLAUDE.md: an
assumption is discharged or owed and never merely labelled. It is left in, refuted, because the next
person to look at this will have the same idea.

## What this is not

⚠️ **No mix number moves.** The guard is over `MUSIC_LADDER × mixOf`, which is what ships and which
already passes. The solved mix is still a dashboard toggle, and this records why it cannot come off
the toggle yet.

⚠️ **THE FLOOR'S VALUE IS NOT PROVABLE AGAINST THE CURRENT SUBJECT, AND NO PROBE PRETENDS IT IS.** The
shipped ladder's worst reduction is 0.26 dB, so the suite is green at any bound looser than that —
every value from −1 to −∞. What discriminates it is a candidate mix that ducks by between one and six
decibels, and there is not one in the tree. **`DUCK_FLOOR_DB` is defensible because it is a
definition** — the level a listener starts to notice — rather than a threshold fitted to a spread,
which is the one kind of number CLAUDE.md's *no counting guard* allows without a gap under it. The
probes hold the **direction**, at two different boundaries, which is the part that can be broken.

## Confirmed, not assumed

- Both figures from the player's own `copy this moment` pastes, then reproduced over all seven places
  by `scripts/weigh-boundary.mjs`, which shares `carriedThrough` with the guard — 0029.
- The shipped ladder's three reductions anywhere in a level: `drone` −0.26, `chords` −0.20, `sub`
  −0.17 dB.
- The three refused fixes were each implemented and measured, not argued about;
  [`a-build-does-not-duck`](../../reports/a-build-does-not-duck-2026-08-18.md) has the tables.
- Two probes, seen red, trees restored: `node scripts/prove-guard.mjs 0167`.

| broken on purpose | went red |
|---|---|
| mire's sub ducked at push to make room for the four layers that open there | `0167 — A BUILD DOES NOT DUCK: nothing already sounding gets audibly quieter when a section opens` |
| engine ducked at `approach`, so the last in-level boundary is the one that regresses | `0167 — A BUILD DOES NOT DUCK: nothing already sounding gets audibly quieter when a section opens` |

## ⚠️ Amended 2026-08-18: the third mix is on the desk

Asked, on being handed the three-way table above: *"yeah chuck it on the dashboard and let's have a
listen."*

The header's **mix** picker now has three positions rather than a `solved mix` checkbox —
`shipped`, `solved`, `re-based` — and `scripts/solve-mix.mjs` grows `rebasedLevel`. Nothing about
what the game plays changes; `shipped` is still the default and still what `src/` uses.

⚠️ **`re-based` IS ADDITIVE BY CONSTRUCTION, AND *by construction* IS A CLAIM.** It multiplies each
layer by a per-layer constant, which preserves the shipped ladder's boundary ratios **only while that
constant is the same on both sides**. A per-rung renormalise — the first thing anybody reaches for on
seeing the 2.51 summed peak — makes it rung-dependent and quietly puts the ducking back: 11 carried
layers at `push`-based, 25 at `surge`-based. Measured before this shipped, guarded after it, and
probed.

⚠️ **THE REFERENCE RUNG IS `push` BECAUSE IT COSTS THE LEAST**: 44 layers under 0164's floor, against
79 re-based on `run` and 45 on `surge`.

⚠️ **AND THE PASTE NOW SAYS WHICH MIX IT IS.** Two moments were copied at the same boundary, one per
mix, and neither carried that fact — the entire comparison rested on a covering note. *copy this
moment* prints `**mix** \`solved\` · steady 0.40` beside the transport.

Driven at `run` with the transport parked, the same eight layers:

| | `sub` | `engine` | `chords` | `perc` | `call` | `groove` |
|---|---|---|---|---|---|---|
| solved | 0.29 | 0.34 | 0.49 | 2.72 | 2.73 | 1.23 |
| re-based | 0.18 | 0.31 | 0.66 | 2.22 | 1.78 | 1.13 |

and into `push` the re-based mix moves **every one of them up** — 0.23, 0.33, 0.67, 2.55, 1.95, 1.33 —
where the solve takes `sub`, `perc` and `call` down. That is the whole difference, audible on a
switch.
