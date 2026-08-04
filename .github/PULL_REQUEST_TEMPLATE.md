<!--
  Two questions, and each is a question of FACT — not an estimate of how risky this feels.
  See docs/decisions/0001-revertability-not-risk-rating.md
  and docs/decisions/0027-measure-the-picture-not-the-model.md.
-->

## Does this touch an irreversible surface?

- [ ] a storage key (`itc_*`) or the save schema
- [ ] the service-worker cache prefix
- [ ] the origin
- [ ] anything already shipped — an installed PWA, a pushed itch channel

**None ticked → delete the section below and open the PR.**
**Any ticked → fill it in.** Code can be reverted; data already on a player's device cannot.

### Rollback note

*How this is undone after it has shipped — not "revert the commit", but what happens to the state
already out there.*

---

## Does this change something the player watches move?

**No → delete the section below and open the PR.**
**Yes → point the instrument at it, and paste the pixels.** A green suite is not an answer. Every
guard here counts a *model* quantity, and both bugs this has caught lived between model quantities
that were each correct, with the whole suite green on either side —
`reports/camera-judder-2026-08-04.md` and `reports/touch-gain-2026-08-05.md`.

### What the picture did

| | before | after |
|---|---|---|
| *screen travel, or whichever line moved* | | |

*Which invocation — the flags matter — and what a reader should conclude. "It looks better" is not a
number and a number nobody has looked at is not a picture.*

⚠️ **"There is nothing to compare against" is not an answer, and it is the one that got past.** A
change that adds a *new* way for the player to affect the picture has no before-number and always has
an **after** — drive the new path and measure what it does on its own. This box was answered with
*"this adds two devices that could not move the ship at all before, so the before-number is no
picture"*, on the PR that shipped a control needing five metres of thumb to cross the screen. One
swipe against the branch preview found it six hours later.

If the instrument genuinely cannot reach it, say which instrument and what would.

---

## What this changes

<!-- Quality does not vary with the answers above. There is no low tier. -->
