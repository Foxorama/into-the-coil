# 0289 — A bob can rear

**Accepted 2026-09-09**, from the first play of the long serpent —
[`the-chain-played`](../../reports/the-chain-played-2026-09-09.md):

> *"also can we give it more motion, like have it rear back a bit rather than just have the head go
> up and down?"*

**Amends [0111](0111-a-boss-has-one-idea.md)**, which gave a boss its own way of flying, and
[0061](0061-a-boss-keeps-flying.md), which gave the station its drift.

## The rules

**A bob may have an along half, and it is a term of the STATION rather than an arm of the move.**

**Every bobbing boss states its own rear, including the four that state zero.**

**A hull that lunges stands further back**, because the room the lunge takes comes out of the
player's.

## ⚠️ Why it is not a new arm of the move switch

`src/app/boss.ts` has said it in writing since 0111: **every arm is on `across` and none touches
`along`**, and what that buys is that the station is the ONE place a hull's lane position is decided.
Six assertions across `tests/level.test.ts` are written against that — the forward end on the
narrowest screen, [0101](0101-the-sky-is-a-hurry-and-the-boss-holds-back.md)'s half-screen floor at
the near end, and *do not land on the ship's start*.

⚠️ **AN ARM THAT REACHED PAST THAT RULE WOULD BREAK ALL SIX SILENTLY**, because none of them drives
anything: they read the row. So a rear is a term of the station, beside the `drift` it is a bigger
sibling of, and the three guards that read the station's ends now read three terms instead of two.

⚠️ **`bobPhase` IS LAST STEP'S, DELIBERATELY.** The move switch advances the angle after the station
is computed, so the arc trails the bob by one step at 60Hz. Reading it forward means either advancing
the angle in two places or moving the switch above the station — and the second is exactly how *the
arms do not touch along* gets quietly lost.

## ⚠️ The lunge comes out of the player's half, and that is what set the station

0101 holds every boss out of the player's half at the near end of its swing — `station − drift −
radius` against **55% of the narrowest screen**, a floor written because five of seven bosses had
drifted into that half and one reached 37%.

At station 114 the serpent sat at **57%**. It had two per cent of room, so **every unit of lunge came
straight out of the player's**: a rear of 14 would have put it at 49%, under the number the report
that wrote 0101 actually observed.

⚠️ **SO THE ANIMAL HOLDS OFF AT 130 AND CLOSES TO 103 WHEN IT STRIKES.** Both ends are further from
the player than the one place it used to sit, and it reads as a thing that comes at you rather than a
thing parked in front of you. The floor decided the station; the station was not chosen and then
checked.

## ⚠️ What it did to the fight, measured, and it is the opposite of the last one

The rig is the same scratch driver 0288 used: max weapons, pilot parked on the boss's lane, trigger
held.

| | fight |
|---|---|
| before 0288 | 66.0 s |
| 0288's bigger head and hurtbox | 59.0 s |
| this, standing 16 units further back | **68.0 s** |

**A boss further away is a boss fewer shots reach**, and it more than paid back the 11% the larger
hurtbox cost. Net across the two decisions the fight is 3% longer than it started, against a floor of
40 — so nothing is compensated on the row, and the number is written down rather than assumed in
either direction.

## What is held, and where

| Claim | Where |
|---|---|
| the head moves ALONG its lane, by more than its own drift would give it | `tests/serpent.test.ts`, driven |
| and the lunge is locked to the bob, so it is one arc and not two wobbles | `tests/serpent.test.ts`, driven |
| the forward end, the near end and the ship's start all carry the rear | `tests/level.test.ts`, three guards |

⚠️ **THE DRIVEN GUARD MEASURES `along − cameraAlong` AND NOT `along`.** A station is a distance from
the camera, so a hull matching the camera's rate is standing still on the screen while its world
`along` climbs every step. A guard reading `boss.along` would report a hundred units of magnificent
rearing from a boss that never moved a pixel — [0027](0027-measure-the-picture-not-the-model.md), and
the same trap 0283's *the body moves* guard had to step around.

⚠️ **AND THE FLOOR IS THE DRIFT IT REPLACES.** *More motion* is a claim about size: the serpent
already slid five units either way, and that is the thing the report calls *just going up and down*.
Four times it is the bar — a rear worth having is bigger than the wobble nobody could see.

## What this does not do

The withdrawal and the strike take the same time, because both are the same cosine. A real strike is
faster than the pull-back that loads it, and that is a shape this cannot make — it would want the
angle warped, which is a second thing to author and a second thing to guard. **Nobody has played this
yet**; if it reads as a sway rather than a strike, that asymmetry is the next lever and not a bigger
`rear`.
