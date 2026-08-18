# 0175 — An experiment arrives the way the game does

**Accepted 2026-08-19.** The reason every non-`shipped` mix on the desk has cut at every boundary
since [0154](0154-the-mix-is-authored-as-intent.md)'s toggle was built, and the reason
[0171](0171-a-boundary-is-a-build.md) appeared not to have landed.

> *"The shipped version has really smooth blending, the re-based still has a hard cut line when going
> from run > push etc. It sounds like they applied to shipped, but we've got a re-based solution
> happening to get a bunch of additional sounds happening."*

## The rule

**`levelWrites` takes the gains it is to schedule.** An audition hands its table *in*, and arrives on
the downbeat, over `RAMP_SECONDS`, built in the arrangement's own order — the way the game does.

**The aura is never taken from a handed-in table**, because no solver produces one.

**The desk's only hand on a music gain is `restate`.** `tests/music.test.ts` scans for a second.

## ⚠️ The cut was the write path, not the mix

`rig/dash.ts` called `setLevel` — which schedules 0117's bar-quantised, 0171-staggered, 1.6-second
ramps — and then **overwrote every non-aura layer**:

```js
gain.setTargetAtTime(target, 0, HOLD_SECONDS)   // HOLD_SECONDS = 0.03
```

| | shipped | solved / re-based |
|---|---|---|
| when it starts | the next **downbeat** | **immediately**, wherever the bar is |
| how long it takes | **1.6 s** | **30 ms** |
| arrivals | staggered over up to **4 bars** | all at once |

**53× faster, off the beat, and with the build discarded.** The player's read was exactly right: the
fixes applied to `shipped`. What is worth adding is that they could not have applied anywhere else —
the boundary in every other mode was never smooth, going back to the toggle itself.

## ⚠️ And it is the same failure as the one that put it there

0154's toggle first changed *"the readout and not one sample of audio"* — the dashboard showed the
solved mix while playing the shipped one. The fix for that wrote the solved gains onto the nodes
directly, and **traded one instrument fault for another**: the audio matched the readout and stopped
matching the game. [0126](0126-the-dashboard-is-the-instrument.md)'s whole point is that the desk is
the game's own mixer; a mode that reaches around it is a mode you cannot listen to for the thing it is
measuring.

⚠️ **AND 0167 IS PARTLY RE-OPENED BY THIS.** That decision answered *"every change for every level is
now a hard jump between sounds"* by measuring the solved mix's gain tables and finding 56 ducked
layers — a real finding about the tables, and it stands. **What it could not have known is how much of
the reported JUMP was this write path**, because the report was taken in a mode whose every boundary
was a 30 ms cut whatever the gains said. The duck is real; its share of what was heard is now an open
question, and one a listen can finally answer.

## ⚠️ Both of the guards that should have caught it run over the thing that was bypassed

0117 asserts every layer moves on a bar line; 0171 asserts no boundary delivers its arrivals at one
instant. **Both are green, and both were green throughout**, because both walk `levelWrites` — and the
dashboard was not calling it. A value-level guard cannot see a correct value written at the wrong time
through a legitimate API.

**So the guard here is a source scan**, on [0162](0162-a-place-has-its-own-ladder.md)'s own terms: the
only writer of a music gain in `rig/dash.ts` is `restate`, which is a fader or a solo pin and is the
user's own hand.

⚠️ **AND ITS FIRST VERSION COUNTED CALL SITES, WHICH WAS WRONG IN BOTH DIRECTIONS.** There are three —
a pan, a held gain and a release, all `restate`'s — so a ceiling of two went red on correct code, and
a fourth writer added *inside* `restate` would have gone green. The question is whose hand it is, not
how many fingers.

## Confirmed, not assumed

- `npm run typecheck` clean, `npm test` green, `npm run build` clean.
- The arrival times of a handed-in table and the shipped one are compared per layer, per rung, in all
  seven places — same bars, same `tau`, and the gains deliberately different so a table that happened
  to match would prove nothing.
- Three probes, seen red, trees restored: `node scripts/prove-guard.mjs 0175`.

| broken on purpose | went red |
|---|---|
| a handed-in table ignored, so an audition is the shipped mix with the readout of another | `and the table it is handed is the one it schedules, aura excepted` |
| the handed-in table covering the aura too, so the boss stops approaching | `and the aura is still computed from nearness, because no solver produces one` |
| the desk writing a gain outside `restate` again, which is how the cut got in | `and the dashboard does not write a music gain behind the mixer's back` |

⚠️ **AND THE AURA PROBE REPORTED *STILL GREEN* FIRST.** Its guard built the handed-in table with the
same helper the dashboard uses, which skips the aura — so the clause it was testing was never reached.
[0019](0019-a-probe-must-be-seen-to-apply.md) catching a vacuous guard written the same hour, for the
third time in this sequence. The table now states the aura on purpose, so there is something to
ignore.

## Rollback

`gains` on `levelWrites` and `MusicOut.setLevel` in `src/app/music.ts`, and `solvedTargets` in
`rig/dash.ts`. **The game passes no table**, so reverting cannot change a shipped sound — only what
the desk does with a mode that is not `shipped`. No storage key, save schema, SW cache prefix or
origin.
