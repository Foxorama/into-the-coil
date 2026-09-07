# 0270 — A shattering volley is counted in shards

**Accepted 2026-09-07**, from [`the-ice-fills-the-screen`](../../reports/the-ice-fills-the-screen-2026-09-07.md):

> *"The rime shelf and hydra boss ice attacks are way too hard to avoid on low and middle tier
> difficulties… it's the explosions and the number of projectiles on screen after explosion, there's
> no space on the screen, or the pattern is too difficult to find."*

**Completes [0263](0263-the-frost-ship-shatters.md)**, which stated this rule and wrote it into one
boss. **Extends [0047](0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)**: a tier now
scales how much ARRIVES, which no field on it could reach. **Stands on
[0027](0027-measure-the-picture-not-the-model.md)**: the assertion that catches this is written in
the player's units, and every guard that was already green was not.

## What it was

0263 said *"the volleys are counted in shards"* and took the frost ship's phases to 1, 2, 2 and 3,
because one shard is two bolts and then twelve flakes. **The hydra's frost head kept reading the
phase's own `shots`** — one number shared by five heads, four of which throw bullets spent by
arriving, authored at 4 and 6. Its frost volley was eight shards: **ninety-six flakes**, and the
count of hostile shots alive stepped from 14 to 104 at one phase boundary.

0263's guard says the rule in its own comment and drives `frostAt(0.15)` — one phase, of one boss.
It never saw the hydra, and it never saw the summon phase, where the horde had no ceiling at all and
what stopped it was `CAPACITY.enemies` running out.

## The rules

**A volley of a shot that shatters is counted in shards, and the ceiling lives where the fission
does.** `SHARD_VOLLEY` in `src/content/shots.ts` is the most shards one volley may open with, and
`throwAttack` applies it to every arm rather than to a row — a per-row count would have to be
authored correctly by every future boss that picks up a shattering shot, which is exactly what did
not happen once already, in the decision that invented the shattering. **Three**, read off the widest
volley the frost ship itself throws rather than picked: no boss opens a shattering volley wider than
the ship the shattering was designed for. A `wall` is symmetric about the hull and so spends the
ceiling a pair at a time.

**A summons tops the horde up rather than adding to it.** `standing` on the summon arm is the most of
that kind it will keep on the field; a call spends what is left and a full field does not spend the
turn — nothing is thrown and `spin` is not flipped, or the sides would alternate against a count
nobody can see. **A ceiling on what is STANDING and not a budget for the fight**, on
[0151](0151-the-gap-you-have-to-reach.md)'s argument: a total would make a phase that runs long a
phase that goes quiet, and what killing an add buys is that the next call lands.

**A tier scales how much arrives.** `crowd` on `DifficultyRow`, 1 at the easiest tier like every
field but `fireGap`, reaching a boss volley's count and a summons' ceiling — so the counts in
`src/content/bosses.ts` are the Legendary fight and the two harder tiers are departures from it.
`crowdFor` rounds to NEAREST rather than up, which `tests/difficulty.test.ts`'s ordering is what makes
safe: rounding up would double every phase authored to throw one shard, which is the small counts
0263 spent a decision settling. **It does not change the script** — every count it scales belongs to
a fight, never to a wave.

**And the tier does not scale the shard ceiling, which is the one place `crowd` is refused.** Scaled,
at Burn the frost ship's last phase went to four shards on a cadence already halved by `fireGap`, and
what is alive at once reached 150 of 150 — a full pool, where `src/sim/pool.ts` silently drops the
next volley and the shattering of an add with it. The two multiply. What a tier does to a shattering
shot is send it twice as often, which is a thing the pool can carry.

**The guard is a pilot that flies.** `tests/crowd.test.ts` projects every hostile body to the ship's
own lane position, keeps only the places the ship could also *be* by then at whatever speed the cold
has left it, and steers to the middle of the widest one — then holds that **there is always somewhere
to be**, in every phase of every fight in the game, on every tier. A parked ship reports *nowhere to
go* about its own hands; a pilot flying to the safest place it can see reports the fight. On
`legendary` alone it holds a whole ship of ROOM, because that row carries the ask *"this should
provide me no challenge"* — on the other two tiers how tight it gets is a hand's question, and
[0192](0192-a-guard-holds-an-invariant.md) says a taste may not fail a suite.

**And it walks ALL FOURTEEN, because the axis does.** It was scoped to the two fights this decision
was reported for until that was measured: `crowd` lives in `throwAttack`, so it reaches every boss's
volley, and a guard narrower than the axis it protects would go on passing while the rest of the game
tightened. What the measurement found is in *What it moved* below — nothing at zero, and one fight
that lost most of its room to a change it was never part of, which is why `burn`'s number came down.

