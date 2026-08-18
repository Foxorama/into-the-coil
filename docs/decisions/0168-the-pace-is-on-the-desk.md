# 0168 — The pace is on the desk

**Accepted 2026-08-18.** A report about the whole level, answered with a readout rather than a number
in a file.

> *"Approach slows down the beat instead of maintaining/increasing… same thing on all levels."*

## The rules

**`notesPerBar` lives in `src/content/themes.ts`**, beside `voicesOf`, because it is content
arithmetic and three callers want it. `tests/pace.ts` re-exports it; nothing counts steps twice.

**`paceAt` asks `rungOf`.** One function decides which ladder a place plays; everything else asks it.

**The pace arc is printed and never asserted** — [0161](0161-the-shape-of-a-level-is-not-guarded.md).
What is guarded is that the desk's number is the guard's number, and that the count is a count.

## ⚠️ The report is exact, and it is every place

`notes/bar` per rung, from `rungShape`:

| place | run | push | surge | **approach** | boss | drop into approach |
|---|---|---|---|---|---|---|
| approach (base) | 118 | 188 | 172 | **139** | 182 | **−19%** |
| nebula | 124 | 192 | 198 | **165** | 193 | −17% |
| saurian | 150 | 226 | 231 | **167** | 189 | **−28%** |
| labyrinth | 139 | 200 | 205 | **152** | 186 | −26% |
| rime | 135 | 202 | 203 | **154** | 185 | −24% |
| mire | 141 | 206 | 208 | **154** | 190 | −26% |
| core | 142 | 207 | 213 | **170** | 229 | −20% |

⚠️ **AND IT IS TWO DROPS RATHER THAN ONE.** The base also falls `push → surge`, 188 to 172, which the
report did not mention and the arc makes obvious.

⚠️ **THE CAUSE IS `RUNG_CLOSES.approach` AND IT IS NOT A BUG.** `approach` closes `groove` and `hook`
— both dense — and opens `toll` and `dread`, both held at a quarter note a beat.
[0120](0120-a-rung-may-close-a-layer.md) made closing a layer the mechanism that lets a boundary read
as one, against *"the additions are subtle"*, and it was right. **The trade is correct in kind and
wrong in density.**

## ⚠️ So it is a readout, not a fix

[0161](0161-the-shape-of-a-level-is-not-guarded.md) settled that a level's shape belongs to whoever is
authoring it and floors belong to the guards. Choosing what `approach` opens is shape. What was
missing is that the person choosing could not see the consequence:
[0163](0163-the-script-is-edited-here.md) put the ladder on the desk and the only feedback was the
sound itself.

The header now prints `pace 139/bar` and the arc `118 ↑ 188 ↓ 172 ↓ 139 ↑ 182`, computed from the
ladder the desk is driving. Driven: parking at `approach` and typing `0.9` into `arp`'s ladder field
takes the arc to `118 ↑ 188 ↓ 172 ↓ 171 ↑ 182` — the trough almost closed, in one gesture, with the
sound in the room.

⚠️ **IT IS FREE, WHICH IS WHY IT CAN BE IN A FRAME.** Counting non-null steps is not DSP; every other
figure on that panel is.

⚠️ **AND IT IS IN THE PASTE**, because *"approach slows down"* is a claim about a level and a moment
copied at one rung could not carry it.

## ⚠️ Two guards, because the obvious one has a hole

**The wiring**: `paceAt(theme, rung)` equals `rungShape(...).notes`, every place, every rung. That
catches a desk counting layers the mixer does not open.

⚠️ **AND IT CANNOT CATCH A BUG IN THE COUNTER, WHICH `npm run prove` DEMONSTRATED.** Both sides call
`notesPerBar`, so an error inside it moves both equally and the equality holds — a probe that counted
rests as notes reported **STILL GREEN**. The second assertion hand-counts a pattern that contains both
a rest and a root, which is the only shape that catches `if (step)` written for `if (step !== null)`:
a rest is `null` and the root is `0`, so truthiness gets both wrong at once and the total stays
plausible.

## ⚠️ And a guard two decisions old went quietly green, which is the part worth keeping

`paceAt` was first written with its own `ladder: ThemeRow['ladder'] = THEMES[theme].ladder` default.
[0162](0162-a-place-has-its-own-ladder.md)'s routing guard is a **source scan** for exactly that
expression — so with two of them in the file, the probe that rewrites `rungOf`'s left the other one
satisfying the scan, and a guard that had gone red for two decisions stopped firing.

⚠️ **A SECOND CALL SITE DEFEATED A SOURCE SCAN WITHOUT TOUCHING IT**, which is the standing cost 0162
records about scanning for an expression instead of comparing a value. `paceAt` now asks `rungOf`
rather than defaulting for itself — one router — and the probe fires again. **The fix is better design
and not a workaround**, which is the only reason it is acceptable.

## Confirmed, not assumed

- The pace table is `scripts/weigh-rung.mjs`'s, which shares `rungShape` with the guard — 0029.
- The readout driven in a browser: the arc, and the arc moving on a ladder edit.
- `npm run check` green.
- Two probes, seen red, trees restored: `node scripts/prove-guard.mjs 0168`. 0162's four re-checked
  and all four red again.

| broken on purpose | went red |
|---|---|
| the pace counted off the base composition, so six places report level one's patterns | `0168 — THE DESK'S PACE IS THE GUARD'S PACE, layer for layer and rung for rung` |
| a rest counted as a note and the root dropped, which is one `!= null` becoming truthiness | `0168 — THE DESK'S PACE IS THE GUARD'S PACE, layer for layer and rung for rung` |
