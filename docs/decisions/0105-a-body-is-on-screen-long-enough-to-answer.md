# 0105 — A body is on screen long enough to be answered

**Accepted 2026-08-10.** The balance items of
[the-seventh-play-test](../../reports/the-seventh-play-test-2026-08-10.md).

**One change with a measurement behind it, and one with a hand behind it — and the difference is
stated rather than blurred.** The speed half is derived from a quantity nothing in this repository had
ever computed. The level half is a judgement, because **every metric that was supposed to justify it
failed to separate the levels the player named**, and that is the more valuable half of this decision.

## The rule

**An enemy's `closing` is a statement about how long it is on screen, and the window is guarded in
seconds.**

## What was asked for

> *"Enemies overall fly too fast and shoot too fast."*

> *"Around stage level 4 is when the density feels good. The current difficulty is based on weapon
> powerups and when your weapons are maxed before the 1st boss, levels 2 & 3 feel incredibly slow,
> easy and non-interactive."*

## And what *too fast* meant, asked and answered

⚠️ **The first reading was wrong and the player corrected it directly:** *"enemies fly too fast had
nothing to do with the sky, it has to do with their time onscreen and the player's time to interaction
with them."*

⚠️ **That names a quantity, and NOTHING IN THIS REPOSITORY MEASURED IT.** `closing` is authored in
world units per step; what a player experiences is a clock. A body's speed in the camera's frame is
`SCROLL_PER_STEP + closing` ([0023](0023-the-long-axis-is-the-scroll-axis.md)), so a 16:9 view of 178
units gives it `178 / (0.6 + closing) / 60` seconds — three files of arithmetic that had never been
put together.

Driven over the build that was played:

| | on screen, easiest | on screen, hardest | volleys while on screen, hardest |
|---|---|---|---|
| drifter | 4.94s | 4.94s | — |
| lancer | 3.12s | 2.72s | 4.2 |
| weaver | 2.69s | 2.28s | — |
| turret | 4.94s | 4.94s | **12.3** |
| **charger** | 1.74s | **1.38s** | — |
| warden | 3.29s | 2.90s | 5.3 |

**The charger had 1.38 seconds.** The turret got twelve volleys away.

### And the time to reach the player is shorter than anybody would guess

⚠️ **The player's box runs to 167 units ahead of the camera and the view is 178, so a body appears
ELEVEN UNITS from the front wall** — a tenth of a second for a charger, three tenths for a drifter. A
player who flies forward, which is the natural way to play a shooter, is met by things that
materialise on top of them.

⚠️ **That is not fixed by moving the box**, which [0074](0074-the-box-is-drawn.md) and
[0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md) fought for and the player asked for. It
is fixed by slowing what arrives, which multiplies every number in the table above.

## What moved

| | closing | fireEvery | on screen, hardest | volleys, hardest |
|---|---|---|---|---|
| lancer | 0.35 → **0.22** | 78 → **102** | 2.72 → **3.26s** | 4.2 → 3.8 |
| weaver | 0.5 → **0.31** | — | 2.28 → **2.87s** | — |
| turret | 0 | 48 → **72** | 4.94s | 12.3 → **8.2** |
| charger | 1.1 → **0.68** | — | 1.38 → **1.91s** | — |
| warden | 0.3 → **0.19** | 66 → **84** | 2.90 → **3.42s** | 5.3 → 4.9 |

⚠️ **The drifter and the turret are untouched at `closing: 0`**, because they arrive with the world
and that is their whole identity — something the player is safe to ignore is what makes the things
they cannot ignore mean anything ([0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)).

⚠️ **Every cadence is still a whole number of sixteenths** — 102, 72 and 84 against a `FIRE_GRID` of
6 — so [0096](0096-the-enemies-play-along.md) is untouched and its guard still holds them.

⚠️ **The ORDERING is guarded, not the values.** A global slowdown's way of doing harm is flattening
the roster, and the charger's row is written around *"roughly three times the lancer's closing"* —
0.68 / 0.22 is 3.1. A probe gives every body one speed: the window guard is completely green over it
and the identity guard is what catches it.

## The level half, where the measurement did not support the instruction

⚠️ **THE INSTRUCTION WAS *"raise 2 and 3 to 4's density"*, AND *density* TURNS OUT NOT TO BE A THING
THAT SEPARATES THEM.** Three metrics were computed against the scripts as shipped:

| | bodies/min | reactive share | worst repeated wave |
|---|---|---|---|
| 2 descent — *reported slow* | 112.8 | **56%** | 10 |
| 3 coilward — *reported slow* | 104.7 | 38% | 9 |
| **4 shoal — *reported good*** | **118.7** | **51%** | **11** |
| 6 gauntlet | 126.6 | 58% | 15 |

