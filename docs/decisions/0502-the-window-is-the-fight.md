# 0502 — The window is the fight

**Accepted 2026-10-04.** **Amends [0267](0267-a-fight-thins-the-waves-over-it.md)**: nothing is
thinned while a mid-boss lives, and both its guards are deleted. **Amends
[0472](0472-the-fights-thin.md)**: `FIGHT_LEAD` is kept and stops at the mid-boss's own place, and
three mid-boss healths are re-solved. **Keeps [0269](0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md)**:
the healths are still the solver's output. **Amends [0259](0259-the-bullets-stay-on-the-screen.md)'s
dry budget and [0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md)'s density guard**: a
mid-boss's window is a quiet decided on purpose, read as the opening is.

## The ask

> *"mire felt really weird with the overlap as it was heavy at the front of the level and then hardly
> any waves near the end and I assume it's similar for a lot of levels, so if we can balance that out
> a bit it'd be pretty sweet."*

On how long a mid-boss takes them:

> *"depending on the weapon anywhere between 10-25 secs or so. so let's go with 25 secs and if you
> take longer to kill the miniboss you get increased difficulty with adds"*

Asked what an early kill should leave — the waves resuming at once, the camera speeding through the
gap, or the gap left empty — the player chose: *"Leave the gap empty."*

## What was true

Measured with a scratch instrument that walks every level through the real frame at 1920×950 with an
immortal ship sweeping the lane between fights and parked under a mid-boss during one, binning what is
on the screen into tenths of the level.

- **A wave and a mid-boss are put down on one horizon.** `spawnAlong` is the camera plus 328, so a wave
  authored at `at` is put down when the camera reaches `at − 328`, and the mid-boss is put down the
  same way at its own `at`. The camera never stops for a mid-boss: 36 units a second throughout.
- **So every second of fight deleted 36 units of script.** 0267 skipped two firing waves in three put
  down while the mid-boss lived, and 0472 counted the 190 units before it as the fight's too. A slow
  fight hollowed out the middle of every level, at whatever length the player took.
- **And every level ended on a hole.** The last wave stood 210–260 short of `bossAt`, so for the last
  ten seconds before the end boss was put down nothing new was, and the end boss then takes eight to
  nine seconds to arrive.
- **The front was heavier than the back in four levels of seven**, at Savior with the guns on — bodies
  on the screen, mean over the first three tenths against the last four: the Approach 4.8 against 2.8,
  Ember Nebula 5.8 against 2.7, Rime Shelf 3.1 against 2.4, the Black Heart 8.4 against 4.4.
- **The Mire's 434–868 was the most densely authored stretch in the game**, twelve bodies a hundred
  units against eight to ten elsewhere: five waves 27 apart at 739–848 (two of them 0113's fillers),
  and turrets of five at 355 and 767 where 0472 had cut every later turret to four.

## The rule

**Each mid-boss has a window: the seconds of fight its level is written for.** `MidBoss.windowSeconds`
in `src/content/levels.ts`, on the row ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)
— a level may be written for a longer fight without the others moving). Every row says 25, the
player's number. `windowEnd` turns it into a place at a rate the caller hands it, because the step
rate belongs to `src/state/` ([0015](0015-the-layer-ladder.md)).

**No wave is authored inside the window.** From the step the mid-boss is put down, nothing new is put
down for its window — whether the hull dies at once or lives through it. *"Leave the gap empty."*

**The window is the gap.** The script resumes when the window closes, inside a second of it.

**Past the window the waves come as authored, while the mid-boss lives.** *"Increased difficulty with
adds."* Nothing is thinned over a live mid-boss any more.

**The lead is kept.** A firing wave authored in the 190 units before a mid-boss still flies in with
the hull, which is what 0472 measured and what the window — a stretch after the hull — does not touch.
So 0472's one-in-three still thins it, and `ahead` now stops at the mid-boss's own `at`; it used to run
on for as long as the hull lived, which is the half this decision takes.

## How it is built

