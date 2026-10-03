# 0468 — The Firebird is black and gold

**Accepted 2026-10-03.** Item 4 of
[the chrome and the ships, reviewed](../../reports/the-chrome-and-the-ships-reviewed-2026-10-03.md),
a play report on [0461](0461-the-ships-are-jazzed.md) and [0463](0463-the-ships-are-cooler.md)'s
Firebird: *"the firebird has gone too far away from the black and gold trans am."*

## The rule

| | was | is |
|---|---|---|
| **the body** | the void mixed a fifth toward the player's cyan — navy, lit blue-grey along the roof | the void warmed a twelfth toward the gold and lifted a sixth — a warm near-black, one sheen along the roof |
| **the pinstripe** | the player's cyan down the shoulder | **gold**, along the beltline, the rocker, an arch over each wheel, the nose's edge, and the shaker's lip |
| **the bird** | gold with a tail in the shot's orange, the length of the flank, in three polygons | **gold, one colour, one polygon**, a third of the flank on the door |
| **the side pipe** | chrome along the sill, the brightest band on the car | gone; the rocker's gold line is there |
| **the launcher** | a slate box with the steel star on it | a **shaker scoop** in the lacquer with a gold lip, the star set in it, a touch smaller |
| **the player's cyan** | the shoulder stripe | **light, not paint**: the T-top's bar and the headlamp's glow |
| the glass, the rims, the lamps, the spoiler, the turrets | gold glass, gold-dished rims, lamps, a lacquer spoiler with a gold edge, black pods banded gold | unchanged |

## Why each is the shape it is

**A black car on a dark void is found by its gold edges, not by lifting the black.** 0441 lifted the
lacquer toward the player's cyan so the car could be seen at all, and the lift read as blue; every
pass after it added gold on top of a blue car. The reference — the 1977 Trans Am SE — is jet black
with gold pinstriping along every body line, gold snowflake wheels, gold glass, a gold shaker scoop
and one gold bird, and on the road at night it is the gold lines that are seen. So the body is as
near black as the void allows (warm, so it is not the void) and the lines do the work. Photographed
on the field at 1600×900 and off the sheet at two and eight times: a black car with gold edges.

**The bird is one polygon because a decal is one shape, and because three were too thin.** 0463's
tail, body and wing were slivers; at half their size, each was 1.7 px across on 1280×720, under
[0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s floor, which `tests/accents.test.ts`
reported. A crested head, two wings up and a forked tail in one outline is twelve units of a
thirty-six-unit flank, and the gold on the door is the one bright thing on the car's side.

**Every pinstripe is inside the silhouette** — the arches are stopped a third of a radian short of
the sill, the T-top's bar and the shaker's lip were each moved in once after the accents guard
found them a tenth of a pixel over the roof, and the guard holds all of them.

**The cyan stays, as light.** [0441](0441-a-pilot-flies-their-own-ship.md): every ship carries the
player's cyan so the player can find themselves. A cyan paint stripe is what made the car blue; a
cyan bar on the roof and a cyan glow round the headlamp are lights, and a black car with lights on
is still black.

## What guards it

Nothing new; every change is a taste in [0192](0192-a-guard-holds-an-invariant.md)'s sense. The
existing guards ran against it and found three marks over the floor or the edge, each resized or moved
rather than exempted: `tests/accents.test.ts` (every mark on its hull and thick enough to be drawn,
every stroke inside the silhouette), `tests/mounts.test.ts` (the blades leave the star), and
`tests/intro.test.ts`.

**Photographed** off the sheet at two and eight times and on the bench in The Approach at 1600×900.

## What it does not do, and what the player may veto

- **The body's lift is one number.** If it reads as grey rather than black on play, it comes down; if
  the car vanishes on the darkest places, it goes up, and the gold lines are what to look at first.
- **The bird's shape is a taste**, one polygon's points.
- **No whitewalls, no chrome bumpers**: the Bandit had neither.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
