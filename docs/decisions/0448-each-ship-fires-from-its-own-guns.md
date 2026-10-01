# 0448 — Each ship fires from its own guns

**Accepted 2026-10-02.** Amends [0441](0441-a-pilot-flies-their-own-ship.md)'s cars and its `tail`,
[0244](0244-a-blade-rides-a-helix.md)'s throw point, [0097](0097-the-sky-has-layers-and-the-tubes-have-sides.md)'s
tube places, [0230](0230-the-ship-flies.md)'s one flame and [0340](0340-the-coil-is-a-route.md)'s held
root; takes out [0442](0442-the-ray-gun.md)'s bursts.

## The ask

> *"in game, the firebird and station wagon don't fire weapons from the actual gun on the hood.
> shurikens should be fired from the gun and then go out to their current distance and helix from
> there. lightning should fire from the gun on the hood of the station wagon. similar with missiles …
> missiles should fire from the tubes on top and then go into the two paths they use now."*

> *"the engines on the two don't fit properly when they do the full blast for level transition … one
> thruster is fine for the station wagon and firebird but they need to have one thruster in game as
> well."*

> *"let's revert the 4 shot pulse fire on the lil caddie, it feels bad and sounds worse, the full
> autofire felt much better."*

## The rule

| | was | is |
|---|---|---|
| **where a shot leaves** | `MUZZLE_ALONG`, three units ahead on the centreline, for every ship | the row's `muzzle`: the nose on the fighter and the saucer, the launcher's star on the Firebird's hood, the rod's ball on the estate's bonnet |
| **a blade** | thrown at ±`wingtip` across, on a helix already turning | thrown from the muzzle; for `BLADE_OUT_STEPS` (10) it goes out to ±`wingtip` with the strand held, then the helix starts there |
| **the arc's first link** | from the nose | from the muzzle |
| **a missile** | 0097's place, ±1.8 across at the nose, for every ship | the row's `tubes` at one and two: the cars' roof turrets; the fighter's and saucer's 0097 places. It still pops to the top path and the bottom one |
| **the engines** | one bitmap of the fighter's two flames, on every ship's centreline at `tail` | one jet baked, laid once per row `nozzles`: two on the fighter and the saucer, one at each car's pipe |
| **the root a swelling flame holds** | half the flame's extent from its centre | `BURN_ROOT`, where the bake draws the root (`THRUST_ROOT` of the frame) |
| **the ray** | four rings, then a sixteen-step rest; ring 9, burst 4 | every eight steps; ring 6, burst 3, as 0441 measured it |
| **the exhaust pool** | 1, from the particle share | `MAX_NOZZLES` (2): the second slot is the pickups', 11 → 10 |

## Why it is built the way it is

**Each ship says where its guns are.** The cars were redrawn side-on in 0441 with a gun on the hood
and turrets on the roof, and the frame went on firing from where the fighter's nose had been. 0282:
the row says its version and shared code holds the default. The fighter and the saucer author the
values they always fired from, so nothing about them moves.

**The rows are held to the drawing, not derived from it.** `src/content/` may not import the bake.
The bake exports `carMounts`, the hood gun and each turret's missile in the box's radius, and
`tests/mounts.test.ts` holds the rows to it within a twentieth of a unit. A turret moved in the
drawing and not on its row turns that red.

**A blade goes out first, then helixes.** The first build closed the blade onto a helix that was
already turning, and it joined it nine units out. *"Go out to their current distance and helix from
there"* is a place, the wingtip width, so the strand does not turn until the blade has reached it.

**The flame was one bitmap of two flames.** On a car it burned two flames on the centreline into the
slope of the boot. Baked as one jet and laid per nozzle, the fighter's pair is two blits, which is
one entity more. The particle share is measured full (`tests/flares.test.ts`, 148.9 of 149). The
pickups need seven at most and had eleven, as when 0373 took the aura's slot.

**The gap at full burn was a wrong constant, and the guard agreed with it.** 0340 held "the root" at
half the sprite's extent. The bake draws the root at 0.92 of the frame's radius, which is 0.39 of the
extent. So at 2.8× the root slid about a unit back off the nozzle. On the fighter that gap is under
its wings; on a car's flat bumper it was the reported misfit. The 0340 guard measured the root with
the same half, so it passed. Photographed at full burn after the fix, each car's flame meets its
bumper. ⚠️ **The guard still measures the root by the constant it holds**: no guard can read where
the bake put a flame without a canvas. The photograph is the evidence, and 0027 names the gap.

**The ray's bursts are gone, not paused.** No other gun authored a rest, so the `burst` field, its
counter and the frame's branch went with the ray's. The damage goes back to 0441's measured 6 and 3.

## What was rejected

- **A second flame bitmap set for single-pipe ships.** That would be fifteen more sprites keyed to a
  count, and it would still sit on the centreline. A nozzle is a place.
- **Taking the exhaust's second slot from the debris.** The flare guard measures that pool full.

## Confirmed, not assumed

| claim | checked by |
|---|---|
| each car's muzzle and tubes are where it is drawn | `tests/mounts.test.ts`, *THE ROWS ARE THE DRAWING* |
| every ship's shot, and the arc's first link, leaves its muzzle | *THE GUN* |
| a missile leaves its tube and opens to the top and bottom paths | *THE TUBES* |
| a blade leaves the gun, is at the wingtip width by `BLADE_OUT_STEPS`, and the pair split to mirrors | `tests/blades.test.ts`, *THE HELIX*, *THE PAIR* |
| one flame per nozzle, on it, at warp nought and full | `tests/thrust.test.ts`, *0448 — burns one flame* |
| the picture at full burn, each car's flame on its bumper | photographed on the bench, `?cross=1`, each ship |

`node scripts/prove-guard.mjs 0448`, seven probes, all red. The fighter and the saucer fire the pulse
and the ray from the nose, where every ship fired before. A pulse put back on the centreline is
therefore a break no ship shows, and it has no probe.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Nothing persisted moves.

## Owed

- **A play of both cars**: blades splitting off the hood, lightning off the rod, missiles off the
  roof, and the one flame at the bumper through a level crossing.
- **The ear on the ray** at full autofire again.
