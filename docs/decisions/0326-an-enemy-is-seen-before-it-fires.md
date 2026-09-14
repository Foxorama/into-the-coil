# 0326 — An enemy is seen before it fires

**Accepted 2026-09-14**, from
[`the-first-three-levels-asked`](../../reports/the-first-three-levels-asked-2026-09-14.md), the first
of its queue and not the PR the report planned:

> *"the 'announce with bullet' is the problem, enemies shoot too fast when they appear and die too
> fast without firing → sounds like an oxymoron but it's how the game feels. Enemies need to appear,
> be recognisable, then fire. So there needs to be enough enemies in a group or they need to be
> swarming in groups enough that some survive to fire."*

**Amends [0259](0259-the-bullets-stay-on-the-screen.md)** three ways: the entry volley sits behind a
window of being seen; the entry count is set in both directions, so a body about to fire anyway
waits; and a body arriving across the lane gets the same entry, which it never had. **Re-bases
0259's coverage floor**, with the reason below. **Amends
[0048](0048-a-threat-may-arrive-from-the-side.md)** in one respect: a flanker announces itself.
**The flank cap is untouched** — *"keep the cap"*, said the same day.

## The rules

**A body's first volley leaves no sooner than `SEEN_BEFORE_VOLLEY` after its hull is on the screen,
from either edge, and no later than that plus the entry gap and its slot in the deal.** Half a
second — thirty steps, five grid units — in `src/content/cadence.ts`, and the play owns the number:
[0197](0197-a-wave-arrives-as-a-wave.md) measured four tenths as the shortest gap a play-test ever
called readable, and this is a little over it. `fireEnemies` in `src/app/frame.ts` sets the count on
the entry step to the window plus 0259's own arithmetic, unconditionally. `THE SEEN WINDOW` in
`tests/bullets.test.ts` holds both bounds in seconds, on a wave forced to a one-step reload on the
way in, so the *"about to fire anyway"* case is the case measured.

**The second edge is the lane's.** A flanker is placed inside the view (0048's cap) or crosses the
leading edge while still outside the lane, where the across gate skips its volley; either way it
never had an entry, and `scripts/weigh-presence.mjs` measured level three's seventy side-entering
lancers at 0.57 volleys a body with half of them silent while visible. The entry now fires when a
body still steering in (`steerAcross`, the marker `steerEnemies` already uses) has its hull inside the
lane and did not a step ago. `and a body arriving ACROSS the lane` holds it on a flanking column.

**The window is a whole number of grid units**, or every entry volley in the game lands between the
beats ([0096](0096-the-enemies-play-along.md)); `THE PICTURE` in `tests/spawns.test.ts` reddens on any
other value and this decision's probe proves it.

**Groups in the first three levels are bigger.** Every firing wave in levels one to three: lancers
and pickets at eight, turrets and sowers at six, wardens and moths at five — the spinner alone
unchanged. Ninety-one rows in `src/content/levels.ts`, and the argument for the sizes is in the
figures below. The peak bodies alive stays at 25–27 against a pool of 40.

**Level one is judged on the loadout it can carry.** 0259's walk is the capped loadout, *"what a
player carries from the second level on"*; level one offers one weapon before its second at 1,000
([0256](0256-a-pickup-keeps-the-count.md)), so its stretches before that place are judged on a walk at
one rung and one tube. [0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md): a quantity is
checked in the case it is applied to. With the window in, the capped walk went eleven seconds dry at
716 in a stretch no player can be in with those guns.

**Three stretches in levels four to seven are re-authored, and nothing else there is.** The shoal's
end (a turret line at 3,865 for a charger column, and its two sower columns from the side), the
gauntlet's opening (a turret line at 355 for a sower, a warden line at 519 for a weaver) and the eye's
(a turret line at 461 for a sower). Each was a lead-edge closer that, with the window in, died at the
edge before it fired; a station-holder does not, and every one is a kind that level already sends.

**The coverage floor is three tenths, from two fifths.** `COVERED_FLOOR` in `tests/bullets.test.ts`,
under the lowest level again. The eight-second stretch budget does not move.

**The lattice is re-solved to 48 health, from 38.** `npm run check` found it: with the window in, the
shoal's mid-boss fight came in at sixteen seconds against the twenty its level asks, because the waves
around the fight fire later and absorb less of the ship's fire on its way to the hull.
[0269](0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md) says the health is the solver's
output and never a hand's; `scripts/solve-mid-health.mjs` was re-run and the other six sit within a
second of their targets.

## The figures

`scripts/weigh-presence.mjs`, at the capped loadout sweeping, the gentlest tier — bodies whose hull
was inside the view, how many volleys they fired while it was, and how many never did. **Before** is
`main` on 2026-09-14; **after** is this decision, groups included.

| level · kind · entered from | before: volleys / body | silent | after: volleys / body | silent |
|---|---|---|---|---|
| 1 lancer · lead | 0.78 | 27% | 0.22 | 80% |
| 1 turret · lead | 5.28 | 3% | 2.64 | 45% |
| 2 warden · lead | 1.75 | 13% | 1.16 | 36% |
| **3 lancer · side** | **0.57** | **50%** | **1.06** | **28%** |
| 3 lancer · lead | 0.57 | 52% | 0.23 | 77% |
| 3 turret · side | 5.84 | 0% | 7.87 | 0% |
| 4 turret · side | 7.00 | 0% | 7.05 | 0% |
| 6 warden · side | 2.00 | 29% | 3.25 | 13% |
| 7 gaze · side | 1.14 | 17% | 1.52 | 17% |

