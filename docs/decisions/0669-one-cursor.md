# 0669 — One cursor

**Accepted 2026-10-24.** Item 2 of [`the-menus-planned`](../../reports/the-menus-planned-2026-10-24.md), from finding 5
of [`the-menus-reviewed-again`](../../reports/the-menus-reviewed-again-2026-10-24.md), answered *"Agree with the
suggested answers."* It amends [0561](0561-the-cursor-tries-on.md) (the brackets, now on every screen) and
[0458](0458-the-title-is-rows.md) (the ring), and keeps [0046](0046-a-pad-is-a-first-class-way-to-press-a-button.md)'s
rule that the pad's cursor and the keyboard's focus draw the same picture.

## The ask

The review found three cursors: white corner brackets on a hangar option and on the title's pilot band (0561, 0571);
a cyan ring on the title's buttons, the tier band and every Settings control; and a dark outline on a hangar tab
under a pad. *"The 10-07 review asked for one look; two screens got it."* And on the title, nothing said why a
locked pilot was one: the lock's line was the hangar's focus card's.

## The rule

**The brackets are the cursor on every screen.** A band wears them on the option it is on, as since 0571; every
other control — a button, a tab, a chip, the pause family's, the music room's grid — wears them on its before-box,
laid over it and breathing unless motion is reduced. No cursor or focus state draws an outline or a shadow. The fill
means *chosen* and nothing else.

- **Inside the control's edge, not outside it.** The title's quiet row clips its own box (it cuts a long word short
  rather than wrap, 0458's margin of fonts), and brackets outside the edge were cut off there. Inside it they sit on
  the rim, white over the ink, on every control alike.
- **The three that keep their own light**: the intro's Skip and the pause button in a run, which no menu's cursor
  walks, and a shop in the dock's picture, lit under the pointer (0572) while the tab strip is the pad's way across.

**The title says why a pilot is locked.** A step along the title's pilot band, with the cursor on it, may stand on a
locked face: the brackets go round it, the line under the faces says that pilot's name and what opens them in place
of the ship and the gun, and the pilot chosen does not change. A press there is refused, the band shaking once as a
shut option on a hangar band does (0561). *Ready* (0668) stands down while the cursor looks. A trigger or a shoulder
stepping the pilot from elsewhere on the screen still skips the locked ones, since nothing would show the look.

## Why a look and not a step

A band that takes chooses as it steps: the cursor on a pilot is the pilot. Stepping onto a locked one would choose a
pilot who cannot fly, and *Fly* would take them. So the step stands on the face as a look, the hangar's mechanism for
a slot that tries (0561's `look`), and chooses nothing. Before this, the cursor could never reach a locked face on the
title — every step skipped it — so the plan's *the line says it with the cursor on a locked pilot* had nowhere to
happen.

## What it cost and the guards it moved

- **`tests/chrome.test.ts`**: every screen with a panel has a rule laying the brackets over a control the cursor is
  on, and no rule whose selector is a cursor or a focus state on a walked control draws an outline or a box-shadow.
- **`tests/menu.browser.test.ts`**: *draws a cursor on the control it would press* reads the brackets' eight strokes
  on the before-box, where it read the outline's style; and *0669* walks the stubbed pad right along the title's band
  until it stands on a locked face, reads the lock's line under the faces, finds the chosen pilot unchanged, and
  finds A there neither flies nor chooses. 0668's walk steps left now, onto an open pilot: right of the default, on
  a store with every tier finished, is a locked one.
- **0039's prefix probe** anchored on the ring's declaration, which is gone; it is re-anchored on the brackets'
  keyframes. 0513's re-anchored on the press's new branch.

Probed in `scripts/probes/0669-one-cursor.mjs`: a ring put back on the title's cursor, the brackets not drawn, the
band skipping its locked pilots again, and the line saying the gun on a locked one.

**Photographed** at the pair, the guard's six and the two wide sizes, and the cursor walked on the keys: on *Fly*,
the quiet row, the tier band, a locked pilot, a Settings tab and band, Controls, and the hangar.

## What is owed

- A pad and a keyboard in a hand: whether the brackets inside the edge read as the cursor on a pill-shaped tab, whose
  corners the brackets stand clear of.
- **Found while photographing, and not this change's:** on the keyboard, right from *Hangin' Out* on the title's
  quiet row lands on *Fly*, and a second right reaches *Settings*. The same build without this change does the same;
  the pad's walk (0458) goes straight across. Owed its own look.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
