# 0633 — A beat that stands still holds nothing

**Accepted 2026-10-18.** From [`the-run-resets`](../../reports/the-run-resets-2026-10-18.md), item 1. Amends
[0104](0104-the-gun-plays-a-figure.md)'s grid.

## The ask

> *"finishing a run with lives you hear a death noise when changing screens"*

## What was true

0104 put the explosions on the grid: a gridded cue waits for the next sixteenth, at most `FIRE_GRID` steps away.
The speaker reads its beat off `world.steps`, which moves only on a screen that steps (0094).

After a win, every screen is still: the cleared sheet, the outro, the victory sheet, the title. So the count stood
on the step the fight ended on, off the grid five times in six. The finale plays its five kills and its boss-down
through the speaker during the outro (0426). Each was marked waiting, on a beat that never reached the next
sixteenth, and none was heard.

On the title, `leaveRun` closes the run, and `closeRun` sets `steps` back to 0. Nought is on the grid, so the next
step let everything held go at once: a kill and a boss-down together, both ducking the music, on a screen change.

A game over never showed it, because its death beat is on a screen that steps and drains the queue.

## The rule

**A beat that stands still holds nothing.** If the step the speaker is handed is the one it was handed last, the
world is not stepping. There is no bar to land on, so what waits sounds now.

On a stepping world the count moves every step, so nothing about the grid changes there. On a still one, a
gridded cue sounds one step after it is asked for. The finale's explosions are now heard during the outro, with
the picture they belong to.

## What guards it

`tests/sound.test.ts`, *0633*, in the steps the player hears:
- with the beat frozen off the grid, a kill and a boss-down sound on the next step;
- after three hundred more frozen steps and a reset to 0, nothing further goes off.

The probe in `scripts/probes/0633-a-beat-that-stands-still-holds-nothing.mjs` puts the old flush back; seen red.

0104's own test still holds on a moving beat: a kill waits for its sixteenth, and for at most one.

## Owed

- **A win by ear**: the finale's explosions heard in the outro, and silence on the way to the title.
