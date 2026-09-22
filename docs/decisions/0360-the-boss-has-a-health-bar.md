# 0360 — The boss has a health bar

**Accepted 2026-09-23.** Item 4 of
[`the-bosses-planned`](../../reports/the-bosses-planned-2026-09-16.md), *"boss health on the screen —
a decision the whole roster has owed since the first play-test; the feed becomes legible by it"*,
landed out of the plan's order because the player asked for it directly. **Extends
[0045](0045-the-player-can-see-what-they-are-carrying.md)** with a second readout, in the other ink.

## The ask

> *"Add end boss health bars."*

## The rule

**While the end boss is on the field and has finished any entrance, a bar at the top centre of the
screen shows what it has left as a fraction of what it arrived with, with a notch at every phase
threshold in its row.** Nothing for a mid-boss. Nothing during the entrance. Gone in the step the
body goes.

| | |
|---|---|
| **whose** | the END boss — `bossOnField`, which is `fight === 1` — never the mid-boss |
| **when** | from the step after the entrance ends to the step the pool empties |
| **what** | `health / bossFullHealth`, rounded UP to one part in `BOSS_BAR_STEPS` (200), clamped to one |
| **ink** | the enemy's |
| **marks** | one notch per `upTo` below one in the row's `phases` — where the fight turns |
| **words** | `role="progressbar"`, the percentage as `aria-valuenow` — 0024's twin |

## Why the end boss and not the mid-boss

[0247](0247-a-level-has-a-mid-boss-and-a-real-one.md) made the mid-boss *a beat inside the level*,
over in the seconds `scripts/solve-mid-health.mjs` solves it to, and the end boss *the fight the
level is*. A bar over both would say they are the same kind of thing, and the plan's own line is
about the end boss's feed. `bossPool.size > 0` is the obvious test and is true of both fights; the
probe forces it.

## Why in the enemy's ink

0074's argument about the wall, reversed: the colour says whose number it is. The wall is the player's
limit and is drawn in the player's ink; this is the enemy's remaining health, and a bar in the
player's ink beside the player's shield pips would read as a second thing they own. It is a hollow
frame and a fill rather than two colours, on [0024](0024-the-accessibility-floor-is-settings.md)'s
*colour never carries meaning alone*.

## Why notches

A phase change is the most-watched event in a level — [0111](0111-a-boss-has-one-idea.md) had the
boss shed pieces at it because nothing on screen said so. The bar says where the turns are BEFORE
they happen, and it says it per boss: the notches are the row's own `upTo` values, so the fish's five
phases and the sentinel's three are different bars without a line of chrome knowing either
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)).

## Why it is a seam, on `onHealth`'s terms

The frame may not allocate and may not touch the DOM per step. So `World` remembers `shownBoss`, the
quantised fraction it last spoke, and fires `onBoss` only when that quantum moves — a few times a
second under maximum fire, once at the arrival, once at the death. The chrome's `setBoss` writes a
transform, which costs no layout, and cuts the notches once per row rather than per call. The ROW is
read by the shell, not passed by the frame, because the frame may not build the list.

**Rounded up**, so a boss on its last point of health shows a sliver and never an empty bar over a
body still firing. **Clamped**, because a fed fish ([0314](0314-the-shoal-comes-in-while-it-fights.md)) can
stand above what it arrived with.

## Where it sits on the screen, considered

Top centre, over the top six units of the lane — `PLAYER_MARGIN`, which the ship can never enter —
at the same height as the readout on the left. Bullets and enemies do cross under it, so the bar is
thin, semi-transparent, and takes no pointer events; nothing the player must see is *lost* behind it,
which is the one absolute the painter holds and the chrome inherits.

## Confirmed, not assumed

Probes in `scripts/probes/0360-boss-bar.mjs`, driven through the real frame with the real fights.

| broken on purpose | went red |
|---|---|
| the bar raised for the mid-boss too | `THE ASK: the bar comes up full when the end boss has arrived` |
| the bar left standing when the boss died | `THE ASK: the bar comes up full when the end boss has arrived` |
| rounded down, so a boss on one health shows an empty bar | `rounds UP` |
| the chrome written on every step of the fight | `is written on a change of the quantum and not per hit` |

## What this leaves owed

**The picture has been photographed and not played.** The width — 38% of the screen — and the notch
height are a first hand; whether the bar reads over a bright place's land, and whether the notches
read as *coming turns* or as decoration, is the fish's play (the plan's item 6).

**A name on the bar.** No boss has a player-facing name and `docs/game.md`'s voice rule says the
readout is terse; if a play asks *what am I fighting*, the name is a row field and one more span.
