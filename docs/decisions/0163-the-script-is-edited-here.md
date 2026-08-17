# 0163 — The script is edited here

**Accepted 2026-08-17.** The last piece before a level's music can actually be authored by ear, and
the one [0158](0158-a-level-says-where-its-sections-open.md) deliberately left out so that its own
landing stayed provable.

> *"can we rearrange the four sections? or have them different per level as well? some levels kick
> right into a surge etc."*

## The rule

**A level's music script is edited in the dashboard.** A section's NAME comes from a dropdown, its
distance from a number or the strip's handle, and `+` / `×` add and remove one. Every edit reaches
the game's own mixer on the next tick.

## ⚠️ Why dragging was never going to be enough

[0138](0138-a-section-boundary-is-a-distance-you-can-drag.md) gave the strip handles and 0158 made the
script per level, and between them a boundary can be moved anywhere. **Neither can change which
section is FIRST** — and *"some levels kick right into a surge"* is exactly that.

Until this, finding that shape by ear meant typing it into `src/content/levels.ts`, rebuilding and
listening: the round trip [0126](0126-the-dashboard-is-the-instrument.md) exists to remove, on the
one channel where the round trip is most expensive because nothing in a test can hear.

## What was driven

`npm run dash`, level one. The row that matters is the first:

| | read back |
|---|---|
| at 0:15, shipped | rung **RUN**, `counter` **silent 0.00/0.00**, `hook` **silent 0.00/0.00** |
| **entry 0 renamed `run` → `surge`, one dropdown** | rung **SURGE**, `counter` **target 1.52, live 1.43**, `hook` **target 1.41, live 1.32** |
| the script after it | `surge → push → surge → approach` — **a name used twice**, which 0158 made legal |
| `+` after entry 1 | landed at **1892**, exactly midway between 1249 and 2534 |
| `×` on it | back to four entries, unchanged |
| switched to Ember Nebula | **its own** script, put-back greyed |
| switched back | the edit still there, put-back live |
| **put it back** | `run@0 push@1249 surge@2534 approach@3627`, and the button greyed itself |
| **copy this moment** | the edited script as a pasteable `sections:` array, with the shipped one beneath it |

⚠️ **THE FIRST ROW IS READ OFF THE `GainNode` AND IS THE WHOLE DECISION.** A level opening at its
loudest, found in one dropdown, heard through the game's own mixer over its own ramp. The ask was
made this morning and the answer is a `<select>`.

## ⚠️ And the panel was packed until it refused

Adding sections until every `+` greyed itself out: **56 entries**, smallest gap **68 units** against a
floor of 57.6, last entry **80 units** clear of the boss, no console errors, and the strip still drew
every rung.

⚠️ **`addSectionAfter` REFUSES RATHER THAN SQUEEZING.** The alternative is shuffling the neighbours,
which moves boundaries the author did not ask to move — silently, to make room for one they did.
**Returning the script unchanged is what lets the button grey itself out** rather than accept a click
that quietly rearranges the level.

## ⚠️ The grips come from the script, and packing it is what proves that was right

At 56 entries the strip drew **6 segments and 55 grips**. `rungMarks` emits one mark per CHANGE, so
fifty-six entries naming four sections merge into six marks — **marks and entries do not correspond
and cannot.** 0158 moved grip placement onto the script for this reason; this is the first state that
actually exhibits it.

## What is guarded

| | |
|---|---|
| a rename moves nothing, and **entry 0 may be renamed** | ✅ `tests/dash.test.ts`, every entry × every name |
| an add lands strictly between its neighbours, and every gap stays a floor | ✅ |
| **an add refuses rather than squeezing** when the gap is under two floors | ✅ including the exact one-floor case |
| a remove refuses entry 0 and refuses emptying the script | ✅ down to one entry, which is legal |
| the pointer, the dropdown, the redraw | ❌ needs a browser — driven, above |

⚠️ **THE THREE OPERATIONS LIVE IN `rig/transport.ts` AND NOT IN `rig/dash.ts`**, on 0138's own terms:
what an edit RESOLVES TO is arithmetic a headless test can drive, and the pointer that triggers it is
not.

## ⚠️ And it corrects a defect I shipped in #206

The panel's own instructions were still the previous mechanism's. It said the boundaries were
*"units back from the boss"* and *"ONE set for all seven levels, because the game's are"*, and that
**copy this moment** printed constants for `src/content/music.ts`. 0158 inverted all three the same
day and left the prose behind.

⚠️ **A TOOL WHOSE INSTRUCTIONS DESCRIBE THE PREVIOUS MECHANISM IS WORSE THAN ONE WITH NO
INSTRUCTIONS**, because it reads as current. Nothing catches this — `tests/links.test.ts` checks that
citations resolve, not that prose is true — and the only reason it was caught is that this change
touched the same panel.

## ⚠️ And a place's LADDER is edited here too, which was the other half

