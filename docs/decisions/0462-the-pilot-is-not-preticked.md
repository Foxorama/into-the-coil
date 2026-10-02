# 0462 — The pilot is not preticked

**Accepted 2026-10-02.** A play report: *"on the first screen after the title page on select your
pilot, it always has a tick against Bo when you first land on the page."*

## The rule

| | was | is |
|---|---|---|
| **the golfers' screen** | a filled tick and `aria-current` on the golfer flying now | no card marked; the focus ring is the only thing on a card before it is pressed |

## Why

[0437](0437-the-title-is-lit.md) ticked the golfer flying now because the golfers' screen was then
also where the golfer was **changed**, from the menu's *Pilot* button, and a player arriving there had
already flown someone. [0458](0458-the-title-is-rows.md) moved changing the golfer to the title's
pilot band and left this screen shown only at boot. The pilot is not saved, so at boot the state
holds the default — Bo — every time, and the tick answered *who are you flying?* before the question
had been asked. It was right when it was built and became wrong when its screen's job changed under it.

**The class** is a mark that describes the state, kept on a screen whose arrival no longer has a state
worth describing. Nothing guards that, and nothing should in general: whether a screen has a meaningful
"current" is a fact about how it is reached, which is exactly what changed here. The removal was the
answer rather than a guard, because the thing a guard would hold no longer exists.

## What guards it

Nothing new. 0437's browser test of the mark and its probe went with the mark; the title's pilot band
still says who is flying, in words and a ring, under 0458's own guards.

**Photographed** at 1280×720: the boot screen's four cards, none ticked.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
