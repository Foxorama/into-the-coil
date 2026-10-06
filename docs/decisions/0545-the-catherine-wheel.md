# 0545 — The Catherine wheel

**Accepted 2026-10-05.** Item 2 of [`the-thunderbolt-planned`](../../reports/the-thunderbolt-planned-2026-10-05.md),
with [0546](0546-the-marmot-rides.md). A fifth gun and a fifth way a shot flies, beside
[0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)'s, [0234](0234-a-blade-circles-the-ship.md)'s and
[0442](0442-the-ray-gun.md)'s; and the guns move between the ships, against
[0441](0441-a-pilot-flies-their-own-ship.md)'s first fitting of them.

⚠️ **Its cadence, life, reach, leash, size and boss weights are [0549](0549-the-wheel-is-playable.md)'s
since 2026-10-06**; the numbers below are this decision's, kept as the record of what was first built.

## The ask

> *"For default weapons, let's move the shurikens to the station wagon to replace the lightning gun
> we're giving to the Marmot*
>
> *and for the Firebird let's give it a fire themed weapon - it fires out a spinning fire wheel disc like
> a catherine wheel firework that shoots out short sparking fire embers and has a fire tether back to the
> spaceship that you can use to hit things with, the tether stays attached to the disc and the car and you
> can go back and forth with it.*
>
> *the catherine wheel fires out every 4 secs and fades away at 3.6 seconds give or take before the new
> one fires out -> we might make it a button, but let's try auto-fire for now."*

Answered while it was planned, of how it moves: **it hangs, on a leash.**

## The rule

**The Firebird flies the Catherine wheel, the estate the shuriken, the Thunderbolt the arc. The wheel is
thrown from a spindle on the Firebird's hood on the first beat of a life and every ten beats after; it
flies out, slows, and hangs spinning ahead of where it was thrown, in the camera's frame, for nine beats,
burning down over the last. It lands on what it touches, throws short embers off its rim, and is tied
back to the muzzle by a tether that lands on whatever crosses it. Past the leash the ship tows it. Its
special is the roman candle ([0537](0537-the-candle-is-lit.md)).**

| | |
|---|---|
| **the row** | `catherine` in `src/content/weapons.ts`, flight `tether`, a cadence of 240 steps (ten beats), and its `wheel` (`CatherineWheel`): a life of 216 (nine) fading over 24, hung 66 ahead, closing 0.09 of the way a step no faster than the disc's 3, a leash of 96, a turn of 0.32 a step, three embers off a rim of 5.4 every other step living 16, a tether landing 0.9 either side of its line for 1 |
| **the shots** | `catherine`, the wheel — 4.2 across, 2 damage, not spent by arriving (`WHEEL_EDGE`) and ended by its clock; `cinder`, an ember — spent by arriving, 1 damage. Both in the pulse's pool |
| **the tether** | `tetherInto` in `src/sim/collide.ts`: a line from the muzzle to the wheel against a pool, on the blades' bucket (0391) and stopped by stone as a blast is (0349); drawn as one bolt link laid after everything has moved, as wide as it lands |
| **the clock** | the wheel and its tether share the blades' landing gap, so a tether held across a boss is not sixty landings a second; a boss takes the gun at `bossWeight` 0.6, the gyre at 0.57 and the fish at 0.55 |
| **the sound** | `wheel`, the throw; `crackle`, on each beat while it burns; `sizzle`, when the tether lands |
| **the bolt verb** | `Surface.bolt` takes a tone — the player's, the enemy's, or the flame's — where it took a flag, `hostile`; the flame is the player's amber and gold |
| **the guns move** | the estate's bonnet is redrawn round a shuriken launcher with the steel star in its face, and the Firebird's hood round a spindle with a spare wheel lit on it; the lightning rod and the shaker scoop with its star are the arc's and the shuriken's mounts, stood on any ship borrowing those guns (0525) |

## Why it is built the way it is

**It hangs, so the ship is the moving end.** A wheel fixed ahead of the nose is a lance, and *going back
and forth* would only move the whole thing; a flail is fun to whip and hard to aim. Hung in the camera's
frame the wheel is a place, and the tether is a sweep the player steers. `tests/wheel.test.ts` holds that
in the player's terms: a body off the line is untouched while the ship holds still and struck once the
ship flies across it. The leash is what keeps the tether off the whole lane the moment the player retreats.

**Ten beats and nine.** Four seconds is exactly ten of the music's beats and 3.6 is nine, so the cadence is
on the grid every gun is on, and the wheel is gone a beat before the next. A life's first wheel would have
waited up to four seconds for that grid; `firstVolleyIn` lets a life's first volley land on the next beat
when a gun is slower than one, which for the four guns that fire at least once a beat is what it always was.

