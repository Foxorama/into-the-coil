# 0471 — The cold breathes, and three bosses fire slower

**Accepted 2026-10-03.** Two items from one play report:

> *"the hydra level boss and rime shelf level boss and jellyfish level boss fire a bit too fast"*

> *"the rime shelf bosses aura pulses out and then just resets like it's a bug, it should pulse out,
> retract and pulse again like a proper pulse"*

## The cold

| | 0459 | now |
|---|---|---|
| **out** | a smoothstep from 46 to 108 over 9.2 s | the same smoothstep over `swell`, 390 steps — 6.5 s |
| **at the top** | lit and dark by turns, 12 steps each, for 0.8 s | nothing: it turns |
| **back** | **from 0 straight to 46 in one step** | the same smoothstep back from 108 to 46 over `retract`, 150 steps — 2.5 s |
| **rest** | — | 46 for the last 60 steps of the ten-second pulse |

**What read as a bug was the wrap.** Nothing drew the cold back in: it strobed out at its widest and
then reappeared at its rest on the next step, so the eye saw a ring vanish and a smaller one pop in.
`chillRadiusAt` (`src/content/bosses.ts`) now eases out over `swell` and back over `retract`, and both
are fields on the `Chill` row instead of a hard-coded strobe — on
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s terms, a second cold hull
says how it breathes. `flicker` and `blink` are gone with the strobe.

**What the ship meets is about what it met.** A ship 80 from the hull, most of the way down the lane,
is inside the cold for 4.2 s of each pulse, against 0459's 4.7 (258 swell steps and 24 lit strobe
steps, against 182 out and 70 back). The rest at 46 is when a ship far down the lane is free, which
the dark strobe steps were. One function still drives both the slow and the drawing, so the edge the
player sees is the edge that slows them on every step — 0459's guard, unchanged.

The flash cap no longer applies to the cold: nothing in it goes dark and light.

## The three bosses

What changed is `fireEvery`, the steps between volleys. Below are the steps at the tuned tier, Savior,
which is ×0.78 snapped to the six-step grid:

| | phase | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| **hoarfrost** (Rime Shelf) | was | 72 | 66 | 54 | 90 † | |
| | is | 72 | **72** | **66** | 90 † | |
| **hydra** (Toxic Mire) | was | 54 | 48 | 42 | 36 | 30 |
| | is | **60** | **54** | **54** | **48** | **42** |
| **medusa** (the Black Heart) | was | 54 | 42 | 36 | 30 | 30 |
| | is | 54 | **54** | **48** | **42** | **36** |

† hoarfrost's last phase is set by the frost shard's own stagger, 90 steps at Savior, not by its
`fireEvery`, so it did not move. The hydra's per-head gap and medusa's laser warning and hold are
unchanged; both are added on top of the gap.

So the hydra's later phases are a third to two fifths slower and medusa's a fifth to two fifths.
Hoarfrost moves less, because a volley of hers is a shard that opens into twelve flakes, and its
phases are already the slowest of the three.

### ⚠️ Why the opening phases did not slow

**[0260](0260-a-boss-is-fought-to-the-end.md)'s floor holds them**: every phase of a real boss gets eight
volleys away in the quickest fight any gun manages at the tuned tier (`tests/level.test.ts`), so that
every attack is seen. The arc kills all three in about forty seconds, which puts the opening phase at
8 to 10 seconds. Measured flown, through `scripts/weigh-boss.mjs`'s `flyFight` and the guard's own
arithmetic:

- **hoarfrost's wall at 102 steps would be 7.99 volleys against the arc.** It stays at 96.
- **medusa's first ring** is 54 at Savior from any authored value from 66 to 72, because of the grid
  snap. It went to 72, which is slower on the outer tiers only.
- **the hydra's** opening could go from 54 to 60 and no further.

The other way to slow the openings is more boss health: about **+15% on all three**, which makes all
three fights a seventh longer. That is a different change from the one asked for, so it was not made.
It is the player's call.

## Guards

`tests/frost.test.ts`:

- **THE REPORTED ONE, IN THE LANE** (new): across two whole pulses and the turn between them, the
  cold's edge moves less than a hundredth of the lane in any step. 0459's wrap moved it more than half
  the lane in one step. The guard is in shares of the lane the player flies across, on
  [0027](0027-measure-the-picture-not-the-model.md)'s terms.
- **THE PULSE, DRIVEN** (rewritten): the frame drives one pulse. The cold never shrinks while it
  swells, never grows while it retracts, and sits at its rest for the rest of the pulse. The slow and
  the drawing are one radius on every step, as before.
- **THE EFFECT, WHERE THE PLAYER IS** (rewritten): a ship far down the lane is free at rest, slowed at
  the top, and free again once the cold has drawn back. Before, the check was "free on a dark strobe
  step".
- **THE ASKED-FOR ONE, IN NUMBERS** loses its strobe arithmetic. In its place: the swell and the
  retract are each seen and fit inside the pulse.

No guard is added for the fire rates. They are tuning numbers, and the floors that bound them — 0260's
eight volleys, `tests/difficulty.test.ts`'s grid and its rule that every phase is faster, the hydra's
five-second turn and its 0.8 s between heads — are all green over the change.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0471`:

| broken on purpose | went red |
|---|---|
| the retract one step long — the report, put back | `THE REPORTED ONE, IN THE LANE` |
| the retract swelling on instead of drawing back | `THE PULSE, DRIVEN` |

0459's probe *"the flicker strobing every five steps"* is deleted. The fields it broke no longer exist.

## Owed

- **A play of the Rime Shelf fight**, for whether two and a half seconds back in reads as a pulse and
  not as a retreat. The swell and the retract are row numbers.
- **A play of all three fights at Savior**, for whether the change is the right size. The openings are
  the player's call; see above.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Content numbers, nothing persisted.
