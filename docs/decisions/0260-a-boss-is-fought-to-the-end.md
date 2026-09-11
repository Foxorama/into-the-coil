# 0260 — A boss is fought to the end

> ⚠️ **AMENDED 2026-09-11 by [0307](0307-the-serpent-is-armoured.md).** The forty seconds and eight
> volleys hold; for a boss whose body is armour they are held in the flown fight, because
> `health × toughness / FASTEST` assumes every arrival counts. The serpent is 1000, not 1400.

**Accepted 2026-09-06**, the same day as [0259](0259-the-bullets-stay-on-the-screen.md), from
[`the-alpha-list`](../../reports/the-alpha-list-2026-09-06.md):

> *"level bosses need a lot more health, I think I only saw about 50% of their attacks before they
> died."*

> *"The labyrinth end boss → the walls were really good but started too late in the sequence they
> need to start sooner."*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: every real boss has twice the
health it was authored with. **Amends [0252](0252-the-gyre-spins.md)**: the gyre's curtain starts
at nine tenths of its health. **Extends [0124](0124-the-boss-is-a-boss.md)** with a floor in volleys.

## The rules

**Every real boss has twice the health 0247 gave it** — 1400, 1520, 1640, 1760, 1880, 2000, 2200
— and the mid-bosses keep theirs: the ask is about the level bosses, and a mid-boss over in seven
seconds is the miniboss 0247 made it. 0124's floors — twelve seconds a fight, three a phase, later
bosses longer — all hold with room.

**A real boss lasts forty seconds at max weapons on the tuned tier, and every phase gets eight
volleys away.** A phase's attack is thrown once a reload; a phase that ends after five of them is an
attack the player saw and did not learn, which is what *"50% of their attacks"* is. `0260 — a real
boss lasts forty seconds` in `tests/level.test.ts`, in volleys as well as seconds because a reload
is the unit an attack is counted in, at the fastest the game can kill. Both numbers are budgets the
report owns: *fifty per cent* is the report, so the fight is twice what it was — forty where the
shortest was twenty-one, eight where the shortest was five — and each sits just under what the
doubling measures, so a hand tuning down from here reddens them before it halves them.

**The gyre throws its first wall inside six seconds at max weapons.** `uncoil.from` is 0.9, from
0.5: the first wall is the first notch of the fight rather than its second half — a tenth of the
fight in, where it was half — and there are nine over a fight twice as long. `0260 — the gyre
throws its first wall` in `tests/level.test.ts`; 0252's guards over the four stances and the hole
are untouched.

## The figures

At max weapons on `savior` — 52 damage a second against health times 1.6 — the fight in seconds
and the shortest phase's volleys, measured by the guard's own arithmetic:

| boss | health | fight before → after | shortest phase, volleys before → after |
|---|---|---|---|
| jormungandr | 1400 | 21.5 → 43.1 s | 6.7 → 13.3 |
| hellkite | 1520 | 23.4 → 46.8 s | 5.0 → 9.9 |
| quetzal | 1640 | 25.2 → 50.5 s | 6.1 → 12.3 |
| gyre | 1760 | 27.1 → 54.2 s | 8.1 → 16.2; first wall 13.5 → 5.4 s |
| hoarfrost | 1880 | 28.9 → 57.8 s | 7.9 → 15.8 |
| hydra | 2000 | 30.8 → 61.5 s | 6.8 → 13.7 |
| medusa | 2200 | 33.8 → 67.7 s | 6.8 → 13.5 |

On `legendary` every figure is five eighths of this; on `burn`, eleven eighths.

## ⚠️ What was rejected

**A different multiplier per boss.** The report is one sentence about all seven, and *twice* is
what *"50%"* says; a hand tunes from here.

**Raising the mid-bosses too.** They are half the old end bosses by decision, and the report names
the level bosses.

## What is owed

- **A play.** Over a minute at the cap on the tuned tier for the jellyfish is a long fight;
  whether it is the right length is a hand's, and every number above is a model quantity.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Eight numbers on seven rows;
nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0260`:

| broken on purpose | went red |
|---|---|
| the serpent authored back at half its health, so the fight is over in twenty-one seconds | `0260 — a real boss lasts forty seconds at max weapons` |
| the gyre's first wall put back to half health, which is the second half of the fight | `0260 — the gyre throws its first wall inside six seconds` |
