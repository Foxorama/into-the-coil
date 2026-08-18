# A build does not duck — why the solved mix jumps at every boundary

**2026-08-18.** Measured from two *copy this moment* pastes of the same boundary, one per mix, with
the desk untouched in both.

> *"The solved game music overall sounds way better, but the border change is way worse. It's not
> just this change on the approach between run and push, but every change for every level is now a
> hard jump between sounds whereas pre-'solved mix' the change was a lot smoother and balanced."*

## The two pastes, side by side

`approach`, `run → push`, every layer sounding on both sides:

| layer | shipped | | solved | |
|---|---|---|---|---|
| | run → push | dB | run → push | dB |
| `drone` | 0.34 → 0.34 | 0.0 | 0.55 → 0.52 | **−0.5** |
| `sub` | 0.62 → 0.76 | +1.8 | 0.29 → 0.23 | **−2.0** |
| `engine` | 0.74 → 0.79 | +0.6 | 0.34 → 0.33 | **−0.3** |
| `perc` | 0.59 → 0.68 | +1.2 | 2.72 → 2.55 | **−0.6** |
| `chords` | 0.86 → 0.87 | +0.1 | 0.49 → 0.67 | +2.7 |
| `groove` | 1.32 → 1.55 | +1.4 | 1.23 → 1.33 | +0.7 |
| `call` | 0.99 → 1.09 | +0.8 | 2.73 → 1.95 | **−2.9** |
| *opening* | `arp` 1.18, `ride` 1.19, `hook` 1.22, `lead` 0.98 | | `arp` 2.18, `ride` 0.60, `hook` 2.23, `lead` 1.46 | |

⚠️ **The shipped column has no negative numbers in it and the solved column has four.** That is the
whole report. The largest solved move is 2.9 dB, which is small — what a listener is objecting to is
not how far anything moved but that **the bed ducks to pay for the arrivals**, so the mix inverts at
the instant four new parts enter.

## ⚠️ It is every boundary, and the shipped ladder has never done it once

`node scripts/weigh-boundary.mjs [--solved]`, over all seven places and all three in-level boundaries:

| | carried layers that get quieter | worst reduction | boundaries that stay additive |
|---|---|---|---|
| shipped ladder | **0** by any audible amount | **−0.26 dB** | **21 of 21** |
| solved mix | **56** | **−11.2 dB** | 3 of 21 |

The shipped ladder's three reductions anywhere in a level are `drone` −0.26, `chords` −0.20 and `sub`
−0.17 dB — all well under a level JND. **A section change in this game has always been purely
additive**, and nothing wrote that down or guarded it.

## ⚠️ And 0166's guard is green over all of it

[0166](../docs/decisions/0166-the-level-is-solved-as-one-trajectory.md) measures the **magnitude** of
the worst boundary move and holds it under the per-rung solve's. At the reported boundary that number
is 2.9 dB against a headline of 11.2 — comfortably inside, and the guard passes.

⚠️ **The quantity was taken from the previous report's vocabulary rather than from the complaint.**
*"Lurch"* and *"moves ≥ 6 dB"* are about size;
[`the-arrangement-holds-the-wrong-thing`](the-arrangement-holds-the-wrong-thing-2026-08-17.md) was
written about `surge→approach` moves of 8.7 to 13.7 dB, so size was the right quantity **for that
report**. A listener's word this time was *"jump"*, which sounds like the same thing and is not.
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md), inside a guard one day old.

## Why the solve does it

`solveMix` renormalises each rung to the summed level the **shipped ladder** produces at that rung.
The shipped level rises 1.4–2.1 dB into `push` — but the solve gives the four arrivals large shares
(`arp` 2.18, `hook` 2.23) and the total is pinned, so the carried layers must come down to pay for
them. The shipped ladder has no level constraint at all: it adds, and the sum lands where it lands.

## ⚠️ Three fixes, priced, and none of them ships

| | carried layers ducked | adrift under 0164's floor | worst summed peak (ceiling **2.17**) |
|---|---|---|---|
| shipped ladder | 0 | 91 | **2.15** — under, in all seven places |
| *today's solve* | 56 | **0** | 2.53 — over in five of seven |
| clamp carried layers inside the solve | 0 | 37 | the solve does not converge |
| lift the whole rung so nothing falls | **0** | **0** | **16.04** — 17 dB over |
| shipped ladder's motion, solve's balance | **0** | 44 | 2.51 — over in four of seven |

