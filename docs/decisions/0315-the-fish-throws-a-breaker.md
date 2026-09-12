# 0315 — The fish throws a breaker

**Status:** accepted
**Builds on:** [0249](0249-the-eagle-summons.md), [0313](0313-the-fish-breaches.md), [0314](0314-the-shoal-comes-in-while-it-fights.md)
**The brief:** [`the-fish-asked`](../../reports/the-fish-asked-2026-09-12.md)

## The ask

> *"Needs multiple styles of attacks."*

## What it is

A **breaker**: a wave of spines coming up off the **near edge of the lane**, over a span centred on the
fish, the crest leading and the shoulders trailing. It takes the second `whip`'s place at a third of the
fish's health, so the table is `rake → whip → rake → breaker → summon` — **four kinds across five
phases**, where it was three with the same lash twice.

| | |
|---|---|
| `span` | how much lane the wave covers, centred on the hull |
| `rise` | what the crest climbs at, as a multiple of the bullet's own speed |
| `ends` | what the outermost shots get, as a share of `rise` — the bow |

## The one attack in this game that does not leave the hull

⚠️ **EVERY OTHER ARM OF `BossAttack` IS A THING THE BOSS POINTS.** A spray, a rake, a sweep, a ring, a
wall, a whip, a beam — the player's question is always *where is it aiming*, and the answer is always
read off the hull. A rain (0248) comes out of the sky and is the nearest thing to an exception, and even
that is a column the boss chose.

**A breaker is read off the LANE.** It happens where the fish is, not where it is looking, and the
answer to it is to be somewhere along the lane that the fish is not — which is the axis
[0111](0111-a-boss-has-one-idea.md) says this table deliberately leaves alone, arriving as an attack
rather than as a movement. *"Multiple styles"* is not four more fans.

⚠️ **AND IT IS THE SAME EDGE THE FISH CAME UP THROUGH** — [0313](0313-the-fish-breaches.md). The
entrance is a leap out of the near edge; this is a wave off it. One animal's idea twice, which is what
the brief means by *"the style is what makes the different bosses unique"* — and it costs no new sound,
because `bossBreach` is already the noise that edge makes when this animal goes through it.

## Why it bows, and why the bow is a property of the line

⚠️ **THE MIDDLE RISES AT `rise` AND THE OUTERMOST AT `ends` OF IT.** Flat, it is a rank — a wall laid on
its side, and the game has a wall (0252's curtain). What makes it a wave is that the crest leads: the
line climbs into an arc, so the gap the player is looking for opens at the shoulders and closes in the
middle.

⚠️ **IT IS THE WHIP'S BOW TURNED THROUGH NINETY DEGREES, AND IT IS NOT THE SAME MECHANISM.** 0249's
lash bows because each flame is quicker than the one before it, so the bow is a function of the ORDER
they were thrown in and the line sweeps. Here every shot leaves on the same step and the rate is a
function of **where the shot is** in the span — so the wave has a middle. Written the whip's way it
would be a wave that crests at one end, which is the third probe below.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0315`:

| broken on purpose | went red |
|---|---|
| the wave thrown from the hull rather than up off the edge, so it is a fan again | `THE ASKED-FOR ONE: the wave comes up off the EDGE` |
| the wave rising flat, so it is a rank and not a breaker | `THE ASKED-FOR ONE: the wave comes up off the EDGE` |
| the bow inverted, so the wave sags in the middle instead of cresting | `THE ASKED-FOR ONE: the wave comes up off the EDGE` |
| the spray at the edge dropped, so the wave arrives out of an empty line | `the edge it came up through is drawn` |
| the breaker back on the shared crash, so the edge breaking has no sound of its own | `the edge it came up through is drawn` |

⚠️ **AND THE FOURTH PROBE CAUGHT A VACUOUS GUARD BEFORE IT SHIPPED, WHICH IS WHAT THEY ARE FOR.** *The
edge is drawn* was written as *debris grew by at least `BURST.breach` on the firing step* — and it
stayed green with the spray taken out entirely, because **setting the boss's health to stand it in a
phase IS a phase change, and a phase change sheds fourteen fragments** (0111). Twenty-five on that step,
of which the wave's eleven were the smaller half. The fixture flies one step first now, so what is
counted is the wave's own.

## A sixth phase was written first, and the arithmetic refused it

⚠️ **EVERY PHASE OWES EIGHT VOLLEYS AT MAX WEAPONS** — [0260](0260-a-boss-is-fought-to-the-end.md) — and
**six bands of this fight do not fit.** The first draft added the breaker as a new phase between the
whip and the kites; `tests/level.test.ts` measured it at **6.8 volleys in 6.1 seconds** and
`tests/difficulty.test.ts` refused the cadence it needed, because every authored cadence is a whole
number of grid units (0096) and there is no multiple of the grid between 66 and 60.

⚠️ **THE FIX IS THE ONE THE ASK ALREADY POINTED AT.** *"Multiple styles of attacks"* is a complaint
about the vocabulary, not about the count of phases — and the table had the same whip twice with a wider
arc. The slot was already spare. **The health ladder, every cadence and every `patrolScale` are
untouched.**

## What this deliberately does not do

- **The quill is still drawn as a FEATHER.** *"A high class good quality art and assets for the
  attacks"* is the half of this item still owed: the fish's own bullet is 0262's eagle feather, and
  0312 left it deliberately — *renaming a thing in the PR before the one that rebuilds it is churn that
  makes the rebuild's diff unreadable.* The rebuild is its own change, and the breaker is what throws
  the most of them.
- **The wave does not move along the lane.** It rides the camera like anything else and climbs across;
  a crest that also travelled would be two readings of one line and the player would have to solve both.
- **No new bullet.** The wave is spines, which is what the fish already throws — a wave made of
  something else would be a fourth thing on the screen at the phase with the most on it already (0295's
  *consider what else will share the same screen space*).
