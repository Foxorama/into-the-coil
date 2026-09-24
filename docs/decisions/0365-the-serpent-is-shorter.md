# 0365 — The serpent is shorter

**Accepted 2026-09-25.** Takes back the three-globe opening [0322](0322-the-ball-is-worth-shooting.md)
added, re-owns the serpent's number in [0260](0260-a-boss-is-fought-to-the-end.md)'s fight-length
budget, and adds `Grow` — a round of heads that throws one head more often as the bar falls.

## The ask

> *"for the serpent boss, remove the first set of attacks, the shorter full health wave, then space the
> rest of the attack waves out to balance out the gap, and for the final phase with the combined orbs,
> at additional orb fire at every 10% of health. we also need to reduce it's health by about 10% at each
> phase as they take slightly too long now, especially with the void balls eating attacks"*

Two readings were put back to the player before building:

- **The orbs.** A bonus ball thrown at each mark, the ball throw growing into a fan, or the ball coming
  round more often. Answered: **more often.**
- **The bands.** With the opening's 0.22 of the bar freed, **0.3 / 0.3 / 0.4** — the freed share
  spread evenly, the last phase keeping the largest — or even thirds. Answered: **30 / 30 / 40.**

## What changed

| | before | after |
|---|---|---|
| phases | three globes (1–0.78), five globes (–0.55), spray + void (–0.33), ball + strike | five globes (1–0.7), spray + void (–0.4), ball + strike |
| cadences | 78, 72, 66, 60 | 72, 66, 60 |
| opening patrol | 1 (the five-globe arc flew at 1.15 as a second phase) | 1 |
| health | 1100 | 770 |
| last round | ball, strike | ball, strike · 2 balls under 0.3 · 3 under 0.2 · 4 under 0.1 |

**The opening keeps its own patrol.** The five-globe arc moved up a rung and its 1.15 did not come with
it: the animal still quickens 1, 1.3, 1.6 across the fight, and 0309's guards on the unreared swing —
which went red when the 1.15 came along — are unchanged.

## A tenth off each phase is not a tenth off the bar

A band is a fraction of the bar, and sharing out the opening's 0.22 made every remaining band wider.
A tenth off the bar (990) would have made each phase **longer**: the five-globe arc 297 points where it
had 253. The sentence says *at each phase*, so the number is each phase's own share, cut:

| phase | before | after | |
|---|---|---|---|
| five globes | 0.23 × 1100 = 253 | 0.3 × 770 = 231 | −9% |
| spray + void | 0.22 × 1100 = 242 | 0.3 × 770 = 231 | −5% |
| ball + strike | 0.33 × 1100 = 363 | 0.4 × 770 = 308 | −15% |

770 with the 30/30/40 the player chose lands about a tenth off on average, and the last phase gives up
the most — the one the report names, where the ball eats the fire.

## Flown

`scripts/weigh-boss.mjs jormungandr`, savior, tier 4, missiles silenced, ship unhittable:

| gun | quickest before → after | median held lanes before → after |
|---|---|---|
| arc | 42 s → 29 s | 58 s → 40 s |
| shuriken | 55 s → 39 s | 64 s → 43 s |
| pulse (on the head's lane at 45) | 55 s → 39 s | 114 s → 86 s |

## The fight-length floor is re-owned, not removed

`tests/serpent.test.ts` held 0260's forty seconds in the flown fight. That floor is a budget whose number
the report owns ([0192](0192-a-guard-holds-an-invariant.md)), and the report on this animal now says the
opposite of the one that set it. It is **28 s**, just under the arc's flown quickest, on 0260's own
pattern — so a hand tuning further down reddens it before it has cut another tenth. The eight volleys a
phase are untouched and still pass. 0307's probe (the serpent at 540) still breaks it.

## Why `Grow` and not four phases

The first build split the last phase into four rows at 0.4, 0.3, 0.2 and 0.1, each with one more ball
head — the hydra's own way of growing heads ([0254](0254-the-hydra-grows-heads.md)). Three guards went
red at once:

- a phase fires quicker than the one before it (`tests/difficulty.test.ts`) — the four rows share 60;
- every real boss has a mark of its own (`tests/level.test.ts`, 0111) — `heads×4` and `heads×5` are the
  hydra's;
- every phase is seen for three seconds (`tests/level.test.ts`, 0124) — a tenth of this bar is **2.4 s**
  at the quickest gun.

Each is a guard that *a phase is a change the player sees*, and these rows are not one: the look, the
rear, the cadence and both attacks are the same across all four. That is the shape `Uncoil`
([0151](0151-the-gap-you-have-to-reach.md)) was built for — *a thing that happens at fixed fractions of
a health bar is not a thing a phase can say* — and the hydra gets away with phases because its bands
are a fifth of the bar and its phases do change what it throws. So none of the three was loosened.

`Grow` is optional on the `heads` arm: `{ every, head }`. Every `every` of the bar below the phase's
`upTo`, the head at `head` takes one more slot in the round, next to itself. `src/app/boss.ts` does it as
index arithmetic on `headAt`, so nothing allocates and the table still says the round once. It is on the
row where any boss can author it ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)),
and absent is a round that does not grow.

## What it costs

**The lightning comes round less often at the bottom of the fight.** Each extra ball is one volley and
its own 42 steps of room between strikes; at the tuned tier (`fireGapFor(60, savior)` is 48 steps) the
strike comes every **2.3 s** above 0.3, **3.8 s** under it, **5.3 s** under 0.2 and **6.8 s** under 0.1 —
computed off `fireGapFor` and `onFireGrid`, not driven — and the last tenth is only a few seconds long
at the quickest gun, so it may hold one strike or none. The strike itself — the column, the warning line,
*"don't change it"* — is untouched. This is the trade the answer *"more often"* makes: if the last tenth
should still strike on the old clock, the cadence has to come down with the ball count, and that is a
separate ask.

**0322's growing opening is gone.** *"Slightly fewer acid balls, then increase them"* was the same
player's ask; this is that player taking it back. 0322's probe of the three-globe count went with it.

## Guards

- `tests/serpent.test.ts` — **0365 — the ball comes round more often as it dies**, driven: at 0.35, 0.25,
  0.15 and 0.05 of the bar, two whole rounds of volleys read as *ball* or *lightning* off what leaves the
  animal. Broken in `scripts/probes/0365-the-serpent-is-shorter.mjs` twice: `grow` removed from the row,
  and the round's extra slots never counted in `boss.ts`.
- The forty-second floor → 28, above.
- Re-anchored, not changed in what they break: 0124's two (health, the sliver), 0254's two
  (`throwAttack`'s arguments, the slot), 0304's arc count, 0307's 540.
