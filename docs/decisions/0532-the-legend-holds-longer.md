# 0532 — The Legend holds longer

**Accepted 2026-10-05.** Builds on [0356](0356-the-tuned-tier-is-savior.md): a tier's row grows a
per-row literal beside `lives`, the shell and the corridor, and rides no margin. **Demotes** the boss
half of `tests/difficulty.test.ts`'s *never makes something take fewer* to a taste
([0192](0192-a-guard-holds-an-invariant.md)).

## The ask

> *"legendary difficulty — minibosses need probably twice as much health as they do now; end bosses
> need about +15% health"*

## The rule

**A tier's row says how much longer its bosses hold than its `toughness` says, per fight:
`bossToughness: { mid, end }`.** The frame puts a boss down at `ceil(health × toughness ×
bossToughness[fight])`, with the fight read off `w.fight` — `0` the mid-boss's, `1` the end boss's
([0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)). `AS_TOUGH`, one in both, is the shared
default ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)); every row names
which it uses.

| row | `toughness` | `bossToughness` | a mid-boss holds | an end boss holds |
|---|---|---|---|---|
| Legendary Pilot | 1 | **mid 2, end 1.15** | 2× the content | 1.15× the content |
| Savior of the Galaxy | 1.6 | `AS_TOUGH` | 1.6× | 1.6× |
| Let the Galaxy Burn | 2.56 | `AS_TOUGH` | 2.56× | 2.56× |
| `AUTHORED` (fixtures) | 1 | `AS_TOUGH` | 1× | 1× |

## Why a literal on the row, and not the toughness axis

**The toughness axis would have moved the other two tiers.** Since 0356 an axis is Savior's value
moved one margin per step, so the only way to double Legend's mid-bosses through it is to double
Savior's and quadruple Burn's. Savior is the tuned tier — *"that's the optimised difficulty"* — and
nothing was asked of it, or of Burn. A literal, like `lives`, moves the row that was played and no
other. Savior's and Burn's bosses are put down at the health they had: multiplying by one is exact in
floating point, so `ceil(base × toughness × 1)` is `toughnessFor` to the bit. (Savior's fights below
were flown before the change only; the arithmetic is what says they did not move.)

**Not a boss-row field either.** The ask is about a tier, and fourteen boss rows each carrying three
tiers' numbers would be the tier table written fourteen times.

**And the fight, not the kind.** The seven mid-bosses are only ever fought as mid-bosses today, but
which fight a boss is in is the frame's state and a kind's list position is not; a kind fought in the
other seat would take that seat's number.

## ⚠️ What it does that was not asked for

**Legend's mid-bosses now hold MORE than Savior's** — 2 against 1.6, so 25% more health, and on the pulse
every Legend mid-boss fight is now longer than Savior's. It is the first place on any row where the
easiest tier is harder than the tuned one on a number. Built as asked, because the play was of Legend
and the number is the player's; **whether Savior's mid-bosses should follow is the player's call**,
and it is printed on every run as `0532-held` (below), so it cannot be forgotten. If the answer is
yes, it is Savior's toughness or Savior's own `bossToughness`, and Burn follows by margin only in the
first case.

**Three Legend mid-boss fights now run past their 25-second window** on the pulse
([0502](0502-the-window-is-the-fight.md)): the redoubt at 26.0 s, the chorus at 27.3, the axis at 29.0.
Past the window the level's waves come in over the fight, as 0502 says they do for a slow kill —
*"increased difficulty with adds"* — so those three are now fights with adds at the end, on the gentlest
tier. On the shuriken it is four (the sentinel, the lattice, the redoubt, the axis), and on the ray three
(the sentinel, the chorus, the axis).

**The gyre's wreck holds 15% more on Legend**, since its health is a share of the fight's full health
([0475](0475-the-wreck-can-be-killed.md)). 0475 recorded that at Legend the gun alone kills it; that is not
re-measured here.

**The jellyfish heals what it heals in the content's points** (`feeds × row.health`), unchanged, so
each jelly it eats is a smaller share of a Legend hull that is 15% larger.

## The figures

Through the real frame, at Legend before and after, with Savior beside them. Mid-bosses on
`scripts/solve-mid-health.mjs`'s rig — `weighFight` with the level's carried loadout and the ship's own
gun, guns on through the level; seconds the mid-boss was on the field:

| level | mid-boss | Legend health | pulse, s | Savior: health, pulse s |
|---|---|---|---|---|
| The Approach | sentinel | 174 → **348** | 12.7 → **19.7** | 279, 17.0 |
| Ember Nebula | harrow | 168 → **336** | 11.5 → **21.2** | 269, 17.6 |
| Saurian Belt | shoalMother | 132 → **264** | 12.4 → **21.5** | 212, 19.7 |
| The Labyrinth | lattice | 101 → **202** | 14.1 → **19.8** | 162, 18.1 |
| Rime Shelf | redoubt | 359 → **718** | 14.5 → **26.0** | 575, 21.5 |
| The Toxic Mire | chorus | 284 → **568** | 15.2 → **27.3** | 455, 23.3 |
| The Black Heart | axis | 507 → **1014** | 17.2 → **29.0** | 812, 22.2 |

