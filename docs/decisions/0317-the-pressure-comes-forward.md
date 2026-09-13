# 0317 — The pressure comes forward

**Status:** accepted
**Amends:** [0262](0262-the-eagle-throws-quills.md) — a rake may bound its sweep; [0314](0314-the-shoal-comes-in-while-it-fights.md) — where a feeding horde comes in from
**Builds on:** [0315](0315-the-fish-throws-a-breaker.md)
**The measurement:** [`the-fish-flown`](../../reports/the-fish-flown-2026-09-13.md)

## The ask

Given the table in the report — the fish dead in sixteen seconds to a shuriken, against 0260's forty —
and asked whether that measurement was of a player sitting still:

> *"If it's a static player position — that possibly highlights the fish has no direct forward facing
> attacks, whereas the other bosses keep blowing up the ship."*

It was, and it did. Then:

> *"More forward pressure early and bring the breaker forward, but we need to make sure there's variety
> in the pressure as well, a phase that lasts too long or starts early and goes till end of the fight
> ends up being boring. The phases, attacks and combats should be fast and reactive, not drawn out and
> long."*

## The instrument came first, and it is the half `weigh-boss` cannot see

⚠️ **`scripts/weigh-threat.mjs` FLIES THE SAME FIFTEEN FIXED PLACES `weigh-boss` DOES AND COUNTS WHAT
LANDS.** The ship is still unhittable — a death would measure the pilot — so what is counted is every
step something hostile is inside its hurtbox, without acting on it. It also counts what the escorts
called and how many of them reached the boss, which is the only way to ask whether 0314's shoal is a
mechanism or a decoration. [0027](0027-measure-the-picture-not-the-model.md): the instrument first.

**Before anything below, on the shipped fight:**

| | seconds | hits a second | shoal called / arrived |
|---|---|---|---|
| pulse | 42 | 0.10 | 19 / **0** |
| arc | 60 | 0.06 | — |
| shuriken | 16 | **0.00** | 20 / **0** |

**Zero.** A player who never moved was never once hit by this boss in a sixteen-second fight, and not
one minnow of nineteen ever reached the fish. Against the rest of the roster — the frost ship lands
1.11 a second, the hydra 0.40, the gyre 0.26 — the fish was not a fight.

## The rake was pointing at the wall, and that is why nothing else helped