**Three things land, and two share the blades' clock.** The wheel and the tether are not spent by what they
touch, so each lands only so often on a body, on 0391's bucket; the embers are spent by arriving, as
pulses are.

**Fire in the player's inks.** `fire` is the hostile meaning ink; the wheel, its embers and its tether are
the player's amber and gold with a white-hot heart. An ember is a streak with a white head, turned along its
flight — a round dot of fire is what a hostile bullet is in the volcano, and the shape is what tells them
apart there ([0295](0295-a-ranking-guard-is-a-content-limiter.md)'s question, asked and not ruled).

**Each car's own gun is drawn into its body, as it always was.** The first pass kept each car's old drawing
and stood its new default on the hardpoint as a borrowed gun. `tests/accents.test.ts` refused it: a borrowed
mount stands off the hull by design, and a ship's own gun is part of its silhouette — so the hoods were
redrawn round the new guns. That pass also found that a car flying a borrowed gun had never been held to the
paint guard, only its default sprites were.

**The bolt verb gained a third tone rather than a colour.** The verb's own note refuses a string per stroke
on the hot path, so the tone is a number, set once per palette as the other two inks are.

**The boss weights were measured, not asked for.** At a weight of one the wheel took the gyre, the medusa
and the fish in 24 to 26 seconds from their best place, where every other gun's best is about forty and the
floor is forty ([0260](0260-a-boss-is-fought-to-the-end.md)). What one gun takes from its best place, at Savior, in
seconds, at the weights it ships with:

| boss | pulse | arc | shuriken | ray | catherine |
|---|---|---|---|---|---|
| jormungandr | 66 | 30 | 35 | 50 | 57 |
| volans | 41 | 41 | 41 | 40 | 43 |
| quetzal | 103 | 43 | 66 | 110 | 93 |
| gyre | 40 | 41 | 40 | 41 | 41 |
| hoarfrost | 85 | 40 | 58 | 72 | 72 |
| hydra | 50 | 40 | 50 | 45 | 48 on its lane |
| medusa | 53 | 41 | 43 | 49 | 50 |

The fish was not monotonic: at 0.62 it was faster than at 0.6, because the damage moves its phases, so its
0.55 was measured and not divided. Every borrowed pairing meets the same floor (`tests/gun-floor.test.ts`).

**Under the flash cap.** `scripts/weigh-flashes.mjs --only=catherine`: no general flashes, peak changing
area 2.3% against the cap's 11.1%.

**Four guards learned the wheel, each for the reason it gives.** A shot that survives an arrival owes a
picture unless nothing shoots it — the blade's exemption, and the wheel's (`tests/combat.test.ts`). The
missiles are slower than the gun, and cross it — claims about a gun that fires volleys, which a wheel
burning nine beats in ten does not (`tests/pickups.test.ts`, `tests/missiles.test.ts`). The crackle is the
wheel's own stream and held under the outcomes as a gun's cue is, and the sizzle is a landing, dry as `hit`
is (`tests/sound.test.ts`).

## Rollback

⚠️ **None owed for storage** — [0001](0001-revertability-not-risk-rating.md). The gun a ship flies is run
state. The hangar stores a fitted gun as the ship it came from (0526), so a fit saved as *the Firebird's
gun* follows the Firebird to the wheel; answered while it was planned, *"there are currently no saved games
or anything to worry about"*, and item 3 of the plan stores guns by kind.

## What guards it

`tests/wheel.test.ts`: the guns are where the ask put them and each is one ship's own; the wheel is thrown
on the first beat of a life and then every ten beats on the grid; it flies out no faster than its row and
hangs, spinning; **going back and forth sweeps the tether across a body off its line**; the leash holds; it
burns down and is gone before the next; it throws short embers spent by arriving; its tether is drawn as
wide as it lands from the muzzle to the wheel; a body held across it takes only the bucket's worth; it goes
with the ship. The boss floors fly it in every ship, and every borrowed pairing. Probes in
`scripts/probes/0545-the-catherine-wheel.mjs`; those of 0094, 0250, 0375, 0377, 0378, 0391, 0475, 0477,
0479 and 0487 were re-anchored on the lines this moved.

## Owed

- **A play**: whether the hang and the leash read as *going back and forth*, whether ten beats is the right
  wait, and whether the embers read as the wheel's and not as fire coming in — in the volcano first.
- **The ear** on the throw, the crackle and the sizzle.
- **The button**, if wanted: *"we might make it a button."* There is no fire action and
  `src/content/actions.ts` says there must never be one, so that is a decision against that rule, not a setting.
