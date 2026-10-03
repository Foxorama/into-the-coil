# 0481 — The cold grows, rather than zooming

**Accepted 2026-10-04.** Item 6 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md)
(its 9 with 5.1), from the play of that day:

> *"the aura needs to be a bit more translucent, it overpowers the screen at the moment."*
>
> *"it gets bigger, but just on scale size which is why it looks so weird, it's scaled up for the pulse
> so the snowflakes and stuff in it get huge, rather than it increase in size organically with
> additionally layers. -> it also needs to expand further in size, it's still basically a non-event"*

## What it was

The frost ship's cold ([0399](0399-the-frost-is-crystal.md), [0459](0459-the-bosses-are-placed.md),
[0471](0471-the-cold-breathes.md)) was four bitmap layers — a haze and three rings of flakes — each swelled
to the cold's radius every step. From rest at 46 to the top at 108, every snowflake was drawn 2.3 times
as big: a photograph enlarged rather than a cloud growing. And every alpha was baked at up to 0.45, laid
four layers deep.

## The rule

**The cold is two kinds of thing, and only one scales.**

- **The haze** stays a swelled layer (`field`): a soft gradient enlarging is what a mist spreading looks
  like, and its edge is still where the slow begins.
- **The flakes are patches** (`Chill.rings`, `chillPatch`, 30 units): drawn at the size they are baked,
  whatever the radius, ten riding a ring at 0.9 of it and six at 0.45, the inner turning quicker so the
  cold is still a vortex. As the cold swells they move apart and the field thins toward its edge; as it
  draws back they close up. The three ring sprites are gone.
- **Every alpha is halved**: the cap 0.45 → 0.25, the veil 0.16 → 0.08, a flake's light 0.3 → 0.15, the
  rime on the rim with them.

Seventeen slots in the boss's aura pool where there were four, of its twenty-seven; nothing grows.

## Not done: the reach

**The plan proposed 108 → 150, and it collides with a guard the player's own ask set.** 0459 holds that
at its top the cold still leaves where a ship starts clear, and a strip behind it to fly in
(`tests/frost.test.ts`). The frost ship stands at 157 with a drift of 5: at 150 the cold's near edge is at
along 2 — the whole screen, a respawn inside it. At 108 it is at 44, against a ship that starts at 40:
**the reach is already at that limit.** *"Expand further"* and *"leave a strip"* cannot both be had without
moving something else, so it is the player's:

| option | what it costs |
|---|---|
| the frost ship further back | its fight moves (0459 placed it); the most the level guard allows is about 187, which lets the reach reach about 138 |
| the strip goes | a life can begin frozen, which 0459 refused |
| leave it | the field reads larger now its flakes ride its edge; play it first |

## Guards

`tests/frost.test.ts`:

- **THE REPORTED ONE, IN PIXELS**: every patch is drawn the same size, in CSS pixels at 1280×720, at the
  cold's rest and at the top of its pulse, and the patches are further out at the top — a scale-only field
  reddens it at once.
- **HEAVILY TRANSPARENT**, moved: no mark in the cold at three tenths or more, from half — the plan's
  number; the flakes counted as a patch's lights times the patches the rings carry.
- **TWIRLING**, moved: measured on where each ring's first patch stands round the hull, not on a layer's
  turn.

Re-anchored: four of 0399's probes — the opacity cap, the outer ring thinned (to one patch), the inner ring
at the outer's rate, and the field unturned (the rings standing still).

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0481`:

| broken on purpose | went red |
|---|---|
| a patch swelled with the cold's radius | `THE REPORTED ONE, IN PIXELS` |
| the patches held at the cold's rest while it swells | `THE REPORTED ONE, IN PIXELS` |
| the cold's marks at the weight that overpowered the screen | `THE ASKED-FOR ONE, HEAVILY TRANSPARENT` |

## The pictures

Before and after, at rest and near the top of a pulse, on the bench at 1280×720:
<https://claude.ai/artifact/NVSxXVBWiKQst23uPZXEZC> (a private review page).

## Owed

- **A play of the cold**, for whether it still reads as a field and whether the halved alpha is too faint
  at the top of the pulse.
- **The player's word on the reach**, from the table above.
- **The frost's cloud** (the plan's 10) is the next change; the escorts (5.2) wait for a play of 0471.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art and a placement in the frame;
nothing persisted.