⚠️ **THE HEADROOM COLUMN IS THE PEAK OF THE SUMMED WAVEFORM.** An earlier version of this table used
the sum of the *gains*, on which the shipped ladder reads **17.96** — eight times the same ceiling,
while sounding perfectly fine, because a sum of gains assumes every layer peaks on the same sample and
they do not. `tests/themes.test.ts`'s clip guard and `scripts/weigh-mix.mjs` both walk the waveform.
Two of the three refusals below were written against the wrong quantity; both survive the right one,
and the third — re-basing — turns out to be **cheaper than it looked**.


**The clamp ratchets.** A floored layer can only rise, the renormalise pushes everything else down,
the margin step pushes it back, and four hundred iterations later the level has run away.

**The lift is correct and unaffordable.** `solveMix`'s own comment supplies the lever — *"margins are
ratios, so scaling every gain together cannot move one"* — so lifting a whole rung until nothing falls
costs **nothing** in balance or audibility. It needs **6 to 10 dB per boundary**, compounding down the
chain, and lands the summed peak at **16.04** against 2.17 — 17 dB over, where the shipped ladder sits
at 2.15.

**Re-basing works and costs audibility.** Keeping the shipped ladder's per-layer rung ratios and
re-basing the balance onto the solve is additive by construction — and puts 44 layers back under
0164's floor, against the solve's 0 and the shipped ladder's 91. Its headroom is the solve's — 2.51
against 2.53 — so it costs nothing there that is not already being paid. **It is the only candidate
that gets the direction right at a price anything currently played also pays.**

⚠️ **AND THE SOLVE ALREADY FAILS THE CLIP GUARD, WHICH NOTHING HAD RECORDED.** `tests/themes.test.ts`'s
*no theme at any rung drives the bus past full scale* runs over `MUSIC_LADDER` only. The shipped
ladder clears 2.17 in all seven places; the solved mix peaks at **2.53** in five of seven and the
re-based one at 2.51 in four. That is a second, independent blocker on either coming off the toggle.

## ⚠️ The finding: the arrangement is asking for more than the mix can pay for

At a fixed loudness, **role targets for four arriving layers and an untouched bed are incompatible**.
One of three things has to give:

1. **the arrivals are quieter than their role asks** — the shipped ladder's answer, and its price is
   the 91 inaudible layers [0164](../docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md)
   found;
2. **the bed ducks** — the solve's answer, and its price is this report;
3. **the ceiling rises** — 6 to 10 dB per boundary, which there is no headroom for.

## ⚠️ The fourth option, priced — and it does not work

The arrivals need gains past `MIX_CEILING` because **their material is quiet**:

| layer | mean solved gain | peak |
|---|---|---|
| `wraith` | 2.65 | 4.46 |
| `frenzy` | 2.55 | 4.04 |
| `hook` | 2.06 | 2.64 |
| `arp` | 1.94 | 2.43 |
| `dread` | 1.92 | 2.90 |
| `call` | 1.77 | 2.73 |
| `counter` | 1.53 | 2.85 |

That is [0140](../docs/decisions/0140-no-layer-is-inaudible.md)'s *a gain is not a loudness* one layer
up, and the obvious reading is that louder material buys the same margin for less level and relieves
all three constraints at once.

**Lifting those seven layers' material by 6 dB:**

| | ducked | adrift | past `MIX_CEILING` | summed peak |
|---|---|---|---|---|
| as it is | 56 | 0 | 23 | 20.47 |
| material +6 dB | **52** | 2 | **25** | 20.31 |

⚠️ **IT RELIEVES NOTHING, AND THE REASON IS WHAT THE SOLVE IS FOR.** It targets BALANCE and
renormalises to hold each rung's summed level, so a louder layer needs less gain and contributes
exactly the same amount — **material loudness cancels out of a balance**. It moves the gain number
and not the mix. The ceiling violations get marginally *worse*, because the renormalise lifts
everything else into the level the louder layers no longer need.

⚠️ **THIS REPORT ASSERTED IT BEFORE CHECKING IT.** The check took twenty minutes and it is left in,
refuted, because it is the first idea anybody has on reading the three refusals above.

## What is fixed here

**Only the guard.** No mix number moves. The property the shipped ladder has always had is now
written down and held: at an in-level boundary, no layer sounding on both sides may fall by a decibel
or more. It is green on `MUSIC_LADDER` with 0.74 dB to spare and red on the solved mix in 56 places,
which is the blocker on shipping it recorded as a test rather than as a paragraph.
