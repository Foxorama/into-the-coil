# 0043 — A weapon is a budget, and a level opens empty

**Accepted 2026-08-06.** Both halves come from the first real play-test of the two-level build, and
both amend decisions that were accepted without the arithmetic behind them being done.

Amends [0041](0041-a-pickup-is-the-answer-to-what-a-death-costs.md) and
[0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md).

## The rules

| | |
|---|---|
| **barrels** | capped at 4. Further `spread` becomes damage |
| **fire rate** | floored at 4 steps. Further `rapid` becomes damage |
| **a player shot** | retires after 80 steps — one crossing of the widest possible view |
| **the pool** | 100, and the four numbers above are checked against each other |
| **a level's opening** | nothing inside `MAX_ALONG_SPAN`, and the first wave within 12 seconds |

## The weapon: four numbers that have to agree, and nobody had multiplied them

Reported from play: *"if you get too many weapon upgrades the weapon fire seems to get to two streams
of bullets are continuous and the other streams slow down and it's a bit weird."*

⚠️ **It is not a rendering artefact and it is not a timing bug — it is pool exhaustion, and the
symptom is a consequence of the order a fan is spawned in.** Barrels and fire rate both stacked
without a ceiling, so a full loadout asked for **twelve bullets every four steps**, against a pool of
eighty, with each shot living until the leading cull — eighty units past the furthest edge of the
furthest screen. Measured: **284 of 900 steps spent at the cap.** `fireShip` spawns the fan in order
and returns on the first refusal, so the early barrels always fired and the rest stuttered.

The bullets in flight are `barrels × life / fireEvery`, and that has to stay under the pool. Four
numbers, none of which knew about the others:

- **barrels 4.** Five was tried and measured at exactly 100 against a pool of 100 — no headroom, so
  the fan still clips on the step a volley overlaps its predecessor.
- **life 80 steps.** A shot that has left the widest view is doing nothing;
  `(MAX_ALONG_SPAN − 40) / 2.6` is 77, rounded up so it never vanishes visibly on a 21:9.
- **fire floor 4**, unchanged, and it is a legibility number rather than a balance one —
  [0035](0035-damage-is-legible-on-the-body-that-took-it.md).
- **pool 100**, up from 80, which puts the pool total at exactly
  [0022](0022-frame-rate-is-a-feature.md)'s 500-entity worst case. The pool cannot grow past that,
  which is why the barrel cap is the number that moved.

⚠️ **`tests/pickups.test.ts` drives the strongest possible weapon and fails if the pool ever fills.**
It is the only place those four are checked against each other, and any of them can be edited alone.

### Where a capped upgrade goes

Damage. `docs/game.md` says an upgrade that cannot change the outcome is worse than none, so an
upgrade that can no longer buy a barrel or a faster rate buys **weight** instead. Every upgrade stays
worth taking at the eleventh as well as at the first, and neither count runs away.

## The opening: a level starts empty

Reported from play: *"the initial row of enemies is too close to the player — the initial first screen
should have no enemies so that the player can orient themselves and test out the ship speed and
controls."*

Both levels now author nothing before 300 units, which is past `MAX_ALONG_SPAN` and therefore off
screen on the **widest** device as well as the narrowest.

⚠️ **The guard for this used to assert the exact opposite, and it was wrong about the game rather
than about the code.** [0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md) added *has waves
inside the opening spawn horizon* because the failure it had just seen was a level that opened onto
eight seconds of nothing. Both complaints are real and neither is the other's opposite: **nothing on
the first screen, and not for long.** The guard is now that pair.

⚠️ **A 16:9 player gets about four seconds of quiet and a 21:9 player about two.** That difference is
inherent to seeing further and is not something a level can author away —
[0023](0023-the-long-axis-is-the-scroll-axis.md) fixes the dodge lane and lets lookahead vary, which
is the trade that makes both orientations play the same.

## The density guard was a sieve, twice

Finding the first thin spot took two corrections to the guard rather than one, and both are worth
recording because they are the same mistake at different depths.

1. **It walked in a fixed stride of 40** and stepped straight over a six-enemy trough in level two.
   It only surfaced when an unrelated edit moved where the samples happened to land.
2. **Sampling the breakpoints exactly was still wrong.** Density is a step function, but its troughs
   are not at the boundaries: the count drops the moment a wave *leaves* the view, which is just past
   its `at`. Sampling the boundaries reported the level as fine and re-hid the same six.

It now samples one unit past every wave, which is where every minimum is. A guard that measures a
real property at the wrong points is a guard that reports green, which is
[0027](0027-measure-the-picture-not-the-model.md)'s subject aimed at the sampling rather than at the
quantity.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md).
`npm run prove 0043`:

| broken on purpose | went red |
|---|---|
| the barrel cap removed, which is the shipped bug exactly | `a volley is never truncated, however heavily the ship is loaded` |
| a player shot left to run to the leading cull, starving the next volley | `a volley is never truncated, however heavily the ship is loaded` |
| a level authored with its first wave on screen, which is what shipped | `opens on an empty screen, so the player can find the controls first` |
| the opening pushed so far out that the player flies at nothing | `and does not leave the player waiting` |
| the density guard sampling boundaries instead of the troughs just past them | `keeps enough on screen at once to be a shooter` |