**As authoring, not as a spawn rule.** The mid-boss and the waves share a horizon and the camera
never stops for the fight, so *nothing put down for 25 seconds* is *nothing authored for 900 units of
camera* exactly. A spawner that held waves back would put them where nobody authored them — the
defect the note on `at` records — and, as 0267 found, a held wave never leaves the spawn loop.

**Every level's script from its mid-boss on is re-laid**, by a scratch script and then by hand into
the tables:

- the waves from the mid-boss's `at` to the last are the same script in the same order, each keeping
  its gap to the wave before it, scaled into **one unit past the window's end to 190 short of
  `bossAt`** — the last wave as late as it can stand without flying in with the end boss, on
  `FIGHT_LEAD`'s own measure;
- **less the firing waves 0267 skipped over a 25-second fight**, which no player who fought that long
  had ever met — two in three of those offered while the hull lived, counted from its lead as the
  counter did. A removal that would have made a run of more than `MIX_RUN` waves of one class was
  refused, so the Approach lost three of five and the Labyrinth one of four;
- **the Mire's front**: its two 0113 fillers moved from 794 and 821 to the back, where it was thin;
  the turret at 767 moved to 794 so 739, 794 and 848 stand 55 apart; the turrets at 355 and 794 are
  four. Its back is laid evenly, as it already was.

| level | window | the script past it, was → is | waves past it | bodies, level |
|---|---|---|---|---|
| The Approach | 1549–2449 | 1594–4060 → 2450–4080 | 45 → 42 | 415 → 393 |
| Ember Nebula | 1599–2499 | 1629–4110 → 2500–4130 | 48 → 44 | 428 → 403 |
| Saurian Belt | 1549–2449 | 1598–4016 → 2450–4080 | 44 → 37 | 412 → 365 |
| The Labyrinth | 1519–2419 | 1565–3980 → 2420–4050 | 43 → 42 | 350 → 344 |
| Rime Shelf | 1519–2419 | 1565–3980 → 2420–4050 | 43 → 36 | 289 → 261 |
| The Toxic Mire | 1619–2519 | 1672–4085 → 2520–4150 | 45 → 40 | 372 → 336 |
| The Black Heart | 1044–1944 | 1049–4206 → 1945–4270 | 60 → 56 | 422 → 399 |

**Three mid-bosses are re-solved**, `scripts/solve-mid-health.mjs`, because the waves that used to be
put down over a fight were soaking up its fire: with none, the redoubt, the chorus and the axis died
in 19, 18 and 19 seconds against the 21, 22 and 23 their levels ask. Redoubt 329 → 359, chorus 237 →
284, axis 414 → 507; the second pass reads 21, 22 and 22. The other four were within a second.

## The figures

Savior, guns on, each mid-boss at its natural health — bodies and live enemy bullets on the screen,
the mean over the first three tenths of the level against the mean over the last four. *Kept* is the
first build of this decision, every authored body moved; *shipped* is the one above.

| level | bodies before | kept | shipped | bullets before | kept | shipped |
|---|---|---|---|---|---|---|
| The Approach | 4.8 / 2.8 | 4.8 / 4.9 | 4.8 / 3.8 | 4.5 / 2.6 | 4.5 / 8.9 | 4.5 / 8.8 |
| Ember Nebula | 5.8 / 2.7 | 5.8 / 7.0 | 5.8 / 6.1 | 7.6 / 5.5 | 7.6 / 11.0 | 7.6 / 11.4 |
| Saurian Belt | 3.9 / 4.3 | 3.9 / 7.7 | 3.9 / 7.3 | 7.6 / 9.8 | 7.6 / 16.9 | 7.6 / 17.2 |
| The Labyrinth | 5.0 / 6.3 | 5.0 / 9.5 | 5.0 / 9.3 | 6.1 / 11.0 | 6.1 / 19.2 | 6.1 / 21.9 |
| Rime Shelf | 3.1 / 2.4 | 3.1 / 4.8 | 3.1 / 4.0 | 9.5 / 9.4 | 9.5 / 16.8 | 9.5 / 15.2 |
| The Toxic Mire | 4.1 / 4.5 | 3.7 / 8.4 | 3.7 / 6.0 | 5.7 / 12.2 | 5.2 / 21.1 | 5.2 / 15.5 |
| The Black Heart | 8.4 / 4.4 | 8.4 / 7.8 | 8.4 / 6.5 | 12.6 / 10.8 | 12.6 / 19.9 | 12.6 / 15.7 |

