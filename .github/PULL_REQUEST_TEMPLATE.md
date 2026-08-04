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
**Yes → run `npm run trace`, and paste the pixels.** A green suite is not an answer to this
question. Every guard here counts a *model* quantity, and the bug this exists for lived between two
model quantities that were both correct — the whole suite green on either side of it
(`reports/camera-judder-2026-08-04.md`).

### What the picture did

| | before | after |
|---|---|---|
| *screen travel, or whichever line moved* | | |

*Which invocation — the flags matter — and what a reader should conclude. "It looks better" is not a
number and a number nobody has looked at is not a picture.*

---

## What this changes

<!-- Quality does not vary with the answers above. There is no low tier. -->
