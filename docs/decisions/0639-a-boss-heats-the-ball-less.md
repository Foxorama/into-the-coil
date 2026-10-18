# 0639 — A boss heats the ball less

**Accepted 2026-10-18.** From [`the-morning-play`](../../reports/the-morning-play-2026-10-18.md), item 3. Adds to
[0609](0609-the-ball-takes-its-knocks.md)'s heat and leaves [0617](0617-the-dance-burns.md)'s boss weight where it is.

## The ask

> *"The boss damage for the hamster ball also needs to be buffed slightly, took all the power ups and still a very
> long time to kill bosses 1, 2 and 3 — haven't tested later bosses yet"*

## What was measured first

`scripts/weigh-boss.mjs` flies each ship with its gun, unhittable, with missiles silenced. On Savior, the ram, flown
on its lane:

| boss | the ram's best fight | the floor |
|---|---|---|
| jormungandr (boss 1) | 32 s | 28 s |
| volans (boss 2) | 42 s | 40 s |
| quetzal (boss 3) | 41 s | 40 s |

That fixture holds the ball against the hull and never lets it burn. 0617's *Owed* asked for these flown times, and
this is the first record of them. In it the ball already fights at the floor 0260 sets, so raising the ram's boss
weight would take those fights under the floor.

A player does not fight like the fixture. The gauge fills in six or seven landings and burns a shield at full, so
a pilot backs off and waits half a second, then drains it for over a second and a half. 0615 measured 0.9 to 1.9
landings a second on a boss for a pilot who minds the heat, against 5.3 for the fixture. The long fight the player
reported is the cooling, not the weight.

## The rule

**A landing on a boss adds `bossHeat`, 0.11 of the gauge, where a landing on anything else adds `heat`, 0.15.** That
is eight landings on a boss before a burn, where it was six or seven.

For a pilot who rams until the gauge is near full, then waits for it to cool, that is about a quarter more landings
a second on a boss. This is arithmetic on the row and not a flown measurement: 2.3 landings a second becomes about
2.9, each landing adding 0.11 and taking 0.11/0.01 steps to drain. Ramming everything else heats as it did, and the
fixture's fights do not move, because it never burns.

## What guards it

`tests/ball.test.ts`, *0639*, counted in what the player does: landings, from a cool gauge to the burn. Pressed into
a boss, the ball takes more of them than pressed into a body, and at least the row's count less one.

The probe in `scripts/probes/0639-a-boss-heats-the-ball-less.mjs` heats a boss landing as a body's; seen red.

0609's probe *a landing that heats nothing* is re-anchored to the new line, and the boss fights' floor (`tests/level.test.ts`,
`tests/serpent.test.ts`) is unchanged.

## Owed

- **Bosses 1 to 3 in the ball**, whether a quarter is the *slightly* asked for, and the later bosses not yet played.
