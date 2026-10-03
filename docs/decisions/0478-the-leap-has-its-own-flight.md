# 0478 — The leap has its own flight, and the mouth rests

**Accepted 2026-10-04.** Item 3 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 2.2 and 2.1, after [0477](0477-the-leap-is-a-target.md) took its 2.3. From the play of the same day:

> *"the jumpy animation feels a bit weird"*
>
> *"i think it's just the mouth is animated a bit too fast"*

## The leap

**What it was: two other things glued together.** [0380](0380-the-fish-has-four-stages.md) flew the
fish's leap as its entrance replayed ([0313](0313-the-fish-breaches.md)): a straight dive at one speed to
a point beyond the leading edge, a 64-unit run-in with half the hull showing, three parabolas, down out
of sight — and then the ordinary arrival bringing it back from along 240 to its station at 0.45 a step.
About four seconds, up to a second and a half of it with no fish on the screen, a constant-speed dive at
the front and a crawl at the back.

**The rule: a leap starts from the station and ends on it.** `Leap` on the phase carries its own flight
— `dive`, `arcs`, `span`, `speed`, `depth`, `back` — and `driveLeap` in `src/app/frame.ts` flies it:

1. **A dive** — a cubic from the station at rest to `depth` under the near edge, half a span down the
   lane, arriving at the arcs' own speed: it eases out of rest and is nosed into the water.
2. **The arcs** — one parabola each through the edge, constant along speed, fastest at the edge and
   slowest at the top, each cresting its own height: 0313's ballistic leap, the fish's at 28 then 40.
3. **The way back** — a cubic from the last arc's bottom, leaving as another arc would, back up the lane
   onto the place it left, at rest.

**The fish turns** to face where it flies over the first and last third of the leap, and back to face
down the lane as it lands, because a heading is not defined at rest. **The edge breaks and is heard**
at every crossing. **It never hands over to the arrival**: `settleOnStation`, which the entrance's
hand-over now shares, lays it back where it left, on the fire grid of the phase it is in. `wearFace` runs
through the leap, where it was frozen on whatever the fish wore when it left.

The fish's flight: `dive: 36, arcs: [28, 40], span: 36, speed: 1.2, depth: 8, back: 54` — **2.5 s**,
on the narrowest screen the whole way, its hull never more than eight units past the edge, its tallest
crest leaving the far 62 units of the lane clear. 0380's dive constant (`DIVE_PER_STEP`) and run-in
(`LEAP_RUN_IN`) are gone, and with them the entrance's dive-to-the-start, which only a leap used.

## The mouth

**What it was.** The jaw snaps for seven steps every time the ship crosses the fish's centreline by more
than six units ([0285](0285-the-mouth-is-alive.md)) — and the fish stalks the ship's lane
([0258](0258-one-pilot-a-level.md)), so the ship crosses it constantly. With the ship weaving across it
every sixth of a second, **5.5 snaps a second.**

**The rule:** a `Face` may author `look`, the band the eye and the bite need the ship clear of, and
`biteRest`, the steps after a snap before another may be armed. Absent, both are what every face had —
`FACE_LOOK`'s six, and no rest — so **the serpent and the pterodactyl do not move**; the plan proposed a
rest for every face, and only the fish was reported. The fish's two faces author 12 and 45: **1.2 snaps
a second** with the same weave, 1.0 with a slower one. The volley's gape is unchanged and still outranks
a snap ([0319](0319-the-fish-has-a-face.md)).

## The fight it costs

The leap is on the screen now and back in two and a half seconds, so every gun has the fish in front of
it for longer. With 0477's weights, all four guns took it under [0260](0260-a-boss-is-fought-to-the-end.md)'s
forty — pulse 39.3, arc 38.4, shuriken 39.1, ray 40.0. Weighting all four would be health under another
name ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s tell), so **health is the
lever**: the fish goes to **1450**, and the pterodactyl to **1460**, because `tests/level.test.ts` holds
each real boss's health over the one before. The arc's weight moves from 1.35 to **1.3**.

| gun | 0477 | this leap, 1400 | **1450** |
|---|---|---|---|
| pulse | 41.1 | 39.3 | **40.7** |
| arc | 43.0 | 38.4 | **41.2** (at 1.3) |
| shuriken | 40.9 | 39.1 | **40.6** |
| ray | 40.7 | 40.0 | **40.5** |

The pterodactyl's fights are about 3.5 % longer; nothing guards a ceiling on them.

## Guards

`tests/volans.test.ts`:

- **0380's leap guard, re-anchored on the new flight**: through the near edge; **never off the narrowest
  screen** (not more than half its body past the edge, not past the leading edge); **back within three
  seconds** — in seconds, not against the row's own length, which would measure the constant it guards
  ([0027](0027-measure-the-picture-not-the-model.md)); **back on the place it left**, within two units;
  the edge broken twice an arc; the face changing during the flight; no step a jump (0380's twelve units).
- **THE REPORTED ONE** (the mouth): with the ship weaving across the fish's lane every sixth of a second,
  no more than **two snaps a second** — an absolute ceiling, not the face's own rest.

Re-anchored: 0380's dive probe on the new dive (its ease skipped is the same jump to the edge); 0306's on
`settleOnStation`; 0319's on the face's own band; 0260's on the fish's 1450; 0477's on the arc's 1.3.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0478`:

| broken on purpose | went red |
|---|---|
| a leap that lands where the arrival does rather than where it left | `and at the last stage it LEAPS` |
| a leap that runs under the edge out of sight | `and at the last stage it LEAPS` |
| a leap whose way back crawls | `and at the last stage it LEAPS` |
| the edge going unbroken where the fish goes through it | `and at the last stage it LEAPS` |
| the face left as it was when the leap began | `and at the last stage it LEAPS` |
| the fish's jaw snapping at every crossing again | `THE REPORTED ONE: with the ship weaving across the fish's lane` |

## What it costs

Three numbers on the world and one on each face that wants it. In the frame: three cubic or parabola
evaluations a leaping step, into a scratch pair; nothing allocates.

## Owed

- **A play of the fish's last stage**: whether the leap now reads as a leap — the dive's ease, the two
  arcs, the turn home — and whether the jaw reads as alive at one snap a second.
- **The numbers on the leap are first guesses**, one row each.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Sim and content; nothing persisted.
