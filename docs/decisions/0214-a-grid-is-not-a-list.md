# 0214 — A grid is not a list, and the reason it was one has expired

**Accepted 2026-09-03.** The second decision in a day whose subject is a **true sentence that stopped
being true** — [0212](0212-the-room-walks-the-level.md) is the other, and the pair is worth reading
together.

> *"the menu itself is arranged in a nine-tile square layout order, but is functionally an up/down
> menu on controller, not an up/down/left/right menu."*

## The rule

**The pad reports a direction AND an axis; the chrome decides what the axis means.** `src/app/menu.ts`
stops at *which way was pushed*, because it does not know how anything is laid out.
`src/app/chrome.ts` resolves that against the controls' **actual boxes**, because it is what laid them
out.

**A push the layout has no opinion about still moves the focus.** That is the fallback, and it is the
half of the old rule that was always right.

## ⚠️ Both axes were collapsed on purpose, and the argument was correct when it was written

`src/app/menu.ts` said so in as many words, above the line that did it:

> *"Both axes move the focus, and that is not laziness. A column of buttons wants up and down; a row
> of them wants left and right; and the player does not know which one the chrome laid out — a menu
> that only answers one axis is a menu that feels broken on whichever screen picked the other."*

**Every screen in the game was a column or a row**, so the two axes really were one ask, and reading
them as one really was the right answer. [0210](0210-the-title-plays-the-music.md) then put nine
controls on the music room and the stylesheet laid them out as a **grid** — a wrapping row on a wide
screen, an explicit three-column grid on a short one. On a grid the two axes mean different things,
and a reader that cannot tell them apart makes a nine-tile square behave like a nine-item list.

⚠️ **THE D-PAD IS WHERE IT SHOWED FIRST, AND THAT IS NOT A COINCIDENCE.** `up` and `left` both meant
−1 and `down` and `right` both meant +1 — four buttons into two branches, which is exactly right for
a list and is the whole of the report on a grid. A D-pad is what a hand reaches for in a menu.

## Off the boxes, and not off a declared column count

⚠️ **HOW MANY CONTROLS ARE IN A ROW IS A FACT ABOUT THE VIEWPORT, NOT ABOUT THE SCREEN.** The room is
a wrapping row above 460px tall and a fixed grid below it (0210's own container query), so a column
count handed to the chrome would be wrong on one of those two — and a screen re-laid-out in an art
pass would break it silently. `getBoundingClientRect` is what the player is actually looking at.

⚠️ **A LAYOUT READ IS AFFORDABLE HERE AND NOWHERE NEAR A FRAME.** This runs on a press.
[0022](0022-frame-rate-is-a-feature.md)'s budget is about the frame loop, and `tests/budget.test.ts`
keeps `src/app/chrome.ts` off the hot list precisely so the chrome may do DOM work when a player asks
for something.

**The wrap is down the same line, not round the list.** Down from the bottom row reaches the top of
that column; a list step would reach the next row's first control, which is a diagonal nobody asked
for.

## ⚠️ The held state needed the axis too, and that one loses an input rather than misplacing one

`right` and `down` are both `+1`. With only the number remembered, a hand rolling from one to the
other meets a reader that already holds `+1`, and **the second push is never delivered at all** — a
dead control, which is harder to notice and harder to report than a wrong one. On a column the two
were the same ask, so this could not have happened before there was a grid.

## The fallback is unreachable on every screen the game has, so it moved somewhere testable

⚠️ **THE TITLE SCREEN ONLY LOOKS LIKE A COLUMN.** Its settings row ([0070](0070-a-style-is-a-setting-and-the-first-one.md))
puts controls to the side of the tiers, so *something* always lies to either side of *something* and
`spatially` never returns `null` on any shipped screen. **A branch no data can drive is guarded by
nothing** — [0005](0005-a-guard-must-be-seen-to-fail.md) reached from the other side, and the same
argument that split `rungIn` out of `rungOf` in `src/content/themes.ts`.

So `spatially` takes **rects rather than elements**, and `tests/chrome.test.ts` hands it a column
that does not exist yet. That is what makes the fallback a thing anybody can check.

## ⚠️ And the probe found a guard covering half of what it claimed

The first version of *says which axis the push came from* asserted two of the D-pad's four branches.
`npm run prove` broke `left` alone and the suite stayed green. **The D-pad is four separate branches
now**, and a guard over half of them is a guard over the half that happens to be right.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0214`.

| broken on purpose | went red |
|---|---|
| the focus back on a list walk, so a nine-tile grid moves one control at a time in reading order | `moves DOWN a column and RIGHT along a row` |
| the d-pad collapsed back to a direction with no axis, so left and up are one ask again | `says which axis the push came from` |
| the held state back to a bare direction, so rolling from right to down is swallowed | `hears a roll from one axis to the other as a second ask` |
| a column answering a horizontal push, which jumps the focus down a list nobody asked to move | `has no answer for an axis the layout does not use` |

## What this does not change

**The stick still resolves a diagonal to one answer.** `dominant` picked an axis and threw it away;
now it picks the same axis and says which. Every threshold
[0055](0055-a-press-belongs-to-one-screen.md) established — the release floor, the reversal magnitude,
the refusal to require a trip through the centre — is untouched, and **its own probe was re-anchored
rather than weakened**: `npm run prove` stranded it on the line this decision widened, which is the
harness catching a probe going stale in the same change that moved the code.

**The keyboard and the touchscreen were never affected.** They reach a focused `<button>` through the
DOM's own conventions, which is [0046](0046-a-pad-is-a-first-class-way-to-press-a-button.md)'s whole
reason for this file existing: the pad is the one device that cannot.
