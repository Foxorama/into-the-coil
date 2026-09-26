# 0373 — The fish spits its adds

**Accepted 2026-09-26.** Every horde the flying fish calls comes out of its open mouth: a `mouth`
summons puts the adds at the snout, thrown down the lane at the player in a fan, hittable only once
they are clear of the spray, with the jaw open before they leave and a spray and a cue at the lip as
they do. The kite and the minnow both hunt and both fire. The shoal that swam TO the fish and fed it
is gone, and the `feed` motion with it. **Reverses** [0314](0314-the-shoal-comes-in-while-it-fights.md)'s
feeder and 0249's *a horde that shoots is a wall*; **builds on** 0314's escort, [0262](0262-the-eagle-throws-quills.md),
[0326](0326-an-enemy-is-seen-before-it-fires.md). The plan it answers is
[`the-bosses-planned`](../../reports/the-bosses-planned-2026-09-16.md), item 4.

## The ask

> *"adds should fly out of its mouth to attack the player, adds should be firing and way more
> interactive they're currently trash"* — 2026-09-26. Before it, 2026-09-16: *"the adds that get
> summoned are pretty meaningless still."*

## What the adds were

0314's minnow swam for the fish and was eaten — *what is worth your fire right now* — and 0262's kite
flanked in from the sides and dived. Two plays called both meaningless. The plan's diagnosis stands:
the feed was a number on a bar the player could not see, and a kite summoned from the side carried
no `velAlong` at all, so it held its world position and hunted across a lane the camera left behind
— *a dive that never arrives*. Measured on 2026-09-13, not one of nineteen minnows ever reached the
fish against a shuriken.

## The rule

**`SummonFrom` has a third value, `mouth`, and every call on the fish's row uses it.** A spat body:

| | |
|---|---|
| starts | at the snout — the drawn radius (0.42 of the tile) ahead of the hull's centre along its heading, a shade inside the lip |
| flies | DOWN the lane at its row's `closing`, holding the screen until it straightens, on the flank's own mechanism (0338) |
| fans | to a lane of its own, `SPIT_FAN` (5) times its formation's spacing about the boss's lane, skewed half a spacing to the call's side so no member takes the mouth's own lane; calls lean left and right in turn |
| leaves at | `SPIT_SPEED` 1.8 a step across — three times a flanker's crossing |
| cannot be hit for | `SPIT_GRACE` 18 steps, blinking, which is `invulnFor`'s own picture |
| fires first | on the entry's deal (0326): half a second and its slot after it left the mouth, not a whole reload away |

The jaw opens `FACE_GAPE` steps before the escort's clock fires, on the volley's own tell, and only
when there is room for the call; the first call of a phase that spits waits that long rather than
landing on the step the phase opens. `bossSpit` sounds and `BURST.spit` sprays at the lip.

**The minnow hunts at 0.45, closes at 0.32 and throws the fish's own spine, aimed, every 96 steps.
The kite keeps its dive (0.9) and its bite, and spits, aimed, every 132.** The pair `spit/aimed` is
the kite's and `spine/aimed` the minnow's, because no two shooters send one bullet-and-pattern
(`tests/signature.test.ts`). Standing: four minnows, five kites, six on the last summons.

## What the instrument said at each step, which is why the numbers are what they are

`scripts/weigh-threat.mjs volans`, savior, tier 4 — hits a second on the ship, median of fifteen
places; *fired* is shots the adds got away; *lives* is an add's median lifetime:

| | pulse | shuriken | adds fired (pulse) | one lives |
|---|---|---|---|---|
| before, parked | 0.15 | 0.22 | — | — |
| spat, fan ×3, no grace, parked | 0.22 | 0.22 | **0** | **0.0 s** |
| + grace 12, parked | 0.24 | 0.22 | 6 | 0.2 s |
| + fan ×5, grace 18, parked | **0.69** | **0.49** | 30 | 0.3 s |
| the same, ship sweeping the lane (`--sweep=6`) | 0.39 | 0.35 | 38 | 0.3 s |

⚠️ **THE FIRST ROW OF THIS CHANGE WAS THE OLD DEFECT WEARING A NEW NAME.** The fish stalks the
player's lane (0258), so its mouth sits in the player's own column of fire, and a body born there was
born inside shots already in flight: one to nine steps of life, traced, on every gun, at any speed.
A horde that fires and dies unseen is *"trash"* with a gun. Three things answered it and each was
measured alone: the fan widened so a hunter straightens outside the cap's spread instead of ten units
off it; the grace, so the fan can open; and the entry's fire deal, so a body that lives a third of a
second gets its shot away. The *fired* column is the one that moved.

⚠️ **AND THE FIGHT IS HARDER TO STAND IN, WHICH IS THE ASK AND IS SAID PLAINLY.** 0.69 hits a second
parked puts the fish between the hydra and the frost ship on that table, where it was the softest boss
in the game; against a ship that moves it is 0.39. `tests/crowd.test.ts` still holds that a pilot
flying to the safest place always has somewhere to be, on every tier. **The play owns whether this is
pressure or a wall** — it is the second boss of seven.

**The `--sweep` flag is new on the instrument**, because a parked ship in front of a stalker is a case
that never happens, and the *reached it* column became *fired*: nothing feeds the fish now.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0373`:

| broken on purpose | went red |
|---|---|
| the kites called from the sides again | `THE ASKED-FOR ONE: every horde the fish calls comes OUT OF ITS MOUTH` |
| a spat horde holding its place on the screen rather than flying at the player | the same |
| the jaw no longer opening before a spit | the same |
| the first call of a spitting phase landing before the jaw has opened | the same |
| the spit's grace zeroed, so an add is born hittable inside the player's own fire | `and a spat add LIVES to leave the mouth` |
| the fan folded, so a call leaves the mouth as a single file | `and they FAN` |
| the minnow without a gun again | `and the adds FIRE` |
| the kite without a gun again, which is 0249 as it was | `THE KITE: Ember Nebula's horde` |

Five of 0314's guards and probes went with the feed, and 0249's *the kite given a gun* and 0262's
*the kites called at the leading edge* went with the rules they held — a guard that outlives its
subject is one 0192 says to delete. 0319's gape guard counts a horde leaving as a thing that came out
of the mouth, which is the same sentence the player learns.

## What this deliberately does not do

- **No arc for the kites.** The plan's proposal; a spat fan that dives back is the same shape from a
  different origin, and the mouth is what was asked for. If the play says the dive back into the gun
  line is the old *never arrives*, the arc arm is there.
- **No change to the breaker's place, the fight's length or the health table** — the plan's items 2
  and 3, still owed and unchanged by this.
- **Nothing on the other thirteen bosses**, whose summons still flank or lead. `mouth` is a value a row
  may choose, and one row does.
