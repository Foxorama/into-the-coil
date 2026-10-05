# 0532 — The Legend holds longer

**Accepted 2026-10-05.** Builds on [0356](0356-the-tuned-tier-is-savior.md): a tier's row grows a
per-row literal beside `lives`, the shell and the corridor, and rides no margin. **Keeps hard, and
re-points at the boss's real health,** the boss half of `tests/difficulty.test.ts`'s *never makes
something take fewer* ([0192](0192-a-guard-holds-an-invariant.md)) — which a first build of this
decision had demoted, and this decision promotes back.

## The ask

Asked twice, then settled.

> *"legendary difficulty — minibosses need probably twice as much health as they do now; end bosses
> need about +15% health"*

Built first as asked: Legend's mid-bosses at 2× the content, its end bosses 1.15×. That put Legend's
mid-bosses above Savior's (2 against Savior's `toughness` of 1.6), the first number on any row where
the easiest tier out-held the tuned one, and the boss ordering guard went red on it.

The player then played Legendary — on a build without this change, where bosses died way too fast —
and, asked to choose, settled the numbers: **Legend's mid-bosses 1.5, its end bosses 1.15; Savior's
mid-bosses an eighth over its toughness, so 1.8 of the content and a fifth above Legend's 1.5; Burn
unchanged.** The ordering is the player's explicit ask.

## The rule

**A tier's row says how much longer its bosses hold than its `toughness` says, per fight:
`bossToughness: { mid, end }`.** The frame puts a boss down at `ceil(health × toughness ×
bossToughness[fight])`, with the fight read off `w.fight` — `0` the mid-boss's, `1` the end boss's
([0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)). `AS_TOUGH`, one in both, is the shared
default ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)); every row names
which it uses.

| row | `toughness` | `bossToughness` | a mid-boss holds | an end boss holds |
|---|---|---|---|---|
| Legendary Pilot | 1 | **mid 1.5, end 1.15** | 1.5× the content | 1.15× the content |
| Savior of the Galaxy | 1.6 | **mid 1.125, end 1** | 1.8× | 1.6× |
| Let the Galaxy Burn | 2.56 | `AS_TOUGH` | 2.56× | 2.56× |
| `AUTHORED` (fixtures) | 1 | `AS_TOUGH` | 1× | 1× |

## Why a literal on the row, and not the toughness axis

**The toughness axis would have moved every tier at once.** Since 0356 an axis is Savior's value moved
one margin per step, so Legend's mid-bosses could only rise through it by raising Savior's and Burn's
in proportion — and the end bosses, which were asked to move differently, with them. A literal, like
`lives`, moves the rows that were asked about and no other: Burn's bosses are put down at the health
they had, since multiplying by one is exact in floating point.

**Not a boss-row field either.** The ask is about tiers, and fourteen boss rows each carrying three
tiers' numbers would be the tier table written fourteen times.

**And the fight, not the kind.** The seven mid-bosses are only ever fought as mid-bosses today, but
which fight a boss is in is the frame's state and a kind's list position is not.

## The figures

Through the real frame. Mid-bosses on `scripts/solve-mid-health.mjs`'s rig — `weighFight` with the
level's carried loadout and the ship's own gun (the pulse), guns on; seconds the mid-boss was on the
field. **Before** is origin/main; **after** is the settled numbers.

| level | mid-boss | Legend health | Legend s | Savior health | Savior s |
|---|---|---|---|---|---|
| The Approach | sentinel | 174 → **261** | 12.7 → **15.9** | 279 → **314** | 17.0 → **18.9** |
| Ember Nebula | harrow | 168 → **252** | 11.5 → **17.3** | 269 → **303** | 17.6 → **20.3** |
| Saurian Belt | shoalMother | 132 → **198** | 12.4 → **16.5** | 212 → **238** | 19.7 → **20.8** |
| The Labyrinth | lattice | 101 → **152** | 14.1 → **18.2** | 162 → **182** | 18.1 → **18.8** |
| Rime Shelf | redoubt | 359 → **539** | 14.5 → **20.5** | 575 → **647** | 21.5 → **23.5** |
| The Toxic Mire | chorus | 284 → **426** | 15.2 → **20.1** | 455 → **512** | 23.3 → **25.4** |
| The Black Heart | axis | 507 → **761** | 17.2 → **26.1** | 812 → **913** | 22.2 → **25.3** |

