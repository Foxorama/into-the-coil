# 0588 — The rings are thrown

**Accepted 2026-10-10.** From the play-test of 2026-10-10. Redraws [0442](0442-the-ray-gun.md)'s rings.

## The ask

> *"The ray gun firing bullets should be more like Sonja blades 4 ring energy pulse. You also need to be able
> to use the right joystick on a controller to be able to direct the energy pulses in a 45 degree arc
> straight ahead."*

Read as Sonya Blade's energy rings: a train of rings thrown forward, each seen edge-on.

## The rule

**A ray volley is four rings in a train up its line of flight, each seen edge-on, the smallest at the back
and the biggest at the front. The pad's right stick turns the volley up to 22.5° either side of the nose —
a 45° arc straight ahead — and the rings face where they were thrown.** A released stick fires straight
ahead. No other gun is steered.

| | |
|---|---|
| **the picture** | `ray`, `rayRipple` and `raySwell`: the four rings (`RAY_RINGS`) over a dark cone the train sweeps (`RAY_FIELD`), kept from 0442 so the rings read on the palest sky. The lit ring steps forward a page at a time and the front one is always lit, so the pulse surges toward what it is thrown at. Every ring is at least a tenth of the frame thick and 0.18 wide, so each is over 0106's floor at the fight's size |
| **the stick** | `PAD_AIM_X`, `PAD_AIM_Y`: the standard mapping's right stick, under the left stick's radial deadzone, summed across pads, and turned with the screen as the left stick is (0023) |
| **the intent** | `aim`, −1…1 across the lane, zeroed and clamped by `combineDevices` as `along` and `across` are. The sim reads it as an argument, as it reads everything a device asks (0030) |
| **the gun** | `aim` on the weapon row: the half-arc a stick at full turns the volley through. `Math.PI / 8` on the ray and nought on every other row, so a steered gun is a number on its row and nothing in the frame (0282) |
| **the frame** | `firePulse` turns the whole fan by `aim × intent.aim`, and a steered shot's `turn` is its heading |

## What does not change

What a ring does — it is spent where it lands and bursts there (0442) — its speed, its damage, its cadence
and its hurtbox. The rings in flight still ripple through three pages.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md). A ring steered 22.5° crosses 0.41 of a lane-width for
every lane-width it climbs, so it reaches bodies the straight gun only reached by moving the ship. That is the
ask. It is the player's own ink, the ray's lavender, and the dark field keeps it off the sky.

## Hints

Nothing on How to play names a stick; the ray's own line on the gun band says *aim them with the right
stick*. [`docs/game.md`](../game.md): a hint is added where play proves it is needed.

## What guards it

`tests/aim.test.ts`: the right stick is the aim and moves nothing, rests under the deadzone, turns with the
screen; the ray's rings leave at 0°, ±22.5° and 11.25° for a stick at 0, ±1 and a half, in degrees, and face
their flight; every other gun ignores the stick. `tests/ray.test.ts` still holds the burst and the ripple.
Probes in `scripts/probes/0588-the-rings-are-thrown.mjs`.

## Owed

A play with a pad: whether 22.5° at full is the arc the hand wants, and whether the turn should ease in
near the centre.
