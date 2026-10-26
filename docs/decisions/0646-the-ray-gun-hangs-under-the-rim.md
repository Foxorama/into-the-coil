# 0646 — The ray gun hangs under the rim

**Accepted 2026-10-26.** From the play of 2026-10-26. Amends the side view of
[0587](0587-the-ray-gun-is-a-saucer.md); the gun's shape and its top view are 0587's still.

## The ask

> *"the ray gun/weapon for the Lil Caddie should be below the ship, not above it in the graphic, it'd be
> blocking the pilots view currently."*

## What 0587 read, and what it got wrong

0587's ask was *"it should show on the top half of the ship"*, and it read that as the side view's: the pad
has been the preview of every change since [0540](0540-the-hangar-is-the-port.md), and there the gun had
hung on the bottom half since [0493](0493-the-ray-gun-hangs-under-the-lip.md). So it rode the gun up on a
pylon above the rim at the nose. Side-on, that put the little saucer just ahead of the dome at the pilot's
eye height — the arithmetic is in `tests/mounts.test.ts` — which is the thing in the way this play names.
The shape asked for was right; the half was not.

## The rule

**From the side, the ray gun hangs under the rim at the nose.** `RAYGUN.side` is `+0.2` of the box below
the rim, where it was `−0.2` above it; the pylon runs from the belly down to the gun; it is still painted
last, over the belly and the hover light. The tilt frames close the drop toward the rim as the view leans
over, and past half way the view from above is unchanged: the saucer tucked under the lip, as 0493 asked.

A borrowed gun's side mount (0526) still stands on the rim's nose above it. Those mounts are every ship's,
and the ask is the ray gun's; if a play says the borrowed ones block the view too, that is the mount table's
`across` in `src/content/weapons.ts`, one row at a time.

## What guards it

`tests/mounts.test.ts`, *0587 — the ray gun is a little saucer, and 0646 hangs it under the rim*: off the
side view's own trace, every mark of the gun is at or below the rim, and the gun is far wider than it is
tall. 0587's probe in `scripts/probes/0587-the-ray-gun-is-a-saucer.mjs` is turned round — the gun ridden
above the rim again reddens it — and keeps its ball-not-saucer break.

## Owed

A look at the pad and the intro.
