# 0637 — The shoulders step the pilot on the title

**Accepted 2026-10-18.** From [`the-morning-play`](../../reports/the-morning-play-2026-10-18.md), item 1. Amends
[0624](0624-the-triggers-step-the-pilot.md), which gave the pilots the triggers because the shoulders were the tabs'.

## The ask

> *"the main screen menu is using right/left triggers and not right/left shoulder buttons like the hangar. It should
> also have the RB and LB like the hangin out section does."*

## What was true

- **Hangin' Out:** LB and RB turn the tabs, and are drawn at the tab strip's ends while a pad is in hand (0458,
  0548). LT and RT step the pilot.
- **The title:** it has no tabs, so LB and RB did nothing, and nothing on it named a pad button. A hand that had
  learned the shoulders in the hangar reached for them first.

## The rule

**On a screen with no tabs, the shoulders step the pilot band.** The title is the only such screen with pilots.
The triggers still step it everywhere, as 0624 has them, so nothing a player has learned stops working. On the
hangar's tabs the shoulders are the tabs', as they were.

**And they are drawn there.** While a pad is in hand, LB and RB stand at the pilot band's arrows, in the key's
frame the tab strip uses.

## What guards it

`tests/menu.browser.test.ts`, *0637*, with a stub pad on the title:
- RB moves the marked pilot and LB moves it back;
- the title stays up;
- LB and RB are drawn at the band's arrows.

The probe in `scripts/probes/0637-the-shoulders-step-the-pilot-on-the-title.mjs` puts the old early return back;
seen red. 0624's own test is unchanged and still passes.

## Owed

- **A pad on the title**, LB and RB.