**Every side entry improved and every lead entry got worse, and both are the same fact.** At the
capped loadout the sweep's fan sits on the leading edge, and a body that closes down the lane is hit
the step its hull arrives; the half second it is now made to wait is the half second the fan spends
killing it. A body that enters across the lane, or holds station, is where the fan is not for long
enough to be seen and then fire. `scripts/weigh-bullets.mjs`, the same walk, a bullet on the screen
as a share of the waves' time and the longest stretch without one outside the authored quiet:

| level | before | after |
|---|---|---|
| 1 | 58%, 13.4 s (the run-up) | 38%, 13.5 s (the run-up) |
| 2 | 70%, 3.8 s | 55%, 5.7 s |
| 3 | 49%, 4.7 s | 45%, 4.7 s |
| 4 | 45%, 7.7 s | 35%, 6.1 s |
| 5 | 82%, 3.5 s | 72%, 4.1 s |
| 6 | 64%, 6.0 s | 55%, 5.5 s |
| 7 | 65%, 7.2 s | 61%, 5.6 s |

The share fell ten to twenty points everywhere. That is the price of the window at the one loadout
that kills everything it can reach, paid in as many words by the report — and the stretches, which
were the complaint 0259 answered, are all shorter than before except level two's.

## ⚠️ What was measured and rejected

**A window of four tenths of a second.** The project's own readable floor (0197). Measured: within a
point of half a second on every row and every level. It buys nothing and the play keeps the round
number.

**Bigger groups as the whole payment.** The report's own lever, and it is in — but measured on a
synthetic wave at the capped loadout, a line of eight lancers fires 1.0 volleys a body with half
silent against 0.8 and 60% for five; a column of any size loses its front rank at the edge and the
rest behind it. **Count buys the total a wave gets away, roughly in proportion; it does not buy the
share that survive.** What buys the share is side entry and holding station, which is why the three
repaired stretches use those and why the queue's next items — the arc, the flight path — are the
ones that restore presence.

**The tuned tier.** Bodies at 1.6× health: lead lancers 59–76% silent against 75–81%. The gentlest
tier stays the walk's, as the conservative side of every budget on it.

**Moving the flank cap, or a shorter window for one edge.** The cap is the player's (0048); a body
recognisable on one edge and not the other is a rule about the edge rather than about the body.

**A homing or a curving anything.** Not this decision; *"patterns only"* is the answer recorded for
the queue's third item.

## What is owed

- **A play.** Whether half a second reads as *appear, be recognisable, then fire*; whether eight
  lancers read as a group or a wall; whether the first three levels read as sparser than before at
  the guns a player actually has there, which the capped walk cannot say.
- **Presence at the capped loadout is the next two PRs' subject, not a number to move here.** The
  arc on the shot row and the arc as a flight path are what put a body where the fan is not.
- **The `unseen` column** in `weigh-presence` — bodies never inside the view — is bodies killed on
  the step their hull reached the edge, not bodies shot beyond it; the tubes emptied changed it by
  nothing. It is left in the table because it is the other half of *"die too fast without firing"*.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A constant, one branch in the
frame, rows, and a guard; nothing persisted.

## ⚠️ The proof found two, and both are worth keeping

**The window's lower bound was written as the constant divided by the step rate, and the window set
to zero stayed green** — zero is not less than zero. That is
[0027](0027-measure-the-picture-not-the-model.md)'s sentence about a guard defined in terms of the
constant it guards, arriving on the guard written the same day as the rule was re-read.
`RECOGNISABLE_SECONDS` in `tests/bullets.test.ts` is a literal half second now, with the reason beside
it; the upper bound stays derived, because it is 0259's promise and not this decision's.

**The gauntlet probe reverted one of two repairs and stayed green**: either station-holder on its own
holds that opening at 7.4 s, six tenths under the budget. The probe reverts both, and says so — a
probe that reddens on the pair and not on either half is a measurement of how much slack the stretch
has, which is [0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md)'s own note about its
probe, reached again.

**And the full proof found a third: 0096's spawn alignment is subsumed.** With the count set at the
entry in both directions, the phase a wave was dealt at spawn is overwritten before any shot leaves
— for every body a wave sends, because a lead wave always crosses the edge and a flanker always
enters the lane. 0096's probe *the first shot left unaligned* applied and stayed green. The spawn
count is a plain full reload now, the paragraph on it in `spawnWave` says why, and the probe is
deleted with the reason in its file — exactly what [0259](0259-the-bullets-stay-on-the-screen.md)
did with 0096's frozen-clock probe when the entry volley subsumed that one. The phase and the figure
live at the entry: `nextOnGrid` there, and `entrySlot`.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0326`; and `0259`, `0040`, `0043` and `0231`, whose probes anchored on
lines this decision changed and were re-anchored with the reason in each file, all prove clean:

| broken on purpose | went red |
|---|---|
| the seen window set to zero, so a body fires the moment its hull is on the screen | `THE SEEN WINDOW: a body is on the screen for half a second` |
| the entry count only ever shortened, so a body about to fire anyway fires inside the window | `THE SEEN WINDOW: a body is on the screen for half a second` |
| the across edge removed, so a flanker enters the lane with whatever count it had | `and a body arriving ACROSS the lane is seen for the same half second` |
| the seen window off the grid, so every entry volley lands between the beats | `THE PICTURE: every enemy bullet appears on a step the grid allows` |
| level one's first half judged on the capped walk it cannot carry there | `THE REPORTED ONE: at the capped loadout, no level goes` |
| the gauntlet's opening station-holders put back to the closers they were | `THE REPORTED ONE: at the capped loadout, no level goes` |

And 0259's own, re-aimed where this decision moved their subject: the entry volley removed now reddens
`THE SEEN WINDOW` rather than the dry budget, and the shoal's converted wave is the turret line at
3,865 rather than the sower at 3,405.
