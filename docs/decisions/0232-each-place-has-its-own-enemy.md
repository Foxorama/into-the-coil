# 0232 — Each place has its own enemy

**Accepted 2026-09-05.** The last item from the 2026-09-04 play-test, and the largest.

> *"The level sprites for enemies looks good, but the sprites need to be more unique per level and
> each level needs its own brand of unique enemy to flavour that world."*

## The rules

**Every place names one signature enemy kind, and its level is the only level that sends it.**
`SIGNATURE_OF: Record<ThemeKind, EnemyKind>` in `src/content/enemies.ts`; `tests/signature.test.ts`
holds the pairing both ways — a signature a second level sends is nobody's, and a place whose own
level never sends its signature has none. Each level sends its own at least four times.

**Seven new kinds, each a new silhouette against the eight that exist**, on
`reports/enemy-silhouettes-2026-08-05.md`'s terms — a primitive and an axis that survive twenty
pixels — and each painted in its place's skin by the same hand as everything else the place sends
([0228](0228-an-enemy-wears-its-place.md)):

| place | kind | silhouette | what it does |
|---|---|---|---|
| The Approach | picket | a Y, one blade down the lane | holds its line; a two-shot spread of spits, the slowest gun in the run |
| Ember Nebula | moth | two wide wings on a body | a deep slow weave; a fan of three darts |
| Saurian Belt | raptor | a crescent, horns down the lane | hunts harder than a lancer and never fires — it bites |
| The Labyrinth | sentry | a block with a slot in its face | holds station; two slabs abreast |
| Rime Shelf | shard | a long hexagon pointed both ways | circles close; three squares in a turning spiral |
| The Toxic Mire | spore | a lumpy sac | drifts in slow, loops once, takes three hits, never fires — a mine |
| The Black Heart | gaze | a lens with a pupil | hunts slowly; the only aimed slab in the game |

**Every firing signature sends a bullet-and-pattern no other kind sends.** Five of the twelve
combinations were taken ([0110](0110-an-attack-is-a-pattern.md)); the picket, the moth, the sentry,
the shard and the gaze take five more, and `tests/legibility.test.ts`'s rule holds over thirteen
shooters as it held over five.

**The waves were re-authored by rule rather than by hand.** In each level, every fourth wave of the
signature's own class — firing or not — became the signature, sorted by arrival, skipping the waves
[0113](0113-the-level-has-a-tune.md) notes and, in The Approach, the run-up
[0086](0086-the-teeth-wait-for-the-gun.md) protects. Every wave keeps its shape and its arrival;
[0231](0231-a-level-is-a-mix.md)'s mix guard holds over the result because a signature replaces a
wave of its own class.

## ⚠️ Why a signature is a new kind and the skins were not enough

[0228](0228-an-enemy-wears-its-place.md) gave every place a livery over the eight shared
silhouettes, and the report on it is exactly what a livery can do and no more: *"looks good, but the
sprites need to be more unique per level."* Uniqueness at twenty pixels is a silhouette, and a
silhouette is a kind. A kind carries a behaviour, so each of the seven is also a thing the place asks
of the player that no other place asks: The Approach's spread before Ember Nebula's fan, a body that
bites, a wall of slabs, a mine.

## What is owed

- **An eye on every one of the seven, in its place, in motion.** Every silhouette was judged on
  `scripts/shot-sheet.mjs` against its own backdrop; whether a raptor reads as a raptor at speed is
  the next play-test's.
- **Per-place variants of the SHARED silhouettes are not in this decision.** The report's first
  half — *the sprites need to be more unique per level* — is answered here by a new body per place,
  not by reshaping the eight the places share. Spines, shards and bulbs on a drifter per place is
  the next art decision if the seven are not enough.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content and art; nothing
persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0232`:

| broken on purpose | went red |
|---|---|
| two places given one signature | `THE REPORTED ONE: every place names a signature kind, and no two places name the same one` |
| a signature sent by a second level | `and a signature is sent by its own place’s level and by no other` |
| a signature given another kind's hull | `and every signature is a new silhouette against every other enemy hull` |
| a signature given another shooter's bullet and pattern | `and a firing signature sends a bullet-and-pattern no other kind sends` |
