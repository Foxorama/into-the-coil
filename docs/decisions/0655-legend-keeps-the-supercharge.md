# 0655 — Legend keeps the supercharge

**Accepted 2026-10-24.** Answers the question [0652](0652-a-full-rack-throws-a-shield.md) left open. Amends 0652:
the share is the tier's.

## The ask

0652 made half a full rack's missile pickups shields on every tier, and said Legend's shell is renewed full every
level, so a shield there mostly spills into a void. Asked whether Legend should keep its supercharges:

> *"Legend should keep the missile supercharge, good call."*

## The rule

**The share is on the tier's row, `fullSwap`**: Legend 0, Savior 0.5, Burn 0.5. The pickup's row keeps only *what*
it becomes, `whenFull: 'shield'`, read by `fullAs` in `src/app/frame.ts` as before.

**A tier at zero draws nothing**: `fullAs` returns before the coin, so a Legend run's pickup stream is the one it was
before 0652, not the same stream with a coin that always comes up missiles.

`AUTHORED`, the fixtures' baseline, says half, so the guards 0652 wrote stand on it as they did.

## What guards it

`tests/pickups.test.ts`, *0655*: the three tiers' values named (the player's words), and four hundred mid-boss throws
at a full rack on Legend's row, every one a missile. The probe in
`scripts/probes/0655-legend-keeps-the-supercharge.mjs` gives Legend half again. 0652's probe is re-anchored.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
