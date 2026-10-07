# 0579 — The loadout has tabs

**Accepted 2026-10-07.** Item 1 of [`the-loadout-planned`](../../reports/the-loadout-planned-2026-10-07.md).
Supersedes [0578](0578-the-tubes-are-sold.md)'s band; builds on [0539](0539-the-readout-stands-down.md)'s
groups and [0542](0542-cosmos-counter.md)'s aisle.

## The ask

> *"we need to fix the menu - they should be purchasable in Cosmo's and equipable in Hangin' Out. If we need
> to scroll or something on hanging out, then we need better menu's there. There's going to be shield
> cosmetics and other cosmetics as well so we need to have that section capable of handling more."*

Asked how: **sub-tabs** — *Loadout* (gun, special, tubes), *Cockpit* (dash, hanging), and a later group is
another tab; never more than three bands showing.

## The rule

**A stand whose row says `tabbed` shows one of its groups at a time, behind a band of their headings drawn as
tabs; Hangin' Out is tabbed, and the Tubes band is under its *Loadout*.**

| | |
|---|---|
| **the row** | `StandRow.tabbed`, a fact each tab authors — `true` on Hangin' Out, `false` on Paint & Parts and Cosmo's. A tabbed stand offers a `section` band built off its own groups (`sectionBand`), so a group added is a tab with no second list |
| **the groups** | *Loadout*: gun, special, tubes. *Cockpit*: dash, hanging. A tabbed stand draws no headings: the lit tab is the heading |
| **the plate** | the group in view, the others put away on every device (`setSection`), so the cursor's walk passes over them as it passes over Cosmo's shelves out of view. The card at a phone's foot speaks for the first band of the group in view while the tabs are under the cursor |
| **a phone** | every tab drawn, and the group in view one row of its bands side by side, each chip the one that is on; held upright, where the plate scrolls, two to a row |
| **the shell** | which group is in view, per screen, kept for nothing past the visit — the first until a tab is stepped |
| **the words** | an owned tube at Cosmo's says *fit it in the hangar*, and so does Cosmo; Cosmo's is two tabs from Hangin' Out, so a shut rack no longer says *the next tab* |
| **Paint & Parts** | back to the wheels and the flame under *Parts*, and its headings drawn on a phone again (0578 had put them away for the tubes' height) |

## Why it is built the way it is

**Tabs, because the plate has no height to give.** 0578 put the tubes on Paint & Parts because a fifth band
on Hangin' Out put Back under every phone's fold. Scrolling the plate was the other way the ask allowed;
it was not taken because the plate is the screen's height on purpose ([0548](0548-the-hangar-holds-still.md))
and a band under the fold is one a thumb does not know is there. A tab is somewhere to go that says so.

**The aisle's look, not the aisle's code.** Cosmo's aisle steps *shelves*, which are bands; a section steps
*groups*, which hold bands. One mechanism over both would have the shell know which kind it was stepping.
They share the look — tabs on a rule across the plate — and the chrome's walk, which already skips
whatever is not drawn.

**One row on a phone, and it was two.** Two to a row, the Loadout's three stood the 667x375 plate 15 px
taller than Paint & Parts' and Back 4 px under an 812x375's fold. One row of three, with the arrows as narrow
as a 480x320's already were, leaves 37 px under the bands at 667x375; *Catherine wheel* is cut to
*Catherine…* there, and the card under it names it whole.

**Per screen in the shell, because the band name is shared.** Every tabbed stand's band is `section`; a
second tabbed tab must keep its own group in view, so `setSection` marks the band on one screen only.

## Rollback

None needed: no key, no save field, nothing shipped changes shape. The group in view is not kept.

## What guards it

`tests/loadout-tabs.test.ts`: a tabbed stand's section band is its groups in order and an untabbed one has
none; Hangin' Out is tabbed with the asked groups; every slot band on a tabbed stand is under exactly one tab.
`tests/loadout-tabs.browser.test.ts`, in the page at 1280x720, 667x375 and 480x320: every tab drawn on the
plate, and under each only its own group's bands; the keys from the pilots onto the tabs, across, and down
into the Cockpit. `tests/tube-shop.test.ts` holds the band's new place and the shop's words;
`tests/still.browser.test.ts` holds the phone's height. Probes in
`scripts/probes/0579-the-loadout-has-tabs.mjs`.

## Owed

- A play of the tabs on a phone: whether three cut chips in a row read, or the Loadout wants the card's
  words larger.
