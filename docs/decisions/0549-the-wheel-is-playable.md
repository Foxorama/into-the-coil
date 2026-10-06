# 0549 — The wheel is playable

**Accepted 2026-10-06.** The Firebird's Catherine wheel, [0545](0545-the-catherine-wheel.md), reworked in
how it looks and how it flies. Supersedes 0545's cadence, its life, how far it is thrown and its leash; the
rest of 0545 stands.

⚠️ **Its clock, reach, leash, ember life, tether width and boss weights are [0551](0551-the-wheel-is-held-closer.md)'s
since 2026-10-06**; the numbers below are this decision's, kept as the record of what was built first.

## The ask

> *"let's make the Firebird's Catherine Wheel actually playable*
>
> *it needs improvements in looks and functionality*
>
> *the main wheel should be a lot smaller, the spark spray should spray out to the same size as it
> currently does. visually the center should be white hot and the sparks should have a lot more depth to
> them. the tether also needs some more depth to it and should be slightly thinner, it needs to look more
> crackling and dynamic.*
>
> *for the functionality, the tether should fade out at 3.4sec and then the new wheel should fire at 3.6
> sec, so it's firing while the old wheel is visible and ending.*
>
> *it also needs to shoot out further - it should reach across 75% of the screen or to the no-fly zone
> wall, whichever is closer."*

## The rule

**The wheel is thrown every nine beats (3.6 s). Its tether fades over the fifth of a second before 3.4 s
and lets go there; the wheel then burns down where it hangs until 4 s, so the next is already out. It is
thrown three quarters of the screen ahead of the muzzle, or to the no-fly wall where that is nearer. It is
drawn half the size with a white-hot heart, its sparks cool as they fly, and its tether is a thinner rope
of fire with two filaments crackling about it.**

| | |
|---|---|
| **the clock** | `fireEvery` 216 (nine beats, 3.6 s), `life` 240 (4 s), `fade` 36: the tether holds while the wheel is not burning down, so it lets go at 204 steps, 3.4 s. Only one wheel is ever on a tether; for 0.4 s two are in the air |
| **the reach** | `reach` 0.75 of `view.alongSpan` from the muzzle, held short of `PLAYER_LEAD` — the front of the player's own box, the wall 0074 and 0359 draw — and of the screen's edge. `leash` is a share of the screen too, 0.8, and holds only while there is a tether — at 0.9 it was longer than the ship can get from a wheel at the wall, so it never acted and 0545's probe of it stayed green |
| **the throw** | the disc's `speed` 3 → 5, so a throw of 160 units on 16:9 has arrived in about 0.7 s |
| **the size** | the wheel's sprite 16 → 8 units across, its hurtbox 4.2 → 2.1 (still its hub and half its spokes), its rim 5.4 → 2.7 |
| **the spray** | `emberLife` 16 → 17: an ember leaves the rim leaning out from its tangent, so its reach from the hub is the rim and its flight added at that lean — 26.8 units before and after |
| **the heart** | `src/render/bake.ts`: a gold light half way to the rim, a white light inside it, a pale-gold ring and a solid white core a fifth of the face across, laid over the spokes' roots |
| **the sparks** | five layers where there were two, and `cinderCool`, the same streak cooled to deep amber, which an ember turns into for the second half of its flight. Both are `LIGHT_KINDS`, so a spray burns brighter where streaks cross |
| **the tether** | `tether` 0.9 → 0.7, as wide as it lands. Drawn as `ROPE_LAYERS` — a wide amber wash, a dark rim, an amber body at the hurt width, a pale heart and a gold core — its ripple two waves running opposite ways; over it two flame filaments jagged on the bolt's hash and re-rolled every two steps, and two sparks jumping along the first. `STROKES_PER_TETHER`, five, is the cost |
| **the bolt verb** | `Surface.bolt`'s last argument is a `look` — flash, beam, rope — where it was a flag, `beam`, on the terms its `tone` became a number in 0545 |

## Why it is built the way it is

