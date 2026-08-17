# The arrangement holds margin constant, and the ear tracks level

**2026-08-17.** Measured after a report on the dashboard's solved mix: *"the solved mix on the
dashboard is great because stuff is playing, but the transitions between sections are now terrible."*

⚠️ **THE SOLVE IS DOING EXACTLY WHAT IT WAS TOLD. WHAT IS WRONG IS WHAT IT WAS TOLD.** That is the
whole report, and three wrong answers were measured out of the way to reach it.

## The complaint, sized

Per-layer gain movement at a section boundary, all seven places:

| | worst in-level move | moves ≥6 dB across all places |
|---|---|---|
| shipped `MUSIC_LADDER` | **2.3–3.1 dB** | 14 — and all fourteen are the two aura layers at `approach→boss`, which is the boss arriving |
| the solved mix | **8.7–13.7 dB** | **57**, of which **25 are at `surge→approach`** |

`surge→approach` is the one with no event to hide behind, and it is where the complaint lives. Over a
1.6 s ramp, core's `lead` falls **13.7 dB**, rime's **12.4**, mire's `drive` **12.3**.

## Three answers that were measured and are wrong

**1. *The place hands its lead over at the boundary, so ramp the handover.*** —
[0155](../docs/decisions/0155-a-place-follows-its-own-instrument.md) does reassign what a place
follows per rung, so this was the obvious reading. **46 of the 57 lurches happen with the layer's role
UNCHANGED.** A lead handover addresses eleven of them.

**2. *Clamp how far a layer may move at a boundary.*** — worse than doing nothing. Gains are
**per-rung constants** — `src/app/music.ts` writes each layer's target at the next bar with
`setTargetAtTime` and `RAMP_SECONDS / 3`. A clamp therefore does not smooth a transition; it
permanently detunes the destination rung for its whole length. `approach` is 10.6 s and `surge` is 92.
It trades a 1.6 s problem for a 92 s one, breaks the solve's only claim, and chains forward — each
clamped rung is the wrong starting point for the next.

**3. *The anchor drifts, so hold the group level continuous.*** — real, and not the story. The layers
the solve does **not** control get louder every rung (the aura is a ceiling, not a gain): −23.6 →
−21.6 → −19.9 → −18.4 → −12.0 dB. Because `solveMix` holds each rung's summed level, everything the
arrangement does control is pushed down to pay for them. **A perfect anchor fix removes 23 of the 57.
Thirty-four survive, 23 of those with the role unchanged, and 19 of them are still at
`surge→approach`.**

## ⚠️ The finding

The arrangement's target is **margin** — how audible a layer is *against the sum of the others*, which
is [0152](../docs/decisions/0152-a-layer-is-heard-in-the-sum.md)'s whole contribution and the reason
the buried layers got found. At a boundary, layers open and close, so **the sum changes composition —
and holding margin constant then REQUIRES an enormous gain change.**

Same-role layers moving ≥6 dB of gain at a boundary, against what their margin did:

| place | boundary | layer | role | gain | margin |
|---|---|---|---|---|---|
| mire | `surge→approach` | `ride` | pulse | **−11.5 dB** | **−0.1 dB** |
| mire | `surge→approach` | `lead` | counter | **−11.3 dB** | **−0.1 dB** |
| mire | `surge→approach` | `chords` | bed | **−8.3 dB** | **−0.1 dB** |
| core | `surge→approach` | `ride` | pulse | **−9.1 dB** | **+0.3 dB** |
| core | `surge→approach` | `chords` | bed | **−8.7 dB** | **+0.4 dB** |

**31 of the 46 same-role lurches move 6 dB or more of gain while their margin moves less than 3 dB.**
Mire's `ride` gives up 11.5 dB of level to preserve its audibility to within a tenth of a decibel.

⚠️ **A listener does not hear constant audibility. They hear the fader move.** Margin is the right
target *within* a rung — it is what a mix is. It is the wrong thing to hold constant *across* one.

## What that means for the fix

**The continuity constraint belongs on GAIN, and the quantity allowed to give is MARGIN** — which is
the opposite way round from how the solver is written. Each rung is currently solved as an independent
problem from a cold start; the level should be solved as one trajectory, each rung starting from the
previous rung's gains, with movement penalised for any layer whose role has not changed and which is
open on both sides.

⚠️ **AND THE COST IS NOT YET MEASURED.** Holding gain continuous means margin drifts off target, and
by how much is exactly the number that decides whether this is the right trade — the current solve
reaches every role target to within 0.00 dB, which is the claim being spent. **That measurement is
owed before the change is judged, not after.**

⚠️ **Two things are deliberately left open**, because the evidence does not yet settle either:

1. **Whether the aura belongs inside the solve.** It is the thing driving the anchor — a ceiling
   rather than a gain, by [0091](../docs/decisions/0091-the-boss-has-an-aura.md) — and it is the
   single largest un-controlled term.
2. **Whether `approach→boss`'s 21 lurches should be kept.** That boundary is the boss arriving, the
   shipped ladder moves the aura 7.1 dB there on purpose, and an event is *supposed* to move. A fix
   that flattens it would be answering a complaint nobody made.

## What this is not

⚠️ **None of it is live.** [0154](../docs/decisions/0154-the-mix-is-authored-as-intent.md)'s
arrangement is still not wired in — `MUSIC_LADDER` and `mixOf` decide every gain the player hears, and
the solved mix is a dashboard toggle. **The shipped game does not have this problem**, which is why
its worst in-level boundary move is 2.3 dB. This is a blocker on replacing the ladder, not a defect in
the build.

## Confirmed, not assumed

- All figures from `scripts/solve-mix.mjs`'s own `solveMix`, over all seven places and all six rungs,
  at `main` 141de60.
- The role either side of each boundary is `roleOf(theme, rung, layer)` — the arrangement's own
  function, not a re-implementation.
- The per-rung-constant claim is read off `src/app/music.ts`'s `setTargetAtTime` write, not inferred.
