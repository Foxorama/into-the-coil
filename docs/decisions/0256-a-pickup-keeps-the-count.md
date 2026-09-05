# 0256 — A pickup keeps the count, a death costs a rung, and a mid-boss drops the rest

**Accepted 2026-09-06**, the day after [0255](0255-the-jellyfish-opens.md), from the first play
with the mid-bosses in — [`the-alpha-list`](../../reports/the-alpha-list-2026-09-06.md):

> *"picking up a new weapon/missile type doesn't reset your power count → it's too punishing when
> you accidentally get a pickup with a lot of enemies on screen or right before a boss or something.
> Reduce and change the number of pickups → we don't need nearly as many if the power count isn't
> being reset. A death reduces the power count by 1 (to a minimum of 1)."*

> *"Weapons → 1 near the start of the level, 1 from the miniboss death. Missiles → 1 about 20% of
> the way into the level. Shields → 1 from the miniboss death. Bombs → 1 from the miniboss death, 1
> from the boss death. Level 1 → 1 additional weapon pickup before the miniboss appears, 1
> additional missile pickup halfway between miniboss and level boss."*

**Amends [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)**: a switch keeps the count.
**Amends [0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)**: a death costs one rung
per ladder, not the ladder. **Supersedes [0066](0066-a-death-scatters-what-it-took.md) and
[0243](0243-a-death-throws-back-one-piece-per-kind.md)**: nothing is thrown back, because the rung
is the cost. **Amends [0083](0083-two-ladders-of-four.md)**: two pickups a level, and the fights
offer the rest. **Amends [0084](0084-the-dial-is-the-level-and-the-guns.md)**: the level's step on
the dial is a fraction, so the top is still eleven.

## The rules

**A pickup of another kind switches the kind and keeps the count.** The ladder is the ship's and
the kind is what it is fitted to: `upgraded` in `src/state/slices/run.ts` adds a rung to the list
whatever face was taken, clamped at `UPGRADE_TIERS`, and sets the kind. A switch at a full ladder
switches and adds nothing — still an upgrade, because the ship changes (`effectOf`). The hull keeps
its tier through a switch. `a pickup of another kind switches the kind and keeps the count` in
`tests/run.test.ts`; `THE SWITCH` in `tests/weapons.test.ts` is inverted to match.

**A death costs one rung per ladder, floored at one, and keeps the kinds.** `afterDeath` in
`src/content/pickups.ts` is the single description: the last rung of each kind with more than
`DEATH_KEEPS` goes; a ladder at one keeps its one; the base gun and the empty rack lose nothing.
`lifeLost` reads it and leaves `weapon` and `missile` alone. Nothing is thrown back — the scatter
of 0066, its coin of 0082, its return of 0083 and its stack of 0243 are gone with `scatterUpgrades`,
the `stack` field, the `count` on the action and the ×N badge, because the rung IS the cost and a
mechanism that returns it is a death that costs a crossing under fire instead.
`a death costs one rung per ladder` and `a ladder at one rung keeps its one` in `tests/run.test.ts`;
`costs one rung per ladder at the end of the beat` in `tests/death.test.ts` holds the order — the
reducer at the end of the beat, exactly where the scatter was.

**A level authors one weapon near its start and one missile a fifth of the way in, and nothing
else; level one authors a second weapon before its mid-boss and a second missile halfway between
the fights.** Held as the ask's counts in `THE OPENING`, `THE TUBE` and `THE BUDGET` in
`tests/pickups.test.ts`. The two guards 0083 wrote — *never unarmed for fifty seconds*, *cap the
guns before the boss* — are deleted with their premise: a player who just died is one rung down,
and the guns cap across the run. Level one's second weapon moved from 1,588 to 1,000, which moved
0086's run-up with it: the one-health band is 1,000 to 1,600 now, the sentinel arrives inside it,
and the stretch the band used to fill is a mix of teeth on 0231's terms.

**A mid-boss's death drops a weapon, a shield and a bomb where it died.** `MID_BOSS_DROP` in
`src/content/levels.ts` is the list, one for every mid-boss; `dropPickups` in `src/app/frame.ts` is
the throw the scatter left behind — the same ring, jitter, flight and bounce, thrown from
`bossOffset` on the step the mid-boss dies, before `nextFight` forgets where it was. The dropped
weapon cycles like an authored one, because it is an offer and not a return, and it turns the dial
as an authored one does. `THE DROP` in `tests/bosses.test.ts` kills both fights of a level and
holds that the first throws the list and the second throws nothing; `a mid-boss's death drops what
the fight is worth` in `tests/pickups.test.ts` keeps every guard about the throw that was worth
keeping.

