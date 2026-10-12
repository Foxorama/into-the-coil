# 0606 — The menus come round

**Accepted 2026-10-12.** Amends [0458](0458-the-title-is-rows.md)'s clamp, which every band had;
narrows [0566](0566-the-phone-pass.md)'s grown arrow; adds a column to
[0429](0429-the-table-is-kept.md)'s table.

## The ask

> *"The menus are still bad and the high score screen needs a difficulty column as well. In the hangin out
> and other tabs, need to be able to full cycle the menus in a full proper never ending sequence. On mobile
> the menus are all too close together and the scroll buttons are hard to click without tapping the menu
> item next to it."*

Three things: a band's arrows go round for ever, the table says the tier, and on a phone a thumb's press
lands on the arrow it was aimed at.

## The rule

| | |
|---|---|
| **a band's ends** | `ChoiceRow.ends`, a fact each row authors: `'round'` comes past the last option to the first and back past the first to the last, by an arrow, a key, a pad, a held direction or a swipe; `'stop'` stands at the end, as 0458 had every band do. Every band on Hangin' Out, Paint & Parts, Cosmo's and Settings comes round, and so do the pilots and the sub-tabs. **The tier and the steering stop** |
| **an arrow** | on a band that comes round it is never drawn shut, unless the band has one option (or, on a band that steps, no other open one) |
| **the table** | each row says the tier it was flown on in the tier's own word (`DifficultyRow.short`: *Legend*, *Savior*, *Burn*). On a desktop a column; on a phone a small line under the pilot's name |
| **a thumb's arrow** | on a touch phone each arrow on the hangar's three tabs is drawn 1.25rem wide, its press grown only up and down, with a gap to its chip and a wider one to the next band |

## Why it is built the way it is

**A row's fact, because two bands are ladders.** 0458 clamped every band so that *a press past Burn that
came round to Legendary is a tier nobody asked for*. That reason is about the tier, and it was applied to
every band because there was one mechanism for all of them — [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s
tell. A gun, a livery or a shelf has no first and last that mean anything; the tier and the steering
(*gentle, standard, quick*) do, and a step from the hardest to the easiest is a jump the player did not
press for. So the row says, and the tier keeps its clamp. A press on a band (`activate`) always went
round and still does.

**The ask's wording reached Settings ("and other tabs"), and its two-way bands come round.** For a
two-way band coming round is the same as going back, so nothing is lost there.

**The arrow's press was grown sideways, and that was the bug.** 0566 laid a box round each arrow
0.6rem past it on every side, so a thumb's press could reach it. Measured on the hangar's tabs at
844x390 and 667x375: each arrow was **11 px wide and 2 px from the next band's**, a press on the right of
a band's › landed on the next band's ‹, and a press on the right edge of a chip landed on its ›. Grown
across, the boxes covered their neighbours. So the press grows only up and down, and the width is drawn:
**20 px**, with 3 px to its chip and 12 px to the next band. After it, no press measured across any
arrow or any chip's edge landed on another control at 844x390, 667x375 or 480x320.

**What it cost, and the size that was tried first.** The width came from the chips. 24 px arrows cut
*Candle* to *Can…* at 667x375; at 20 px *Candle* reads whole and *Catherine wheel* is *Cath…* (it was
*Catheri…*). The card under the bands names the one under the cursor in full, as 0579 has it.

**The tier is a line under the name on a phone, and it was a column first.** As a third column it took
its width from the rows' plate: at 480x320 and 667x375 the tier's names went to three lines and the
continues chip was cut shorter. Under the pilot's name it costs the table height, which it has beside
the faces, and the rows' plate is the width it was.

## Rollback

None needed: no key, no save field, nothing shipped changes shape. The table's entries already carried
their tier ([0429](0429-the-table-is-kept.md)); this only draws it.

## What guards it

`tests/menus-round.browser.test.ts`, in the page: a whole lap of the gun's arrows each way, every
option once and back to the start; past the last sub-tab is the first; the tier's arrow stops at its
hardest and says so. On a touch phone at 844x390, 667x375 and 480x320, on every tab and sub-tab: a press
across each arrow lands on that arrow, and none at a chip's edge lands on one. The table draws each run's
tier at 1280x720, 667x375 and 480x320. `tests/score.test.ts`: the table's words say each tier's own word,
and no two alike. Probes in `scripts/probes/0606-the-menus-come-round.mjs`.

## Owed

- A play on a phone: whether 20 px arrows with their press grown up and down are found by a thumb, or
  the Loadout wants its chips' words smaller to give the arrows more.