The other guns' Legend mid-boss fights, before → after: the shuriken 8.1–20.4 s → 13.2–28.6 s, the ray
10.5–23.7 s → 21.6–43.5 s (the sentinel the long one). The arc read 31–119 s before and 59–391 s after
on this rig; it reads as slow on Savior too (48–313 s), which is the rig's sweep keeping it out of reach
rather than this change, and it is not chased here.

**Double the health is not double the fight** — 1.4 to 1.8 times on the pulse. The stretch is timed
from the put-down, so it includes the hull's entrance, which health does not lengthen; that is the
likely share and it was not separately measured.

End bosses on `scripts/weigh-boss.mjs`'s `flyFight` — each gun in its own ship, ship unhittable,
missiles silenced, at rest in the middle of the lane; seconds from the first step the boss can be hurt:

| boss | Legend health | pulse, s | shuriken, s | ray, s | Savior pulse / shuriken / ray |
|---|---|---|---|---|---|
| jormungandr | 900 → **1035** | 53.6 → 59.5 | 21.4 → 25.1 | 45.6 → 51.6 | 88.8 / 35.6 / 71.8 |
| volans | 1450 → **1668** | 50.5 → 58.3 | 26.2 → 30.1 | 27.7 → 31.0 | 83.5 / 41.5 / 51.3 |
| quetzal | 1460 → **1679** | 80.2 → 94.4 | 55.0 → 64.8 | 72.8 → 83.1 | 110.5 / 78.7 / 112.4 |
| gyre | 1500 → **1725** | 44.1 → 51.6 | 26.1 → 29.9 | 25.9 → 29.6 | 74.1 / 41.1 / 41.1 |
| hoarfrost | 1800 → **2070** | 58.0 → 66.4 | 38.0 → 43.6 | 46.5 → 52.8 | 91.8 / 59.5 / 73.0 |
| hydra | 1860 → **2139** | 49.2 → 56.7 | 32.3 → 36.9 | 28.9 → 33.0 | 79.1 / 50.9 / 45.9 |
| medusa | 1890 → **2174** | 34.5 → 42.4 | 32.9 → 38.6 | 32.0 → 35.8 | 94.8 / 63.4 / 60.7 |

Every Legend end-boss fight is still shorter than Savior's. The arc never finished an end boss from
the lane's middle at rest on either tier before or after (out of its reach), so it is not in the table;
`scripts/weigh-boss.mjs`'s held places are its instrument.

## Rejected

- **Through the `toughness` axis**, which doubles Savior and quadruples Burn. Above.
- **Legend's mid-bosses capped at Savior's**, to keep the tiers in order. That is 1.6 delivered as
  *"twice"* — a cheaper thing under the ask's name ([0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md)).
- **Re-solving Legend's mid-boss healths to a seconds target** the way `solve-mid-health.mjs` solves
  Savior's. The ask is a ratio, stated by the player; the seconds it produced are in the table.
- **A constant beside `toughnessFor`.** One boss multiplier for every tier is every tier's bosses
  moved by a play of one ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)).

## Guards

**Added**, `tests/difficulty.test.ts`, *0532: puts each fight's boss down at what its tier's row says
for THAT fight*: a level whose mid-boss and end boss are the same kind, flown through the real frame
on a row made for the test — the content's toughness, three times the mid-boss, twice the end boss —
and the healths read off the spawn against the row's health times three and times two. Not against
`bossToughnessFor`, which a helper that dropped the row would agree with
([0027](0027-measure-the-picture-not-the-model.md)); not on the real tiers, whose numbers a correct
play moves. An invariant: the row's number for the fight reaching that fight.

**Extended**: `tests/tier-shell.test.ts`'s *THE BASELINE* holds that `AUTHORED` multiplies neither
fight's boss; the two phase guards in `tests/difficulty.test.ts` walk every boss in both fights at the
health the frame gives it.

**Demoted**, one edit and a reason: the boss half of *and never makes something take fewer, whatever
the tiers turn out to be*. Walked over the healths the frame now gives, it went red on this change —
*the sentinel holds less as the mid boss on savior than on legendary: expected 279 to be greater than
or equal to 348* — and the change is the one asked for, so it was never an invariant. The enemy half
stays hard. The claim is `0532-held` in `tests/authored.ts`, printed every run with each boss it is
not true of: today, all seven mid-bosses, Savior under Legend.

## Confirmed, not assumed

Probes in `scripts/probes/0532-the-legend-holds-longer.mjs`: the spawn reading `toughness` alone, the
two fights swapped, the helper dropping the row's number, and the baseline given Legend's numbers.
**Not yet seen red** — `npm run prove 0532` is owed before this merges.

## Owed

- **A play of Legend**, which is where the numbers came from and the only thing that says whether they
  are right — the three mid-boss fights that now meet adds first.
- **The player's answer on Savior's mid-bosses**, which Legend's now out-hold.
- **The gyre's wreck at Legend**, re-measured against 0475's *the gun alone kills it*.
- **`npm run prove 0532`.**

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One field on a content row and one
line at the spawn; nothing persisted.
