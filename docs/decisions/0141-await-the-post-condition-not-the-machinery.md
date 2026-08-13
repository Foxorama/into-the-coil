# 0141 — Await the post-condition, not the machinery

**Accepted 2026-08-13.** What [0139](0139-a-deadline-between-unbounded-awaits.md) was built to make
possible, arriving **one CI run later** — and it is the half 0139 explicitly declined to claim.

## The rule

**A test waits for the thing it is asserting, never for the machinery that produces it.** Where a
post-condition can be polled, the operation that causes it is *started* and not awaited.

## ⚠️ 0139 named the call, and the name is the whole reason this was findable

0139 said, in as many words: *"It does not claim to have found the cause… It claims the next
occurrence will report which call stopped."* The next occurrence was the very next PR, and it said:

```
Error: serviceWorker.update() did not answer within 10000ms — it hung rather than failed
```

**10.68 seconds, with a call named**, against the previous *Test timed out in 60000ms* with nothing
in it. Two CI failures earlier the investigation had gone looking at cache logic; this one pointed
straight at a fetch.

## What `update()` actually waits for, and it is not the worker

`registration.update()` does **not** resolve when the new worker script has been fetched. It resolves
when the update algorithm has finished — which includes running `install`. And this worker's install
is:

```js
e.waitUntil(caches.open(CACHE).then((c) =>
  Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
```

⚠️ **NINE FORCED NETWORK FETCHES — `cache: 'reload'` BYPASSES THE HTTP CACHE ON PURPOSE — THROUGH THE
SINGLE NODE SERVER THE SUITE IS ITSELF RUNNING.** Awaiting `update()` made the test depend on all of
that completing promptly on a machine it does not control. Locally that is milliseconds; on a shared
runner under `npm run check` it is not bounded by anything.

⚠️ **AND THE `.catch(() => {})` ON EACH ENTRY IS WHY A HANG AND NOT A FAILURE.** A 404 is swallowed by
design — [0003](0003-single-file-build.md)'s *a missing manifest should cost the manifest, not the
shell* — so the only way install can fail to complete is by not completing.

## ⚠️ The test never needed it, and its own comment already said so

The line immediately below reads *"Wait for the SWEEP, not for the new cache"* — and the sweep happens
later still, in `activate`. `cacheKeysUntil` polls for exactly that post-condition and always did.
**So the await was not load-bearing; it was a second, unbounded way of waiting for something already
being waited for properly.**

The dependency is therefore **removed rather than bounded**. 0139's bell stays on the polls, where a
hang would still be worth naming; it comes off the one call that should never have been awaited.

## ⚠️ The rejection is kept, and the ordering of the assertions is the point

A worker that fails to install also never sweeps — so without care, a genuine install failure reports
as *the worker kept a stale cache of its own*: **the symptom two steps downstream of the cause, and
the exact reading that sent the first investigation after the cache logic.** The failure is captured
into `window.__updateFailed` and asserted **first**.

Seen to fail, per [0005](0005-a-guard-must-be-seen-to-fail.md) — `r.update()` replaced with a method
that does not exist:

| | |
|---|---|
| before this decision | 20 s, then `the worker kept a stale cache of its own` |
| after | 20 s, then **`the new worker never installed, so there was nothing to sweep: expected 'TypeError: r.nopeNotAMethod is not a function' to be null`** |

Break reverted, 4 passed in 8.7 s.

## What was rejected

**Raising `POLL_MS`.** The number was never the problem — nine network fetches have no honest budget,
and any value large enough to be safe is large enough to hide a real hang. A timeout that is raised
until it stops firing has stopped being a bound.

**Retrying the flaky test.** [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md): *"a
rerun is not evidence."* Two reruns had already gone green and taught nothing.

**Making `install` bounded.** That is shipped code, and its unbounded best-effort caching is
[0003](0003-single-file-build.md)'s deliberate design — the worker should keep trying to build an
offline copy. The test is what was wrong, not the worker.

## ⚠️ What is still not claimed

**Why those fetches were slow on that runner is still unknown**, and this does not find out. What it
changes is that the test no longer cares: it waits for the sweep, which is what it asserts, and a
worker that genuinely fails to install now says so in its own words.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One test file. Nothing under `src/`,
`public/` untouched, `dist/` unchanged.
