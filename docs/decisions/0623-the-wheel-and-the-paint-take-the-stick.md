# 0623 — The wheel and the paint take the stick

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 6. Amends
[0588](0588-the-rings-are-thrown.md): the ray is no longer the only gun the right stick steers.

## The ask

> *"weapons need right control stick — catherine wheel, paint gun"*

## What was true

0588 gave the ray's volley the pad's right stick, through 22.5° either side of the nose, by a number on the gun's
row (`aim`), and held every other gun deaf to it. The Catherine wheel was thrown to hang straight ahead of the muzzle
and the paint gun fired its string scattered about straight ahead.

## The rule

| | |
|---|---|
| **the paint gun** | `aim: π/8` on its row, the ray's arc. Each ball leaves at `aim × intent.aim` plus its scatter, so the string is scattered about where the stick points as it was about straight ahead |
| **the wheel's throw** | `aim: π/8` on its row. It is thrown to hang `reach` from the muzzle at `aim × intent.aim` off the nose |
| **the wheel hanging** | while its tether holds and the stick is pushed, the place it hangs swings toward the point `reach` from the muzzle at the stick's angle, `swing` (a tenth) of the way a step — most of the way in a third of a second. Let go, and it stays where it was put: still a place on the screen, the ship still the moving end, as 0549 made it. The leash, the no-fly wall, the lane's edges and the stone all still hold it after the swing |
| **the hints** | both guns' lines on the gun band say to use the right stick, as the ray's does |

## Why the wheel swings and does not only throw

A wheel is thrown once every 2.4 s and hangs for 2.67. Steering only the throw would be a stick that does something
once every two seconds and a half; the ask is to direct the weapon. The ray's rings are thrown many times a second,
so for the ray the throw was the whole of it.

## Why letting go does not spring it back

Springing it back to straight ahead on release would make a wheel the player put on a turret move off it the moment
the thumb lifts. A wheel left where it is put is 0549's wheel.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): at the wheel's reach, 22.5° is 49 units across a 120-unit lane
from the ship, so a steered wheel reaches bodies the straight one only reached by moving. That is the ask. Nothing new
is drawn; the wheel, its tether and the paint are in the player's own inks.

## What guards it

`tests/aim.test.ts`, *0623*: in degrees, every ball of a string fired with the stick at 0, ±1 and ½ is within its
scatter of 0°, ±22.5° and 11.25° and the string averages within half the scatter of it; the wheel is thrown to hang at
0°, ±22.5°; and with the stick pushed for half a second a hanging wheel swings past 18° and over 20 units across the
lane, and stays past 18° when it is let go. 0588's *every other gun ignores the stick* now skips the three steered
guns. Probes in `scripts/probes/0623-the-wheel-and-the-paint-take-the-stick.mjs`, all four seen red; 0549's, 0588's and
0595's probes on the lines this changed are re-anchored.

## Owed

A play with a pad: whether 22.5° is the arc the hand wants for the wheel, whether `swing` is quick enough, and whether
the arc should also be on the keyboard — it is not; the right stick is the pad's alone (0588).
