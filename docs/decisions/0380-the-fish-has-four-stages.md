# 0380 — The fish has four stages

**Accepted 2026-09-27.** The flying fish's fight is four stages: the rake with kites out of its mouth,
kindled; the summons with the shoal under it, ablaze; the breaker, roaming anywhere along the near
edge after a half-second tell, with the field otherwise empty; and white-hot, leaping out through the
edge and back across the screen on a clock of its own between whips of flame. A phase may carry a
`leap`; a breaker may `roams` and carry a `warning`; the fish has a third look in the ember's core
inks. **Amends** [0315](0315-the-fish-throws-a-breaker.md) (the wave roams and warns),
[0317](0317-the-pressure-comes-forward.md) (the breaker is third; the pressure is the opening's) and
[0320](0320-the-fish-kindles.md) (the fire is on from the first stage and only hotter). **Builds on**
[0313](0313-the-fish-breaches.md), [0373](0373-the-fish-spits-its-adds.md).

## The ask

> *"fish is better — last stage is great, it should be stage 2, the stage before it should be stage 1
> and we need a new stage 3 and four"* — 2026-09-27, the second play of the fish since its brief.

The two stages the play named are 0373's fourth (the rake of seven with kites out of the mouth,
kindled) and fifth (kites dumped on the volley with the shoal under them, ablaze). The three before
them — a bare rake, the breaker with the shoal, the whip — are gone as stages; the breaker and the
whip come back as the bones of the two new ones, each with a thing it did not have.

## The rule, stage by stage

| | bar | throws | calls | look |
|---|---|---|---|---|
| 1 | 100–72% | a fan of seven every 54 steps | kites, three a call, from the mouth | kindled |
| 2 | 72–46% | a summons of three kites on the volley, every 48 | the shoal, three a call | ablaze — the fins risen |
| 3 | 46–22% | a breaker of five off the near edge every 42 plus the tell, **anywhere, warned** | nothing: the field empties | ablaze |
| 4 | 22–0% | the whip of flame every 36 | two kites a call, **and a leap** | white-hot |