The other guns, Legend then Savior, before → after: the shuriken 8.1–20.4 → 9.9–24.2 s and
10.4–31.3 → 12.6–31.6 s; the ray 10.5–23.7 → 14.8–35.0 s and 19.9–35.0 → 21.2–39.3 s. The arc reads
31–313 s on this rig on both tiers before and after — the rig's sweep keeping it out of reach rather
than this change — and is not chased here.

**More health is less than proportionally more fight** — Legend's 1.5× gave 1.2 to 1.5 times the
seconds. The stretch is timed from the put-down, so it includes the hull's entrance, which health does
not lengthen; that is the likely share and it was not separately measured.

### ⚠️ The 25-second window overruns, on both tiers

[0502](0502-the-window-is-the-fight.md) gives every mid-boss a 25-second window, past which the
level's waves come in over the fight. On the pulse:

- **Legend: one** — the axis, 26.1 s (none before).
- **Savior: two** — the chorus, 25.4 s, and the axis, 25.3 s (none before; they were 23.3 and 22.2).

On the shuriken, Legend has none; Savior has two — the sentinel at 31.6 (already over, at 31.3) and
the lattice at 28.8 (newly, from 23.8). On the ray, Legend has two — the sentinel at 35.0 and the axis
at 26.5, both newly; Savior has four — the sentinel 39.3, the lattice 29.4 and the axis 27.2, all
three already over, and the chorus newly at 26.1. That is 0502's *"increased difficulty with adds"*
for a slow kill, now met on the pulse at the end of the last two levels.

End bosses on `scripts/weigh-boss.mjs`'s `flyFight` — each gun in its own ship, ship unhittable,
missiles silenced, at rest in the middle of the lane; seconds from the first step the boss can be
hurt. Savior's end bosses are unchanged (`end: 1`), and the walk re-read every Savior figure identical:

| boss | Legend health | pulse, s | shuriken, s | ray, s | Savior pulse / shuriken / ray |
|---|---|---|---|---|---|
| jormungandr | 900 → **1035** | 53.6 → 59.5 | 21.4 → 25.1 | 45.6 → 51.6 | 88.8 / 35.6 / 71.8 |
| volans | 1450 → **1668** | 50.5 → 58.3 | 26.2 → 30.1 | 27.7 → 31.0 | 83.5 / 41.5 / 51.3 |
| quetzal | 1460 → **1679** | 80.2 → 94.4 | 55.0 → 64.8 | 72.8 → 83.1 | 110.5 / 78.7 / 112.4 |
| gyre | 1500 → **1725** | 44.1 → 51.6 | 26.1 → 29.9 | 25.9 → 29.6 | 74.1 / 41.1 / 41.1 |
| hoarfrost | 1800 → **2070** | 58.0 → 66.4 | 38.0 → 43.6 | 46.5 → 52.8 | 91.8 / 59.5 / 73.0 |
| hydra | 1860 → **2139** | 49.2 → 56.7 | 32.3 → 36.9 | 28.9 → 33.0 | 79.1 / 50.9 / 45.9 |
| medusa | 1890 → **2174** | 34.5 → 42.4 | 32.9 → 38.6 | 32.0 → 35.8 | 94.8 / 63.4 / 60.7 |

The arc never finished an end boss from the lane's middle at rest on either tier (out of its reach),
so it is not in the table; `scripts/weigh-boss.mjs`'s held places are its instrument.

## What it does beside the ask

- **The gyre's wreck holds 15% more on Legend**, since its health is a share of the fight's full
  health ([0475](0475-the-wreck-can-be-killed.md)). 0475 recorded that at Legend the gun alone kills
  it; that is not re-measured here. Savior's is unchanged.
- **The jellyfish heals in the content's points** (`feeds × row.health`), unchanged, so each jelly it
  eats is a smaller share of a Legend hull that is 15% larger.
