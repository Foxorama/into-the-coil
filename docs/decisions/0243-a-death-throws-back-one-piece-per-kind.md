# 0243 — A death throws back one piece per kind

**Accepted 2026-09-05**, the same day as [0242](0242-a-blade-coils-ahead-of-the-ship.md), from
[`the-scatter-under-fire`](../../reports/the-scatter-under-fire-2026-09-05.md):

> *"change the death pop of powerups to be a single missile power up bubble with an x2/3/4 etc if
> they had multiple powerups, and same for weapons, it's too hard to grab all the different powerups
> with all the different sequencing in the middle of a hail of bullets"*

**Amends [0066](0066-a-death-scatters-what-it-took.md)**: a death still throws back everything it
took, as one piece per kind rather than one per rung. **Amends
[0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)**: a scattered piece does not cycle.

## The rules

**A death throws one piece per kind, carrying the count.** `scatterUpgrades` counts the rungs of
each kind the death took and throws one piece for each kind present, with `stack` on the entity
set to the count — two pieces at most, thrown apart across the lane first (a ring of two started
along the lane put one against the box's back wall). `THE STACK` in `tests/stack.test.ts` holds the
count on each piece, the face, and one piece for a loadout of one kind.

**A scattered piece holds its face.** It starts on the face the player just lost — 0233's rule — and
0243 stops it there: `faceIn` is zero, so it never turns. An authored pickup still cycles. The
report names the cycling as the thing that made a death's pieces impossible to take under fire;
what the player is trying to recover is the gun they had.

**Taking it hands back every rung.** `Collected` logs the stack beside the face; the shell passes it
through as `count` on one `upgraded` action, and the run slice adds that many rungs — under the
ladder's clamp and the switch rule as one event, rather than a rung at a time. `count` absent is one,
which is every authored pickup.

**And it wears a badge.** `stackTwo`, `stackThree`, `stackFour`: a disc in the pickup ink with `×N`
cut out of it under `evenodd`, so the void shows through the numeral and it is legible against
anything by the rule that makes the shuriken's hole legible. `paintStacks` blits it over the
piece's lower-right corner, interpolated on the same alpha as the piece. A second blit for a
stacked piece and only for one, so 0025's worst case — which holds no scattered piece — is
unchanged; a death adds at most two. `THE BADGE` asks the picture: the frame drawn onto a surface
that keeps every blit.

## ⚠️ What was rejected

**A stacked face baked per count.** Fifteen bakes (five faces by three counts) and a badge that had
to be part of the hull under `evenodd` to pass the accents guard without punching a hole in the
glyph. A separate bitmap is one arm and lands on any face.

**Dispatching `upgraded` once per rung from the shell.** The ladder's clamp and 0233's switch rule
would see three events for one pickup, and a switch would apply three times.

**Keeping the cycle on a scattered piece with a longer face.** The report is about a death, not
about the cycle's length; a piece that turns at all is a decision under fire.

## What is owed

- **An eye on the badge**, at the shipped camera, over a bubble: whether ×2 reads at a dozen
  pixels, and whether the two pieces read as *mine* against a field of enemies.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). An entity field, a log field, an
optional action field, three bakes and a painter; nothing persisted — a save holds resolved
upgrades, never a scatter.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0243`:

| broken on purpose | went red |
|---|---|
| a scattered piece worth one rung whatever the death took | `THE STACK: a death throws one piece per kind` |
| a scattered piece turning its faces again while it waits | `a scattered piece holds its face` |
| the reducer granting one rung whatever count the pickup carried | `taking it hands back every rung` |
| the badge never painted | `THE BADGE: a stacked piece is drawn with its count` |
