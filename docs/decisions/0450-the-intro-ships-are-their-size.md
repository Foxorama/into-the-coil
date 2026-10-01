# 0450 — The intro's ships are their size

**Accepted 2026-10-02.** Corrects [0441](0441-a-pilot-flies-their-own-ship.md)'s *the hangar bakes
the fight's box at the scale the fighter always had there*; amends
[0444](0444-the-intro-is-the-pilots.md)'s hangar picture and the jets of
[0416](0416-the-viper-has-a-pilot.md).

## The ask

> *"the intro movie for the lil caddie has the caddie too big, needs a 20% reduction in the hanger
> and probably a 40% reduction in the space chase."*

> *"we definitely messed up and introduced a bug in the intro movie, it's not just the lil caddie, all
> the player ships are really large in the intro movie."*

> *"in the intro movie all the new ships only have one thruster instead of two … lil caddie and og
> ship should have two thrusters (lil caddie does now in game, but needs it in the intro movie)."*

## The rule

| | was | is |
|---|---|---|
| **`HANGAR_SCALE`** | 30 / 7, the bare fighter's hull baked at 30 | 30 / 9.4: the whole box is 30 units |
| **a ship's size in the shot** | the shared scale | the shared scale times the row's `intro` — 1 for all but the saucer, which is 1 in the hangar and 0.8 in the chase |
| **the saucer, against 0441's picture** | 1 and 1 | 0.74 in the hangar and 0.60 in the chase |
| **the intro's flames** | one set from `SHIP_JETS`, a table beside the row's `tail`; the saucer had one drive there | two sets: the hangar's, from the ship's side view (`HANGAR_ART`'s `jets`), and the fight's (`blueTop…`), from the row's `nozzles`. The chase crosses from one to the other with the tilt |

## Why it is built the way it is

**It was a bug, and the whole box was its size.** Before 0441 the hangar baked the bare fighter, 7
units in the fight, at 30. 0441 put every ship in the fight's 9.4-unit box and kept the scale, so the
box came out 40 units. Every ship stood a third bigger than the fighter ever had. The fighter also
gained its capped pods and canards there, and the saucer fills its box to the rim. Photographed in the
old build and this one, the fighter's span went from 145 to 225 pixels on a 1280 screen. With the box
at 30 and the wings trimmed ([0449](0449-the-wings-are-trimmed.md)) it is about 150.

**The saucer's extra is on its row.** The shared fix took every ship down by a quarter, which already
meets the hangar's twenty per cent. The chase's forty is an `outside` of 0.8 on the saucer's row, the
one ship whose box is all hull. A fifth ship that needs its own size writes one number.

**Two sets of flames, because a ship is seen two ways.** The saucer burns two drives either side of
its centreline. From above that is two flames; side-on in the hangar the two are one behind the other.
So the hangar picture says where its visible flame is and the fight's flames come from the row's
`nozzles`, the same place the game's flames do. That retires `SHIP_JETS`, the second description of
where each ship's engines are, which disagreed with the game about the saucer. The cars and the
fighter have no hangar picture of their own, so their two sets are the same drawing.

## What was rejected

- **Scaling only the saucer.** The report is about every ship, and the cause was the shared scale.
- **Drawing the saucer's two drives in the hangar too.** Side-on, two drives stacked up and down a lens
  0.4 of the box thick read as a bug.

## Confirmed, not assumed

| claim | checked by |
|---|---|
| every ship's box is drawn no bigger than 30 units in the hangar; the saucer at ≤ 0.8 and 0.6 of 0441's | `tests/intro.test.ts`, *draws every pilot's ship no bigger than the fighter was beside the bar door*, in pixels on a 16:9 screen |
| once tilted over, the chase burns the fight's flames and not the hangar's | the same test |
| the picture | photographed in the dev build for Hook and Feather: the hangar, the tilt, and the chase, where the saucer burns two drives |

`node scripts/prove-guard.mjs 0450`, three probes, all red.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md).

## Owed

- **A look at the intro in all four ships.** The fighter in the hangar should be the size it was
  before the roster.