- **Savior's mid-bosses now run past the ladder [0269](0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md)
  solved them to.** The ladder asks 17–23 s and a mean of about twenty; at the settled numbers Savior's
  measure 18.8–25.4 s, a mean of 21.9, and the chorus 25.4 against its 22. 0269's guard went red on
  that — *gauntlet's mid-boss is fought for 25s against the 22s its level asks for* — and the solver,
  re-run, would have taken the eighth straight back out of the row's health. ⚠️ **That is the player's
  ask meeting an older ask of theirs, and it is theirs to reconcile**; 0472's report behind the
  ladder was that Savior was *too bullety* around the mid-bosses. What is built: the eighth is a
  stated departure on top of the ladder, not a miss of it. `scripts/solve-mid-health.mjs` and
  `tests/midboss.test.ts` fly the fight at Savior's toughness with `AS_TOUGH` (a new `bosses` option
  on `weighFight`), so they hold the solved table to the solver's precision as before, and the seconds
  a Savior player actually meets are the table above. If the player would rather the ladder be the
  fight, the answer is `MID_BOSS_SECONDS` raised by them, not this guard.

## Rejected

- **Through the `toughness` axis**, which moves all three tiers' bosses together. Above.
- **Legend's mid-bosses at 2×, as first asked**: built, and then refused by the player in favour of an
  ordering where Savior holds more.
- **Re-solving the mid-boss healths to a seconds target per tier.** The ask is a ratio, stated by the
  player; the seconds it produced are above.
- **A constant beside `toughnessFor`.** One boss multiplier for every tier is every tier's bosses
  moved by a play of one ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)).

## Guards

**Added**, `tests/difficulty.test.ts`, *0532: puts each fight's boss down at what its tier's row says
for THAT fight*: a level whose mid-boss and end boss are the same kind, flown through the real frame
on a row made for the test — the content's toughness, three times the mid-boss, twice the end boss —
and the healths read off the spawn against the row's health times three and times two. Not against
`bossToughnessFor`, which a helper that dropped the row would agree with
([0027](0027-measure-the-picture-not-the-model.md)); not on the real tiers, whose numbers a correct
play moves.

**Promoted back to hard, and re-pointed**: the boss half of *and never makes something take fewer,
whatever the tiers turn out to be* now walks every boss in both fights at `bossToughnessFor`, the
health the frame gives it. The first build of this decision demoted it to a taste, because Legend's
mid-bosses at 2× reddened it on an asked change. The settled ask is that Savior's mid-bosses hold a
fifth more than Legend's, so the ordering is now the player's own statement and holds hard; the taste
is gone. Promoting a guard takes a decision (0192), and this is it.

**Changed, with the reason above**: `tests/midboss.test.ts`'s *THE REPORTED ONE: a mid-boss fight
lasts what its level asks* flies Savior with its boss number set to `AS_TOUGH`, as the solver now
does. It went red at the settled numbers (the chorus 25 s against 22, 3.4 s off a 3 s budget); the
work was not changed to suit it.

**Extended**: `tests/tier-shell.test.ts`'s *THE BASELINE* holds that `AUTHORED` multiplies neither
fight's boss; the two phase guards in `tests/difficulty.test.ts` walk every boss in both fights at the
health the frame gives it.

## Confirmed, not assumed

`npm run prove 0532`:

| broken on purpose | went red |
|---|---|
| the spawn reading the tier's toughness alone, so the row's boss numbers never reach a fight | `puts each fight's boss down at what its tier's row says for THAT fight` |
| Legend's mid-bosses holding more than Savior's (the first ask's 2) | `and never makes something take fewer, whatever the tiers turn out to be` |
| the two fights swapped, so the mid-boss holds what the end boss was asked to | `puts each fight's boss down at what its tier's row says for THAT fight` |
| the boss helper dropping the row's number | `puts each fight's boss down at what its tier's row says for THAT fight` |
| the baseline given Legend's boss numbers | `THE BASELINE` |

## Owed

- **A play of Legend and of Savior** at the settled numbers — the axis on both, and the chorus on
  Savior, now meeting adds at the end of their fights.
- **The gyre's wreck at Legend**, re-measured against 0475's *the gun alone kills it*.
- **The player's answer on Savior's mid-boss ladder**: whether the eighth stays on top of
  `MID_BOSS_SECONDS`, or the ladder itself is raised.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One field on a content row and one
line at the spawn; nothing persisted.
