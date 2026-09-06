# 0262 — The eagle throws quills

**Accepted 2026-09-06**, the same day as [0261](0261-the-serpent-throws-together.md), from
[`the-alpha-list`](../../reports/the-alpha-list-2026-09-06.md):

> *"Eagle → the bullets need to be feathered quills. The bullet attacks were boring. The adds
> marched in gently from the left side in a single file, they didn't swoop or dive bomb or do
> anything interesting. Is there supposed to be a fire whip attack or something? I didn't get to
> see it."*

**Amends [0249](0249-the-eagle-summons.md)**: the eagle's bullet, its fan, and where its horde
comes from. **Amends [0098](0098-a-wave-plays-a-figure.md)'s ladder**: a ninth hostile bullet, and
the four above it move up a rung. The whip is untouched, and 0260's doubling is what shows it.

## The rules

**The eagle's bullet is the quill.** `quill` joins `SHOTS` and the sprite table: a feather drawn
shaft first, the vane behind it barbed either side and cut square at the tail, in the enemy's ink
with the shaft darker down the middle — told from the lance's dash by the vane, from the acid's
drop by the tail, from the missile's dart by the barbs. On the hostile ladder it sits between the
flak's slab and the void's ring: bigger than the one and slower, smaller than the other and
quicker, which is 0098's rule for what a new bullet costs.

**The ladder moved up a rung to make room.** Every hostile bullet is drawn more than five pixels
from every other on a 1280×720 screen, and the ladder was packed at that spacing from the flame to
the rock. The ring, the drop, the shard and the rock are each 0.8 of a unit bigger than they were —
5, 5.8, 6.6, 7.4 — and the void's hurtbox is 1.3 so it stays inside the band
`tests/combat.test.ts` holds. Every ordering 0248, 0251 and 0253 argued is kept: the drop bigger
than the ring, the shard between the drop and the rock, the rock the biggest and slowest.

**The fan rakes.** The row's attack is `rake`, a fan of three quills whose centre turns half a
radian a volley, where it was one dart at the ship — *"boring"* was one line, and a fan that
sweeps is a pattern to be somewhere else for. `stalk/rake` is the eagle's own pair.

**The horde comes from the sides, and dives.** A `summon` says where from: `from: 'sides'` puts
the call in from an across edge as a flanking wave enters — a stream along the edge, steering for
each member's lane — and the frame alternates the edge a volley on the boss's own `spin`, a field
nothing else reads on a boss. Three kites a call, two raptors; the kite hunts at 0.9, the hardest
agility in the game, where it wove — from the side, that is a dive at the ship's lane. The eagle
calls it and no level sends it, so 0258's one pilot a level does not read it. `THE SUMMONS` in
`tests/eagle.test.ts` holds every add of a call outside the lane on one side, steering in, and the
next call on the other; `THE KITE` holds the dive.

**The whip is the whip.** Two phases of it, at three quarters and a third; 0249 built it and 0260
doubled the fight, so each is eight or nine lashes long at max weapons where it was four. Nothing
here changes it.

## ⚠️ What was rejected

**The quill at the lance's size.** Two bullets drawn the same size five pixels apart is the report
0098 answered, and `tests/legibility.test.ts` refuses it.

**Every head at once.** The quills rake, the whip lashes, the horde dives; three attacks on one
volley is a screen that cannot be read, on 0254's argument.

## What is owed

- **An eye on the quill at the shipped camera** — thirty pixels is a feather or a smudge, and the
  sheet is where that is looked at — and on four blasts a rung bigger in the fights they belong to.
- **A play.** Whether a kite from the side reads as a dive, and whether three a call is a horde.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A shot, a sprite, four extents,
a field on an attack and a branch in the frame; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0262`:

| broken on purpose | went red |
|---|---|
| the eagle throwing the lance again | `0262 — THE QUILL: the eagle's bullet is a feather` |
| the opening fan back to one dart, so there is nothing to rake | `0262 — THE QUILL: the eagle's bullet is a feather` |
| the kites called at the leading edge again, in a file down the lane | `THE SUMMONS: a volley at half health` |
| every call from the same side, so the horde is a file after all | `THE SUMMONS: a volley at half health` |
| the kite on its weave again, so it drifts in rather than dives | `THE KITE: Ember Nebula's horde` |
