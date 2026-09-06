# 0261 — The serpent throws together

**Accepted 2026-09-06**, the same day as [0260](0260-a-boss-is-fought-to-the-end.md), from
[`the-alpha-list`](../../reports/the-alpha-list-2026-09-06.md):

> *"Jormungandr serpent → the lightning attack is superb, don't change it. But the serpent should
> be firing the acid blasts and void blasts together with the lightning, not have it as three
> separate fire fields. Acid blasts need to be a spray fire attack not the wall pattern attack."*

**Amends [0248](0248-the-serpent-strikes.md)**: the phases are cumulative and the acid is a fan.
**Extends [0254](0254-the-hydra-grows-heads.md)**: the heads are a mechanism two bosses use.

## The rules

**The acid is a fan that rakes.** The serpent's row attack is `rake` — a fan of three acid blasts
whose centre turns a little each volley, sweeping across the lane — where it was a wall with a
hole. A spray that sweeps is what *"a spray fire attack"* is against a body that size, and
`bob/rake` is the serpent's own pair among the real bosses (`bob/spray` is the hydra's, and 0258's
guard holds the pairs unique over the real seven).

**Once hurt, the weapons are cumulative and take turns.** At two thirds the phase's attack is
`heads` — 0254's mechanism — with two heads, acid spray and void spray; at the last third, three,
the lightning the third. One head a volley, round and round, which is the one way the game has to
throw three weapons *together* that is not one burst wearing three inks; the hydra's decision
argued that once and it holds here. `THE THREE WEAPONS` in `tests/serpent.test.ts` reads the
table and drives the last third for three volleys — acid, void, lightning.

**The lightning is untouched.** The same `rain`, the same warning, the same half-width, in the
same pool; every guard 0248 wrote over it still runs, with the round turned to the lightning's
head first. The last third's cadence is 36 where it was 54, so with three heads in turn the
lightning still falls about every two seconds, which is what it did alone.

**A round of heads is its count.** 0258's *every real boss has an attack of its own* marks a
`heads` phase as `heads×N` and each head's own attack besides, so the serpent's three weapons in
turn are told from the hydra's five heads, and the hydra's laser head still counts as its own.

## The figures

| phase | at | throws | cadence |
|---|---|---|---|
| whole | 100% | a raking fan of three acid | every 84 |
| hurt | 66% | acid fan, void fan, in turn | every 60 |
| the last third | 33% | acid fan, void fan, three columns of lightning, in turn | every 36 |

At max weapons on the tuned tier (0260) the last third is fourteen seconds: nine lightning
strikes, nine fans of each blast.

## ⚠️ The first boss to rake AND grow heads, which crashed the game

This decision made the serpent the first boss with a `rake` in one phase and `heads` in another, and
those two attacks were reading one field. `firePhase` is an **angle** for a rake — advanced by
`turn`, 0.45 of a radian a volley — and a **count** for the heads, which index by it. So the opening
phase raked the count up to about 5.4, the fight dropped under two thirds, and `heads[5.4 % 2]` is
`heads[1.4]` is `undefined`: **a TypeError out of `throwAttack`, in every serpent fight, at its first
phase change.**

⚠️ **[0254](0254-the-hydra-grows-heads.md) argued it was safe and was right about the wrong thing** —
*"the type refuses a head that is itself heads or a rake, so the recursion is one deep and `firePhase`
has one reader."* True of a HEAD. False of a BOSS, and nothing in the type says otherwise.

⚠️ **It would have shipped green.** Every guard about the serpent sets the phase it wants and measures
that phase; none of them flew the fight from one phase into the next. What caught it was
[0268](0268-the-bob-keeps-its-centre.md)'s guard — which drives every *bobbing* boss through all of
its phases and was written about a hull leaving the lane. An accident, and
`a boss that rakes AND grows heads keeps the two counts apart` in `tests/serpent.test.ts` exists so
the next one does not have to be.

**The round counts on `headAt`**, its own field, on the same terms `src/sim/entity.ts` gives for
`spriteBase` and 0268 gives for `bobPhase`: a third number is cheaper than an invariant two call sites
have to remember. ⚠️ **Not a `Math.floor` on the index** — that stops the crash and leaves the rake
steering which head throws, which is the same defect with the symptom removed.

## ⚠️ What was rejected

**Every weapon every volley.** Three fans and three columns at once every 36 steps is a screen
that cannot be read — 0254 refused it for the hydra on the same grounds.

**The lightning on the row's `fall`, running through every phase.** The ask keeps it at the last
third with the blasts, and a fall is a shot or a body, not a bolt.

## What is owed

- **A play.** Whether a raking fan reads as *the acid blasts* and whether the last third at
  36 steps reads as together rather than as a blur.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One row; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0261`:

| broken on purpose | went red |
|---|---|
| the acid back on the wall | `THE THREE WEAPONS: a raking fan of acid` |
| the last third's lightning head dropped, so the round is acid and void alone | `THE THREE WEAPONS: a raking fan of acid` |
| the round never turning, so every volley of the last third is acid | `THE THREE WEAPONS: a raking fan of acid` |
| the round counting on the rake's own angle again, so a raked serpent indexes a head that is not there | `a boss that rakes AND grows heads keeps the two counts apart` |

⚠️ **The last one reproduces the crash rather than an assertion**: the probe reddens with the same
`TypeError: Cannot read properties of undefined (reading 'attack')` the fight threw.
