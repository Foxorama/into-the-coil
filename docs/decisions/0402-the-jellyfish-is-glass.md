# 0402 — The jellyfish is glass, and it opens

**Accepted 2026-09-28.** The Black Heart's end boss is redrawn as a translucent jellyfish, hung the
right way up over the heart, with a second body for its last phase in which the bell stands open on
the heart. The void phase throws a fifth fewer. **Amends [0264](0264-the-real-bosses-are-drawn.md)'s
jellyfish** and **draws [0255](0255-the-jellyfish-opens.md)'s opening**, owed since that decision.

## The ask

> 1. it's not a medusa head, it was also supposed to be a jellyfish
> 2. it needs to be flipped vertically
> 7. the jellyfish needs to actually 'open and expose the heart' for the increased damage (currently
>    that never happens at all)
> 12. the art needs to be updated so it's a translucent jellyfish and you can see the heart beating
>     behind it.
> 13. the void phase needs to happen when the heart is exposed and it needs slightly less void balls
>     firing.

## What it was

A bell to the front, six wedges trailing off the back, and a gold eye in the middle. It looked down the
lane like a head with snakes for hair. Its last fifth took twice the damage, had done since 0255, and
looked exactly like the four fifths before it: 0255 recorded the heart and the opening as owed, and
they stayed owed.

## What changed

**Flipped.** A jellyfish hangs its tentacles below it, and below is down the lane. So the dome is at
the back (`+x`), and the margin and its frill face the player. Its oral arms hang from the middle of
the margin towards the ship. The tentacles are no longer in this bitmap at all: they are bodies of
their own (0403).

**Glass.** The bell's fill is the lord's red lifted to its ice, a violet, at 0.22. The heart is the
seat in the layer behind it (0400), so it shows through the glass and beats there. What makes a
translucent thing read as a thing rather than a smudge is its edges, so the light goes there: a lit
rim round the dome, lappets of light along the margin, and radial canals and a crown sheen at partial
alpha. The outline is still sealed, because the rim is what the animal is read by. The bell is centred
a little ahead of the hull so the dome is over the heart; the first draw left most of the heart under
the frill.

**Open.** `boss14Open` is the same bell split along the lane's axis. Each half is swung out on a hinge
at the crown, so the mouth gapes towards the player with the heart bare in it. It is worn by the last
phase (`BossPhase.hull`) at the same 46-unit box. **The first draw swung the halves the other way**, which
closes a bell at the mouth; the photograph showed the heart only in a slot.

**A worn body goes back to the row's** when the phase it is in authors none (`wearFace`, `wearsAsHull`).
The gyre only ever went forward, so this was never needed. A jellyfish fed back over its last fifth
(0404) shuts its bell.

**Eight void a ring rather than ten**, on the same cadence, in the phase where the heart is exposed.

## The guards, and that each was seen to fail

`scripts/probes/0402-the-jellyfish-is-glass.mjs`, in `tests/medusa.test.ts`:

| guard | the break |
|---|---|
| *the last phase wears the bell open, in the same box, and a phase before it wears the bell shut* | the open hull taken off the phase; the row's own body not restored |

## Not held by any guard

**Whether it reads as a jellyfish, whether the heart reads through it, and whether the opening reads
as an opening at speed.** Photographed on the bench shut, open and hit. Owed a play.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md).
