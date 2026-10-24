# 0650 — A Savior death opens on a shield

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 11.
Amends [0614](0614-the-shields-come-down-a-tier.md): Savior's `shellOpen`, and nothing else of it.

## The ask

> *"Savior → spawn w/ shield after death."*

0614 was asked the other way by the same player a week earlier: *"don't give saviour a shield on death —
keep it to once per start of level."* The later page is the player's answer now, and this decision is the
record that it changed, so the old line is not read back as current.

## The rule

**On *Savior of the Galaxy*, a life after a death or a continue opens on one shield**, as a level does.
`shellOpen` goes from 0 to 1 on Savior's row in `src/content/difficulty.ts`. Legend's three and Burn's
hull are untouched, and 0614's split of a life's count from a level's stays: the two are still each a
tier's to say, and Burn says zero for both.

The order 0355 holds — a harder tier never opens a life on more than an easier one — still holds: Burn 0,
Savior 1, Legend 3.

## What guards it

`tests/tier-shell.test.ts` names the value, because it is the ask: a Savior life after a death opens on
one. The life itself is 0355's guard, which begins a run in every ship on every tier and asks what a death
and a continue open on, and reads the row.

The probe in `scripts/probes/0650-a-savior-death-opens-on-a-shield.mjs` puts 0614's hull back. 0614's own
probe of a death handing the shield back is retired, since that is now the rule, and its probe of a level
opening on the hull is re-anchored.

**No shipped tier says two different numbers now** — Legend 3 and 3, Savior 1 and 1, Burn 0 and 0 — so 0614's
guards over the shipped tiers could no longer see a run's start or a boundary read off the life's count; CI's
proof found both of its probes green. The split is kept, because each count is still a tier's to say
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)), and it is held in
`tests/tier-shell.test.ts` on a row that says two, *a tier whose two counts differ*, which both probes now name.

## Not held by any guard

- **Whether one is the right number.** The page says *"w/ shield"*; one is the count a Savior level opens on,
  and Legend's full shell is the gentler tier's.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): a tier's row, never stored.
