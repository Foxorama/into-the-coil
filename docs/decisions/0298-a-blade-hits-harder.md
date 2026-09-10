# 0298 — A blade hits harder, and the instrument that says why

**Status:** accepted
**Builds on:** [0234](0234-a-blade-circles-the-ship.md), [0294](0294-the-blade-is-smaller.md),
[0027](0027-measure-the-picture-not-the-model.md)

## The report

> *"Shurikens — did the damage decrease, feels like they need a slightly higher damage, and at least
> a little bit of a glow."*

And, in the same breath, the thing that made it worth measuring rather than answering:

> *"I'm not sure it's shuriken damage or void's eating damage, but it felt like shuriken damage as
> there were other things that took a bit longer to die as well compared to lightning or auto-fire
> gun."*

## The premise was false and the feeling was right

**The damage never decreased.** `git log -S"shuriken:"` over `src/content/shots.ts` returns exactly
one commit — the line's own creation in [0234](0234-a-blade-circles-the-ship.md). It has read
`damage: 1` its whole life.

What changed is [0294](0294-the-blade-is-smaller.md), five hours earlier the same day: the drawing
went from 8 units to 5.6 and the halo from the whole radius at 0.55 alpha to three quarters at 0.35,
both to answer *"it's too hard to see enemy elements with them onscreen."* A smaller blade sweeps a
narrower band and lands less often. The gun got weaker without its damage moving, which is precisely
the kind of thing a play-test feels and a table does not show.

## Nothing in the repository could answer *"takes a bit longer to die"*

`tests/combat.test.ts` counts **hits** — *an enemy takes exactly as many connecting shots as it has
health*. That is a different question. A gun landing two hits a second and one landing six both
"take three hits", and the report is about a clock.

So `scripts/time-to-kill.mjs` lands with this — [0027](0027-measure-the-picture-not-the-model.md),
the instrument before the tuning pass. It drives the real `GameFrame`, so fire rate, barrels, links,
reach, the blade's orbit and every miss are in the number because the frame produced it, and it
reports **seconds**.

### What it found, which is not what was reported

Mean damage a second over the near field, bare ship against full ship:

| | bare | full | |
|---|---|---|---|
| pulse | 3.5 | 28.1 | ×8.1 |
| arc | 5.0 | 14.6 | ×2.9 |
| blade | 8.3 | 12.5 | **×1.5** |

**The blade opens as the strongest gun in the game and finishes as the weakest.** Its `weight` ladder
is flat ones and its only climb is a doubled cadence, while the pulse buys barrels *and* rate
together and compounds. That is why it reads as a mid-run nerf: nothing changes, and everything else
overtakes it.

⚠️ **AND A SECOND THING THE INSTRUMENT SHOWS, WHICH IS EXPLICITLY *NOT* WHAT WAS REPORTED.** `coil` is
`[6.5, 7.5, 9, 10.5, 12]`, so the blade orbits at that radius and has a hole in the middle that every
upgrade makes bigger: at the cap, a body within about four units of the ship is untouchable by the
player's main gun.

**Put to the player as a possible cause and refused** — *"issue wasn't that enemies got past the
shurikens, it was more that they took longer to kill."* So it is recorded as a measurement and
nothing more. It is not the report, it does not motivate this change, and a fix for it would be a
change nobody has asked for — which is the trap
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md) names from the other side. **The person
holding the controller is the authority on what the game feels like**; the instrument only says what
is true of the model.

## What this changes, and the argument against it, kept

`SHOTS.shuriken.damage` 1 → 2, and the halo back to 0.9 at 0.45.

⚠️ **THE FLAT DOUBLE IS NOT THE FIX THE MEASUREMENT ARGUES FOR, AND WAS CHOSEN WITH THAT SAID.** The
ladder is what is wrong, and the mechanism for it already exists — the arc's `weight` is `[1,1,1,2,2]`
— so a blade ladder would lift the cap without touching an opening that measures fine. That was the
recommendation. What was chosen instead:

> *"Let's do +1 damage on shurikens, it's the easiest to roll back and change and I don't care about
> tier 0 really because the player will basically only ever be at that level at the moment for the
> first 20 secs of level 1."*

Which is a good argument on two counts a measurement cannot make: **one row is revertible in a line**,
and **the rung it over-pays is one a run spends twenty seconds on**. After it:

| | bare | full |
|---|---|---|
| pulse | 3.5 | 28.1 |
| arc | 5.0 | 14.6 |
| blade | 16.6 | 25.1 |

Near parity at the cap, which is the half that was broken. 4.7× the pulse at tier 0, which is the
half that was bought deliberately.

⚠️ **AND IT SHIPS AS A QUESTION RATHER THAN AS AN ANSWER** — *"let's see if damage handles the issue
and come back to it later if needed."* The `weight` ladder stays on the table as the next move if a
hand says the blade still falls behind; so does leaving it alone if it does not. What decides is a
play-test, which is the only thing that could — the measurement above is what made the *feeling*
checkable, never what settles it.

## The glow

0294 made two cuts at once and only one was asked for: the star went 8 → 5.6 **and** the halo went
from `1.0` at `0.55` to `0.75` at `0.35`. The glow lost width twice over, and *"at least a little bit
of a glow"* is 0238's original line arriving again about the result.

⚠️ **THE HALO IS WRITTEN AS A FRACTION AND THE COMPLAINT WAS ABSOLUTE**, which is the whole of why
this is not a reversal. 0294's report was about how much of the lane a blade veils — units, not a
share of the drawing. The halo it removed was `8 × 1.0`; this one is `5.6 × 0.9`, a little over half
as wide, at a lower alpha. The veiling stays fixed and the metal gets its light back.

## What is owed

⚠️ **THE SERPENT'S HEALTH IS NOT ANSWERED HERE AND THE NUMBERS ABOVE MUST NOT BE USED TO ANSWER IT.**
Asked: *"we might need to change around the serpent boss at the end of level 1 health wise."* Its
`health` is 1400 and a void blast eats 6 points of the player's fire before it bursts — but this
bench silences missiles and measures against one small body, and against a boss all three of the
arc's links land on the same hull ([0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)), so the
arc is roughly three times better there than the table says. Dividing 1400 by a near-field mean would
be a number in the wrong frame — the exact mistake
[0297](0297-a-reach-is-measured-on-both-axes.md) was written about, one decision earlier.

A boss figure needs a fixture that stands the boss on station and flies the fight, which
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) already warns is not the same
thing as a boss standing still.

## Two false starts in the instrument, kept because they are the failure mode

1. **The first fixture measured the camera.** It timed deaths against a target pinned at an absolute
   place, so the target fell behind the camera and was culled — which empties the pool exactly as a
   kill does. It reported 2.35s at four units for *every gun at every tier*. Identical numbers down a
   column is what gave it away. It now measures damage over a window against a target that cannot
   die, and an emptied pool throws rather than being read as a result.
2. **The first matrix parked the target dead ahead.** A blade spirals, so it crosses the ship's own
   centreline only at the radii its coil is passing through: *never touched* at 4u and 20u, killed at
   2u and 30u. That scatter was the sampling. The reported number is a mean over a grid.

The check that it is not lying: the pulse at tier 0 is `fireEvery 8` at one damage, so six health
should take 0.80s by hand. It measures **0.79s**.
