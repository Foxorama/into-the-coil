# 0494 — The gyre throws its own

**Accepted 2026-10-04.** Item 11 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 4.1: *"a clockwork lord throws the same gold slab every raider in its level throws."* The gyre's curtains and its
fan threw `flak`, repainted in the Labyrinth's raider gold by [0296](0296-a-bullet-belongs-to-its-place.md).

## The rule

**The gyre's row throws `tooth`**, a shot no raider throws. Every number is the slab's (radius 0.9, speed 1, damage 1),
so the curtain's slots, spacing, hole and reach are untouched and its guards in `tests/gyre.test.ts` re-run unchanged.
Only the picture moves.

**The tooth is a Maltese wheel**, the escapement a clockwork lord turns on: a disc with four square slots cut in on the
diagonals, filled in the lord's pink (`lord.lit`), with its teal for the hub and its red eye for a core. It is drawn
from `lordOf`, so the place's raider colour never paints it. On the high-contrast palette, which has no skins, it takes
the enemy ink, as every hostile bullet there does.

## What the plan asked for and this does not do

- **A wedge.** The plan drew a cog tooth, a square-shouldered wedge. A wedge points, and a blit cannot turn (0300's
  lesson, and 0473's *drawn with no heading*). The gyre's walls come at the ship from every side, including from astern,
  and its fan spreads 1.4 radians. A wedge would point the wrong way for most of them. The wheel is the same from every
  side, and the guard holds that.
- **The teal.** The plan asked for the lord's teal with a pink-lit rim. Photographed in the fight, a teal wheel was a
  dim rivet beside the gold slab it replaced: at bullet size the fill is what the eye finds, and a dark outline round
  a thin pink rim left nothing bright. So the fill is the pink and the teal is the hub. The bench photographs of all
  three are on the PR.
- **The wheel's flame in the gyre's hot inks.** Refused, on [0295](0295-a-ranking-guard-is-a-content-limiter.md)'s
  own example: *"a hostile bullet takes its place's colour and a flame is the same red everywhere, and both are correct
  in the same change."* A flame that changed colour by who threw it would teach the player something untrue about fire.

## Consider the screen

The tooth shares the Labyrinth with the raiders' gold cog and slab and with the player's orange pulse. It differs from
the cog by shape (slots cut in where the cog's teeth stand out) and from the pulse by colour and size. Pink is near
the caddie's lavender rings, but those are large concentric rings and this is a small slotted disc, and the caddie's
are the player's own and fly away from it.

## Guards

`tests/gyre.test.ts`, *0494 — the gyre throws its own*:

- **THE LORD'S OWN SHOT**: driven, the gyre's fire is all `tooth`; no enemy row throws it. Its bake is sealed in the
  Labyrinth lord's light in the vivid palette, and in the enemy ink in the high-contrast one.
- **NO HEADING**: every corner of the tooth's outline, turned a quarter about the tile's centre, lands on the outline
  within half a pixel at four times the shipped size.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0494`:

| broken on purpose | went red |
|---|---|
| the gyre throwing the raiders' slab again | `THE LORD'S OWN SHOT` |
| the tooth painted in the place's raider skin rather than its lord's | `THE LORD'S OWN SHOT` |
| one of the tooth's four slots turned off its diagonal | `NO HEADING` |

## Owed

- **A play of the Labyrinth's fight**: do the walls read as the gyre's, and does a curtain of pink wheels read as a
  wall with a hole in it as well as the gold slabs did?
- **4.2, the hole per stance**, is still not built without the player's word.

## Rollback

⚠️ **None owed**: [0001](0001-revertability-not-risk-rating.md). Content and art; nothing persisted.