[0162](0162-a-place-has-its-own-ladder.md) made *which layers a section opens* a place's own answer and
left it as a table to type. Asked for: *"I need to edit this and run this in the dashboard itself…
add it all in so I can use the dashboard to do it all."*

Every layer row gains a **ladder** field for the rung the transport is parked at. It is threaded, never
patched into `THEMES`: `setLevel` and `momentOf` both take it, so the audio and the readout move
together, and the shipped game passes nothing.

| | read back |
|---|---|
| the header | follows the transport — `at run`, then `at surge` after a scrub |
| **`arp` at `run` set to 0.70** | target **0.00 → 1.29**, field marked as edited. This is the layer [0162](0162-a-place-has-its-own-ladder.md) exists for: **zero in the shared ladder and unreachable by any multiplier** |
| **`counter` at `surge` set to 0** | target → **0.00** — a place CLOSING a layer the shared row opens, which is the `??`-not-`\|\|` case |
| **copy this moment** | `approach: { ladder: { run: { arp: 0.70 }, surge: { counter: 0.00 } } }` — only the rungs and layers that differ |
| edited Ember Nebula, put ITS ladder back | The Approach's edit **survived**; its own put-back then restored `arp` to 0.00 |

⚠️ **THE FADER AND THE LADDER FIELD ARE DIFFERENT THINGS AND THE PANEL SAYS SO.** A fader is
[0129](0129-the-desk-holds-a-value-not-a-multiplier.md)'s absolute HOLD — for hearing a layer now. The
ladder field is CONTENT — what the level should do — and it is what gets pasted back.

⚠️ **THE FIELD IS NOT REWRITTEN WHILE IT HAS FOCUS.** The readout runs sixty times a second, and
writing `value` into the input somebody is typing in eats the keystroke and resets the caret.

## ⚠️ The `live` column could not be read this session, and here is what stands in for it

`document.visibilityState` was `hidden` — the browser pane was not compositing, so the audio unlock
could not complete and every `live` cell read `0.00`, including layers the shipped ladder opens. **That
is silence, not a defect**, and it is not evidence either way.

**What replaces it is stronger than one live reading.** `setLevel` does nothing but write
`levelWrites`' answers onto the gain nodes ([0117](0117-a-section-change-lands-on-the-beat.md)), so a
guard that drives an **edited ladder through both `momentOf` and `levelWrites`** and finds them equal
proves the readout cannot be showing a mix nobody hears — for every layer at seven seconds of seven
levels, rather than one layer at one second.

⚠️ **AND 0154 IS THE RECORDED INSTANCE OF GETTING EXACTLY THIS WRONG**: its solved-mix toggle was handed
to `momentOf` and not to `setLevel`, so it changed *the readout and not one sample of audio*. The same
mistake was available here, which is why the guard asserts both — and why it also asserts the edit
**moves** something in each direction, or it would be two identical wrong answers agreeing.

## ⚠️ And a source scan had to be re-aimed twice, the second time by itself

0162's scan checked that `rungOf` passes `THEMES[theme].ladder`. Threading the ladder moved that claim
into the function's **default parameter**, so the scan needed re-aiming — and the first re-aim **went
red on a correct file**, because `bare()` blanks string literals and the declaration reads
`ladder: ThemeRow['ladder'] = …`. The pattern now matches only the default, which is the load-bearing
half. **A source scan failing loudly on its own subject is the direction that class of guard should
fail in** — 0138's own words about the same machinery.

## What it costs

| | |
|---|---|
| every gain the shipped game writes | **byte-identical to before 0162** — the same 147-row fingerprint, re-run after the threading |
| `dist/index.html` | 253,177 → **253,218, 41 bytes** for three optional parameters and `SECTION_NAMES` |
| the section editor's own cost | **nothing** — `rig/` is not in the build ([0003](0003-single-file-build.md)) |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix.

⚠️ **`src/` IS TOUCHED AND `dist/` MOVES, WHICH IS THE DIFFERENCE FROM A RIG-ONLY CHANGE.** Threading
the ladder means `levelWrites`, `setLevel` and `rungOf` each take an optional argument the shipped game
never passes — 0138's shape, and `tests/dash.test.ts` scans `src/` to keep it that way. Plus
`SECTION_NAMES`, a list the union was already derived from in spirit and now is in fact. **Every gain
the shipped game writes is unchanged**, which the guards hold and a byte count cannot say.

## What this is for

**Nothing is authored yet, and that is deliberate.** The next step is a driving session: the player
finds the shapes by ear, and what comes out of *copy this moment* is pasted into
`src/content/levels.ts` with a play-test behind it. [0161](0161-the-shape-of-a-level-is-not-guarded.md)
is why nothing will object to what they choose, and
[0162](0162-a-place-has-its-own-ladder.md) is the other half — **which layers a section opens** is now
a place's own answer too, and it wants the same treatment.
