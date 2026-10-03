# 0480 — Damage sheds

**Accepted 2026-10-04.** Item 5 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md)
(*the cross-boss item*, channel 1), from the play of the same day:

> *"there's aura and lightning phases, but no damage shows on the boss"* — the serpent
>
> *"no damage shows on the boss"* — the fish
>
> *"no damage shows on boss"* — the pterodactyl

## What it was

The flash says a hit landed ([0035](0035-damage-is-legible-on-the-body-that-took-it.md),
[0278](0278-the-flash-is-a-wash.md), [0334](0334-a-hit-is-an-event-again.md)); the bar says how much is
left ([0360](0360-the-boss-has-a-health-bar.md)). Nothing between them said *this animal is hurt*. Five of
the seven real bosses authored no damage of any kind on the body.

## The rule

**A hit sheds what the animal is made of.** `BossRow.shed` names one fragment sprite, or `null`; every
row says its own ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)): shared code
holds the throw, and the default is nothing.

| lord | sheds |
|---|---|
| the serpent | a scale, the cut in it dark (`shedScale`) |
| the fish | an ember-lit scale (`shedEmber`) |
| the pterodactyl | a feather (`shedFeather`) |
| the gyre | a tooth off the cog (`shedTooth`) — its wreck too, since [0475](0475-the-wreck-can-be-killed.md) |
| the frost ship | a splinter of ice (`shedIce`) |
| the hydra | a gobbet of hide with a fleck of acid (`shedFlesh`) |
| the jellyfish | a shard of the bell (`shedGlass`) |

Each is baked in its lord's own skin (`LORD_HULLS` names the row's `shed`), so it is the colour of the
thing it came off in every place. The mid-bosses shed nothing until someone draws what they would.

**When**: on the step a hit **arms the flash**, read off the flash's own gap — `flash` sets `flashGap` to
exactly `SHED_GAP` when it lights a body, and only counts down from there, so the event is already
written on the body that took it. No new field on the pairing and no edit to `src/sim/collide.ts` beyond
exporting `FLASH_GAP_DUTY`. The hull and every body node are read, so a serpent's flank and a jellyfish's
tentacle shed as its head does.

**How often**: one fragment per `SHED_GAP` steps a boss — the flash's own cycle (`IMPACT_FLASH_STEPS ×
(1 + FLASH_GAP_DUTY)`, twelve steps): **five a second at most, under any gun**. The rest is
`bossShedIn` on the world, because an animal lit in many places at once would otherwise shed from each:
with it taken away, the serpent under a fan sheds 25 a second.

**Where**: from the rim that faces the ship, where the ship's fire lands — a survived pulse logs no impact
point (0127's note on the `hit` cue), and the face turned to the ship is the answer for every gun that
fires forward. It leaves outward at a third to a half a unit a step, lies at a turn of its own, lasts
36–54 steps, and is drawn in the debris layer, under the bodies, as every fragment is. Its rolls are its
own stream, `shedRng` ([0021](0021-one-stream-per-concern.md)).

**Consider the screen**: five fragments a second, each 3–5 units — a fraction of what they came off and
under a bullet's place — falling away from the hull. Below the frost's flakes and the jellies' rain in
every fight, and in the debris pool, which drops what will not fit.

## The pictures

**The bench photographs, before and after, every boss, and each fragment off the sheet at ×8, are on a
private review page**: <https://claude.ai/artifact/19sQHCPa196gdknt4Cfk17>. Two first drafts were redrawn
after being photographed: **the hydra's gobbet read as a smiley face** — two flecks above a dark arc —
and both scales had rounded into ovals through `curveLoop`; they are polygons now.

## Guards

`tests/shed.test.ts`, driven, in fragments a second, a shot parked on every body of the animal each step:

- **every real boss sheds its own fragment, from the animal, and never more than five a second**;
- **no two lords shed the same fragment.**

`tests/accents.test.ts` held every mark on the fragments to its floor of 2.5 px at 1280×720, which three
first-draft marks failed — a feather's stroked shaft, a tooth's broken edge, a fleck of acid.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0480`:

| broken on purpose | went red |
|---|---|
| no fragment thrown when a hit lands | `jormungandr: a hit sheds its own fragment` |
| a shed with no rest between fragments | `… and never more than five a second` (25.2 a second) |
| the jellyfish shedding the frost ship's ice | `and every lord sheds its own` |

The second came back STILL GREEN on the first draft of the guard, which parked one shot on the hull and so
was held to the hull's own flash gap whatever the shed did; it parks one on every body now.

## What it costs

Seven sprites, baked per place change. In the frame: a read of each body's gap, and at most one fragment
a boss every twelve steps, out of the particle share.

## Owed

- **A play of every fight**, for whether a fragment reads as *hurt* and whether five a second is too
  many or too few. The plan's channel 2 — a wear ladder per boss — follows one boss a PR, each after a
  play of this has said whether it is enough.
- **The art is first drafts from description**, on [the vocabulary report](../../reports/the-vocabulary-is-the-ceiling-2026-09-08.md)'s
  terms; a sketch from the player of any of them replaces it.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art baked at load and a cosmetic sim
pass; nothing persisted.
