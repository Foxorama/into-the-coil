# 0581 — The weapons sit right

**Accepted 2026-10-08.** Item 3 of [`the-loadout-planned`](../../reports/the-loadout-planned-2026-10-07.md).
Supersedes [0469](0469-the-pods-are-cigars.md)'s pods; builds on [0525](0525-the-gun-is-a-layer.md)'s mounts,
[0448](0448-each-ship-fires-from-its-own-guns.md)'s tube places and [0527](0527-the-wheels-turn.md)'s pictures
laid over the ship.

## The ask

> *"the weapons sometimes show over the ship itself, or look worse than nothing or are in the wrong place.
> The fighter is the most egregious, but it applies to all of them - the default fighter weapon obscures the
> cool wingtips and looks worse - other equipped weapons on the fighter show on top of the nose and it hides
> the nose art. applies to basically every ship, the weapons should look better and should be equipped
> better."*

Asked where: **guns on the fighter's nose, slimmer and ahead of its art; tubes under its wings.** Asked whether
a tube shows its kind: **yes, by ink** — a missile tube in the missiles' gold, a seeker tube in the seekers'
lavender.

## The rule

**A gun stands on its ship's hardpoint at the ship's own `mountScale`, and the fighter carries every gun —
its own too — on its nose ahead of its art; each loaded tube is a picture of its own in its kind's ink, laid
by the frame at the place the ship's row says its missile leaves.**

| | |
|---|---|
| **the fighter's guns** | its hardpoint at the nose's tip (0.93 of its hull's radius), every mount drawn at six tenths. Its pulse is no longer two cigar pods past its wingtips: it is the pulse's mount on the nose, its silhouette in the hull's outline, its muzzle the mount's own mouth |
| **the pulse's mount** | one block of two barrels split by a translucent seam, so it clears 0106's floor at the fighter's scale — the two 0.064 barrels never did, unmeasured while the pulse was only borrowed |
| **the fighter's tubes** | under its wings at mid-span, each on a slate pylon inside the wing's chord: one under the top wing, then both. They were on its chin, over its art, and on its wing roots, nowhere near where its row said they fired from |
| **the bike's guns** | a borrowed gun stands on the front of its fork by the headlamp, at eight tenths — it stood at the bars' top, against the rider's hands |
| **a loaded tube** | `tubeMissile` / `tubeSeeker` (the whole missile — the fighter, the saucer) and `noseMissile` / `noseSeeker` (the warhead at a turret's front — the cars, the bike), each with its hurt twin. The row says which (`tubeLook`) and how big (`tubeLength`); the missile row says which picture is its kind's (`loaded`) |
| **the frame** | `stepLoaded`: the n-th tube the run carries at the n-th place of the row's `tubes`, its nose at that place, wearing the ship's hurt twin when the ship does — the wheels' pool's terms. The turrets the cars and the bike draw no longer paint an orange nose |

## Why it is built the way it is

**A picture laid on, and not a hull per rack.** The ship is baked at no tubes, one and two (0441), and a tube's
kind is the run's — a missile pickup fills a tube mid-run with the kind its face shows. Baking the kinds in
is seven hulls a ship where there are three, or a bake mid-run; laying a picture at each place is two blits,
the wheels' precedent, and `tests/budget.test.ts`'s worst case moves by those two on 0527's line.

**Where it is drawn is where it fires from.** The tube's place was already on the row (0448); the fighter's
drawing ignored it and drew its own (`TUBES_ON`). Laid at the row's place, the picture and the missile cannot
disagree, and the fighter's places moved under its wings with its pictures.

**A scale per ship, not a smaller gun.** *"Slimmer"* on the fighter is not slimmer on a car's bonnet, so it is
a number each row authors (0282) and shared code holds nothing about the fighter. The muzzle moves with it
(`fitted`), so the shot leaves the mouth drawn.

**The warhead on the cars, the missile on the fighter.** A car's turret is near-square, so a whole missile in it
is a few pixels at the shipped camera and its ink does not read; the warhead the turret always showed, the
size it was, does.

## What was looked at and not changed

The cars' borrowed guns on the bonnet and the saucer's on its rim read as weapons standing where a gun goes;
they stay at full scale.

## Rollback

None needed: no key, no save field, nothing shipped changes shape.

## What guards it

`tests/weapons-sit.test.ts`: the fighter's guns on its nose ahead of every look's art and its own pulse drawn
as its mount; its tubes under its wings; every ship's loaded tube laid at its row's place in its kind's
picture, a mixed rack one of each. `tests/accents.test.ts` holds the pulse's silhouette in the hull and every
mark over 0106's floor; `tests/gun-layer.test.ts` the muzzle at the scaled mount; `tests/budget.test.ts` the two
blits. Probes in `scripts/probes/0581-the-weapons-sit-right.mjs`.

## Owed

- A play of every ship in every gun: whether six tenths reads on the fighter at play size.
- The hangar pad still bakes the ship bare (item 4 of the plan).