**The fight, and what is put down over it**, by the same walk — the mid-boss's health scaled per
level until the guns-on fight measured about 25 and about 40 seconds (three passes of a ratio, the
closest kept; the seconds are what was measured, not what was asked):

| level | Savior, natural | Savior, ~25 s | Savior, ~40 s | Burn, natural |
|---|---|---|---|---|
| The Approach | 14 s, 6 waves → 14 s, 0 | 25 s, 10 → 24 s, 0 | 40 s, 18 → 37 s, 11 | 26 s, 11 → 24 s, 0 |
| Ember Nebula | 18 s, 8 → 17 s, 0 | 26 s, 12 → 24 s, 0 | 39 s, 17 → 39 s, 13 | 30 s, 14 → 30 s, 5 |
| Saurian Belt | 18 s, 5 → 18 s, 0 | 25 s, 8 → 25 s, 0 | 41 s, 15 → 37 s, 9 | 28 s, 10 → 25 s, 1 |
| The Labyrinth | 18 s, 9 → 18 s, 0 | 24 s, 10 → 22 s, 0 | 42 s, 20 → 42 s, 16 | 40 s, 19 → 56 s, 28 |
| Rime Shelf | 24 s, 8 → 20 s, 0 | 25 s, 8 → 23 s, 0 | 39 s, 13 → 39 s, 11 | 35 s, 12 → 33 s, 7 |
| The Toxic Mire | 19 s, 7 → 21 s, 0 | 25 s, 9 → 28 s, 3 | 40 s, 16 → 45 s, 18 | 32 s, 12 → 31 s, 6 |
| The Black Heart | 20 s, 9 → 22 s, 0 | 25 s, 11 → 26 s, 1 | 40 s, 18 → 46 s, 19 | 33 s, 14 → 38 s, 12 |

Before, the waves put down over a fight were the thinned remainder of the stretch the camera crossed;
after, a fight inside its window has none, and one past it has every wave the window's end reached.

## ⚠️ What it changes that was not asked for

- **The back of every level carries more bullets than it did**, 1.3 times (the Mire) to 3.4 times
  (the Approach, from 2.6 live to 8.8), and more than the front in every level. The bodies balanced; the bullets went past balance, because the window's waves
  were firing-heavy — they were written under a thinning that let a third of them through — and the
  ones a 25-second fight did meet now play in the open. The Labyrinth and Saurian Belt rose most.
- **A slow fight gets slower.** Adds absorb the shots meant for the hull, so a fight past its window
  runs longer and meets more adds: at Burn the lattice went from 40 to 56 seconds, and the 40-second
  fights at Savior ran to 45–46 in the Mire and the Black Heart.
- **At Savior an average kill leaves two to eleven seconds empty**, the window's remainder after
  fights of 14–23 seconds. That is the gap the player chose.
- **The authored body count fell by 2–11%**, the waves no 25-second fight had met.
- **The first wave after the window is seen about two seconds after the window closes**, as every
  wave is seen about two seconds after it is put down; the mid-boss arrives the same way, so the window
  is twenty-five seconds from seeing one to seeing the other.

## Rejected

- **Holding the waves while the mid-boss lives.** Offered as *resume when it dies* and declined in
  favour of an empty gap. A held wave arrives where nobody put it, and never leaves the spawn loop.
- **Flying through the gap on an early kill**, the camera speeding up to the window's end. Declined by
  the player; it would also move the music's sections and the landmarks off the places they are
  authored against.
- **Resuming the waves at once on an early kill.** Declined by the player. A probe builds it.
- **A cap on how many waves may be on the screen at once.** A ranking threshold answering the
  question before it is asked — [0295](0295-a-ranking-guard-is-a-content-limiter.md). The figures
  above are how the next pass reads density.
