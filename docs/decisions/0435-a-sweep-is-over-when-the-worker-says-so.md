# 0435 — A sweep is over when the worker says so, not when the caches look right

**Accepted 2026-10-01.** Found by CI on [#456](https://github.com/Foxorama/into-the-coil/pull/456),
whose own change is documents only: probe shard 1 of 10 reported one of
[0407](0407-an-update-waits-for-the-browser-to-finish-starting.md)'s probes as `WRONG TEST`, and the
same probe had passed on `main`'s run an hour before.
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md): that is not flaky, it is a wrong
quantity, and the rerun is not evidence.

## The rule

**`tests/offline.browser.test.ts` reads the caches once, after the new worker reaches `activated`.**
It used to poll the cache list until it looked like a correct sweep's result.

## What the log showed

The probe replaces the sweep with the predecessor's — *delete every cache that is not mine* — and names
`retires its own stale cache`. The filtered run of that one test **passed with the break in**, so the
harness re-ran the whole suite for its diagnostic, and there the same test failed exactly as it should:
*the worker deleted a cache belonging to another app on this origin*. One test, one break, two
answers.

## Why

The broken sweep deletes both caches in one `Promise.all`: our stale one and the stranger's. The test
polled until **exactly one cache under our prefix was left, and it was the new one** — the correct
sweep's end state, and a state the broken sweep also passes through. A poll that lands after the first
deletion and before the second reads *ours retired, the stranger's still there*, and every assertion
passes. How often it lands there depends on how the two deletions interleave with a 100 ms poll, which
is the load on the machine.

⚠️ **The comment the old wait carried called it *"the sweep's own post-condition"*.** It was the
**correct** sweep's post-condition, and a guard exists for the incorrect one. That is
[0027](0027-measure-the-picture-not-the-model.md)'s shape inside a test: the wait was defined in terms
of the behaviour it was guarding.

## The end of the sweep

The sweep is inside `activate`'s `waitUntil` (`public/sw.js`). A worker moves from `activating` to
`activated` only once every promise handed to `waitUntil` has settled — the Service Workers
specification's *Activate* algorithm, which is behaviour this test already relies on in the other
direction. So `activated` on the worker registered as `sw.js?next` is the sweep being over, whatever
the sweep did, and the keys read after it are its whole result.

It is still polled from the test rather than handed to `waitForFunction`, which does not await a
promise its predicate returns; the reason moved with the helper.

## What was rejected

**Polling until the stranger's cache is gone or the budget runs out.** It makes the broken sweep's
result the thing waited for, and a correct sweep then costs the whole thirty-five-second budget on
every passing run.

**A settle delay after the poll.** A number sized against the interleaving on one machine, which is the
quantity 0044 says was wrong in the first place.

## ⚠️ Not confirmed here

**The browser test and 0407's probes were not run on this machine**, because another session's proof
was running and a browser suite beside it is what 0344 measured timing out. CI runs both on this PR,
and that run is the confirmation owed. The race itself cannot be forced from outside the browser, so
what the run can show is the test still passing on a working sweep and both probes still red; that
the red no longer depends on timing rests on the specification's ordering above.

## No new probe

0407's two probes already break this test's sweep both ways, and they are what found this.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A test and a document.
