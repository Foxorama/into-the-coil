# 0139 — A deadline checked between unbounded awaits is not a deadline

**Accepted 2026-08-13.** [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) applied to
the guard that finally exhibited it — *"an intermittent guard has found something, and 'flaky' is not
what it found."*

## The rule

**Every call into a browser page carries its own bound, not just the loop around it.** A budget
expressed as a wall-clock deadline is only honoured at the points it is *checked*; if the awaits
between those points can hang, the budget is decorative.

## What happened

`tests/offline.browser.test.ts > retires its own stale cache and leaves a stranger's alone` died on
vitest's 60-second timeout in CI, on [PR #177](https://github.com/Foxorama/into-the-coil/pull/177),
whose diff touches no service worker, no cache prefix and no origin.

⚠️ **THE TEST TAKES 7.2 SECONDS LOCALLY. An 8× margin cannot be exhausted by slowness** — only by
something that never returns. That is the measurement that turned *the runner was busy* into *find
the hang*, and it is the whole reason this is a decision rather than a rerun.

⚠️ **`page.evaluate` HAS NO TIMEOUT OF ITS OWN.** Playwright's default timeout covers
`waitForFunction`, navigations and locator actions; `evaluate` is not among them. So:

```ts
const deadline = Date.now() + ms;
for (;;) {
  const keys = await page.evaluate('caches.keys()');   // ← unbounded
  if (done(keys) || Date.now() > deadline) return keys; // ← the only place the budget is read
  await page.waitForTimeout(100);
}
```

**The twenty-second deadline is never reached to be checked if the first poll does not come back.**
The same held for the `update()` above it, which goes to the network.

⚠️ **AND A SERVICE WORKER IS THE THING MOST LIKELY TO NOT COME BACK**, which is why this file rather
than another: `activate` can hold the page's task queue while it sweeps caches, and `update()`
re-fetches the worker over HTTP. The two places this test waits are the two places a hang is
plausible.

## What changed

`within(what, ms, work)` races each call against a named bell. The **budget is unchanged** — what
moved is that one poll can no longer eat all of it and then some, and that a hang now says which call
hung instead of producing vitest's bare *Test timed out in 60000ms*.

`POLL_MS` is ten seconds: generous against seven seconds of real work, strict against for ever. It is
not a tuning number and there is nothing to balance — the two bounds that matter are *longer than the
work* and *shorter than never*.

## ⚠️ Seen to fail, because a bound that has only ever been green is not known to work

[0005](0005-a-guard-must-be-seen-to-fail.md). The `update()` call was replaced with
`new Promise(() => {})` and the suite run:

| | |
|---|---|
| before the fix, in CI | `Test timed out in 60000ms` — no file, no line, no call named |
| with the hang planted, after the fix | **fails in 10.17 s**: `serviceWorker.update() did not answer within 10000ms — it hung rather than failed` |
| break reverted | 4 passed, 8.8 s |

## ⚠️ Why there is no probe, and this is the exception rather than a shortcut

[0019](0019-a-probe-must-be-seen-to-apply.md) wants a break in `scripts/probes/` that reddens a
**named guard**. A probe cannot hold this one: planting a hang makes
*retires its own stale cache and leaves a stranger's alone* fail **with or without the fix**. What
the fix changes is the *manner* — ten seconds and a named call, against sixty and silence — and a
probe asserts which test went red, not how long it took or what it said.

**So it is driven instead, and the run is above.** That is the same accommodation
[0130](0130-a-layer-can-be-heard-on-its-own.md) and
[0126](0126-the-dashboard-is-the-instrument.md) make for the half of a browser feature a guard cannot
reach, and CLAUDE.md's *the fix names the guard, the rule, or the reason neither is worth it* is
satisfied by the third.

## ⚠️ What this does NOT claim

**It does not claim to have found the cause of the CI failure.** Nothing here reproduces the hang; a
green rerun is not evidence and neither is this. What it changes is that **the next occurrence
reports which call stopped**, which is the difference between one more shrug and a diagnosis. If it
never recurs, this cost twenty lines.

⚠️ **AND THE OTHER HALF OF THAT INVESTIGATION WAS SELF-INFLICTED AND IS WORTH RECORDING.** A
*different* suite — `tests/style.browser.test.ts` — went red in a local `npm run prove` during the
same session, and the cause was `npm run build` being run **while the proof was running**: the
browser suites load `dist/index.html` from disk, so rebuilding underneath them reddens a suite that
has nothing wrong with it. It took a second full proof on `main` to attribute. **Do not build, check
out or stash while a proof is running.**

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One test file. No storage key, no
save field, no cache prefix, nothing under `src/`, and `dist/` is untouched.
