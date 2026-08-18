# 0169 — A browser budget is measured, not guessed

**Accepted 2026-08-18.** Three guards on one page had a wall-clock budget 2.4× the thing it was
budgeting, and it finally came up tails on CI.

## The rule

**A `waitForSelector` budget in a browser test is set against a timing of the path it covers**, and
the timing is recorded beside it. `HUD_MS` in `tests/menu.browser.test.ts` is the first one.

## ⚠️ What was actually happening

Three tests waited `10_000` for `.itc-playing-hud-shown`. Those three are exactly the ones that had
gone red under load: twice locally with a dev server running, and once on CI —
[run 32108577272](https://github.com/Foxorama/into-the-coil/actions/runs/32108577272), a run with
**713 s of test CPU inside 251 s of wall clock**, roughly three times oversubscribed.

Timed on an idle machine, four runs:

| | |
|---|---|
| `goto → canvas` | **505 ms** |
| `canvas → title` | **59 ms** |
| **`press → HUD`** | **4199 ms** |

⚠️ **TEN SECONDS IS 2.4× A FOUR-SECOND TRANSITION.** On a runner that is three times contended that
is not a budget, it is a coin toss — and it had been coming up heads since the tests were written.

⚠️ **THE FAILURE LOOKED LIKE SOMETHING ELSE, WHICH IS WHY IT SURVIVED THREE SIGHTINGS.** Playwright
logged *"locator resolved to visible"* and then timed out, which reads like a flapping element rather
than a slow one. It is the deadline landing on the same poll as the element appearing.

⚠️ **AND THE PRESS BEING SLOW IS NOT A BUG, IT IS THE PREWARM.** A press finishes the bake that boot
did not have time for — [0157](0157-the-prewarm-was-scheduled-one-note-at-a-time.md), and 0102's *the
bake happens before the press*. A machine that boots in half a second has done almost none of it, so
the press pays for nearly all of it. **Four seconds from pressing start to the HUD is a fact about the
game**, not about the test, and it is written down here because nothing had measured it.

## ⚠️ Why thirty seconds is not "widening it until it goes quiet"

[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) forbids exactly that, and it is the
right instinct to check. The difference:

- it is **seven times the measured cost**, not one notch past the last failure;
- it is the same shape as `open`'s existing 15 s over a 0.5 s boot;
- the transition genuinely never happening still fails, in half a minute rather than hanging;
- and the number now has the measurement beside it, so the next person can tell whether it still holds
  rather than guessing again.

⚠️ **THE QUANTITY IS STILL WALL CLOCK AND THAT IS NOT FIXABLE HERE.** Playwright waits in seconds.
What 0044 asks is that the number be *known* rather than hopeful, and four measurements are what
makes it known.

## What this is not

⚠️ **It is not a fix for anything the player sees**, and it is not caused by the change that exposed
it. The budget has been 2.4× since the tests were written; [`the pace is on the desk`](0168-the-pace-is-on-the-desk.md)
was simply the branch unlucky enough to draw a contended runner. It lands there because that PR is
blocked by it.

⚠️ **THERE IS A PROBE, AND AN EXEMPTION WAS THE EASIER ANSWER.** `WITHOUT_PROBES` would have taken
this on 0044's terms — the subject is a measurement, and no edit stages *the number was guessed*. But
an edit does stage **the number is not slack**: shrink the budget to 2 s, under the measured 4.2, and
all three waits go red. They could not, if the press were raising the HUD promptly and thirty seconds
were padding over a broken path. That is the half a reader would doubt, so it is the half that is
proven.

## Confirmed, not assumed

- Four timed runs of the exact path, on an idle machine: `dist/index.html` → canvas → title cursor →
  press → HUD.
- The failing CI run's own numbers: 713 s of test CPU in 251 s wall.
- `tests/menu.browser.test.ts` 6/6 after the change; five consecutive clean runs before it, which is
  why the rate had to be established from CI rather than locally.

| broken on purpose | went red |
|---|---|
| the HUD budget shrunk under the measured 4.2 s transition, so the press cannot finish in time | `starts a run without also throwing the bomb that button is bound to` |
