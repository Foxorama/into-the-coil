# 0329 — A level may fall, and 0226 only ever had one half reported

**Accepted 2026-09-16.** [0226](0226-the-level-holds-one-loudness.md) held every rung of every place
**equal** to its `run`. Everything that produced it is about one direction:

> *"the music track volume increases so much that it drowns out the bullets and game SFX at 41 secs in
> the approach, it's like someone turns up the volume knob, then again at like 45secs, then 50secs,
> then stays at that high level."*

And the ask that reaches the other direction, driven on the desk and handed over as three pastes:

> *"it'll probably need a bit of tweaking to get the opening, closing and loudness correct, but I want
> a sense of discordance between the four arcs."*

## The rules

**A place may state a contour: how far BELOW its own `run` each rung sits, in LU.**
`THEMES[place].contour` in `src/content/themes.ts`; absent is level, which is what six places say.
`scripts/solve-hold.mjs` solves `LEVEL_HOLD` to `run + contour`, and `tests/themes.test.ts` asserts
every rung lands within `HOLD_BAND_DB` of where its contour puts it.

**A contour may not rise.** At or below zero, `run` may not be contoured at all, and
`tests/themes.test.ts` refuses both. 0226's reported half is intact: no rung of any place is ever
authored louder than its own opening.

## ⚠️ The floor came free with the solve and nobody ever argued for it

0226's rule is one sentence — *every rung of a place sits at its `run` loudness* — and it was
implemented as a bisection to equality because that is the obvious thing to write. **Equality is two
claims.** The upper one answers the report: a rung louder than the opening competes with a cue bus
that does not move, which is what *drowns out the bullets* means. The lower one answers nothing. It
was never reported, never measured against anything, and never chosen.

⚠️ **AND 0226 ITSELF SAYS WHAT THE RULE IS ABOUT.** *"A rung is a change of arrangement and of pace;
it is no longer a change of level"* — written against a climb nobody authored, produced by the
ladder's own arithmetic. [0123](0123-a-rung-changes-the-notes.md) had already found that *loudness
does not predict a section*. **A shape a hand drove by ear is not that thing**; it is the same
category as `ladder` and `mix`, and
[0161](0161-the-shape-of-a-level-is-not-guarded.md) says how a place climbs, holds or drops away is an
authoring judgement.

## ⚠️ Why it is in LU, which is the only reason it can be authored at all

0226's own finding: *"a rung held 2 LU quieter at the speaker is 3.4 dB quieter into the compressor…
a closed form over gains would be wrong by half the move."* **A hand stating a gain is stating a
number whose effect it cannot predict.** LU is the unit the six reports were made in, the unit
`tests/clean.ts`'s `loud` measures, and the unit `solve-hold.mjs` already bisects on. The hand writes
what it heard and the solver finds the gain — which is the same division of labour `REBASE` and
`mix` have had since [0176](0176-the-re-based-mix-is-the-mix.md).

⚠️ **AND IT IS A FIELD ON THE ROW RATHER THAN A COLUMN ON `LEVEL_HOLD`.** What a hand states lives on
the theme row beside `ladder`, `mix`, `air` and `trim`; what a solver produces lives in the table
below. Putting an authored number inside solver output is how a table stops being re-generatable.

## ⚠️ The guard that refuses a rise is the invariant, and the loudness guard is the agreement

Two assertions, and they are not the same one twice:

| | holds |
|---|---|
| `0329 — A CONTOUR ONLY EVER FALLS` | what a hand may **state** |
| `every rung of a place holds its run loudness` | that `LEVEL_HOLD` still **delivers** it |

Without the first, a place could author `+3` at the fight, re-solve, and pass the second while
playing the thing six reports were about. That is
[0182](0182-a-mix-number-has-no-band.md)'s wall-that-says-nothing arriving as a missing assertion
rather than as a silent clamp.

⚠️ **THE ONE RUNG A RISE COULD BE ARGUED FOR IS THE FIGHT, AND IT IS THE ONE THE REPORT NAMED.**
*"Then stays at that high level"* is the boss. 0226 kept *the boss arrives* in the half that opens new
things — [0108](0108-the-bed-is-felt-and-the-boss-arrives.md), in `tests/music.test.ts` — and not in
the half that made it louder. If a fight is ever reported as needing to hit harder, this guard is
what has to be changed and argued with, which is
[0192](0192-a-guard-holds-an-invariant.md)'s *change the guard and say why*.

## ⚠️ It lands with its first consumer, because a contour nothing states cannot be probed

[0330](0330-the-black-heart-is-driven.md) is in the same PR and states the first one. That is
deliberate: with no place stating a contour, `contourOf` could return a constant zero and **every
guard in the repository stays green** — the *mechanism no data reaches* that
[0162](0162-a-place-has-its-own-ladder.md)'s probe header names, and a probe pointed at it would have
reported STILL GREEN. [0019](0019-a-probe-must-be-seen-to-apply.md) is the rule; the two probes in
`scripts/probes/0329-a-level-may-fall.mjs` only have a subject because The Black Heart gives them one.

## What it costs

**Nothing audible, anywhere, except the place 0330 drives.** Six places state no contour, so their
targets are `run + 0` and `LEVEL_HOLD` re-solves to the numbers already in it. The one field added to
`ThemeRow` is optional.
