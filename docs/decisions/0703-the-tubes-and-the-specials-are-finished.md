# 0703 — The missiles, the tubes and the specials' pictures are finished

**Accepted 2026-11-01.** Items 17 and 18 of
[`the-ships-and-weapons-polished`](../../reports/the-ships-and-weapons-polished-2026-10-31.md) — the report's batch D,
landed at full auto at the player's asking. On [0698](0698-the-fighter-is-finished.md)'s terms: light and material,
contours in the body's own shade, everything added translucent.

## The rule

| what | where | what was added |
|---|---|---|
| **the missile** in flight | `drawKind`, `missile` | a glint along its lit flank; the warhead's join a contour in the casing's deep shade |
| **the seeker** in flight | `seeker` | the dart's lit flank glinting from the nose to the fin; the fin's root a contour; the eye's glint |
| **the loaded tube** (a dart under a wing or on a cradle) | `drawLoadedTube` | a glint along the casing's top; the warhead's join a contour |
| **the warhead nose** (a turret's face) | `drawLoadedNose` | the cone's lit flank glinting and its far flank deep, so it reads as a cone |
| **the pods on every car, the bike, the duck and the Viper** | `paintTurrets` | a streak of the room along the pod's back, in the shell's own lightest shade; the band's two edges contours; the lip round the dark face lit along its top |
| **the caddie's pods** | `paintPod` | the pearl's gloss along the side toward the light on both pods; the drive ring's edges contours |
| **the pylons and cradles** (the fighter's, the ball's) | `paintPylon` | the rail's top edge glinting |
| **the bomb** (and its pickup face, which is the same drawing) | `bomb` | a streak along the casing's top, its belly in shadow, the ogive's join and the fins' roots contours, the eye glinting; 0375's two bands kept |
| **the candle's star** | `candleStar` | the ball brighter at its limb than across its face — round, because the frame turns it along its flight |
| **the storm ball** | `stormBall` | a lit ring at its limb and a dark one just inside, so it has a skin and a heart rather than one glow |
| **the void ball** | `voidBall` | the shell's own edge lit, round, because the frame turns it |
| **the two auras** (the surges' pods) | `auraHunt`, `auraOverdrive` | each pod a cylinder of its own light, lit along its top and deep along its belly |

**Nothing solid was added**: every mark is under 0.9 alpha and held inside the box by `tests/accents.test.ts`. The
muzzles, the tube places and the noses' positions are untouched (`tests/mounts.test.ts`, `tests/launchers.test.ts`).

## What the item named that this leaves as it was

- **The dance's flares and wave, and the nova's arc.** Each is light drawn *added* (`LIGHT_KINDS`), already a stack of
  layers from [0520](0520-the-light-is-loud.md)'s loud pass, and each was sized against
  [0024](0024-the-accessibility-floor-is-settings.md)'s flash cap by `scripts/weigh-flashes.mjs`: the dance's wave
  every fifth of a second and the arc as a band laid end to end round the ship. A brighter edge on either is a
  brightness swing over an area, which is what that cap counts — so a finish on them is a measurement owed first,
  and it is named in the open calls rather than added blind. The balls this did touch are small, turn slowly, and
  gained rings at under half alpha.
- **The fighter's own pods** were finished with the fighter, by 0698.

## The flash cap, measured

`scripts/weigh-flashes.mjs` over every scenario it has, on this tree with batches C and D in it: every gun and every
special at 0 to 2 flashes in its worst second against 0024's cap of three, **except the void missile, at 7 flashes
(15 transitions, 17% of the screen)**. Measured twice with the void ball's new ring taken out — 7 both times — and
twice on `main` without any of this work — 7 both times. **So the void missile is over the cap on `main` already**,
and nothing here moved it; it is a defect against [0457](0457-the-flash-cap-is-measured.md)'s measurement, recorded
in the report as found and not fixed here, because the fix is to the rift's light and not to a picture this queue
owns.

## The open calls, from the pictures

- **The dance's flares, the dance's wave and the nova's arc** are as 0520 left them; if they should be finished too,
  it is a run of `scripts/weigh-flashes.mjs` against each first.
- **The pod's streak** is in the shell's own lightest shade, not white, because a pod is a car's own paint; on the
  dark Thunderbolt and Viper shells it is faint.

## What guards it — and why no new guard

The containment guards, the muzzles and the hurt twins hold everything this touched, and were run against it. No
finish guard, by [0192](0192-a-guard-holds-an-invariant.md)'s question, as [0702](0702-the-eight-guns-are-finished.md)
answers it for the guns: a missile drawn flat on purpose would redden it and be correct.
