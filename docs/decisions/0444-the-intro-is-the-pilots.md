# 0444 — The intro is the pilot's

**Accepted 2026-10-01.** Amends [0416](0416-the-viper-has-a-pilot.md), whose run for the Viper it
takes out, and [0441](0441-a-pilot-flies-their-own-ship.md)'s *the intro flies the pilot's ship*;
the beats go back to [0414](0414-the-chase-is-a-chase.md)'s. The hangar is
[0411](0411-the-chase-begins-at-the-port.md)'s, a side section on
[0031](0031-landscape-is-the-shipped-orientation.md)'s terms.

## The ask

> *"lets remove venoma running from the intro, it doesn't add anything and makes the ending worse
> when you see the villain running with no captive."*

> *"the little caddie looks pretty dece top down in game, but in the intro movie it really needs to
> be sideview, lifts up and flies out of the hanger then tilts so it's topdown view."*

## The rule

| | was | is |
|---|---|---|
| **Venoma** | runs out of the bar, across the deck and up into the Viper (0416) | aboard before the picture starts; the Viper lights, lifts and goes as it did |
| **the beats** | the Viper lit at 4.1 s, the intro 23.0 s | 0414's: lit at 1.0 s, the intro 19.9 s — every beat after the run 186 steps sooner |
| **the cues** | her door, her feet and her leap | gone with her |
| **the pilot's ship in the hangar** | the fight's drawing (`blue`) | `blueSide`: the ship as the hangar sees it |
| **outside** | the fight's drawing from the bay onward | `blueSide` out of the bay, then four frames over 36 steps (0.6 s) into `blue`, settled as it reaches her line |
| **who has a hangar picture** | — | the caddie, side-on (`HANGAR_ART` in `src/render/port-bake.ts`); the others are null and bake the fight's drawing into every frame |
| **where the pilot drops in** | the fighter's canopy, three units ahead of every ship's centre | each ship's `cockpit`, on its row in `src/content/ships.ts`: the saucer's dome above its rim |

## Why it is built the way it is

**Venoma's run is deleted, and not shortened.** The complaint is about what the ending says, not
how long the run takes. A villain seen running gives the chase no stakes and no captive. The two
guards on her run and their two probes went with it. Their subject is gone, and pointing them at
something else would have kept their names and lost what they meant.

**The time she took goes too.** 0416 moved every beat after her run 186 steps later so she could reach
the ship. With the run gone those 186 steps would be the Viper waiting for nobody. So the beats are
0414's again, and the chase is the same chase, three seconds sooner.

**The hangar picture is the ship's own, and the fallback is the fight's.** 0282: a row says what its
version is, and shared code holds the default. The saucer is the one ship that is drawn from above in
the fight and sits in a side-section hangar. There it reads as a green coin standing on its edge, so
it carries a picture of its own. The fighter was always drawn from above in the hangar, and the cars
are drawn side-on in the fight already. For those three, `HANGAR_ART` is null, and every frame of the
tilt is their fight drawing, so nothing visibly turns. A fifth ship gets its own picture by writing
one row.

**One drawing at every lean.** The saucer is a lens and a dome. `paintSaucer` draws each part as an
outline worked out from how far it leans. A spheroid seen from φ above its rim is an ellipse
`sqrt(sin²φ + cos²φ·h²)` tall. At no lean that is the side view the predecessor drew. At a full lean
it is the disc `drawCaddie` draws, so the last frame hands over to the fight's own picture without a
jump. Five separately drawn frames would have been five chances for the ring to stop matching.

**The tilt is laid frame over frame.** The ship crosses four frames in 36 steps. Each frame is blitted
over the one before at the share of the way between them, so the ship turns smoothly and never steps.
The cost is one extra blit a frame for 0.6 s, which barely touches the
[0025](0025-the-frame-budget-is-counted-not-timed.md) count.

**It tilts once it is out, not in the doorway.** The first build began the tilt 20 steps into the
shot. Photographed, the saucer was lying flat before it had left the bay's light, and a turn made in
the doorway reads as a sprite swap. It now flies a half-second side-on in front of the station's
flank and is over onto the fight's view as it reaches her line.

**The pilot is boarded where each ship is boarded.** The leap went to a point three hangar units
ahead of the centre, which was the fighter's canopy. On a side-on saucer that point is the middle of
the rim, so the pilot would have dived into the hull. Where a pilot boards is a fact about the ship,
so it is on the row beside `wingtip`, which already serves the intro.

## Confirmed, not assumed

| claim | checked by |
|---|---|
| the hangar never draws the fight's picture, the tilt runs in order and skips nothing, and the chase is the fight's picture alone once it is over, for every ship | `tests/intro.test.ts`, *flies the pilot's ship out of the hangar as the hangar sees it*, and `scripts/probes/0444-the-intro-is-the-pilots.mjs` |
| the picture still reads | photographed in the dev build for Feather (side-on on the pad, the leap into the dome, out of the bay side-on, the tilt mid-way, flat in the chase), Larry and Hook |

## What was rejected

- **Keeping Venoma and giving her a captive.** The ask says she adds nothing.
- **A sprite swap at the bay.** A turn needs frames between, or it is a cut.
- **Baking the tilt only for the caddie and branching in the painter on the ship.** That would be a
  mechanism keyed on one instance. The painter draws the same sequence for every ship, and the rows
  decide what it shows.

## Owed

- A play of the intro in all four ships, Feather's above all.
