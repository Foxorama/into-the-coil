# 0672 — The controls are a table, and a band of two is a switch

**Accepted 2026-10-25.** Item 5 of [`the-menus-planned`](../../reports/the-menus-planned-2026-10-24.md), from finding 7 and
§1.4 of [`the-menus-reviewed-again`](../../reports/the-menus-reviewed-again-2026-10-24.md), answered *"Agree with the
suggested answers."* It amends [0664](0664-the-controls-are-bound.md) (the layout of the Controls tab) and
[0590](0590-the-settings-are-tidied-and-the-game-has-a-left-hand.md) (a band's press), and reads
[0613](0613-the-dance-is-earned.md) for the rumble's line.

## The ask

> *"The Controls tab is bindings as a grid of twelve buttons, with Reset to defaults and Back in the grid as if they
> were bindings, and the keyboard's and the pad's trigger bindings interleaved … A table of action × device, with the
> two reset-and-back actions in a foot, is what the genre does and what How to play already draws beside it."*

And: *Sound*, *Travel*, *Hand* and *Rumble* are each two chips with arrows either side, three stops for one bit;
Rumble's hint names one ship's special as if it were the rule; Save's warning is set in the hint's weight.

## The rule

| | was | is |
|---|---|---|
| **Controls** | twelve buttons wrapped four to a row, each its name over its binding | a table: a row per thing a hand does — *Fly up*, *down*, *left*, *right*, *Gun*, *Missile* and *Ward trigger* — and a column each for *Keys* and *Pad*. The cell is the button that binds it, showing only what it is bound to; the row's name says what it is. A pad's movement is the left stick, which binds nothing, and the cell says so. *Reset to defaults* and *Back* in a foot under it. A press rebinds exactly as 0664 does |
| **How to play's CONTROLS** | its own grid | laid out by the same function (`controlGrid`), its rows' names read off the same table (`CONTROL_TABLE` in `src/state/screens.ts`); the movement still one row, *Fly*, and the touch column beside the two |
| **a band of two options** | A, Enter and either arrow already flipped it — a press steps round, and Settings' bands come round their ends (0607) — but a click on the chip that was on chose it again | a switch: a click on the chip that is on flips it too. A click on the other chip chooses it, as before |
| **Rumble's line** | *A pad or phone taps when the ball lands.* | *A pad or phone taps when the Hamster Ball lands.* |
| **Save's warning** | the hint's weight | the panel's size, heavy, in the warning's gilt — once, on the line that says the save may be lost |

## Why the rumble line names the ball

The review asked for a line saying what rumble does across the game, or the setting being the ball's. Read in the
code, it is the ball's: the frame plays a feel (`onFeel` in `src/app/frame.ts`) for the Hamster Ball's ram alone — a
landing, a kill, the War Dance's bar full, a shield burnt off by the heat — and the setting's own press. Nothing else
in the game reaches the hands. So the line says whose ball.

## What it cost and the guards it moved

- **Every action button carries its place in its row's actions** (`data-itc-action`), because the table lays the
  Controls tab's out of that order. 0664's browser test pressed the *n*th button; it presses by that place now.
- **`tests/controls.browser.test.ts`**, *0672*, at 1280×720 and 844×390: each row of `CONTROL_TABLE` has its name,
  its keys button and its pad cell at one height, the keys buttons in one column with the pad cells right of them,
  and Reset and Back below the last row.
- **`tests/menu.browser.test.ts`**, *0672*: on the stubbed pad, A on *Sound* flips it, the arrow off its end flips
  it back, and a click on the chip that is on flips it again.
- **On a phone's height** the row names and the stick's cells are a size smaller and the reset's line is not drawn:
  at 480×320 the first build scrolled the tab by 10 px.
- **A first draft also made every band of two come round its ends.** The proof found its break green: Settings'
  bands already come round (0607), so it changed nothing, and it is gone. The test still steps off Sound's end and
  reads the flip, which is 0607's rule seen from the switch.
- **A stand's tabs are not a switch.** Hangin' Out's section band (*Loadout* / *Cockpit*) is a band of two that
  steps, and CI found the first build flipping it to *Cockpit* on a click on the open *Loadout* tab: 0579's
  `tests/loadout-tabs.browser.test.ts` went red. A press on the open tab keeps it open, as a press on a screen's own
  tab does; the section and aisle bands are left out of the switch by name, as the chrome already reads them for
  their tab look.
- **`tests/key-opens.browser.test.ts`'s budget**, 0580's, ran out in CI on the same push. Nothing in this change
  made How to play heavier: a frame on it costs 259 ms in a software-drawn container against 253 ms on 0671's tree,
  1,880 nodes against 1,864. The budget was 120 s against 96 s measured in CI's suite on #660, a headroom of 1.25,
  where [0245](0245-a-budget-is-sized-under-load.md) asks for three. It is 375 s now, three times the worst
  measured (125 s), with the figures beside it.

Probed in `scripts/probes/0672-the-controls-are-a-table.mjs`: the buttons left in their row's order, a click on
the chip that is on choosing it again, and a stand's tabs taken for a switch.

**Not held by any guard:** Rumble's words, and the warning's weight — a style, and the voice rule's.

**Photographed** at 1280×720, 844×390, 480×320 and 1920×1080, Controls and How to play.

## What is owed

- A keyboard's Tab still stops on each chip and arrow of a band; the cursor's walk is one stop a band, and the
  switch makes either chip one press from either state. Taking the chips out of the tab order is not done.
- Whether *Left stick* four times down the pad's column reads as the stick or as clutter.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): the bindings' save is untouched.
