# 0025 — The frame budget is counted, not timed: a hot-file list and two halves of one guard

**Accepted 2026-08-04.** Discharges the guard [0022](0022-frame-rate-is-a-feature.md) promised —
*"the guard lands in the same commit as the rAF loop, proved against a deliberately over-populated
scene"* — and lands the loop it was waiting for.

0022 decided the rules. This decides **how they are enforced**, which turned out to need a mechanism
0022 did not anticipate: a declared list of hot files and a marker at the point of use.

## What landed

| | |
|---|---|
| `src/app/loop.ts` | the fixed 60Hz clock, and the rAF driver over it |
| `src/sim/pool.ts` | pre-allocated, packed entity pools |
| `src/sim/entity.ts` | what lives in one, and the fixed step that moves it |
| `src/render/surface.ts` | the painter seam, and 0023's handedness as executable code |
| `src/render/scene.ts` | one clear, one blit per entity, interpolated |

Nothing is wired into `src/main.ts`. The page still boots to what it booted to before, and the canvas
is the next commit — the machinery and its guard are worth landing on their own, and a diff that also
changed what the page does would bury both.

## The guard has two halves, and neither is a guard alone

**The runtime half** builds 0022's worst-case scene — 500 entities — runs it for 600 frames, and
counts what the real painter did. One blit per live entity, one clear, and the same count on frame
600 as on frame one. It cannot see an allocation: a `.map()` in the middle of the loop produces
exactly the right pixels.

**The source half** scans the hot files for the syntax that allocates. It cannot see a loop that
draws every entity twice.

Together they cover both. Either alone reads as thorough and is half a guard, which is the specific
way this project has been wrong before.

## Nothing is a stopwatch, and that is 0022's argument carried through

A millisecond assertion in CI is calibrated against nothing: the runner is not a 2021 mid-range
Android, its hardware varies between jobs, and the result fails on a busy afternoon and passes on a
broken commit. Draw calls and allocations are deterministic and hardware-independent, and **a blit is
not a proxy for the cost — it is the cost.**

⚠️ Still owed, and 0022 already says so: **a hand measurement on a physical 2021-class device**, once,
to calibrate the count against the millisecond. Counting the right things does not tell you the
budget is 500 rather than 300.

## The hot-file list, and why a list rather than a rule

**A closed list of five files** is where "the frame loop" is defined. Everything not on it is free to
be written normally, and the value of the list is that adding to it is a deliberate act.

The rejected alternative was a repo-wide ban on allocating syntax, which fails in both directions at
once: it flags `save/` and `content/`, where building an array is the correct thing to do, and it
would be edited into uselessness within a week. A ban that fires on healthy code is a ban everyone
learns to switch off — the same measurement that killed the line ceiling in
[0015](0015-the-layer-ladder.md).

## `// @setup:` — the escape hatch, and why it is at the point of use

A hot file still has a constructor. `makeClock` builds an object, `Pool` fills an array, and both run
once at boot. So a line may be exempted by `// @setup: <reason>` on the line above it, with a reason
of real length — a hand-wave is refused, and a plain comment exempts nothing.

It sits **on the line**, not in a central allowlist, for the reason the scaffold's instruction ladder
gives: an affordance at the point of use beats a rule in a document nobody re-reads. A reader of
`pool.ts` sees why that `new Array` is allowed without leaving the file, and a reviewer sees a new
marker appear in the diff.

⚠️ **This is a code convention, and `CLAUDE.md` said those were deliberately absent until there was
code to write them about.** There is now. It is deliberately the *only* one landed here — file
naming, function size and comment style are still open.

## What the scan bans, and what it cannot

Six patterns: construction, array methods that build a new array or a closure per call, `Object.*`
and `Array.from`, spread, template literals, and `JSON`. Each is proved against a line it must catch
**and** a line it must leave alone, in the test itself.

**It is not a complete list of ways to make garbage, and a regex cannot be one.** String
concatenation, a boxed number, a closure captured in a variable — all invisible here. The claim is
narrower and worth making anyway: these are the ways it actually happens in a render loop, and every
one of them is an ordinary line of TypeScript that no reviewer would stop on.

