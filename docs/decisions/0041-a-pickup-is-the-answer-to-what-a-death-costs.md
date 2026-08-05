# 0041 — A pickup is the answer to what a death costs

**Accepted 2026-08-05.** Pays a bill [0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)
ran up and [0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md) shipped without.

## The rule

| | |
|---|---|
| **a pickup** | a row in `PICKUPS`, placed by the level at a **place**, taken on contact |
| **its effect** | `life` — one more life, on the RUN · `upgrade` — one more entry on the ship |
| **an upgrade** | stacks, and is **lost on a death** |
| **a life** | is spent the moment it is taken, and survives everything |
| **auto-fire** | resolved from the whole upgrade list by `weaponFor`, never accumulated |

Two upgrades exist: `rapid` (fires faster) and `spread` (another barrel, fanned).

## Why a level needs them, stated as a bill rather than as a feature

0039 empties the arsenal on a death. 0040 then authored a three-minute level with nothing in it to
rearm from — so the twenty seconds after a death were the hardest in the game and there was no way
out of them. That is not a missing feature, it is **an unpaid consequence of a rule that had already
shipped**, and 0039 named it at the time: *"a death that empties the arsenal makes the level's pickup
density load-bearing."*

So the guard is written in the terms the bill was written in: **a level may never leave the player
more than twenty seconds without something to rearm from**, measured in seconds, from the start, all
the way to the boss. It found a 28-second stretch in level one on its first run.

## Why `effect` is a union where the weave was two numbers

[0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md) refused a `motion` union because a
straight line is a weave of amplitude zero — two members that are one member with a parameter. This
union earns its place on exactly that test and passes it: a life is a number on the **run** and an
upgrade is an entry on a list on the **ship**, they are cleared by different events, and no value of
one produces the other.

## Why the weapon is resolved from a list and never accumulated

`weaponFor(ship, upgrades)` walks the whole list every time the list changes. The obvious
alternative — a running `fireEvery` on the run that each pickup decrements — is a number **nobody can
undo**, and a death has to undo it.

Two things fall out of that and neither is an accident:

- **A death needs no second description of the base weapon.** *"Back to the ship's base weapon"* is
  an empty list, and an empty list resolves to exactly `ships.ts`'s row.
- **A save holds "two rapids and a spread"**, which is a fact about a run rather than a cached
  consequence of one. [0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) already decided
  the save stores the current arsenal; this is the same shape for the other half.

⚠️ **Resolved on a change of the list, by identity, and not per step.** The reducer preserves identity
when a slice does not move, so `next.run.upgrades !== state.run.upgrades` is the whole test — and
`src/app/frame.ts` may not allocate, so it could not resolve a weapon there anyway.

## Both ends of "every upgrade is worth taking"

`docs/game.md` says an upgrade that cannot change the outcome is worse than none. The other end of
that sentence is that the fifth one must not end the game.

- Rapid fire is **multiplicative and floored**. A constant subtraction reaches zero and then goes
  negative; a fraction approaches a floor and never crosses it.
- The floor is **legibility, not balance**. `src/app/frame.ts` records that successive shots connect
  6 to 7 steps apart and that the impact flash must finish inside that gap, or two hits produce one
  picture and the player cannot count them —
  [0035](0035-damage-is-legible-on-the-body-that-took-it.md). A weapon that outruns the flash makes
  damage unreadable, which was reported as a collision bug once already.

## Collection is not damage, and reusing the damage path would have broken an assist

A pickup goes through `collectInto` rather than `collideIntoOne` with zero damage. Three of that
function's rules are exactly wrong here: it skips an **invulnerable** target, it takes only the
**worst** of what is touching, and it exists to reduce **health**.

⚠️ **The invulnerable case is the one that matters.** The moments after a hit are when a player is
most likely to be flying through things, and a pickup that silently passed through a recovering ship
would read as collection being broken.

⚠️ **And collection runs at the FULL hurtbox, never the assisted one.**
[0024](0024-the-accessibility-floor-is-settings.md) says no assist may ever make the game harder. The
`hurtbox` assist shrinks the ship's circle — running collection through it would mean the same
setting that removes hits also removes pickups, which is that rule broken by the obvious code.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md).
`npm run prove 0041`:

| broken on purpose | went red |
|---|---|
| a level stretch left with nothing to rearm from, which is what shipped in 0040 | `never leaves the player unarmed for long` |
| rapid fire made a constant subtraction, so enough of them reach zero | `never fires faster than a hit can be read` |
| the upgrade list turned into a set, so a second of a kind is swallowed | `stacks — the second of a kind is not swallowed by the first` |
| a death that leaves the weapon upgrades on the ship | `a death clears the arsenal back to base` |
| collection run through the assisted hurtbox, so an assist costs the player pickups | `is collectable while the ship is invulnerable` |
| two pickups sharing a silhouette, told apart by ink alone | `every kind has its own silhouette` |
