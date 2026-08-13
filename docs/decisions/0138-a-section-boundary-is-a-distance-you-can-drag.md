# 0138 — A section boundary is a distance you can drag

**Accepted 2026-08-13.** The first thing this project has ever made **driveable inside the game's own
arithmetic** rather than merely readable — and it is the quantity three separate decisions have each
guessed at from a play-test.

> *"I'd also love it if we could make the run section that has the push, surge, approach sections
> etc slideable so that I can drag them to start sooner or end sooner and see what effect that has.
> Not sure if it's doable, but it sure would be good for helping with the timing of when to
> start/end the different sections."*

## The rule

**The three boundaries the ladder opens on are an argument, not a constant, and the dashboard's strip
drags them.** `musicLevelFor` takes a fifth parameter defaulting to `SECTION_UNITS`; the game passes
nothing and `tests/dash.test.ts` scans `src/` to keep it that way. `rig/dash.ts` passes whatever the
strip has been dragged to, and the mixer hears it on the next tick.

**← and → nudge a focused handle by one bar of scroll**, which is the smallest move that changes
anything a listener can hear: [0117](0117-a-section-change-lands-on-the-beat.md) starts the ramp on
the next bar line after the crossing, so a boundary moved by less than that lands on the same
downbeat. A pointer over a level this long is about six units a pixel; the keys are how a value gets
chosen rather than approached.

## ⚠️ It is doable because the answer was already one function

It is worth writing down why this cost so little, because the shape is the transferable part.
`musicLevelFor` has been the single description of *which rung is a level on* since
[0102](0102-the-music-goes-somewhere.md), and every rig in the project asks it rather than keeping a
list — that is [0116](0116-the-rig-plays-the-level.md)'s rule, paid for twice. **So there was exactly
one place where a distance is compared**, and making it driveable is a parameter with a default.

⚠️ **HAD THE RIG KEPT ITS OWN RUNG ORDER, THIS FEATURE WOULD HAVE BEEN A LIE THAT LOOKED LIKE A
FEATURE** — the strip would move, the seconds would change, and the music would not.
`scripts/probes/0138-drag-a-boundary.mjs` plants exactly that.

## ⚠️ Three boundaries move and two do not, which is the interesting half

| boundary | |
|---|---|
| `run`→`push`, `push`→`surge`, `surge`→`approach` | **dragged.** Three distances back from the boss, and nothing but music decides them |
| `approach`→`boss` | **no handle.** This is where the level's boss ARRIVES — `bossAt` is level design, and a music panel has no business moving it |
| `boss`→`bossPeak` | **no handle.** Keyed to the boss's HEALTH and not to a clock, deliberately — [0113](0113-there-is-one-composition-and-seven-levels.md): *"a clock would put the wall of sound on a player who is losing and on one who is winning at the same instant"* |

⚠️ **A HANDLE ON EITHER OF THOSE TWO WOULD OFFER A CONTROL OVER SOMETHING TIME DOES NOT DECIDE**, and
a tool that answers a question it cannot honestly answer is worse than one that says it cannot — the
whole of 0126.

## ⚠️ One set for all seven levels, because the game's is

