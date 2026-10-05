# 0525 — The gun is a layer

**Accepted 2026-10-05.** Item 5 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
Amends [0441](0441-a-pilot-flies-their-own-ship.md)'s *the ship carries the gun* and
[0448](0448-each-ship-fires-from-its-own-guns.md)'s one muzzle per ship. Nothing the player sees changes
yet: item 6 puts the choice in the hangar.

## The ask

> *"I do want guns to be interchangable per ship as well, it's expensive, but it makes the modding a lot
> more fun and a lot higher quality"*

## The rule

**A ship can be drawn and flown with any of the four guns. Its own gun is drawn exactly as it always
was; another ship's gun is drawn without the ship's own and laid on it at the ship's hardpoint, in the
ship's view, and fires from that mount's mouth. A run carries the gun it was begun with.**

| | |
|---|---|
| **the ship** | two new fields on its row: `view` — `side` for the cars, `top` for the fighter and the saucer — and `hardpoint`, where a borrowed gun stands: the hood, the bonnet, the nose's spine, the rim at the nose |
| **the gun** | `mount` on its row: where its shot leaves its own mount, from a hardpoint, in each view |
| **`fitted`** | `src/content/ships.ts`: a ship row and a gun make the row the frame flies — its own row unchanged, or that row with the gun and a muzzle at the hardpoint plus the mount. The frame reads `weapon` and `muzzle` off the row it was handed, so it does not learn that guns move |
| **the run** | `gun` on the run, begun from the shell or the ship's own by default, carried through every action; the shell rearms the world with `fitted(ship, gun)`, and so does `lifecycle.begin` |
| **the bake** | `drawPlayerShip` takes a gun, its own by default. With its own, every line runs as before. With another's, each ship's drawing closes its outline over where its own gun stood — the fighter without its pods, the saucer's rim all the way round, the cars' hoods running straight — and `paintMount` lays the borrowed gun on last |
| **the mounts** | eight drawings, four guns by two views: the pulse's twin barrels; the ray gun (the caddie's own `paintRaygun`, placed and scaled); the shuriken's launcher block, and from above its gold-lipped drum, the steel star on each; the arc's rod and ball, and from above the ball in its coil. Each ends at its row's `mount`, so the mouth drawn is the muzzle fired from |

## Why it is built the way it is

**Byte-identical by construction, then proved.** The plan said this item would be *"proved by the sheet
baking byte-identical"*. Cutting each car's gun out of its one outline path and filling it as a second
shape would not have been: an anti-aliased edge along the join is a different pixel. So the gun was not
cut out of the own-gun drawing at all. A `gun` argument defaulting to the ship's own leaves every call,
in order, as it was; only another's gun takes the other branch. The ray gun gained a placement whose
default is the identity and a scale whose default is one, which return the same numbers rather than
recomputing them. **Proved against `main`:** every ship at every stage, its own gun, traced call for call
by `tests/paths.ts`'s pen on `main` and on this branch — 1.33 MB of trace each, identical byte for byte.
That is a one-time proof of a refactor, recorded here and not kept as a guard, because the next art pass
on a ship is meant to change its drawing.

**Eight drawings, not twelve.** A mount is a gun's, drawn in a view; a hardpoint is a ship's. A fifth gun
is two drawings and a fifth ship one hardpoint — 0282's *every instance authors its Y*, at the grain the
instances actually vary at.

**The muzzle is read, not placed.** The drawing reads the same two numbers `fitted` does, so the mouth
drawn and the point fired from cannot drift apart.

**Three numbers moved when the box was checked.** The pulse's barrels from above were 1.66 units long,
and on the saucer's rim their glow ran 1.6 pixels past the sprite's box; they are 1.42. From the side the
pulse's 1.18 and the ray's 1.42 ran off the estate's far-forward bonnet; they are 0.95 and 1.1. The guard
that found them stays.

## What is not in this PR

The slot, and everything it needs to show a borrowed gun in the game, is item 6: the hangar's gun band;
re-baking the run's six ship sprites with the fitted gun in place in the atlas at a run's start and after
every full bake (the sky's `bakeNebula` is the precedent); the readout's lives icon, the pilot card and
the intro's hangar; and the boss floor flown in all sixteen pairings, which the plan costed at four times
that guard's time.

## What guards it

`tests/gun-layer.test.ts`: `fitted` for every ship's own gun and every borrowed one; every borrowed
muzzle on a mark its mount paints; every pairing at every stage inside its sprite's box; a borrowing
ship drawn without its own gun and with the mount laid on last; every borrowed gun's first shot — and
the arc's first link — leaving its mount; and the run beginning and staying on its gun. Probes in
`scripts/probes/0525-the-gun-is-a-layer.mjs`.

## Owed

- A senior-design pass on the eight mounts, photographed at the shipped camera on every place's palette —
  the first pass was photographed on the void only.
- Item 6.
