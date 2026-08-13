# 0142 — A post-condition may wait, and must say what it waited for

**Accepted 2026-08-13.** The third and last change to the same guard in one day, and the one that
draws the line [0141](0141-await-the-post-condition-not-the-machinery.md) left implicit.

## The rule

**A budget on the thing being asserted may be raised; a budget on the machinery that produces it may
not.** And **whenever a wait can expire, the failure names the state it expired in** — otherwise the
next occurrence costs another CI round to learn what this one already knew.

## ⚠️ Three failures, three different messages, and that is the point

| | what it said |
|---|---|
| before [0139](0139-a-deadline-between-unbounded-awaits.md) | `Test timed out in 60000ms` — no file, no call, nothing |
| after 0139 | `serviceWorker.update() did not answer within 10000ms — it hung rather than failed` |
| after 0141 | `the worker kept a stale cache of its own: expected [ 'into-the-coil-0.1.1+66d2329', …(2) ] to not include 'into-the-coil-0.0.1+stale'` |

**Each one bought the next.** 0139 turned a silent timeout into a named call, which is what made
0141's diagnosis possible. 0141 removed the await and the failure moved to the assertion — which
proved the update was **not** rejecting (`__updateFailed` was null) and that the cache still carried
`into-the-coil-0.1.1+66d2329`, the *old* worker's. **The new worker had not activated in twenty
seconds.**

## Why this budget is not 0141's budget

0141 refused to widen a timeout, and was right to: it was wrapping `registration.update()`, which the
test **did not need to await at all**. Nine forced network fetches have no honest budget, and any
number large enough to be safe is large enough to hide a hang.

⚠️ **THE SWEEP IS DIFFERENT BECAUSE THE SWEEP IS THE ASSERTION.** *Exactly one cache under our prefix
and it is the new one* is what this test exists to check. There is nothing to remove — the only
question is **how long a correct worker may take**, and that is a property of the machine, not of the
code.

⚠️ **AND THE MACHINE IS TWO CORES RUNNING EVERYTHING AT ONCE.** `ubuntu-latest` is a two-core runner;
`vitest` parallelises across files with no pool configuration; **this suite's HTTP server lives inside
one of those workers**, beside Chromium instances and the DSP suites, and `install` pulls nine
`cache: 'reload'` fetches through it. Twenty seconds was a number measured on a machine doing one
thing — the whole test costs **seven seconds** when nothing competes.

**35 seconds**, inside the file's own 60-second timeout, leaving room for the setup before it.

⚠️ **IT IS NOT LICENCE TO KEEP RAISING IT, AND THE DECISION SAYS SO WHERE THE NUMBER IS.** If this
fires again the answer is the readout below, not a bigger number. A budget widened until it stops
firing has stopped being a bound.

## ⚠️ The state readout, which every failure so far has been missing

*The worker kept a stale cache* is a statement about the outcome. It cannot distinguish:

- the new worker **never started** — the update was rejected, or no registration was found;
- the new worker is **still installing** — the shell fetches are slow, which is this;
- the new worker went **redundant** — it was found and thrown away.

Three faults, one symptom, and two CI rounds spent not knowing which. The failure message now carries
the registration's three slots.

Seen to fail, per [0005](0005-a-guard-must-be-seen-to-fail.md), with `update()` replaced by a method
that does not exist:

```
the new worker never installed, so there was nothing to sweep · the worker was:
  installing — · waiting — · active activated
  expected 'TypeError: r.nopeNotAMethod is not a function' to be null
```

`installing —` and `active activated` together say it exactly: nothing new was ever started and the
old worker is still in charge. Break reverted, 4 passed in 8.7 s.

⚠️ **The readout is only asked for on the failing path**, so a passing run pays nothing for it.

## ⚠️ A break that did NOT work, and it is worth recording

The obvious probe — forcing the sweep predicate to `return false` — **passed anyway**. Polling for
the full 35 seconds gives the real worker time to finish, so by the time the poll gives up the sweep
has genuinely happened and every assertion below it is satisfied. **A break that makes the test wait
longer is not a break**, and it would have been reported as one. The break that works is the one that
stops a new worker existing at all.

## What is still not claimed

**Why nine local fetches exceed twenty seconds on that runner is still unknown**, and neither this nor
0141 finds out. What has changed across the three decisions is that the next occurrence will say
whether the worker was installing, redundant or absent — which is the difference between a fourth
round of guessing and a diagnosis.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One test file. Nothing under `src/`,
`public/` untouched, `dist/` unchanged.
