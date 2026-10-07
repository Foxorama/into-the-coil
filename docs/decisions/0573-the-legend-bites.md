# 0573 — The Legend bites

**Accepted 2026-10-07.** A play of Legendary Pilot, six items. Amends
[0532](0532-the-legend-holds-longer.md) (Legend's mid-bosses, and a second per-fight literal beside its
`bossToughness`), [0311](0311-the-acid-and-the-void-come-as-one-ball.md) and
[0322](0322-the-ball-is-worth-shooting.md) (the serpent's ball is born big, shrinks as it eats, and is
thrown two at a time to heights of their own), and [0459](0459-the-bosses-are-placed.md) (the Black
Heart's hostile ink).

## The ask, and what was done

| # | asked | done |
|---|---|---|
| 1 | *"all bosses need like +10/15% for the final 1-2 stages, they die before they even get an attack off at the moment, hydra in particular, but it's all bosses"* | Legend's end bosses hold a further **0.15 of their bar in their tail** — the phases from the first whose `upTo` is at or under 0.4. One stage on most, two on the hydra. Nothing before the tail moves. |
| 2 | *"minibosses die too fast as well and in particular die really fast to the lightning gun"* | Legend's mid-bosses **1.5 → 1.7**, still under Savior's 1.8. Every mid-boss row weighs the arc for itself, so it is as quick as the other guns at their best and no quicker. |
| 3 | *"serpent boss phase 3 needs a few more poison bubbles happening and in random heights across the screen"* | The lob throws **two balls**, each aimed to burst at a height of its own. The heights are rolled on a new stream, `lobRng`. |
| 4 | *"poison bubbles need to start bigger and then shrink as they get hit to match the size of the explosion"* | Born at radius **5.4** (it was 3.6, and grew to 5.4 as it ate). Shrinks to **a third** as its appetite is spent. |
| 5 | *"jellyfish lightning and bullets are really hard to see on the end of level 7 still"* | The Black Heart's plasma and lasers are **green, `#5aff8c`**. They were `#ffe84a`, the yellow of the player's own fire. |
| 6 | *"legendary difficulty -> reduce starting/total lives to 3 instead of 5"* | **3**. Burn keeps 2 and Savior 3, so Legend and Savior now start with the same lives. Legend still opens every life on a full shell (0355). |

Items 1, 2 and 6 are Legend's row. Items 3–5 are content, so they apply on every tier: a tier changes
toughness, not the script (0047). The player chose that when asked.

## 1. The tail

Three readings were put to the player before building: +15% on each of the last stages, +15% on the
whole fight, or a fifteenth-ish of the whole bar spent in the tail. They chose the third.

**It is a damage scale, not a bigger bar.** A hit landing in a tail that spans `s` of the bar is worth
`s / (s + bossTail)` of itself. That adds exactly `bossTail × full` to the fight, and every phase still
turns at its own `upTo`, so the bar still reads as a share. `landsOn` in `src/app/boss.ts` is the one
call. The five damage paths in `src/app/frame.ts` already read one multiplier, `openBy(phaseFor(…))`,
and each now reads `landsOn` instead. So the guns, missiles, blade, bomb, rift, storm and nova all
hold the tail, and no path can skip it.

**The tail starts at the first phase at or under 0.4 of the bar** (`TAIL_FROM`). The player said
*"the final 1-2 stages"*: one stage on a boss whose last opens at a quarter, two on the hydra (0.4 and
0.2). A share of the bar does that. A count of phases does not.

**End bosses only.** The ask names *"all bosses"*, then *"minibosses … as well"*. The mid-boss gets its
own answer (item 2), so `bossTail` is per fight like `bossToughness`. Legend's mid-boss tail is 0.

Flown with `scripts/weigh-boss.mjs --difficulty=legendary` (ship unhittable, missiles off). This is
the best of fifteen held places, from the tail's first second to the kill, before → after:

| boss | tail spans | arc | pulse |
|---|---|---|---|
| serpent | 0.4 | 8 s → 12 s | 20 s → 28 s |
| fish | 0.15 | 4 s → 8 s | 4 s → 8 s |
| quetzal | 0.25 | 8 s → 12 s | 24 s → 38 s |
| gyre | 0.25 | 7 s → 12 s | 7 s → 11 s |
| frost ship | 0.25 | 7 s → 11 s | 16 s → 25 s |
| hydra | 0.4 (two stages) | 11 s → 16 s | 14 s → 19 s |
| jellyfish | 0.31 | 6 s → 8 s | 6 s → 10 s |

The phases above the tail begin on the same second as before, within two seconds. Two rows moved that
much because the best of the fifteen places changed.

## 2. The mid-bosses and the arc

Flown as a lone fight on the boss's lane at Legendary, held 60 and 30 units short (a scratch rig over
`flyFight`). At 1.5, held 30 short:

| mid-boss | pulse | shuriken | ray | **arc** |
|---|---|---|---|---|
| sentinel | 5.4 s | 4.8 | 3.9 | **3.4** |
| harrow | 6.1 | 6.1 | 5.8 | **3.3** |
| shoal mother | 5.6 | 5.9 | 5.5 | **2.5** |
| lattice | 4.3 | 6.7 | 6.4 | **2.0** |
| redoubt | 9.1 | 9.2 | 8.0 | **7.2** |
| chorus | 8.5 | 8.7 | 7.7 | **4.4** |
| axis | 10.7 | 10.4 | 8.9 | **8.1** |

