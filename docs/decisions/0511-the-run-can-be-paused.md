# 0511 — The run can be paused

**Accepted 2026-10-04.** Item 3 of [`the-menus-reviewed`](../../reports/the-menus-reviewed-2026-10-02.md):
*"we also need to add a pause/settings button in game as well so that people can pause, change
settings or quit mid-game if they want."* Before this, the only way to leave a run was to die.

## The rule

**A run can be paused from play by a button in the top strip, by Escape or P, by Start on a pad, and
by the tab being hidden. A paused run holds the audio clock as well as the world. It resumes through
a two-second count-in, and a quit asks once and is kept on the table.**

| | |
|---|---|
| **the screens** | `paused` (*Resume*, *Settings*, *How to play*, *Quit*), `quit` (*Quit this run?*: *Keep playing*, *Quit*), `resuming` (*Ready*, a count over the stopped field) |
| **offered on** | `playing` only. The break and the burn leave by themselves within seconds, and a pause there would resume into a screen that had already half expired |
| **the ways in** | the plate left of the score, Escape and P (`code`, so a non-QWERTY P is where P is), pad Start (button 9, free in play), and `visibilitychange` to hidden. A count-in that is hidden half way becomes a pause again |
| **the ways out** | *Resume*, Escape, B and P go through the count-in; *Settings* and *How to play* are the title's own two screens and come back here; *Quit* asks first, with the cursor on *Keep playing* |
| **what is held** | the sim (`steps: false`) and the `AudioContext`, suspended. Also Settings and How to play when a pause opened them |
| **a quit** | kept on the table like a run over, if it makes the ten (answered 2026-10-02) |
| **the count-in** | two seconds, shown over the field with the readout up. A play number |

## Why the audio clock and not only the world

The music free-runs on `AudioContext.currentTime` ([0160](0160-the-music-free-runs.md)), and the
volleys authored to the beat are phased against it. A pause that stopped the world and muted the music
would leave the clock counting: the run would resume with its volleys off the beat by however long the
pause lasted. Suspending the context stops `currentTime`, so the music and the run resume together
where they stood. The same reasoning is why a hidden tab pauses. The loop stops on a hidden tab, the
music did not, and the run came back apart.

**Every gesture used to resume a suspended context** (`unlock`), which is right after a backgrounded
tab and wrong under a pause. A press on *Settings* would have started the music under a held run. So
`WebAudioOut.hold` keeps a flag that `unlock` respects.

**What this costs:** the pause's menus are silent, because their ticks play through the suspended
context too. Nothing else was cheaper and also right. A context that kept running for menu cues would
also be keeping the clock running.

## What it changed that was not the pause

- **Back from the pause is the count-in** (`back: 'resuming'`), so B and Escape resume through the
  row like any other Back. That made the pause the first screen with a Back to open Settings, and the
  opener rule, *recorded from a screen with no way back*, would have sent Settings' Back to the title.
  `src/state/slices/screen.ts` now records the opener from **outside the menu**: anything that is not an
  opener-row or a screen that goes back to one.
- **`tests/menu.test.ts`'s *goes back to a screen that cannot itself be left*** now accepts a screen
  left by its own clock. The count-in is never left by a press. Its Back was always about dead ends,
  and the count-in is not one.
- **The countdown is drawn where the world stopped** (`!row.steps`), and it was drawn where the scene
  was dimmed. The two were the same set until the count-in, which stops the world and shows it. The
  menu guard that said *a screen that does not dim never carries a countdown* says the same thing
  about the count-in by name (`pause: 'held'`), with the reason beside it.
- **Settings under a held run has no music room.** The room sweeps the field and walks a level of its
  own (0212, 0213), over the field a held run is standing in. `Chrome.setActionShown` takes an action
  off a screen and out of the cursor's row.

## What guards it

- `tests/pause.browser.test.ts` presses it as a player does, with `AudioContext.prototype.suspend` and
  `resume` wrapped before the page loads. It checks that Escape suspends; that a press on the pause
  resumes nothing; that the count-in shows the readout and lets the clock go only when the run
  returns; that Settings from a pause has no music room and comes back to it; that P resumes; that a
  hidden tab pauses; that Quit opens on *Keep playing*; and that a quit lands on the table.
- `tests/pad.test.ts`: Start asks once per press, never while held, and never on the step after a
  screen change (`spend`), so the Start that resumed the run is not heard as a second pause.
- `tests/menu.test.ts`: the opener survives a pause, and the two lists with a reason per entry name the
  new screens.

Probed in `scripts/probes/0511-the-run-can-be-paused.mjs`, eight breaks, each seen red.

**Photographed** at 1280×720 and 844×390 at a device scale of two: the pause plate on the strip's line
left of the score, the pause screen, the question and the count-in over the field.

**Not checked by any guard: how the pause sounds when it lets go.** A suspended context resumes
mid-buffer. Whether a held note clicks on the way back is a listen, and the listen is owed.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
