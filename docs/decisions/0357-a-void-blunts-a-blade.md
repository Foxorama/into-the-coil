# 0357 — A void blunts a blade rather than eating it

**Accepted 2026-09-23.** A defect in [0291](0291-the-void-has-an-appetite.md)'s eating,
found by an instrument reading a fight wrong and named by the player. **Corrects a claim in
[0356](0356-the-tuned-tier-is-savior.md)**, which recorded *medusa never dies to the shuriken on Burn*
as a pre-existing fight defect. It was neither pre-existing in the fight nor about the tier.

## What was reported

> *"It's come up on saviour as well and it's a poor measurement as shurikens absolutely shred
> everything in the game."*

`scripts/weigh-boss.mjs` said the shuriken needed **590 s** to kill medusa at Savior and **never** at
Burn, against 121 s for the pulse. Every other boss in the game reads the other way round — the blade
is the quickest gun on five of seven — so the outlier was the instrument's verdict, not the gun.

## The rule

**A void's bite costs a shot one health, exactly as an arrival does**, and a shot with more than one
flies on. `src/sim/collide.ts` has said that since [0234](0234-a-blade-circles-the-ship.md): *an
arrival costs a shot one health, and a shot with one is gone*. `feedVoids` in `src/app/frame.ts` did
not — it released whatever it bit — and a blade carries `BLADE_EDGE` = 12 arrivals, so one void ate
all twelve. The bite is now written the way `collideInto` writes it, `landIn` and all, which is also
what the bomb's own loop three paragraphs below already did and for the stated reason: a blade inside
a blast would otherwise empty a six-point appetite in three steps with nothing drawn to say so.

**Only the blade changes.** Every other shot in the game has one health, so `health -= 1` releases it
on the same step it always did.

## Why it looked like a fight defect, and why the fixture found it and no play did

Medusa's last phase rains **ten void every sixth of a second** (0255). `weigh-boss` parks an
unhittable ship on the boss's lane, so it stands inside that rain for as long as the fight lasts —
somewhere no pilot can stand, because a pilot there is dead. Every blade it threw was born in a mouth
and eaten whole, and the instrument reported the only thing it can see: seconds. A play never sat
still long enough to read it as *the gun stopped working*; it read as *the last phase is lethal*,
which it is.

⚠️ **The fixture is not at fault and is not changed.** It found a real inconsistency in the model —
one line spending a shot differently from the line that owns that rule — and reported it as the only
symptom it could see. What was at fault is the conclusion drawn from it in 0356, which called a
fight broken without asking why one gun of three behaved differently.

## Measured, at Savior, ten seconds of medusa's last phase, the ship held on its lane

Damage a second off the boss, through the rain and with the rain swept from the same fixture:

| gun | through the rain | rain swept | share, before | share, after |
|---|---|---|---|---|
| shuriken | 178.7 | 181.4 | **0.06** | **0.99** |
| pulse | 59.2 | 112.6 | 0.53 | 0.53 |
| arc | 33.6 | 72.9 | 0.46 | 0.46 |

And the whole fight, `weigh-boss medusa --difficulty=savior`, the blade on the boss's own lane held
45 units short: **219 s → 22 s**; its median over the fifteen places, **590 s → 31 s**; at Burn,
**never → 49 s**. The blade is now the quickest gun on medusa, as it is on five of the other six.

⚠️ **Three numbers move in the whole instrument and they are all the blade's**, which is the check
that this reached the one shot it is about — every boss, every gun, Savior, before against after:

| moved | before | after |
|---|---|---|
| medusa, shuriken | 590 s | 31 s |
| jormungandr, shuriken | 62 s | 52 s |
| hydra, shuriken | 37 s | 35 s |

The other eighteen are identical to the second, the pulse and the arc included. The two small ones
are the other bosses that throw void — a spray and a rain — and the size of the move is the size of
the void in that fight.

## Rejected

- **Changing the instrument to stand somewhere else, or to fly with missiles live.** Both would have
  buried the defect under a fixture change: the model would still spend a blade twelve ways at one
  mouth and one way at every other. The instrument is unchanged.
- **Giving the void a rule of its own** — *a blade is immune to a mouth*, or *a mouth eats a blade
  whole because it is a mouth*. Either is a second description of what a shot's health means, and
  0234 already owns that sentence for the whole game.
- **Leaving it and lowering `BLADE_EDGE`.** The blade's edge is what a helix is worth against a wall
  of drifters; the fault was never the number.

## The guards, and that each was seen to fail

`tests/blades.test.ts`, four breaks in `scripts/probes/0357-*.mjs`:

| broken on purpose | went red |
|---|---|
| a void releasing the whole blade it bit, edge and all | `THE BITE: a blade goes on with one less edge` |
| a void releasing the whole blade, read off what medusa loses a second | `THE PICTURE: a boss that rains void still takes the blade’s damage` |
| a blade feeding a void on every step it overlaps, rather than once per flash | `and it feeds once per flash rather than every step it is inside one` |
| a void biting without spending the shot, so a pulse is never eaten | `and a pulse is still spent by one, because one is all it has` |

The picture one reads **17.2 a second against 178.7** when the release is put back — the fortieth this
started as, measured the other way round.

One is in units the player watches, per [0027](0027-measure-the-picture-not-the-model.md): health off
the boss per second of flying, as a share of the same fight with the rain swept — so nothing here
pins a rate, and what is refused is the blade being turned off by a wall of mouths.

## Owed

A play of medusa's last phase with the shuriken. The blade now takes 0.99 of its swept damage
through the rain and pops the mouths as it goes, which is a change to how that phase reads — and
whether a phase built as a wall should be so answerable by one gun is the player's call, not this
file's.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
