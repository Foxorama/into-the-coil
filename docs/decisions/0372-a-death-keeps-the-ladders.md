# 0372 — A death keeps the ladders

**Accepted 2026-09-26.** A death costs the life and nothing else, and a continue refills the lives
and keeps everything else. The bomb pickup is gone, and so is the charge a level clear paid. A thrown
bomb lands a twentieth of a boss's full health. A gun's hit on a boss is weighed by its own row, and
a boss may author its own weight for a gun: the arc is 1.5, and the serpent keeps it at 1.

This is the first of four changes on one ask. The plan, and the answers given while it was made, are
in [`the-arsenal-planned`](../../reports/the-arsenal-planned-2026-09-26.md).

## The ask

> *"1. you don't lose power ups on death or continue, you keep the level you had.*
> *2. lightning needs to do a bit more damage on bosses, it's currently too slow and the other two
> weapons are a fun damage level at the moment.*
> *3. remove the bomb power up"*
>
> *"5.1 forward missiles - give you a bomb like the current bomb (also increase it's damage so it
> does 5% of max boss health damage"*
>
> *"keep them all, remove the level clear of +1, it should be more than balanced by the fact that
> you're keeping them all on continues"*

## The rule

**`lifeLost` takes one life and leaves the run's upgrades, kinds and arsenal alone.** `continued`
refills the lives from the tier and leaves everything else alone. `levelCleared` moves the level and
pays nothing. `startingArsenal()` has one caller now, `begin`.

This reverses decisions that each held for a while:

- [0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)'s *lost on a death*.
- [0066](0066-a-death-scatters-what-it-took.md), [0243](0243-a-death-throws-back-one-piece-per-kind.md)
  and [0266](0266-a-death-throws-the-ladders-back.md)'s scatter.
- [0068](0068-a-run-over-is-a-continue.md)'s *starting kit, no upgrades*.
- [0085](0085-a-death-does-not-cost-the-bombs.md)'s reset on a continue.
- [0053](0053-the-bomb-is-the-first-thing-the-player-spends.md)'s *gains one per level cleared*.

**The scatter is deleted, not left idle.** That covers `scatterUpgrades`, its stream, the entity's
`stack`, the collection log's stack, the ×N badge painter and its three bitmaps, and the `count` on
an `upgraded` action, which only a scattered piece ever sent. A scatter left to throw an empty ring
would hand the player a second copy of what they still hold. The pickup pool stays at twelve: it was
raised for the scatter, but shrinking it is its own measurement.

**The bomb pickup is gone** (`PICKUP_KINDS` is three), and so is its bitmap. The mid-boss drops a
**missile** where the bomb was, so the fight still throws three. The overflow is now the only way to
earn a charge after the starting two, and it stays a bomb for every kind until the arsenal is typed,
which is the next change.

**A thrown bomb lands the larger of its own damage and `bossShare × full health`**, where the bomb's
share is `0.05`. Three details:

- **The share rides the SPECIAL, not the blast row.** The pyre's rungs are the same blast and are not
  spent, so they stay flat.
- **It lands once per animal.** `blastBoss` in `src/sim/collide.ts` replaces the two `blastInto`
  pairings with the head and the body. Those pairings billed every node a blast covered, which at a
  share of the whole would make a bomb on the coil a quarter of the fight. The serpent's armoured
  flank (0307) does not refuse it: *"5% of max boss health"* is what was asked for, and a bomb is not
  aimed at a scale.
- **The larger of the two, because a mid-boss is small.** Five per cent of 48 is 2.4, under the old
  six. A stronger bomb that hit small bosses softer would be the ask renamed.

A window (0255) still multiplies it, as it multiplies everything the player fires.

**`bossWeight` is on every weapon row** (pulse 1, arc 1.5, shuriken 1). **`gunWeights` is optional
on a boss row**, and `gunWeightOn` falls back to the gun's row, on
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s default shape. The weight
multiplies the shots' pairing with the boss and its body, and the arc's hand-made strike. It does not
touch the missiles or the blast, which are not the gun.

## What was measured

`scripts/weigh-boss.mjs` at Savior, gun tier 4, ship parked and unhittable, missiles silenced. The
figures are the quickest fight on the boss's own lane, 45 units short, in seconds:

| boss | pulse | shuriken | arc before | arc at 1.5 |
|---|---|---|---|---|
| jormungandr | 39 | 44 | 30 | 19 → kept at 1: 30 |
| volans | 46 | 18 | 67 | 40 |
| quetzal | 59 | 49 | 58 | 39 |
| gyre | 56 | 24 | 71 | 50 |
| hoarfrost | 73 | 68 | 69 | 46 |
| hydra | 61 | 31 | 71 | 48 |
| medusa | 61 | 24 | 84 | 54 |

**The arc was not slow everywhere.** On the serpent it was already the quickest gun. What set it apart
was that its time is the same at 60 units as at 45, while the pulse and the blade shorten as the ship
closes in. Positioning never paid the bolt. Across the seven bosses it ran about 1.36 times the mean
of the other two flown close, and 1.5 puts it between them on most bosses. That is *"a bit more"*;
the play decides the rest.

## The serpent, and the guard that was measuring the wrong case

[0307](0307-the-serpent-is-armoured.md)'s floor flew every gun at tier 4 and required the serpent to
last 28 s. The arc at 1.5 took it to 19 s. Asked, the player said *"you can't have max tier lightning
gun for the level 1 serpent so is that even a problem?"* — and then corrected the count: *"it's 3
pickups with the midlevel boss drop?"*

It is. The first level offers three weapon pickups: two authored and the mid-boss's. Since this
decision, a death neither takes a rung nor throws one back, so tier 3 is the most a player can carry
there. The guard now flies that tier, computed from `weaponsOfferedBy`. That is CLAUDE.md's *a
quantity that rejects an option is checked in the case it is applied to*.

**At tier 3 it was still a problem.** The arc's damage ladder doubles at the third rung, and at 1.5
the quickest serpent fight was 24 s. The player chose for the serpent to author the arc at 1 on its
own row. That gives 37 s at tier 3 and 30 s at tier 4, where it had been. 0307's probe still breaks
the serpent to 540 health, which is 26 s at tier 3.

## What it costs

- **A shield only saves a life now.** `docs/game.md` said a shield *"keeps the upgrades a death would
  cost"*, and a death costs none. What a shield is FOR is more open than it was.
- **A death is cheaper, and nothing else changed to pay for it.** The dial counts weapons OFFERED
  ([0084](0084-the-dial-is-the-level-and-the-guns.md)), so it does not move. Whether the tiers still
  have a margin either side of Savior ([0356](0356-the-tuned-tier-is-savior.md)) is a question for
  play, not arithmetic.
- **The charges only go up by overflow**, and a run that never fills a ladder has its starting two.
- **Stale descriptions found on the way**: `docs/game.md` still described 0256's one-rung death,
  which 0266 had already replaced. Both are rewritten.

## Confirmed, not assumed

Every probe in `scripts/probes/0372-a-death-keeps-the-ladders.mjs` breaks one rule and was seen to
turn its guard red under `npm run prove`:

| break | guard |
|---|---|
| a death that empties the ladders again | a death costs the life and nothing else |
| a death that keeps the ladder and puts the base gun back | a death costs the life and nothing else |
| a continue that resets the charges to the starting kit | refills the lives and keeps everything |
| a continue that empties the ladders | refills the lives and keeps everything |
| a level clear that pays every special a charge again | a level clear pays nothing into the arsenal |
| the share ignored | lands its share of the boss's full health once |
| the share billed once per node | lands its share of the boss's full health once |
| the share with no floor under it | and never less than the blast's own damage |
| the thrown blast never armed with the share | is armed with the share by the throw |
| the arc's strike ignoring the weight | arc: doubling the row's bossWeight shortens the fight |
| the shots' pairing ignoring the weight | pulse: doubling the row's bossWeight shortens the fight |
| a boss's own weight ignored | and a boss's own entry wins over the gun's row |

The probes of 0243 and 0266 are deleted with the code they broke, and `tests/prove-guard.test.ts`
says so. Those in 0041, 0053 and 0085 that broke the code INTO this rule are deleted. The rest are
re-anchored where the line they hang on moved.
