# 0591 — The wheel stays a beat longer

**Accepted 2026-10-10.** The Firebird's Catherine wheel, [0553](0553-the-wheel-comes-round-sooner.md),
played again. Supersedes 0553's throw and life; the rest of 0553, and of
[0551](0551-the-wheel-is-held-closer.md) beneath it, stands.

## The ask

> *"Need to increase the time on screen and refire rate of the Catherine wheel by .5 seconds. Adjusted it
> down previous and it doesn't last long enough now."*

## The rule

**The wheel is thrown every six beats (2.4 s) and lives 2.67 s: each one beat, 0.4 s, later than 0553.
Its burn-down keeps its 0.4 s, so the tether lets go at 2.27 s.**

| | |
|---|---|
| **the clock** | `fireEvery` 120 → 144, `life` 136 → 160; `fade` 24 and `TETHER_FADE_STEPS` 8 unchanged |
| **the bosses** | no weight moved — every boss floor holds at the slower throw, in every ship |

## Why it is 0.4 s and not 0.5

⚠️ **Half a second is 30 steps, and the player's gun is on the beat grid** —
[0094](0094-in-time-is-not-in-phase.md): every auto-weapon fires on a multiple of its cadence counted from
the sim's clock, and the wheel's cadence is a whole number of `VOLLEY_CYCLE`s (24 steps, 0.4 s), guarded in
`tests/wheel.test.ts`. A 30-step throw would land on a different place in the bar every time, and the
wheel's crackle and its throw cue would drift off the music. The grid's two neighbours of +0.5 s are +0.4 s
and +0.8 s; **+0.4 is the nearer, by a tenth of a second against three.** This is a rounding of the ask, said
here rather than renamed: the ask was half a second, what was built is 0.4.

**The same beat on both, and nothing on the burn-down** — the same reasoning as 0553 in the other direction.
*"Time on screen and refire rate"* is the wheel's life and the throw; moving both by the same amount leaves
the two gaps the player has kept since 0551 to the step: the tether lets go 0.13 s before the next throw,
and the last wheel burns for 0.27 s beside the new one.

**This is 0551's clock again**, to the step. 0553 took a beat off it because the refire was *"just slightly
too slow"*; this puts the beat back because the wheel *"doesn't last long enough"*. The two asks pull on
one coupled pair — life and throw are held together to keep the overlap — so the grid offers the player
2 s or 2.4 s and nothing between. If neither is right, the next lever is to decouple them: a longer life
against the 2 s throw, which changes the overlap 0551 asked to keep. Not done here, because this ask names
both numbers together.

## The bosses

A wheel thrown a sixth less often lands less on a boss, so every floor moves the safe way — a fight gets
longer, never shorter. The boss floors in every ship (`tests/level.test.ts`, `tests/serpent.test.ts`,
`tests/medusa.test.ts`, `tests/gun-floor.test.ts`) were run on this clock and hold; 0553's weights stay.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). The gun's numbers are content.

## What guards it

`tests/wheel.test.ts`: 0553's clock plus 0.4 s, to the step, with the burn-down unchanged; the cadence on the
beat grid; the tether lets go at 2.27 s; every throw after the first finds the last wheel burning down.
Probes in `scripts/probes/0591-the-wheel-stays-a-beat-longer.mjs`, among them the literal half second, off
the grid; 0549's and 0553's re-anchored on the lines this moved.

## Owed

- **A play** on the Firebird: whether 2.67 s on screen is long enough, and whether 2.4 s is a refire the
  player now finds slow again — 0553 found it so.
