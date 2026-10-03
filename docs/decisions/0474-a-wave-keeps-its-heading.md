# 0474 — A wave keeps its heading

**Accepted 2026-10-04.** Item 0 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md):

> *"there was a weird bullet bug on the ice shelf, this red bullet hung around on the screen. the only
> way I could get it to go away was by flying into it and dying."*

Asked what happened just before it, as the plan said to: *"no idea, I just noticed there was a bullet
stuck on the screen, no idea where it came from or how it happened."* No condition was needed.

## What it was

**A ripple out of the Rime Shelf's ice blades.** [0473](0473-each-place-has-its-own-arms.md) armed the
place's spinner with `ripple` on a `spiral` — *"a ring of ripples that snake as they turn"*. The
ripple's path is a `wave` ([0327](0327-a-shot-has-a-path.md)), and `bendShots` stepped a wave by
**writing** the shot's across velocity, every step, from its along one:

```
velAcross = hand × amplitude × k × cos(k × along) × velAlong
```

That is the whole of a shot thrown straight down the lane, which is the only way a ripple had ever
been thrown — the picket's braid. A ring throws them every way. A ripple thrown sideways has an along
velocity in the camera's frame of nought, so it had no speed left on either axis but the swing, and
it swung in place, on the screen, for as long as the level lasted. Nothing culls a shot that never
leaves the screen; flying into it is a landing, and a landing spends a shot. The row said so itself,
in `src/content/shots.ts`: *"a fan of ripples would lose its fan."* A ring is a fan all the way round.

**It is the place's bullet ink**, `#ff5a1e`, on the Rime Shelf ([0296](0296-a-bullet-belongs-to-its-place.md)):
the red the player saw.

## Why the plan's six flights found nothing

**They were flown on a tree from before 0473.** `scripts/weigh-stuck.mjs`, flown at 0473's parent
(`e6d954e`), reads the Rime Shelf's slowest shot as the melting flake at **0.862** a step — the plan's
own number to the digit. Flown at `main` (`cfdb23c`) with nothing changed, it reads **a ripple at
0.029**, and three lingering at the instrument's default. The player was on staging, which had 0473.
The script's header says so now: *a flight that finds nothing is a statement about the tree it was
flown on.*

## The rule

**A wave swings across the shot's own heading, and adds the swing to the speed its muzzle gave it.**
`bendShots` takes the heading once, in the camera's frame, on the first step the shot is on its path —
after a wall's slot, so a wall's shot is on the heading it falls down the lane at — into two new
fields, `wayAlong` and `wayAcross` on `Entity`, nought until then. Each step:

- the phase is how far down its own heading the shot has come in the world;
- the rate is how fast it is going there in the world;
- the swing is the row's amplitude and wavelength on those two, perpendicular to the heading.

**Straight down the lane every term is the line it replaces**: the phase is `k × along`, the rate the
world's along velocity, the swing all across. The picket's braid is unchanged, and
`tests/shot-path.test.ts`'s picture guards pass as they were. Out of a ring, each ripple snakes along
its own spoke, which is what 0473 wrote it was for.

**One thing a straight ripple does differently**: its along velocity is the camera's rate *this step*
plus its own, rather than the rate it was thrown at plus its own. They differ only while the camera's
rate is changing — a room closing ([0335](0335-the-fight-happens-in-a-room.md)) or a burn
([0340](0340-a-transition-stays-in-the-game.md)) — and the camera's frame is the one every speed is
in ([0023](0023-the-long-axis-is-the-scroll-axis.md)).

**Not done: the plan's second half**, *a shot with no velocity in the camera's frame for a second is
spent*. The plan wrote it down so it would not be mistaken for the fix, and it is not needed: the
cause is a class — a path that discards the muzzle's speed — and the class is what changed. Every
other path is an `arc`, which is a rotation and keeps its speed.

## Guards

`tests/stuck.test.ts` — **the instrument is the guard.** `scripts/weigh-stuck.mjs` now exports
`weighStuck`, as `scripts/weigh-bullets.mjs` exports `weighLevel` to `tests/bullets.test.ts`, and the
test flies **every level at every tier**: the real frame, the real spawner, each place's arms, a ship
sweeping the lane and never dying. **No hostile shot stays on the screen 15 seconds**, in the player's
unit ([0027](0027-measure-the-picture-not-the-model.md)). Each flight must have flown a shot, so a
level that throws nothing reads as measuring nothing rather than as passing.

**An invariant with room, not a budget** ([0192](0192-a-guard-holds-an-invariant.md)): the change that
would redden it and be correct is a shot meant to loiter, and a thing meant to loiter on the screen
is a body, which can be shot, not a bullet, which cannot. The number only has to clear the slowest
crossing anything authors. The longest any one shot stayed on the screen, measured at this change,
Legendary / Savior / Burn:

| level | longest |
|---|---|
| approach | 5.3 / 4.8 / 3.9 s — the serpent's acid |
| descent | 4.0 / 3.2 / 2.6 s — spines |
| coilward | 4.8 / 3.8 / 3.0 s — rocks |
| **shoal** | **8.2 / 6.5 / 5.2 s — the gyre's astern wall, crossing its stopped room at 0.45 of its speed** |
| batteries | 3.6 / 3.0 / 2.2 s — hail |
| gauntlet | 7.6 / 3.9 / 3.1 s — the hydra's acid |
| eye | 3.9 / 3.4 / 2.5 s |

The plan noted the gyre's curtains as the thing a linger threshold has to clear; they are the
longest, and 15 seconds is nearly twice them. The ripple stayed until the level ended. The guard
costs about nine seconds of suite.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0474`:

| broken on purpose | went red |
|---|---|
| a wave that replaces the speed its muzzle gave the shot | `no hostile shot stays on the screen 15 s, on any level, at savior` |

It went red on the report itself: *batteries: LINGERS 15.0 s at 31.2 s: ripple as ripple … rel-vel
(−0.029, 0.176)*.

## What it costs

Two numbers on every entity, reset with the rest. In the frame: a square root and two divisions per
rippling shot per step, allocating nothing.

## Owed

- **A play of the Rime Shelf**, for the ice blades' ring now that it flies: three ripples a volley
  leaving on their spokes, where before one or two of every ring stalled or fell. It is more on the
  screen than the player has seen from that kind, and it is what 0473 authored; the spinner's row is
  the player's to veto.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Sim behaviour; nothing persisted.