**The breaker roams and warns** — the plan's item 2, and the report it answered: *"it should 'spawn'
at random places along the bottom of the screen and fire upward so that the player has to actively
move forward/backward to dodge it."* Its centre is drawn on the breaker's own stream (0021) anywhere
the NARROWEST view shows the whole span, so no spine is off any screen and there is always lane to
stand on (60 against 213); the spines stand IN the edge with their tips showing for thirty steps
before they rise, on `holdFor` — the boss's brace everywhere else, which no enemy shot carried — with
the rise kept on `firePhase` and released in `bendShots`. A wave from a random place with no tell is
unfair; fins breaking the surface for half a second is learnable. The spray at the edge moved under
the wave, since the wave is no longer under the hull. Every 42 rather than 66, and the whip after it
every 36, because a later stage fires STRICTLY faster than the one before it at the base tier
(`tests/difficulty.test.ts`, which the wide suites did not run and the proof's baseline did) and the
two liked stages hold 54 and 48; five to a wave so two in the air are a field and not a wall. **The
tell is on top of the cadence**, as a beam's warning is: the next wave's clock starts after this
one's has stood its thirty steps, so the field is quiet for the row's `fireEvery` between a rise and
the next tips. Without that, a tier whose cadence is shorter than the tell had two waves in the edge
at once and the breach cue coming back before it had ended — 0323's guard said so, at burn.

**The leap is the entrance replayed.** The one thing a flying fish does that no other boss can is
leave the lane and come back over it, so the fourth stage's new thing is 0313's breach mid-fight, on
the phase's own clock: `first` steps after the stage opens and `every` after that, the boss goes back
into `bossEntering` at zero, `driveEntrance` flies it to the path's start first at `DIVE_PER_STEP` —
a straight dive at three units a step, nosed into its heading — and then through the edge and back
across the lane exactly as the entrance does, unshootable and fully live, with the edge breaking at
every crossing, and hands it over to the arrival every boss has, in whatever stage the bar says. The
path begins `LEAP_RUN_IN` up-lane of the first crest rather than where the spawn happened to be,
which the bench photographed as a dive to nowhere in particular; and it begins beyond the narrowest
screen plus a hull, because the hand-over lays the boss at the path's start and a start any nearer
is a fish that pops into being after its dive.

**The third look is one fire at a higher temperature.** `BLAZING` wears the grown body and its tail
with the same six flames painted in the ember's core inks — each ink one step up its own ladder —
the crown bigger again (29 against 25 and 19.6) and the flicker at two steps a frame. Six bakes and
no drawing of the animal.

## What the instrument says

`scripts/weigh-threat.mjs volans` and `weigh-boss`, savior, tier 4:

| | pulse | shuriken |
|---|---|---|
| hits a second, parked — 0373's fight | 0.69 | 0.49 |
| hits a second, parked — this one | **0.88** | **0.71** |
| hits a second, sweeping (`--sweep=6`) | 0.48 | 0.44 |
| seconds to kill, median held lane | 51 | 20 |

⚠️ **THE FIGHT IS HARDER TO STAND IN THAN ANY BUT THE FROST SHIP'S, AND IT IS SAID PLAINLY.** The two
stages the play called great are the two loudest, and they lead now; a parked ship is the worst case
by construction and a sweeping one takes half as much. **The play owns whether this is pressure or a
wall on the second boss of seven.** The leap made the shuriken fight twenty seconds where it was
fifteen, which is still half of 0260's forty — the plan's item 3, the fight's length, is untouched
here and still owed.

⚠️ **`first` EXISTS BECAUSE THE INSTRUMENT SAID THE LAST STAGE CAN BE FOUR SECONDS LONG.** A shuriken
at the cap reaches the fourth stage at eleven seconds and ends it at fifteen; a leap that waited its
six-second interval never fired on that gun. It waits two and a half now, so every gun sees one.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0380`:

| broken on purpose | went red |
|---|---|
| the summons stage put last again | `THE ASKED-FOR ONE: the two stages the play liked lead` |
| the last stage wearing ABLAZE, so the fourth looks like the third | the same |
| the breaker centred on the hull again | `and the BREAKER ROAMS` |
| the wave's centre drawn against the widest screen | the same |
| the warning never releasing the spines | `and the wave WARNS` |
| the spines rising on the volley's own step | the same |
| the leap never fired | `and at the last stage it LEAPS` |
| the dive to the path's start dropped, so a leap starts with a jump to the edge | the same |

⚠️ **THE LAST ONE STAYED GREEN THE FIRST TIME, AND THAT IS WHY THE GUARD MEASURES THE FLIGHT.** With
the dive dropped, the entrance's own steering put the hull on the path's start in one step — a
teleport to the edge — and every assertion about going through and coming back held over it. The
guard refuses any step of the leap longer than a tenth of the lane, in the camera's frame; the breach's
own steepest arc moves 6.6 a step, and a jump from the station moves sixty.

Six older guards moved with reasons: 0249's five phases are four stages; 0317's *breaker in the first
half* is *the opening throws and calls*; 0320's *cold first half* is *on from the first stage and only
hotter*, and its three ways are `calm/lit → grown/lit → grown/hot`; 0319's gape share is under a half,
because the fish fires every 54 steps and spits every 150 from its first second; 0315's wave guard
reads its span about the wave's own centre and waits out the warning. Fourteen probes were
re-anchored across eight files, and each says which decision moved it.

## What this deliberately does not do

- **The fight's length.** Twenty seconds on the shuriken is the plan's item 3 and still owed.
- **A fourth drawing of the fish.** The white-hot look is inks and a crown, on 0320's own economy.
- **Nothing on the thirteen other bosses.** `leap`, `roams` and `warning` are values a row may
  choose, and one row does.