The three are measured **back from whichever boss a level has** (0102: *"a longer level spends longer
at `run`"*), so they are not a property of a place the way a theme's mix is. Dragging on level one's
strip is therefore a proposal about **every level**, and the panel says so where the numbers are.
They survive a change of level rather than being re-clamped, so a value chosen against level one can
be looked at against Ember Nebula in one click.

⚠️ **A boundary CAN be dragged past the whole of a shorter level**, and the strip then draws a level
that opens at `push` and never plays `run`. That is a real answer to a real question rather than a
state to defend against — but it is why the jump buttons now find their rung **by name** instead of
by position, which would have silently jumped to the wrong section.

## ⚠️ The clamp is against the neighbours, and the floor is a bar

`musicLevelFor` tests the three **in order**, so an out-of-order set does not make a long section —
it **deletes** one, and every readout on the page goes on drawing the section the ladder no longer
reaches. `dragSection` clamps each against the two beside it.

⚠️ **AND NOTHING MAY BE DRAGGED NARROWER THAN ONE BAR OF SCROLL**, which is 57.6 units and is derived
from the two constants that decide it rather than typed. A section narrower than a bar can be entered
and left again *before its own ramp has started* (0117), so the rung would turn over twice with
nothing heard between — the strip would be showing a section that does not exist in the speakers.
It is the one bound here stated in the player's own units, which
[0027](0027-measure-the-picture-not-the-model.md) asks for by name.

## ⚠️ What comes out of it is constants, not a screenshot

**copy this moment** prints `PUSH_UNITS = 3021 · SURGE_UNITS = 1736 · BOSS_APPROACH_UNITS = 643`,
marked **DRAGGED** with the shipped set beside it when anything has moved. That is
[0129](0129-the-desk-holds-a-value-not-a-multiplier.md)'s rule about the desk applied to the strip: a
shape found by dragging is a proposal about `src/content/music.ts`, and one that has to be read off a
screenshot and matched to the right constant by guesswork will not become a change.

⚠️ **THIS IS THE ANSWER TO A COST THREE DECISIONS HAVE EACH PAID.**
[0102](0102-the-music-goes-somewhere.md) chose the two middle distances by hand,
[0125](0125-the-build-starts-sooner.md) moved all three by 263 units, and
[0131](0131-the-surge-comes-sooner.md) moved one by 515 — each a number typed into a file, shipped,
and judged a play-test later. 0102's own comment says it: *"Nothing asserts these values… they are a
hand's guess at a pace nobody has flown."*

## Nothing is tuned here

⚠️ **NOT ONE DISTANCE MOVES IN THIS CHANGE.** `SECTION_UNITS` composes the three constants exactly as
they ship and no number is restated — 0116's rule about instruments, and
[0029](0029-the-tracked-record-is-the-record.md)'s about copies. **The instrument first, judged
after**, which is the ordering [0113](0113-there-is-one-composition-and-seven-levels.md) records six
rounds being lost to getting backwards.

## What is guarded

| | |
|---|---|
| **passing nothing is the shipped level**, so every other guard in the file still asks about the game | ✅ `tests/dash.test.ts`, against the three constants |
| **a dragged boundary is where the ladder turns over, to the second the camera crosses it** | ✅ in SECONDS, and asked of `musicLevelFor` rather than of the rig |
| the coverage table follows the drag | ✅ — 0126's `passes` measurement is the one a drag is for |
| no drag can put the three out of order, or make one shorter than a bar | ✅ over nine dragged values × three handles |
| the floor is a bar of scroll, derived rather than typed | ✅ |
| **nothing under `src/` passes its own distances** | ✅ by counting arguments, not by looking for a word |
| the pointer, the handle, the redraw | ❌ needs a browser — driven, and the run is below |

⚠️ **THE ARGUMENT-COUNTING SCAN WENT RED ON ITS FIRST RUN AND WAS RIGHT TO**, on `src/app/mount.ts`:
that call explains its fourth argument in an eight-line block comment sitting *between* two of them,
and a splitter counting commas read it as eight arguments. Comments and string literals are blanked
first now. A source scan failing loudly on its own subject is the direction that class of guard
should fail in.

## What was driven

`npm run dash`, level one (The Approach):

| | read back |
|---|---|
| dragged `surge` from 1736 out to 2403 | it crosses at **0:51** where it crossed at **1:10**, the section is **49 s** where it was 30, and `push` pays for it — 17 s where it was 36 |
| `counter` in the coverage table | longest run **66.8 s**, **2.61** passes — against 48.2 s and 1.88 at the shipped boundary |
| **the same second, 0:55, before and after** | `push` / `counter` **target 0.00, live 0.00** → `surge` / `counter` **target 1.05, live 1.02** |
| nudged the handle with ← | 57.6 units a press — one bar of scroll — and three presses moved `surge` 1736 → 1909 |
| dragged `push` hard right, into `surge` | it stopped one bar clear at 2460 and **all six rungs stayed on the strip** |
| changed the level to Ember Nebula | the dragged distances came with it over a different `bossAt` — 2:45 against 2:43 — and the strip redrew at the new length |
| **copy this moment** | `PUSH_UNITS = 3021 · SURGE_UNITS = 1909 · BOSS_APPROACH_UNITS = 643 — DRAGGED (SURGE_UNITS ships 1736)` |
| **put them back** | all three back to the shipped values and the button greyed itself out |

⚠️ **THE THIRD ROW IS THE ONE THAT MATTERS AND IT IS READ OFF THE `GainNode`.** `live 1.02` where the
shipped boundary gives `live 0.00`, at the same second of the same level, is the mixer having actually
followed the handle — not the strip agreeing with the rig about a redrawing. The two columns being
visible at once is what 0126 built them for.

⚠️ **AND THE READOUT LISTED THE THREE BACKWARDS UNTIL IT WAS DRIVEN.** `SECTION_ORDER` runs from the
boss outwards because that is the order the clamp has to reason in — each boundary is bounded by the
one nearer the boss — and printing that order beside a strip that reads left to right made the labels
disagree with the thing they label. Obvious in the browser, invisible in the module.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix, and no distance moves.

⚠️ **`dist/` IS NOT BYTE-IDENTICAL, WHICH IS THE DIFFERENCE FROM 0126, 0129, 0130 AND 0137.** Those
touched nothing under `src/`; this one does, so it is measured rather than asserted: **180,788 →
180,839 bytes, a difference of 51.** That is the `SECTION_UNITS` object and the default parameter,
and it is the whole price of making the shape of a level driveable. **Every rung the shipped game
reaches is unchanged**, which is what the guards hold and what a byte count cannot say.
