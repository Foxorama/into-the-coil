# 0304 — The serpent sprays

**Status:** accepted
**Supersedes the attack in:** [0290](0290-the-acid-is-serpentine.md)
**Builds on:** [0261](0261-the-serpent-throws-together.md), [0254](0254-the-hydra-grows-heads.md), [0250](0250-the-quetzal-screams.md)
**The brief:** [`the-serpent-asked`](../../reports/the-serpent-asked-2026-09-11.md)

## The ask

> *"for phase 1 can we have it shoot a forward arc of 5 globes, then phase2 it does a spray starting
> from 60degrees (so it will be shooting down behind it) then arcing around and finishing at 30
> degress (so it will be shooting up behind it)"*

The angles were read back before anything was built — sixty degrees below straight-behind, round
through the front, to thirty above straight-behind — and confirmed. The last third's acid was asked
about too, since it repeated the second phase's: **the spray, carried on.**

## What it is

- **Whole: five globes in an arc straight down the lane.** The row's attack is a plain `spray` and
  the opening phase's `shots` is five, at a spread of 0.9. It does not turn between volleys: 0290's
  wave and 0261's rake before it are gone from this phase.
- **Hurt, and at the last third: a spray.** A new arm, `sweep`: `globes` shots, one every `every`
  steps, from the mouth where it is on that step, the aim turning evenly from `from` to `to`. The
  serpent's is `π/3` to `11π/6` — twenty-one globes over one second, 270 degrees, down, forward,
  up. The hull keeps flying while it sprays, so the stream curls with the bob.
- **The jaw is held wide for as long as a spray is coming out of it** (0036).

## Why a spray is a new arm and not a fan

Every other arm leaves the hull on one step. *"Arcing around"* is over time, so this is the first
attack that outlives the step it was thrown on — and that is where both of its real decisions are.

⚠️ **ITS STATE IS FIVE FIELDS OF ITS OWN ON THE HULL.** A spray outlives its volley by a second and
the phase can turn over inside that second, so reading the attack back off the row would describe
whatever head the round has reached. And it may not share `firePhase` or `headAt`: 0261 crashed
every serpent fight because a rake's angle and the heads' count were one field.

⚠️ **THE NEXT VOLLEY WAITS FOR THE SPRAY, AND NO LONGER.** On the hardest tier the last third's
cadence is eighteen steps and a round of three heads is fifty-four, shorter than the spray: a gate
that did not wait restarts the stream over itself most of the way round. So the gate is pushed out
to the spray's end, rounded up to the fire grid (0096). A cadence already longer is left alone — a
beam adds its hold because a braced hull does nothing else, and a spraying one is still flying.

⚠️ **AND THAT WAIT IS WHY THE SPRAY IS A SECOND.** The lightning is one head of the last third's round
and its verdict is *"superb, don't change it"*, twice. Every step of spray lengthens the round, so
the lightning fell every 1.8 seconds and falls every 2.2 now. At the 1.2 seconds first proposed it
would have been 2.4.

## The two guards this reddened, and what was done about each

**0192: a red guard is never answered by changing the work to suit it.**

- **`they only get harder` compared `shots`**, and `shots` is not what a phase throws when its
  attack carries its own count: the second phase has three — handed to every head of the round, one
  of them the lightning — beside a spray of twenty-one. It read an arc of five followed by a spray
  of twenty-one as a *relief*. **The claim is unchanged and the quantity is fixed**: the guard now
  compares each phase's biggest volley, which is `shots` for every arm that spends it.
- **The pair of flight and fan was held unique over the real bosses**, and the serpent is now a bob
  and a spray — the hydra's pair. This is the correct change that reddened it: a real boss is told
  apart by what only it throws, which the *mark* guard still holds hard, and an opening that is
  simple on purpose is not two skins on one fight. **Demoted to `tests/authored.ts`**, where it is
  printed every run. The mid-bosses' half stays hard: a mid-boss IS its pair (0258).

⚠️ **THE SIMILARITY IS REAL AND IS WRITTEN DOWN RATHER THAN ARGUED AWAY.** Both real bosses of the
first and sixth places now open bobbing and throwing an acid fan down the lane — five globes against
three, on a chain that rears against a hull. Whether that reads as a repeat is a play-test's question.

## What was taken out

- **`serpentine`** — 0290's wave. Nothing else threw it, and an arm nothing sends is a member the
  union cannot keep. Its three probes went with it.
- **0261's crash probe** — the round counting on the rake's angle. No row both rakes and grows heads
  any more, so the break had nothing left to crash; the field split it proved still stands, and the
  spray is held for the same defect by the probes below.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0304` — every guard this decision adds, broken on purpose:

| broken on purpose | went red |
|---|---|
| the opening arc raking again, so it is five globes that turn rather than an arc straight ahead | `whole, it throws a forward arc of FIVE globes` |
| the spray never continued past its first step, so it is one globe | `once hurt, the acid is a SPRAY` |
| the opening arc back to three globes | `whole, it throws a forward arc of FIVE globes` |
| the spray’s aim never turning, so twenty-one globes leave on one heading | `once hurt, the acid is a SPRAY` |
| the jaw no longer held open through the spray | `once hurt, the acid is a SPRAY` |
| the next volley no longer waiting for the spray, so on the hardest tier a spray restarts over itself | `a boss that SPRAYS and grows heads finishes every spray` |
| the spray cut to three globes, so the phase after the arc of five throws less | `every phase is reachable, and they only get harder` |

⚠️ **THE WAIT'S PROBE WAS STILL GREEN THE FIRST TIME, AND THE GUARD WAS WHAT WAS WRONG.** It flew the
second phase on the hardest tier, where a round of two heads is sixty-four steps — longer than the
spray, so nothing ever overlapped and the guard measured nothing. It flies the last third now, where
a round of three is fifty-four.

**And photographed** — the running game at 1280×720, the fight pinned at each phase: the arc of five
arrives at the ship spread across most of the lane; the spray leaves the mouth as an arm curling from
below-behind, round the front and up, with the jaw open.

## What this deliberately does not do

- **The void and the lightning are untouched.** The void is still a fan of the phase's three; the
  lightning is still three columns with a three-quarter-second warning.
- **The look and the entrance** from the same brief are their own decisions, next.
