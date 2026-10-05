# 0521 — The hangar opens

**Accepted 2026-10-05.** Item 1 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md),
which holds the ask and every answer given while it was planned. Amends
[0513](0513-the-pilot-flies.md)'s title, whose buttons were *Fly* and *Settings*, and
[0510](0510-the-settings-are-kept.md)'s *the table and the settings are what is kept*.

## The ask

> *"'Hangin` Out' - the spaceship hangar, allows you to select your pilot, then choose their spaceship
> … and customise anything else about the ship based on that particular spaceship … when you beat the
> jellyfish with a pilot and ship you unlock that ship to do with as you want."*

Answered while it was planned: the pilot keeps their ship; any win counts, on any tier and on
Freeplay; a ship's slots open with its own win, and what they offer comes only from ships that have
been won in.

## The rule

**Beating the jellyfish wins the ship the run was flown in, and a win is kept between visits. The
title has a third button, *Hangin’ Out*: the pilot band, the card of who they are and what they fly,
and the first slot — the dash, the readout's plate — which a ship may change once it has been won in,
to the dash of any other ship that has been.**

| | |
|---|---|
| **the win** | `src/state/root.ts`'s agreement, at the moment the run finished goes to the finale: the run's ship, read off the run. Any tier, any credits. Only ever gained |
| **the hangar** | a slice of its own, `src/state/slices/hangar.ts`: `won` per ship, and `plate` — whose dash each ship wears, its own until changed |
| **what may be fitted** | `plateOpen`, in the slice: a ship's own dash always; another's once the ship has been won in and so has the ship the dash is from. The reducer refuses anything else, so no band, pad, save or test can fit what is shut |
| **kept** | `itc_hangar`, version 1, read per field and per ship. A fitting the document's own wins do not open reads as the ship's own, so an edited document unlocks nothing. Listed in `PRIVACY.md` |
| **the screen** | `hangar` in `src/state/screens.ts`: the pilot band (the title's own setting, and its press steps rather than flies), the pilot card, and the dash band, built by walking `SHIP_KINDS`. Back is the title |
| **a shut dash** | drawn dimmed with a dashed outline and cannot be pressed; a step passes over it; the band's line says why — *Beat the jellyfish in the Firebird to change its dash*, or *in another ship to borrow its dash* |
| **the preview** | the real readout, up over any screen offering the `plate` slot, dressed in the dash the band shows |
| **the run** | wears the dash fitted to its ship, from the first frame |

## Why it is built the way it is

**A slice of its own, and a key of its own.** It outlives every run as the settings do, so it cannot be
on the run, which `begin` resets. But a setting is chosen and a win is earned. A settings document the
game cannot read costs a minute in a menu; a hangar it cannot read costs every run the player has won.
So the two are written separately, and a defect in one cannot be paid for by the other.

**The win is an agreement, at the finale.** A slice does not import a sibling
([0017](0017-the-state-is-slices.md)); *the run finished* already lives in the root as the move to the
finale, and the win is the same moment. That is the jellyfish beaten. The victory screen is nineteen
seconds later, and a page closed during the finale has still won.

**A slot is not a setting, and that is why the band's name is a union of two.** A setting has one value
in the settings slice. A slot has one value per ship, and the band shows the one for the ship of the
pilot on it. Folded into `SettingName`, the dash would have had to be one field of `SettingsState` — one
ship's dash. So `ScreenChoice.name` is a `ChoiceName`, a setting or a `SlotName`, and the shell routes
`plate` to the hangar slice.

**The pilot band is offered twice, and the guard that refused it is amended rather than defeated.**
`tests/style.test.ts` held *every setting is offered on exactly one screen*. The ask begins the hangar
with the pilot, and a band with another name that dispatched the pilot would be the same setting
renamed — [0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md)'s tell. It is one value in one slice,
so the two bands cannot disagree. The guard names the pilot's two screens, so a third is still red.

**The dash is the first slot because nothing about it had to be drawn.** All four plates exist (0451),
each with its inks and its dressing. A whole plate goes across — the estate's walnut brings its dice —
because the dice are the walnut's dressing until item 3 makes the dangle a slot of its own.

**The real readout is the preview.** A picture of the plate in the card would be a second drawing of it,
sized by a different box. The readout over the hangar is the one the run will wear, at its own size, in
its own corner.

**The title's buttons stay one line each.** *Hangin’ Out* wrapped on the desktop and made the button row
taller than the tiers' on the smallest phone, which `tests/layout.browser.test.ts` caught. On a phone
the hangar is two columns, the pilot and their card beside the dash: stacked, Back went under an
844x390's fold.

## What it costs

- **The pilot card was one per page and is one per screen.** The ship on it was one cached canvas per
  sprite, and an element has one parent: the hangar's card took the title's ship. Photographed and
  fixed; each screen keeps its own.
- **The title's row of buttons is 34em, and was 26 for three.** With the hangar's button it had 31
  pixels to spare on this machine's fonts; CI's spent them and 30 more, putting Settings off a 1024x768.
  The cap was not the case that failed: with the table up, that screen's column is 562 pixels, and CI
  set the row about a quarter wider than this machine. So the quiet three — the chip, the hangar and
  Settings — are a step smaller with narrower sides. Measured with ten rows on the table: 31 % of the
  row spare at 1024x768, 23 % at 480x320, more everywhere else.
- **`tests/menu.test.ts`'s *Back goes somewhere that can be left*** named the count-in's case. The
  hangar is the first row whose Back is the title outright; the title is left by *Fly*, and the test
  now says so.

## Rollback

`itc_hangar` is a new key. Reverting this leaves it on players' devices unread, and harms nothing. A
version-2 document read by this version is the empty hangar, so a later change to the shape bumps the
version and migrates; it never reinterprets version 1.

## What guards it

`tests/hangar.test.ts`: the win at the finale and nowhere else, the unlock rule, the reducer's refusal,
the key read per field with a forged fitting refused. `tests/hangar.browser.test.ts`, in the page: a
shut dash cannot be pressed, the readout wears what is fitted on the hangar and in the run, the fitting
is written and kept across a reload, and a press on a pilot in the hangar does not fly. Probes in
`scripts/probes/0521-the-hangar-opens.mjs`.

## Owed

- A play: a win, then the hangar.
- The next item in the plan, Star Shards, which also rewrites `docs/game.md`'s *no shop* line.