⚠️ **`firePhase` ACCUMULATES WITHOUT LIMIT.** The rake's centre is `π + firePhase` and `firePhase +=
turn` every volley, so at `turn` 0.5 the fan **walks a whole circle every thirteen volleys** — sideways,
backwards, and down the lane once in thirteen.

⚠️ **IT IS INVISIBLE TO EVERY GUARD THE ATTACK HAS.** The fan still rakes, still holds its spread, still
points a different way each volley — which is all 0262 ever asked of it. What nothing asked is whether
it points at the **player's half of the world**.

⚠️ **AND IT IS WHY THE OBVIOUS FIXES DID NOTHING.** Measured before the cause was found: five shots to
seven moved 0.02 → 0.04; nine did nothing more; a spread of 0.55 did nothing; a faster turn reached
0.07. **Density cannot help a fan that is aimed away**, and four tuning passes would have gone into the
wrong quantity — which is the failure 0027 is named for, one layer down.

`rake` takes an optional `arc` now: with one, the centre is `arc/2 × sin(firePhase)`, so the sweep slows
at the ends and comes back, which is what a rake IS. **Without one it is the full rotation it always
was** — the gyre rakes too, and a silent change to another boss's fight is not this decision's to make
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s default shape).

## The shoal never arrived, and durability was the wrong lever

⚠️ **NINETEEN CALLED, NONE ARRIVED — AND THE CAUSE IS THE THING THAT MAKES THIS BOSS DIFFERENT.** The
fish is the one end boss that stalks onto the player's lane ([0258](0258-one-pilot-a-level.md)). A shoal
that converges on the fish therefore converges on the player's lane — into a stream of auto-fire that
cannot be switched off ([0104](0104-the-gun-plays-a-figure.md)). Held in the phase with the guns
silenced, a minnow reaches exactly **17.2 units**, which is the eat radius: the swim worked, and the
player's idle fire was deleting the mechanism for free. *"They just marched to their doom with the
player needing to do absolutely nothing"*, which is the sentence 0314 was written to answer.

**Three things were measured before one was kept:**

| | |
|---|---|
| health 1 → 3 | 0 arrived. And 6 → 0 arrived. **Durability is not the variable** |
| flanked in level with the BOSS instead of the ship | 2 of 56. Better geometry, same firing line |
| **`from: 'lead'`** | **22 of 49.** They come in past the fish, with its own hull between them and the player's stream |

So the minnow's health goes **back to 1**: a number that buys nothing does not get raised, and one hit
keeps it a cheap kill when the player does line it up. **What the shoal costs is position, not ammunition** —
and the boss stalking onto your lane is now the thing defending its own shoal, which is a loop rather
than a rule.

⚠️ **AND THE PAIRING IS GUARDED RATHER THAN THE VALUE**: a horde that hunts the ship comes from the
sides, a horde that feeds the boss comes from the lead. Read off the enemy's own motion, so a row cannot
say one thing and mean the other.

## The table, which is where the ask lands

| | was | is |
|---|---|---|
| upTo 1 | rake, 3 spines every 78 | rake, **5 every 72** |
| upTo 0.75 | whip | **breaker + the shoal** |
| upTo 0.5 | rake + kites | **whip, and nothing on the field** |
| upTo 0.33 | breaker + the shoal | **rake + kites** |
| upTo 0.16 | summon kites + the shoal | unchanged |

Adds go **none → shoal → none → kites → both**, so neither stream runs from where it starts to the end.
⚠️ **THE EMPTY PHASE IS THE POINT AND NOT AN OVERSIGHT** — *"a phase that … starts early and goes till
end of the fight ends up being boring."* What makes the shoal read when it comes back is that it went
away.

⚠️ **THE HEALTH LADDER, EVERY CADENCE AND EVERY `patrolScale` ARE UNTOUCHED.** Cadences stay
72/66/60/54/48 — every one a whole number of fire grid units (0096) and still strictly quickening — and
the opening gains a volley in its band, so 0260's eight-volleys-a-phase is safer than it was rather than
tighter. **No guard was changed to let this through.**

## What it measures now

| | seconds | hits a second | shoal called / arrived |
|---|---|---|---|
| pulse | 42 → **47** | 0.10 → **0.17** | 19 / 0 → **56 / 23** |
| arc | 60 → **77** | 0.06 → **0.13** | — → **189 / 52** |
| shuriken | 16 → **16** | 0.00 → **0.25** | 20 / 0 → 20 / 0 |

The shuriken fight is the one that moved most, from *never touched* to the best of the three, because
the pressure it now meets is all in the front half. And the fights got **longer without a health
change** — the arc's by a fifth — which is the shoal being ignored and costing what 0314 says it costs.

Against the roster the fish now sits with the quetzal (0.13) and the gyre (0.15/0.26), below the hydra
and the serpent, well below the frost ship. **That is the right place for the second boss of seven**,
and it is the first time that sentence has been true of a number rather than of an intention.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0317`:

| broken on purpose | went red |
|---|---|
| the breaker back at the last third, where a shuriken ends the fight before it is thrown | `THE ASKED-FOR ONE: the breaker opens in the first half of the bar` |
| the rake unbounded again, so the fan walks round the circle and points down the lane once in thirteen | `THE ONE THAT EXPLAINS THE REST: its fan sweeps ACROSS THE LANE` |
| a horde on every phase from the first, so the field never empties and the shoal is wallpaper | `the field EMPTIES between the two hordes` |

⚠️ **THE THIRD IS BROKEN IN THE CODE AND NOT ON THE ROW, AND THE FIRST DRAFT OF IT WAS WORTH LESS FOR
BEING EASIER.** Taking `arc` off the row reddens the guard on its first line — *this row has no arc* —
and never reaches the thirty volleys it flies to measure where they actually went. Leaving the row
saying 1.4 and making the arm ignore it is the defect as it really was, and the guard then reports the
quantity: **a volley pointed 176° off the lane.**

⚠️ **AND SIX PROBES BELONGING TO FOUR OTHER DECISIONS WERE RE-ANCHORED**, because moving a phase moves
every `find` that quotes it. `tests/prove-guard.test.ts` named all six in three seconds — which is the
check 0312 added after the same class cost forty minutes.

## What this deliberately does not do

- **It does not touch the fish's health.** Sixteen seconds against a shuriken is still sixteen seconds;
  what changed is that the sixteen seconds are now a fight. Whether the bar is right is 0260's question
  and the report costs the three ways out.
- **It does not bound the gyre's rake.** Same defect, same fix available, and no measurement of that
  fight — a boss's pacing is not a thing to change on inference from another boss's.
- **It changes nothing about what the shoal is worth.** Fourteen health a bite is 0314's number and
  untested in play; what 0317 fixes is that the bite happens at all.
