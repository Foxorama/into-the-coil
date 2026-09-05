# 0255 — The jellyfish opens

**Accepted 2026-09-06**, after [0254](0254-the-hydra-grows-heads.md), the seventh and last of the
real bosses' own decisions, from [`the-bosses-asked`](../../reports/the-bosses-asked-2026-09-05.md):

> *"the black heart will have a giant space jellyfish where you can see the black heart pulsating
> inside it, it'll have long tendrils that you have to dodge that pulse out lightning blasts. lots
> of moon jelly adds that rain down onto the screen and player and then final phase will be the
> jellyfish opening up and the black heart spewing forth a rain of void blasts with dark red and
> purple pulsating energy that scatters off them"*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: the jellyfish's row is the fight
the brief described, and its curtain — the tendrils' stand-in — goes. **Amends
[0150](0150-the-uncoil-and-the-eye.md)**: a boss may open without going quiet. **Amends
[0251](0251-the-volcanoes-belch.md)**: a fall is a shot or a body, and it starts at a share of the
health.

## The rules

**The tendrils are beams hanging from the bell, and they pulse.** At three quarters, five of
0250's beams from five roots across the bell — twelve units either side and between — each a short
warning and a short hold, on and off inside half a second; at the last third, wider and held
longer. A tendril the player must dodge is a column down the lane that is on and then off, which is
what a beam with a short hold is. `THE TENDRILS, DRIVEN` in `tests/medusa.test.ts` hangs one volley
and holds that every beam leaves its own root and that a ship under one is hurt within a second;
`THE FIVE PHASES` holds that the roots are five, distinct, and spread across the bell.

**A fall is a shot or a body, and it starts at a share of the health.** `Fall` is a closed union
— `shot` is the volcanoes' rock, exactly as 0251 left it; `body` is `count` of an enemy put at the
top edge as a rock is, sinking across the lane at the row's own closing speed and steering for a
place past the across cull the way a flanker steers for its lane (0048), so `steerEnemies` carries
it straight across and out and the cull takes it before it arrives. `from` gates both: the jellyfish's moon
jellies fall from three quarters of its health, two a belch every 75 steps; the quetzal's rock
from the first step. `THE MOON JELLIES, DRIVEN` holds that nothing falls on a whole bell, that a
belch is the fall's count from over the top edge inside the ship's box, sinking and steering for
the bottom, that they reach the bottom of the lane in the seconds their speed says and leave it.

**The moon jelly is a body no level sends.** A new enemy kind on the kite's terms (0249): a bell
with a fringe, one hit, one bite, no gun — a rain that shot would be a wall — and the slowest
thing that closes at all, which is what makes it a rain and not a charge. `THE MOON JELLY` holds
all of that and that no level and no other boss sends it.

**The last phase opens and keeps throwing.** A third stance, `open`: it takes `damageScale` times
as much, as `bare` does, and throws its fan as `volley` does. It is not a relief — the bared window
is the fight ending on something other than a bar reaching zero; this is the fight getting harder
and shorter at once, the heart exposed and shooting. The jellyfish's last fifth opens at twice the
damage and throws a ring of ten void every sixth of a second: *"the black heart spewing forth a
rain of void blasts."* `openBy` reads both stances; the rule written for `bare` — once, at the end
— does not read `open`, because it is not a window; the death-floor guard and the three-second
phase guard in `tests/level.test.ts` read an opened band at the damage it actually takes. `THE
OPENING, DRIVEN` holds that the opened bell takes twice as much and that its volley is void.

## The figures

| phase | at | what |
|---|---|---|
| whole | 100% | a ring of four |
| the tendrils | 75% | five beams at ±12, ±6, 0; 0.2 s warning, 0.2 s held, 2.4 wide; the moon jellies begin |
| denser | 50% | a ring of eight |
| the tendrils again | 30% | five beams at ±15, ±7.5, 0; 0.2 s warning, 0.3 s held, 3 wide |
| the opening | 20% | twice the damage; a ring of ten void every 36 steps |

The moon jelly: 6.5 units drawn, hurtbox 2.6, one hit, closing 0.1 — slower than the spore, the
slowest thing that closes — 17.5 seconds to cross the lane. A fifth at twice the damage is 3.4
seconds at max weapons, over the three every phase is held to.

## ⚠️ What was rejected

**Tendrils as lightning.** The serpent's rain is jagged and lands once; a tendril is a thing that
hangs and stays, and the beam is the thing in the pool that is held. The jag, and the lightning
the brief says the tendrils pulse *out*, are owed to an eye on the picture.

**The opening as `bare`, with the void as a fall.** A bared bell throws nothing, and the brief's
final phase is the heart *spewing*; and one row has one fall, which the moon jellies already are.

**A moon jelly summoned at the leading edge.** *"Rain down"* is a direction; a summons (0249)
arrives from the front. The fall already owned the top edge.

**The black heart drawn pulsing inside the bell.** The hull is one bitmap (0022); a heart that
beats inside it is a landmark's beat on a boss, which is a second thing that animates and a
decision of its own.

## What is owed

- **An eye on the bell at the shipped camera**: whether five pulsing beams read as tendrils, and
  whether *"dark red and purple pulsating energy that scatters off"* the void wants a burst per
  ring — the void's own ink at the hull on every volley of the opening.
- **The heart.** Pulsating, visible inside the bell: a beat on a boss's sprite, which nothing
  draws today.
- **The tendrils' jag**, if straight beams do not read as tendrils.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, a stance, a fall arm,
an enemy kind; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0255`:

| broken on purpose | went red |
|---|---|
| the opened bell taking no more damage than a closed one | `THE OPENING, DRIVEN` |
| the opened bell silenced as a bared one is | `THE OPENING, DRIVEN` |
| the fall's health gate dropped, so the moon jellies fall on a whole bell | `THE MOON JELLIES, DRIVEN` |
| a fallen body not steering for the bottom edge | `THE MOON JELLIES, DRIVEN` |
| the moon jelly given a gun | `THE MOON JELLY` |
| the tendrils all hung from the middle of the bell | `THE FIVE PHASES` |

0251's fall probe re-anchored on the line the health gate joined.