The arc reads the same at 60 units as at 30. The others slow by half again at 60. So the arc was the
quickest gun on every mid-boss, by two to three times on four of them, with nothing to aim.

**Each mid-boss row authors `gunWeights.arc`** (0372's field): `1.5 × arc ÷ the median of the other
three` at 30 units. That gives sentinel 1.06, harrow 0.81, shoal mother 0.67, lattice 0.47, redoubt
1.19, chorus 0.78 and axis 1.17. The end bosses solved their own weights in 0372 and are untouched.
After, at 1.7: the arc kills in **6.4–12.4 s**, against 5.1–12.8 s for the others at 30 units. The
Catherine wheel is slow on mid-bosses at every distance, and that is not this decision.

**These weights are tuning numbers and nothing guards them** (0192). A play may move any of them.

The mid-boss window is 25 seconds (0502), and 0532 measured fights already overrunning it. At 1.7 they
overrun further on the slowest guns. Past the window the adds come back, as 0502 says.

## 3–4. The ball

**Born at the size it used to grow to.** The burst already scaled with what was left: `burstMaw`
throws the share of the appetite still unspent as the share of the ring. The ball did the opposite and
swelled as it emptied, so the biggest ball on the screen held the smallest burst. Now it is born at
5.4 and `swallows.swell` is 1/3. `bite` (0322) spends that per point of damage either way, so the size
still depends only on damage eaten, never on how many shots ate it. The drawing is 21.6, four times the
hurtbox, as before.

**Two a throw, aimed where they burst.** A ball comes apart at its row's `swallow.at` from the near
edge of the view (0311). So each ball leaves the mouth on the line to that edge at its own height, and
it is at that height when it bursts. That is where the player has to move. The lane inside a tenth of
either edge is split into one share per ball, with an eighth of the lane between shares, and each ball
rolls its height within its share. Rolled anywhere, two balls land on one height now and then, which is
one wall twice the size.

With 0365's growth on top, the round is two balls and a strike above 0.3 of the bar. Under 0.1 it is
eight balls and a strike.

**0311 argued against more than one ball,** and its reason was the opening gun of the time, which could
not clear one. A ship has opened at its cap since 0441. Each ball is 13.2 points, and the capped pulse
lands about a point a step.

**A new stream, `lobRng`**, threaded beside `rainRng`, `breakerRng` and `beamRng` (0021). A height
rolled on the lightning's stream would move every strike after it.

## 5. The Black Heart's plasma

Photographed on the bench at Legendary, at 1920×1080. The fight is dark enough for yellow: at its
worst twentieth of ground, `#ffe84a` held 3.6:1. Two things were wrong:

- The ring phase's plasma is born **inside the bell**, and in the 0.63 phase the bell is yellow
  (`boss14Yellow`).
- `#ffe84a` is **25 ΔE from the player's amber shot (`#ff9f1c`) and 7 from the hazard yellow.** With
  the ship firing, the jellyfish's plasma and the pulse looked like one stream of yellow dots.

Candidates were scored with a scratch instrument. It samples 16,000 pixels of four photographs of the
fight and measures each ink against them (CIEDE2000 and luminance ratio, worst twentieth), then
against every ink sharing the screen.

| ink | ΔE ground p5 | ratio p5 | vs player fire | vs player hull | vs hazard | vs glass |
|---|---|---|---|---|---|---|
| `#ffe84a` (was) | 50 | 3.62 | **25** | 45 | **7** | 48 |
| `#5aff8c` | 56 | 3.46 | 50 | 36 | 34 | 41 |

Violets read weaker on the ground (ratio about 2), and white sat on the impact flash. Green is near
the acid's lime and the frost's teal, but neither is thrown in the Black Heart. The raiders' clots take
the same ink, since a hostile bullet takes its place's colour (0295).

**Also measured, not changed.** Against the player's amber, the Labyrinth's gold slab is ΔE 17.5, the
Rime Shelf's ember 21.7 and the Saurian Belt's 26.5. That is as close as the Black Heart was or
closer. Nobody has reported them.

## Rejected

- **Raising Legend's end-boss `bossToughness` instead of a tail.** That stretches the opening as much
  as the end, and the report is about the end.
- **The tail as a count of phases.** It is one stage on one boss and four on another for the same
  number.
- **Lowering the arc's own `bossWeight`.** The arc is in line on the end bosses (0372 solved each one).
  The fault was only on hulls nobody had weighed.
- **Two balls rolled anywhere on the lane.** Sometimes they stack.

## What is owed

**A play of Legendary.** Check that each end boss gets its last attack off. Check the mid-bosses at 1.7
with the arc and with one other gun. Check the serpent's last phase with two balls, the Black Heart in
green, and three lives.

**The player may veto** the green, any arc weight, or the two balls on Burn, where they fly at Burn's
shot speed.

**A question for the player:** should the Labyrinth's, the Rime Shelf's and the Saurian Belt's shots move
off the amber too?

## Rollback

None needed: no storage key, schema or shipped surface. Lives are read from the tier row when a run
starts, and a run in progress keeps its count.