- **Keeping 0267's thinning past the window.** The player asked for the opposite.
- **A window as a constant.** [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md):
  every row says its own.
- **Moving every authored body**, *kept* in the table. Built and measured first: it raised the back
  further for waves no player had met. ⚠️ It is the player's to choose between the two, and *kept* is
  a revert of the removals.
- **Lengthening each level by 25 seconds** so nothing is compressed. `bossAt`, the music's sections,
  the landmarks, the Labyrinth's corridor and the Mire's bank are all authored against the length.

## Guards

**Added**, `tests/window.test.ts`, every level flown through the real frame twice — the mid-boss
killed on its first hit, and held alive to the end of the script — and every assertion in seconds:

- `THE REPORTED ONE: after a mid-boss arrives nothing new is put down for its window, however soon it dies`
- `and the window is the gap: the script resumes when it closes, not later`
- `and past the window every wave comes as authored while the mid-boss still lives — the adds`
- `and every level is written for the twenty-five seconds the player asked for` — a literal, so a
  window set to nothing cannot pass by agreeing with itself ([0027](0027-measure-the-picture-not-the-model.md)).

Invariants ([0192](0192-a-guard-holds-an-invariant.md)): a wave inside the window is what the player
declined, and a later first wave is a window the row does not say.

**Changed**, each with the player's words:

- `tests/level.test.ts`, *keeps enough on screen at once to be a shooter*: skips every view that takes
  in a window, the third quiet decided on purpose after the opening and the run-in to the boss.
- `tests/bullets.test.ts`, *no level goes DRY_BUDGET_SECONDS without a bullet*: a window is a second
  opening — a dry stretch ending between the mid-boss's put-down and its window's first wave plus a
  view's crossing is not held. The walk kills the hull at once, so it flies the whole window.

**Deleted**, with `tests/fight.test.ts` and `scripts/probes/0267-*.mjs`:

- *and they never stop, so the fight is not a duel in an empty lane* — *"leave the gap empty"* is
  that duel, chosen.
- *THE REPORTED ONE: firing bodies arrive more slowly during a mid-boss fight than before it* — inside
  the window the new guard is stronger (nothing at all); past it, *"increased difficulty with adds"*
  asks for the opposite, so a correct change reddens it and it is not an invariant. 0267 is in
  `WITHOUT_PROBES` with the reason.

**Probes re-anchored**: 0247's two (the sentinel's row, the axis's health), 0269's (the redoubt's
health) and 0040's density break, which now thins the Approach's teaching stretch — the three waves
it thinned moved past the window, where the level is now dense enough that thinning three leaves
eight in a view.

## Confirmed, not assumed

`npm run prove 0502`:

| broken on purpose | went red |
|---|---|
| a wave authored inside the chorus's window | `THE REPORTED ONE: after a mid-boss arrives nothing new is put down for its window` |
| the script resumed the moment the mid-boss dies | `THE REPORTED ONE: after a mid-boss arrives nothing new is put down for its window` |
| the script resuming a second after the window closes | `and the window is the gap: the script resumes when it closes, not later` |
| the firing waves thinned again while the mid-boss lives | `and past the window every wave comes as authored while the mid-boss still lives` |
| every wave skipped while the mid-boss lives | `and past the window every wave comes as authored while the mid-boss still lives` |
| the chorus's window cut to twenty seconds | `and every level is written for the twenty-five seconds the player asked for` |

⚠️ **No probe for *hold the waves while the mid-boss lives*.** It hangs the spawn loop rather than
reddening a guard, as 0267's notes recorded; its skipping form is the fifth row.

## Owed

- **A play of every level at Savior**, and the player's call between *kept* and *shipped*.
- **The back's bullets**: the Labyrinth and Saurian Belt most. If the end now reads as too much, the
  next pass is the firing waves in the back's first third, which were the window's.
- **The Labyrinth at Burn**, whose slow lattice fight now meets adds and runs longer for them.
- **`docs/state-of-play.md`**, once this lands.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content tables, one field on a row,
one condition in the spawn loop, three healths; nothing persisted.
