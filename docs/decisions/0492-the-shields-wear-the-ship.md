# 0492 — The shields wear the ship

**Accepted 2026-10-04.** Item 11 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 12: *"The deflector shell is four places × three shimmer frames of one plate, drawn by `drawShieldPlate` in the
`player` ink for every ship."* The readout has worn the ship since [0451](0451-the-readout-wears-the-ship.md); the
shell round the hull had not.

## The rule

**A ship's shell is on its row**: `ShipRow.shield` is a look and the twelve sprites it wears, three shimmer frames at
each of the four places [0430](0430-the-readout-counts-ships-and-shields.md) set. The frame reads the plate from
`w.shipRow` and the bake draws the look the row names. `ShieldLook` is a closed union with a `never` arm, per
[0016](0016-a-hub-enumerates-kinds.md).

| ship | look | ink |
|---|---|---|
| fighter | **honeycomb**: 0430's energy cells, unchanged | the player's |
| caddie | **bubble**: two thin skins of soap film, banded lavender, cyan and acid, with a glint sliding along | `ally`, the ray dish's lavender |
| Firebird | **plumes**: nine feathers laid along the arc, black lacquer read by gold edges and a gold quill, as the car is ([0468](0468-the-firebird-is-black-and-gold.md)) | `hazard`, the car's gold |
| estate | **lattice**: a gilt trellis between two gilt rails, a stud at each crossing | `hazard`, the gilt |

**What a shield does is not on the row.** `SHIELD_ORBIT`, the four places (`SHIELD_ANGLES`, which replaces
`SHIELD_PLACES`), `SHIELD_LAYOUT` and the shimmer are every ship's, so a shield covers the same ground whoever wears
it. The shared frame each look draws in is `plateAt` in the bake: the ship's centre, the orbit and the strip's
thickness. Each look also fades toward its ends on the honeycomb's curve, so four plates close into one shell.

**Every look is open**, on [0379](0379-the-specials-are-seen.md)'s rule for anything worn round the ship: hairlines, bars and
tints, never a solid band. The Firebird's lacquer is a third-alpha tint, so it darkens what is behind it and hides
nothing.

**The pickup keeps one face**, as the plan said: it is offered before anyone knows which ship will fly into it.

## Consider the screen

A shell shares the ship's own space with every bullet aimed at it, which is why each look is open. The cars' gold is
the colour of the Labyrinth's raider flak (0296). The shell is an arc that never moves relative to the hull, and a
bullet is a small slab that does, so the two are told apart by shape and motion and not by colour alone (0024). Whether
that holds in the curtain is a play question, and it is owed below.

## Guards

`tests/shields.test.ts`:

- **THE OWN SHELL**: every ship's twelve sprites are its own and no other ship's. Flown with three shields, each ship
  wears only its own plates.
- **THE OWN SHELL, DRAWN**: every mark of every look, at every place, lies within one world unit of `SHIELD_ORBIT`
  from the ship's centre in the baked tile. A look drawn about the tile's centre would fail this. No two ships' fore
  plates trace the same picture.
- 0430's four guards now ask the ship's own plates.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0492`:

| broken on purpose | went red |
|---|---|
| the saucer's fore plate drawn from the fighter's sprites | `THE OWN SHELL` |
| the saucer's bubble drawn round the plate's own centre rather than the ship's | `THE OWN SHELL, DRAWN` |
| the estate's lattice drawn as the Firebird's plumes | `THE OWN SHELL, DRAWN` |

0050's *every plate drawn as the fore plate* probe is re-anchored on the frame's new line and is red as before. All ten
of 0050's probes are red.

## Owed

- **A play with each ship on Legendary**, which opens a life on three shields. Does each shell read as that ship's,
  and does the cars' gold stay apart from the Labyrinth's flak? The bubble was thickened once off the bench photograph.
  Its skins are the one number most likely to move.

## Rollback

⚠️ **None owed**: [0001](0001-revertability-not-risk-rating.md). Art and content; nothing persisted.
