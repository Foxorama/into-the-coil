# 0656 — The void rolls

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 5, with the
player's answer that the *grav ball* is the void. Amends [0377](0377-the-void.md): the rift stood where it opened.

## The ask

> *"Grav ball special needs to roll forward, not stay in one spot; roll forward off screen then disappear."*

## The rule

**The rift rolls up the lane at its row's `roll` — one world unit a step in the camera's frame — and is gone the step
its whole disc is past the top of the screen.**

- **In the camera's frame** ([0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)): `velAlong` is the
  scroll plus `roll`, so on the screen it climbs at `roll` whatever the scroll is doing.
- **Gone at the top of the screen, on the player's shot cull** (`cullPlayerShotAlong`, *"you can shoot what you can
  see"*, 0048). Left to the content's leading cull, which is placed for the widest view any device can have, a rift
  would roll on past the top and negate the next wave before the player had seen it.
- **`steps` is a cap behind that**, raised from 150 to 360 so that it never ends a rift on the screen. At the default
  view a rift is open for 128 steps, about 2.1 seconds, against the 2.5 it stood for (measured: thrown from the ship's
  station in an empty level, the fuse runs 53 steps and the rift 128 more).
- **The boss's share lands the first step it reaches the boss**, once, where it was only ever where the rift opened.
  A rift that rolls into a boss and passes through it for nothing would read as a miss. `riftOnBoss` holds the once
  on the rift's own `health`.
- **It carves stone only where it opens**, as 0377 has it. Carving every step would cut a tunnel through the Labyrinth
  ahead of the ship, which is a different weapon; whether it should is a question for the play.

## What guards it

`tests/void.test.ts`:

- **Rolls and leaves**: every step it climbs the screen at `roll`, it is never open wholly past the top, it closes
  within two steps of the arithmetic, and never on its cap.
- **Rolls into a boss**: thrown from far enough back that it opens clear of the boss, it lands the boss's share once.
- The **salvo** and the candle's **pools** guard (`tests/candle.test.ts`) measure how long a rift is open rather than
  reading the cap, on the widest view a screen can have, where it rolls furthest and a salvo holds the most of them.
  At the default view the candle's case no longer asked more of the blast pool than the nine slots before 0537, which
  would have left that guard proving nothing; the widest view is the case the pool has to fit.
- **Goes off at the edge**: a rift is judged where it opened, since it rolls on from there.

The probes in `scripts/probes/0656-the-void-rolls.mjs` stand it still, leave it open past the top, and take the share
off the roll. 0377's probe of a short life now ends it on the screen, and two of its anchors moved.

## Not held by any guard

- **One unit a step.** How the roll reads, and whether it should speed up or slow down as it goes, is the play's.
- **The hush** ([0378](0378-the-specials-are-heard.md)) lasts while a rift is open, so it is now as long as the rift
  takes to roll off — shorter at the default view, longer on a wide one.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