**The tether lets go when the wheel starts to burn down, not on a clock of its own.** 3.4 s is where the
wheel's own fade begins, so one number, `fade`, says both; a second number would be a second answer to
*when does the wheel stop working* that could disagree with the first. The fifth of a second it fades over
is a painter's constant, as a flash's eight steps are, read off the steps the link carries (`holdFor`).

**The wall is the player's wall.** *"The no-fly zone wall"* is the line the ship cannot fly past and the
game draws as it arrives (0359) — `PLAYER_LEAD` from the camera. It is inside the screen's edge on every
aspect the view allows (16:9 and wider), so the edge in the `min` only matters if that changes.

**A share of the screen, which 0023 does not otherwise allow.** Nothing is authored in screen space
because the lane must be the same on every device; but the ask is *"75% of the screen"*, a quantity in what
the player sees, so the reach is that. On 16:9 that is 160 units, on 21:9 it is past the wall from almost
everywhere and the wall decides. The lane across is untouched.

**The wheel's ember spray was most of what it did to a boss, and the reach moved it off the boss.** Flown
on `scripts/weigh-boss.mjs` at 0545's weights, from the instrument's best place, the wheel thrown to the wall
hangs past the middle of a boss that 0545's 66 units put it squarely on, and most of the spray now misses:

| boss | 0545 | 0549 at 0545's weight | 0549 weight | 0549 |
|---|---|---|---|---|
| jormungandr | 57 | 43 | 0.6 (the gun's) | 43 |
| volans | 43 | 114 | 0.55 → 1.45 | 42 |
| quetzal | 93 | 285 | 0.6 → 1.8 | 96 (43 on its lane) |
| gyre | 41 | 108 | 0.57 → 1.42 | 41 |
| hoarfrost | 72 | 198 | 0.6 → 1.6 | 72 (55 on its lane) |
| hydra | 48 on its lane | 101 (61 on its lane) | 0.6 → 0.9 | 66 (41 on its lane) |
| medusa | 50 | 40 | 0.6 → 0.57 | 43 |

The hydra's lane and its held places moved apart: the first pass scaled it to 1.25 from its held best,
and flown on its own lane that took it in 30 s against the floor's forty — so its weight is set from the
lane, and its held places are slower for it (66 s best). The medusa went the other way, and its floor
guard caught it at 39.7 s before the instrument was run. Each weight is on the
boss's own row (`gunWeights`, 0372) because each boss moved by a different amount.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). No storage, save schema or shipped surface
is touched: the gun's numbers are content and a fitted gun is stored as the ship it came from (0526).

## What guards it

`tests/wheel.test.ts`: the ask in seconds — the tether lets go at 3.4 s, the next is thrown at 3.6 s, the
last outlives the throw, on the beat grid; every throw after the first finds the last wheel burning down and
on screen, and never two on a tether; the reach as a share of the screen from the back of the box, and the
wall from the middle of it; the tether lets go the step its wheel begins to burn down, 3.4 s to the step,
fading first; embers cool, and only in the second half of their flight; the tether is painted as one rope
four times as wide as the width it lands at, two filaments and two sparks, all in the flame's inks, at its
stated cost. `tests/bolt.test.ts` holds the rope to the same light-is-added rule as a flash and a beam. The
boss floors, in every ship (`tests/gun-floor.test.ts`, `tests/level.test.ts`, `tests/serpent.test.ts`).
Probes in `scripts/probes/0549-the-wheel-is-playable.mjs`; those of 0250, 0475, 0476, 0477 and 0545 were
re-anchored on the lines this moved.

## Owed

- **A play**, on the Firebird: whether the wheel at the wall reads as reaching, whether the overlap reads as
  the gun firing while the last one ends, and whether the crackle reads as fire and not as lightning.
- **A play against the bosses**: the weights above make the instrument's best place meet the floor; how the
  wheel feels against a boss when it hangs past it, and has to be swept across it, has not been flown.
- **On a 21:9 screen**, where the wall decides from nearly everywhere — the reach was asked as a share of the
  screen and is one; whether the player wants it to be the wall that often is theirs.
