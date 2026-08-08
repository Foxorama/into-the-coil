# 0077 — A pickup arrives rather than stopping, and a death throws it wide

**Accepted 2026-08-08.** Chunk 1 of
[`the-third-play-test`](../../reports/the-third-play-test-2026-08-08.md): the three defects that are
a pickup doing exactly what a decision told it to and reading as a fault.

## The rule

**A velocity that changes in one step is a collision, whatever the model calls it.** Anything the
player watches decelerate does it over steps they can see, and a set of things thrown at once leaves
in a set of directions rather than along one line.

## What was asked for

> *"power ups hit a wall when they get to the center of the screen and slide up/down it before
> continuing on."*

> *"when a player dies the powerups spawn straight up/down the screen, they don't spread out in a
> random pattern and bounce around the screen."*

> *"after a player's first death, the player can then have 3 missile tubes instead of being capped at
> two"*

⚠️ **All three were filed under the player's own caveat** — *"these are probably by design, but
classing them as bugs because they look/feel like bugs"* — and two of the three are exactly that: the
model is doing what [0064](0064-a-pickup-waits-to-be-taken.md) and
[0066](0066-a-death-scatters-what-it-took.md) say, and the picture reads as a wall and as a line.
That is [0027](0027-measure-the-picture-not-the-model.md)'s subject, arriving as a bug report for the
fourth time.

## 1. The wall is a one-step velocity change, and it is 0064 working

`driftPickups` in `src/app/frame.ts`:

```
item.velAlong = item.along - w.cameraAlong <= PICKUP_STATION ? w.scrollPerStep : 0;
```

A pickup approaches with `velAlong = 0`, which in the camera's frame is *falling back through the
view at the scroll rate*. On the single step it crosses `PICKUP_STATION` — 100 units ahead of the
camera — the assignment above snaps it to the camera's own rate. **Its screen-relative speed goes
from 0.6 units a step to zero between one frame and the next.**

⚠️ **That is a picture of an impact and there is nothing there to hit.** Nothing in the game
decelerates; a body either carries a velocity or has it rewritten, and this is the only place where
one is rewritten to a *different* value while the player is watching. Seven seconds of pure `across`
drift then follow, against a fixed `along` — which is the *"slide up/down it"* half, and it is a
straight line because `PICKUP_DRIFT` is a constant.

**Two changes, and neither moves the station:**

- **`velAlong` eases toward its target rather than being assigned it.** A first-order lag at
  `PICKUP_EASE`, so the pickup glides to a stop over about three quarters of a second and glides back
  out when the wait ends. 0064's mechanism is untouched: `holdFor` still covers the approach and the
  wait, and the station is still 100.
- **A held pickup bobs along the scroll axis**, so its track curves instead of tracing a line down an
  invisible wall.

⚠️ **The bob is a function of the CAMERA, not of a clock** — the same argument
`src/content/pickups.ts` makes for `CYCLE_UNITS` being a distance: a shape in the world can be
authored against, and a wobble in time cannot, and it plays the same on a machine dropping frames.
Its phase is offset by the pickup's own `across` so two pickups on screen do not bob in unison, which
costs no field and no draw.

⚠️ **Rejected: drawing the station.** It is the shape of fix
[0074](0074-the-box-is-drawn.md) took for the player's box, and the verdict on that in the same
report is *"the barrier line is just super bad."* A second painted line explaining a second invisible
rule is the wrong lesson to take from the first one.

## 2. The scatter is a line because it was written as one, on purpose

`scatterUpgrades` sets `velAlong = w.scrollPerStep` for every piece and fans them in `across` alone.
0066's own words for it, kept in the source: *"ACROSS ONLY, and that is what makes it a scatter
rather than a firework… Thrown along as well, they would be off the front or the back of the screen
inside two seconds."*

⚠️ **That reasoning is sound and its conclusion was still wrong**, because it treats *thrown along*
as meaning *thrown along and left there*. A piece thrown in two axes whose along component **decays
back to the scroll rate** is off nothing: the excursion is `speed ÷ ease` — about 11 world units at
the numbers here — and then it is holding station and bouncing across exactly as before.

So the scatter becomes a **ring**: an angle per piece, evenly spaced around the circle and jittered,
with a speed drawn per piece. The `across` component keeps bouncing off the lane edges for the whole
five seconds; the `along` component spends itself in under a second.

⚠️ **It gets its own `Rng` stream, `scatter`** —
[0021](0021-one-stream-per-concern.md). It is not cosmetic like `burst`: which pieces a player can
reach in five seconds is the whole of what a death costs, so it must not share a generator with
anything, and nothing added later may move it.

⚠️ **The even spacing survives the jitter and that is deliberate.** 0066 refused a pure roll because
*"a seeded scatter that happened to stack two of them on one lane would take one of them away"* —
that argument still holds, so the angle is `i/n` of a circle **plus** a bounded jitter rather than a
free draw. Six upgrades still arrive as six separate things.

## 3. The tube cap is 0056's amendment left half-applied

[0051](0051-a-missile-is-the-second-auto-weapon.md) gave the base ship one launcher at the centreline
and two upgrades either side of it, so `MAX_LAUNCHERS = 3` described **three positions on the hull**.
[0056](0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md) then took the base launcher
away on the ask *"default missile tubes should be 0 and increase to 1 then to 2"* — and changed the
base, not the cap. The ceiling stayed at 3, so the run reaches a rung the ask does not have.

⚠️ **It is a real defect and not a preference**, and it is why the report is right that a death is
where it shows: a player who has not died has usually not found three launcher pickups yet.

**`MAX_LAUNCHERS` becomes 2, and the two positions become symmetric.** One tube is the centreline;
two are the wings, minus and plus. The old ordering — centre, then minus, then plus — would leave a
two-tube ship firing off-centre, which is a worse picture than the one being fixed.

⚠️ **`tests/missiles.test.ts`'s *the second tube on one side and the third on the other* is rewritten
rather than deleted.** What it was holding is that **a launcher upgrade is visible**, which is 0051's
real claim; the rung it counted to has changed and the claim has not.

⚠️ **It also makes the missiles weaker**, which is a change in the direction the same report asks for
in a section this decision does not otherwise touch: *"max speed auto-fire is way too strong."* That
is chunk 5 and is not settled here.

## What this does not do

**Nothing here makes a pickup rarer, or changes what one is.** The taxonomy, the per-level budgets
and the 50% scatter rule are chunk 5 —
`docs/state-of-play.md` has the order. This decision is only the three things that look broken.

⚠️ **The 50% rule will land on top of the ring rather than replacing it**, and the ring is what makes
it survivable: a scatter that drops half the pieces at random needs the surviving ones to be reachable
in different directions, or a bad roll is a bad roll twice.
