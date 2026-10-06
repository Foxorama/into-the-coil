# 0558 — A run ends at the title

**Accepted 2026-10-06.** Asked: *"fix the lives bug and the run ending properly so that things reset
correctly."* Adds a third agreement to [0017](0017-the-state-is-slices.md)'s root, and the run's end to
the lifecycle [0068](0068-a-run-over-is-a-continue.md) tabulates.

## What was measured first

In the shipped page, a run flown and then quit from the pause (`tests/run-ends.browser.test.ts`, against
`main`):

- **The title read ×3 lives.** The readout on the title after the quit still showed the run's full
  complement. Only `lifeLost` takes a life, and nothing ended the run. A victory leaves for the title the
  same way.
- **The pad stood the last run's wheels on the next pilot's ship.** With the Firebird on spinners, a run
  quit, and the caddie's pilot chosen on the title, Paint & Parts' pad turned 120 pictures a second. The
  caddie has no wheels: those were the Firebird's spinners.

`initialRun` already says what *no run in progress* is: zero lives. The shell reads lives above nought as
*a run is flying*. `fitPilot` refuses to refit the world, and `fitAtlasGun` bakes the run's ship as the
one in flight. So after a quit or a win, the world kept the last run's ship for the rest of the tab, and a
fresh tab was the only way out. That is the shape of the play report *"the spinning wheels were spinning
happily until I bought them, now none of the wheels spin"*, which came right in a fresh tab: a rim fitted
or tried on at Cosmo's after a quit or a win never reached the pad.

⚠️ **A first diagnosis was refuted by a measurement that never measured anything.** `tests/globalSetup.ts`
runs `vite build` before every browser suite, so a `dist/` built from a reverted tree is rebuilt from the
working tree before the test reads it. Every "old build" comparison made that way compared the fix with
itself. The measurements above were taken with the tree itself at `main` for the whole run.

## The rule

| | |
|---|---|
| **the run's half** | a run that ARRIVES at the title is over: the root routes the run slice an `ended` action, which takes its lives to nought and leaves the rest of the account as a run out of lives leaves it |
| **on arriving, not on being there** | *Fly* begins a run with the title still up, so a rule about standing on the title ended every run it began. It is in the screen route, where the change of screen is known, and not in `agree` |
| **every way there** | quit, victory, game over, and a continue walked away from. The rule is the title's, so a way off a run not written yet arrives at it too |
| **the shell's half** | on that arrival, if a run has begun since the shell last left one, the world is refitted to the pilot (`fitPilot`) and the readout synced (`leaveRun` in `src/app/mount.ts`) |
| **not the field** | the title is drawn on the void (`placeOnScreen`), so the run's remains are never seen there, and the next thing to show the field sweeps it itself: a run (`begin`) and the music room (`enterRoom`). A sweep at the title was written, changed nothing on the screen, and was taken out |

## Why it is built the way it is

**An agreement, because neither slice may import the other.** The screen does not know a run exists, and
the run does not know which screen is up. 0017 puts what is true between them in the root, beside *a run
with no lives on the playing screen is over*.

**The account is left as it stands.** The run-over screen reads it on the way in and the score table is
written from it on the way out. `begin` empties it when the next run starts, which is where 0067 put the
run's reset.

**`leaveRun` has no guard of its own.** With lives at nought, any later refit (a pilot chosen, a fitting
changed) already reaches the world, and that is what the browser guard measures. What `leaveRun` adds is
that the world is the pilot's before any of those happen. That is seen only where the world's own ship is
drawn outside a run (the music room's flythrough), and it is not worth a browser suite.

## What holds it

- `tests/run-ends.test.ts`: in the reducer, a run quit, won, or left from any screen has no lives at the
  title. A pause, its settings and its guide keep the run. The next run begins stocked.
- `tests/run-ends.browser.test.ts`: in the page, a pilot chosen after a quit stands on the pad in their
  own ship, with no turned picture over a ship with no wheels.

Each is broken by a probe in `scripts/probes/0558-a-run-ends-at-the-title.mjs`, and both were seen red.

## What is owed

A play of the spinners after a won run and after a quit. It should show whether this was the whole of
the report.