- **Body count:** within 13% across all three. A guard on it would have been green on the levels that
  were reported.
- **Reactive share** — the fraction that is `hunt`, `circle` or `loop` rather than `drift` or `weave`
  ([0073](0073-an-enemy-is-a-pilot.md)): **level two was already ABOVE level four** and was reported
  as slow anyway.
- **Repetition:** level four is the *most* repetitive of the three, and level six repeats fifteen
  times without ever being mentioned.

⚠️ **A first draft of this decision guarded the reactive share at 70%, and it was a number fitted to
the data rather than derived from it.** It went red on level two immediately — and would have been
satisfied by a level nobody wanted while failing one nobody complained about. **It is deleted, and
this paragraph is what replaces it**, on `CLAUDE.md`'s own terms: the fix names the guard, the rule,
or the reason neither is worth it. `docs/decisions/0027-measure-the-picture-not-the-model.md` is what
a fitted bound would have been an example of.

### So what the levels got is a hand, and it is labelled as one

⚠️ **Fifteen waves in levels two and three become kinds that come back**, chiefly the charger — which
is what level four is actually built out of (152 of its 345 bodies, against 45 and 80). A charger
crosses the player up to three times before it leaves, so it is the one kind whose engagement is not
over the moment it is passed.

| | reactive share | chargers |
|---|---|---|
| 2 descent | 56% → **65%** | 80 → **98** |
| 3 coilward | 38% → **54%** | 45 → **70** |
| 4 shoal, for reference | 51% | 152 |

⚠️ **Level three shipped as nine identical five-drifter waves followed by nine turret waves**, which
is the most likely single explanation for *"incredibly slow… non-interactive"* even though the
repetition metric does not separate it from level four. Ten of its waves are now something else.

⚠️ **NOTHING PREDICTS THIS WILL WORK, AND THAT IS THE HONEST STATE.** It is a hand's judgement about
content, on the same terms `SHIP_SPEED` was before it was flown.

## What the measurement actually points at, which the player has declined

⚠️ **The report's own diagnosis is almost certainly the right one:** *"the current difficulty is based
on weapon powerups and when your weapons are maxed before the 1st boss."* With a maxed gun everything
dies on contact whatever it is and however much of it there is — which explains why no content metric
separates the levels, because with that gun the content is not what is being experienced.

⚠️ **Every level authors the identical nine pickups**, and four weapon pickups is the whole ladder
([0083](0083-two-ladders-of-four.md)), with the fourth at `at: 4600` of a ~6,350-unit level. So the
guns cap before the first boss **by construction**.

⚠️ **RESPREADING THE LADDER ACROSS THE RUN WAS OFFERED AND EXPLICITLY REFUSED**, for a
forward-looking product reason: *"we'll be adding different weapon and missile types in future and
that's how we'll change the pickups per run later to be still rewarding and interesting."* **The
pickup tables are not to be touched.** This paragraph exists so the next session knows the
measurement points there and that the answer is already *not yet*.

## What it cost a guard

⚠️ **`tests/spawns.test.ts`'s weaving flanker stopped arriving, and it is a real behaviour change
rather than a stale fixture.** The wave crosses from the `acrossMinus` edge to lane 50 and the fixture
parks the ship at mid-lane; at `closing: 0.5` the weaver was past the ship's `along` before its across
reached 50, and at 0.31 it is still there. Measured: it dies on the ship at `across` **49.3** of a
target of 50, one step short.

⚠️ **The ship is moved out of the path rather than the claim weakened.** The subject is the flanker's
turn; a collision on the way is incidental, and leaving it in would turn a guard about steering into a
guard about how fast a weaver reaches the middle of the lane. **The behaviour itself is not a bug** —
a slower flanker spending longer in the lane is more dangerous, which is the direction this decision
is going in.

## Rollback

⚠️ **No irreversible surface** — [0001](0001-revertability-not-risk-rating.md). No storage key, no
save field, no cache prefix, no origin. Every change is a table value or a wave's `enemy` field;
reverting restores the previous game exactly, and a save written under it loads unchanged because a
level script is code rather than state.

## What this does not settle

⚠️ **None of it has been flown.** The speed numbers are derived from a measured window; the level
edits are not derived from anything.

⚠️ **The window floor is 1.8 seconds and only the charger is near it** (1.91s at the hardest tier).
If *too fast* comes back, that is the number to move and the guard will move with it — but the thing
to check first is whether the report is about the charger specifically, because everything else now
has three seconds or more.

⚠️ **AND THE NEXT REPORT ABOUT LEVELS TWO AND THREE SHOULD NOT BE ANSWERED WITH MORE CONTENT.** Three
metrics say the content is not what is different about them. The next lever is the one named above and
deliberately left alone.
