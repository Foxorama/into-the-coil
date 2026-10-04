# 0489 — The heart has a chamber

**Accepted 2026-10-04.** Item 10 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 7.1. The *"background cog"* the player cites is the gyre's seat: a 68-unit housing behind a 52-unit hull
([0332](0332-the-gyre-is-set-into-the-wall.md)). The heart was already the jellyfish's seat
([0400](0400-the-heart-is-the-room.md)), but at 44 units it is smaller than the 46-unit bell. So the
mechanism was the same and the picture the opposite: the cog sits *in* a housing bigger than it, and the bell sat *on* a heart
smaller than it.

## The rule

**The heart is set in a chamber**: `Veins.chamber` on the Black Heart's own row, a ring of vein-flesh round
a dark bore, with folds running out from it and vessels over it. The bore's rim is lit by the heart inside. It is laid
by `paintArteries` **at the heart wherever the heart is**, after the vessels that run into it and before every
body. So the heart beats in its bore and the bell's rim lies over its mouth. Its outer edge is the flesh
darkening into the room, not a line.

**At the heart, and never fixed in the world.** The plan's 1.1 mechanism, a piece placed in the room
([0488](0488-the-roots-are-roots.md)), was the first thought. But the heart holds station with the camera once
the jellyfish dies and carries on into the finale ([0426](0426-the-finale-is-the-fight-going-on.md)), and a
piece fixed in the world would be left behind as the camera moved on. Laid where the vessels are laid, it goes
wherever the heart goes, the finale included, and nothing grows in any pool.

**Sixty-four units, not the plan's 110.** The plan wrote *"about 110 units — the gyre's housing-to-hull
ratio"*. That ratio (68 over 52) on the bell's 46 is sixty. At 110 the chamber would also have laid solid-looking
flesh across a third of the ship's box, which is the thing [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)
names.

**No walls.** The plan proposed walls of the same flesh, *"as every other walled room has"*. The player asked for
this fight, in so many words, to be *"a stationary screen, no walls"* (0400), and that ask stands. The chamber
is what narrows the picture.

## Consider the screen

The chamber sits under the bell's own footprint and a little past it, which the ship can't reach because the bell
stands there ([0476](0476-the-jellyfish-opens.md) put it at 190). It is scenery under every body, so nothing the player
must see is behind it.

## Guards

`tests/medusa.test.ts`, **THE ASK, IN PIXELS**: on the real frame at a 1280×720 screen, with the place's own sky,
the chamber is blitted at the heart's place to half a pixel, and before both the heart and the bell.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0489`:

| broken on purpose | went red |
|---|---|
| the chamber never laid | `THE ASK, IN PIXELS` |
| the chamber laid off the heart | `THE ASK, IN PIXELS` |

## Owed

- **A play of the Black Heart**: does the bell read as set in the heart, as the cog is in its wall? Is the chamber too
  dark, or too much? Its inks are in `drawHeartChamber`.
- **The tentacles** (the plan's 7.3) and **the glow** (7.4) are next.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art and content; nothing persisted.
