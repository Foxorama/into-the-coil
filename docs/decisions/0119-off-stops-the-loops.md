# 0119 — Off stops the loops, and the guard that half-saw it was a coin flip

**Accepted 2026-08-11.** A CI failure on a **documentation-only** pull request, which is what made it
worth chasing rather than rerunning.

## The rule

**Switching the sound off stops the loops**, a quarter of a second later so the fade completes first.
Switching it on starts them again. `started` is state about whether sources are running, and it has to
be true only when they are.

## What was wrong

`applyMusicLevel` calls `music.start()` **on every frame** — 0094's phase-lock needs it — and
`start()` refuses only while `on` is false. The audio is unlocked by a `pointerdown` listener in the
**capture** phase (`src/app/mount.ts`), which fires *before* the `click` that applies the setting.

> **So a frame landing between the two starts the loops during the very gesture that turns sound
> off.**

`setOn(false)` then only ramped the master bus to zero. `started` stayed true for ever, so
`setOn(true)` called `start()`, which returned immediately. **The music never came back until the
page was reloaded.**

⚠️ **`tests/sound.browser.test.ts` HAD THE CORRECT BEHAVIOUR WRITTEN IN ITS OWN COMMENT** — *"turning
the sound off stops the loops outright, so turning it back on starts four sources as well as sounding
the chime"* — and nothing implemented it. The comment described the design; the code muted.

## Why it was intermittent, and why that mattered more than the bug

⚠️ **THE SAME COMMIT PASSED ON ONE CI RUN AND FAILED ON THE NEXT.**
[0117](0117-a-section-change-lands-on-the-beat.md)'s own run was green; the docs-only PR behind it was
red. Whether a frame lands in a gap of a few milliseconds is a coin flip, and **a loaded CI runner
flips it differently** — the same shape as
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md), whose subject *"only failed under
the load of `npm run prove` itself"*.

⚠️ **0044 SAYS ESTABLISH WHICH IT IS, AND A RERUN IS NOT EVIDENCE.** It is the code. The guard was
asserting something true and desirable and could only see it half the time.

⚠️ **SO THE GUARD WAS MADE DETERMINISTIC IN THE SAME CHANGE, AND WITHOUT THAT THE PROBE WOULD BE A
COIN FLIP TOO.** The test's first gesture used to be the `off` click itself. It now clicks `on` first
— a real gesture that changes no setting, since sound is already on — so the context is unlocked and
the loops are certainly running before anything is switched. **What follows is the same sequence every
time**, and a break in `setOn` reddens it every time rather than half the time.

## What this says about the fix that preceded it

⚠️ **0117 DID NOT CAUSE THIS AND DID NOT FIX IT EITHER.** The race predates it — `start()` has been
called every frame since 0094 and `setOn` has muted since 0090. What 0117 changed is that
`headingFor` now has to be cleared when the loops stop, because a restart re-anchors the bar grid: a
layer whose destination is unchanged would be skipped by `levelWrites` while its ramp belonged to an
anchor that no longer exists. **That line is 0117's, arriving in 0119's fix**, and it is the kind of
coupling worth writing down rather than discovering twice.

## What was rejected

**Stopping on the instant rather than after 0.25s.** The master is already fading over 0.08s; halting
a looping source mid-cycle is a click, and a setting whose entire job is to make the game quiet must
not make a noise on the way out.

**Making `start()` idempotent by checking whether sources exist.** It treats the symptom. `started`
would still be lying, and the next thing to read it would be wrong in a new way.

**Rerunning CI.** [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md), in as many
words. It would have gone green, the pull request would have merged, and the bug would have shipped —
a game that goes permanently silent if you happen to toggle the sound setting.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| off left muting the bus instead of stopping the loops, so turning it back on has nothing to start | `and turning it back on says so, because a setting with no feedback is a broken build` |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save schema, no
cache prefix, no origin. It stops audio sources that should already have been stopped.