**The end boss's bomb is the clear's charge.** `levelCleared` has granted every owned special a
charge since [0053](0053-the-bomb-is-the-first-thing-the-player-spends.md); that is *"1 from the
boss death"*, and a piece thrown 1.6 seconds before the level ends (`BOSS_DEATH_STEPS`) is a piece
nobody reaches. Nothing is thrown there, and `THE DROP` says so.

**The dial's level step is 4/3.** `DIAL_PER_LEVEL` in `src/content/difficulty.ts`. Seven levels of
two weapons — one authored, one dropped — and three in the first put the last boss at 9 on the old
steps; the weapon's step stays 1 because `MULTI_HIT_DIAL` is written in it, and the level's step is
what is left over. Level one's boss is fought at 4, level two opens at 2⅓ and its boss at 4⅓, the
last at 11 exactly. `weaponsOfferedBy` in `src/content/levels.ts` counts the drop beside the list so
`tests/dial.test.ts` still recomputes the top from the content.

## The figures

| | before | after |
|---|---|---|
| authored pickups, a level | 9 (4 weapons, 2 missiles, 2 shields, 1 bomb) | 2 (a weapon, a missile); level one 4 |
| what a mid-boss's death offers | nothing | a weapon, a shield, a bomb |
| what a death costs | the ladder and the gun, thrown back as two pieces | one rung per ladder |
| a switch at tier 3 | tier 1 of the new gun | tier 4 of the new gun |
| the guns cap | inside level one | during level two |
| the dial at level one's boss | 5 | 4 |

## ⚠️ What was rejected

**Keeping the scatter and throwing the one rung back.** A death would then cost nothing a player
could not recover, which is 0082's report — *"there's not really a cost to dying at all"* — with a
smaller number.

**A bomb piece thrown by the end boss too.** The level ends 1.6 seconds after the boss dies, the
boss holds station past the middle of the screen and a pickup's reach is a twentieth of the lane.
The clear's charge is the same bomb, granted where the player can have it.

**Keeping the ×N badge for a drop.** Nothing on the field is worth more than one rung, so the badge
had no piece to ride and a guard over it could only ever be green — 0019's unfalsifiable guard.

**Leaving `DIAL_PER_LEVEL` at 1 and deriving `DIAL_MAX`.** Eleven is the ask's own number and the
one thing about the dial a play-test has said; the step is the thing nobody named.

## What is owed

- **A play.** Every figure above is a model quantity: whether one rung reads as a cost, whether
  three pieces off a mid-boss read as a reward under the waves that keep coming, and whether two
  pickups a level is too mean in the gauntlet.
- **The picture of a death's cost.** The hull drops a tier where it used to drop to the base, and
  nothing else on screen says a rung went. 0036 may want more.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). The save stores the upgrade list
and the kinds, and every list this writes is one the old reducer could read; a reload under the
old code resolves the same weapon. Nothing persisted changes shape.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0256`:

| broken on purpose | went red |
|---|---|
| a switch starting the new kind's ladder again at one rung | `a pickup of another kind switches the kind and keeps the count` |
| a death emptying the ladder, which is what shipped for four months | `a death costs one rung per ladder, keeps the gun, and leaves the arsenal exactly where it was` |
| the floor under the cost removed, so a ladder at one rung is emptied | `a ladder at one rung keeps its one` |
| a death putting the base gun back on the ship | `a death costs one rung per ladder, keeps the gun` |
| the death's cost dispatched on the step the hull reached zero, before the beat | `costs one rung per ladder at the end of the beat` |
| a level authoring a second weapon, which is how nine a level came back | `THE BUDGET: a level authors one weapon and one missile and nothing else` |
| a shield authored into a level rather than dropped by its mid-boss | `THE BUDGET: a level authors one weapon and one missile and nothing else` |
| a level's missile moved to the middle of the level | `THE TUBE: every level offers a missile about a fifth of the way in` |
| the shield taken out of the mid-boss's drop | `the fights offer the rest: a mid-boss drops one weapon, one shield and one bomb` |
| the mid-boss's death throwing nothing | `0256 — THE DROP: the mid-boss's death throws` |
| the end boss's death throwing the drop as well, where nobody can reach it | `0256 — THE DROP: the mid-boss's death throws` |
| the dropped weapon not counted on the dial | `THE DROP: one piece per kind in the list, thrown from where the hull died, and the weapon turns the dial` |
| the level's weapon count read off the list alone, without the drop | `THE ENDPOINT: the last boss is fought at exactly the top of the dial` |
| a dropped weapon holding one face, as a scattered piece did | `a dropped weapon cycles like an authored one` |
