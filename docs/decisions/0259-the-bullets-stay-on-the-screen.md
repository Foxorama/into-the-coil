# 0259 — The bullets stay on the screen

**Accepted 2026-09-06**, the same day as [0258](0258-one-pilot-a-level.md), from
[`the-alpha-list`](../../reports/the-alpha-list-2026-09-06.md):

> *"the bullet firing waves are still clustered together, especially now with the minibosses.
> Basically, there's either a screen full of bullets or there's 30secs of no bullet to be seen at
> all. All the levels need to have their wave spacing rejigged to make the game have a lot more on
> screen bullet time → not necessarily more bullets on screen, but more time for bullets overall to
> be on screen."*

**Amends [0096](0096-the-enemies-play-along.md)**: a body's first volley is on entering the view,
not a reload after it. **Amends [0231](0231-a-level-is-a-mix.md)**: the mix is measured in seconds
of bullet on the screen, not in waves of one class. **Amends [0110](0110-an-attack-is-a-pattern.md)**
in one row: the sentry reloads slower. **Amends [0098](0098-a-wave-plays-a-figure.md)**: a formation
is made a figure by the deal at entry, not by the spread at spawn — see below.

## ⚠️ Measured first, and the waves were not the quantity

[0027](0027-measure-the-picture-not-the-model.md) owes the instrument before the first tuning pass
on anything the player watches move, and this is the pass it was owed for. `scripts/weigh-bullets.mjs`
drives every level through the real frame — the real spawner, the real guns, an immortal ship
sweeping the lane — and counts, step by step, whether any enemy shot is inside the view. Two
findings, and the second is the decision:

- **At the base ship, parked mid-lane, a bullet is on the screen 45–88% of every level** and no
  stretch outside level one's run-up is dry for eight seconds. The wave tables were already a mix
  (0231). The report was not about the tables.
- **At the capped loadout with the ship sweeping, the same levels are 30–74% and go 9–17 seconds
  dry.** A firing kind spawns beyond the view with a whole reload ahead of it, spends most of that
  reload out of sight — 0096 keeps its clock running, so it *skips its turn* — enters mid-count, and
  a capped ship kills a two-hit body inside a third of a second of it being seen. Most of what could
  fire never fired on the screen. *"A screen full of bullets or thirty seconds of none"* is what
  that looks like: bullets come from the bodies the sweep misses, in bursts.

## The rules

**A body announces itself by firing.** On the step a firing body's hull crosses the leading edge of
the view, its first volley is pulled inside `ENTRY_VOLLEY` — two grid slots, an eighth to a fifth of
a second — plus its own slot in the deal below; a body about to fire anyway keeps its count.
`fireEnemies` in `src/app/frame.ts`; `ENTRY_VOLLEY` in `src/content/cadence.ts`. The reload after it
is the row's, on the grid, as before. `THE ENTRY VOLLEY` in `tests/bullets.test.ts` holds the
seconds — one slot was measured first and was the unison 0098 reports; a three-slot window left a
capped ship time to kill the body before its volley.

**A wave's members are dealt across `ENTRY_SLOTS` grid slots behind that window, by index.** `e.entrySlot`
is `i % ENTRY_SLOTS`, set beside the cadence spread in `spawnWave` and in `summonAdds`. Three slots,
because `abreastCap` puts at most three FIRING bodies in a rank and `THE ENTRY VOLLEY` computes that
from `src/content/formations.ts` rather than restating it. Member 0 always holds slot 0, so a wave
still announces itself inside the window above and a body flying alone waits nothing extra — which
is the difference between a deal and the wider window this decision measured and refused.

**No level goes eight seconds without a bullet on the screen, at the capped loadout, outside the
opening and level one's run-up; and a bullet is on the screen at least two fifths of the waves'
time.** `THE REPORTED ONE` and `COVERED_FLOOR` in `tests/bullets.test.ts`, over the instrument's own
walk — seeded and fixed-step, so it is the same walk on every machine. Both are budgets and the
report owns the numbers: eight is what every level measures under, two fifths is under the lowest.

**One wave converted.** The shoal's charger column at 3,405 is a sower column: the stretch from
3,290 to 3,463 was three non-firing waves in a row — 0231's limit — and the level's longest dry
stretch at the capped loadout even with the entry volley. The shoal is authored from chargers and
drifters for speed, and it is the level that sets the budget.

**The sentry reloads every 108 steps, from 90.** A body fires once more on entering the view, and
the sentry's wall of four was at the edge of the thirty bullets a body may put on the screen while
it is visible (`tests/pilots.test.ts`, which now counts the entry volley). 0110's own trade: a
pattern may be more bullets and must not be more volleys.

## ⚠️ The deal is a repair, and `npm run prove` is what found what it repairs

This decision first shipped with the entry slot **folded out of the body's own count** —
`fireIn % ENTRY_VOLLEY` — which is two slots however many bodies enter on the step. The proof of the
rebased branch reported two probes that **applied and reddened nothing**, which is
[0019](0019-a-probe-must-be-seen-to-apply.md)'s whole subject:

- **[0098](0098-a-wave-plays-a-figure.md)'s share, dropped, changed nothing.** Its fixture is a
  `column`, and a column's `alongOffset` puts every member an `ALONG_GAP` behind the one in front —
  five bodies, five entry steps, and the geometry spreads them whatever the share does. Re-aimed at a
  `line` — bodies abreast, entering on ONE step, which is what *"they all fire at exactly the same
  time **when they appear**"* describes — the guard went red on this decision's own build: **three of
  five fired together, and the opening covered 100 ms against the guard's 150 ms floor.** Three
  bodies cannot be dealt into two slots. That is the defect; `ENTRY_SLOTS` is the fix, and the guard
  keeps the abreast fixture because that is the case the report was always about.
- **[0096](0096-the-enemies-play-along.md)'s frozen clock, restored, changed nothing either.** The
  entry volley sets the first shot through `nextOnGrid` and every reload after it is a whole number
  of grid units, so what a body's count did on the way in is overwritten before a shot leaves: the
  freeze can no longer put a volley off the grid. **That probe is deleted, with the reason in the
  file** — [0192](0192-a-guard-holds-an-invariant.md) asks one edit and a reason to demote, and a
  probe that cannot redden anything is cover that is not there. `THE PICTURE` keeps this decision's
  own probe over the entry volley landing off the grid.

⚠️ **Both were green before the rebase and both are consequences of this decision, not of the branch
under it.** A guard that stops biting does not announce itself, and neither did these — the suite was
green, the figures were the ones tabled below, and the only thing that said otherwise was the harness
that breaks the code on purpose.

## The figures

At the capped loadout, the ship sweeping — a bullet on the screen as a share of the waves' time,
and the longest stretch without one:

| level | before | after | with the deal |
|---|---|---|---|
| The Approach | 46%, 13.7 s | 59%, 13.6 s — the run-up, authored quiet | 58%, 13.4 s |
| Ember Nebula | 54%, 9.4 s | 70%, 3.9 s | 70%, 3.8 s |
| Saurian Belt | 43%, 11.0 s | 50%, 4.8 s | 51%, 4.7 s |
| The Labyrinth | 30%, 16.9 s | 44%, 7.5 s — the opening | 45%, 7.7 s |
| Rime Shelf | 74%, 6.6 s | 82%, 3.5 s | 82%, 3.5 s |
| The Toxic Mire | 54%, 12.4 s | 63%, 6.0 s | 64%, 6.0 s |
| The Black Heart | 61%, 16.2 s | 68%, 7.2 s | 67%, 7.2 s |

⚠️ **The deal costs nothing, and that is the column's whole job.** Dealing a rank across three slots
moves the second and third of it by a tenth and a fifth of a second, and the argument against the
wider window was that delay applied to EVERY body — so the figures are the check that the
distinction is real and not a story. Every level lands within one point of where it was.

## ⚠️ What was rejected

**Re-authoring every level's wave order.** 0231 already alternates the classes and the tables
measured as a mix at the base ship; the dry stretches were made by the guns, not the tables, and a
reorder would have moved every wave in the game to change a number that was not the cause.

**Firing on entry with no gap.** One grid slot puts every member of a formation on one step, which
is 0098's report — *"the enemies all fire at exactly the same time when they appear."*

**More bullets.** The ask says so in as many words. Every count and cadence but the sentry's is
where it was; what moved is WHEN the first volley leaves.

## What is owed

- **A play.** Whether a body that fires as it appears reads as fair — the bullet is fired at the
  edge and takes over a second to cross — and whether two fifths of the time reads as *bullet time*.
- **A rank arriving abreast**, which is the case the deal exists for and the one no play has seen:
  three turrets in a `line` now open over a fifth of a second instead of on one step. Whether that
  reads as a figure or still as a wall is a thing to watch, not a number to check.
- **The Approach's run-up** is still thirteen seconds of nothing firing, by 0086's decision. If the
  report comes back about level one, that decision is the subject.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A constant, one branch in the
frame, one row's cadence and one wave's kind; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0259`, and its two neighbours with it — `0096` (four probes, one
deleted) and `0098` (five, one re-aimed at the deal) both prove clean:

| broken on purpose | went red |
|---|---|
| the entry deal flattened, so a rank opens fire as one volley again | `0098 — THE REPORTED ONE: a formation opens fire as a figure rather than as one volley` |

And this decision's own:

| broken on purpose | went red |
|---|---|
| the entry volley removed, so a body enters the view with its whole reload ahead of it | `THE REPORTED ONE: at the capped loadout, no level goes` |
| the entry gap cut to one grid slot, so a formation fires in unison | `THE ENTRY VOLLEY: a body fires inside a third of a second` |
| the shoal's sower put back to a charger, so its last stretch runs past the budget | `THE REPORTED ONE: at the capped loadout, no level goes` |
| the entry volley set without the step it is decremented on, so it lands off the grid | `THE PICTURE: every enemy bullet appears on a step the grid allows` |
| the sentry reloading at 90 again, so its wall goes over the on-screen bullet budget | `and nothing gets more volleys away at the player than a player can read` |
