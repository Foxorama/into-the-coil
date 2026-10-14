# 0608 — Freeplay is earned

**Accepted 2026-10-14.** Amends [0517](0517-no-quarters-given.md): the chip it put on the title is now
offered per tier, and only once earned.

## The ask

> *"We need to change the default play mode to 'No quarters given' and remove the freeplay option.
> Freeplay gets unlocked only for an individual difficulty when you finish that difficulty with at least
> one pilot."*

The default was already *No quarters given* — 0517 made it so. What had not been true is that it was the
only way to play: anyone could press the chip once and never meet the game-over screen again. So the
ask's work is the second sentence, and the first is held by it: on a tier nobody has finished, the run is
one credit and there is nothing to choose.

## The rule

| | |
|---|---|
| **what is earned** | `HangarState.finished`, one flag per tier: the jellyfish beaten on that tier, in any ship and on any credits. Set by `src/state/root.ts`'s second agreement, beside the ship's win (0521), off the **run**'s tier, so a band moved during the finale cannot move which tier was finished. Only ever set |
| **the chip** | on the title only while the tier on the band has been finished; hidden otherwise, and the walk skips it (`setBandShown`). Re-read when the tier moves and when the hangar does |
| **what a run flies** | `creditsFor(hangar, tier, chosen)`: the chip's choice on a finished tier, one credit on any other. The shell calls it as the run begins; the run slice still copies what it is handed (0517) |
| **the choice** | still the one setting in `itc_settings`. A Freeplay chosen on a finished tier stays chosen when the band moves to one that is not, and comes back with it. It is not offered and not flown there |
| **kept** | in `itc_hangar`, a new field on version 1, read as the wins are: only `true`, per tier |
| **already finished** | a cleared run on the score table counts. As the page opens, each `cleared` row finishes its tier and the hangar is written at once, so the table dropping the row later loses nothing |

## Why in the hangar and not the settings

0521's distinction: a setting is chosen and a win is earned, and a settings document the game cannot
read is put back to its defaults. A tier finished is earned and must survive that. It sits beside the
ship wins it is set with.

## Why the table is read once, as the page opens

Before this, nothing kept which tier a run finished on, only which ship. A player who had already beaten
Savior would otherwise be asked to beat it again for a continue they had been using. The score table is
the only record that names a tier and whether the last boss fell, so it is read. It keeps ten rows, so a
finish that has fallen off it is not found; a ship win (`won`) does not say the tier and cannot stand in.
That gap is the cost of having kept nothing before, and the player can close it by finishing again.

## Why hidden and not shown shut

The ask says to *remove* the option. A shut chip with a *finish this tier* hint is the other reading, and
it would tell the player there is something to earn; it is one line to change (`setBandShown` →
`setOpen`) if a play says so. **Owed: a play**, and the player may veto hidden for shown-shut.

## What it changes about the default game, said plainly

0517's owed question — *whether one credit reaches the later places often enough* — is now the
question every new player meets, with no way round it until they have answered it. That is the ask.

## What guards it

- `tests/credits.test.ts`: no tier is finished on a first visit and every run there is one credit; a
  finish opens its own tier and no other, in any ship; a run that ran out opens nothing; the field is
  kept, a document from before it reads as none finished, and an edited one opens nothing it did not
  finish. Probed in `scripts/probes/0608-freeplay-is-earned.mjs`.
- `tests/credits.browser.test.ts`: a player who chose Freeplay under 0517 and finished nothing sees no
  chip and ends on the game over; the chip is on a finished tier, gone on another, and back with it, and
  the choice survives a reload; a cleared row on the table opens its tier and is written to the hangar.
- The browser tests whose subject is the run-over screen (`continue`, `menu`, `run-ends`) open on
  `EVERY_TIER_FINISHED` (`tests/title.ts`), since that screen is a finished tier's now.

## Rollback

**Irreversible surface: the save schema** — a `finished` field in `itc_hangar`, and the page writing the
hangar once on open for a player with a cleared run on the table. Reverting the code leaves the field in
players' storage, unread and harmless: `hangarFrom` reads named fields only, and 0517's chip comes back
for everyone. Re-landing later reads the field again as it was left.