The runtime half covers the case that matters most and the scan cannot see at all: **entities are
constructed exactly `capacity` times and never again**, asserted by counting the pool's factory calls
across 600 frames of spawning and culling.

## Three things the code decides that are easy to get backwards

**The step debt is discarded, not carried.** A frame that took a second asks for 60 steps, which
takes longer than a frame, which asks for more — carrying the excess is what makes it a spiral. Five
steps is the cap; past 83ms of debt the game is below 12fps and catching up cannot succeed. The
honest failure is skipped time, reported as `dropped`.

**Releasing from a pool REORDERS**, because the last live item is swapped into the hole. Iterating
forwards while culling therefore skips an entity — about half of them survive a frame they should
not have — so `stepEntities` walks backwards. This is guarded rather than commented, because it is
correct-looking either way.

**Portrait counts `along` DOWN the screen.** 0023 says the leading edge is the top in portrait, so
`alongInView: 0` is the bottom. Getting the sign wrong scrolls the level backwards in portrait and
only in portrait — on a device the developer is not holding.

## Rejected: measuring allocation at runtime

`process.memoryUsage()` before and after, or a `FinalizationRegistry`. Rejected because GC timing is
not deterministic: the number moves between runs on an idle machine, so the threshold has to be
loose enough to pass, at which point it no longer catches the regression it exists for. A source scan
gives the same answer every time and names the line.

## Rejected: wiring the loop into `main.ts` in this commit

It would prove the loop runs in a browser, which nothing here does. Rejected for this commit only:
the canvas, the DPR cap and the first drawn frame are their own change with their own browser test,
and landing them together would mean a diff where the frame budget and the shipped page moved at
once. **This is a deferral with a named next step, not a gap.**

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0025-frame.mjs`.

| broken on purpose | went red |
|---|---|
| one step per frame, so the simulation runs at whatever rate the display does | `runs 60 steps a second whatever the display is doing` |
| the step cap removed, so a one-second stall asks for sixty steps — the spiral | `never runs more than MAX_STEPS however long the frame took` |
| the dropped debt carried forward instead of discarded, which is what makes it a spiral | `discards the debt rather than carrying it` |
| a pool that grows when full — allocating at the densest moment of the game | `refuses rather than grows when it is full` |
| culling while walking the pool FORWARDS, so a release skips the entity swapped into it | `retires every expired entity in one pass` |
| the portrait sign flipped, so the level scrolls backwards in portrait and only there | `runs along UP and across RIGHT in portrait` |
| the painter drawing the current position and ignoring alpha, which judders off 60Hz | `draws at the previous position at alpha 0 and the current one at alpha 1` |
| an allocation planted in the frame loop — the one thing the runtime half cannot see | `no hot file allocates` |
| the painter drawing each entity twice, which the source scan cannot see | `draws exactly one call per live entity` |

⚠️ **The last two are the pair.** Each is invisible to the half of the guard that does not catch it,
and running them side by side is the only evidence that both halves are load-bearing.

## The guard's first contact with real code

[Milestone 0003](../milestones/0003-the-line-before-the-game.md) predicted the first real file would
break a guard, and said to suspect the guard first. It happened here rather than in
[0023](0023-the-long-axis-is-the-scroll-axis.md), which passed everything unmodified: the allocation
scan flagged `Pool`'s constructor, which validates its capacity and throws with a template literal.

The guard was over-broad by design rather than wrong — a whole-file scan will always meet a
constructor — and `// @setup:` is the mechanism that exists for it. **The line was explained rather
than the pattern weakened**, which is the distinction worth keeping.

A second, smaller instance landed in the tests rather than the code: `(1000 / 90) * 90` is
999.9999999999999, so a 90Hz second honestly produces 59 steps with the remainder in `carry`. The
assertion was demanding that the clock invent a missing microsecond, and now checks the time actually
fed in.
