# 0387 — The hydra throws fewer from sixty percent

**Accepted 2026-09-27.** The hydra's fan from its third phase on is six shots, down from seven, seven and
eight. **Amends [0385](0385-the-hydra-is-bigger-and-sprays-harder.md)'s spray table**; its spread and
cadence stand.

## The ask

> attack patterns need about 1-2 less orbs at 60% and less health - gets really hard to dodge

Asked from a play of 0385. Read back as a choice, the answer was *"fewer orbs from 60% on"* — each phase
from sixty percent down, with the hydra's health left alone.

## What changed

| phase | shots |
|---|---|
| 100% | 5 |
| 80% | 6 |
| 60% | 7 → 6 |
| 40% | 7 → 6 |
| 20% | 8 → 6 |

One fewer at sixty and forty, two fewer at twenty, where four other heads are throwing too: the phase's
`shots` is every head's fan (0254), so a shot off the count is one off each of up to five fans.

## What it costs

0385 set the hydra's fans until no phase left more room than the fight before 0384. That was a target
set by measurement and this is a correction from play, which outranks it: the phases from sixty down
are roomier than 0385 left them. `tests/crowd.test.ts`'s *somewhere to be* holds as it did.

## Not held by any guard

The count is a play number, and a guard pinned to it would go red the day a hand moved it correctly —
[0192](0192-a-guard-holds-an-invariant.md).

No rollback note: no storage key, save schema, cache prefix or origin is touched.
