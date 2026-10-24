# 0651 — The arc lets the serpent fall

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 2.
A defect against [0627](0627-the-roots-are-walls.md).

## The report

> *"Snake died to lightning gun and roots didn't disappear, no idea why."*

## What was wrong

0627 has the dead serpent's body fall through the far wall and break the trunks marked `breaks`. The fall
starts in the boss's death, and only if the body is still there: `w.bossBody.size > 0`.

The lightning gun strikes as it fires, inside the volley (`fireArc` → `strike`), which is **before**
`layChain` in the step. Every other gun lands in the collisions, after it. So on an arc kill `layChain`
found the head's pool empty with no fall begun, and cleared the body; the death later in the same step saw
no body and began no fall. Nothing else breaks a root, and none of the serpent's pieces is a `far` wall of the kind
[0337](0337-the-gyre-falls-out-of-the-wall.md) withdraws once a fight is over (0627: *"nothing withdraws"*),
so the far wall stood for the rest of the level.

0627's guard killed the serpent by setting its health to nothing and stepping, which removes the head in the
collisions — the one order that could not see this.

## The rule

**On the step the head dies, a chain whose row slumps keeps its body for the death to start the fall.**
`layChain` clears the body only when the row has no `slump`, or when this is not the step the boss came
apart on (`bossJustDied`). The step after, either the fall has begun or the body goes as before, so no body
outlives its head by more than the step it died on — the step every other gun's kill already left it.

The fix is in the order, not in the arc: a gun added later that lands before the chain is laid is covered
without being told to.

## What guards it

`tests/serpent.test.ts`, *0651*: the serpent killed by the Thunderbolt's own arc through the real trigger,
and its body falling, breaking a far trunk and leaving the screen within 0627's three seconds. The probe in
`scripts/probes/0651-the-arc-lets-the-serpent-fall.mjs` puts the old clear back.

## Not held by any guard

- **The page says *rooks*.** Read as the roots, since the serpent's room has no rocks: its row has no fall
  of stone (`fall: null`), and the roots are what its death is meant to break.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
