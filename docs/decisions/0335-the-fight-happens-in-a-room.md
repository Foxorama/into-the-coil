# 0335 — The fight happens in a room

**Accepted 2026-09-18.** **Amends [0023](0023-the-long-axis-is-the-scroll-axis.md)** — the scroll rate
is a quantity a fight may hold, not a constant. **Builds on
[0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)** — everything holds station in the
camera's frame, which is what makes one change stop the whole world. **Amends
[0074](0074-the-box-is-drawn.md)** — the box's edges get a wall as well as a line.

## The ask

> *"I want the cog to be part of the wall and stationary on arrival, and the background map to have
> walls on the top, bottom and right side to represent labyrinth walls, and the background map to
> stop moving — you've found the boss and are fighting it in a specific room."*

## The rule

**A boss row may name a room, and a room is a camera that comes to rest.** `stand` is how far short of
the fight's own authored distance the camera stops; `settle` is the steps it takes to decelerate and
to accelerate out again; `mouth` is how far behind the resting camera the open side sits.

**Nothing else had to be told.** 0034 puts every body, every shot, the sky's parallax, the culls and
the ship's own box in the camera's frame, so a camera that stops is a world that stops — the hull that
was tracking `camera + station` stands still, and the ship goes on flying the box it was always
flying. **The gyre needed no change at all to be *stationary on arrival*.**

**And nothing that keeps time is the camera.** `w.steps` is the sim's clock and `src/app/frame.ts`
says in as many words that the camera *is a distance that equals a time, not a time*: the gun's phase,
the music's beat and the fight's own rungs are on `steps`, and `musicLevelFor` answers `boss` off the
hull being on the field rather than off any distance. **That was the risk in this and it was checked
before a line was written.**

**The walls stand at the edge of the player's box.** Not at the lane's edge and not at the screen's:
`src/sim/flight.ts` clamps the ship `PLAYER_MARGIN` inside the lane and `PLAYER_LEAD` along it, so a
wall there is the picture of a rule that has been in the game since 0074 rather than a second rule
that would disagree with the first somewhere. It is also the same room on every device, which a wall
drawn at the view's edge would not be.

**They are a place, not an overlay.** World positions, arriving by scrolling in like a landmark — so
there is no moment at which a wall appears on a screen that was not already approaching it, and none
at which one is taken away. The room outlives the boss: the walls stand while the hull comes apart and
while the camera carries the player back out of them.

**It is one row's, and twelve say no.** 0282 — the lattice shares this level and does not get one,
because stopping a level at its halfway point is a different decision.

## The figures

| | |
|---|---|
| the gyre's room | `stand: 60`, `settle: 150` steps, `mouth: 40`, tiled from `roomWall` |
| where the camera rests | 4180 into the shoal, against `bossAt` 4240 — photographed |
| the deceleration | half a cosine over 2.5 s, covering the 45 units the ramp itself travels |
| what it costs | about forty blits, against a frame that already draws five hundred |

## ⚠️ Three things this broke, and every one of them was a constant standing in for a quantity

**`scrollPerStep` was an input and a derived value at once.** `tests/shields.test.ts` held the world
still by writing it; the frame started overwriting it the same day. They are `scrollRate` — the
level's own rate, an input — and `scrollPerStep` — what the camera did this step — and they were one
field for three hundred decisions. [0334](0334-a-hit-is-an-event-again.md) had just recorded the same
shape on `flashFor`: **two meanings on one field agree until one of them moves.**

**A guard was scoring how fast a threat closes with `SCROLL_PER_STEP`.** `tests/crowd.test.ts`'s
pilot asks which threats it can reach; the ship holds station in the camera's frame, so what a threat
closes at is *the camera's rate* less its own — and the constant was right only while the rate never
varied. With the camera at rest every threat was scored as closing 0.6 a step faster than it was, and
the gyre's third phase came back as **2.5 units of reachable room on the gentlest tier** about a field
that had not changed at all.

**Two level-walking instruments waited for `bossAt` and stood still for six minutes.** A room brings
the camera to rest short of it, so `scripts/weigh-bullets.mjs` reported *never driven to its boss*
about a level it had driven all of — and printed a coverage figure that was five minutes of a stopped
world. They walk to the place the fight is fought, or until the camera comes to rest.

## ⚠️ And the first ramp never arrived

Eased on the distance REMAINING, the rate goes to zero as the gap does: a first-order approach that
converges without landing. Measured, the camera crept at **three ten-thousandths of a unit a step**
for ever. `settle` is counted in STEPS now, and the trigger is set back from the rest by exactly what
the ramp itself travels — so the camera lands on the authored number rather than near it.

## ⚠️ And the first walls were drawn every frame and never seen

Centred a half-tile OUTSIDE the lane, which is outside the viewport: the view shows `across` 0 to 100
exactly and the gutters are not world. Forty blits a frame, landing on no pixel. **The bench
photograph is the only thing that said so** — [0027](0027-measure-the-picture-not-the-model.md), and
every guard was green.

## What is owed

- **An eye at 21:9.** The far wall stands at the box's forward edge, which is the same world distance
  on every device — so a wide screen sees past it. That is the same trade 0080 already makes, and
  whether a room with a visible outside reads as a room is a picture.
- **The fight flown in it.** A stopped background under a fight is a change to what the whole thing
  feels like and no guard measures that.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One field on a content type, two on
the world, one sprite; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0335` — see `scripts/probes/0335-the-fight-happens-in-a-room.mjs`.
