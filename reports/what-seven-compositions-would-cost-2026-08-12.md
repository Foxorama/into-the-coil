# What seven compositions would cost — 2026-08-12

**The homework phase 3 is blocked on, done before phase 3 starts rather than during it.** Nothing here
changes a byte; it is four measurements and what they rule in and out. Written down because
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md) says a report is a committed file,
and because the number that matters is one nothing in the repository has ever counted correctly.

⚠️ **IT WAS MEASURED INSTEAD OF STARTING THE WORK, AND THAT WAS THE POINT.**
[0113](../docs/decisions/0113-there-is-one-composition-and-seven-levels.md) specifies per-theme
composition and does not cost it. `tests/sound.test.ts` says in as many words that the next raise
*"must not be a number"* and names bake-at-the-boundary as the mechanism instead. This is whether that
mechanism is affordable.

---

## What one composition actually costs

| | |
|---|---|
| layers | 23 |
| audio | **272.0 s** |
| `Float32Array` buffers | 48.0 MB |
| **plus the `AudioBuffer` copies** | **96.0 MB actually resident** |
| synthesis | 2,408 ms across **2,249 note jobs** |
| the longest single layer | 715 ms |

⚠️ **THE GUARD COUNTS 48 MB AND THE BROWSER HOLDS 96.** `src/app/sound.ts` keeps `prewarmed` — a
module-level cache — for the life of the session, and `makeMusicOut` **copies** every layer into an
`AudioBuffer` (`buffer.getChannelData(0).set(data)`). Both live. `tests/sound.test.ts` measures the
first and its ceiling has now been raised twice against half the real figure.

⚠️ **48 MB IS RECOVERABLE AND WAS DELIBERATELY NOT TAKEN TONIGHT.** After `makeMusicOut` has copied
them, `prewarmed.loops` is dead — nothing reads it again except `takePrewarmed`, which exists for
tests. Freeing it halves resident audio and changes no sample. **It was left because it edits the
audio-unlock path**, which is the one subsystem that has already shipped a silent-game bug this
session ([0119](../docs/decisions/0119-off-stops-the-loops.md)), and the player was asleep and could
not verify a build. It is the first thing to do when phase 3 opens.

## What 0113 as written would cost

| | |
|---|---|
| seven compositions, buffers | 336 MB |
| **seven, actually resident** | **672 MB** |
| synthesis, all seven | 16.9 s |

⚠️ **THAT IS NOT A NUMBER ANY CEILING ABSORBS.** It is not a tuning question — it rules out holding
seven sets, on desktop as well as on a phone. **0113's rule stands and its storage model cannot.**

## What bake-at-the-boundary costs, which is the mechanism the guard already named

| | |
|---|---|
| layers a level needs | 21 of 23 — `bass` and `beat` are `TITLE_ONLY` |
| resident, one level | **94 MB** |
| **peak while the next is being baked** | **187 MB** |
| synthesis per level | ~2.35 s |
| spread across a level's ~160 s | **0.245 ms per frame** |

⚠️ **THE TIME IS FREE AND THE MEMORY IS THE CONSTRAINT, WHICH IS THE OPPOSITE OF WHAT WAS ASSUMED.**
0.245 ms a frame against
[0022](../docs/decisions/0022-frame-rate-is-a-feature.md)'s ~10 ms budget is a fortieth of it, using
the per-note job split [0102](../docs/decisions/0102-the-music-goes-somewhere.md) already built. **A
level's music can be synthesised, invisibly, while the level before it is played.**

⚠️ **187 MB AT A BOUNDARY IS THE NUMBER TO ARGUE ABOUT.** It halves to ~94 MB if the outgoing set is
freed before the incoming one is baked — which costs a moment with no music, at exactly the point
[0063](../docs/decisions/0063-a-level-break-is-a-respite.md) puts a respite screen. That is a design
choice, not an optimisation, and it is the one phase 3 has to make.

⚠️ **And 48 MB of that peak is the recoverable waste above.** Taking it first makes every figure here
better before a single new note is written.

## What this rules in and out

| | |
|---|---|
| seven compositions held resident | **ruled out** — 672 MB |
| seven compositions, one baked at a time | **affordable**, at 0.245 ms/frame and a 187 MB peak |
| hiding the bake in a level break | unnecessary — it hides inside ordinary play |
| raising the 56 MB guard again | **wrong shape**; the guard's subject should become *the current level*, and it is undercounting by 2× today |

## What is still unmeasured, and named rather than assumed

⚠️ **Whether seven compositions are 272 s each.** Every figure above assumes a theme's set is the same
size as today's. A theme that shares most of its layers costs less; one with more material costs more.
0113 requires only that *"a theme that shares every array has no music of its own"*, which is a floor
of one differing layer, not a size.

⚠️ **The garbage-collection behaviour at a boundary.** Freeing 94 MB and allocating 94 MB inside a few
seconds is the kind of thing that produces a hitch the frame budget does not predict, and
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) says a model number is not the
experience. **`scripts/trace-frame.mjs` is the instrument and it has not been pointed at this.**
