# 0635 — Every flight plays the intro

**Accepted 2026-10-18.** From [`the-run-resets`](../../reports/the-run-resets-2026-10-18.md), items 3 and 4.
Amends [0513](0513-the-pilot-flies.md), whose intro was the first flight of a visit.

## The ask

> *"new run w/out cache clear doesn't play the intro cinematic"*
>
> *"end of run after all death's should essentially be a cache clear 4 the next run"*

## What was true

`fly()` kept a flag for the page, `flownThisVisit`. The first flight played the intro and set it; every later
flight began the run at once. A cache clear reloads the page, which is the only reason the intro came back.
Nothing in storage was involved.

## Read, and decided without asking

**Item 4 is not read as wiping the save.** A cache clear also deletes the hangar and the settings: ships won,
shards, fittings, the tier. The page is headed *Run Resets*, and its other notes are each something of one run
reaching into the next. So it is read as *a new run starts as a first run after a cache clear does*, with what
the player has earned kept. Each of the page's notes is part of that:
- the intro (this decision);
- the boss bar ([0634](0634-the-boss-bar-goes-with-the-run.md));
- the held explosions ([0633](0633-a-beat-that-stands-still-holds-nothing.md));
- the counter ([0636](0636-the-counter-is-the-ships-left.md)).

The report says so as a reading the player can veto.

## The rule

**Every flight plays the intro with the pilot in it, and the intro ends in the run.** The flag is gone. The intro
is skippable as it was (0511), so a player who has seen it is one press from the run.

## What guards it

`tests/run-ends.browser.test.ts`, *0635*, in the page: a run flown and quit, then *Fly* again, and the intro's
skip is what comes up, not the run's readout.

The probe in `scripts/probes/0635-every-flight-plays-the-intro.mjs` puts the flag back; seen red.

The shared `fly` helper in `tests/title.ts` already skipped the intro whenever it came up, so no other suite's
flight changes.

## Owed

- **A second Fly in the same tab**, and whether an intro every run is welcome or wants a setting.
