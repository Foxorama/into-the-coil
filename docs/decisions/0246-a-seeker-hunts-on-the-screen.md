# 0246 — A seeker hunts on the screen, and burns out

**Accepted 2026-09-05**, the same day as [0244](0244-a-blade-rides-a-helix.md), from
[`the-seekers-played`](../../reports/the-seekers-played-2026-09-05.md):

> *"we need to reduce the homing missiles effectiveness, they're way too strong, limit them to
> screen space only and give them a shorter lifespan, I had 15-20 on screen at a time and they were
> killing everything super fast."*

**Amends [0235](0235-a-seeker-hunts-the-nearest-body.md)**: the hunt is bounded by the screen and
by a fuse. Everything else 0235 built stands — the tubes, the clock, the turn rate, the ink.

## The rules

**A seeker hunts only a body on the screen.** The bound is the view the player has — the camera to
its leading edge along, the lane across — and a body outside it is not a target however near it
is. 0235 said *nothing beyond the view is a target* and bounded the search by a REACH from the
missile, which is a circle: a seeker near the leading edge saw a body a whole view ahead, and a
screen of seekers killed each wave before it arrived. `nearestInBox` in `src/sim/collide.ts` is the
search; `THE SCREEN` in `tests/seekers.test.ts` puts one body a hull's width either side of the
leading edge and holds that the seeker turns for the one inside and not the one beyond.

**A seeker burns for a second and a half and goes out.** `fuse` on the missile row is 90 steps,
copied onto the missile at launch like its turn. At the row's speed that is the far edge of the
widest screen from the ship, so a seeker still reaches a boss on its station and comes about for a
body just behind the ship — and a seeker that is still turning after that is spent. `THE FUSE`
holds it in the player's unit: chasing a body forty behind and twenty across, the seeker is gone
inside two seconds. The straight missile's fuse is zero and it lives to the edge, as before.

**A seeker that goes out says so.** A spark is placed at the end of its track on the step it goes
— [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md): a missile that vanishes
mid-air unexplained is an event the picture never mentioned. It borrows the landing spark's frames;
a puff of its own is owed below.

## The figures

| | before | after |
|---|---|---|
| in the air at rung 3 (a pair every half-second) | unbounded — 15–20 counted | 6 |
| in the air at the cap (a pair every third of a second) | unbounded | 10 |
| a body forty behind and twenty across | caught | gone at 1.5 s |
| a body twenty-five behind, six across | caught at 1 s | caught at 1 s |
| sustained on a boss a hundred ahead, at the cap | — | 10 a second |

The cadence is untouched: a pair every third of a second at the cap was never the problem, an
unspent pair was. Ten a second on a boss is under the straight missiles' eighteen, which is the
order 0235 set — *"a bit less damage than regular missiles"* — now true of the fight and not only
of the row.

## ⚠️ What was rejected

**A slower cadence for the seeker tubes.** The report counted seekers on the screen, not seekers
leaving the tubes; the count was the fuse's absence. The cadence stays the missiles' and is the
lever if the fuse is not enough.

**A fuse short enough to change the count at the cap below ten.** Under ninety steps a seeker
cannot reach a boss on its station, which makes it no missile at all against the one fight a
missile is for.

**A puff of its own, tonight.** The picture must mention the event; the landing spark's frames do
that, and a distinct fizzle is art the report did not ask for.

## What is owed

- **Its own puff**, smaller and dimmer than a landing spark, so a seeker going out is not read as
  a seeker landing.
- **An eye on the count** on the branch preview, at the rung the report was played at.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A field on the row, a search
and a spark; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0246`:

| broken on purpose | went red |
|---|---|
| the hunt reaching ten screens ahead | `THE SCREEN: a body beyond the leading edge` |
| the fuse authored to never | `THE FUSE: a seeker burns out` |
| the puff removed | `THE FUSE: a seeker burns out` |
| the straight missile put on a fuse too | `and the straight missile has no fuse` |

And 0235's five, on the fused seeker: all red.
