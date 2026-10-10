# 0587 — The ray gun is a saucer

**Accepted 2026-10-10.** From the play-test of 2026-10-10. Supersedes the side view of
[0493](0493-the-ray-gun-hangs-under-the-lip.md) and the gun's shape since [0467](0467-the-ray-gun-is-a-turret.md).

## The ask

> *"The ray gun still looks bad, it should show on the top half of the ship. It should be more saucer shaped."*

## Which view the ask is about

The saucer is drawn twice: from above in the fight (`drawCaddie`), and from the side on the pad and in the
intro (`paintSaucer`). 0493 hung the gun under the lip in both — from above because play asked for it
(*"the raygun sits above the ship instead of under it"*), and from the side as a consequence, where its
housing hung below the rim's edge. The pad has been the preview of every change since
[0540](0540-the-hangar-is-the-port.md), so the side view is where the gun has been looked at most since, and in it the
gun was on the bottom half. **So the ask is read as the side view's, and 0493's ask about the top view is
kept:** from the side the gun rides the top half; from above it is still tucked under the lip.

## The rule

**The ray gun is a little saucer of its own**: a chrome disc, a dark rim band with lights of the rings'
lavender round it, a lavender lens for a dome, and its mouth an edge-on ring as tall as the first ring it
throws ([0588](0588-the-rings-are-thrown.md)). The ball, the barrel and the dish are gone.

| | |
|---|---|
| **from the side** | it rides a short pylon above the rim at the nose (`RAYGUN.side`), painted last, over the saucer — `paintRaygunSide` |
| **from above** | the same saucer under the lip (`RAYGUN.housing`, its centre inside the rim): its front, its band and its mouth show past the rim, and the hull's outline is the disc and that front (`raygunProfile`) |
| **borrowed** | another ship's ray gun is the same saucer, its front on the mount's muzzle — from above on the mount, from the side on a pylon (`MOUNTS.ray`) |
| **the muzzle** | the saucer's front, 0.96 of the box: the row's `muzzle` is 3.79 along, and `caddieMounts` reads the same number |

## What moved in the guards

`tests/mounts.test.ts`'s *A RING IN, A RING OUT* measured a dish's radius against the innermost of four
concentric rings. Neither exists now, and what it held is unchanged: the gun's mouth is what comes out of
it. It now measures the mouth — the tallest edge-on mark out past the rim on the gun's line — against the
first ring of the train, both off the bakes' traces in world units, within a quarter. *UNDER THE LIP* is
unchanged and still green: from above, the saucer is painted before the disc's face.

The accents guards caught three things on the way, each fixed in the drawing rather than the guard: the
saucer's six lights were solid specks under 0106's floor (they are glows now), its mouth stood outside its
own outline (it is further in), and a borrowed gun's glow ran past the estate's box (it is smaller).

## Probes

0493's *the muzzle back to the small orb it was* is re-anchored on the mouth: shrunk to a point, the guard
goes red.

## What guards it

`tests/mounts.test.ts`, *0587 — the ray gun is a little saucer, on the top half*: off the side view's own
trace, every mark of the gun is above the rim, and the gun is far wider than it is tall. Probes in
`scripts/probes/0587-the-ray-gun-is-a-saucer.mjs`.
