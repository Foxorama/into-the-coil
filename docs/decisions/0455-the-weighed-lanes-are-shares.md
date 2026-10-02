# 0455 — The weighed lanes are shares of the lane

**Accepted 2026-10-02.** Finishes [0364](0364-the-view-zooms-out.md)'s *"an authored `lane` is a share
of the lane"* in the two instruments it missed, and in the finale, which was written after it.
Amends the floor [0260](0260-a-boss-is-fought-to-the-end.md) holds flown since
[0441](0441-a-pilot-flies-their-own-ship.md).

## The defect

0364 made `ACROSS_SPAN` 120 and put every authored lane through `laneAcross`. `scripts/weigh-boss.mjs`
kept `LANES = [20, 35, 50, 65, 80]` — *"five lanes across the fixed 100"* — and wrote them straight
into `world.ship.across`, with a default of 50; `scripts/weigh-threat.mjs` kept a copy of both. So for
nine days every weighed fight stood the ship in the near two thirds of the lane: its "middle" ten
units off the middle and nothing past 80 of 120. Through `LANES`, that skew reached
`scripts/solve-phase-bands.mjs`, the flown floor in `tests/level.test.ts` and the serpent's in
`tests/serpent.test.ts`.

The finale was written after 0364 with the same mistake in it: `PAIR.across` was 50, documented as
*"the lane's middle"*, so the two ships flew home ten units towards the near edge.

## The rule

**A place across the lane in an instrument is a share, read through `laneAcross`, exactly as it is in
the content.** `LANES` is `[20, 35, 50, 65, 80].map(laneAcross)` and the default lane is
`laneAcross(50)`; weigh-threat imports both rather than copying them, because the copy is how the old
units survived. The finale's pair stands at `ACROSS_SPAN / 2`, photographed on `rig/bench.html?finale`
with the Viper at 40% of the screen's height and the fighter at 62%, and both bubbles in frame.

## What moved

Every number below comes from running the instrument before and after on the same commit, at Savior.

**`scripts/weigh-boss.mjs`, the quickest fight from a held place:** within three seconds on six of the seven
bosses. The spread moved more than the best, because the far fifth of the lane is now stood in:

| | before | after |
|---|---|---|
| serpent, pulse: median / worst | 92 s / 313 s | 107 s / 220 s |
| serpent, shuriken: best / worst | 33 s / 158 s | 35 s / 85 s |
| quetzal, pulse: worst | 183 s | 153 s |
| hydra, median: pulse / shuriken / ray | 205 s / 69 s / never | 62 s / 51 s / 48 s |
| **medusa, ray: best** | **135 s** | **246 s** |
| medusa, shuriken: median | 415 s | never |

The hydra got shorter because it stands in the middle and the old lanes mostly stood beside it.

**`scripts/weigh-threat.mjs`:** hits a second moved by up to about a tenth. The largest moves are the
hydra's fight lengths, which follow its shorter fights, and Medusa's worst lane, which dropped from 0.42–1.24 hits a second to
0.04–0.50. The old worst place was one the corrected lanes no longer stand in.

**`scripts/solve-phase-bands.mjs`:** the bands it solves moved by at most 0.01 on every boss — the
solver's own `SETTLED`. Before this change it already disagreed with the authored content by 0.01 on Volans, Quetzal and the
hoarfrost. **Nothing is re-banded**, because a move inside the solver's tolerance is not a result.
(Quetzal's last boundary 0.25 → 0.24, the hoarfrost's 0.49 → 0.50, Medusa's 0.83 / 0.74 →
0.82 / 0.73.)

**The serpent's 28-second floor** stays green: each gun's quickest fight, with its own lane included, went from 47 / 30 / 33 /
46 s to 47 / 30 / 34 / 46 s.

## The guard that went red, and why it changed rather than the work

`0260 — a real boss lasts forty seconds … — the ray` failed with *"the ray never killed medusa from
any place, so this measured nothing."* Flown per place with a ten-minute cap, the ray kills Medusa
from **five of eleven** places (the old five, the new five and her own lane), and its 135 s came from old lane 35. That is 29 of 120, a place the
corrected set does not stand in (24 and 42 both never finish). From every corrected place it takes 246 s or never ends, and the guard's cap is 240.

**The assertion was mis-specified, not the boss.** A fixture that flew nothing throws inside
`flyFight`, when the boss never comes on or the ship dies. A null quickest is a fight longer than the
cap, which a forty-second *floor* cannot fault. Failing it reddens the guard for a boss that is
**further** from what the guard is about, and a guard that a correct change reddens is not holding an
invariant ([0192](0192-a-guard-holds-an-invariant.md)). Both copies — this one and the serpent's —
now pass a gun that outlasts the cap from everywhere. **The cost:** a gun that did no damage at all to
a boss would pass the floor too. A floor never caught that and was never the place to.

Raising the cap to 300 was rejected. It sizes the instrument to today's 246 s, and the next correct
change that slowed the ray further would redden it the same way.

## What was checked and left

Fixtures that stand the ship at a literal across — `tests/hydra.test.ts`'s 50, `tests/pilots.test.ts`'s
enemy and ship both at 50, `tests/muzzles.test.ts`'s *far side from the boss*, the two lanes 15 and 85
in `tests/level.test.ts`, `tests/paths.test.ts` and `tests/roam.test.ts` — place the ship and what it
meets in the same frame, or pick two distinct places. None of them claims the middle, and none weighs
anything.

`tests/sheet.test.ts`'s note said 0023 *"clamps lookahead to 178–240 units"*. It now says 1.78–2.4 lane
widths, which is 213–288 units since 0364. Its px/unit figures are left as the first run's, and labelled as that.

## Why no guard

`LANES` is now an expression of `ACROSS_SPAN`, so the next zoom carries it. A test that the middle lane
is `ACROSS_SPAN / 2` would assert that the code agrees with itself ([0027](0027-measure-the-picture-not-the-model.md)).

## What this leaves owed

- **The ray barely touches a parked Medusa.** It is 246 s at best and never from most places, against 41–68 s for
  the other guns' best — and every gun's median there is *never*. It sits beside state-of-play's *"the medusa is nearly immune to the
  shuriken"*: both are parked-ship numbers, and neither has been flown with a moving pilot
  (`scripts/weigh-presence.mjs`'s sweep). That is a question for a play, and no number is moved here.
- **The phase-band solver diverges on Medusa, before this change and after it.** It drives her last
  band to 64% of her health. The content holds 0386's 19 21 20 19 21, and the 0400–0404 rework is
  likely what the solver no longer describes. Not answered here.
- **A look at the finale**, where the pair now flies home across the middle of the screen.
