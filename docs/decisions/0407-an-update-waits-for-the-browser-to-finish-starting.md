# 0407 — An update waits for the browser to finish starting

**Accepted 2026-09-27.** The fourth decision on one guard, and the first to find the cause.
[0139](0139-a-deadline-between-unbounded-awaits.md), [0141](0141-await-the-post-condition-not-the-machinery.md)
and [0142](0142-a-post-condition-may-wait-and-must-say-what-it-waited-for.md) each said in their own
words that they had not found it. [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md):
*"an intermittent guard has found something, and 'flaky' is not what it found."*

## The rule

**A browser test does not ask the browser for work the browser treats as background.** Chromium
defers some jobs until it thinks startup is finished. A test that waits on one of those is waiting on
the browser's idea of idle, not on the code under test. When the code under test can be reached by a
job the browser runs at normal priority, the test uses that job.

## What was failing

`tests/offline.browser.test.ts` > *retires its own stale cache and leaves a stranger's alone*, in CI,
on branches that touched no worker: run 35988137558 (`the-view-zooms-out`, 2026-09-24) and run
36302605555 (`a-target-takes-a-blade`, [#428](https://github.com/Foxorama/into-the-coil/pull/428),
2026-09-27). Both said the same thing:

```
the worker kept a stale cache of its own · the worker was: installing — · waiting — · active activated
```

0142's readout had done its job. `installing —` means no new worker existed after 35 seconds, and
`__updateFailed` was null, so `update()` had not rejected. **The browser had never fetched the new
`sw.js`.**

## Measured

A scratch reproducer drove the test's scenario against `dist/` with the server logging every
request, then with the CDP `ServiceWorker` domain and a Chrome net-log attached.

- **The wait happened on every run, not now and then.** The sweep test took **10.2 s and 11.2 s**
  on an idle machine, against the 7 s that 0139 measured. It was the whole cost. `update()` was
  called about 0.6 s after load. The browser created the `GET /sw.js` request at **10.0 s**, at
  `IDLE` priority, and the server answered it in under a millisecond. Install took 20 ms.
- **Nothing happened in the gap.** No new version appeared in CDP, no request reached the network
  stack, and the page's main thread had no long task over 600 ms.
- **The wait is measured from the page load, not from the call.** Calling `update()` 5 s after load
  still got the fetch at 10.1 s. Calling it 15 s after load got it in 3 ms.
- **It is browser-wide and happens once per browser.** A second context in the same browser got the
  fetch in 0.1 s. A blank page left open for 3 s before the test removed the wait. A page left open
  for 0.5 s did not.
- **It depends on the page.** With a page that only registers the worker, the wait was about 2 s.
  With the game, it was about 10 s.
- **It stretches under load.** While other suites were running, the same first fetch arrived at
  19.9, 23.5 and 24.3 s. On a two-core runner under `npm run check`, it arrived after the 35 s
  budget had already run out.

## The cause, in Chromium's source

- [`ServiceWorkerRegisterJob::Start()`](https://chromium.googlesource.com/chromium/src/+/main/content/browser/service_worker/service_worker_register_job.cc)
  posts a registration job at default priority and every **update** job at
  `base::TaskPriority::BEST_EFFORT`. That includes an explicit `update()`, and the code's own TODO
  says so: *"For explicit update() API, we may want to prioritize it too."*
- Best-effort tasks on the browser's UI thread do not run until
  `BrowserTaskExecutor::OnStartupComplete`.
- [`after_startup_task_utils.cc`](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/after_startup_task_utils.cc)
  calls startup complete when a visible page reaches *loaded and idle*, or when its loading times
  out. Past that, there is a failsafe of up to three minutes.

**The game never goes idle, because it animates from the moment it boots.** So startup completes on
the timeout, and the timeout stretches with CPU. The file's four tests all run inside that window, so
the fourth test's `update()` was parked every time. It failed only when the machine was slow enough
to push the release past 35 s.

## Not a defect in the worker

**Nothing under `public/` or `src/` was involved.** The worker installed in 20 ms once asked. A
returning player's own update check is also a best-effort job, so it waits for the browser to finish
starting in the same way. That costs them nothing: the shell is network-first
([0008](0008-the-shell-sidecars.md)), so the page they see is fresh whatever the worker is doing.

## What changed

The test stands the next release up with `navigator.serviceWorker.register('./sw.js?next')` instead
of `registration.update()`. A different script URL makes it a **registration** job, which Chromium
runs at default priority. The test server drops the query string, so the new URL serves the swapped
bytes. What the test asserts, that the sweep in `activate` retires our old cache and leaves a
stranger's alone, is unchanged. **How the browser finds out about a new release was never this
test's claim.** The browser owns that, and a test cannot make it deterministic.

The rejection is still captured, as `__nextFailed`, and asserted first ([0141](0141-await-the-post-condition-not-the-machinery.md)).
`SWEEP_MS` is unchanged, and its comment now says what the 35 s was actually covering.

| on this machine, three runs each | the sweep test | the whole file |
|---|---|---|
| `update()`, idle | 10.2 s, 11.2 s | 16.5 s |
| `register()` under a new URL, idle | 1.63 s, 1.66 s, 1.72 s | 5.2 s to 5.6 s |
| `register()` under a new URL, while another session's `npm run prove` ran | 4.8 s to 8.1 s | 31 s to 171 s |

The loaded file totals are Chromium starting and stopping on a starved machine. The run at 171 s
timed out in `afterAll`. With the machine quiet again, `browser.close()` measured about 0.2 s with
and without this change, so that was load. It was not the change.

## What was rejected

**Raising `SWEEP_MS`.** The comment beside it forbids that, and the mechanism shows why it would not
have worked anyway. The wait is bounded only by Chrome's three-minute failsafe.

**Warming the browser with a blank page first.** That does remove the wait. But whether startup has
completed cannot be observed from outside the browser, so the warm-up would be a sleep with a number
on it. That is 0141's rejected budget in another place.

**A Chrome feature flag to shorten the startup delay.** The feature names and their parameters belong
to whichever Chrome the runner has. A flag that silently stops existing puts back the failure this
decision removes, and says nothing when it does.

**Starting the sweep budget from the moment the server sees the new `sw.js`.** That is honest about
the worker, but it leaves the test waiting on the same gate with no bound but the failsafe.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md), [0019](0019-a-probe-must-be-seen-to-apply.md). The
guard now reaches the worker by a different route, so it is broken through that route. Two probes in
`scripts/probes/0407-an-update-waits-for-the-browser-to-finish-starting.mjs` break the shipped
worker's sweep. One makes it delete nothing, and one makes it delete every cache that is not its own,
as the predecessor's did.

| broken on purpose | what the guard said |
|---|---|
| the sweep deletes nothing | `the worker kept a stale cache of its own: expected [ 'into-the-coil-0.1.1+2e1259f', …(3) ] to not include 'into-the-coil-0.0.1+stale'` |
| the sweep deletes every cache but its own | `the worker deleted a cache belonging to another app on this origin: expected [ 'into-the-coil-next' ] to include 'some-other-game-v3'` |

⚠️ **The cause itself is not held by a guard, and the reason is not a shortcut.** No test can make
Chromium park a job on demand. And a test asserting *"`update()` is slow"* would be a guard on
Chromium's scheduling, which is not this project's to hold. What holds the class is the rule above,
and the measurements are here so the next person who sees `installing —` does not start from zero.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One test file and one probe file.
`public/` and `src/` are untouched, and `dist/` is unchanged.
