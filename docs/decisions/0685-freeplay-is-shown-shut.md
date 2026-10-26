# 0685 — Freeplay is shown shut

**Accepted 2026-10-26.** From the play of 2026-10-26. Amends [0608](0608-freeplay-is-earned.md), which
owed this: *"the player may veto hidden for shown-shut."* They have.

## The ask

> *"Legend difficulty is the only difficulty that shows 'No quarters given' — the play mode should show on
> all difficulties and you should be able to nav to it and choose Freeplay, but Freeplay should be locked
> and if you click on it, it should show a message explaining the unlock condition."*

The first clause is 0608 seen from the outside: the chip was on the one tier the table had finished.

## The rule

**The continues chip is on the title on every tier.** On a tier not yet finished, Freeplay is shut:

| | |
|---|---|
| **shown** | the chip steps onto Freeplay as it steps onto anything — a press lands there, the cursor's and a pointer's alike — and shows it padlocked, dashed, dimmed a little, as a shut option on a band that tries is (0561) |
| **said** | the line under the tier band says what finishes it: *Finish Savior of the Galaxy with any pilot to unlock Freeplay* (`freeplayWhy`, `src/content/credits.ts`), for as long as the chip stands there, and the tier's own hint once it steps off. The chip has no line of its own — 0517 found the title had no height for one — so it borrows the band's above it, whose name the sentence says. The same line is the tooltip, and the reader's label is *dimmed* |
| **flown** | one credit, whatever the chip shows: `creditsFor` (0608) reads the hangar, never the chip. The choice is still kept in the settings and comes back open on a tier that has earned it |
| **moved** | stepping the tier band to one not finished while the chip is on Freeplay shuts it there and says why; stepping back opens it |

## Why a borrowed line and not a bubble

A bubble over the chip was built first. Above the chip it lay across *Fly*; below it the plate's cut
corners clip everything (0538). The tier band's line is a line that already exists, already `aria-live`,
right above the row the chip is in, and the sentence is about the tier.

## What guards it

`tests/credits.browser.test.ts`: the chip is on the title before any tier is finished, with the kept
Freeplay shown and shut, and the run ends on the game over; Freeplay is open on a finished tier, shut on
another with the line saying why, and open again coming back; pressed onto the shut Freeplay the chip steps
there and the line says the sentence, and stepping off gives the tier its hint back. The probes in
`scripts/probes/0608-freeplay-is-earned.mjs`: Freeplay open whatever the tier, the chip stepping past the
shut option, and the borrowed line never written. `tests/title.ts`'s `credit` says when a test is on a
tier where Freeplay is shut.