**A phase can be stood in.** `rig/bench.html` scrubs the boss's health, pinning it the way `hold`
pins the camera — it does not pause the fight. Before it, no phase-keyed attack in the game had ever
been photographed, because reaching one meant fighting to it: two thirds of the boss vocabulary was
outside [0027](0027-measure-the-picture-not-the-model.md)'s eyes-on rig, and the frost walls this
decision is about were argued over in world units for an afternoon before anybody looked at one.

**And it moves two things 0263 wrote, which is stated here rather than left to be found.** 0263's
guard held that the frost ship's last spray throws its phase's `shots`; the truth with a ceiling is
`min(shots, SHARD_VOLLEY)`, so the assertion is changed and says why —
[0192](0192-a-guard-holds-an-invariant.md)'s *change the guard and say why*, never *loosen it*. The
shipped content is inside the ceiling either way, so nothing about the fight it describes moved.
0263's probe broke that phase to twelve shards to fill the pool; twelve is now clamped to three
before it gets there, so the break went red on a different guard —
[0019](0019-a-probe-must-be-seen-to-apply.md)'s own failure, reported by the harness rather than
found by hand. It is re-pointed at 0263's other half, the fission: a snowflake of twelve rather than
six is one shard becoming twenty-four flakes, which is the same claim in the half this decision does
not stand in front of.

## The figures

| what | value |
|---|---|
| `SHARD_VOLLEY` | 3 shards, tier-invariant |
| `crowd` | 1 · 1.15 · 1.2 |
| `standing` — the frost ship's shards | 6 |
| `standing` — the eagle's kites, its raptors | 6, 4 |

## What it moved

Widest reachable safe run, worst over the phase, for a pilot flying to it — 0 is *no place on the
lane both safe and reachable*:

| | Legendary | Savior | Burn |
|---|---|---|---|
| hydra ≤40%, before | **0.0** | **0.0** | **0.0** |
| hydra ≤40%, after | 11.0 | 6.0 | 3.5 |
| hydra ≤20%, before | **0.0** | **0.0** | **0.0** |
| hydra ≤20%, after | 7.0 | 4.0 | 1.0 |

Adds standing at the frost ship's summon phase, peak: **26 · 32 · 40 → 6 · 7 · 8**. Hostile shots
alive at the hydra's fourth phase: **104 → 32**.

**And what the axis cost the twelve fights this was never about.** Measured over all fourteen bosses,
every phase, every tier, with `crowd` as authored and again neutralised — at 1.3 it took room from ten
of them, and these were the tightest results:

| | tier | with `crowd` 1.3 | with it off |
|---|---|---|---|
| jormungandr, third phase | burn | **7.5u** | 20.5u |
| shoalMother, first phase | burn | 5.0u | 11.5u |
| harrow, third phase | burn | 3.5u | 8.0u |
| redoubt, third phase | savior | 43.5u | 61.5u |
| medusa, last phase | burn | 25.5u | 42.0u |

Nothing reached zero, so none of it is a defect and all of it is a hand's call. `burn` came down to
1.2 on the strength of that table — a fix for the ice should not quietly cost a dozen fights room it
was never about.

⚠️ **AND THE FIRST ROW IS NOT WHAT THE LOWERING FIXED, WHICH IS RECORDED BECAUSE IT WAS CLAIMED
FIRST.** `crowdFor` rounds to nearest, so a phase only moves between 1.3 and 1.2 where the two land
on different integers — 5 goes 7 against 6, 7 goes 9 against 8, and **3 is 4 at both**. The serpent's
third phase is authored at 3, so the fight the number was lowered for is untouched by lowering it.
What 1.2 buys is the wide phases; sparing a phase of three needs 1.16 or below, and that is a
different decision about how much axis is left rather than a smaller version of this one. The claim
came before the measurement and the measurement refused it.

## What this does not do

**It does not touch a wall's spacing**, and the first pass at this report did. Measured, the gap
between two frost centres is narrower than the ship is drawn — 4.25 units of slit against a 7-unit
hull at the frost ship, where the model's corridor is 2.6 — and a PR was nearly spent on it. It was
refused from play: *"get over the wall being the problem, we've discussed walls before and you keep
making the walls themselves too easy and ignoring everything else that's happening in conjunction."*
The reading is correct and is why this decision is about the load rather than the geometry: a wall's
gap is one attack measured alone, and what the player meets is several at once. The spacing finding
is recorded in the report and is not acted on here.
