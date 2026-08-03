<!--
  One question, and it is a question of FACT — not an estimate of how risky this feels.
  See docs/decisions/0001-revertability-not-risk-rating.md.
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

## What this changes

<!-- Quality does not vary with the answer above. There is no low tier. -->
